import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertOctagon, AlertTriangle, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Research Workspace — Write papers without LaTeX" },
      { name: "description", content: "Write, auto-format to IEEE, Springer, ACM, Elsevier or APA, and integrity-check your paper before submission." },
      { property: "og:title", content: "Research Workspace" },
      { property: "og:description", content: "Other tools make a paper look right. This one checks it holds together." },
    ],
  }),
  component: Index,
});

const steps = [
  ["Write", "A document-first editor with sections, tables, equations and auto-numbered figures. Autosaved."],
  ["Cite", "A persistent reference library. Insert citations and catch missing, unused or duplicate ones."],
  ["Format", "Pick a venue. The paper is formatted automatically — then edit by hand if you want."],
  ["Verify", "Numbers, claims, citations and reproducibility details are checked before you submit."],
];

function Index() {
  return (
    <main>
      <section className="mx-auto grid max-w-6xl gap-16 px-6 pt-24 pb-20 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div className="animate-rise">
          <p className="text-sm font-medium uppercase tracking-widest text-primary">Writing · Citation · Formatting · Integrity</p>
          <h1 className="mt-6 font-serif text-4xl sm:text-6xl leading-[1.05] text-foreground">
            Write your paper. <span className="highlight">Skip the LaTeX.</span> Submit with confidence.
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Other tools make a paper look right. Research Workspace also checks that its numbers, claims,
            citations and reproducibility details hold together.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link to="/features" className="press rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground hover:opacity-90">Explore features</Link>
            <Link to="/integrity" className="press rounded-full border border-border px-6 py-3 font-medium text-foreground hover:bg-secondary">How checks work</Link>
          </div>
        </div>
        <div className="animate-rise lift rounded-2xl border border-border bg-card p-8 shadow-sm [animation-delay:250ms]">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Issue center · 3 findings</p>
          <ul className="mt-6 space-y-5 text-sm">
            <li className="flex gap-3"><AlertOctagon className="h-5 w-5 shrink-0 text-destructive" /><div><p className="font-medium text-foreground">Confirmed error · Number mismatch</p><p className="text-muted-foreground">Abstract says 94.2% accuracy; Table 3 reports 93.8%.</p></div></li>
            <li className="flex gap-3"><AlertTriangle className="h-5 w-5 shrink-0 text-warning" /><div><p className="font-medium text-foreground">Potential issue · Unsupported claim</p><p className="text-muted-foreground">"state-of-the-art" in §4.2 has no citation or result.</p></div></li>
            <li className="flex gap-3"><CheckCircle2 className="h-5 w-5 shrink-0 text-success" /><div><p className="font-medium text-foreground">Passed · Reproducibility</p><p className="text-muted-foreground">Dataset, seeds and hyperparameters reported.</p></div></li>
          </ul>
          <div className="mt-8 border-t border-border pt-6">
            <div className="flex items-baseline justify-between"><span className="text-sm text-muted-foreground">Readiness</span><span className="font-serif text-4xl text-primary">82<span className="text-lg text-muted-foreground">/100</span></span></div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="font-serif text-4xl text-foreground">One workspace, four steps</h2>
          <ol className="mt-12 grid gap-12 md:grid-cols-2">
            {steps.map(([t, d], i) => (
              <li key={t} className="flex gap-6">
                <span className="font-serif text-5xl text-accent">{i + 1}</span>
                <div><h3 className="text-xl font-semibold text-foreground">{t}</h3><p className="mt-2 leading-relaxed text-muted-foreground">{d}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <p className="font-serif text-3xl leading-snug text-foreground">
          AI assists the researcher inside a deterministic application — <em className="text-primary">it never acts as the final authority.</em>
        </p>
      </section>
    </main>
  );
}
