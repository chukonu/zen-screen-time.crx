import { Observable } from 'rxjs';
import { Pulse } from '../Pulse';

export { default as upgradeDb } from './db-upgrade-2393';

export { default as PulseStoreImpl } from './PulseStoreImpl';

export interface PulseStore {
  upsertOne(pulse: Pulse): Observable<IDBValidKey>;
  findByDate(date: number): Observable<Pulse[]>;
}
