import { createFileRoute } from "@tanstack/react-router";
import { PageIntro } from "@/components/site-chrome";

export const Route = createFileRoute("/venues")({
  head: () => ({
    meta: [
      { title: "Supported venues — Research Workspace" },
      { name: "description", content: "Automatic formatting for IEEE, Springer, ACM, Elsevier and APA." },
      { property: "og:title", content: "Supported venues — Research Workspace" },
      { property: "og:description", content: "Pick a venue and your paper is formatted automatically." },
    ],
  }),
  component: Venues,
});

const venues = [
  ["IEEE", "Two-column, numeric citations"],
  ["Springer", "LNCS-style single column"],
  ["ACM", "ACM reference format"],
  ["Elsevier", "Journal article layout"],
  ["APA", "Author–date, 7th edition"],
];

function Venues() {
  return (
    <main>
      <PageIntro eyebrow="Formatting" title="Five venues. Zero LaTeX.">
        Each venue is a rule set — page size, margins, columns, fonts, headings, captions, references, page limit and required sections.
      </PageIntro>
      <ul className="mx-auto max-w-3xl divide-y divide-border border-y border-border px-6">
        {venues.map(([n, d]) => (
          <li key={n} className="flex items-baseline justify-between py-6">
            <span className="font-serif text-3xl text-foreground">{n}</span>
            <span className="text-muted-foreground">{d}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
