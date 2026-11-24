/* Tiny dependency-free SVG charts */

import { escapeHtml } from './utils.js';

function niceMax(v) {
  if (v <= 0) return 1;
  const exp = Math.floor(Math.log10(v));
  const base = Math.pow(10, exp);
  const n = v / base;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * base;
}

export function barChart(items, opts = {}) {
  const {
    formatter = v => String(Math.round(v)),
    color = '#6c5ce7',
    height = 230
  } = opts;
  if (!items.length) return '<div class="empty tiny">No data for this range.</div>';

  const W = 720, H = height;
  const left = 46, right = 12, top = 20, bottom = 36;
  const plotW = W - left - right;
  const plotH = H - top - bottom;
  const max = niceMax(Math.max(...items.map(i => i.value || 0)) * 1.08);
  const slot = plotW / items.length;
  const bw = Math.min(58, slot * 0.58);
  const showValue = items.length <= 8;

  let svg = `<svg class="chart-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img">`;

  for (let i = 0; i <= 4; i++) {
    const y = top + plotH - (plotH * i / 4);
    const val = max * i / 4;
    svg += `<line class="gridline" x1="${left}" y1="${y}" x2="${W - right}" y2="${y}"/>`;
    svg += `<text class="axis-label" x="${left - 8}" y="${y + 3}" text-anchor="end">${escapeHtml(formatter(val))}</text>`;
  }

  items.forEach((it, i) => {
    const v = Math.max(0, it.value || 0);
    const h = Math.max(v > 0 ? 3 : 0, (v / max) * plotH);
    const x = left + slot * i + (slot - bw) / 2;
    const y = top + plotH - h;
    const fill = it.color || color;
    const tip = `${it.fullLabel || it.label}: ${escapeHtml(formatter(v))}`;
    svg += `<g class="bar"><rect x="${x}" y="${y}" width="${bw}" height="${h}" rx="5" fill="${fill}"><title>${tip}</title></rect>`;
    if (showValue && v > 0) {
      svg += `<text class="bar-label" x="${x + bw / 2}" y="${y - 7}" text-anchor="middle">${escapeHtml(formatter(v))}</text>`;
    }
    svg += `<text class="axis-label" x="${left + slot * i + slot / 2}" y="${H - 12}" text-anchor="middle">${escapeHtml(it.label)}</text></g>`;
  });

  svg += '</svg>';
  return svg;
}

const DONUT_COLORS = ['#6c5ce7', '#3b9dfa', '#12b886', '#f59e0b', '#ef5f6b', '#8b7df0', '#22c1c3', '#f78fb3'];

export function donutChart(segments, opts = {}) {
  const { centerTop = '', centerBottom = '' } = opts;
  const visible = segments.filter(s => s.value > 0).slice(0, 8);
  const total = visible.reduce((a, s) => a + s.value, 0);
  const r = 54, c = 2 * Math.PI * r, cx = 70, cy = 70;

  let svg = `<svg class="chart-svg" viewBox="0 0 140 140" style="max-width:190px;margin:0 auto" role="img">`;
  svg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(255,255,255,.09)" stroke-width="18"/>`;

  if (total > 0) {
    let offset = 0;
    visible.forEach((s, i) => {
      const len = (s.value / total) * c;
      svg += `<circle class="bar" cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${s.color || DONUT_COLORS[i % DONUT_COLORS.length]}"
        stroke-width="18" stroke-dasharray="${len - 1.5} ${c - len + 1.5}" stroke-dashoffset="${-offset}"
        transform="rotate(-90 ${cx} ${cy})"><title>${escapeHtml(s.label)}: ${Math.round(s.value / total * 100)}%</title></circle>`;
      offset += len;
    });
  }

  svg += `<text x="${cx}" y="${cy - 2}" text-anchor="middle" style="font-family:var(--display);font-size:20px;font-weight:800;fill:var(--ink)">${escapeHtml(centerTop)}</text>`;
  svg += `<text x="${cx}" y="${cy + 15}" text-anchor="middle" style="font-size:9px;fill:var(--ink-3)">${escapeHtml(centerBottom)}</text>`;
  svg += '</svg>';
  return svg;
}

export function gauge(fraction, labelTop, labelBottom) {
  const c = 2 * Math.PI * 52;
  const f = Math.max(0, Math.min(1, fraction));
  const color = f < .6 ? '#12b886' : f < .85 ? '#f59e0b' : '#ef5f6b';
  return `<svg viewBox="0 0 140 140" width="150" height="150" role="img">
    <circle cx="70" cy="70" r="52" fill="none" stroke="rgba(255,255,255,.09)" stroke-width="13"/>
    <circle cx="70" cy="70" r="52" fill="none" stroke="${color}" stroke-width="13" stroke-linecap="round"
      stroke-dasharray="${c * f} ${c}" transform="rotate(-90 70 70)" style="transition:stroke-dasharray .5s"/>
  </svg><div class="gauge-center"><strong>${escapeHtml(labelTop)}</strong><span>${escapeHtml(labelBottom)}</span></div>`;
}

export function sparkBars(values) {
  const max = Math.max(1, ...values);
  return values.map(v => `<i style="height:${Math.max(5, (v / max) * 54)}px"></i>`).join('');
}

export const donutColors = DONUT_COLORS;
