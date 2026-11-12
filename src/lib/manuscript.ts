import type { Venue } from "./projects";
import type { SemanticResult } from "./analysis-schema";

export type Section = { id: string; title: string; html: string };
export type Reference = { id: string; title: string; authors: string; year: string; venue: string; doi: string; url: string; notes: string; tags: string; collection: string };
export type DiagramNode = { id: string; label: string; x: number; y: number };
export type DiagramEdge = { id: string; from: string; to: string; label: string };
export type Figure = {
  id: string; caption: string; kind: "bar" | "line" | "scatter" | "box" | "confusion" | "diagram" | "image";
  data: { label: string; value: number }[]; image: string; xLabel: string; yLabel: string; grayscale: boolean;
  title: string; showLegend: boolean; color: string; fontSize: number; width: "single" | "double";
  resultIds: string[]; imageWidth: number; imageHeight: number; diagram: { nodes: DiagramNode[]; edges: DiagramEdge[] };
};
export type ExperimentResult = { id: string; metric: string; value: number; baseline: string; notes: string };
export type Experiment = { id: string; name: string; dataset: string; datasetVersion: string; datasetSource: string; preprocessing: string; status: "planned" | "running" | "complete"; notes: string; results: ExperimentResult[] };
export type SavedSemanticReview = { id: string; date: string; result: SemanticResult };
export type VenueRules = { columns: number; fontSize: number; margin: number; abstractLimit: number; keywordLimit: number; pageLimit: number; required: string[] };
export type Manuscript = {
  sections: Section[]; references: Reference[]; figures: Figure[]; authors: string; rules: Partial<Record<Venue, VenueRules>>;
  statuses: Record<string, "acknowledged">; snapshots: { id: string; date: string; sections: Section[] }[]; notes: string;
  experiments: Experiment[]; tableCaptions: Record<string, string>; semanticReview: SavedSemanticReview | null;
};
export type Finding = { id: string; severity: "error" | "warning"; category: "Integrity" | "Citations" | "Formatting" | "Reproducibility" | "Venue"; location: string; sectionId?: string; title: string; explanation: string; compared: string; acknowledged?: boolean };
export const STARTER_RULES: Record<Venue, VenueRules> = {
  IEEE: { columns: 2, fontSize: 10, margin: 19, abstractLimit: 250, keywordLimit: 6, pageLimit: 8, required: ["Abstract", "Introduction", "Methods", "Results", "Conclusion"] },
  Springer: { columns: 1, fontSize: 10, margin: 25, abstractLimit: 250, keywordLimit: 6, pageLimit: 15, required: ["Abstract", "Introduction", "Methods", "Results", "Conclusion"] },
  ACM: { columns: 2, fontSize: 10, margin: 19, abstractLimit: 250, keywordLimit: 6, pageLimit: 10, required: ["Abstract", "Introduction", "Methods", "Results", "Conclusion"] },
  Elsevier: { columns: 1, fontSize: 12, margin: 25, abstractLimit: 250, keywordLimit: 6, pageLimit: 20, required: ["Abstract", "Introduction", "Methods", "Results", "Conclusion"] },
  APA: { columns: 1, fontSize: 12, margin: 25.4, abstractLimit: 250, keywordLimit: 5, pageLimit: 30, required: ["Abstract", "Introduction", "Methods", "Results", "Discussion"] },
};
export function newManuscript(): Manuscript {
  return { sections: ["Abstract", "Introduction", "Related work", "Methods", "Results", "Discussion", "Conclusion"].map((title) => ({ id: crypto.randomUUID(), title, html: "<p></p>" })), references: [], figures: [], authors: "", rules: {}, statuses: {}, snapshots: [], notes: "", experiments: [], tableCaptions: {}, semanticReview: null };
}
export function normalizeFigure(value: Partial<Figure>): Figure {
  return {
    id: value.id ?? crypto.randomUUID(), caption: value.caption ?? "", kind: value.kind ?? "bar", data: Array.isArray(value.data) ? value.data : [],
    image: value.image ?? "", xLabel: value.xLabel ?? "", yLabel: value.yLabel ?? "", grayscale: value.grayscale ?? false,
    title: value.title ?? "", showLegend: value.showLegend ?? true, color: value.color ?? "#2F5D62", fontSize: value.fontSize ?? 12,
    width: value.width ?? "single", resultIds: Array.isArray(value.resultIds) ? value.resultIds : [], imageWidth: value.imageWidth ?? 0,
    imageHeight: value.imageHeight ?? 0, diagram: { nodes: value.diagram?.nodes ?? [], edges: value.diagram?.edges ?? [] },
  };
}
export function readManuscript(value: unknown): Manuscript {
  if (!value || typeof value !== "object" || !("sections" in value) || !Array.isArray(value.sections)) return newManuscript();
  const stored = value as Partial<Manuscript>;
  return {
    ...newManuscript(), ...stored,
    figures: Array.isArray(stored.figures) ? stored.figures.map((f) => normalizeFigure(f)) : [],
    experiments: Array.isArray(stored.experiments) ? stored.experiments : [],
    tableCaptions: stored.tableCaptions && typeof stored.tableCaptions === "object" ? stored.tableCaptions : {},
    semanticReview: stored.semanticReview ?? null,
  } as Manuscript;
}
export function plainText(html: string): string {
  return html.replace(/<\/(p|h[1-6]|tr|li)>/g, " ").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
}
export function wordCount(html: string) { return plainText(html).split(/\s+/).filter(Boolean).length; }
export function rulesFor(m: Manuscript, venue: Venue) { return m.rules[venue] ?? STARTER_RULES[venue]; }
export function tableKey(sectionId: string, index: number) { return `${sectionId}:${index}`; }
export function tableNumber(m: Manuscript, sectionId: string, index: number) {
  let number = index + 1;
  for (const section of m.sections) {
    if (section.id === sectionId) break;
    number += (section.html.match(/<table\b/gi) ?? []).length;
  }
  return number;
}
export const REPRO_ITEMS = [
  { name: "Dataset", pattern: /\b(dataset|data set|corpus)\b\s*(?:[:=]|is|was|named|of|from)?\s+\S+/i },
  { name: "Hyperparameters", pattern: /\b(learning rate|batch size|epochs|hyperparameters)\b\s*(?:[:=]|of|was|is)?\s*\d/i },
  { name: "Random seed", pattern: /\b(seed|seeds)\b\s*(?:[:=]|of|was|is)?\s*\d/i },
  { name: "Metrics", pattern: /\b(accuracy|precision|recall|f1|auc|rmse|mae)\b/i },
  { name: "Environment", pattern: /\b(python|pytorch|tensorflow|cuda|r version)\b\s*\d/i },
];
export function reproducibility(m: Manuscript) {
  const text = m.sections.map((s) => plainText(s.html)).join(" ");
  return REPRO_ITEMS.map((item) => ({ name: item.name, reported: item.pattern.test(text) }));
}
export function analyze(m: Manuscript, venue: Venue, keywords: string[]): Finding[] {
  const findings: Finding[] = [];
  const add = (f: Omit<Finding, "acknowledged">) => findings.push({ ...f, acknowledged: m.statuses[f.id] === "acknowledged" });
  const rules = rulesFor(m, venue);
  const texts = m.sections.map((s) => ({ ...s, text: plainText(s.html) }));
  const allText = texts.map((s) => s.text).join(" ");
  for (const title of rules.required) {
    const s = texts.find((s) => s.title.toLowerCase() === title.toLowerCase());
    if (!s?.text || s.text === ".") add({ id: `section:${title}`, severity: "error", category: "Venue", location: title, ...(s ? { sectionId: s.id } : {}), title: `Complete ${title}`, explanation: "This required section is missing or empty.", compared: `${venue} selected requirements ↔ manuscript sections` });
  }
  const abstract = texts.find((s) => s.title.toLowerCase() === "abstract");
  if (abstract && wordCount(abstract.html) > rules.abstractLimit) add({ id: "abstract-limit", severity: "error", category: "Venue", location: "Abstract", sectionId: abstract.id, title: "Abstract exceeds selected limit", explanation: `Reduce to ${rules.abstractLimit} words or update the venue rules.`, compared: `${wordCount(abstract.html)} words ↔ ${rules.abstractLimit} word limit` });
  if (keywords.length > rules.keywordLimit) add({ id: "keywords-limit", severity: "error", category: "Venue", location: "Project keywords", title: "Too many keywords", explanation: "Edit project keywords or confirm the selected venue limit.", compared: `${keywords.length} keywords ↔ ${rules.keywordLimit} limit` });
  const used = new Set(Array.from(allText.matchAll(/\[\[cite:([^\]]+)\]\]/g), (match) => match[1]));
  for (const id of used) if (!m.references.some((r) => r.id === id)) {
    const s = texts.find((s) => s.text.includes(`[[cite:${id}]]`));
    add({ id: `missing:${id}`, severity: "error", category: "Citations", location: s?.title ?? "Manuscript", ...(s ? { sectionId: s.id } : {}), title: "Citation has no reference", explanation: "Restore this reference or remove its citation from the manuscript.", compared: `Citation ${id} ↔ reference library` });
  }
  const seen = new Map<string, Reference>();
  for (const r of m.references) {
    if (!used.has(r.id)) add({ id: `unused:${r.id}`, severity: "warning", category: "Citations", location: "Reference library", title: "Unused reference", explanation: "Cite this source or remove it from the project bibliography.", compared: `${r.title} ↔ manuscript citations` });
    if (!r.authors.trim() || !/^\d{4}$/.test(r.year) || !r.title.trim()) add({ id: `metadata:${r.id}`, severity: "error", category: "Citations", location: "Reference library", title: "Incomplete reference metadata", explanation: "A reference needs a title, authors and a four-digit year.", compared: `${r.title || "Untitled reference"} ↔ required citation fields` });
    const key = (r.doi || r.title).trim().toLowerCase().replace(/^https?:\/\/(dx\.)?doi.org\//, "");
    const prev = seen.get(key);
    if (key && prev) add({ id: `duplicate:${r.id}`, severity: "error", category: "Citations", location: "Reference library", title: "Duplicate reference", explanation: "These sources have the same DOI or title. Merge them and update citations.", compared: `${prev.title} ↔ ${r.title}` });
    seen.set(key, r);
  }
  // Repeated labels are warnings because similarly named experiments can legitimately differ.
  const metrics = new Map<string, { value: string; location: string; sectionId?: string }[]>();
  for (const s of texts) {
    for (const match of s.text.matchAll(/\b(accuracy|precision|recall|f1|auc)\s*(?:score\s*)?(?:of|is|was|:|=)?\s*(\d+(?:\.\d+)?)\s*%/gi)) {
      const key = (match[1] ?? "").toLowerCase();
      const entries = metrics.get(key) ?? []; entries.push({ value: match[2] ?? "", location: s.title, sectionId: s.id }); metrics.set(key, entries);
    }
    for (const [i, sentence] of s.text.split(/(?<=[.!?])\s+/).entries()) {
      if (/\b(significantly|state-of-the-art|outperforms|best ever|proves)\b/i.test(sentence) && !/\[\[(cite|fig):|\bp\s*[<=>]|\btable\s*\d/i.test(sentence)) add({ id: `claim:${s.id}:${i}`, severity: "warning", category: "Integrity", location: s.title, sectionId: s.id, title: "Review strong claim", explanation: "Rule-based screening found strong wording without a citation, figure, table or p-value in the same sentence. This is not a semantic assessment.", compared: sentence });
    }
  }
  const linkedResults = new Map(m.experiments.flatMap((experiment) => experiment.results.map((result) => [result.id, { experiment, result }])));
  for (const [figureIndex, f] of m.figures.entries()) {
    for (const [rowIndex, row] of f.data.entries()) {
      const match = row.label.match(/\b(accuracy|precision|recall|f1|auc)\b/i);
      if (match) {
        const key = match[1].toLowerCase(); const entries = metrics.get(key) ?? [];
        entries.push({ value: String(row.value), location: `Figure ${figureIndex + 1} · ${row.label}` }); metrics.set(key, entries);
      }
      const linked = linkedResults.get(f.resultIds[rowIndex] ?? "");
      if (linked && linked.result.value !== row.value) add({ id: `figure-value:${f.id}:${linked.result.id}`, severity: "error", category: "Integrity", location: "Figures", title: "Figure value differs from linked result", explanation: "This chart row is explicitly linked to an experiment result, so the exact numeric values must match. Update the chart or the result record.", compared: `${linked.experiment.name} · ${linked.result.metric}: ${linked.result.value} ↔ Figure ${figureIndex + 1} · ${row.label}: ${row.value}` });
    }
  }
  for (const [metric, entries] of metrics) if (new Set(entries.map((e) => Number(e.value))).size > 1) {
    const first = entries[0];
    add({ id: `metric:${metric}`, severity: "warning", category: "Integrity", location: first?.location ?? "Manuscript", ...(first?.sectionId ? { sectionId: first.sectionId } : {}), title: `Review differing ${metric} values`, explanation: "Repeated metric labels have different numbers across text, tables or figures. They may describe different experiments; confirm the context before treating this as an error.", compared: entries.map((e) => `${e.location}: ${e.value}%`).join(" ↔ ") });
  }
  for (const item of reproducibility(m)) if (!item.reported) add({ id: `repro:${item.name}`, severity: "warning", category: "Reproducibility", location: "Methods", title: `${item.name} not detected`, explanation: "Keyword screening did not find a concrete disclosure. Report the detail or review this warning. This is not a semantic reproducibility assessment.", compared: `Manuscript text ↔ ${item.name} disclosure` });
  for (const [index, f] of m.figures.entries()) {
    if (!f.caption.trim()) add({ id: `caption:${f.id}`, severity: "error", category: "Formatting", location: "Figures", title: "Figure is missing its caption", explanation: "Add a descriptive caption before exporting.", compared: `Figure ${index + 1} ↔ caption` });
    if (!allText.includes(`[[fig:${f.id}]]`)) add({ id: `figure-unused:${f.id}`, severity: "warning", category: "Formatting", location: "Figures", title: "Figure is not referenced", explanation: "Insert a figure reference in the manuscript.", compared: `Figure ${index + 1} ↔ manuscript` });
    const requiredPixels = f.width === "double" ? 2100 : 1050;
    if (f.kind === "image" && f.imageWidth > 0 && f.imageWidth < requiredPixels) add({ id: `resolution:${f.id}`, severity: "warning", category: "Formatting", location: "Figures", title: "Image may be below print resolution", explanation: `At 300 DPI, this ${f.width}-column image should be about ${requiredPixels} pixels wide. Confirm the venue's artwork rules.`, compared: `${f.imageWidth} pixels ↔ approximately ${requiredPixels} pixels for 300 DPI` });
  }
  const ai = m.semanticReview;
  if (ai) {
    for (const [index, f] of ai.result.findings.entries()) add({ id: `ai:${ai.id}:${index}`, severity: "warning", category: "Integrity", location: m.sections.find((s) => s.id === f.sectionId)?.title ?? "AI review", ...(f.sectionId ? { sectionId: f.sectionId } : {}), title: `AI review: ${f.title}`, explanation: `${f.explanation} Confidence: ${f.confidence}. This contextual finding is a potential issue, not a confirmed scientific error.`, compared: `${f.quote} ↔ ${f.evidence}` });
    for (const r of ai.result.reproducibility) if (r.status !== "reported") add({ id: `ai-repro:${ai.id}:${r.item}`, severity: "warning", category: "Reproducibility", location: "AI review", title: `AI review: ${r.item} ${r.status}`, explanation: `${r.explanation} This semantic assessment requires author review.`, compared: r.quote || `Saved manuscript ↔ ${r.item} disclosure` });
  }
  return findings.sort((a, b) => (a.severity === "error" ? 0 : 1) - (b.severity === "error" ? 0 : 1));
}
export const CATEGORIES: Finding["category"][] = ["Integrity", "Citations", "Formatting", "Reproducibility", "Venue"];
export function readiness(findings: Finding[]) {
  const breakdown = CATEGORIES.map((category) => {
    const issues = findings.filter((f) => f.category === category);
    return { category, score: Math.max(0, 20 - issues.reduce((sum, f) => sum + (f.severity === "error" ? 5 : f.acknowledged ? 1 : 2), 0)), issues };
  });
  return { score: breakdown.reduce((sum, item) => sum + item.score, 0), breakdown, blockers: findings.filter((f) => f.severity === "error"), warnings: findings.filter((f) => f.severity === "warning" && !f.acknowledged) };
}
