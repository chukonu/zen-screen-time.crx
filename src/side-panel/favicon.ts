import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

function faviconUrl(pageUrl: string): string {
  const url = new URL(chrome.runtime.getURL('/_favicon/'));
  url.searchParams.set('pageUrl', pageUrl);
  url.searchParams.set('size', '32');
  return url.toString();
}

@customElement('zen-favicon')
export class Favicon extends LitElement {
  @property()
  url: string;

  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
    }

    img {
      width: 20px;
      height: 20px;
    }
  `;

  render() {
    return html`<img src=${faviconUrl(this.url)} />`;
  }
}
