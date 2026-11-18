import { Cite, plugins } from "@citation-js/core";
import "@citation-js/plugin-csl";
import type { Manuscript, Reference } from "./manuscript";
import type { Venue } from "./projects";

export function citationLabel(r: Reference, index: number, venue: Venue) {
  if (venue !== "APA") return `[${index + 1}]`;
  const authors = r.authors.split(";").map((a) => a.trim().split(",")[0]).filter(Boolean);
  return `(${authors[0] || "Unknown"}${authors.length > 2 ? " et al." : authors.length === 2 ? ` & ${authors[1]}` : ""}, ${r.year || "n.d."})`;
}
export function bibliography(refs: Reference[], venue: Venue): string[] {
  const template = venue === "APA" ? "apa" : venue.toLowerCase();
  // CSL templates are bundled locally; formatting never sends manuscripts to a third party.
  return refs.map((r, i) => {
    const cite = new Cite([{ id: r.id, type: "article-journal", title: r.title, author: r.authors.split(";").filter(Boolean).map((name) => {
      const [family, given] = name.trim().split(","); return { family: family?.trim() ?? name, given: given?.trim() ?? "" };
    }), issued: { "date-parts": [[Number(r.year) || 0]] }, "container-title": r.venue, DOI: r.doi, URL: r.url }]);
    const output = cite.format("bibliography", { format: "text", style: template, lang: "en-US" }) as string;
    return venue === "APA" ? output.trim() : `[${i + 1}] ${output.trim().replace(/^\s*(?:\[\d+\]|\d+\.)\s*/, "")}`;
  });
}
export function registerStyles(styles: Record<string, string>) {
  const csl = plugins.config.get("@csl") as unknown as { styles: { add: (name: string, xml: string) => void } };
  for (const [name, xml] of Object.entries(styles)) csl.styles.add(name, xml);
}
/** Numbered venues list sources in order of first citation; APA sorts alphabetically by first author. */
export function orderedReferences(m: Manuscript, venue: Venue): Reference[] {
  if (venue === "APA") return [...m.references].sort((a, b) => `${a.authors}${a.year}`.localeCompare(`${b.authors}${b.year}`));
  const order: string[] = [];
  for (const s of m.sections) for (const match of s.html.matchAll(/\[\[cite:([^\]]+)\]\]/g)) if (!order.includes(match[1]!)) order.push(match[1]!);
  const rank = (r: Reference) => { const i = order.indexOf(r.id); return i < 0 ? order.length + m.references.indexOf(r) : i; };
  return [...m.references].sort((a, b) => rank(a) - rank(b));
}
export function citationLabels(m: Manuscript, venue: Venue): Record<string, string> {
  return Object.fromEntries(orderedReferences(m, venue).map((r, i) => [r.id, citationLabel(r, i, venue)]));
}
