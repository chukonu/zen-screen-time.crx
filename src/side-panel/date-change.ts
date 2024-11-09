import { BehaviorSubject } from 'rxjs';
import { DateInMillis, NewDateEvent, ZenEvents } from '../events';
import { DateTime } from 'luxon';

const dateChangeSubject: BehaviorSubject<DateInMillis> = new BehaviorSubject(
  DateTime.now().startOf('day').toMillis(),
);

addEventListener(ZenEvents.NewDate, (event: NewDateEvent) => {
  dateChangeSubject.next(event.detail);
});

export const dateChangeObservable = dateChangeSubject.asObservable();

export default dateChangeObservable;
