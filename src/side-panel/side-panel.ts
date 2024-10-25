import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { DateTime } from 'luxon';
import { formatDuration } from '../helper';
import _ from 'lodash';

@customElement('zen-side-panel')
export class SidePanel extends LitElement {
  @property()
  today: DateTime = DateTime.now().startOf('day');

  @property()
  records?: { origin: string; startTime: number; duration: number }[];

  @property()
  totalTime?: number;

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
    return html`<p>${this.today.toLocaleString(DateTime.DATE_MED)}</p>
      <p>${this.today.toMillis()}</p>
      <p>${this.today.toUTC().toMillis()}</p>
      <p>${this.today.zoneName}</p>
      <h2>${formatDuration(this.totalTime)}</h2>
      <ul>
        ${this.records?.map(
          (record) =>
            html`<li>
              ${record.origin.replace(/(http|https):\/\//, '')}
              (${formatDuration(record.duration)})
            </li>`,
        )}
      </ul>`;
  }
}
