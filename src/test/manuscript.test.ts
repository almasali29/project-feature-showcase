import { describe, expect, it } from "vitest";
import { analyze, newManuscript, normalizeFigure, readiness, tableKey, tableNumber, STARTER_RULES, type Experiment } from "@/lib/manuscript";
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
  it("makes an exact linked figure/result mismatch a blocker", () => {
    const m = newManuscript(); const result = { id: "result-1", metric: "Accuracy", value: 94.2, baseline: "90", notes: "" };
    const experiment: Experiment = { id: "experiment-1", name: "Main run", dataset: "CIFAR-10", datasetVersion: "1", datasetSource: "local", preprocessing: "", status: "complete", notes: "", results: [result] };
    m.experiments = [experiment]; m.figures = [normalizeFigure({ id: "figure-1", caption: "Accuracy", data: [{ label: "Accuracy", value: 93.8 }], resultIds: [result.id] })];
    const finding = analyze(m, "IEEE", []).find((f) => f.id === "figure-value:figure-1:result-1");
    expect(finding?.severity).toBe("error"); expect(finding?.compared).toContain("94.2 ↔ Figure 1 · Accuracy: 93.8");
  });
  it("includes the latest saved AI findings as acknowledgeable warnings", () => {
    const m = newManuscript(); m.semanticReview = { id: "review-1", date: "2026-11-12T00:00:00Z", result: { findings: [{ sectionId: m.sections[0]!.id, title: "Check claim", quote: "Best result", explanation: "Evidence is unclear", evidence: "No supplied result", confidence: "low" }], reproducibility: [] } };
    const finding = analyze(m, "IEEE", []).find((f) => f.id === "ai:review-1:0");
    expect(finding?.severity).toBe("warning"); m.statuses["ai:review-1:0"] = "acknowledged";
    expect(readiness(analyze(m, "IEEE", [])).blockers.some((f) => f.id === "ai:review-1:0")).toBe(false);
  });
  it("numbers table captions across section boundaries", () => {
    const m = newManuscript(); m.sections = [{ id: "a", title: "Methods", html: "<table><tr><td>A</td></tr></table>" }, { id: "b", title: "Results", html: "<table><tr><td>B</td></tr></table>" }];
    expect(tableNumber(m, "b", 0)).toBe(2); expect(tableKey("b", 0)).toBe("b:0");
  });
  it("preserves manual venue overrides", () => {
    const m = newManuscript(); m.rules.IEEE = { ...STARTER_RULES.IEEE, abstractLimit: 1 }; m.sections[0] = { id: "a", title: "Abstract", html: "Two words" };
    expect(analyze(m, "IEEE", []).find((f) => f.id === "abstract-limit")?.compared).toBe("2 words ↔ 1 word limit");
  });
});