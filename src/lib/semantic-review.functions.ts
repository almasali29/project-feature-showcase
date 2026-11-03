import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
export const semanticReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ projectId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { data: project, error } = await context.supabase.from("manuscripts").select("content").eq("project_id", data.projectId).single();
    if (error || !project) return { error: "Save your manuscript before requesting an AI review.", result: null };
    const { data: state } = await context.supabase.from("analysis_access_state").select("blocked_reason").eq("user_id", context.userId).maybeSingle();
    if (state?.blocked_reason) return { error: state.blocked_reason, result: null };
    const { reviewManuscript } = await import("./semantic-review.server");
    return reviewManuscript(project.content, getRequest(), async (reason) => {
      await context.supabase.from("analysis_access_state").upsert({ user_id: context.userId, blocked_reason: reason });
    });
  });