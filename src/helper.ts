import { DateTime } from 'luxon';

export const formatMillis = (millis: number): string =>
  DateTime.fromMillis(millis).toUTC().toString();

export const roundToHour = (millis: number): number => {
  const original = DateTime.fromMillis(millis).toObject();

  const hour = DateTime.fromObject({
    ...original,
    minute: 0,
    second: 0,
    millisecond: 0,
  });

  return hour.toUTC().toMillis();
};

export const SECOND = 1000;
