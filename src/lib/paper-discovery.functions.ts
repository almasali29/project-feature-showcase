import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type OpenAlexWork = { id?: string; doi?: string | null; title?: string | null; publication_year?: number | null; authorships?: { author?: { display_name?: string } }[]; primary_location?: { landing_page_url?: string | null; source?: { display_name?: string | null } | null } | null; abstract_inverted_index?: Record<string, number[]> | null; cited_by_count?: number };
function abstractText(index: OpenAlexWork["abstract_inverted_index"]) {
  if (!index) return ""; const words: [number, string][] = [];
  for (const [word, positions] of Object.entries(index)) for (const position of positions) words.push([position, word]);
  return words.sort((a, b) => a[0] - b[0]).map(([, word]) => word).join(" ").slice(0, 6000);
}
export const searchPapers = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(z.object({ query: z.string().trim().min(2).max(200) })).handler(async ({ data }) => {
  try {
    const params = new URLSearchParams({ search: data.query, "per-page": "8" });
    const response = await fetch(`https://api.openalex.org/works?${params}`, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(12000) });
    if (!response.ok) return { papers: [], error: "Scholarly search is temporarily unavailable. Please try again." };
    const body = await response.json() as { results?: OpenAlexWork[] };
    const papers = (body.results ?? []).filter((work) => work.title).map((work) => ({
      id: work.id ?? crypto.randomUUID(), title: work.title ?? "", authors: (work.authorships ?? []).map((a) => a.author?.display_name).filter(Boolean).join("; "), year: String(work.publication_year ?? ""),
      venue: work.primary_location?.source?.display_name ?? "", doi: work.doi?.replace(/^https?:\/\/doi.org\//, "") ?? "", url: work.primary_location?.landing_page_url || work.doi || work.id || "",
      abstract: abstractText(work.abstract_inverted_index), citations: work.cited_by_count ?? 0,
    }));
    return { papers, error: null };
  } catch { return { papers: [], error: "Scholarly search could not be reached. Check your connection and try again." }; }
});
