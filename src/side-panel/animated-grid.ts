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
      :host {
        display: block;
      }

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
        flex: 0 1 50%;

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

  /**
   * Max number of items to display
   */
  @property({ type: Number })
  max: number;

  /**
   * Helps to determine whether transition animation should be performed.
   */
  @property({ type: Number })
  date?: number;

  @queryAll('li.site')
  renderedItems?: NodeListOf<HTMLLIElement>;

  /**
   * Keep track of item position in the array and its bounding rect.
   */
  private _rectMap?: Map<string, [number, DOMRect]>;

  /**
   * Keep track of the number of updates since a date change.
   *
   * Reset the count on every date change in `willUpdate`.
   */
  private _updateCount: number = 0;

  /**
   * Control when to do the animation.
   *
   * Animation will not occur on the first update after a date change.
   */
  private get _shouldAnimate(): boolean {
    return this._updateCount > 1;
  }

  protected willUpdate(changedProperties: PropertyValues): void {
    console.debug('[zen-animated-grid]', 'will update');
    this._rectMap = new Map();

    const length = this.renderedItems?.length;
    if (length) {
      Array.from(this.renderedItems).forEach((x, i) => {
        this._rectMap.set(x.dataset.key, [i, x.getBoundingClientRect()]);
      });
    }

    if (changedProperties.has('date')) {
      this._updateCount = 0;
    }

    if (changedProperties.has('items')) {
      this._updateCount++;
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

      if (this._shouldAnimate) {
        // animate grid items following the FLIP pattern
        Array.from(this.renderedItems).forEach((x, i) => {
          const key = x.dataset.key;

          if (!this._rectMap?.has(key)) {
            console.debug('[zen-animated-grid]', 'first render; no animation.');
            return;
          }

          const rect = x.getBoundingClientRect();
          const [oldIndex, oldRect] = this._rectMap.get(key);

          // no animation if the item is in the same position:
          if (oldIndex == i) {
            return;
          }

          const dx = oldRect.left - rect.left;
          const dy = oldRect.top - rect.top;

          if (dx || dy) {
            slide(x, dx, dy);
          }
        });
      }
    }
  }

  render() {
    if (!this.items?.length) {
      return nothing;
    }
    return html`
      <ul class="breakdown">
        ${repeat(
          this.items?.slice(0, this.max),
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
