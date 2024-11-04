import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

export const buttonDefaultStyles = css`
  button {
    color: inherit;
    background-color: transparent;
    border: none;
    padding: 0;
    margin: 0;
    text-align: start;
    font-size: inherit;
    font-family: inherit;
    cursor: pointer;
  }
`;

@customElement('zen-default-button')
export class DefaultButton extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .default-button {
      color: var(--zen-primary-color);
      font-size: 1.1em;
      line-height: 2em;
      padding-left: 20px;
      padding-right: 20px;
      background-color: transparent;
      border-radius: 20px;
      border-width: var(--zen-border-width);
      border-color: var(--zen-border-color);
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
