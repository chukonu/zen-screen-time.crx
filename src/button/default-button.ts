import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('zen-default-button')
export class DefaultButton extends LitElement {
  static styles = css`
    .default-button {
      color: var(--zen-primary-color);
      font-size: 1.1em;
      line-height: 2em;
      padding-left: 20px;
      padding-right: 20px;
      background-color: transparent;
      border-radius: 20px;
      border-width: 1.5px;
      border-color: #d9d9d9;
      border-style: solid;
      width: 100%;
      transition: background-color 0.1s ease-in;
    }

    .default-button:hover {
      background-color: var(--zen-hover-background-color);
      cursor: pointer;
    }

    .default-button:active {
      background-color: var(--zen-active-background-color);
    }
  `;

  render() {
    return html`<button class="default-button"><slot></slot></button>`;
  }
}
