import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('zen-svg-icon-button')
export class SvgIconButton extends LitElement {
  static styles = css`
    button {
      cursor: pointer;
      width: 32px;
      height: 32px;
      padding: 0;
      border-width: 0;
      border-radius: 50%;
      background-color: transparent;

      display: flex;
      justify-content: center;
      align-items: center;

      transition: background-color 0.1s ease-in;
    }

    button:hover {
      background-color: var(--zen-hover-background-color);
    }

    button:active {
      background-color: var(--zen-active-background-color);
    }

    button svg {
      fill: var(--zen-primary-color);
    }
  `;

  @property()
  iconPath: string;

  render() {
    return html`<button>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height="24px"
        viewBox="0 -960 960 960"
        width="24px"
      >
        <path d=${this.iconPath} />
      </svg>
    </button>`;
  }
}
