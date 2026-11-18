import type { Reference, Section } from "./manuscript";

const KNOWN = /^(abstract|introduction|background|related work|literature review|method|methods|methodology|materials and methods|proposed (method|approach|system)|experiments?|experimental setup|results|results and discussion|discussion|evaluation|conclusions?|conclusion and future work|future work|acknowledge?ments?|limitations)$/i;
const REFS = /^(references|bibliography|works cited)$/i;
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function headingTitle(line: string): string | null {
  const t = line.trim().replace(/[:.]$/, "");
  const stripped = t.replace(/^(?:\d+(?:\.\d+)*\.?|[IVX]+\.)\s+/, "");
  if (KNOWN.test(stripped) || REFS.test(stripped)) return stripped;
  if (stripped !== t && stripped.length < 60 && /^[A-Z]/.test(stripped) && !/[.!?]$/.test(line.trim())) return stripped;
  return null;
}
export function parseReference(raw: string): Omit<Reference, "id"> {
  let s = raw.replace(/^\s*(?:\[\d+\]|\d+\.)\s*/, "").trim();
  const doi = s.match(/\b10\.\d{4,9}\/[^\s,;]+[^\s,;.]/)?.[0] ?? "";
  const url = s.match(/https?:\/\/\S+/)?.[0]?.replace(/[.,]$/, "") ?? "";
  const year = s.match(/\b(19|20)\d{2}\b/)?.[0] ?? "";
  let authors = "", title = "", venue = "";
  const quoted = s.match(/[“"]([^”"]+)[”"]/);
  if (quoted) { // IEEE: A. Author, B. Author, "Title," Venue, year.
    authors = s.slice(0, quoted.index).replace(/,\s*$/, "");
    title = quoted[1]!.replace(/,$/, "");
    venue = s.slice((quoted.index ?? 0) + quoted[0].length).replace(/^[,.\s]+/, "").split(/,|\./)[0]?.trim() ?? "";
  } else {
    const apa = s.match(/^(.+?)\s*\(((?:19|20)\d{2})[a-z]?\)\.?\s*(.+)$/); // APA: Author, A. (2020). Title. Venue.
    if (apa) { authors = apa[1]!; const rest = apa[3]!.split(/\.\s+/); title = rest[0] ?? ""; venue = rest[1]?.split(",")[0] ?? ""; }
    else { const parts = s.split(/\.\s+/); authors = parts[0] ?? ""; title = parts[1] ?? s; venue = parts[2]?.split(",")[0] ?? ""; }
  }
  const list = authors.replace(/\bet al\.?/g, "").split(/,\s*(?:and\s+|&\s*)?|\s+and\s+|\s*&\s*/).map((a) => a.trim()).filter((a) => a.length > 1);
  // Join "Surname, I." pairs (APA) vs "I. Surname" (IEEE) into "Surname, Given".
  const names: string[] = [];
  for (let i = 0; i < list.length; i++) {
    const a = list[i]!;
    if (/^([A-Z]\.\s?)+$/.test(list[i + 1] ?? "") && !/\s/.test(a)) { names.push(`${a}, ${list[i + 1]}`); i++; }
    else { const p = a.split(/\s+/); const fam = p.pop() ?? a; names.push(p.length ? `${fam}, ${p.join(" ")}` : fam); }
  }
  void s; s = "";
  return { title: title.trim(), authors: names.join("; "), year, venue: venue.trim(), doi, url, notes: "", tags: "", collection: "" };
}
function splitReferences(lines: string[]): string[] {
  const out: string[] = [];
  for (const line of lines) {
    const t = line.trim(); if (!t) continue;
    if (/^(\[\d+\]|\d+\.)\s/.test(t) || !out.length || /^[A-Z][A-Za-z'’-]+,\s+[A-Z]\./.test(t)) out.push(t); else out[out.length - 1] += ` ${t}`;
  }
  return out;
}
/** Turns pasted plain text into sections and a reference library, replacing in-text citations with stable tokens. */
export function parsePastedPaper(text: string): { sections: Section[]; references: Reference[]; cited: number } {
  const lines = text.replace(/\r/g, "").split("\n");
  const blocks: { title: string; lines: string[] }[] = []; let refLines: string[] | null = null;
  let cur = { title: "Imported text", lines: [] as string[] };
  for (const line of lines) {
    const h = line.trim().length < 80 ? headingTitle(line) : null;
    if (h && REFS.test(h)) { if (cur.lines.join("").trim()) blocks.push(cur); refLines = []; continue; }
    if (refLines) { if (h) { refLines = null; cur = { title: h, lines: [] }; } else refLines.push(line); continue; }
    if (h) { if (cur.lines.join("").trim()) blocks.push(cur); cur = { title: h, lines: [] }; } else cur.lines.push(line);
  }
  if (!refLines && cur.lines.join("").trim()) blocks.push(cur);
  const refs: Reference[] = splitReferences(refLines ?? []).map((r) => ({ id: crypto.randomUUID(), ...parseReference(r) }));
  let cited = 0;
  const numbered = (n: number) => refs[n - 1] ? (cited++, `[[cite:${refs[n - 1]!.id}]]`) : `[${n}]`;
  const cite = (txt: string) => txt
    .replace(/\[(\d+(?:\s*[-–,]\s*\d+)*)\]/g, (match, body: string) => {
      if (!refs.length) return match;
      const nums: number[] = []; for (const part of body.split(",")) { const [a, b] = part.split(/[-–]/).map((x) => Number(x.trim())); if (b) for (let i = a!; i <= b; i++) nums.push(i); else nums.push(a!); }
      return nums.map(numbered).join(" ");
    })
    .replace(/\(([^()]*?(?:19|20)\d{2}[a-z]?(?:;[^()]*?(?:19|20)\d{2}[a-z]?)*)\)/g, (match, body: string) => {
      const ids = body.split(";").map((part) => { const year = part.match(/(19|20)\d{2}/)?.[0]; const fam = part.trim().split(/[\s,]/)[0]?.toLowerCase(); return refs.find((r) => r.year === year && r.authors.toLowerCase().startsWith(fam ?? "\u0000")); });
      if (!ids.length || ids.some((r) => !r)) return match;
      cited += ids.length; return ids.map((r) => `[[cite:${r!.id}]]`).join(" ");
    });
  const sections = blocks.map((b) => {
    const paras = b.lines.join("\n").split(/\n\s*\n/).map((p) => p.replace(/\s*\n\s*/g, " ").trim()).filter(Boolean);
    return { id: crypto.randomUUID(), title: b.title, html: paras.map((p) => `<p>${cite(esc(p))}</p>`).join("") || "<p></p>" };
  });
  return { sections, references: refs, cited };
}
