import { DateTime, Duration } from 'luxon';

export const formatMillis = (millis: number): string =>
  DateTime.fromMillis(millis).toUTC().toString();

export const startOfHour = (millis: number): number =>
  DateTime.fromMillis(millis).startOf('hour').toMillis();

export const formatDuration = (seconds: number): string =>
  Duration.fromObject({ seconds }).rescale().toHuman({
    unitDisplay: 'narrow',
    listStyle: 'narrow',

    // set type to unit to prevent commas between components
    // overwrite incorrect type
    //@ts-ignore
    type: 'unit',
  });

export const SECOND = 1000;

export const getHour = (millis: number): number =>
  DateTime.fromMillis(millis).hour;

export const today = (): number =>
  DateTime.now().startOf('day').toUTC().toMillis();

export function plusOneDay(date: number) {
  return DateTime.fromMillis(date).plus({ day: 1 }).toUTC().toMillis();
}
