import DOMPurify from "dompurify";
import katex from "katex";
import { BarChart, Bar, LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import type { Manuscript, Figure } from "@/lib/manuscript";
import { rulesFor } from "@/lib/manuscript";
import type { Project } from "@/lib/projects";
import { bibliography, citationLabel, registerStyles } from "@/lib/citations";
import ieee from "@/assets/csl/ieee.csl?raw";
import springer from "@/assets/csl/springer.csl?raw";
import acm from "@/assets/csl/acm.csl?raw";
import elsevier from "@/assets/csl/elsevier.csl?raw";
registerStyles({ ieee, springer, acm, elsevier });

export function renderSection(html: string, m: Manuscript, project: Project) {
  const safe = DOMPurify.sanitize(html);
  return safe.replace(/\[\[cite:([^\]]+)\]\]/g, (_match, id: string) => {
    const index = m.references.findIndex((r) => r.id === id); const r = m.references[index]; return r ? DOMPurify.sanitize(citationLabel(r, index, project.target_venue)) : "[Missing reference]";
  }).replace(/\[\[fig:([^\]]+)\]\]/g, (_match, id: string) => { const index = m.figures.findIndex((f) => f.id === id); return index < 0 ? "[Missing figure]" : `Figure ${index + 1}`; }).replace(/\$\$([^$]+)\$\$/g, (_match, tex: string) => katex.renderToString(tex, { throwOnError: false, trust: false }));
}
export function FigureView({ figure }: { figure: Figure }) {
  if (figure.kind === "image") return <img src={figure.image} alt={figure.caption || "Manuscript figure"} className="mx-auto max-h-96 max-w-full object-contain" />;
  const grid = <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />;
  const axes = [<XAxis key="x" dataKey="label" tick={{ fill: "var(--foreground)", fontSize: 11 }} />, <YAxis key="y" tick={{ fill: "var(--foreground)", fontSize: 11 }} />, <Tooltip key="tooltip" />];
  const color = figure.grayscale ? "var(--foreground)" : "var(--primary)";
  return <div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%">{figure.kind === "line" ? <LineChart data={figure.data}>{grid}{axes}<Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} /></LineChart> : figure.kind === "scatter" ? <ScatterChart>{grid}{axes}<Scatter data={figure.data} dataKey="value" fill={color} /></ScatterChart> : <BarChart data={figure.data}>{grid}{axes}<Bar dataKey="value" fill={color} /></BarChart>}</ResponsiveContainer><p className="text-center text-xs text-muted-foreground">{figure.xLabel} · {figure.yLabel}</p></div>;
}
export function PaperPreview({ manuscript: m, project }: { manuscript: Manuscript; project: Project }) {
  const rules = rulesFor(m, project.target_venue);
  const refs = bibliography(m.references, project.target_venue);
  return <article id="paper-preview" className={`paper-page manuscript-prose venue-${project.target_venue.toLowerCase()} ${rules.columns === 2 ? "paper-two-columns" : ""}`} style={{ "--paper-font-size": `${rules.fontSize}pt`, "--paper-margin": `${rules.margin}mm` } as React.CSSProperties}>
    <header className="mb-6 text-center"><h1>{project.title}</h1><p>{m.authors}</p></header>
    <div className="paper-body">{m.sections.map((s, index) => <div key={s.id} className="mb-5"><h2>{s.title === "Abstract" ? "" : `${index}. `}{s.title}</h2><div dangerouslySetInnerHTML={{ __html: renderSection(s.html, m, project) }} /></div>)}
    {m.figures.map((f, i) => <figure key={f.id} className="my-8 break-inside-avoid"><FigureView figure={f} /><figcaption className="mt-4 text-center">Figure {i + 1}. {f.caption}</figcaption></figure>)}
    {!!project.keywords.length && <p><strong>Keywords: </strong>{project.keywords.join(", ")}</p>}
    {!!refs.length && <div className="mt-8"><h2>References</h2>{refs.map((ref, i) => <p key={m.references[i]?.id ?? i} className="break-words">{ref}</p>)}</div>}</div>
  </article>;
}