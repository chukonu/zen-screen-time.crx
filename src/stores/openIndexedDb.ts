import { Observable, tap } from 'rxjs';
import DbConst from './db-constants';
import { upgradeDb } from '.';

function _openIDB(
  name: string,
  version: number,
  onUpgrade: (db: IDBDatabase) => void,
): Observable<IDBDatabase> {
  return new Observable<IDBDatabase>((subscriber) => {
    const req = indexedDB.open(name, version);
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
      onUpgrade(this.result);
    };
  });
}

/**
 * Open an IndexedDB and cache the DB connection per Observable.
 * @param name database name
 * @returns an Observable that emits once an `IDBDatabase`.
 */
export default function openIndexedDb(name: string): Observable<IDBDatabase> {
  let _db: IDBDatabase;
  return new Observable((subscriber) => {
    if (_db) {
      subscriber.next(_db);
      subscriber.complete();
      return;
    }
    _openIDB(name, DbConst.DB_VER, upgradeDb)
      .pipe(tap((db) => (_db = db)))
      .subscribe(subscriber);
  });
}
