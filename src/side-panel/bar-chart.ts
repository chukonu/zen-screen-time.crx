import * as d3 from 'd3';
import { css, html, LitElement, PropertyValues } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import _ from 'lodash';
import Ref from '../ref';

const ASPECT_RATIO: number = 2.725;

@customElement('zen-bar-chart')
export class BarChartWrapper extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    #container {
      aspect-ratio: ${ASPECT_RATIO};
      overflow: hidden;
    }
  `;

  @property({ attribute: false })
  data?: Ref<BarChartDataPoint[]>;

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
        this.chartHeight = Math.ceil(this.contentWidth / ASPECT_RATIO);
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
    return html`<div id="container">
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

  @property({ attribute: false })
  data?: Ref<BarChartDataPoint[]>;

  @property({ type: Number })
  date?: number;

  @query('#container', true)
  container: HTMLElement;

  @query('#container svg')
  private _chart?: SVGSVGElement;

  private _chartGenerator?: Generator<SVGSVGElement, never, BarChartProps> =
    barChartGenerator(() => this._barChartProps());

  private _barChartProps(): BarChartProps {
    return {
      width: this.width,
      height: this.height,
      data: this.data,
    };
  }

  protected updated(_changedProperties: PropertyValues): void {
    if (this.width && this.height && this.data && this.date) {
      const svg: SVGSVGElement = this._chartGenerator.next().value;
      if (!this._chart) {
        this.container.appendChild(svg);
      }
    }

    console.debug('Bar chart data: ', this.data);
  }

  render() {
    return html`<div
      id="container"
      style="height: ${this.height}px; width: ${this.width}px;"
    ></div>`;
  }
}

export type BarChartDataPoint = [x: number, y: number];

export type BarChartProps = {
  width: number;
  height: number;
  data: Ref<BarChartDataPoint[]>;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
};

function* barChartGenerator(
  props: () => BarChartProps,
): Generator<SVGSVGElement, never, undefined> {
  const GRIDLINE_Y = 'gridline-y',
    GRIDLINE_X = 'gridline-x',
    TICKVALUES_X = [0, 6, 12, 18],
    svg: d3.Selection<SVGSVGElement, BarChartDataPoint, null, undefined> =
      d3.create('svg'),
    scaleX = d3.scaleLinear(),
    scaleY = d3.scaleLinear(),
    axisY = svg.append('g'),
    bars = svg.append('g').attr('class', 'activity'),
    axisX = svg.append('g');

  const oldProps: Partial<BarChartProps> = {};

  while (true) {
    const {
      width,
      height,
      data,
      marginTop = 20,
      marginRight = 38,
      marginBottom = 30,
      marginLeft = 1,
    } = props();

    const barWidth = Math.floor((width - marginLeft - marginRight) / 24 / 2);

    svg.attr('width', width).attr('height', height);

    scaleX.domain([0, 24]).range([marginLeft, width - marginRight]);

    scaleY.domain([0, 60]).range([height - marginBottom, marginTop]);

    const zeroY = scaleY(0);

    // Add the y-axis. Do this before drawing rects so that rects will be on
    // top of the vertical gridlines.
    axisY
      .attr('transform', `translate(${width - marginRight}, 0)`)
      .call(
        d3
          .axisRight(scaleY)
          .tickValues([0, 30, 60])
          .tickSize(0)
          .tickFormat((x) => (x ? `${x}m` : `${x}`)),
      )
      // remove the domain line:
      .call((g) => g.select('.domain').remove())
      // horizontal gridlines
      .call((g) => {
        // try to select all horizontal gridlines;
        let gridlinesY = g.selectAll(`.${GRIDLINE_Y}`);

        // draw gridlines if the selection is empty;
        if (gridlinesY.empty()) {
          gridlinesY = g
            .selectAll('.tick line')
            // skip the first tick to avoid redundant clones
            .filter((d, i) => i > 0)
            .clone()
            .attr('class', GRIDLINE_Y);
        }

        return gridlinesY
          .attr('x2', width - marginLeft - marginRight)
          .attr(
            'transform',
            `translate(${-width + marginRight + marginLeft}, 0)`,
          );
      });

    const t = svg.transition().duration(400),
      none = svg.transition().duration(0);

    bars
      .selectAll('rect')
      .data(data.value, (d: BarChartDataPoint) => d[0])
      .join(
        (enter) =>
          enter
            .append('rect')
            .attr('x', ([x, y]) => scaleX(x) + barWidth / 2)
            .attr('width', barWidth)
            .attr('y', zeroY)
            .attr('height', 0)
            .call((enter) =>
              enter
                .transition(t)
                .attr('height', ([x, y]) => zeroY - scaleY(y))
                .attr('y', ([x, y]) => scaleY(y)),
            ),
        (update) =>
          update.call(
            (update, changed) => (
              update
                .attr('width', barWidth)
                .attr('x', ([x, y]) => scaleX(x) + barWidth / 2),
              (changed ? update.transition(t) : update.transition(none))
                .attr('height', ([x, y]) => zeroY - scaleY(y))
                .attr('y', ([x, y]) => scaleY(y))
                .attr('width', barWidth)
                .attr('x', ([x, y]) => scaleX(x) + barWidth / 2)
            ),
            data !== oldProps.data,
          ),
        (exit) =>
          exit
            // .attr('fill', 'brown')
            .call(
              (exit, changed) =>
                (changed ? exit.transition(t) : exit.transition(none))
                  .attr('height', 0)
                  .attr('y', zeroY)
                  .remove(),
              data !== oldProps.data,
            ),
      );

    // Add the axes after the data so that the domain line will be on top of the bars.
    // Add the x-axis.
    axisX
      .attr('transform', `translate(0,${height - marginBottom})`)
      .call(
        d3
          .axisBottom(scaleX)
          .tickSizeOuter(0)
          .tickSize(0)
          .tickValues(TICKVALUES_X),
      )
      // grey domain line
      // .call((g) => g.select('.domain').attr('stroke', '#d9d9d9'))
      // dashed vertical gridlines
      .call((g) => {
        let gridlinesX = g.selectAll(`.${GRIDLINE_X}`);
        if (gridlinesX.empty()) {
          gridlinesX = g
            .selectAll('.tick line')
            .clone()
            .attr('class', GRIDLINE_X);
        }
        return gridlinesX
          .attr('y2', height - marginTop - marginBottom + 7)
          .attr('stroke-dasharray', '2')
          .attr(
            'transform',
            `translate(0, ${-height + marginBottom + marginTop})`,
          );
      })
      .call((g) =>
        g.selectAll('.tick text').attr('transform', 'translate(8, 1)'),
      );

    // track the values of certain properties
    Object.assign(oldProps, { data });
    yield svg.node();
  }
}
