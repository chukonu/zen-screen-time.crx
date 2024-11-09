import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ReportController } from '../reactive-controllers/report';

@customElement('zen-report-widget')
export class ReportWidget extends LitElement {
  private readonly _reportController = new ReportController(this);

  static styles = css`
    :host {
      display: block;
      padding: var(--zen-padding);
    }

    .duration {
      font-size: 2em;
      line-height: 1em;
      margin: 8px 0 2px 0;
      min-height: 1em;
      box-sizing: content-box;
    }
  `;

  render() {
    return html`<div class="duration">
        ${this._reportController.value?.durationText}
      </div>
      <zen-bar-chart
        .data=${this._reportController.value?.hourlyActivity}
        .date=${this._reportController.value?.date}
      ></zen-bar-chart>`;
  }
}
