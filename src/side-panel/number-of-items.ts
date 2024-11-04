import { BehaviorSubject, Observable } from 'rxjs';
import { ZenEvents } from '../events';

export function numberOfItems(initial: number = 8): Observable<number> {
  const behaviorSubject = new BehaviorSubject(initial);
  addEventListener(ZenEvents.NewNumberOfItems, (event: CustomEvent<number>) => {
    behaviorSubject.next(event.detail);
  });
  return behaviorSubject;
}

export function updateNumberOfItems(n: number) {
  dispatchEvent(new CustomEvent(ZenEvents.NewNumberOfItems, { detail: n }));
}

// type Updater<T> = (value: T) => void;
// function useObservable<T>(identifier: string, detail: T): [Observable<T>, Updater<T>] {
//   return [];
// }
