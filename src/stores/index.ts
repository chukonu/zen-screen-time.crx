import { Observable } from 'rxjs';
import { Pulse } from '../Pulse';
import { Limit, NewLimit } from '../domain';

export { default as DbConst } from './db-constants';

export { default as upgradeDb } from './db-upgrade-2393';

export { default as PulseStoreImpl } from './PulseStoreImpl';

export { default as LimitStoreImpl } from './LimitStoreImpl';

export { default as addLimitToStore } from './operators/addLimitToStore';

export interface PulseStore {
  upsertOne(pulse: Pulse): Observable<IDBValidKey>;
  findByDate(date: number): Observable<Pulse[]>;
}

export interface LimitStore {
  findAll(): Observable<Iterable<Limit>>;
  /**
   * Find any limits that satisfy the query.
   */
  findMany(query: Record<string, ComparisonQuery>): Observable<Iterable<Limit>>;
  insertOne(limit: NewLimit): Observable<IDBValidKey>;
}

export type ComparisonQuery = { $lte?: number };
