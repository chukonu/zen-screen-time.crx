import { map, Observable, toArray } from 'rxjs';
import { Pulse } from '../Pulse';
import { transaction, upsertOne, findMany } from '../idbutil';
import openIndexedDb from './openIndexedDb';
import { PulseStore } from '.';
import { plusOneDay } from '../helper';

/**
 * An implementation of the `PulseStore` interface.
 *
 * @see {@link PulseStore}
 */
export default class PulseStoreImpl implements PulseStore {
  constructor(
    private readonly db: string,
    private readonly store: string,
    private readonly indexForUpsertOne: string,
    private readonly indexForFindByDate: string,
  ) {}

  upsertOne(pulse: Pulse): Observable<IDBValidKey> {
    return openIndexedDb(this.db).pipe(
      transaction(this.store),
      upsertOne<Pulse>(
        this.store,
        this.indexForUpsertOne,
        IDBKeyRange.only([pulse.origin, pulse.startTime]),
        (old) =>
          old
            ? { ...old, duration: old.duration + pulse.duration }
            : { ...pulse },
      ),
    );
  }

  findByDate(date: number): Observable<Pulse[]> {
    return openIndexedDb(this.db).pipe(
      transaction(this.store),
      findMany<Pulse>(
        this.store,
        this.indexForFindByDate,
        IDBKeyRange.bound(date, plusOneDay(date), false, true),
      ),
      // `toArray` will emit an empty array if the source observable is empty;
      toArray(),

      // sort array descendingly by duration
      map((x) => x.sort((a, b) => b.duration - a.duration)),
    );
  }
}
