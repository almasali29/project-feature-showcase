import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, FolderOpen, Archive } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { projectsQuery, parseKeywords } from "@/lib/projects";
import { ProjectForm } from "@/components/project-form";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Research Workspace" }, { name: "description", content: "Manage your private research projects and manuscripts." }, { property: "og:title", content: "Dashboard — Research Workspace" }, { property: "og:description", content: "Your research projects in one place." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: Dashboard,
});

function Dashboard() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery(projectsQuery);
  const [creating, setCreating] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const list = (data ?? []).filter((p) => p.archived === showArchived);

  return (
    <main className="mx-auto max-w-5xl px-6 pt-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-primary">Dashboard</p>
          <h1 className="mt-2 font-serif text-4xl text-foreground sm:text-5xl">Your projects</h1>
        </div>
        {!creating && (
          <button onClick={() => setCreating(true)} className="press inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 font-medium text-primary-foreground">
            <Plus className="h-4 w-4" /> New project
          </button>
        )}
      </div>

      {creating && (
        <section className="animate-rise mt-10 rounded-2xl border border-border bg-card p-8">
          <h2 className="font-serif text-2xl text-foreground">New project</h2>
          <div className="mt-6">
            <ProjectForm submitLabel="Create project" onCancel={() => setCreating(false)} onSubmit={async (v) => {
              const { error } = await supabase.from("projects").insert({ title: v.title, description: v.description || null, keywords: parseKeywords(v.keywords), target_venue: v.target_venue });
              if (error) { toast.error("Couldn't create the project."); return; }
              toast.success("Project created");
              setCreating(false);
              qc.invalidateQueries({ queryKey: ["projects"] });
            }} />
          </div>
        </section>
      )}

      <div className="mt-10 flex gap-2 text-sm">
        {[false, true].map((a) => (
          <button key={String(a)} onClick={() => setShowArchived(a)} className={`press rounded-full px-4 py-2 ${showArchived === a ? "bg-secondary font-semibold text-foreground" : "text-muted-foreground"}`}>
            {a ? "Archived" : "Active"}
          </button>
        ))}
      </div>

      {isLoading && <div className="mt-8 space-y-4">{[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-secondary" />)}</div>}
      {error && <p className="mt-8 text-destructive">Couldn't load your projects. Please refresh.</p>}
      {!isLoading && !error && list.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-border px-8 py-16 text-center">
          {showArchived ? <Archive className="mx-auto h-8 w-8 text-muted-foreground" /> : <FolderOpen className="mx-auto h-8 w-8 text-muted-foreground" />}
          <p className="mt-4 font-serif text-2xl text-foreground">{showArchived ? "Nothing archived" : "No projects yet"}</p>
          {!showArchived && <p className="mt-2 text-muted-foreground">Create your first project to start writing.</p>}
        </div>
      )}
      <ul className="mt-8 divide-y divide-border border-y border-border">
        {list.map((p) => (
          <li key={p.id}>
            <Link to="/projects/$id" params={{ id: p.id }} className="group flex flex-wrap items-baseline justify-between gap-4 py-6">
              <div>
                <p className="font-serif text-2xl text-foreground transition-colors group-hover:text-primary">{p.title}</p>
                {p.description && <p className="mt-1 line-clamp-1 text-muted-foreground">{p.description}</p>}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="rounded-full bg-accent/30 px-3 py-1 font-medium text-foreground">{p.target_venue}</span>
                <span>Updated {new Date(p.updated_at).toLocaleDateString()}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
