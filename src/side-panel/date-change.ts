import { BehaviorSubject } from 'rxjs';
import { DateInMillis, NewDateEvent, ZenEvents } from '../events';
import { DateTime } from 'luxon';

export const dateChangeSubject: BehaviorSubject<DateInMillis> =
  new BehaviorSubject(DateTime.now().startOf('day').toMillis());

addEventListener(ZenEvents.NewDate, (event: NewDateEvent) => {
  dateChangeSubject.next(event.detail);
});
