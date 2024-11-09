import { ReactiveController, ReactiveControllerHost } from 'lit';
import { combineLatest, merge, Subscription } from 'rxjs';
import _ from 'lodash';
import { BarChartDataPoint } from '../side-panel/bar-chart';
import dateChangeObservable from '../side-panel/date-change';
import { periodic } from '../side-panel/reactive';
import { formatDuration, getHour, SECOND } from '../helper';
import { DateInMillis } from '../events';
import { OriginActivity } from '../side-panel/side-panel';
import siteFilterObservable from '../side-panel/site-filter';
import Ref from '../ref';

/**
 * Report of activity on one or more websites
 */
export class Report {
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

/**
 * Provides `Report`s on website activity.
 */
export class ReportController implements ReactiveController {
  host: ReactiveControllerHost;
  value?: Report;

  private _subscription?: Subscription;

  constructor(host: ReactiveControllerHost) {
    (this.host = host).addController(this);
  }

  private _sendDataRequest(
    date: DateInMillis,
    callback: (response: OriginActivity[]) => void,
  ): void {
    const message = { type: 'data_request', payload: { date } };
    chrome.runtime.sendMessage(message, (response) =>
      callback(response as OriginActivity[]),
    );
  }

  hostConnected(): void {
    // note: react to changes of the date AND the filter;
    const reportParams = combineLatest([
      dateChangeObservable,
      siteFilterObservable,
    ]);
    this._subscription = merge(
      reportParams,
      periodic(reportParams, 60 * SECOND),
    ).subscribe({
      error: (err) => console.error(err),
      next: (x) => {
        const [date, siteFilter] = x;
        this._sendDataRequest(date, (response) => {
          this.value = new Report(date, siteFilter, response);
          console.debug('new Report', this.value);
          this.host.requestUpdate();
        });
      },
    });
  }

  hostDisconnected(): void {
    this._subscription?.unsubscribe();
    this._subscription = undefined;
  }
}
