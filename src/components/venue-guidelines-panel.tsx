import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileText, Upload, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { venueGuidelinesQuery, uploadGuideline, openGuideline, deleteGuideline, type VenueGuideline } from "@/lib/venue-guidelines";
import type { Venue } from "@/lib/projects";

export function VenueGuidelinesPanel({ venue }: { venue: Venue }) {
  const { user } = useSession();
  const qc = useQueryClient();
  const { data: guidelines, isLoading } = useQuery(venueGuidelinesQuery(venue));
  const [busy, setBusy] = useState(false);
  const refresh = () => qc.invalidateQueries({ queryKey: ["venue-guidelines", venue] });

  async function handleUpload(file: File | undefined) {
    if (!file || !user) return;
    setBusy(true);
    try {
      await uploadGuideline(venue, file, user.id);
      toast.success("Guideline PDF added.");
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not upload the guideline.");
    } finally {
      setBusy(false);
    }
  }

  async function handleOpen(g: VenueGuideline) {
    try { await openGuideline(g); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Could not open the guideline."); }
  }

  async function handleDelete(g: VenueGuideline) {
    if (!confirm(`Remove "${g.file_name}"?`)) return;
    try {
      await deleteGuideline(g);
      toast.success("Guideline removed.");
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not remove the guideline.");
    }
  }

  return (
    <section className="mt-8 rounded-md border border-border bg-card p-5" aria-label="Venue guidelines">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">Venue guidelines · {venue}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Official instruction PDFs for this venue, shared with all signed-in authors. Upload the venue's current guidelines to check your paper against them.
          </p>
        </div>
        <Button asChild variant="outline" disabled={busy}>
          <label className="cursor-pointer">
            <Upload /> {busy ? "Uploading…" : "Upload PDF"}
            <input className="sr-only" type="file" accept=".pdf,application/pdf" aria-label="Upload venue guideline PDF" disabled={busy} onChange={(e) => { void handleUpload(e.target.files?.[0]); e.target.value = ""; }} />
          </label>
        </Button>
      </div>
      {isLoading && <p className="py-4 text-sm text-muted-foreground" role="status">Loading guidelines…</p>}
      {!isLoading && (!guidelines || guidelines.length === 0) && (
        <p className="py-4 text-sm text-muted-foreground">No guidelines uploaded for {venue} yet. Add the official instructions PDF so you and other authors can consult it here.</p>
      )}
      <ul className="mt-3 divide-y divide-border">
        {guidelines?.map((g) => (
          <li key={g.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <p className="flex min-w-0 items-center gap-2 text-sm">
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="break-all">{g.file_name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{(g.file_size / 1024 / 1024).toFixed(1)} MB · {new Date(g.created_at).toLocaleDateString()}</span>
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => void handleOpen(g)}><ExternalLink /> Open</Button>
              {user?.id === g.uploaded_by && (
                <Button size="sm" variant="ghost" aria-label={`Remove ${g.file_name}`} title="Remove guideline" onClick={() => void handleDelete(g)}><Trash2 /></Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
