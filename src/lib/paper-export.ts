import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, ImageRun, AlignmentType } from "docx";
import type { Figure } from "./manuscript";
import { floatLabels, floatsFor } from "./floats";
import type { Manuscript } from "./manuscript";
import type { Project } from "./projects";
import { rulesFor } from "./manuscript";
import { bibliography, orderedReferences } from "./citations";
import { renderSection } from "@/components/paper-preview";

export async function wordBlob(m: Manuscript, project: Project) {
  const rules = rulesFor(m, project.target_venue);
  const children: (Paragraph | Table)[] = [new Paragraph({ text: project.title, heading: HeadingLevel.TITLE }), new Paragraph(m.authors)];
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
  for (const s of m.sections) {
    children.push(new Paragraph({ text: s.title, heading: HeadingLevel.HEADING_1 }));
    const container = document.createElement("div"); container.innerHTML = renderSection(s.html, m, project);
    for (const node of Array.from(container.children)) {
      if (node.tagName === "TABLE") {
        children.push(new Table({ rows: Array.from(node.querySelectorAll("tr")).map((row) => new TableRow({ children: Array.from(row.querySelectorAll("td, th")).map((cell) => new TableCell({ children: [new Paragraph(cell.textContent ?? "")] })) })) }));
      } else {
        children.push(new Paragraph({ alignment: align(node), children: Array.from(node.childNodes).map((child) => new TextRun({ text: child.textContent ?? "", bold: child.nodeName === "STRONG", italics: child.nodeName === "EM" })) }));
      }
    }
    for (const f of floatsFor(m, s.id)) await float(f);
  }
  for (const f of floatsFor(m, undefined)) await float(f);
  children.push(new Paragraph({ text: "References", heading: HeadingLevel.HEADING_1 }), ...bibliography(orderedReferences(m, project.target_venue), project.target_venue).map((text) => new Paragraph(text)));
  const margin = Math.round(rules.margin * 56.693);
  const doc = new Document({ styles: { default: { document: { run: { font: "Times New Roman", size: rules.fontSize * 2 } } } }, sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: margin, bottom: margin, left: margin, right: margin } }, column: { count: rules.columns, space: 400 } }, children }] });
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