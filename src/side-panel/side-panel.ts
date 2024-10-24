import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('zen-side-panel')
class SidePanel extends LitElement {
  render() {
    return html`<h1>Side Panel</h1>`;
  }
}
