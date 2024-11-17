import {
  tap,
  map,
  concatMap,
  delayWhen,
  interval,
  Observable,
  of,
  repeat,
  scan,
  switchMap,
  take,
} from 'rxjs';
import { MessageType, ResponseDataOf, ZMessage } from '../domain';
import { Pmap, Pulse } from '../Pulse';
import { zMessageOperator } from './messaging';
import { startOfHour, SECOND, formatMillis } from '../helper';
import { pulseStore } from '.';

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

class PulseService {
  @zMessageOperator(MessageType.DataRequest)
  static activityByOrigin(
    source: Observable<ZMessage<MessageType.DataRequest>>,
  ): Observable<ResponseDataOf<MessageType.DataRequest>> {
    return source.pipe(
      concatMap((msg) => pulseStore.findByDate(msg.payload.date)),
    );
  }

  @zMessageOperator(MessageType.Pulse, { acknowledge: true })
  static upsertPulseToStore(
    source: Observable<ZMessage<MessageType.Pulse>>,
  ): Observable<ResponseDataOf<MessageType.Pulse>> {
    return source.pipe(
      map((x) => x.payload),

      // round to the start of the hour because we only need that much granularity
      map(
        (x: Pulse): Pulse => ({
          ...x,
          startTime: startOfHour(x.startTime),
        }),
      ),

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
      concatMap((p) =>
        pulseStore
          .upsertOne(p)
          .pipe(
            tap((id) =>
              console.debug(
                `Pulse updated successfully: {id=${id}; origin=${p.origin}; duration increment=${p.duration}; startTime=${formatMillis(p.startTime)} }`,
              ),
            ),
          ),
      ),
    );
  }
}
