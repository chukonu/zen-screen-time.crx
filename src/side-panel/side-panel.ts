import { css, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import _ from 'lodash';
import { interval, merge, Subscription, switchMap, take, tap } from 'rxjs';
import { formatDuration, SECOND } from '../helper';
import { MemoryRouter, RouteConfig, routeTo } from '../router/memory-router';
import * as icons from '../icons';
import { DateInMillis } from '../events';
import { dateChangeSubject } from './date-change';

export type HourlyActivityDataPoint = {
  startTime: number;
  durationInMinutes: number;
};

export type OriginActivity = {
  origin: string;
  startTime: number;
  duration: number;
};

@customElement('zen-router-outlet')
export class ZenRouter extends MemoryRouter {
  routes: RouteConfig[] = [
    {
      path: '/',
      render: () => html`<zen-side-panel-home></zen-side-panel-home>`,
    },
    {
      path: '/more-details',
      render: () => html`<zen-more-details></zen-more-details>`,
    },
  ];
}

@customElement('zen-side-panel')
export class SidePanel extends LitElement {
  render() {
    return html`<zen-router-outlet></zen-router-outlet>`;
  }
}

@customElement('zen-side-panel-home')
export class SidePanelHome extends LitElement {
  static styles = css`
    .total {
      font-size: 2em;
      margin: 0.5em 0;
    }

    .heading {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .footer {
      display: flex;
    }

    .footer .show-more {
      flex: 1 1 auto;
    }
  `;

  @state()
  private _today?: DateInMillis;

  @state()
  private _records?: OriginActivity[];

  @state()
  private _totalTime?: number;

  @state()
  private _hourlyActivity?: HourlyActivityDataPoint[];

  private _dateChangeSubscription: Subscription;

  private get _totalTimeString(): string {
    return this._totalTime ? formatDuration(this._totalTime) : 'No Data';
  }

  connectedCallback() {
    super.connectedCallback();

    const scheduledUpdate = interval(60 * SECOND).pipe(
      switchMap((x) => dateChangeSubject.pipe(take(1))),
    );

    this._dateChangeSubscription = merge(dateChangeSubject, scheduledUpdate)
      .pipe(tap((x) => (this._today = x)))
      .subscribe({
        next: (x) => this._sendDataRequest(x),
        error: (err) => console.error(err),
      });
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    this._dateChangeSubscription.unsubscribe();
  }

  private _sendDataRequest(date: DateInMillis) {
    chrome.runtime.sendMessage(
      { type: 'data_request', payload: { date } },
      (response) => {
        this._records = response;

        this._totalTime = _(this._records).sumBy((x) => x.duration);

        this._hourlyActivity = _(this._records)
          .groupBy((x) => `${x.startTime}`)
          .map((records, key) => ({
            startTime: _.head(records).startTime,
            durationInMinutes: _.sumBy(records, (x) => x.duration) / 60,
          }))
          .value();

        // merge records of the same site
        this._records = _(this._records)
          .groupBy((x) => x.origin)
          .map((records, key) => ({
            origin: _.head(records).origin,
            startTime: date,
            duration: _.sumBy(records, (x) => x.duration),
          }))
          .orderBy(['duration', 'origin'], ['desc', 'asc'])
          .take(8)
          .value();
      },
    );
  }

  openSettings() {
    chrome.tabs
      .create({ url: 'settings.html' })
      .catch((err) => console.error(`Error in opening Settings: ${err}`));
  }

  openMoreDetails() {
    routeTo('/more-details');
  }

  render() {
    return html`<div class="heading">
        <zen-date-control></zen-date-control>

        <zen-svg-icon-button
          .iconPath=${icons.settings}
          @click=${this.openSettings}
        ></zen-svg-icon-button>
      </div>
      <div>
        <div class="total">${this._totalTimeString}</div>
      </div>
      <zen-bar-chart
        .data=${this._hourlyActivity}
        .date=${this._today}
      ></zen-bar-chart>
      <zen-animated-grid .items=${this._records}></zen-animated-grid>
      <div class="footer">
        <zen-default-button class="show-more" @click=${this.openMoreDetails}>
          Show More
        </zen-default-button>
      </div>`;
  }
}
