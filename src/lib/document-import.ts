import DOMPurify from "dompurify";
import type { Section } from "./manuscript";

export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;
export function validateDocument(name: string, size: number) {
  if (!/\.(pdf|docx)$/i.test(name)) return "Choose a PDF or DOCX document.";
  if (size > MAX_DOCUMENT_SIZE) return "Documents must be under 10 MB.";
  if (size === 0) return "The document is empty.";
  return null;
}
export async function extractDocument(file: File): Promise<{ sections: Section[]; text: string }> {
  const error = validateDocument(file.name, file.size); if (error) throw new Error(error);
  const buffer = await file.arrayBuffer();
  let html = "";
  if (/\.docx$/i.test(file.name)) {
    const mammoth = await import("mammoth");
    const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
    html = DOMPurify.sanitize(result.value);
  } else {
    const pdfjs = await import("pdfjs-dist");
    const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    const task = pdfjs.getDocument({ data: buffer });
    const pdf = await task.promise;
    try {
      const paragraphs: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i); const content = await page.getTextContent();
        const text = content.items.map((item) => "str" in item ? item.str : "").join(" ");
        paragraphs.push(`<p>${text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`);
      }
      html = paragraphs.join("");
    } finally { await task.destroy(); }
  }
  const container = document.createElement("div"); container.innerHTML = html;
  const sections: Section[] = []; let current: Section = { id: crypto.randomUUID(), title: file.name.replace(/\.(docx|pdf)$/i, ""), html: "" };
  for (const element of Array.from(container.children)) {
    if (/^H[12]$/.test(element.tagName)) {
      if (current.html.trim()) sections.push(current);
      current = { id: crypto.randomUUID(), title: element.textContent?.trim() || "Imported section", html: "" };
    } else current.html += element.outerHTML;
  }
  if (current.html.trim()) sections.push(current);
  if (!container.textContent?.trim()) throw new Error("No readable text was found. Scanned PDFs need OCR before import.");
  return { sections, text: container.textContent ?? "" };
}