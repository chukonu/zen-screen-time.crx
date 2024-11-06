import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { DateTime } from 'luxon';
import * as icons from '../icons';
import { routeBack } from '../router/memory-router';

export type SiteViewProps = { date: number; site: string };

export function renderSiteView(props: SiteViewProps) {
  const date = props?.date;
  const site = props?.site;
  return html`<zen-site-view .date=${date} .site=${site}></zen-site-view>`;
}

@customElement('zen-site-view')
export class SiteView extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
  `;

  @property({ type: Number })
  date?: number;

  @property()
  site?: string;

  private get _dateString(): string {
    return DateTime.fromMillis(this.date).toLocaleString();
  }

  render() {
    return html`<div>
        <zen-svg-icon-button
          .iconPath=${icons.arrowBack}
          @click=${routeBack}
        ></zen-svg-icon-button>
      </div>
      <div>${this._dateString}</div>
      <div>${this.site}</div>`;
  }
}
