import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Venue } from "./projects";

export const GUIDELINES_BUCKET = "venue-guidelines";
export const MAX_GUIDELINE_SIZE = 10 * 1024 * 1024;

export type VenueGuideline = {
  id: string;
  venue: Venue;
  file_name: string;
  file_path: string;
  file_size: number;
  uploaded_by: string;
  created_at: string;
};

export function venueGuidelinesQuery(venue: Venue) {
  return queryOptions({
    queryKey: ["venue-guidelines", venue],
    queryFn: async (): Promise<VenueGuideline[]> => {
      const { data, error } = await supabase
        .from("venue_guidelines")
        .select("id, venue, file_name, file_path, file_size, uploaded_by, created_at")
        .eq("venue", venue)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as VenueGuideline[];
    },
  });
}

export function validateGuideline(file: File): string | null {
  if (!/\.pdf$/i.test(file.name) && file.type !== "application/pdf") return "Choose a PDF document.";
  if (file.size > MAX_GUIDELINE_SIZE) return "Guideline PDFs must be under 10 MB.";
  if (file.size === 0) return "The document is empty.";
  return null;
}

export async function uploadGuideline(venue: Venue, file: File, userId: string): Promise<void> {
  const invalid = validateGuideline(file);
  if (invalid) throw new Error(invalid);
  const safeName = file.name.replace(/[^\w.\- ]/g, "_");
  const path = `${userId}/${venue}/${crypto.randomUUID()}-${safeName}`;
  const { error: storageError } = await supabase.storage.from(GUIDELINES_BUCKET).upload(path, file, { contentType: "application/pdf" });
  if (storageError) throw new Error(storageError.message);
  const { error: dbError } = await supabase.from("venue_guidelines").insert({
    venue, file_name: file.name, file_path: path, file_size: file.size, uploaded_by: userId,
  });
  if (dbError) {
    await supabase.storage.from(GUIDELINES_BUCKET).remove([path]);
    throw new Error(dbError.message);
  }
}

export async function openGuideline(guideline: VenueGuideline): Promise<void> {
  const { data, error } = await supabase.storage.from(GUIDELINES_BUCKET).createSignedUrl(guideline.file_path, 300);
  if (error || !data?.signedUrl) throw new Error(error?.message ?? "Could not open the file.");
  window.open(data.signedUrl, "_blank", "noopener,noreferrer");
}

export async function deleteGuideline(guideline: VenueGuideline): Promise<void> {
  const { error: dbError } = await supabase.from("venue_guidelines").delete().eq("id", guideline.id);
  if (dbError) throw new Error(dbError.message);
  await supabase.storage.from(GUIDELINES_BUCKET).remove([guideline.file_path]);
}
