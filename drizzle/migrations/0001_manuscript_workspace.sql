CREATE TABLE public.manuscripts (
 project_id uuid PRIMARY KEY REFERENCES public.projects(id) ON DELETE CASCADE,
 user_id uuid NOT NULL DEFAULT auth.uid(),
 content jsonb NOT NULL DEFAULT '{}'::jsonb,
 revision integer NOT NULL DEFAULT 0,
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.manuscripts TO authenticated;
GRANT ALL ON public.manuscripts TO service_role;
ALTER TABLE public.manuscripts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner manuscripts read" ON public.manuscripts FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "owner manuscripts insert" ON public.manuscripts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid()));
CREATE POLICY "owner manuscripts update" ON public.manuscripts FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid()));
CREATE POLICY "owner manuscripts delete" ON public.manuscripts FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE TRIGGER manuscripts_touch BEFORE UPDATE ON public.manuscripts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();