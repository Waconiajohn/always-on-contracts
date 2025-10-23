-- Create webinars table for live training sessions
CREATE TABLE IF NOT EXISTS public.webinars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  scheduled_date TIMESTAMPTZ NOT NULL,
  duration_minutes INT DEFAULT 60,
  instructor_name TEXT,
  instructor_title TEXT,
  zoom_link TEXT,
  calendly_link TEXT,
  max_attendees INT DEFAULT 50,
  current_attendees INT DEFAULT 0,
  topics TEXT[],
  recording_url TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled')),
  is_platinum_only BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create webinar registrations table
CREATE TABLE IF NOT EXISTS public.webinar_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  webinar_id UUID REFERENCES public.webinars(id) ON DELETE CASCADE,
  registered_at TIMESTAMPTZ DEFAULT now(),
  attended BOOLEAN DEFAULT false,
  UNIQUE(user_id, webinar_id)
);

-- Create coaching sessions table
CREATE TABLE IF NOT EXISTS public.coaching_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_date TIMESTAMPTZ,
  duration_minutes INT DEFAULT 45,
  coach_name TEXT,
  calendly_link TEXT NOT NULL,
  zoom_link TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  is_platinum_only BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.webinars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webinar_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaching_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view webinars" ON public.webinars FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users manage own registrations" ON public.webinar_registrations FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own sessions" ON public.coaching_sessions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_webinars_date ON public.webinars(scheduled_date);
CREATE INDEX idx_registrations_user ON public.webinar_registrations(user_id);
CREATE INDEX idx_sessions_user ON public.coaching_sessions(user_id);