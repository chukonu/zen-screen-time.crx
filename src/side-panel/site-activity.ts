import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import * as icons from '../icons';
import { routeBack } from '../router/memory-router';
import { Task } from '@lit/task';
import { sendMessage } from '..';
import { MessageType } from '../domain';
import { repeat } from 'lit/directives/repeat.js';

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

    .header {
      display: flex;
      align-items: center;
      padding: 8px;
      border-bottom: var(--zen-border-width) solid var(--zen-border-color);
    }

    .header-title {
      margin-left: 8px;
      font-size: 1.07em;
      font-weight: 500;
    }

    zen-favicon {
      margin-left: 16px;
    }
  `;

  @property({ type: Number })
  date?: number;

  @property()
  site?: string;

  private _limitsForSite = new Task(
    this,
    ([site]) => sendMessage(MessageType.FindLimitsForSite, { site }),
    () => [this.site],
  );

  private _renderLimitsForSite() {
    return this._limitsForSite.render({
      pending: () => nothing,
      complete: (xs) =>
        html`<ul>
          ${repeat(
            xs,
            (x) => x,
            (x, i) => html`<li>${x}</li>`,
          )}
        </ul>`,
      error: (err: Error) => html`<p>error: ${err.message}</p>`,
    });
  }

  render() {
    return html`<div class="header">
        <zen-svg-icon-button
          .iconPath=${icons.arrowBack}
          @click=${routeBack}
        ></zen-svg-icon-button>
        <zen-favicon .url=${this.site}></zen-favicon>
        <div class="header-title">${this.site}</div>
      </div>
      <div><zen-report-widget></zen-report-widget></div>
      <div>${this._renderLimitsForSite()}</div>
      <div><zen-default-button>Add Limit</zen-default-button></div>`;
  }
}
