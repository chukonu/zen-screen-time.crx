import { css, LitElement, TemplateResult } from 'lit';
import { state } from 'lit/decorators.js';
import _ from 'lodash';
import { ZenEvents } from '../events';

export type RouteConfig = {
  path: string;
  render: (...args: any[]) => TemplateResult;
};

export type RouteHistoryRecord = { dest: string; data?: any };

export type RouteChangeEvent = CustomEvent<RouteHistoryRecord>;

export function routeTo(dest: string, data?: any) {
  dispatchEvent(
    new CustomEvent(ZenEvents.RouteChange, {
      detail: { dest, data },
    }) as RouteChangeEvent,
  );
}

export function routeBack() {
  dispatchEvent(new CustomEvent(ZenEvents.RouteBack));
}

function defaultRoute(): RouteHistoryRecord {
  return { dest: '/' };
}

export abstract class MemoryRouter extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
  `;

  @state()
  private _history: RouteHistoryRecord[] = [defaultRoute()];

  protected abstract routes: RouteConfig[];

  private _handleRouteChange = (event: RouteChangeEvent) => {
    this._history = Array.of(...this._history, event.detail);
  };

  private _handleRouteBack = (event: RouteChangeEvent) => {
    const h = _.eq(1, this._history.length)
      ? Array.of(defaultRoute())
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
    const { dest: currentLoc, data: props } = _.last(this._history);
    const route = this._findRoute(currentLoc);
    return route.render(props);
  }
}
