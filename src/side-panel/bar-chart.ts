import * as d3 from 'd3';
import { css, html, LitElement, PropertyValues } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { DateTime } from 'luxon';
import { HourlyActivityDataPoint } from './side-panel';

@customElement('zen-bar-chart')
export class BarChartWrapper extends LitElement {
  static styles = css``;

  @property({ type: Array })
  data?: HourlyActivityDataPoint[];

  @property({ type: Number })
  date?: number;

  @state()
  private contentWidth?: number;

  @state()
  private chartHeight?: number;

  #resizeObserver: ResizeObserver = new ResizeObserver((entries) => {
    const [body] = entries;
    // wrap the updating of the measurements with requestAnimationFrame to avoid an infinite loop, fixing "ResizeObserver loop completed with undelivered notifications".
    requestAnimationFrame(() => {
      if (body.contentRect.width !== this.contentWidth) {
        this.contentWidth = body.contentRect.width;
        this.chartHeight = Math.ceil(this.contentWidth / 2.87);
      }
    });
  });

  connectedCallback() {
    super.connectedCallback();

    this.#resizeObserver.observe(document.body);
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    this.#resizeObserver.unobserve(document.body);
  }

  render() {
    return html`<div style="height: ${this.chartHeight}px;">
      ${this.contentWidth && this.chartHeight
        ? html` <zen-d3-bar-chart
            .data=${this.data}
            .date=${this.date}
            .width="${this.contentWidth}"
            .height="${this.chartHeight}"
          ></zen-d3-bar-chart>`
        : html``}
    </div>`;
  }
}

@customElement('zen-d3-bar-chart')
class D3BarChart extends LitElement {
  static styles = css`
    svg {
      color: var(--zen-secondary-text-color);
    }

    svg .domain,
    svg .tick line {
      stroke: var(--zen-border-color);
      stroke-width: var(--zen-border-width);
    }

    svg g.activity {
      fill: skyblue;
    }
  `;

  @property({ type: Number })
  width?: number;

  @property({ type: Number })
  height?: number;

  @property({ type: Array })
  data?: HourlyActivityDataPoint[];

  @property({ type: Number })
  date?: number;

  private get _timeDomain(): [Date, Date] {
    return [
      DateTime.fromMillis(this.date).startOf('day').toJSDate(),
      DateTime.fromMillis(this.date).endOf('day').toJSDate(),
    ];
  }

  readonly #margin = {
    top: 20,
    right: 30,
    bottom: 30,
    left: 1,
  };

  @query('#container', true)
  container: HTMLElement;

  #chart?: SVGSVGElement;

  protected updated(_changedProperties: PropertyValues): void {
    // console.debug('updated: ', _changedProperties);
    // console.debug(`w: ${this.width}; h: ${this.height};`);
    // undefined in changedProperties but present in this object

    if (this.width && this.height && this.data && this.date) {
      if (this.#chart) {
        this.container.removeChild(this.#chart);
      }
      this.#chart = this.#createD3Chart();
      this.container.appendChild(this.#chart);
    }

    console.debug('Bar chart data: ', this.data);
  }

  #createD3Chart(): SVGSVGElement {
    const barWidth = Math.floor(
      (this.width - this.#margin.left - this.#margin.right) / 24 / 2,
    );

    const x = d3
      .scaleTime()
      .domain(this._timeDomain)
      .range([this.#margin.left, this.width - this.#margin.right]);

    const tfX = x.tickFormat(4, '%H');

    const y = d3
      .scaleLinear()
      .domain([0, 60])
      .range([this.height - this.#margin.bottom, this.#margin.top]);

    // Create the SVG container.
    const svg = d3
      .create('svg')
      .attr('width', this.width)
      .attr('height', this.height);

    // Add the y-axis. Do this before drawing rects so that rects will be on
    // top of the vertical gridlines.
    svg
      .append('g')
      .attr('transform', `translate(${this.width - this.#margin.right},0)`)
      .call(
        d3
          .axisRight(y)
          .tickValues([0, 30, 60])
          .tickSize(0)
          .tickFormat((x) => (x ? `${x}m` : `${x}`)),
      )
      // remove the domain line:
      .call((g) => g.select('.domain').remove())
      // horizontal gridlines
      .call((g) =>
        g
          .selectAll('.tick line')
          // skip the first tick so that there is no extra line
          .filter((d, i) => i > 0)
          // .attr('stroke-opacity', (d) => (d === 1 ? null : 0.2))
          .clone()
          .attr('x2', this.width - this.#margin.left - this.#margin.right)
          .attr(
            'transform',
            `translate(${-this.width + this.#margin.right + this.#margin.left}, 0)`,
          ),
      );

    svg
      .append('g')
      .attr('class', 'activity')
      .selectAll()
      .data(this.data)
      .join('rect')
      .attr('x', (d) => x(d.startTime) + barWidth / 2)
      .attr('width', barWidth)
      .attr('y', (d) => y(d.durationInMinutes))
      .attr('height', (d) => y(0) - y(d.durationInMinutes));

    // Add the axes after the data so that the domain line will be on top of the bars.
    // Add the x-axis.
    svg
      .append('g')
      .attr('transform', `translate(0,${this.height - this.#margin.bottom})`)
      .call(
        d3.axisBottom(x).tickSizeOuter(0).ticks(3).tickSize(0).tickFormat(tfX),
      )
      // grey domain line
      // .call((g) => g.select('.domain').attr('stroke', '#d9d9d9'))
      // dashed vertical gridlines
      .call((g) =>
        g
          .selectAll('.tick line')
          .clone()
          .attr('y2', this.height - this.#margin.top - this.#margin.bottom + 7)
          .attr('stroke-dasharray', '2')
          .attr(
            'transform',
            `translate(0, ${-this.height + this.#margin.bottom + this.#margin.top})`,
          ),
      )
      .call((g) =>
        g.selectAll('.tick text').attr('transform', 'translate(8, 1)'),
      );

    return svg.node();
  }

  render() {
    return html`<div
      id="container"
      style="height: ${this.height}px; width: ${this.width}px;"
    ></div>`;
  }
}
