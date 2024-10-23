import { concatMap, Observable, of, switchMap, tap } from 'rxjs';
import { Pulse } from '../Pulse';
import { formatMillis } from '../helper';

interface ObjectStore<T> {
  add(object: T): Observable<T>;
}

const DB_VER = 1;
const PULSE_STORENAME = 'pulses';
const ORIGIN_TIME_IDX = 'origin_time';
const ORIGIN_IDX = 'origin';

function openIndexedDb(name: string, upgradeHandler: (db: IDBDatabase) => void): Observable<IDBDatabase> {
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

function createPulseStore(db: IDBDatabase) {
  const store = db.createObjectStore(PULSE_STORENAME, { keyPath: 'id', autoIncrement: true });
  store.createIndex(ORIGIN_TIME_IDX, ['origin', 'startTime'], { unique: true });
  store.createIndex(ORIGIN_IDX, 'origin', { unique: false });
}

export class PulseStore implements ObjectStore<Pulse> {
  #dbName: string;
  #db: IDBDatabase;

  constructor(dbName: string) {
    this.#dbName = dbName;
  }

  add(pulse: Pulse): Observable<Pulse> {
    return this.#openDb().pipe(
      tap(db => this.#db = db),
      switchMap<IDBDatabase, Observable<Pulse>>(db => new Observable((subscriber) => {
        const transaction = db.transaction(PULSE_STORENAME, 'readwrite');
        transaction.oncomplete = function (event) {
          console.log('transaction completed');
          subscriber.next(pulse);
          subscriber.complete();
        };
        transaction.onerror = function (event) {
          console.error('transaction error', event);
          subscriber.error(event.target);
        };
        const store = transaction.objectStore(PULSE_STORENAME);
        store.add(pulse);
      }))
    );
  }

  update(pulse: Pulse): Observable<Pulse> {
    const { origin, startTime, duration: increment } = pulse;
    const db$ = this.#openDb();

    const startTransaction = concatMap((db: IDBDatabase): Observable<IDBTransaction> =>
      new Observable(subscriber => {
        const transaction = db.transaction(PULSE_STORENAME, 'readwrite');
        transaction.oncomplete = function (event) {
          console.debug('Transaction completed');
          subscriber.complete();
        };
        transaction.onerror = function (event) {
          subscriber.error(this.error);
        };
        subscriber.next(transaction);
      }));

    const openCursor = (t: IDBTransaction): Observable<IDBCursorWithValue> =>
      new Observable(subscriber => {
        const req = t.objectStore(PULSE_STORENAME)
          .index(ORIGIN_TIME_IDX)
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
      new Observable(subscriber => {
        const req = t.objectStore(PULSE_STORENAME).add(pulse);
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
      new Observable(subscriber => {
        const currentVal = cursor.value;

        console.debug(`Value at cursor: {id=${currentVal.id}; origin=${currentVal.origin}; duration=${currentVal.duration}; startTime=${formatMillis(currentVal.startTime)} }`);

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

      concatMap(transaction => openCursor(transaction).pipe(
        tap(x => console.debug(`Cursor opened. Is null: ${!!!x}`)),

        // if cursor is not null, that means there is an existing record.
        // insert a new object if cursor is not present
        concatMap(cursor => cursor
          ? findAndUpdate(cursor)
            .pipe(tap({ subscribe: () => console.debug('Updating an existing record') }))
          : addPulse(transaction)
            .pipe(tap({ subscribe: () => console.debug('Adding a new record') }))
        ),
      )),
    );
  }

  #openDb(): Observable<IDBDatabase> {
    return this.#db ? of(this.#db) : openIndexedDb(this.#dbName, createPulseStore);
  }
}
