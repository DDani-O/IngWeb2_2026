/** Organismo `ChartCard` de la biblioteca de componentes; estilos en ChartCard.css. */
import { Component } from "../../core/Component.js";
import { EVENTS } from "../../utils/constants.js";
import { formatCurrency } from "../../utils/formatters.js";
import { getChartPalette, getChartThemeColors } from "../../utils/helpers.js";
import { html } from "../../utils/html.js";
import { icon as renderIcon } from "../atoms/icon.js";
import { emptyState } from "../molecules/stateBlock.js";

const CIRCULAR = ["doughnut", "pie"];

/**
 * Organismo ChartCard: gráfico de Chart.js con título, alto controlado por CSS
 * (maintainAspectRatio: false), colores del tema y resumen accesible. Se redibuja solo
 * al cambiar el tema.
 *
 * Props:
 * - title, icon, caption (texto bajo el gráfico), link: { href, label, newTab }
 * - type: "bar" | "line" | "doughnut" | "pie"
 * - labels: string[]
 * - datasets: [{ label, data: number[], kind?: "line"|"bar" (gráficos mixtos), dashed?: boolean }]
 * - valueFormat: "number" | "currency" | "percent" (ejes, tooltips y resumen)
 * - height: "sm" | "md" | "lg"
 * - emptyMessage: texto cuando no hay datos
 */
export class ChartCard extends Component {
  static DEFAULTS = {
    title: "",
    icon: null,
    caption: "",
    link: null,
    type: "bar",
    labels: [],
    datasets: [],
    valueFormat: "number",
    height: "md",
    emptyMessage: "Todavia no hay datos para graficar.",
  };

  render() {
    this._destroyChart();
    const { title, icon, caption, link, height, emptyMessage } = this.options;
    const hasData = this.options.datasets.some((dataset) => dataset.data.some((value) => Number(value) !== 0));

    this.element.innerHTML = html`
      <article class="chart-card">
        <h3 class="chart-card__title">${renderIcon({ name: icon, className: "accent" })}${title}</h3>
        ${hasData && window.Chart
          ? html`
              <div class="chart-card__canvas chart-card__canvas--${height}">
                <canvas role="img" aria-label="${title}"></canvas>
              </div>
              <p class="visually-hidden">${this._summary()}</p>
            `
          : emptyState({ icon: "fa-chart-simple", title: window.Chart ? emptyMessage : "No se pudo cargar la libreria de graficos." })}
        ${caption ? html`<p class="chart-card__caption">${caption}</p>` : ""}
        ${link ? html`<a class="chart-card__link" href="${link.href}" ${link.newTab ? html`target="_blank" rel="noopener"` : ""}>${link.label}</a>` : ""}
      </article>
    `;

    const canvas = this.element.querySelector("canvas");
    if (canvas) {
      this._chart = new window.Chart(canvas, this._config());
    }
  }

  attachEvents() {
    this.on(EVENTS.THEME.CHANGED, () => this.render());
  }

  destroy() {
    this._destroyChart();
    super.destroy();
  }

  _destroyChart() {
    this._chart?.destroy();
    this._chart = null;
  }

  /** @param {boolean} [axisTick] las marcas del eje van sin centavos; los tooltips, con. */
  _format(value, axisTick = false) {
    const { valueFormat } = this.options;
    if (valueFormat === "currency") return formatCurrency(value, { decimals: axisTick ? 0 : 2 });
    if (valueFormat === "percent") return `${value}%`;
    return Number(value).toLocaleString("es-AR");
  }

  _summary() {
    const { labels, datasets } = this.options;
    return datasets
      .map((dataset) => `${dataset.label || this.options.title}: ${labels.map((label, index) => `${label} ${this._format(dataset.data[index] ?? 0)}`).join(", ")}`)
      .join(". ");
  }

  /** Configuración de Chart.js: series con los colores del tema, ejes y tooltips formateados. */
  _config() {
    const { type, labels, datasets } = this.options;
    const theme = getChartThemeColors();
    const palette = getChartPalette();
    const circular = CIRCULAR.includes(type);

    return {
      type,
      data: {
        labels,
        datasets: datasets.map((dataset, index) =>
          circular ? this._circularDataset(dataset, palette, theme) : this._cartesianDataset(dataset, palette[index % palette.length])
        ),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: circular ? {} : this._scales(theme),
        plugins: {
          legend: { labels: { color: theme.label }, position: circular ? "bottom" : "top" },
          tooltip: {
            callbacks: {
              label: (context) => `${context.dataset.label || context.label}: ${this._format(context.parsed?.y ?? context.parsed)}`,
            },
          },
        },
      },
    };
  }

  /** Torta o dona: un color de la paleta por porción, separadas con el color de borde del tema. */
  _circularDataset(dataset, palette, theme) {
    return {
      label: dataset.label,
      data: dataset.data,
      backgroundColor: dataset.data.map((_, pointIndex) => palette[pointIndex % palette.length]),
      borderColor: theme.border,
      borderWidth: 2,
    };
  }

  /**
   * Barras o líneas (se pueden mezclar con `kind`): un color por serie. Las líneas van por
   * encima de las barras (`order` 0) para que el promedio punteado no quede tapado.
   */
  _cartesianDataset(dataset, color) {
    const kind = dataset.kind || this.options.type;
    const isLine = kind === "line";
    return {
      type: kind,
      label: dataset.label,
      data: dataset.data,
      backgroundColor: isLine ? "transparent" : color,
      borderColor: color,
      borderWidth: isLine ? 2 : 1,
      borderDash: dataset.dashed ? [6, 4] : [],
      pointRadius: isLine ? 3 : 0,
      tension: 0.32,
      order: isLine ? 0 : 1,
    };
  }

  /** Ejes x e y con los colores del tema; las marcas del eje y, en el formato del valor. */
  _scales(theme) {
    return {
      x: { ticks: { color: theme.label }, grid: { color: theme.grid } },
      y: { ticks: { color: theme.label, callback: (value) => this._format(value, true) }, grid: { color: theme.grid } },
    };
  }
}
