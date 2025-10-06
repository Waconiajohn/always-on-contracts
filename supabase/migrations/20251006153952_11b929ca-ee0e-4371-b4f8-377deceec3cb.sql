-- Phase 3.2: Processing Queue Table
CREATE TABLE IF NOT EXISTS public.resume_processing_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  error_message TEXT,
  error_type TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Phase 3.4: Resume Content Cache
CREATE TABLE IF NOT EXISTS public.resume_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_hash TEXT NOT NULL UNIQUE,
  extracted_text TEXT NOT NULL,
  analysis_result JSONB,
  file_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  hit_count INTEGER DEFAULT 1,
  last_accessed TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Phase 4.4: Processing Logs
CREATE TABLE IF NOT EXISTS public.processing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  queue_id UUID REFERENCES public.resume_processing_queue(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  processing_time_ms INTEGER,
  extracted_text_length INTEGER,
  ai_tokens_used INTEGER,
  success BOOLEAN NOT NULL,
  error_type TEXT,
  error_message TEXT,
  validation_score NUMERIC(3,2),
  confidence_level TEXT CHECK (confidence_level IN ('high', 'medium', 'low')),
  was_cached BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Phase 3.3: Rate Limiting Tracking
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  window_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint, window_start)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_resume_queue_user_status ON public.resume_processing_queue(user_id, status);
CREATE INDEX IF NOT EXISTS idx_resume_queue_created ON public.resume_processing_queue(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resume_cache_hash ON public.resume_cache(content_hash);
CREATE INDEX IF NOT EXISTS idx_resume_cache_expires ON public.resume_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_processing_logs_user_created ON public.processing_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_window ON public.rate_limits(user_id, window_end);

-- RLS Policies
ALTER TABLE public.resume_processing_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Users can view their own queue items
CREATE POLICY "Users can view their own queue items"
  ON public.resume_processing_queue FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own queue items
CREATE POLICY "Users can insert their own queue items"
  ON public.resume_processing_queue FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own queue items
CREATE POLICY "Users can update their own queue items"
  ON public.resume_processing_queue FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can view their own logs
CREATE POLICY "Users can view their own processing logs"
  ON public.processing_logs FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert logs
CREATE POLICY "System can insert processing logs"
  ON public.processing_logs FOR INSERT
  WITH CHECK (true);

-- Users can view their own rate limits
CREATE POLICY "Users can view their own rate limits"
  ON public.rate_limits FOR SELECT
  USING (auth.uid() = user_id);

-- System can manage rate limits
CREATE POLICY "System can manage rate limits"
  ON public.rate_limits FOR ALL
  USING (true)
  WITH CHECK (true);

-- Resume cache is accessible by system only (no RLS needed, accessed via service role)
ALTER TABLE public.resume_cache ENABLE ROW LEVEL SECURITY;

-- Cleanup trigger for expired cache
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.resume_cache WHERE expires_at < now();
END;
$$;