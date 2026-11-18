import { describe, expect, it } from "vitest";
import { headingNumber, pageCss, PROFILES } from "@/lib/publisher-profiles";
import { STARTER_RULES } from "@/lib/manuscript";
describe("Publisher profiles", () => {
  it("covers all five publishers", () => expect(Object.keys(PROFILES).sort()).toEqual(["ACM", "APA", "Elsevier", "IEEE", "Springer"]));
  it("IEEE uses Roman section numbers and two columns", () => { expect(headingNumber(PROFILES.IEEE, 3)).toBe("III. "); expect(STARTER_RULES.IEEE.columns).toBe(2); });
  it("APA headings are unnumbered and double-spaced", () => { expect(headingNumber(PROFILES.APA, 2)).toBe(""); expect(PROFILES.APA.font.lineHeight).toBe(2); });
  it("Springer and Elsevier print on A4, IEEE/ACM/APA on Letter", () => {
    expect(pageCss(PROFILES.Springer, 25, "T")).toContain("size: A4"); expect(pageCss(PROFILES.Elsevier, 25, "T")).toContain("size: A4");
    for (const v of ["IEEE", "ACM", "APA"] as const) expect(pageCss(PROFILES[v], 19, "T")).toContain("size: Letter");
  });
  it("prints a page number on every page", () => expect(pageCss(PROFILES.ACM, 19, "T")).toContain("counter(page)"));
});
