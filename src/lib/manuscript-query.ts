import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
export const manuscriptQuery = (id: string) => queryOptions({
  queryKey: ["manuscript", id],
  queryFn: async () => {
    const { data, error } = await supabase.from("manuscripts").select("*").eq("project_id", id).maybeSingle();
    if (error) throw error;
    return data;
  },
  staleTime: Infinity,
});