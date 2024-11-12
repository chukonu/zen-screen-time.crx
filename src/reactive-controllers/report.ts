import { ReactiveController, ReactiveControllerHost } from 'lit';
import { combineLatest, merge, Subscription } from 'rxjs';
import _ from 'lodash';
import dateChangeObservable from '../side-panel/date-change';
import { periodic } from '../side-panel/reactive';
import { SECOND } from '../helper';
import { DateInMillis } from '../events';
import { OriginActivity } from '../side-panel/side-panel';
import siteFilterObservable from '../side-panel/site-filter';
import { Report } from '../domain';

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
