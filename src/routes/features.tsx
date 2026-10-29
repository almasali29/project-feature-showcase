import { createFileRoute } from "@tanstack/react-router";
import { PageIntro } from "@/components/site-chrome";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — Research Workspace" },
      { name: "description", content: "Writing, citations, no-LaTeX formatting, figures and submission readiness in one workspace." },
      { property: "og:title", content: "Features — Research Workspace" },
      { property: "og:description", content: "Everything you need to go from draft to submission." },
    ],
  }),
  component: Features,
});

const groups = [
  { title: "Writing", items: ["Rich-text editor with headings, tables, equations and figure placeholders", "Standard and custom sections with autosave", "Auto-numbered captions, labels and cross-references", "Version snapshots and suggestions that never change content silently"] },
  { title: "Citation", items: ["Persistent reference library with DOI, venue, tags and collections", "Insert citations straight from the library", "Checks for missing, unused, duplicate and inconsistent citations", "Reference styles: IEEE, Springer, ACM, Elsevier, APA"] },
  { title: "Formatting without LaTeX", items: ["Five venue profiles as configurable rule sets", "Automatic formatting with a live side-by-side preview", "Manual edit mode — your changes survive re-formatting", "Export to PDF and DOCX, with 90%+ rule accuracy per venue"] },
  { title: "Figures and graphs", items: ["Chart builder from CSV or your results table: line, bar, scatter, box plot, confusion matrix", "Diagram editor with boxes, arrows and labels", "Venue-aware export at the right width, with a grayscale-safe palette", "Checks for low resolution, missing captions and unreferenced figures"] },
  { title: "Submission readiness", items: ["Readiness score out of 100 with a linked breakdown", "Blockers listed first, then warnings", "Venue checklist: page limit, required sections, abstract limits", "Submission package and readiness report export"] },
];

function Features() {
  return (
    <main>
      <PageIntro eyebrow="Features" title="From first draft to a submission-ready paper.">
        Writing, citation and formatting are the core. Figures and readiness checks finish the job.
      </PageIntro>
      <div className="mx-auto max-w-3xl divide-y divide-border px-6">
        {groups.map((g) => (
          <section key={g.title} className="py-10">
            <h2 className="font-serif text-3xl text-foreground">{g.title}</h2>
            <ul className="mt-6 space-y-3">
              {g.items.map((i) => (
                <li key={i} className="flex gap-3 leading-relaxed text-muted-foreground">
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />{i}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
