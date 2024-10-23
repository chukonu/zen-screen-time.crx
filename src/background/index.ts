import { DateTime } from 'luxon';
import { concatMap, delay, map, Observable, of, repeat, scan, Subject, switchMap, take, tap } from 'rxjs';

import { PulseStore } from '../stores/pulse';
import { Pmap, Pulse } from '../Pulse';
import { formatMillis } from '../helper';

const DB_NAME = 'zen';
const SECOND = 1000;

const pulseStore = new PulseStore(DB_NAME);

const updatePulse = concatMap<Pulse, Observable<Pulse>>(pulse => pulseStore.update(pulse));

const subject = new Subject<{ origin: string; startTime: number; duration: number; }>();

const groupPulses = (pmap: Pmap, pulse: Pulse): Pmap => {
  const { origin, startTime, duration } = pulse;

  // make sure to return a new instance
  const p = new Map(pmap.entries());

  if (!p.has(origin)) {
    p.set(origin, new Map());
  }

  const inner = p.get(origin);
  const current = inner.get(startTime) ?? 0;
  inner.set(startTime, current + duration);

  return p;
};

const roundToHour = (millis: number): number => {
  const original = DateTime.fromMillis(millis).toObject();

  const hour = DateTime.fromObject({
    ...original,
    minute: 0,
    second: 0,
    millisecond: 0,
  });

  return hour.toUTC().toMillis();
};

subject
  .pipe(
    // round up to hour
    map(x => ({ ...x, startTime: roundToHour(x.startTime) })),

    // tap({ subscribe: () => console.log('Subscribed') }),

    // rate limiting, group pulses as a map
    scan(groupPulses, new Map()),
    switchMap<Pmap, Observable<Pmap>>(x => of(x).pipe(delay(10 * SECOND))),

    // complete and re-subscribe, resetting the map
    take(1),
    repeat(),

    // decompose it into Pulses
    concatMap<Pmap, Observable<Pulse>>(x => new Observable(subscriber => {
      for (const [origin, xx] of x.entries()) {
        for (const [startTime, duration] of xx.entries()) {
          subscriber.next({ origin, startTime, duration });
        }
      }
      subscriber.complete();
    })),

    tap({
      next: x => console.debug(`Pulse to update: {origin=${x.origin}; duration=${x.duration}; startTime=${formatMillis(x.startTime)} }`),
      error: err => console.error(`Error after decomposing but before updating: `, err),
    }),

    updatePulse,

    tap({
      next: x => console.debug(`Pulse updated successfully: {id=${x.id}; origin=${x.origin}; duration=${x.duration}; startTime=${formatMillis(x.startTime)} }`),
    }),
  )
  .subscribe({
    error: err => console.error('Error happened: ', err),
  });

chrome.runtime.onMessage
  .addListener((message, sender, sendResponse) => subject.next(message));
