import { css, html, LitElement, nothing, PropertyValues } from 'lit';
import { customElement, property, queryAll } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { formatDuration } from '../helper';
import { OriginActivity } from './side-panel';

function faviconUrl(pageUrl: string): string {
  const url = new URL(chrome.runtime.getURL('/_favicon/'));
  url.searchParams.set('pageUrl', pageUrl);
  url.searchParams.set('size', '32');
  return url.toString();
}

function stripProtocol(origin: string): string {
  return origin.replace(/(http|https):\/\//, '');
}

@customElement('zen-animated-grid')
export class AnimatedGrid extends LitElement {
  static styles = css`
    ul.breakdown {
      padding: 0;
      display: flex;
      flex-wrap: wrap;
    }

    li.site {
      display: inline-block;
      flex: 1 1 50%;
      list-style-type: none;

      box-sizing: border-box;
      padding: 8px;
      margin: 2px 0;
      border-radius: 4px;

      /* position: relative; */
    }

    .site .site-link {
      display: inline-flex;
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
      opacity: 0.75;
    }
  `;

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
            requestAnimationFrame(() => {
              x.style.transform = `translate(${dx}px, ${dy}px)`;
              x.style.transition = 'transform 0s';

              requestAnimationFrame(() => {
                x.style.transform = '';
                x.style.transition = 'transform 700ms ease-in-out';
              });
            });
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
              <a class="site-link">
                <div class="favicon">
                  <img src=${faviconUrl(x.origin)} />
                </div>
                <div>
                  <div>${stripProtocol(x.origin)}</div>
                  <div class="site-time">${formatDuration(x.duration)}</div>
                </div>
              </a>
            </li>`,
        )}
      </ul>
    `;
  }
}
