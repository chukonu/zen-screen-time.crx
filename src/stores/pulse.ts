import {
  concatMap,
  defaultIfEmpty,
  last,
  map,
  Observable,
  of,
  scan,
  tap,
} from 'rxjs';
import { Pulse } from '../Pulse';
import { formatMillis } from '../helper';
import { DateTime } from 'luxon';
import upgradeDb from './db-upgrade-2392';
import DbConst from './db-constants';

const DB_VER = 2392;

function openIndexedDb(
  name: string,
  upgradeHandler: (db: IDBDatabase) => void,
): Observable<IDBDatabase> {
  return new Observable((subscriber) => {
    const req = indexedDB.open(name, DB_VER);
    req.onsuccess = function (event) {
      subscriber.next(this.result);
      subscriber.complete();
    };
    req.onerror = function (event) {
      console.error('Error in opening db', event);
      subscriber.error(this.error);
    };
    req.onupgradeneeded = function (event) {
      console.debug('Upgrading DB');
      upgradeHandler(this.result);
    };
  });
}

export class PulseStore {
  #dbName: string;
  #db: IDBDatabase;

  constructor(dbName: string) {
    this.#dbName = dbName;
  }

  /**
   * Query the pulse object store by date.
   * @param date date in milliseconds
   * @returns an observable of a single `Pulse` array, sorted descendingly by duration.
   */
  query(date: number): Observable<Pulse[]> {
    return this.#openCursor(date).pipe(
      scan((arr: Pulse[], pulse) => Array.of(...arr, pulse), []),
      // default to an empty array if the source observable is empty:
      defaultIfEmpty([]),

      // `last` throws error if the source observable is empty:
      last(),

      // sort array descendingly by duration
      map((x) => x.sort((a, b) => b.duration - a.duration)),
    );
  }

  update(pulse: Pulse): Observable<Pulse> {
    const { origin, startTime, duration: increment } = pulse;
    const db$ = this.#openDb();

    const startTransaction = concatMap(
      (db: IDBDatabase): Observable<IDBTransaction> =>
        new Observable((subscriber) => {
          const transaction = db.transaction(
            DbConst.PULSE_STORENAME,
            'readwrite',
          );
          transaction.oncomplete = function (event) {
            console.debug('Transaction completed');
            subscriber.complete();
          };
          transaction.onerror = function (event) {
            subscriber.error(this.error);
          };
          subscriber.next(transaction);
        }),
    );

    const openCursor = (t: IDBTransaction): Observable<IDBCursorWithValue> =>
      new Observable((subscriber) => {
        const req = t
          .objectStore(DbConst.PULSE_STORENAME)
          .index(DbConst.ORIGIN_TIME_IDX)
          .openCursor(IDBKeyRange.only([origin, startTime]));

        req.onsuccess = function (event) {
          const cursor = this.result;
          subscriber.next(cursor);
          subscriber.complete();
        };

        req.onerror = function (event) {
          subscriber.error(this.error);
        };
      });

    const addPulse = (t: IDBTransaction): Observable<Pulse> =>
      new Observable((subscriber) => {
        const req = t.objectStore(DbConst.PULSE_STORENAME).add(pulse);
        req.onsuccess = function (event) {
          const id = this.result;
          subscriber.next({ ...pulse, id });
          subscriber.complete();
        };
        req.onerror = function (event) {
          subscriber.error(this.error);
        };
      });

    const findAndUpdate = (cursor: IDBCursorWithValue): Observable<Pulse> =>
      new Observable((subscriber) => {
        const currentVal = cursor.value;

        console.debug(
          `Value at cursor: {id=${currentVal.id}; origin=${currentVal.origin}; duration=${currentVal.duration}; startTime=${formatMillis(currentVal.startTime)} }`,
        );

        const newVal = {
          ...currentVal,
          duration: currentVal.duration + increment,
        };
        const req = cursor.update(newVal);

        console.debug('Requested to update object at cursor');

        req.onsuccess = function (event) {
          subscriber.next(newVal);
          subscriber.complete();
        };
        req.onerror = function (event) {
          console.error('Update request: ', this.error);
          subscriber.error(this.error);
        };
      });

    return db$.pipe(
      tap(() => console.debug(`Obtained DB`)),

      startTransaction,

      tap(() => console.debug(`Transaction started`)),

      concatMap((transaction) =>
        openCursor(transaction).pipe(
          tap((x) => console.debug(`Cursor opened. Is null: ${!!!x}`)),

          // if cursor is not null, that means there is an existing record.
          // insert a new object if cursor is not present
          concatMap((cursor) =>
            cursor
              ? findAndUpdate(cursor).pipe(
                  tap({
                    subscribe: () =>
                      console.debug('Updating an existing record'),
                  }),
                )
              : addPulse(transaction).pipe(
                  tap({
                    subscribe: () => console.debug('Adding a new record'),
                  }),
                ),
          ),
        ),
      ),
    );
  }

  #openDb(): Observable<IDBDatabase> {
    return this.#db ? of(this.#db) : openIndexedDb(this.#dbName, upgradeDb);
  }

  #newTransaction(): Observable<IDBTransaction> {
    return this.#openDb().pipe(
      concatMap(
        (db: IDBDatabase): Observable<IDBTransaction> =>
          new Observable((subscriber) => {
            const transaction = db.transaction(
              DbConst.PULSE_STORENAME,
              'readonly',
            );
            transaction.oncomplete = function (event) {
              console.debug('Transaction completed');
              subscriber.complete();
            };
            transaction.onerror = function (event) {
              subscriber.error(this.error);
            };
            subscriber.next(transaction);
            console.debug('Transaction started');
          }),
      ),
    );
  }

  #openCursor(date: number): Observable<Pulse> {
    return this.#newTransaction().pipe(
      concatMap(
        (t: IDBTransaction): Observable<Pulse> =>
          new Observable((subscriber) => {
            const req = t
              .objectStore(DbConst.PULSE_STORENAME)
              .index(DbConst.TIME_IDX)
              .openCursor(
                IDBKeyRange.bound(date, plusOneDay(date), false, true),
              );
            req.onsuccess = function (event) {
              const cursor = this.result;
              if (cursor) {
                subscriber.next(cursor.value as Pulse);
                cursor.continue();
              } else {
                subscriber.complete();
              }
            };
            req.onerror = function (event) {
              // subscriber.error(this.error);
              subscriber.complete();
            };
          }),
      ),
    );
  }
}

function plusOneDay(date: number) {
  return DateTime.fromMillis(date).plus({ day: 1 }).toUTC().toMillis();
}
