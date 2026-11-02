import { createFileRoute } from "@tanstack/react-router";
import { AlertOctagon, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { PageIntro } from "@/components/site-chrome";

export const Route = createFileRoute("/integrity")({
  head: () => ({
    meta: [
      { title: "Integrity engine — Research Workspace" },
      { name: "description", content: "Number consistency, claim-evidence mapping and a reproducibility checklist for your paper." },
      { property: "og:title", content: "Integrity engine — Research Workspace" },
      { property: "og:description", content: "Check that your paper holds together before reviewers do." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Integrity,
});

const checks = [
  ["Number consistency", "Deterministic. Values must match across abstract, text, tables, figures and conclusion."],
  ["Claim–evidence mapping", "Each claim links to a citation or result. Strong wording like “significantly” without support is flagged."],
  ["Reproducibility checklist", "Dataset, hyperparameters, seeds, metrics and environment — each marked reported, missing or unclear, with a score."],
];

const legend = [
  { Icon: AlertOctagon, cls: "text-destructive", label: "Confirmed error", desc: "Deterministic check failed" },
  { Icon: AlertTriangle, cls: "text-warning", label: "Potential issue", desc: "AI-flagged, needs your judgement" },
  { Icon: CheckCircle2, cls: "text-success", label: "Passed", desc: "Verified" },
  { Icon: Info, cls: "text-info", label: "Information", desc: "Context only" },
];

function Integrity() {
  return (
    <main>
      <PageIntro eyebrow="The differentiator" title="Three focused checks, every finding explained.">
        Every issue shows its severity, location, what was compared and why it was flagged.
      </PageIntro>
      <div className="mx-auto max-w-3xl space-y-12 px-6">
        {checks.map(([t, d], i) => (
          <section key={t} className="flex gap-6">
            <span className="font-serif text-4xl text-accent">0{i + 1}</span>
            <div><h2 className="text-2xl font-semibold text-foreground">{t}</h2><p className="mt-2 leading-relaxed text-muted-foreground">{d}</p></div>
          </section>
        ))}
        <section className="lift rounded-2xl border border-border bg-card p-8">
          <h2 className="font-serif text-2xl text-foreground">Severity is never colour alone</h2>
          <ul className="mt-6 grid gap-5 sm:grid-cols-2">
            {legend.map(({ Icon, cls, label, desc }) => (
              <li key={label} className="flex gap-3"><Icon className={`h-5 w-5 shrink-0 ${cls}`} /><div><p className="font-medium text-foreground">{label}</p><p className="text-sm text-muted-foreground">{desc}</p></div></li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
