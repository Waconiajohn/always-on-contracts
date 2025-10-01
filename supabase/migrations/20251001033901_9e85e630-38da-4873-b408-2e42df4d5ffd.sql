-- Add automation and strategy customization fields to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS automation_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS automation_activated_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS custom_target_rate_min numeric,
ADD COLUMN IF NOT EXISTS custom_target_rate_max numeric,
ADD COLUMN IF NOT EXISTS target_industries text[],
ADD COLUMN IF NOT EXISTS strategy_customized boolean DEFAULT false;

-- Add comment
COMMENT ON COLUMN public.profiles.automation_enabled IS 'Whether the Always-On automation system is active';
COMMENT ON COLUMN public.profiles.strategy_customized IS 'Whether user has reviewed and customized their strategy';