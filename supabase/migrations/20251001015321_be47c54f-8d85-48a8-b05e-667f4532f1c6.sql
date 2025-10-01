-- Add enhanced job intelligence fields to job_opportunities table
ALTER TABLE public.job_opportunities 
ADD COLUMN IF NOT EXISTS quality_score integer CHECK (quality_score >= 0 AND quality_score <= 100),
ADD COLUMN IF NOT EXISTS is_verified_contract boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS contract_type text CHECK (contract_type IN ('pure_contract', 'contract_to_hire', 'temp_to_perm', 'unknown')),
ADD COLUMN IF NOT EXISTS market_rate_min numeric,
ADD COLUMN IF NOT EXISTS market_rate_max numeric,
ADD COLUMN IF NOT EXISTS market_rate_percentile integer CHECK (market_rate_percentile >= 0 AND market_rate_percentile <= 100),
ADD COLUMN IF NOT EXISTS duplicate_of uuid REFERENCES public.job_opportunities(id),
ADD COLUMN IF NOT EXISTS is_duplicate boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_analysis jsonb,
ADD COLUMN IF NOT EXISTS scraped_salary_data jsonb;

-- Add index for quality queries
CREATE INDEX IF NOT EXISTS idx_job_opportunities_quality ON public.job_opportunities(quality_score DESC) WHERE status = 'active' AND is_duplicate = false;

-- Add index for contract verification
CREATE INDEX IF NOT EXISTS idx_job_opportunities_contract ON public.job_opportunities(is_verified_contract, contract_type) WHERE status = 'active';

-- Add index for duplicate detection
CREATE INDEX IF NOT EXISTS idx_job_opportunities_external ON public.job_opportunities(external_source, external_id) WHERE status = 'active';

COMMENT ON COLUMN public.job_opportunities.quality_score IS 'AI-calculated job quality score (0-100)';
COMMENT ON COLUMN public.job_opportunities.is_verified_contract IS 'AI-verified true contract position';
COMMENT ON COLUMN public.job_opportunities.contract_type IS 'Detailed contract classification';
COMMENT ON COLUMN public.job_opportunities.market_rate_percentile IS 'Salary percentile relative to market (0-100)';
COMMENT ON COLUMN public.job_opportunities.ai_analysis IS 'Detailed AI analysis including red flags, benefits, and recommendations';