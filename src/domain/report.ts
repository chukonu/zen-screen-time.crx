import _ from 'lodash';
import Ref from '../ref';
import { BarChartDataPoint } from '../side-panel/bar-chart';
import { OriginActivity } from '../side-panel/side-panel';
import { formatDuration, getHour } from '../helper';

/**
 * Report of activity on one or more websites
 */
export default class Report {
  private _refHourlyActivity: Ref<BarChartDataPoint[]> = new Ref(null);
  private _refDurationBySite: Ref<OriginActivity[]> = new Ref(null);

  constructor(
    public readonly date: number,
    public readonly siteFilter: null | string,
    private readonly _data: OriginActivity[],
  ) {}

  get dataFiltered(): OriginActivity[] {
    return !this.siteFilter
      ? this._data
      : _(this._data)
          .filter((x) => _.eq(x.origin, this.siteFilter))
          .value();
  }

  get duration(): number {
    return _.sumBy(this.dataFiltered, (x) => x.duration);
  }

  get durationText(): string {
    return formatDuration(this.duration);
  }

  /**
   * Data for generating bar charts of activity throughout the day.
   */
  get hourlyActivity(): Ref<BarChartDataPoint[]> {
    this._refHourlyActivity.value = _(this.dataFiltered)
      .groupBy((x) => `${x.startTime}`)
      .map((records, key) => ({
        hour: getHour(_.head(records).startTime),
        durationInMinutes: _.sumBy(records, (x) => x.duration) / 60,
      }))
      .map((x) => [x.hour, x.durationInMinutes] as [number, number])
      .value();
    return this._refHourlyActivity;
  }

  /**
   * How much time is spent on each site of the day.
   */
  get durationBySite(): Ref<OriginActivity[]> {
    this._refDurationBySite.value = _(this._data)
      .groupBy((x) => x.origin)
      .map((records, key) => ({
        origin: _.head(records).origin,
        startTime: this.date,
        duration: _.sumBy(records, (x) => x.duration),
      }))
      .orderBy(['duration', 'origin'], ['desc', 'asc'])
      .value();
    return this._refDurationBySite;
  }
}
