import { DateTime } from 'luxon';


export const formatMillis = (millis: number): string =>
  DateTime.fromMillis(millis).toUTC().toString();
