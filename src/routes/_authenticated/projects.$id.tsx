import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Archive, ArchiveRestore, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { projectQuery, parseKeywords } from "@/lib/projects";
import { ProjectForm } from "@/components/project-form";

export const Route = createFileRoute("/_authenticated/projects/$id")({
  head: () => ({ meta: [{ title: "Project — Research Workspace" }, { name: "robots", content: "noindex" }] }),
  component: ProjectPage,
});

function ProjectPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: p, isLoading } = useQuery(projectQuery(id));
  const [editing, setEditing] = useState(false);
  const refresh = () => qc.invalidateQueries({ queryKey: ["projects"] });

  if (isLoading) return <main className="mx-auto max-w-3xl px-6 pt-14"><div className="h-40 animate-pulse rounded-2xl bg-secondary" /></main>;
  if (!p) return <main className="mx-auto max-w-3xl px-6 pt-20 text-center"><p className="font-serif text-3xl text-foreground">Project not found</p><Link to="/dashboard" className="mt-6 inline-block text-primary">Back to dashboard</Link></main>;

  async function setArchived(archived: boolean) {
    const { error } = await supabase.from("projects").update({ archived }).eq("id", id);
    if (error) { toast.error("Couldn't update the project."); return; }
    toast.success(archived ? "Project archived" : "Project restored");
    refresh();
  }
  async function remove() {
    if (!confirm("Delete this project permanently?")) return;
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) { toast.error("Couldn't delete the project."); return; }
    toast.success("Project deleted");
    refresh();
    navigate({ to: "/dashboard" });
  }

  return (
    <main className="mx-auto max-w-3xl px-6 pt-10">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> All projects</Link>
      {editing ? (
        <section className="animate-rise mt-8 rounded-2xl border border-border bg-card p-8">
          <h1 className="font-serif text-3xl text-foreground">Edit project</h1>
          <div className="mt-6">
            <ProjectForm submitLabel="Save changes" onCancel={() => setEditing(false)}
              initial={{ title: p.title, description: p.description ?? "", keywords: p.keywords.join(", "), target_venue: p.target_venue }}
              onSubmit={async (v) => {
                const { error } = await supabase.from("projects").update({ title: v.title, description: v.description || null, keywords: parseKeywords(v.keywords), target_venue: v.target_venue }).eq("id", id);
                if (error) { toast.error("Couldn't save changes."); return; }
                toast.success("Saved");
                setEditing(false);
                refresh();
              }} />
          </div>
        </section>
      ) : (
        <article className="animate-rise mt-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-accent/30 px-3 py-1 text-sm font-medium text-foreground">{p.target_venue}</span>
            {p.archived && <span className="rounded-full bg-secondary px-3 py-1 text-sm text-muted-foreground">Archived</span>}
          </div>
          <h1 className="mt-4 font-serif text-4xl leading-tight text-foreground sm:text-5xl">{p.title}</h1>
          {p.description && <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{p.description}</p>}
          {p.keywords.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-2">{p.keywords.map((k) => <li key={k} className="rounded-full border border-border px-3 py-1 text-sm text-foreground">{k}</li>)}</ul>
          )}
          <p className="mt-6 text-sm text-muted-foreground">Created {new Date(p.created_at).toLocaleDateString()} · Updated {new Date(p.updated_at).toLocaleString()}</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <button onClick={() => setEditing(true)} className="press inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-primary-foreground"><Pencil className="h-4 w-4" /> Edit</button>
            <button onClick={() => setArchived(!p.archived)} className="press inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-foreground">
              {p.archived ? <><ArchiveRestore className="h-4 w-4" /> Restore</> : <><Archive className="h-4 w-4" /> Archive</>}
            </button>
            <button onClick={remove} className="press inline-flex items-center gap-2 rounded-full border border-destructive/40 px-5 py-2.5 text-destructive"><Trash2 className="h-4 w-4" /> Delete</button>
          </div>
          <section className="mt-14 rounded-2xl border border-dashed border-border p-8">
            <p className="font-serif text-2xl text-foreground">Writing, references and checks</p>
            <p className="mt-2 text-muted-foreground">The editor, reference library and integrity checks for this project are coming in the next stage.</p>
          </section>
        </article>
      )}
    </main>
  );
}
