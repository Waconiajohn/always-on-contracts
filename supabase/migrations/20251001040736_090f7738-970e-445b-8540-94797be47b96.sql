-- Add fields for conversational resume customization

-- Add why_me_narratives to profiles for storing user success stories
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS why_me_narratives jsonb DEFAULT '[]'::jsonb;

-- Add conversation_data to application_queue for storing job-specific Q&A
ALTER TABLE application_queue 
ADD COLUMN IF NOT EXISTS conversation_data jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS keyword_analysis jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS critical_qualifications text[] DEFAULT ARRAY[]::text[];

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_application_queue_conversation ON application_queue USING gin(conversation_data);
CREATE INDEX IF NOT EXISTS idx_profiles_why_me ON profiles USING gin(why_me_narratives);

COMMENT ON COLUMN profiles.why_me_narratives IS 'Stores user success stories and "why me" narratives organized by skill area/industry';
COMMENT ON COLUMN application_queue.conversation_data IS 'Stores job-specific conversation questions and user responses';
COMMENT ON COLUMN application_queue.keyword_analysis IS 'Stores keyword scoring and coverage analysis for the job match';
COMMENT ON COLUMN application_queue.critical_qualifications IS 'Top 3-5 most critical qualifications extracted from job description';