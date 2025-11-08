-- Add industry-aware columns to intangible vault tables
-- Makes soft skills, leadership, etc. tied to industry expectations, interview prep, and LinkedIn

-- Soft Skills: Make industry-aware
ALTER TABLE vault_soft_skills
ADD COLUMN IF NOT EXISTS industry_relevance jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS interview_question_map text[],
ADD COLUMN IF NOT EXISTS linkedin_post_type text;

COMMENT ON COLUMN vault_soft_skills.industry_relevance IS 'How this skill is valued in target industries: {"technology": "high", "finance": "medium"}';
COMMENT ON COLUMN vault_soft_skills.interview_question_map IS 'Array of common interview questions: ["Tell me about a time you collaborated across functions"]';
COMMENT ON COLUMN vault_soft_skills.linkedin_post_type IS 'Best LinkedIn post type: "leadership_insight", "team_building", "problem_solving"';

-- Leadership Philosophy: Tie to industry norms
ALTER TABLE vault_leadership_philosophy
ADD COLUMN IF NOT EXISTS alignment_with_industry_norms text,
ADD COLUMN IF NOT EXISTS behavioral_interview_examples text[],
ADD COLUMN IF NOT EXISTS linkedin_angle text;

COMMENT ON COLUMN vault_leadership_philosophy.alignment_with_industry_norms IS 'How this philosophy aligns with target industry: "Strong fit for tech culture", "Traditional approach for finance"';
COMMENT ON COLUMN vault_leadership_philosophy.behavioral_interview_examples IS 'Example STAR stories: ["Led team through acquisition", "Built culture in startup"]';
COMMENT ON COLUMN vault_leadership_philosophy.linkedin_angle IS 'LinkedIn hook: "Why servant leadership fails in crisis situations"';

-- Executive Presence: Compare to role expectations
ALTER TABLE vault_executive_presence
ADD COLUMN IF NOT EXISTS role_fit_assessment text,
ADD COLUMN IF NOT EXISTS interview_response_hook text,
ADD COLUMN IF NOT EXISTS linkedin_credibility_boost text;

COMMENT ON COLUMN vault_executive_presence.role_fit_assessment IS 'How this presence aligns with target role: "Board presentation = strong for VP+ roles"';
COMMENT ON COLUMN vault_executive_presence.interview_response_hook IS 'How to weave into interview: "I presented to our board quarterly..."';
COMMENT ON COLUMN vault_executive_presence.linkedin_credibility_boost IS 'LinkedIn signal: "Board presentations = C-suite ready"';

-- Personality Traits: Link to job matching
ALTER TABLE vault_personality_traits
ADD COLUMN IF NOT EXISTS culture_fit_indicators text[],
ADD COLUMN IF NOT EXISTS interview_red_flags text,
ADD COLUMN IF NOT EXISTS linkedin_authenticity_note text;

COMMENT ON COLUMN vault_personality_traits.culture_fit_indicators IS 'Company cultures that fit this trait: ["Fast-paced startups", "Traditional enterprises"]';
COMMENT ON COLUMN vault_personality_traits.interview_red_flags IS 'Potential interview concerns to address proactively';
COMMENT ON COLUMN vault_personality_traits.linkedin_authenticity_note IS 'How to authentically showcase this trait on LinkedIn';

-- Work Style: Tie to team dynamics
ALTER TABLE vault_work_style
ADD COLUMN IF NOT EXISTS team_compatibility_analysis text,
ADD COLUMN IF NOT EXISTS interview_scenario_match text,
ADD COLUMN IF NOT EXISTS linkedin_work_philosophy_hook text;

COMMENT ON COLUMN vault_work_style.team_compatibility_analysis IS 'Team types this style works best with';
COMMENT ON COLUMN vault_work_style.interview_scenario_match IS 'Interview scenarios where this style shines';
COMMENT ON COLUMN vault_work_style.linkedin_work_philosophy_hook IS 'LinkedIn angle for work style posts';

-- Values & Motivations: Job search filter enhancement
ALTER TABLE vault_values_motivations
ADD COLUMN IF NOT EXISTS company_culture_alignment jsonb,
ADD COLUMN IF NOT EXISTS interview_motivation_question_prep text,
ADD COLUMN IF NOT EXISTS linkedin_authentic_voice_guide text;

COMMENT ON COLUMN vault_values_motivations.company_culture_alignment IS 'Company cultures aligned with this value: {"mission_driven": true, "high_growth": true}';
COMMENT ON COLUMN vault_values_motivations.interview_motivation_question_prep IS 'Prep for "What motivates you?" questions';
COMMENT ON COLUMN vault_values_motivations.linkedin_authentic_voice_guide IS 'How to authentically share this value on LinkedIn';

-- Behavioral Indicators: Pattern recognition
ALTER TABLE vault_behavioral_indicators
ADD COLUMN IF NOT EXISTS success_pattern_analysis text,
ADD COLUMN IF NOT EXISTS interview_behavioral_anchor text,
ADD COLUMN IF NOT EXISTS linkedin_case_study_potential text;

COMMENT ON COLUMN vault_behavioral_indicators.success_pattern_analysis IS 'What this pattern predicts about future success';
COMMENT ON COLUMN vault_behavioral_indicators.interview_behavioral_anchor IS 'Anchor point for behavioral interview questions';
COMMENT ON COLUMN vault_behavioral_indicators.linkedin_case_study_potential IS 'Could this become a LinkedIn case study post?';