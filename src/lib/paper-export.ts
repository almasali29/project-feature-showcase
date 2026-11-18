import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell } from "docx";
import type { Manuscript } from "./manuscript";
import type { Project } from "./projects";
import { rulesFor } from "./manuscript";
import { bibliography } from "./citations";
import { renderSection } from "@/components/paper-preview";

export async function wordBlob(m: Manuscript, project: Project) {
  const rules = rulesFor(m, project.target_venue);
  const children: (Paragraph | Table)[] = [new Paragraph({ text: project.title, heading: HeadingLevel.TITLE }), new Paragraph(m.authors)];
  for (const s of m.sections) {
    children.push(new Paragraph({ text: s.title, heading: HeadingLevel.HEADING_1 }));
    const container = document.createElement("div"); container.innerHTML = renderSection(s.html, m, project);
    for (const node of Array.from(container.children)) {
      if (node.tagName === "TABLE") {
        children.push(new Table({ rows: Array.from(node.querySelectorAll("tr")).map((row) => new TableRow({ children: Array.from(row.querySelectorAll("td, th")).map((cell) => new TableCell({ children: [new Paragraph(cell.textContent ?? "")] })) })) }));
      } else {
        children.push(new Paragraph({ children: Array.from(node.childNodes).map((child) => new TextRun({ text: child.textContent ?? "", bold: child.nodeName === "STRONG", italics: child.nodeName === "EM" })) }));
      }
    }
  }
  for (const [i, f] of m.figures.entries()) {
    children.push(new Paragraph(`Figure ${i + 1}. ${f.caption}`));
    if (f.data.length) children.push(new Table({ rows: f.data.map((row) => new TableRow({ children: [row.label, String(row.value)].map((text) => new TableCell({ children: [new Paragraph(text)] })) })) }));
  }
  children.push(new Paragraph({ text: "References", heading: HeadingLevel.HEADING_1 }), ...bibliography(m.references, project.target_venue).map((text) => new Paragraph(text)));
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