import { css, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { DateTime } from 'luxon';
import { ZenEvents } from '../events';
import * as icons from '../icons';

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
  private _date: DateTime = DateTime.now();

  private get _dateString(): string {
    return this._date.toLocaleString({
      ...DateTime.DATE_SHORT,
      weekday: 'short',
    });
  }

  private get _dateInMillis(): number {
    return this._date.toMillis();
  }

  private _plusDay(day: number = 1) {
    this._date = this._date.plus({ day });

    dispatchEvent(
      new CustomEvent(ZenEvents.NewDate, {
        bubbles: true,
        composed: true,
        detail: this._dateInMillis,
      }),
    );
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
