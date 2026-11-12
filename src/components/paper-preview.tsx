import DOMPurify from "dompurify";
import katex from "katex";
import type { Manuscript, Figure } from "@/lib/manuscript";
import { rulesFor, tableKey, tableNumber } from "@/lib/manuscript";
import type { Project } from "@/lib/projects";
import { bibliography, citationLabel, registerStyles } from "@/lib/citations";
import { figureSvg } from "@/lib/figure-svg";
import { GraphCanvas } from "./graph-canvas";
import ieee from "@/assets/csl/ieee.csl?raw";
import springer from "@/assets/csl/springer.csl?raw";
import acm from "@/assets/csl/acm.csl?raw";
import elsevier from "@/assets/csl/elsevier.csl?raw";
registerStyles({ ieee, springer, acm, elsevier });

export function renderSection(html: string, m: Manuscript, project: Project, sectionId?: string) {
  let tableIndex = 0;
  const safe = DOMPurify.sanitize(html).replace(/<table\b[^>]*>/gi, (tag) => {
    const index = tableIndex++; const number = sectionId ? tableNumber(m, sectionId, index) : index + 1;
    const caption = sectionId ? m.tableCaptions[tableKey(sectionId, index)] : "";
    return `${tag}<caption class="table-caption">Table ${number}${caption ? `. ${DOMPurify.sanitize(caption)}` : ""}</caption>`;
  });
  return safe.replace(/\[\[cite:([^\]]+)\]\](?:\s+(?=[.,;:!?]))?/g, (_match, id: string) => {
    const index = m.references.findIndex((r) => r.id === id); const r = m.references[index]; return r ? DOMPurify.sanitize(citationLabel(r, index, project.target_venue)) : "[Missing reference]";
  }).replace(/\[\[fig:([^\]]+)\]\](?:\s+(?=[.,;:!?]))?/g, (_match, id: string) => { const index = m.figures.findIndex((f) => f.id === id); return index < 0 ? "[Missing figure]" : `Figure ${index + 1}`; }).replace(/\$\$([^$]+)\$\$/g, (_match, tex: string) => katex.renderToString(tex, { throwOnError: false, trust: false }));
}
export function FigureView({ figure }: { figure: Figure }) {
  if (figure.kind === "image") return <img src={figure.image} alt={figure.caption || "Manuscript figure"} className="mx-auto max-h-96 max-w-full object-contain" />;
  if (figure.kind === "diagram") return <GraphCanvas nodes={figure.diagram.nodes} edges={figure.diagram.edges} label={figure.caption || "Manuscript diagram"} />;
  return <div className="w-full overflow-x-auto" dangerouslySetInnerHTML={{ __html: figureSvg(figure) }} />;
}
export function PaperPreview({ manuscript: m, project }: { manuscript: Manuscript; project: Project }) {
  const rules = rulesFor(m, project.target_venue);
  const refs = bibliography(m.references, project.target_venue);
  return <article id="paper-preview" className={`paper-page manuscript-prose venue-${project.target_venue.toLowerCase()} ${rules.columns === 2 ? "paper-two-columns" : ""}`} style={{ "--paper-font-size": `${rules.fontSize}pt`, "--paper-margin": `${rules.margin}mm` } as React.CSSProperties}>
    <header className="mb-6 text-center"><h1>{project.title}</h1><p>{m.authors}</p></header>
    <div className="paper-body">{m.sections.map((s, index) => <div key={s.id} className="mb-5"><h2>{s.title === "Abstract" ? "" : `${index}. `}{s.title}</h2><div dangerouslySetInnerHTML={{ __html: renderSection(s.html, m, project, s.id) }} /></div>)}
    {m.figures.map((f, i) => <figure key={f.id} className={`my-8 break-inside-avoid ${f.width === "double" ? "[column-span:all]" : ""}`}><FigureView figure={f} /><figcaption className="mt-4 text-center">Figure {i + 1}. {f.caption}</figcaption></figure>)}
    {!!project.keywords.length && <p><strong>Keywords: </strong>{project.keywords.join(", ")}</p>}
    {!!refs.length && <div className="mt-8"><h2>References</h2>{refs.map((ref, i) => <p key={m.references[i]?.id ?? i} className="break-words">{ref}</p>)}</div>}</div>
  </article>;
}
