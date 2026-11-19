/**
 * Prints only the formatted paper in an isolated frame so the app layout cannot add blank space
 * above the title. In-document anchors (#ref-…) become clickable links in the saved PDF.
 */
export function printPaper() {
  const paper = document.getElementById("paper-preview");
  if (!paper) return;
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  document.body.append(frame);
  const doc = frame.contentDocument!;
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style')).map((n) => n.outerHTML).join("");
  doc.open();
  doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>${document.title}</title>${styles}</head><body class="paper-print-body">${paper.outerHTML}</body></html>`);
  doc.close();
  const go = () => { frame.contentWindow?.focus(); frame.contentWindow?.print(); window.setTimeout(() => frame.remove(), 1000); };
  const links = Array.from(doc.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[];
  Promise.all(links.map((l) => new Promise((r) => { if (l.sheet) r(null); else { l.onload = r; l.onerror = r; } })))
    .then(() => doc.fonts?.ready).then(() => window.setTimeout(go, 50));
}
