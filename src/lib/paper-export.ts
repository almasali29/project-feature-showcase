import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, ImageRun, AlignmentType, Header, Footer, PageNumber, ExternalHyperlink, Math as OMath, MathRun, TabStopType } from "docx";
import { headingNumber, headingText, profileFor } from "./publisher-profiles";
import type { Figure } from "./manuscript";
import { floatLabels, floatsFor } from "./floats";
import type { Manuscript } from "./manuscript";
import type { Project } from "./projects";
import { rulesFor } from "./manuscript";
import { bibliography, orderedReferences } from "./citations";
import { equationStart, renderSection } from "@/components/paper-preview";

export async function wordBlob(m: Manuscript, project: Project) {
  const rules = rulesFor(m, project.target_venue);
  const p = profileFor(project.target_venue); const body = rules.fontSize * 2;
  const children: (Paragraph | Table)[] = [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: project.title, size: Math.round(p.font.titlePt * 2), bold: project.target_venue !== "IEEE" })] }), ...m.authors.split("\n").map((line) => new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun(line)] }))];
  const indent = Math.round(p.paragraph.indentEm * rules.fontSize * 20);
  const run = (child: ChildNode, extra: { bold?: boolean; italics?: boolean } = {}): TextRun[] => {
    if (child.nodeType === 3) return [new TextRun({ text: child.textContent ?? "", ...extra })];
    const el = child as HTMLElement; const next = { bold: extra.bold || el.tagName === "STRONG" || el.tagName === "B", italics: extra.italics || el.tagName === "EM" || el.tagName === "I" };
    if (el.tagName === "SUP") return [new TextRun({ text: el.textContent ?? "", superScript: true, ...next })];
    if (el.tagName === "SUB") return [new TextRun({ text: el.textContent ?? "", subScript: true, ...next })];
    return Array.from(el.childNodes).flatMap((c) => run(c, next));
  };
  const labels = floatLabels(m, project.target_venue);
  const align = (el: Element) => { const a = (el as HTMLElement).style?.textAlign; return a === "center" ? AlignmentType.CENTER : a === "right" ? AlignmentType.RIGHT : a === "justify" ? AlignmentType.JUSTIFIED : AlignmentType.LEFT; };
  async function float(f: Figure) {
    const l = labels[f.id]; if (!l) return;
    const caption = new Paragraph({ alignment: project.target_venue === "APA" ? AlignmentType.LEFT : AlignmentType.CENTER, children: [new TextRun({ text: `${l.caption} `, bold: project.target_venue !== "IEEE" }), new TextRun({ text: l.captionText, italics: project.target_venue === "APA" })] });
    if (l.above) children.push(caption);
    if (f.image) {
      const img = new Image(); img.src = f.image; await img.decode().catch(() => undefined);
      const maxW = rules.columns === 2 ? 300 : 560; const w = Math.min(maxW, img.naturalWidth || maxW); const h = Math.round(w * ((img.naturalHeight || 3) / (img.naturalWidth || 4)));
      const bytes = Uint8Array.from(atob(f.image.split(",")[1] ?? ""), (c) => c.charCodeAt(0));
      children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ type: f.image.includes("image/png") ? "png" : "jpg", data: bytes, transformation: { width: w, height: h } })] }));
    } else if (f.data.length) children.push(new Table({ rows: f.data.map((row) => new TableRow({ children: [row.label, String(row.value)].map((text) => new TableCell({ children: [new Paragraph(text)] })) })) }));
    if (!l.above) children.push(caption);
  }
  let num = 0;
  for (const [index, s] of m.sections.entries()) {
    const isAbstract = s.title.toLowerCase() === "abstract"; if (!isAbstract) num++;
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, alignment: p.headings.align === "center" ? AlignmentType.CENTER : AlignmentType.LEFT, children: [new TextRun({ text: `${isAbstract ? "" : headingNumber(p, num)}${headingText(p, s.title)}`, bold: p.headings.bold, smallCaps: p.headings.case === "smallcaps", size: p.font.headingPt * 2, font: p.font.docx, color: "000000" })] }));
    const container = document.createElement("div"); container.innerHTML = renderSection(s.html, m, project, { eqStart: equationStart(m, index), word: true });
    for (const node of Array.from(container.children)) {
      if (node.tagName === "TABLE") {
        children.push(new Table({ rows: Array.from(node.querySelectorAll("tr")).map((row) => new TableRow({ children: Array.from(row.querySelectorAll("td, th")).map((cell) => new TableCell({ children: [new Paragraph(cell.textContent ?? "")] })) })) }));
      } else if (node.getAttribute("data-eq")) {
        children.push(new Paragraph({ tabStops: [{ type: TabStopType.CENTER, position: 4500 }, { type: TabStopType.RIGHT, position: rules.columns === 2 ? 4800 : 9000 }], children: [new TextRun("\t"), new OMath({ children: [new MathRun(node.textContent ?? "")] }), new TextRun(`\t${node.getAttribute("data-eq")}`)] }));
      } else if (node.tagName === "UL" || node.tagName === "OL") {
        Array.from(node.children).forEach((li, i) => children.push(new Paragraph({ indent: { left: 360 }, children: [new TextRun(node.tagName === "OL" ? `${i + 1}. ` : "• "), ...run(li)] })));
      } else {
        const a = align(node);
        children.push(new Paragraph({ alignment: a === AlignmentType.LEFT && p.paragraph.justify ? AlignmentType.JUSTIFIED : a, indent: { firstLine: isAbstract ? 0 : indent }, spacing: { line: Math.round(p.font.lineHeight * 240) }, children: run(node) }));
      }
    }
    if (isAbstract && project.keywords.length) children.push(new Paragraph({ children: [new TextRun({ text: project.target_venue === "IEEE" ? "Index Terms—" : "Keywords: ", bold: true }), new TextRun(project.keywords.join(", "))] }));
    for (const f of floatsFor(m, s.id)) await float(f);
  }
  for (const f of floatsFor(m, undefined)) await float(f);
  const ordered = orderedReferences(m, project.target_venue);
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, alignment: p.headings.align === "center" ? AlignmentType.CENTER : AlignmentType.LEFT, children: [new TextRun({ text: headingText(p, "References"), bold: p.headings.bold, smallCaps: p.headings.case === "smallcaps", size: p.font.headingPt * 2, font: p.font.docx, color: "000000" })] }),
    ...bibliography(ordered, project.target_venue).map((text, i) => { const r = ordered[i]; const href = r?.doi ? `https://doi.org/${r.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//, "")}` : r?.url;
      return new Paragraph({ indent: { left: 440, hanging: 440 }, children: [new TextRun({ text, size: body - 2 }), ...(href && !text.includes(href) ? [new TextRun(" "), new ExternalHyperlink({ link: href, children: [new TextRun({ text: href, style: "Hyperlink", size: body - 2 })] })] : [])] }); }));
  const margin = Math.round(rules.margin * 56.693);
  const tw = (mm: number) => Math.round(mm * 56.693);
  const headerText = p.header(project.title);
  const pageNo = new Paragraph({ alignment: p.footer === "right" ? AlignmentType.RIGHT : AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], size: 18 })] });
  const doc = new Document({ styles: { default: { document: { run: { font: p.font.docx, size: body } } } }, sections: [{ properties: { page: { size: { width: tw(p.page.widthMm), height: tw(p.page.heightMm) }, margin: { top: margin, bottom: margin, left: margin, right: margin } }, column: { count: rules.columns, space: tw(p.columnGapMm || 6) } }, headers: { default: new Header({ children: headerText ? [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: headerText, size: 16 })] })] : [] }) }, footers: { default: new Footer({ children: [pageNo] }) }, children }] });
  return Packer.toBlob(doc);
}
export async function exportWord(m: Manuscript, project: Project) {
  const blob = await wordBlob(m, project);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = `${project.title.replace(/[^a-z0-9 -]/gi, "") || "manuscript"}.docx`;
  document.body.append(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10000);
}
export async function exportPackage(m: Manuscript, project: Project, report: string) {
  const { zipSync, strToU8 } = await import("fflate");
  const word = new Uint8Array(await (await wordBlob(m, project)).arrayBuffer());
  const zipped = zipSync({ "manuscript.docx": word, "readiness-report.txt": strToU8(report), "manuscript-source.json": strToU8(JSON.stringify(m, null, 2)), "README.txt": strToU8("Review the Word file and export your formatted PDF separately. Confirm all publisher requirements. This package is not automatically submitted.") });
  const url = URL.createObjectURL(new Blob([new Uint8Array(zipped)], { type: "application/zip" }));
  const a = document.createElement("a"); a.href = url; a.download = "submission-draft.zip"; a.click(); window.setTimeout(() => URL.revokeObjectURL(url), 10000);
}