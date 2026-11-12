import type { Figure } from "./manuscript";

const esc = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c] ?? c);
const text = (x: number, y: number, value: unknown, size: number, extra = "") => `<text x="${x}" y="${y}" font-size="${size}" fill="#1F2933" ${extra}>${esc(value)}</text>`;
function scale(domainMin: number, domainMax: number, rangeMin: number, rangeMax: number) {
  const span = domainMax - domainMin || 1;
  return (value: number) => rangeMax - ((value - domainMin) / span) * (rangeMax - rangeMin);
}
function axes(width: number, height: number, left: number, top: number, right: number, bottom: number, min: number, max: number, fontSize: number) {
  const y = scale(min, max, top, height - bottom);
  let out = `<line x1="${left}" y1="${top}" x2="${left}" y2="${height - bottom}" stroke="#6B7280"/><line x1="${left}" y1="${height - bottom}" x2="${width - right}" y2="${height - bottom}" stroke="#6B7280"/>`;
  for (let i = 0; i <= 4; i++) {
    const value = min + ((max - min) * i) / 4; const py = y(value);
    out += `<line x1="${left}" y1="${py}" x2="${width - right}" y2="${py}" stroke="#E5E1D8" stroke-dasharray="4 4"/>${text(left - 10, py + 4, Number(value.toFixed(2)), fontSize - 1, 'text-anchor="end"')}`;
  }
  return { out, y };
}
function quantile(sorted: number[], q: number) {
  const pos = (sorted.length - 1) * q; const base = Math.floor(pos); const rest = pos - base;
  return (sorted[base] ?? 0) + rest * ((sorted[base + 1] ?? sorted[base] ?? 0) - (sorted[base] ?? 0));
}
export function figureSvg(f: Figure, exportScale = 1): string {
  const width = 900; const height = 520; const fontSize = Math.max(9, Math.min(24, f.fontSize || 12));
  const color = f.grayscale ? "#4B5563" : (f.color || "#2F5D62");
  const title = f.title ? text(width / 2, 30, f.title, fontSize + 5, 'text-anchor="middle" font-weight="600"') : "";
  const aria = esc(f.title || f.caption || "Manuscript figure");
  if (f.kind === "image") return `<svg xmlns="http://www.w3.org/2000/svg" width="${width * exportScale}" height="${height * exportScale}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${aria}"><rect width="100%" height="100%" fill="#FFFFFF"/><image href="${esc(f.image)}" x="20" y="20" width="860" height="480" preserveAspectRatio="xMidYMid meet"/></svg>`;
  if (f.kind === "diagram") {
    const nodes = f.diagram.nodes; const edges = f.diagram.edges;
    const point = (id: string) => nodes.find((n) => n.id === id);
    let out = `<defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#6B7280"/></marker></defs>`;
    for (const e of edges) {
      const a = point(e.from); const b = point(e.to); if (!a || !b) continue;
      const x1 = a.x * 9; const y1 = a.y * 8; const x2 = b.x * 9; const y2 = b.y * 8;
      out += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#6B7280" stroke-width="2" marker-end="url(#arrow)"/>`;
      if (e.label) out += text((x1 + x2) / 2, (y1 + y2) / 2 - 6, e.label, fontSize - 1, 'text-anchor="middle"');
    }
    for (const n of nodes) {
      const x = n.x * 9; const y = n.y * 8;
      out += `<rect x="${x - 85}" y="${y - 30}" width="170" height="60" rx="8" fill="#F1EDE4" stroke="${color}" stroke-width="2"/>${text(x, y + 5, n.label, fontSize, 'text-anchor="middle"')}`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width * exportScale}" height="${height * exportScale}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${aria}"><rect width="100%" height="100%" fill="#FFFFFF"/>${title}${out}</svg>`;
  }
  if (!f.data.length) return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${aria}"><rect width="100%" height="100%" fill="#FFFFFF"/>${title}${text(width / 2, height / 2, "No chart data", fontSize, 'text-anchor="middle"')}</svg>`;
  const left = 85; const right = 35; const top = f.title ? 65 : 40; const bottom = 100;
  if (f.kind === "confusion") {
    const pairs = f.data.map((d) => { const [actual = "", predicted = ""] = d.label.split(/\s*(?:→|->)\s*/); return { actual, predicted, value: d.value }; });
    const actuals = [...new Set(pairs.map((p) => p.actual))]; const predicted = [...new Set(pairs.map((p) => p.predicted))];
    const cellW = (width - left - right) / Math.max(1, predicted.length); const cellH = (height - top - bottom) / Math.max(1, actuals.length); const max = Math.max(1, ...f.data.map((d) => d.value));
    let out = "";
    for (const [i, actual] of actuals.entries()) {
      out += text(left - 10, top + cellH * (i + 0.55), actual, fontSize, 'text-anchor="end"');
      for (const [j, pred] of predicted.entries()) {
        const value = pairs.find((p) => p.actual === actual && p.predicted === pred)?.value ?? 0; const opacity = 0.12 + 0.78 * (value / max);
        out += `<rect x="${left + j * cellW}" y="${top + i * cellH}" width="${cellW}" height="${cellH}" fill="${color}" fill-opacity="${opacity}" stroke="#FFFFFF"/>${text(left + (j + 0.5) * cellW, top + (i + 0.55) * cellH, value, fontSize + 2, 'text-anchor="middle"')}`;
        if (i === 0) out += text(left + (j + 0.5) * cellW, top - 12, pred, fontSize, 'text-anchor="middle"');
      }
    }
    out += text(width / 2, height - 20, f.xLabel || "Predicted", fontSize, 'text-anchor="middle"') + text(20, height / 2, f.yLabel || "Actual", fontSize, `text-anchor="middle" transform="rotate(-90 20 ${height / 2})"`);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width * exportScale}" height="${height * exportScale}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${aria}"><rect width="100%" height="100%" fill="#FFFFFF"/><g font-family="Manrope,Arial,sans-serif">${title}${out}</g></svg>`;
  }
  const values = f.data.map((d) => d.value); let min = Math.min(0, ...values); let max = Math.max(0, ...values);
  if (min === max) max = min + 1;
  const { out: axisOut, y } = axes(width, height, left, top, right, bottom, min, max, fontSize);
  const plotW = width - left - right; let out = axisOut;
  if (f.kind === "box") {
    const groups = [...new Set(f.data.map((d) => d.label))]; const all = groups.map((label) => f.data.filter((d) => d.label === label).map((d) => d.value).sort((a, b) => a - b));
    min = Math.min(...all.flat()); max = Math.max(...all.flat()); if (min === max) { min -= 1; max += 1; }
    const scaled = axes(width, height, left, top, right, bottom, min, max, fontSize); out = scaled.out;
    groups.forEach((label, i) => {
      const vals = all[i] ?? [0]; const q1 = quantile(vals, 0.25); const med = quantile(vals, 0.5); const q3 = quantile(vals, 0.75); const low = vals[0] ?? 0; const high = vals[vals.length - 1] ?? 0;
      const x = left + plotW * ((i + 0.5) / groups.length); const boxW = Math.min(90, plotW / groups.length * 0.45);
      out += `<line x1="${x}" y1="${scaled.y(low)}" x2="${x}" y2="${scaled.y(high)}" stroke="${color}" stroke-width="2"/><line x1="${x - boxW / 3}" y1="${scaled.y(low)}" x2="${x + boxW / 3}" y2="${scaled.y(low)}" stroke="${color}"/><line x1="${x - boxW / 3}" y1="${scaled.y(high)}" x2="${x + boxW / 3}" y2="${scaled.y(high)}" stroke="${color}"/><rect x="${x - boxW / 2}" y="${scaled.y(q3)}" width="${boxW}" height="${Math.max(1, scaled.y(q1) - scaled.y(q3))}" fill="${color}" fill-opacity="0.35" stroke="${color}" stroke-width="2"/><line x1="${x - boxW / 2}" y1="${scaled.y(med)}" x2="${x + boxW / 2}" y2="${scaled.y(med)}" stroke="${color}" stroke-width="3"/>${text(x, height - 65, label, fontSize, 'text-anchor="middle"')}`;
    });
  } else {
    f.data.forEach((d, i) => {
      const x = left + plotW * ((i + 0.5) / f.data.length); const py = y(d.value);
      if (f.kind === "bar") { const bw = Math.min(100, plotW / f.data.length * 0.65); out += `<rect x="${x - bw / 2}" y="${py}" width="${bw}" height="${Math.max(0, y(min) - py)}" fill="${color}" fill-opacity="0.85"/>`; }
      if (f.kind === "scatter") out += `<circle cx="${x}" cy="${py}" r="7" fill="${color}"/>`;
      out += text(x, height - 65, d.label, fontSize, 'text-anchor="middle"');
      if (i < f.data.length - 1 && f.kind === "line") { const next = f.data[i + 1]; if (next) { const nx = left + plotW * ((i + 1.5) / f.data.length); out += `<line x1="${x}" y1="${py}" x2="${nx}" y2="${y(next.value)}" stroke="${color}" stroke-width="3"/>`; } }
      if (f.kind === "line") out += `<circle cx="${x}" cy="${py}" r="5" fill="${color}"/>`;
    });
  }
  out += text(width / 2, height - 20, f.xLabel, fontSize, 'text-anchor="middle"') + text(22, height / 2, f.yLabel, fontSize, `text-anchor="middle" transform="rotate(-90 22 ${height / 2})"`);
  if (f.showLegend) out += `<rect x="${width - 180}" y="18" width="14" height="14" fill="${color}"/>${text(width - 158, 30, f.yLabel || "Value", fontSize - 1)}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width * exportScale}" height="${height * exportScale}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${aria}"><rect width="100%" height="100%" fill="#FFFFFF"/><g font-family="Manrope,Arial,sans-serif">${title}${out}</g></svg>`;
}
