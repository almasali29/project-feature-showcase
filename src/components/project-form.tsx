import { useState } from "react";
import { VENUES, type Venue } from "@/lib/projects";

export type ProjectInput = { title: string; description: string; keywords: string; target_venue: Venue };

export function ProjectForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<ProjectInput>;
  submitLabel: string;
  onSubmit: (v: ProjectInput) => Promise<void>;
  onCancel?: () => void;
}) {
  const [v, setV] = useState<ProjectInput>({ title: "", description: "", keywords: "", target_venue: "IEEE", ...initial });
  const [busy, setBusy] = useState(false);
  const field = "mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/20";
  return (
    <form
      className="space-y-6"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!v.title.trim()) return;
        setBusy(true);
        try { await onSubmit({ ...v, title: v.title.trim() }); } finally { setBusy(false); }
      }}
    >
      <label className="block text-sm font-medium text-foreground">Title
        <input required maxLength={200} className={field} value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} placeholder="e.g. Robust graph learning under label noise" />
      </label>
      <label className="block text-sm font-medium text-foreground">Short description
        <textarea rows={3} maxLength={1000} className={field} value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} />
      </label>
      <label className="block text-sm font-medium text-foreground">Keywords <span className="font-normal text-muted-foreground">(comma separated)</span>
        <input className={field} value={v.keywords} onChange={(e) => setV({ ...v, keywords: e.target.value })} />
      </label>
      <fieldset>
        <legend className="text-sm font-medium text-foreground">Target venue</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {VENUES.map((x) => (
            <button type="button" key={x} onClick={() => setV({ ...v, target_venue: x })}
              className={`press rounded-full border px-4 py-2 text-sm ${v.target_venue === x ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground"}`}>
              {x}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="flex gap-3 pt-2">
        <button disabled={busy} className="press rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground disabled:opacity-60">{busy ? "Saving…" : submitLabel}</button>
        {onCancel && <button type="button" onClick={onCancel} className="press rounded-full border border-border px-6 py-3 text-foreground">Cancel</button>}
      </div>
    </form>
  );
}
