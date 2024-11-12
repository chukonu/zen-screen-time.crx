import {
  BehaviorSubject,
  concatMap,
  filter,
  interval,
  Observable,
  take,
} from 'rxjs';

/**
 * Compose a hot observable that periodically subscribes to an observable and
 * takes no more than 1 value from that.
 * @param fn a function that returns an observable to periodically subscribe to
 * @param period the length of the interval between two values
 * @returns an observable of the specified type
 */
export function hotPeriodicMono<T>(
  fn: () => Observable<T>,
  period: number = 60 * 1000,
): Observable<T> {
  const subject = new BehaviorSubject<T>(null);
  const observable = subject.asObservable().pipe(
    filter((x) => !!x),
    take(1),
  );
  interval(period)
    .pipe(concatMap((_) => fn()))
    .subscribe(subject);
  return observable;
}
