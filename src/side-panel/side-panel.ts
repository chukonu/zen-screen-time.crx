import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import _ from 'lodash';
import { DateTime } from 'luxon';
import { formatDuration } from '../helper';
import { MemoryRouter, RouteConfig, routeTo } from '../router/memory-router';
import settingsIconPath from '../icons_svg/settings.fragment.svg';
import forwardIconPath from '../icons_svg/forward.fragment.svg';
import backwardIconPath from '../icons_svg/backward.fragment.svg';

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
      justify-items: flex-start;
      align-items: center;
    }

    .footer {
      display: flex;
    }

    .spacer {
      flex: 1 1 100%;
    }

    .current-date {
      margin-right: 10px;
    }

    .footer .show-more {
      flex: 1 1 auto;
    }
  `;

  @property({ attribute: false })
  today: DateTime = DateTime.now().startOf('day');

  @property({ type: Array })
  records?: OriginActivity[];

  @property({ type: Number })
  totalTime?: number;

  @state()
  private hourlyActivity?: HourlyActivityDataPoint[];

  #intervalId: ReturnType<typeof setTimeout>;

  connectedCallback() {
    super.connectedCallback();

    this.#sendDataRequest();
    this.#intervalId = setInterval(() => this.#sendDataRequest(), 60 * 1000);
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    clearInterval(this.#intervalId);
  }

  #sendDataRequest() {
    chrome.runtime.sendMessage(
      { type: 'data_request', payload: { date: this.today.toMillis() } },
      (response) => {
        this.records = response;

        this.totalTime = _(this.records).sumBy((x) => x.duration);

        this.hourlyActivity = _(this.records)
          .groupBy((x) => `${x.startTime}`)
          .map((records, key) => ({
            startTime: _.head(records).startTime,
            durationInMinutes: _.sumBy(records, (x) => x.duration) / 60,
          }))
          .value();

        // merge records of the same site
        this.records = _(this.records)
          .groupBy((x) => x.origin)
          .map((records, key) => ({
            origin: _.head(records).origin,
            startTime: this.today.toMillis(),
            duration: _.sumBy(records, (x) => x.duration),
          }))
          .orderBy(['duration', 'origin'], ['desc', 'asc'])
          .take(8)
          .value();

        // not needed:
        // this.requestUpdate();
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
        <div class="current-date">Today</div>
        <zen-svg-icon-button
          .iconPath=${backwardIconPath}
        ></zen-svg-icon-button>
        <zen-svg-icon-button .iconPath=${forwardIconPath}></zen-svg-icon-button>

        <div class="spacer"></div>

        <zen-svg-icon-button
          .iconPath=${settingsIconPath}
          @click=${this.openSettings}
        ></zen-svg-icon-button>
      </div>
      <div>
        <div class="total">${formatDuration(this.totalTime)}</div>
      </div>
      <zen-bar-chart .data=${this.hourlyActivity}></zen-bar-chart>
      <zen-animated-grid .items=${this.records}></zen-animated-grid>
      <div class="footer">
        <zen-default-button class="show-more" @click=${this.openMoreDetails}>
          Show More
        </zen-default-button>
      </div>`;
  }
}
