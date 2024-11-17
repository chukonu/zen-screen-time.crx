import { css, html, LitElement, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import _ from 'lodash';
import { Subscription } from 'rxjs';
import { formatDuration } from '../helper';
import { MemoryRouter, RouteConfig, routeTo } from '../router/memory-router';
import * as icons from '../icons';
import { DateInMillis } from '../events';
import { numberOfItems, updateNumberOfItems } from './number-of-items';
import { when } from 'lit/directives/when.js';
import { renderSiteView, SiteViewProps } from './site-activity';
import { SidePanelRoutes } from './side-panel-routes';
import { ReportController } from '../reactive-controllers/report';
import { updateSiteFilter } from './site-filter';

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

const numberOfItemsObservable = numberOfItems();

@customElement('zen-side-panel-home')
export class SidePanelHome extends LitElement {
  static styles = css`
    :host {
      display: block;
      margin: 8px;
    }

    .total {
      font-size: 2em;
      line-height: 1em;
      margin: 8px 0 2px 0;
      min-height: 1em;
      box-sizing: content-box;
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
  private _totalTime?: number;

  /**
   * The number of items to display.
   */
  @state()
  private _numberOfItems?: number;

  private _numberOfItemsSubscription?: Subscription;

  private get _totalTimeString(): string {
    if (_.isUndefined(this._totalTime)) {
      return '';
    }
    return this._totalTime ? formatDuration(this._totalTime) : 'No Data';
  }

  private get _shouldShowShowMore(): boolean {
    return (
      this._reportController.value?.durationBySite.value?.length >
      this._numberOfItems
    );
  }

  private readonly _reportController = new ReportController(this);

  connectedCallback() {
    super.connectedCallback();

    // always reset site filter, which may be changed when entering a site view;
    updateSiteFilter(null);

    this._numberOfItemsSubscription = numberOfItemsObservable.subscribe({
      next: (x) => {
        this._numberOfItems = x;
      },
      error: (err) => console.error(err),
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    this._numberOfItemsSubscription?.unsubscribe();
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
    const site = li?.dataset.key;
    if (!site) {
      return;
    }
    updateSiteFilter(site);
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
        <div class="total">
          ${this._reportController.value?.durationText || 'No Data'}
        </div>
      </div>
      <zen-bar-chart
        .data=${this._reportController.value?.hourlyActivity}
        .date=${this._reportController.value?.date}
      ></zen-bar-chart>
      <zen-animated-grid
        .items=${this._reportController.value?.durationBySite}
        .date=${this._reportController.value?.date}
        .max=${this._numberOfItems}
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
