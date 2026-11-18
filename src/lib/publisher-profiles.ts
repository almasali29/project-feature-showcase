import type { Venue } from "./projects";

/**
 * One typesetting profile per publisher. Preview, browser PDF and DOCX all read these values,
 * so a single manuscript JSON is rendered through one pipeline with five layouts.
 * Values follow each publisher's public author templates; they are starting rules, not certified templates.
 */
export type PublisherProfile = {
  venue: Venue;
  template: string;
  page: { size: "A4" | "Letter"; widthMm: number; heightMm: number };
  font: { family: string; docx: string; titlePt: number; headingPt: number; lineHeight: number };
  headings: { numbering: "roman" | "arabic" | "none"; case: "upper" | "smallcaps" | "title"; align: "center" | "left"; bold: boolean };
  paragraph: { indentEm: number; justify: boolean };
  columnGapMm: number;
  equations: { numbered: boolean; label: (n: number) => string };
  header: (title: string) => string;
  footer: "center" | "right";
};

const eq = (n: number) => `(${n})`;
export const PROFILES: Record<Venue, PublisherProfile> = {
  IEEE: { venue: "IEEE", template: "IEEE conference (IEEEtran)", page: { size: "Letter", widthMm: 215.9, heightMm: 279.4 }, font: { family: '"Times New Roman", Times, serif', docx: "Times New Roman", titlePt: 24, headingPt: 10, lineHeight: 1.15 }, headings: { numbering: "roman", case: "smallcaps", align: "center", bold: false }, paragraph: { indentEm: 1, justify: true }, columnGapMm: 4.2, equations: { numbered: true, label: eq }, header: () => "", footer: "center" },
  Springer: { venue: "Springer", template: "Springer LNCS (llncs)", page: { size: "A4", widthMm: 210, heightMm: 297 }, font: { family: '"Times New Roman", Times, serif', docx: "Times New Roman", titlePt: 14, headingPt: 12, lineHeight: 1.2 }, headings: { numbering: "arabic", case: "title", align: "left", bold: true }, paragraph: { indentEm: 1.5, justify: true }, columnGapMm: 0, equations: { numbered: true, label: eq }, header: (t) => t, footer: "center" },
  ACM: { venue: "ACM", template: "ACM sigconf (acmart)", page: { size: "Letter", widthMm: 215.9, heightMm: 279.4 }, font: { family: '"Linux Libertine", "Libertinus Serif", "Times New Roman", serif', docx: "Linux Libertine", titlePt: 14.4, headingPt: 10, lineHeight: 1.2 }, headings: { numbering: "arabic", case: "upper", align: "left", bold: true }, paragraph: { indentEm: 1, justify: true }, columnGapMm: 8.3, equations: { numbered: true, label: eq }, header: (t) => t, footer: "right" },
  Elsevier: { venue: "Elsevier", template: "Elsevier article (elsarticle, preprint)", page: { size: "A4", widthMm: 210, heightMm: 297 }, font: { family: '"Times New Roman", Times, serif', docx: "Times New Roman", titlePt: 17, headingPt: 12, lineHeight: 1.5 }, headings: { numbering: "arabic", case: "title", align: "left", bold: true }, paragraph: { indentEm: 1.5, justify: true }, columnGapMm: 0, equations: { numbered: true, label: eq }, header: () => "Preprint submitted to Elsevier", footer: "center" },
  APA: { venue: "APA", template: "APA 7th edition student/professional paper", page: { size: "Letter", widthMm: 215.9, heightMm: 279.4 }, font: { family: '"Times New Roman", Times, serif', docx: "Times New Roman", titlePt: 12, headingPt: 12, lineHeight: 2 }, headings: { numbering: "none", case: "title", align: "center", bold: true }, paragraph: { indentEm: 2.5, justify: false }, columnGapMm: 0, equations: { numbered: true, label: eq }, header: (t) => t.toUpperCase().slice(0, 50), footer: "right" },
};
export const profileFor = (v: Venue) => PROFILES[v];
const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV"];
/** Heading number for body sections; Abstract is never numbered. */
export function headingNumber(p: PublisherProfile, n: number) {
  if (p.headings.numbering === "none" || n < 1) return "";
  return p.headings.numbering === "roman" ? `${ROMAN[n] ?? n}. ` : `${n} `;
}
export function headingText(p: PublisherProfile, title: string) { return p.headings.case === "upper" ? title.toUpperCase() : title; }
/** @page rules shared by browser PDF export: page size, margins, running header, page number. */
export function pageCss(p: PublisherProfile, marginMm: number, title: string) {
  const header = p.header(title).replace(/["\\]/g, "");
  return `@page { size: ${p.page.size}; margin: ${marginMm}mm; ${header ? `@top-center { content: "${header}"; font: 8pt ${p.font.family}; }` : ""} @bottom-${p.footer} { content: counter(page); font: 9pt ${p.font.family}; } }`;
}
