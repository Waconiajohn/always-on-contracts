-- Allow users to insert external job opportunities (from job searches)
CREATE POLICY "Users can create external job opportunities"
ON public.job_opportunities
FOR INSERT
TO authenticated
WITH CHECK (
  is_external = true
);