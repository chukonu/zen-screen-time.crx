import { Observable } from 'rxjs';
import { LimitStore } from '.';
import { Limit } from '../domain';
import openIndexedDb from './openIndexedDb';
import { insertOne, transaction } from '../idbutil';

export default class LimitStoreImpl implements LimitStore {
  private readonly db: Observable<IDBDatabase>;

  constructor(
    private readonly dbName: string,
    private readonly store: string,
  ) {
    this.db = openIndexedDb(this.dbName);
  }

  findAll(): Observable<Iterable<Limit>> {
    throw new Error('Method not implemented.');
  }

  insertOne(limit: Limit): Observable<IDBValidKey> {
    return this.db.pipe(
      transaction(this.store),
      insertOne<Limit>(limit, this.store),
    );
  }
}
