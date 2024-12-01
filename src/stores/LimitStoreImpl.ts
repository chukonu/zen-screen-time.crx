import { Observable, toArray } from 'rxjs';
import { ComparisonQuery, LimitStore } from '.';
import { Limit, NewLimit } from '../domain';
import { findMany, insertOne, transaction } from '../idbutil';
import openIndexedDb from './openIndexedDb';

export default class LimitStoreImpl implements LimitStore {
  private readonly db: Observable<IDBDatabase>;

  constructor(
    private readonly dbName: string,
    private readonly storeName: string,
  ) {
    this.db = openIndexedDb(this.dbName);
  }

  findAll(): Observable<Iterable<Limit>> {
    return this.db.pipe(
      transaction(this.storeName),
      findMany(this.storeName, null, null),
      toArray<Limit>(),
    );
  }

  findMany(
    query: Record<string, ComparisonQuery>,
  ): Observable<Iterable<Limit>> {
    throw new Error('Method not implemented.');
  }

  insertOne(limit: NewLimit): Observable<IDBValidKey> {
    return this.db.pipe(
      transaction(this.storeName),
      insertOne<Limit>(enrich(limit), this.storeName),
    );
  }
}

function enrich(limit: NewLimit): Limit {
  const t = Date.now();
  return Object.assign({ created: t, updated: t }, limit);
}
