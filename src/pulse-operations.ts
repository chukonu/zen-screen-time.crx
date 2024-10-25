import {
  concatMap,
  delayWhen,
  interval,
  map,
  Observable,
  of,
  repeat,
  scan,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { Pmap, Pulse } from './Pulse';
import { formatMillis, startOfHour, SECOND } from './helper';
import { PulseStore } from './stores/pulse';
import _ from 'lodash';

const accumulatePulses = (pmap: Pmap, pulse: Pulse): Pmap => {
  const { origin, startTime, duration } = pulse;

  // make sure to return a new instance
  const _pmap = new Map(pmap.entries());

  if (!_pmap.has(origin)) {
    _pmap.set(origin, new Map());
  }

  const inner = _pmap.get(origin);
  const current = inner.get(startTime) ?? 0;
  inner.set(startTime, current + duration);

  return _pmap;
};

const decomposePmapToPulses = (x: Pmap): Observable<Pulse> =>
  new Observable((subscriber) => {
    for (const [origin, xx] of x.entries()) {
      for (const [startTime, duration] of xx.entries()) {
        subscriber.next({ origin, startTime, duration });
      }
    }
    subscriber.complete();
  });

export const receiveAndStorePulses = (
  pulseMessages: Observable<Pulse>,
  store: PulseStore,
): Observable<Pulse> =>
  pulseMessages.pipe(
    // round to the start of the hour because we only need that much granularity
    map((x: Pulse): Pulse => ({ ...x, startTime: startOfHour(x.startTime) })),

    // rate limiting, group pulses as a map
    scan(accumulatePulses, new Map()),
    switchMap(
      (x: Pmap): Observable<Pmap> =>
        of(x).pipe(
          // delay stochastically to give it a chance to write to DB early
          delayWhen(() => interval(Math.random() * (10 * SECOND))),
        ),
    ),

    // complete and re-subscribe, resetting the map
    take(1),
    repeat(),

    // decompose it into Pulses
    concatMap(decomposePmapToPulses),

    tap({
      next: (x) =>
        console.debug(
          `Pulse to update: {origin=${x.origin}; duration=${x.duration}; startTime=${formatMillis(x.startTime)} }`,
        ),
      error: (err) =>
        console.error(`Error after decomposing but before updating: `, err),
    }),

    // update or add pulse
    concatMap((p: Pulse): Observable<Pulse> => store.update(p)),

    tap({
      next: (x) =>
        console.debug(
          `Pulse updated successfully: {id=${x.id}; origin=${x.origin}; duration=${x.duration}; startTime=${formatMillis(x.startTime)} }`,
        ),
    }),
  );
