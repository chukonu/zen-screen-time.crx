import { html, LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

type NavChangeDetail = { name: string };

@customElement('zen-settings')
export class SettingsElement extends LitElement {
  private readonly _navItems = ['Reports', 'Limits', 'Data', 'Customisation'];

  @state()
  private _activeItem: string = this._navItems[0];

  private _handleNavChange(event: CustomEvent<NavChangeDetail>) {
    const name = event.detail.name;
    this._activeItem = name;
    // console.debug(`settings: nav change (to ${name})`);
  }

  render() {
    return html`<div>
      <div @zennavchange=${this._handleNavChange}>
        ${repeat(
          this._navItems,
          (x) => x,
          (x) =>
            html`<zen-settings-nav-item
              .name=${x}
              .isActive=${this._activeItem === x}
            ></zen-settings-nav-item>`,
        )}
      </div>
      <div><h1>${this._activeItem}</h1></div>
    </div>`;
  }
}

@customElement('zen-settings-nav-item')
class SettingsNavItem extends LitElement {
  @property()
  name?: string;

  @property({ type: Boolean })
  isActive?: boolean;

  private _dispatchNavChange() {
    this.dispatchEvent(
      new CustomEvent<NavChangeDetail>('zennavchange', {
        bubbles: true,
        composed: true,
        detail: { name: this.name },
      }),
    );
  }

  render() {
    return html`<div @click=${this._dispatchNavChange}>
      ${this.name}${this.isActive ? html`<span> (a)</span>` : nothing}
    </div>`;
  }
}
