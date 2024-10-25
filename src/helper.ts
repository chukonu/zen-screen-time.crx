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
