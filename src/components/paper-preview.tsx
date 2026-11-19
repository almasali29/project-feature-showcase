import DOMPurify from "dompurify";
import katex from "katex";
import { BarChart, Bar, LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import type { Manuscript, Figure } from "@/lib/manuscript";
import { rulesFor } from "@/lib/manuscript";
import type { Project } from "@/lib/projects";
import { floatLabels, floatsFor } from "@/lib/floats";
import { bibliography, citationLabels, orderedReferences, registerStyles } from "@/lib/citations";
import { headingNumber, headingText, pageCss, profileFor } from "@/lib/publisher-profiles";
import ieee from "@/assets/csl/ieee.csl?raw";
import springer from "@/assets/csl/springer.csl?raw";
import acm from "@/assets/csl/acm.csl?raw";
import elsevier from "@/assets/csl/elsevier.csl?raw";
registerStyles({ ieee, springer, acm, elsevier });

/** A paragraph containing only $$…$$ is a numbered display equation; other $$…$$ are inline. */
const DISPLAY_EQ = /<p[^>]*>\s*\$\$([^$]+)\$\$\s*<\/p>/g;
export function equationStart(m: Manuscript, sectionIndex: number) {
  return m.sections.slice(0, sectionIndex).reduce((n, s) => n + (s.html.match(DISPLAY_EQ)?.length ?? 0), 0);
}
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
export function renderSection(html: string, m: Manuscript, project: Project, opts: { eqStart?: number; word?: boolean } = {}) {
  const venue = project.target_venue; const labels = citationLabels(m, venue); const floats = floatLabels(m, venue);
  let n = opts.eqStart ?? 0;
  const safe = DOMPurify.sanitize(html);
  return safe
    .replace(/\[\[cite:([^\]]+)\]\](?:\s+(?=[.,;:!?]))?/g, (_x, id: string) => { const l = labels[id]; return l ? (opts.word ? `<a data-ref="${esc(id)}">${esc(l)}</a>` : `<a class="cite-link" href="#ref-${esc(id)}">${esc(l)}</a>`) : "[Missing reference]"; })
    .replace(/\](<\/a>)?(\s+)(<a[^>]*>)?\[(?=\d+\])/g, (_x, close = "", _s, open = "") => `]${close}, ${open}[`)
    .replace(/\)(<\/a>)?\s+(<a[^>]*>)?\((?=[^()]*, (?:\d{4}|n\.d\.)\))/g, (_x, close = "", open = "") => `${close}; ${open}`)
    .replace(/\[\[fig:([^\]]+)\]\](?:\s+(?=[.,;:!?]))?/g, (_x, id: string) => floats[id]?.ref ?? "[Missing figure]")
    .replace(DISPLAY_EQ, (_x, tex: string) => { n++; const label = profileFor(venue).equations.label(n);
      return opts.word ? `<p data-eq="${esc(label)}">${esc(tex)}</p>` : `<div class="paper-equation"><span class="eq-body">${katex.renderToString(tex, { throwOnError: false, trust: false, displayMode: true })}</span><span class="eq-num">${label}</span></div>`; })
    .replace(/\$\$([^$]+)\$\$/g, (_x, tex: string) => opts.word ? esc(tex) : katex.renderToString(tex, { throwOnError: false, trust: false }));
}
export function FigureView({ figure }: { figure: Figure }) {
  if (figure.kind === "table" && figure.rows?.length) { const [head = [], ...body] = figure.rows; const al = (i: number) => ({ textAlign: figure.align?.[i] ?? "left" }) as React.CSSProperties;
    return <div className="paper-table-wrap"><table className="paper-table"><thead><tr>{head.map((c, i) => <th key={i} style={al(i)}>{c}</th>)}</tr></thead><tbody>{body.map((r, j) => <tr key={j}>{r.map((c, i) => <td key={i} style={al(i)}>{c}</td>)}</tr>)}</tbody></table></div>; }
  if (figure.kind === "image" || figure.kind === "table") return <img src={figure.image} alt={figure.caption || "Manuscript figure"} className="mx-auto max-h-96 max-w-full object-contain" />;
  const grid = <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />;
  const axes = [<XAxis key="x" dataKey="label" tick={{ fill: "var(--foreground)", fontSize: 11 }} />, <YAxis key="y" tick={{ fill: "var(--foreground)", fontSize: 11 }} />, <Tooltip key="tooltip" />];
  const color = figure.grayscale ? "var(--foreground)" : "var(--primary)";
  return <div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%">{figure.kind === "line" ? <LineChart data={figure.data}>{grid}{axes}<Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} isAnimationActive={false} /></LineChart> : figure.kind === "scatter" ? <ScatterChart>{grid}{axes}<Scatter data={figure.data} dataKey="value" fill={color} isAnimationActive={false} /></ScatterChart> : <BarChart data={figure.data}>{grid}{axes}<Bar dataKey="value" fill={color} isAnimationActive={false} /></BarChart>}</ResponsiveContainer><p className="text-center text-xs text-muted-foreground">{figure.xLabel} · {figure.yLabel}</p></div>;
}
function linkify(text: string, doi: string, url: string) {
  const href = doi ? `https://doi.org/${doi.replace(/^https?:\/\/(dx\.)?doi\.org\//, "")}` : url;
  if (!href) return text;
  const at = doi ? text.search(/(doi:|https?:\/\/(dx\.)?doi\.org\/|10\.\d{4,})/i) : text.indexOf(url);
  return <>{at >= 0 ? text.slice(0, at) : text}{at >= 0 ? <a href={href} target="_blank" rel="noreferrer" className="paper-link">{text.slice(at)}</a> : <> <a href={href} target="_blank" rel="noreferrer" className="paper-link">{href}</a></>}</>;
}
export function PaperPreview({ manuscript: m, project }: { manuscript: Manuscript; project: Project }) {
  const rules = rulesFor(m, project.target_venue); const p = profileFor(project.target_venue);
  const ordered = orderedReferences(m, project.target_venue); const refs = bibliography(ordered, project.target_venue);
  let num = 0;
  const style = { "--paper-font-size": `${rules.fontSize}pt`, "--paper-margin": `${rules.margin}mm`, "--paper-width": `${p.page.widthMm}mm`, "--paper-font": p.font.family, "--paper-line": p.font.lineHeight, "--paper-title": `${p.font.titlePt}pt`, "--paper-heading": `${p.font.headingPt}pt`, "--paper-indent": `${p.paragraph.indentEm}em`, "--paper-gap": `${p.columnGapMm || 6}mm`, "--heading-align": p.headings.align, "--heading-weight": p.headings.bold ? 700 : 400, "--para-align": p.paragraph.justify ? "justify" : "left" } as React.CSSProperties;
  return <article id="paper-preview" data-template={p.template} className={`paper-page manuscript-prose venue-${project.target_venue.toLowerCase()} heading-${p.headings.case} ${rules.columns === 2 ? "paper-two-columns" : ""}`} style={style}>
    <style>{`@media print { ${pageCss(p, rules.margin, project.title)} }`}</style>
    <header className="paper-title-block"><h1>{project.title}</h1><p className="whitespace-pre-line">{m.authors}</p></header>
    <div className="paper-body">{m.sections.map((s, index) => { const isAbstract = s.title.toLowerCase() === "abstract"; if (!isAbstract) num++;
      return <section key={s.id} className={isAbstract ? "paper-abstract" : "paper-section"}><h2>{isAbstract ? "" : headingNumber(p, num)}{headingText(p, s.title)}</h2><div dangerouslySetInnerHTML={{ __html: renderSection(s.html, m, project, { eqStart: equationStart(m, index) }) }} />
        {isAbstract && !!project.keywords.length && <p className="paper-keywords"><strong>{project.target_venue === "IEEE" ? "Index Terms—" : "Keywords: "}</strong>{project.keywords.join(", ")}</p>}
        {floatsFor(m, s.id).map((f) => <Float key={f.id} f={f} m={m} project={project} />)}</section>; })}
    {floatsFor(m, undefined).map((f) => <Float key={f.id} f={f} m={m} project={project} />)}
    {!!refs.length && <section className="paper-references"><h2>{project.target_venue === "IEEE" || project.target_venue === "ACM" ? headingText(p, "References") : "References"}</h2>{refs.map((ref, i) => { const r = ordered[i]; return <p key={r?.id ?? i} id={r ? `ref-${r.id}` : undefined} className="paper-ref break-words">{r ? linkify(ref, r.doi, r.url) : ref}</p>; })}</section>}</div>
  </article>;
}
function Float({ f, m, project }: { f: Figure; m: Manuscript; project: Project }) {
  const l = floatLabels(m, project.target_venue)[f.id]; if (!l) return null;
  const cap = <figcaption className={`float-caption ${l.above ? "mb-2" : "mt-2"} ${f.kind === "table" && project.target_venue === "IEEE" ? "float-caption-ieee-table" : ""}`}><span className="float-label">{l.caption}</span>{project.target_venue === "IEEE" && f.kind === "table" ? <br /> : " "}<span className={project.target_venue === "APA" ? "italic" : ""}>{l.captionText}</span></figcaption>;
  return <figure id={`float-${f.id}`} className="paper-float my-5 break-inside-avoid">{l.above && cap}<FigureView figure={f} />{!l.above && cap}</figure>;
}
