import { Cite, plugins } from "@citation-js/core";
import "@citation-js/plugin-csl";
import type { Reference } from "./manuscript";
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