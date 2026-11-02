import { describe, expect, it } from "vitest";
import { analyze, newManuscript, readiness, STARTER_RULES } from "@/lib/manuscript";
describe("Manuscript rules", () => {
  it("provides all five SRS venues", () => expect(Object.keys(STARTER_RULES)).toEqual(["IEEE", "Springer", "ACM", "Elsevier", "APA"]));
  it("detects missing citations", () => {
    const m = newManuscript(); m.sections[0] = { id: "abstract", title: "Abstract", html: "<p>Prior work [[cite:missing]].</p>" };
    expect(analyze(m, "IEEE", []).find((f) => f.id === "missing:missing")?.severity).toBe("error");
  });
  it("does not treat differing experimental numbers as confirmed errors", () => {
    const m = newManuscript(); m.sections = [{ id: "a", title: "Abstract", html: "accuracy 94.2%" }, { id: "b", title: "Results", html: "accuracy 93.8%" }];
    expect(analyze(m, "IEEE", []).find((f) => f.id === "metric:accuracy")?.severity).toBe("warning");
  });
  it("flags unsupported strong wording without silently editing", () => {
    const m = newManuscript(); m.sections[0] = { id: "a", title: "Abstract", html: "<p>Our model significantly outperforms all baselines.</p>" };
    const before = JSON.stringify(m); expect(analyze(m, "IEEE", []).some((f) => f.title === "Review strong claim")).toBe(true); expect(JSON.stringify(m)).toBe(before);
  });
  it("keeps blockers blocking after acknowledgement", () => {
    const m = newManuscript(); m.statuses['authors'] = "acknowledged";
    expect(readiness(analyze(m, "IEEE", [])).blockers.some((f) => f.id === "authors")).toBe(true);
  });
  it("scores readiness out of 100", () => expect(readiness([]).score).toBe(100));
  it("preserves manual venue overrides", () => {
    const m = newManuscript(); m.rules.IEEE = { ...STARTER_RULES.IEEE, abstractLimit: 1 }; m.sections[0] = { id: "a", title: "Abstract", html: "Two words" };
    expect(analyze(m, "IEEE", []).find((f) => f.id === "abstract-limit")?.compared).toBe("2 words ↔ 1 word limit");
  });
});