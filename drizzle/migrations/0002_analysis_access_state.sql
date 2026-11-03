CREATE TABLE public.analysis_access_state (user_id uuid PRIMARY KEY DEFAULT auth.uid(), blocked_reason text, updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE ON public.analysis_access_state TO authenticated;
GRANT ALL ON public.analysis_access_state TO service_role;
ALTER TABLE public.analysis_access_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own analysis state read" ON public.analysis_access_state FOR SELECT TO authenticated USING(user_id = auth.uid());
CREATE POLICY "own analysis state insert" ON public.analysis_access_state FOR INSERT TO authenticated WITH CHECK(user_id = auth.uid());
CREATE POLICY "own analysis state update" ON public.analysis_access_state FOR UPDATE TO authenticated USING(user_id = auth.uid()) WITH CHECK(user_id = auth.uid());