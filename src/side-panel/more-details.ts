import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { routeBack } from '../router/memory-router';

@customElement('zen-more-details')
export class MoreDetails extends LitElement {
  private _goBack = () => routeBack();

  render() {
    return html`<div>
      <div>
        <button @click=${this._goBack}>Back</button>
      </div>
      <div>See more details</div>
    </div>`;
  }
}
