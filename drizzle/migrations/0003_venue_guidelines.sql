CREATE TABLE public.venue_guidelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue public.venue NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL UNIQUE,
  file_size INTEGER NOT NULL,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.venue_guidelines TO authenticated;
GRANT ALL ON public.venue_guidelines TO service_role;

ALTER TABLE public.venue_guidelines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read venue guidelines"
  ON public.venue_guidelines FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can upload venue guidelines"
  ON public.venue_guidelines FOR INSERT TO authenticated WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Uploaders can delete their venue guidelines"
  ON public.venue_guidelines FOR DELETE TO authenticated USING (uploaded_by = auth.uid());

CREATE POLICY "Authenticated users can read guideline files"
  ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'venue-guidelines');

CREATE POLICY "Users can upload guideline files to their folder"
  ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'venue-guidelines' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own guideline files"
  ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'venue-guidelines' AND (storage.foldername(name))[1] = auth.uid()::text);