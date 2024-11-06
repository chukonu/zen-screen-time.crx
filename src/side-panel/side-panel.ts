import { css, html, LitElement, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import _ from 'lodash';
import { interval, merge, Subscription, switchMap, take, tap } from 'rxjs';
import { formatDuration, SECOND } from '../helper';
import { MemoryRouter, RouteConfig, routeTo } from '../router/memory-router';
import * as icons from '../icons';
import { DateInMillis } from '../events';
import { dateChangeSubject } from './date-change';
import { numberOfItems, updateNumberOfItems } from './number-of-items';
import { when } from 'lit/directives/when.js';
import { renderSiteView, SiteViewProps } from './site-activity';
import { SidePanelRoutes } from './side-panel-routes';

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
      path: SidePanelRoutes.Home,
      render: () => html`<zen-side-panel-home></zen-side-panel-home>`,
    },
    {
      path: SidePanelRoutes.SiteView,
      render: (props: any) => renderSiteView(props as SiteViewProps),
    },
  ];
}

@customElement('zen-side-panel')
export class SidePanel extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
  `;

  render() {
    return html`<zen-router-outlet></zen-router-outlet>`;
  }
}

@customElement('zen-side-panel-home')
export class SidePanelHome extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

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

  /**
   * The number of items to display.
   */
  @state()
  private _numberOfItems?: number;

  private _dateChangeSubscription?: Subscription;

  private _numberOfItemsSubscription?: Subscription;

  private get _totalTimeString(): string {
    return this._totalTime ? formatDuration(this._totalTime) : 'No Data';
  }

  private get _shouldShowShowMore(): boolean {
    return this._records?.length > this._numberOfItems;
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

    this._numberOfItemsSubscription = numberOfItems().subscribe({
      next: (x) => {
        this._numberOfItems = x;
        // requestAnimationFrame(() => {
        // });
      },
      error: (err) => console.error(err),
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    this._dateChangeSubscription?.unsubscribe();

    this._numberOfItemsSubscription?.unsubscribe();
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
          .value();
      },
    );
  }

  openSettings() {
    chrome.tabs
      .create({ url: 'settings.html' })
      .catch((err) => console.error(`Error in opening Settings: ${err}`));
  }

  private _openSite(event: Event) {
    // site information is stored as a data attribute on a LI element
    const composedPath = event.composedPath();
    const li = _(composedPath).find((x) => x instanceof HTMLLIElement);
    const site = li.dataset.key;
    const props: SiteViewProps = { site, date: this._today };
    routeTo(SidePanelRoutes.SiteView, props);
  }

  private _showMore() {
    updateNumberOfItems(this._numberOfItems + 4);
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
      <zen-animated-grid
        .items=${this._records}
        .max=${this._numberOfItems}
        .date=${this._today}
        @click=${(event: Event) => this._openSite(event)}
      ></zen-animated-grid>
      <div class="footer">
        ${when(
          this._shouldShowShowMore,
          () =>
            html`<zen-default-button
              class="show-more"
              @click=${() => this._showMore()}
            >
              Show More
            </zen-default-button>`,
          () => nothing,
        )}
      </div>`;
  }
}
