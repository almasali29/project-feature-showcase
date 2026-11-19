import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, ImageRun, AlignmentType, Header, Footer, PageNumber, ExternalHyperlink, InternalHyperlink, Bookmark, BorderStyle, WidthType, Math as OMath, MathRun, TabStopType, type ParagraphChild } from "docx";
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
  const children: (Paragraph | Table)[] = [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 120 }, children: [new TextRun({ text: project.title, size: Math.round(p.font.titlePt * 2), bold: project.target_venue !== "IEEE" })] }), ...m.authors.split("\n").map((line) => new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun(line)] }))];
  const margin = Math.round(rules.margin * 56.693);
  const tw = (mm: number) => Math.round(mm * 56.693);
  const indent = Math.round(p.paragraph.indentEm * rules.fontSize * 20);
  const bm = (id: string) => `ref_${id.replace(/[^a-zA-Z0-9]/g, "")}`.slice(0, 40);
  const rule = (size: number) => ({ style: BorderStyle.SINGLE, size, color: "000000" });
  const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  const fullW = rules.columns === 2 ? Math.round((tw(p.page.widthMm) - 2 * margin - tw(p.columnGapMm || 6)) / 2) : tw(p.page.widthMm) - 2 * margin;
  /** Booktabs-style table: top/bottom rules, rule under bold heading row, no vertical lines. */
  const academicTable = (rows: string[][], align?: string[]) => {
    const cols = Math.max(1, ...rows.map((r) => r.length)); const cw = Math.floor(fullW / cols);
    return new Table({ width: { size: cw * cols, type: WidthType.DXA }, columnWidths: Array(cols).fill(cw), alignment: AlignmentType.CENTER,
      borders: { top: rule(12), bottom: rule(12), left: none, right: none, insideHorizontal: none, insideVertical: none },
      rows: rows.map((r, ri) => new TableRow({ tableHeader: ri === 0, cantSplit: true, children: Array.from({ length: cols }, (_, ci) => new TableCell({ width: { size: cw, type: WidthType.DXA }, margins: { top: 30, bottom: 30, left: 80, right: 80 },
        borders: { top: none, left: none, right: none, bottom: ri === 0 ? rule(6) : none },
        children: [new Paragraph({ alignment: align?.[ci] === "right" ? AlignmentType.RIGHT : align?.[ci] === "center" ? AlignmentType.CENTER : AlignmentType.LEFT, children: [new TextRun({ text: r[ci] ?? "", bold: ri === 0, size: body - 2 })] })] })) })) });
  };
  const run = (child: ChildNode, extra: { bold?: boolean; italics?: boolean } = {}): ParagraphChild[] => {
    if (child.nodeType === 3) return [new TextRun({ text: child.textContent ?? "", ...extra })];
    const el = child as HTMLElement; const next = { bold: extra.bold || el.tagName === "STRONG" || el.tagName === "B", italics: extra.italics || el.tagName === "EM" || el.tagName === "I" };
    if (el.tagName === "SUP") return [new TextRun({ text: el.textContent ?? "", superScript: true, ...next })];
    if (el.tagName === "A" && el.dataset["ref"]) return [new InternalHyperlink({ anchor: bm(el.dataset["ref"]), children: [new TextRun({ text: el.textContent ?? "", ...next })] })];
    if (el.tagName === "SUB") return [new TextRun({ text: el.textContent ?? "", subScript: true, ...next })];
    return Array.from(el.childNodes).flatMap((c) => run(c, next));
  };
  const labels = floatLabels(m, project.target_venue);
  const align = (el: Element) => { const a = (el as HTMLElement).style?.textAlign; return a === "center" ? AlignmentType.CENTER : a === "right" ? AlignmentType.RIGHT : a === "justify" ? AlignmentType.JUSTIFIED : AlignmentType.LEFT; };
  async function float(f: Figure) {
    const l = labels[f.id]; if (!l) return;
    const caption = new Paragraph({ keepNext: l.above, spacing: { before: 120, after: 80 }, alignment: project.target_venue === "APA" ? AlignmentType.LEFT : AlignmentType.CENTER, children: [new TextRun({ text: `${l.caption} `, bold: project.target_venue !== "IEEE" }), new TextRun({ text: l.captionText, italics: project.target_venue === "APA" })] });
    if (l.above) children.push(caption);
    if (f.kind === "table" && f.rows?.length) children.push(academicTable(f.rows, f.align));
    else if (f.image) {
      const img = new Image(); img.src = f.image; await img.decode().catch(() => undefined);
      const maxW = rules.columns === 2 ? 300 : 560; const w = Math.min(maxW, img.naturalWidth || maxW); const h = Math.round(w * ((img.naturalHeight || 3) / (img.naturalWidth || 4)));
      const bytes = Uint8Array.from(atob(f.image.split(",")[1] ?? ""), (c) => c.charCodeAt(0));
      children.push(new Paragraph({ keepNext: !l.above, alignment: AlignmentType.CENTER, children: [new ImageRun({ type: f.image.includes("image/png") ? "png" : "jpg", data: bytes, transformation: { width: w, height: h } })] }));
    } else if (f.data.length) children.push(academicTable([[f.xLabel || "Label", f.yLabel || "Value"], ...f.data.map((row) => [row.label, String(row.value)])]));
    if (!l.above) children.push(caption);
  }
  let num = 0;
  for (const [index, s] of m.sections.entries()) {
    const isAbstract = s.title.toLowerCase() === "abstract"; if (!isAbstract) num++;
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, keepNext: true, spacing: { before: p.venue === "APA" ? 120 : 200, after: 80 }, alignment: p.headings.align === "center" ? AlignmentType.CENTER : AlignmentType.LEFT, children: [new TextRun({ text: `${isAbstract ? "" : headingNumber(p, num)}${headingText(p, s.title)}`, bold: p.headings.bold, smallCaps: p.headings.case === "smallcaps", size: p.font.headingPt * 2, font: p.font.docx, color: "000000" })] }));
    const container = document.createElement("div"); container.innerHTML = renderSection(s.html, m, project, { eqStart: equationStart(m, index), word: true });
    for (const node of Array.from(container.children)) {
      if (node.tagName === "TABLE") {
        children.push(academicTable(Array.from(node.querySelectorAll("tr")).map((row) => Array.from(row.querySelectorAll("td, th")).map((cell) => cell.textContent?.trim() ?? ""))));
      } else if (node.getAttribute("data-eq")) {
        children.push(new Paragraph({ tabStops: [{ type: TabStopType.CENTER, position: 4500 }, { type: TabStopType.RIGHT, position: rules.columns === 2 ? 4800 : 9000 }], children: [new TextRun("\t"), new OMath({ children: [new MathRun(node.textContent ?? "")] }), new TextRun(`\t${node.getAttribute("data-eq")}`)] }));
      } else if (node.tagName === "UL" || node.tagName === "OL") {
        Array.from(node.children).forEach((li, i) => children.push(new Paragraph({ indent: { left: 360 }, children: [new TextRun(node.tagName === "OL" ? `${i + 1}. ` : "• "), ...run(li)] })));
      } else {
        const a = align(node);
        children.push(new Paragraph({ alignment: a === AlignmentType.LEFT && p.paragraph.justify ? AlignmentType.JUSTIFIED : a, indent: { firstLine: isAbstract ? 0 : indent }, spacing: { line: Math.round(p.font.lineHeight * 240), before: 0, after: p.paragraph.indentEm ? 0 : 120 }, widowControl: true, children: run(node) }));
      }
    }
    if (isAbstract && project.keywords.length) children.push(new Paragraph({ children: [new TextRun({ text: project.target_venue === "IEEE" ? "Index Terms—" : "Keywords: ", bold: true }), new TextRun(project.keywords.join(", "))] }));
    for (const f of floatsFor(m, s.id)) await float(f);
  }
  for (const f of floatsFor(m, undefined)) await float(f);
  const ordered = orderedReferences(m, project.target_venue);
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, alignment: p.headings.align === "center" ? AlignmentType.CENTER : AlignmentType.LEFT, children: [new TextRun({ text: headingText(p, "References"), bold: p.headings.bold, smallCaps: p.headings.case === "smallcaps", size: p.font.headingPt * 2, font: p.font.docx, color: "000000" })] }),
    ...bibliography(ordered, project.target_venue).map((text, i) => { const r = ordered[i]; const href = r?.doi ? `https://doi.org/${r.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//, "")}` : r?.url;
      return new Paragraph({ indent: { left: 440, hanging: 440 }, spacing: { after: 40 }, children: [r ? new Bookmark({ id: bm(r.id), children: [new TextRun({ text, size: body - 2 })] }) : new TextRun({ text, size: body - 2 }), ...(href && !text.includes(href) ? [new TextRun(" "), new ExternalHyperlink({ link: href, children: [new TextRun({ text: href, style: "Hyperlink", size: body - 2 })] })] : [])] }); }));
  const headerText = p.header(project.title);
  const pageNo = new Paragraph({ alignment: p.footer === "right" ? AlignmentType.RIGHT : AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], size: 18 })] });
  const doc = new Document({ styles: { default: { document: { run: { font: p.font.docx, size: body } } } }, sections: [{ properties: { page: { size: { width: tw(p.page.widthMm), height: tw(p.page.heightMm) }, margin: { top: margin, bottom: margin, left: margin, right: margin, header: Math.round(margin / 2), footer: Math.round(margin / 2) } }, column: { count: rules.columns, space: tw(p.columnGapMm || 6) } }, headers: { default: new Header({ children: headerText ? [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: headerText, size: 16 })] })] : [] }) }, footers: { default: new Footer({ children: [pageNo] }) }, children }] });
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