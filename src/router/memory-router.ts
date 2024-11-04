import { css, LitElement, TemplateResult } from 'lit';
import { state } from 'lit/decorators.js';
import _ from 'lodash';
import { ZenEvents } from '../events';

export type RouteConfig = { path: string; render: () => TemplateResult };

export type RouteChangeEvent = CustomEvent<string>;

export function routeTo(dest: string) {
  dispatchEvent(
    new CustomEvent(ZenEvents.RouteChange, {
      bubbles: true,
      composed: true,
      detail: dest,
    }),
  );
}

export function routeBack() {
  dispatchEvent(
    new CustomEvent(ZenEvents.RouteBack, { bubbles: true, composed: true }),
  );
}

export abstract class MemoryRouter extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
  `;

  private static DEFAULT: string[] = ['/'];

  @state()
  private _history: string[] = ['/'];

  protected abstract routes: RouteConfig[];

  private _handleRouteChange = (event: RouteChangeEvent) => {
    this._history = Array.of(...this._history, event.detail);
  };

  private _handleRouteBack = (event: RouteChangeEvent) => {
    const h = _.eq(1, this._history.length)
      ? MemoryRouter.DEFAULT
      : (this._history.pop(), this._history);
    this._history = Array.of(...h);
  };

  private _findRoute(target: string): RouteConfig {
    return _<RouteConfig>(this.routes).find((x) => _.eq(x.path, target));
  }

  connectedCallback(): void {
    super.connectedCallback();

    addEventListener(ZenEvents.RouteBack, this._handleRouteBack);
    addEventListener(ZenEvents.RouteChange, this._handleRouteChange);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();

    removeEventListener(ZenEvents.RouteBack, this._handleRouteBack);
    removeEventListener(ZenEvents.RouteChange, this._handleRouteChange);
  }

  render() {
    const currentLoc = _.last(this._history);
    const route = this._findRoute(currentLoc);
    return route.render();
  }
}
