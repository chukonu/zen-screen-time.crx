import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('zsc-settings')
export class SettingsElement extends LitElement {

  @property()
  heading: string = 'Settings';

  render() {
    return html`
      <p>Welcome to ${this.heading}</p>
    `;
  }
}
