import { css, html, LitElement, nothing, PropertyValues } from 'lit';
import { customElement, property, queryAll } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { formatDuration } from '../helper';
import { OriginActivity } from './side-panel';
import { buttonDefaultStyles } from '../button/default-button';

function faviconUrl(pageUrl: string): string {
  const url = new URL(chrome.runtime.getURL('/_favicon/'));
  url.searchParams.set('pageUrl', pageUrl);
  url.searchParams.set('size', '32');
  return url.toString();
}

function stripProtocol(origin: string): string {
  return origin.replace(/(http|https):\/\//, '');
}

function fadeIn(x: HTMLElement) {
  requestAnimationFrame(() => {
    x.style.transition = '';
    x.style.opacity = '0';

    requestAnimationFrame(() => {
      x.style.transition = 'opacity 500ms ease-in';
      x.style.opacity = '1';
    });
  });
}

function slide(x: HTMLElement, dx: number, dy: number) {
  requestAnimationFrame(() => {
    x.style.transform = `translate(${dx}px, ${dy}px)`;
    x.style.transition = 'transform 0s';

    requestAnimationFrame(() => {
      x.style.transform = '';
      x.style.transition = 'transform 700ms ease-in-out';
    });
  });
}

@customElement('zen-animated-grid')
export class AnimatedGrid extends LitElement {
  static styles = [
    buttonDefaultStyles,
    css`
      ul.breakdown {
        padding: 0;
        display: flex;
        flex-wrap: wrap;
      }

      ul.breakdown li {
        list-style-type: none;
      }

      li.site {
        display: block;
        flex: 1 1 50%;

        box-sizing: border-box;
        margin: 2px 0;
        border-radius: 4px;
        width: 50%;
      }

      .site .site-link {
        align-items: center;
        display: flex;
        padding: 8px;
        width: 100%;
      }

      .site-link .site-info {
        overflow: hidden;
      }

      .site:hover {
        background-color: var(--zen-hover-background-color);
      }

      .site .favicon {
        margin-right: 10px;
        display: flex;
        align-items: center;
      }

      .favicon img {
        width: 20px;
        height: 20px;
      }

      .site-time {
        color: var(--zen-secondary-text-color);
      }

      .site-name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    `,
  ];

  @property({ type: Array })
  items?: OriginActivity[];

  @queryAll('li.site')
  renderedItems?: NodeListOf<HTMLLIElement>;

  private _rectMap?: Map<string, DOMRect>;

  protected willUpdate(_changedProperties: PropertyValues): void {
    console.debug('[zen-animated-grid]', 'will update');
    this._rectMap = new Map();

    const length = this.renderedItems?.length;
    if (length) {
      Array.from(this.renderedItems).forEach((x) => {
        this._rectMap.set(x.dataset.key, x.getBoundingClientRect());
      });
    }
  }

  protected firstUpdated(_changedProperties: PropertyValues): void {
    const length = this.renderedItems?.length;
    console.debug(`rendered items when first updated: ${length}`);
  }

  protected updated(_changedProperties: PropertyValues): void {
    console.debug('[zen-animated-grid]', 'updated');
    const length = this.renderedItems?.length;

    if (length) {
      console.debug('[zen-animated-grid]', 'items are rendered');
      // animate grid items following the FLIP pattern
      Array.from(this.renderedItems).forEach((x) => {
        const key = x.dataset.key;
        const rect = x.getBoundingClientRect();
        const oldRect = this._rectMap?.get(key);

        if (!oldRect) {
          console.debug('[zen-animated-grid]', 'first render; no animation.');
        } else {
          const dx = oldRect.left - rect.left;
          const dy = oldRect.top - rect.top;
          // console.debug('[zen-animated-grid]', dx, dy);

          if (dx || dy) {
            slide(x, dx, dy);
          }
        }
      });
    }
  }

  render() {
    if (!this.items?.length) {
      return nothing;
    }
    return html`
      <ul class="breakdown">
        ${repeat(
          this.items,
          (x) => x.origin,
          (x) =>
            html`<li class="site" data-key=${x.origin}>
              <button class="site-link">
                <div class="favicon">
                  <img src=${faviconUrl(x.origin)} />
                </div>
                <div class="site-info">
                  <div class="site-name">${stripProtocol(x.origin)}</div>
                  <div class="site-time">${formatDuration(x.duration)}</div>
                </div>
              </button>
            </li>`,
        )}
      </ul>
    `;
  }
}
