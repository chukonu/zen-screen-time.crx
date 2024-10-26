import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { DateTime } from 'luxon';
import { formatDuration } from '../helper';
import _ from 'lodash';

export type HourlyActivityDataPoint = {
  startTime: number;
  durationInMinutes: number;
};

@customElement('zen-side-panel')
export class SidePanel extends LitElement {
  static styles = css`
    li.site {
      display: inline-block;
      flex: 1 1 50%;
      margin: 1em 0;
      list-style-type: none;
    }

    ul.breakdown {
      padding: 0;
      display: flex;
      flex-wrap: wrap;
    }

    .total {
      font-size: 2em;
      margin: 0.5em 0;
    }

    .site-time {
      opacity: 0.75;
    }
  `;

  @property()
  today: DateTime = DateTime.now().startOf('day');

  @property()
  records?: { origin: string; startTime: number; duration: number }[];

  @property()
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

        this.totalTime = _(this.records).sumBy((x) => x.duration);

        // not needed:
        // this.requestUpdate();
      },
    );
  }

  render() {
    return html`<div class="total">${formatDuration(this.totalTime)}</div>
      <zen-bar-chart .data=${this.hourlyActivity}></zen-bar-chart>
      <ul class="breakdown">
        ${this.records?.map(
          (record) =>
            html`<li class="site">
              <div>${record.origin.replace(/(http|https):\/\//, '')}</div>
              <div class="site-time">${formatDuration(record.duration)}</div>
            </li>`,
        )}
      </ul>`;
  }
}
