import type { Figure, Manuscript } from "./manuscript";
import type { Venue } from "./projects";

// Venue-specific numbering and caption style for figures and tables.
const roman = (n: number) => { let s = ""; for (const [v, r] of [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]] as const) while (n >= v) { s += r; n -= v; } return s; };
export const isTable = (f: Figure) => f.kind === "table";
export type FloatLabel = { ref: string; caption: string; above: boolean; captionText: string };
export function floatLabels(m: Manuscript, venue: Venue): Record<string, FloatLabel> {
  const out: Record<string, FloatLabel> = {}; let fig = 0, tab = 0;
  for (const f of m.figures) {
    if (isTable(f)) {
      tab++;
      const num = venue === "IEEE" ? roman(tab) : String(tab);
      const ref = venue === "IEEE" ? `Table ${num}` : `Table ${tab}`;
      const caption = venue === "IEEE" ? `TABLE ${num}` : venue === "ACM" || venue === "Elsevier" ? `Table ${tab}.` : `Table ${tab}`;
      out[f.id] = { ref, caption, above: true, captionText: venue === "IEEE" ? f.caption.toUpperCase() : f.caption };
    } else {
      fig++;
      const short = venue === "IEEE" || venue === "Springer" || venue === "Elsevier";
      out[f.id] = { ref: short ? `Fig. ${fig}` : `Figure ${fig}`, caption: venue === "APA" ? `Figure ${fig}` : short ? `Fig. ${fig}.` : `Figure ${fig}.`, above: venue === "APA", captionText: f.caption };
    }
  }
  return out;
}
/** Floats placed after a section; unplaced ones go at the end (sectionId undefined). */
export function floatsFor(m: Manuscript, sectionId: string | undefined) {
  const ids = new Set(m.sections.map((s) => s.id));
  return m.figures.filter((f) => sectionId === undefined ? !f.sectionId || !ids.has(f.sectionId) : f.sectionId === sectionId);
}
