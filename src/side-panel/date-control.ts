import { css, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { DateTime } from 'luxon';
import { DateInMillis, ZenEvents } from '../events';
import * as icons from '../icons';
import { Subscription } from 'rxjs';
import { dateChangeSubject } from './date-change';

@customElement('zen-date-control')
export class DateControl extends LitElement {
  static styles = css`
    :host {
      display: flex;
      align-items: center;
    }

    .current-date {
      margin-right: 10px;
    }
  `;

  @state()
  private _date?: DateTime;

  private get _dateString(): string {
    return this._date.toLocaleString({
      ...DateTime.DATE_SHORT,
      weekday: 'short',
    });
  }

  private get _dateInMillis(): DateInMillis {
    return this._date.toMillis();
  }

  private _dateChangeSubscription?: Subscription;

  private _plusDay(day: number = 1) {
    this._date = this._date.plus({ day });

    dispatchEvent(
      new CustomEvent(ZenEvents.NewDate, {
        detail: this._dateInMillis,
      }),
    );
  }

  connectedCallback() {
    super.connectedCallback();

    this._dateChangeSubscription = dateChangeSubject.subscribe({
      next: (x) => (this._date = DateTime.fromMillis(x)),
      error: (err) => console.debug(this.tagName, err),
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    this._dateChangeSubscription?.unsubscribe();
  }

  render() {
    return html`
      <div class="current-date">${this._dateString}</div>
      <zen-svg-icon-button
        .iconPath=${icons.backward}
        @click=${() => this._plusDay(-1)}
      ></zen-svg-icon-button>
      <zen-svg-icon-button
        .iconPath=${icons.forward}
        @click=${() => this._plusDay()}
      ></zen-svg-icon-button>
    `;
  }
}
