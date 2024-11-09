import { interval, Observable, switchMap, take } from 'rxjs';

export function periodic<T>(
  source: Observable<T>,
  period: number,
): Observable<T> {
  return interval(period).pipe(switchMap((x) => source.pipe(take(1))));
}
