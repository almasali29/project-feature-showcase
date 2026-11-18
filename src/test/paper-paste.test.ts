import { describe, it, expect } from "vitest";
import { parsePastedPaper, parseReference } from "@/lib/paper-paste";

const paper = `Abstract
We study vision models.

1. Introduction
CNNs improved accuracy [1], and later work followed [2, 3].

References
[1] A. Krizhevsky, I. Sutskever, and G. Hinton, "ImageNet classification with deep convolutional neural networks," in NeurIPS, 2012.
[2] K. He, X. Zhang, "Deep residual learning," in CVPR, 2016.
[3] A. Dosovitskiy, "An image is worth 16x16 words," in ICLR, 2021.`;

describe("pasting a full paper", () => {
  it("splits sections and imports every reference", () => {
    const r = parsePastedPaper(paper);
    expect(r.sections.map((s) => s.title)).toEqual(["Abstract", "Introduction"]);
    expect(r.references).toHaveLength(3);
    expect(r.references[0]!.year).toBe("2012");
    expect(r.references[0]!.authors.startsWith("Krizhevsky")).toBe(true);
  });
  it("turns numbered citations into linked citations", () => {
    const r = parsePastedPaper(paper);
    const html = r.sections[1]!.html;
    expect(html).toContain(`[[cite:${r.references[0]!.id}]]`);
    expect(html).toContain(`[[cite:${r.references[2]!.id}]]`);
    expect(html).not.toContain("[1]");
    expect(r.cited).toBe(3);
  });
  it("links APA author-year citations", () => {
    const r = parsePastedPaper(`Introduction\nAs shown (Smith, 2020).\n\nReferences\nSmith, J. (2020). A study of things. Journal of Stuff, 3, 1-2.`);
    expect(r.references[0]!.title).toBe("A study of things");
    expect(r.sections[0]!.html).toContain(`[[cite:${r.references[0]!.id}]]`);
  });
  it("reads IEEE reference titles", () => {
    expect(parseReference(`[2] K. He, "Deep residual learning," in CVPR, 2016.`).title).toBe("Deep residual learning");
  });
});
