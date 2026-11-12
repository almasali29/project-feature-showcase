import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FolderInput } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { projectsQuery } from "@/lib/projects";
import { readManuscript, type Reference } from "@/lib/manuscript";

export function ReferenceImport({ projectId, onImport }: { projectId: string; onImport: (references: Reference[]) => void }) {
  const [open, setOpen] = useState(false); const [sourceId, setSourceId] = useState(""); const [selected, setSelected] = useState<Set<string>>(new Set());
  const { data: projects = [] } = useQuery(projectsQuery);
  const { data: manuscripts = [], isLoading, error } = useQuery({ queryKey: ["cross-project-references"], enabled: open, queryFn: async () => { const { data, error } = await supabase.from("manuscripts").select("project_id, content").neq("project_id", projectId); if (error) throw error; return data; } });
  const references = readManuscript(manuscripts.find((row) => row.project_id === sourceId)?.content).references;
  return <><Button variant="outline" onClick={() => setOpen(true)}><FolderInput /> Import from projects</Button><Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[80vh] overflow-y-auto"><DialogTitle>Cross-project library</DialogTitle><DialogDescription>Copy selected references from your other projects. Originals stay unchanged; stable IDs are preserved when possible.</DialogDescription><select aria-label="Source project" className="mt-3 w-full rounded-md border border-input bg-card px-3 py-2" value={sourceId} onChange={(e) => { setSourceId(e.target.value); setSelected(new Set()); }}><option value="">Choose a project…</option>{projects.filter((p) => p.id !== projectId && manuscripts.some((m) => m.project_id === p.id)).map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select>{isLoading && <p className="py-5 text-sm">Loading your libraries…</p>}{error && <p className="py-5 text-sm text-destructive">Your other libraries could not be loaded.</p>}{sourceId && !references.length && <p className="py-5 text-sm text-muted-foreground">That project has no references.</p>}<ul className="mt-4 divide-y divide-border">{references.map((r) => <li key={r.id} className="flex items-start gap-3 py-3"><input className="mt-1" type="checkbox" aria-label={`Import ${r.title}`} checked={selected.has(r.id)} onChange={() => { const next = new Set(selected); if (next.has(r.id)) next.delete(r.id); else next.add(r.id); setSelected(next); }} /><div><p className="font-medium">{r.title}</p><p className="text-sm text-muted-foreground">{r.authors} · {r.year}</p></div></li>)}</ul><Button disabled={!selected.size} onClick={() => { onImport(references.filter((r) => selected.has(r.id))); setOpen(false); }}>Import {selected.size || ""} reference{selected.size === 1 ? "" : "s"}</Button></DialogContent></Dialog></>;
}
