-- =====================================================
-- REBUILD: UNIVERSAL COMPETENCY QUESTIONS
-- Delete role-specific questions, replace with universal questions
-- that work for ANY profession
-- =====================================================

-- Delete all existing role-specific questions
DELETE FROM competency_questions;

-- =====================================================
-- CATEGORY 1: PEOPLE LEADERSHIP (5 questions)
-- Universal - applies to anyone who has led people
-- =====================================================

INSERT INTO competency_questions (
  competency_name, category, question_text, question_type,
  applicable_roles, applicable_industries,
  experience_level_min, experience_level_max,
  required_percentage, differentiator_weight,
  answer_options, ats_keywords,
  help_text, link_to_milestone, display_order
) VALUES
(
  'Direct Reports Management',
  'People Leadership',
  'Have you managed direct reports or supervised a team?',
  'multiple_choice',
  ARRAY['*'], -- Universal: works for any role
  ARRAY['*'], -- Universal: works for any industry
  1, 50,
  75, 0.6,
  '[
    {"value": "current", "label": "Yes, currently managing/supervising ___ people", "score": 100, "requires_input": true, "input_type": "number"},
    {"value": "past", "label": "Yes, previously managed/supervised ___ people", "score": 80, "requires_input": true, "input_type": "number"},
    {"value": "informal", "label": "Informal leadership (team lead, project lead)", "score": 50},
    {"value": "never", "label": "No people management experience", "score": 0}
  ]'::jsonb,
  ARRAY['people management', 'team leadership', 'supervision', 'direct reports', 'team lead'],
  'People management is valued across most senior roles. We use this to highlight leadership scope.',
  true,
  10
),
(
  'Team Size & Scale',
  'People Leadership',
  'What is the largest team size you have worked with or led?',
  'multiple_choice',
  ARRAY['*'],
  ARRAY['*'],
  1, 50,
  65, 0.5,
  '[
    {"value": "solo", "label": "Independent contributor (no team)", "score": 30},
    {"value": "small", "label": "Small team (2-5 people)", "score": 50},
    {"value": "medium", "label": "Medium team (6-15 people)", "score": 70},
    {"value": "large", "label": "Large team (16-50 people)", "score": 85},
    {"value": "very_large", "label": "Very large team (50+ people)", "score": 100}
  ]'::jsonb,
  ARRAY['team size', 'team leadership', 'collaboration', 'cross-functional'],
  'Team size indicates collaboration skills and ability to work at scale.',
  false,
  11
),
(
  'Hiring & Talent Acquisition',
  'People Leadership',
  'Have you been involved in hiring or recruiting?',
  'multiple_choice',
  ARRAY['*'],
  ARRAY['*'],
  2, 50,
  58, 0.5,
  '[
    {"value": "led_hiring", "label": "Yes, led hiring process (interviewed, made decisions)", "score": 100},
    {"value": "participated", "label": "Yes, participated in interviews/screening", "score": 70},
    {"value": "referred", "label": "Made referrals or helped recruit", "score": 40},
    {"value": "never", "label": "No hiring/recruiting experience", "score": 0}
  ]'::jsonb,
  ARRAY['hiring', 'recruiting', 'talent acquisition', 'interviewing'],
  'Hiring experience shows judgment and ability to build teams.',
  false,
  12
),
(
  'Mentorship & Development',
  'People Leadership',
  'Have you mentored, coached, or trained others?',
  'multiple_choice',
  ARRAY['*'],
  ARRAY['*'],
  2, 50,
  62, 0.4,
  '[
    {"value": "formal", "label": "Yes, formal mentorship program", "score": 100},
    {"value": "informal", "label": "Yes, informal mentoring/coaching", "score": 80},
    {"value": "training", "label": "Yes, conducted training sessions", "score": 70},
    {"value": "never", "label": "No mentorship experience", "score": 0}
  ]'::jsonb,
  ARRAY['mentorship', 'coaching', 'training', 'development', 'teaching'],
  'Mentorship demonstrates leadership potential and willingness to invest in others.',
  false,
  13
),
(
  'Performance Management',
  'People Leadership',
  'Have you managed performance (reviews, feedback, improvement plans)?',
  'multiple_choice',
  ARRAY['*'],
  ARRAY['*'],
  3, 50,
  52, 0.6,
  '[
    {"value": "regular", "label": "Yes, regular performance management responsibility", "score": 100},
    {"value": "occasional", "label": "Yes, occasional feedback/reviews", "score": 60},
    {"value": "never", "label": "No performance management experience", "score": 0}
  ]'::jsonb,
  ARRAY['performance management', 'performance reviews', 'feedback', 'coaching'],
  'Performance management shows accountability and leadership maturity.',
  false,
  14
);

-- =====================================================
-- CATEGORY 2: BUSINESS IMPACT (5 questions)
-- Universal - financial/business responsibility
-- =====================================================

INSERT INTO competency_questions (
  competency_name, category, question_text, question_type,
  applicable_roles, applicable_industries,
  experience_level_min, experience_level_max,
  required_percentage, differentiator_weight,
  answer_options, ats_keywords,
  help_text, display_order
) VALUES
(
  'Budget Management',
  'Business Impact',
  'Have you managed a budget or had financial responsibility?',
  'multiple_choice',
  ARRAY['*'],
  ARRAY['*'],
  3, 50,
  48, 0.7,
  '[
    {"value": "5m_plus", "label": "Yes, $5M+ annual budget", "score": 100},
    {"value": "1m_5m", "label": "Yes, $1M-$5M annual budget", "score": 90},
    {"value": "500k_1m", "label": "Yes, $500K-$1M budget", "score": 80},
    {"value": "100k_500k", "label": "Yes, $100K-$500K budget", "score": 70},
    {"value": "under_100k", "label": "Yes, under $100K budget", "score": 50},
    {"value": "never", "label": "No budget management experience", "score": 0}
  ]'::jsonb,
  ARRAY['budget management', 'financial responsibility', 'P&L', 'cost management'],
  'Budget management demonstrates business acumen and financial accountability.',
  20
),
(
  'Revenue Impact',
  'Business Impact',
  'Have you directly impacted revenue or business growth?',
  'multiple_choice',
  ARRAY['*'],
  ARRAY['*'],
  1, 50,
  55, 0.8,
  '[
    {"value": "direct_revenue", "label": "Yes, directly responsible for revenue (sales, partnerships)", "score": 100},
    {"value": "revenue_growth", "label": "Yes, contributed to revenue growth (product, marketing)", "score": 85},
    {"value": "cost_savings", "label": "Yes, delivered cost savings/efficiency", "score": 70},
    {"value": "indirect", "label": "Indirect business impact", "score": 40},
    {"value": "none", "label": "No measurable business impact", "score": 0}
  ]'::jsonb,
  ARRAY['revenue growth', 'business impact', 'ROI', 'cost savings'],
  'Business impact shows your contribution to the bottom line.',
  21
),
(
  'Client/Customer Interaction',
  'Business Impact',
  'How much client or customer interaction have you had?',
  'multiple_choice',
  ARRAY['*'],
  ARRAY['*'],
  0, 50,
  68, 0.5,
  '[
    {"value": "daily", "label": "Daily client/customer interactions", "score": 100},
    {"value": "weekly", "label": "Weekly client/customer interactions", "score": 80},
    {"value": "monthly", "label": "Monthly client/customer interactions", "score": 60},
    {"value": "occasional", "label": "Occasional client/customer interactions", "score": 40},
    {"value": "none", "label": "No direct client/customer interaction", "score": 20}
  ]'::jsonb,
  ARRAY['client-facing', 'customer service', 'stakeholder management', 'customer success'],
  'Client interaction shows communication skills and business awareness.',
  22
),
(
  'Executive Communication',
  'Business Impact',
  'Have you presented to or communicated with senior leadership/executives?',
  'multiple_choice',
  ARRAY['*'],
  ARRAY['*'],
  2, 50,
  45, 0.7,
  '[
    {"value": "regular", "label": "Regularly (monthly or more)", "score": 100},
    {"value": "quarterly", "label": "Occasionally (quarterly)", "score": 75},
    {"value": "annual", "label": "Rarely (annually or less)", "score": 50},
    {"value": "never", "label": "No executive communication", "score": 0}
  ]'::jsonb,
  ARRAY['executive presence', 'executive communication', 'presentations', 'stakeholder management'],
  'Executive communication demonstrates ability to operate at senior levels.',
  23
),
(
  'Strategic Planning',
  'Business Impact',
  'Have you been involved in strategic planning or decision-making?',
  'multiple_choice',
  ARRAY['*'],
  ARRAY['*'],
  3, 50,
  42, 0.6,
  '[
    {"value": "led", "label": "Yes, led strategic planning initiatives", "score": 100},
    {"value": "contributed", "label": "Yes, contributed to strategic planning", "score": 75},
    {"value": "executed", "label": "Yes, executed strategic plans", "score": 50},
    {"value": "never", "label": "No strategic planning involvement", "score": 0}
  ]'::jsonb,
  ARRAY['strategic planning', 'strategic thinking', 'business strategy', 'vision'],
  'Strategic planning shows big-picture thinking and business leadership.',
  24
);

-- =====================================================
-- CATEGORY 3: PROJECT & EXECUTION (5 questions)
-- Universal - delivery and results
-- =====================================================

INSERT INTO competency_questions (
  competency_name, category, question_text, question_type,
  applicable_roles, applicable_industries,
  experience_level_min, experience_level_max,
  required_percentage, differentiator_weight,
  answer_options, ats_keywords,
  help_text, display_order
) VALUES
(
  'Project Leadership',
  'Project & Execution',
  'Have you led projects or major initiatives?',
  'multiple_choice',
  ARRAY['*'],
  ARRAY['*'],
  1, 50,
  82, 0.5,
  '[
    {"value": "multiple_large", "label": "Yes, led multiple large projects (6+ months, 5+ people)", "score": 100},
    {"value": "single_large", "label": "Yes, led large project(s)", "score": 85},
    {"value": "small_projects", "label": "Yes, led small projects (< 6 months, < 5 people)", "score": 65},
    {"value": "contributed", "label": "Contributed to projects but didn''t lead", "score": 40},
    {"value": "never", "label": "No project leadership experience", "score": 0}
  ]'::jsonb,
  ARRAY['project management', 'project leadership', 'initiative leadership', 'delivery'],
  'Project leadership is essential for most mid-level and senior roles.',
  30
),
(
  'Cross-Functional Collaboration',
  'Project & Execution',
  'How much have you worked across different teams or departments?',
  'multiple_choice',
  ARRAY['*'],
  ARRAY['*'],
  1, 50,
  76, 0.5,
  '[
    {"value": "extensive", "label": "Extensive cross-functional work (daily/weekly)", "score": 100},
    {"value": "regular", "label": "Regular cross-functional collaboration", "score": 80},
    {"value": "occasional", "label": "Occasional cross-functional work", "score": 50},
    {"value": "rare", "label": "Mostly within my own team/department", "score": 20}
  ]'::jsonb,
  ARRAY['cross-functional', 'collaboration', 'stakeholder management', 'teamwork'],
  'Cross-functional work shows versatility and communication skills.',
  31
),
(
  'Crisis Management',
  'Project & Execution',
  'Have you managed crises, emergencies, or high-pressure situations?',
  'multiple_choice',
  ARRAY['*'],
  ARRAY['*'],
  2, 50,
  38, 0.7,
  '[
    {"value": "multiple", "label": "Yes, managed multiple crisis situations", "score": 100},
    {"value": "once", "label": "Yes, managed a crisis situation", "score": 75},
    {"value": "supported", "label": "Supported crisis response", "score": 50},
    {"value": "never", "label": "No crisis management experience", "score": 0}
  ]'::jsonb,
  ARRAY['crisis management', 'problem-solving', 'resilience', 'decision-making under pressure'],
  'Crisis management demonstrates composure and problem-solving under pressure.',
  32
),
(
  'Process Improvement',
  'Project & Execution',
  'Have you improved processes, systems, or workflows?',
  'multiple_choice',
  ARRAY['*'],
  ARRAY['*'],
  1, 50,
  64, 0.6,
  '[
    {"value": "led_transformation", "label": "Yes, led major process transformation", "score": 100},
    {"value": "significant", "label": "Yes, implemented significant improvements", "score": 85},
    {"value": "incremental", "label": "Yes, made incremental improvements", "score": 65},
    {"value": "none", "label": "No process improvement experience", "score": 0}
  ]'::jsonb,
  ARRAY['process improvement', 'operational excellence', 'efficiency', 'optimization'],
  'Process improvement shows analytical thinking and continuous improvement mindset.',
  33
),
(
  'Measurable Results',
  'Project & Execution',
  'Have you achieved quantifiable results in your work?',
  'multiple_choice',
  ARRAY['*'],
  ARRAY['*'],
  1, 50,
  88, 0.8,
  '[
    {"value": "consistently", "label": "Yes, consistently delivered measurable results (metrics, KPIs)", "score": 100},
    {"value": "sometimes", "label": "Yes, some measurable achievements", "score": 70},
    {"value": "qualitative", "label": "Mostly qualitative results", "score": 40},
    {"value": "none", "label": "No quantifiable results to share", "score": 0}
  ]'::jsonb,
  ARRAY['results-driven', 'metrics', 'KPIs', 'quantifiable achievements', 'data-driven'],
  'Quantifiable results are crucial for demonstrating impact in resumes.',
  34
);

-- =====================================================
-- CATEGORY 4: WORK ENVIRONMENT (5 questions)
-- Universal - context and adaptability
-- =====================================================

INSERT INTO competency_questions (
  competency_name, category, question_text, question_type,
  applicable_roles, applicable_industries,
  experience_level_min, experience_level_max,
  required_percentage, differentiator_weight,
  answer_options, ats_keywords,
  help_text, display_order
) VALUES
(
  'Company Size Experience',
  'Work Environment',
  'What company sizes have you worked in? (Select all that apply)',
  'multi_select',
  ARRAY['*'],
  ARRAY['*'],
  0, 50,
  70, 0.4,
  '[
    {"value": "startup", "label": "Startup (< 50 employees)"},
    {"value": "small", "label": "Small company (50-200 employees)"},
    {"value": "mid", "label": "Mid-size company (200-1000 employees)"},
    {"value": "large", "label": "Large company (1000-5000 employees)"},
    {"value": "enterprise", "label": "Enterprise (5000+ employees)"}
  ]'::jsonb,
  ARRAY['startup', 'enterprise', 'company size', 'adaptability'],
  'Company size experience helps us match you to similar environments.',
  40
),
(
  'Remote Work Experience',
  'Work Environment',
  'What is your remote/hybrid work experience?',
  'multiple_choice',
  ARRAY['*'],
  ARRAY['*'],
  0, 50,
  72, 0.3,
  '[
    {"value": "fully_remote_3plus", "label": "Fully remote for 3+ years", "score": 100},
    {"value": "fully_remote", "label": "Fully remote for 1-3 years", "score": 90},
    {"value": "hybrid", "label": "Hybrid work experience", "score": 80},
    {"value": "some_remote", "label": "Some remote work (< 1 year)", "score": 60},
    {"value": "never", "label": "Always in-office", "score": 40}
  ]'::jsonb,
  ARRAY['remote work', 'distributed teams', 'virtual collaboration', 'hybrid work'],
  'Remote work experience is increasingly valued by employers.',
  41
),
(
  'Industry Experience',
  'Work Environment',
  'What industries have you worked in? (Select all that apply)',
  'multi_select',
  ARRAY['*'],
  ARRAY['*'],
  0, 50,
  65, 0.5,
  '[
    {"value": "technology", "label": "Technology/Software"},
    {"value": "healthcare", "label": "Healthcare"},
    {"value": "finance", "label": "Finance/Banking"},
    {"value": "retail", "label": "Retail/E-commerce"},
    {"value": "manufacturing", "label": "Manufacturing"},
    {"value": "education", "label": "Education"},
    {"value": "consulting", "label": "Consulting/Professional Services"},
    {"value": "government", "label": "Government/Public Sector"},
    {"value": "nonprofit", "label": "Nonprofit"},
    {"value": "other", "label": "Other industry"}
  ]'::jsonb,
  ARRAY['industry experience', 'domain expertise', 'sector knowledge'],
  'Industry experience helps us match you to relevant opportunities.',
  42
),
(
  'Career Growth',
  'Work Environment',
  'How would you describe your career progression?',
  'multiple_choice',
  ARRAY['*'],
  ARRAY['*'],
  1, 50,
  58, 0.6,
  '[
    {"value": "rapid", "label": "Rapid progression (promotions every 1-2 years)", "score": 100},
    {"value": "steady", "label": "Steady progression (promotions every 2-4 years)", "score": 85},
    {"value": "lateral", "label": "Lateral moves (expanding expertise)", "score": 70},
    {"value": "stable", "label": "Stable (consistent role/level)", "score": 50}
  ]'::jsonb,
  ARRAY['career growth', 'upward mobility', 'promotions', 'career trajectory'],
  'Career progression pattern shows ambition and growth potential.',
  43
),
(
  'Change & Transformation',
  'Work Environment',
  'Have you worked through organizational changes or transformations?',
  'multiple_choice',
  ARRAY['*'],
  ARRAY['*'],
  2, 50,
  46, 0.5,
  '[
    {"value": "led", "label": "Yes, led transformation initiatives", "score": 100},
    {"value": "managed", "label": "Yes, managed through multiple changes", "score": 80},
    {"value": "experienced", "label": "Yes, experienced organizational changes", "score": 60},
    {"value": "never", "label": "Stable organizations only", "score": 30}
  ]'::jsonb,
  ARRAY['change management', 'transformation', 'adaptability', 'resilience'],
  'Change management experience shows adaptability and resilience.',
  44
);

-- =====================================================
-- CATEGORY 5: EXPERTISE & SKILLS (5 questions)
-- These will be supplemented by dynamic skill questions
-- extracted from the user''s resume
-- =====================================================

INSERT INTO competency_questions (
  competency_name, category, question_text, question_type,
  applicable_roles, applicable_industries,
  experience_level_min, experience_level_max,
  required_percentage, differentiator_weight,
  answer_options, ats_keywords,
  help_text, display_order
) VALUES
(
  'Years of Professional Experience',
  'Expertise & Skills',
  'How many years of professional experience do you have?',
  'numeric',
  ARRAY['*'],
  ARRAY['*'],
  0, 50,
  100, 0.3,
  '{
    "min": 0,
    "max": 50,
    "step": 0.5
  }'::jsonb,
  ARRAY['years of experience', 'professional experience', 'career experience'],
  'Years of experience helps us benchmark you against peers.',
  50
),
(
  'Primary Area of Expertise',
  'Expertise & Skills',
  'What is your primary area of expertise or specialization?',
  'text_input',
  ARRAY['*'],
  ARRAY['*'],
  0, 50,
  95, 0.7,
  '{
    "placeholder": "e.g., Software Development, Financial Analysis, Nursing, Marketing Strategy",
    "max_length": 100
  }'::jsonb,
  ARRAY['expertise', 'specialization', 'domain knowledge'],
  'Your primary expertise helps us understand your professional focus.',
  51
),
(
  'Certifications & Credentials',
  'Expertise & Skills',
  'Do you hold any professional certifications or licenses?',
  'multiple_choice',
  ARRAY['*'],
  ARRAY['*'],
  0, 50,
  52, 0.6,
  '[
    {"value": "multiple_advanced", "label": "Yes, multiple advanced certifications (CPA, PE, MD, etc.)", "score": 100},
    {"value": "single_advanced", "label": "Yes, advanced certification or license", "score": 90},
    {"value": "standard", "label": "Yes, standard industry certifications (PMP, AWS, etc.)", "score": 75},
    {"value": "none", "label": "No certifications or licenses", "score": 0}
  ]'::jsonb,
  ARRAY['certifications', 'professional license', 'credentials', 'qualified'],
  'Certifications demonstrate expertise and commitment to your field.',
  52
),
(
  'Specialized Knowledge',
  'Expertise & Skills',
  'Do you have specialized or niche expertise?',
  'multiple_choice',
  ARRAY['*'],
  ARRAY['*'],
  2, 50,
  44, 0.8,
  '[
    {"value": "deep_niche", "label": "Yes, deep expertise in niche area (rare/hard to find)", "score": 100},
    {"value": "specialized", "label": "Yes, specialized knowledge in my field", "score": 80},
    {"value": "broad", "label": "Broad generalist knowledge", "score": 50},
    {"value": "developing", "label": "Still developing my specialization", "score": 30}
  ]'::jsonb,
  ARRAY['specialized knowledge', 'niche expertise', 'subject matter expert', 'SME'],
  'Specialized expertise can be a powerful differentiator.',
  53
),
(
  'Continuous Learning',
  'Expertise & Skills',
  'How do you stay current in your field?',
  'multi_select',
  ARRAY['*'],
  ARRAY['*'],
  0, 50,
  68, 0.4,
  '[
    {"value": "formal_education", "label": "Formal education (courses, degrees)"},
    {"value": "certifications", "label": "Professional certifications"},
    {"value": "conferences", "label": "Industry conferences/events"},
    {"value": "reading", "label": "Professional reading/research"},
    {"value": "practice", "label": "Hands-on practice/experimentation"},
    {"value": "mentorship", "label": "Mentorship/coaching"},
    {"value": "none", "label": "Not actively learning"}
  ]'::jsonb,
  ARRAY['continuous learning', 'professional development', 'upskilling', 'growth mindset'],
  'Continuous learning shows growth mindset and adaptability.',
  54
);

COMMENT ON TABLE competency_questions IS 'Universal question bank with 25 questions that work for ANY profession. Supplemented by dynamic skill questions extracted from each user''s resume.';
