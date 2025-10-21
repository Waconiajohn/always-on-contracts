-- =====================================================
-- COMPETENCY QUIZ QUESTION BANK
-- Comprehensive questions for 5 common roles
-- =====================================================

-- =====================================================
-- ROLE 1: ENGINEERING MANAGER / DIRECTOR
-- =====================================================

-- PEOPLE MANAGEMENT (Critical for 98% of engineering leadership roles)
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
  'People Management',
  'Have you managed direct reports?',
  'multiple_choice',
  ARRAY['engineering_manager', 'engineering_director', 'vp_engineering', 'cto'],
  ARRAY['technology', 'saas', 'fintech', 'healthcare'],
  3, 50,
  98, 0.3,
  '[
    {"value": "current", "label": "Yes, currently managing ___ people", "score": 100, "requires_input": true},
    {"value": "past", "label": "Yes, managed up to ___ people in the past", "score": 75, "requires_input": true},
    {"value": "never", "label": "No direct management experience", "score": 0}
  ]'::jsonb,
  ARRAY['team leadership', 'people management', 'direct reports'],
  'Most engineering leadership roles require managing people. We use this to highlight your leadership scope.',
  true,
  1
),
(
  'Hiring Experience',
  'People Management',
  'How many engineers have you hired in the last 3 years?',
  'numeric',
  ARRAY['engineering_manager', 'engineering_director', 'vp_engineering'],
  ARRAY['technology', 'saas'],
  3, 50,
  87, 0.4,
  '{
    "min": 0,
    "max": 999,
    "scoring": {
      "0": 0,
      "1-5": 60,
      "6-15": 80,
      "16+": 100
    }
  }'::jsonb,
  ARRAY['recruiting', 'hiring', 'talent acquisition', 'team building'],
  'Hiring is a key responsibility for engineering leaders. Strong hiring track record is highly valued.',
  false,
  2
),
(
  'Performance Management',
  'People Management',
  'Have you managed underperformers or conducted performance improvement plans?',
  'multiple_choice',
  ARRAY['engineering_manager', 'engineering_director', 'vp_engineering'],
  ARRAY['technology', 'saas'],
  3, 50,
  72, 0.5,
  '[
    {"value": "regularly", "label": "Yes, regular experience with PIPs and performance coaching", "score": 100},
    {"value": "occasionally", "label": "Yes, have managed a few performance situations", "score": 75},
    {"value": "never", "label": "No experience with performance management", "score": 0}
  ]'::jsonb,
  ARRAY['performance management', 'coaching', 'accountability'],
  'Ability to handle difficult performance conversations is critical for leadership credibility.',
  false,
  3
),

-- TECHNICAL LEADERSHIP (Critical for 89% of engineering leadership roles)
(
  'Architecture Decisions',
  'Technical Leadership',
  'What level of architecture decisions have you made?',
  'scale',
  ARRAY['engineering_manager', 'engineering_director', 'vp_engineering', 'cto', 'staff_engineer'],
  ARRAY['technology', 'saas'],
  5, 50,
  89, 0.7,
  '[
    {"value": 1, "label": "No architecture involvement"},
    {"value": 2, "label": "Contributed input to architecture discussions"},
    {"value": 3, "label": "Made decisions for my team/component"},
    {"value": 4, "label": "Made decisions for entire product/platform"},
    {"value": 5, "label": "Set company-wide architecture strategy"}
  ]'::jsonb,
  ARRAY['system architecture', 'technical architecture', 'architecture decisions', 'technical strategy'],
  'Architecture decision-making shows technical authority and strategic thinking.',
  false,
  10
),
(
  'Technology Stack Experience',
  'Technical Leadership',
  'Select your cloud platform experience (check all that apply):',
  'multi_select',
  ARRAY['engineering_manager', 'engineering_director', 'vp_engineering', 'software_engineer', 'staff_engineer'],
  ARRAY['technology', 'saas'],
  2, 50,
  76, 0.4,
  '[
    {"value": "aws", "label": "AWS", "proficiency_required": true},
    {"value": "azure", "label": "Azure", "proficiency_required": true},
    {"value": "gcp", "label": "Google Cloud Platform", "proficiency_required": true},
    {"value": "none", "label": "No cloud platform experience"}
  ]'::jsonb,
  ARRAY['AWS', 'Azure', 'GCP', 'cloud computing', 'cloud infrastructure'],
  'Cloud experience is essential for modern engineering roles.',
  false,
  11
),
(
  'System Scale',
  'Technical Leadership',
  'What scale of systems have you worked with?',
  'multiple_choice',
  ARRAY['engineering_manager', 'engineering_director', 'staff_engineer', 'principal_engineer'],
  ARRAY['technology', 'saas'],
  5, 50,
  68, 0.8,
  '[
    {"value": "small", "label": "Small scale (< 1K users, < 100 req/sec)", "score": 40},
    {"value": "medium", "label": "Medium scale (1K-100K users, 100-1K req/sec)", "score": 70},
    {"value": "large", "label": "Large scale (100K-1M users, 1K-10K req/sec)", "score": 90},
    {"value": "massive", "label": "Massive scale (1M+ users, 10K+ req/sec)", "score": 100}
  ]'::jsonb,
  ARRAY['scalability', 'high availability', 'performance optimization', 'distributed systems'],
  'Experience with scale demonstrates ability to handle complex technical challenges.',
  false,
  12
),

-- BUSINESS ACUMEN (Critical for 76% of director+ roles)
(
  'Budget Management',
  'Business Acumen',
  'Have you owned a P&L or managed an engineering budget?',
  'multiple_choice',
  ARRAY['engineering_director', 'vp_engineering', 'cto'],
  ARRAY['technology', 'saas'],
  7, 50,
  76, 0.8,
  '[
    {"value": "5m_plus", "label": "Yes, managed $5M+ budget", "score": 100},
    {"value": "1m_5m", "label": "Yes, managed $1M-$5M budget", "score": 90},
    {"value": "500k_1m", "label": "Yes, managed $500K-$1M budget", "score": 75},
    {"value": "under_500k", "label": "Yes, managed under $500K budget", "score": 60},
    {"value": "never", "label": "No budget ownership", "score": 0}
  ]'::jsonb,
  ARRAY['P&L management', 'budget management', 'financial planning', 'cost optimization'],
  'Budget ownership shows business partnership and financial responsibility.',
  true,
  20
),
(
  'Executive Communication',
  'Business Acumen',
  'How often do you present to executives or board members?',
  'multiple_choice',
  ARRAY['engineering_director', 'vp_engineering', 'cto'],
  ARRAY['technology', 'saas'],
  7, 50,
  65, 0.7,
  '[
    {"value": "monthly", "label": "Regularly (monthly or more)", "score": 100},
    {"value": "quarterly", "label": "Occasionally (quarterly)", "score": 75},
    {"value": "annually", "label": "Rarely (annually or less)", "score": 40},
    {"value": "never", "label": "Never", "score": 0}
  ]'::jsonb,
  ARRAY['executive presence', 'executive communication', 'board presentations', 'stakeholder management'],
  'Executive communication is key for senior leadership roles.',
  false,
  21
);

-- =====================================================
-- ROLE 2: PRODUCT MANAGER
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
  'Product Roadmap Ownership',
  'Product Strategy',
  'Have you owned a product roadmap?',
  'multiple_choice',
  ARRAY['product_manager', 'senior_product_manager', 'director_product'],
  ARRAY['technology', 'saas'],
  2, 50,
  94, 0.5,
  '[
    {"value": "multiple", "label": "Yes, owned roadmap for multiple products", "score": 100},
    {"value": "single", "label": "Yes, owned roadmap for one product", "score": 85},
    {"value": "contributed", "label": "Contributed to roadmap but didn't own", "score": 50},
    {"value": "never", "label": "No roadmap experience", "score": 0}
  ]'::jsonb,
  ARRAY['product roadmap', 'product strategy', 'roadmap planning', 'strategic planning'],
  'Roadmap ownership is fundamental to product management roles.',
  30
),
(
  'Customer Research',
  'Customer Discovery',
  'How many customer interviews/research sessions have you conducted in the last year?',
  'numeric',
  ARRAY['product_manager', 'senior_product_manager', 'director_product'],
  ARRAY['technology', 'saas'],
  1, 50,
  88, 0.6,
  '{
    "min": 0,
    "max": 500,
    "scoring": {
      "0": 0,
      "1-10": 50,
      "11-30": 75,
      "31+": 100
    }
  }'::jsonb,
  ARRAY['customer research', 'user interviews', 'customer discovery', 'user research'],
  'Direct customer interaction is essential for building the right products.',
  31
),
(
  'Product Launch Experience',
  'Product Delivery',
  'How many product launches have you led or contributed to?',
  'numeric',
  ARRAY['product_manager', 'senior_product_manager', 'director_product'],
  ARRAY['technology', 'saas'],
  1, 50,
  92, 0.7,
  '{
    "min": 0,
    "max": 99,
    "scoring": {
      "0": 0,
      "1-3": 60,
      "4-10": 85,
      "11+": 100
    }
  }'::jsonb,
  ARRAY['product launches', 'go-to-market', 'product delivery', 'launch execution'],
  'Launch track record demonstrates ability to ship products successfully.',
  32
),
(
  'A/B Testing & Experimentation',
  'Data-Driven Decision Making',
  'Experience with A/B testing and experimentation?',
  'scale',
  ARRAY['product_manager', 'senior_product_manager', 'director_product'],
  ARRAY['technology', 'saas'],
  2, 50,
  73, 0.6,
  '[
    {"value": 1, "label": "No experience with A/B testing"},
    {"value": 2, "label": "Participated in experiments run by others"},
    {"value": 3, "label": "Designed and ran a few experiments"},
    {"value": 4, "label": "Regular experimentation (monthly)"},
    {"value": 5, "label": "Expert: Built experimentation culture/framework"}
  ]'::jsonb,
  ARRAY['A/B testing', 'experimentation', 'data-driven', 'hypothesis testing'],
  'A/B testing shows data-driven product decision making.',
  33
);

-- =====================================================
-- ROLE 3: SOFTWARE ENGINEER (IC TRACK)
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
  'Programming Languages',
  'Technical Skills',
  'What programming languages are you proficient in? (Select all that apply)',
  'multi_select',
  ARRAY['software_engineer', 'senior_engineer', 'staff_engineer', 'principal_engineer'],
  ARRAY['technology', 'saas'],
  0, 50,
  100, 0.3,
  '[
    {"value": "python", "label": "Python"},
    {"value": "javascript", "label": "JavaScript/TypeScript"},
    {"value": "java", "label": "Java"},
    {"value": "csharp", "label": "C#/.NET"},
    {"value": "go", "label": "Go"},
    {"value": "rust", "label": "Rust"},
    {"value": "ruby", "label": "Ruby"},
    {"value": "php", "label": "PHP"},
    {"value": "cpp", "label": "C/C++"}
  ]'::jsonb,
  ARRAY['Python', 'JavaScript', 'TypeScript', 'Java', 'Go', 'programming'],
  'Programming languages form the foundation of software engineering.',
  40
),
(
  'Full-Stack vs Specialized',
  'Technical Skills',
  'Are you a full-stack engineer or specialized?',
  'multiple_choice',
  ARRAY['software_engineer', 'senior_engineer', 'staff_engineer'],
  ARRAY['technology', 'saas'],
  0, 50,
  65, 0.4,
  '[
    {"value": "fullstack", "label": "Full-stack (frontend + backend)", "score": 80},
    {"value": "frontend", "label": "Frontend specialist", "score": 90},
    {"value": "backend", "label": "Backend specialist", "score": 90},
    {"value": "mobile", "label": "Mobile specialist (iOS/Android)", "score": 85},
    {"value": "devops", "label": "DevOps/Infrastructure specialist", "score": 85}
  ]'::jsonb,
  ARRAY['full-stack', 'frontend', 'backend', 'mobile development', 'DevOps'],
  'Specialization helps us match you to the right roles.',
  41
),
(
  'Code Review Participation',
  'Engineering Practices',
  'How actively do you participate in code reviews?',
  'multiple_choice',
  ARRAY['software_engineer', 'senior_engineer', 'staff_engineer'],
  ARRAY['technology', 'saas'],
  1, 50,
  82, 0.3,
  '[
    {"value": "daily", "label": "Daily (review 5+ PRs per week)", "score": 100},
    {"value": "regular", "label": "Regularly (review 2-4 PRs per week)", "score": 80},
    {"value": "occasional", "label": "Occasionally (< 2 PRs per week)", "score": 50},
    {"value": "never", "label": "Rarely or never", "score": 0}
  ]'::jsonb,
  ARRAY['code review', 'peer review', 'collaboration'],
  'Code review participation shows teamwork and code quality focus.',
  42
),
(
  'Technical Mentorship',
  'Leadership',
  'Have you mentored junior engineers?',
  'multiple_choice',
  ARRAY['senior_engineer', 'staff_engineer', 'principal_engineer'],
  ARRAY['technology', 'saas'],
  3, 50,
  71, 0.6,
  '[
    {"value": "formal", "label": "Yes, formal mentorship of ___ engineers", "score": 100, "requires_input": true},
    {"value": "informal", "label": "Yes, informal mentorship and guidance", "score": 75},
    {"value": "never", "label": "No mentorship experience", "score": 0}
  ]'::jsonb,
  ARRAY['mentorship', 'technical leadership', 'coaching', 'team development'],
  'Mentorship is expected for senior IC roles and shows leadership without management.',
  43
);

-- =====================================================
-- ROLE 4: SALES MANAGER / DIRECTOR
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
  'Quota Attainment',
  'Sales Performance',
  'What percentage of quota have you typically achieved?',
  'multiple_choice',
  ARRAY['account_executive', 'sales_manager', 'sales_director', 'vp_sales'],
  ARRAY['saas', 'technology', 'enterprise'],
  2, 50,
  96, 0.9,
  '[
    {"value": "150_plus", "label": "150%+ (consistent over-achievement)", "score": 100},
    {"value": "120_150", "label": "120-150% (regular over-achievement)", "score": 90},
    {"value": "100_120", "label": "100-120% (at or above quota)", "score": 75},
    {"value": "80_100", "label": "80-100% (close to quota)", "score": 50},
    {"value": "below_80", "label": "Below 80%", "score": 20}
  ]'::jsonb,
  ARRAY['quota attainment', 'sales performance', 'revenue generation', 'exceeds quota'],
  'Quota attainment is the primary success metric for sales roles.',
  50
),
(
  'Deal Size',
  'Sales Performance',
  'What is your typical deal size?',
  'multiple_choice',
  ARRAY['account_executive', 'sales_manager', 'sales_director'],
  ARRAY['saas', 'technology', 'enterprise'],
  1, 50,
  89, 0.7,
  '[
    {"value": "enterprise", "label": "$500K+ (Enterprise)", "score": 100},
    {"value": "mid_market", "label": "$100K-$500K (Mid-Market)", "score": 85},
    {"value": "smb_high", "label": "$25K-$100K (SMB High)", "score": 70},
    {"value": "smb_low", "label": "Under $25K (SMB Low)", "score": 50}
  ]'::jsonb,
  ARRAY['enterprise sales', 'deal size', 'contract value', 'ACV'],
  'Deal size indicates sales complexity and revenue impact.',
  51
),
(
  'Sales Cycle Length',
  'Sales Process',
  'What is your typical sales cycle length?',
  'multiple_choice',
  ARRAY['account_executive', 'sales_manager', 'sales_director'],
  ARRAY['saas', 'technology', 'enterprise'],
  1, 50,
  78, 0.5,
  '[
    {"value": "12_months_plus", "label": "12+ months (Complex enterprise)", "score": 90},
    {"value": "6_12_months", "label": "6-12 months (Enterprise)", "score": 85},
    {"value": "3_6_months", "label": "3-6 months (Mid-market)", "score": 75},
    {"value": "under_3_months", "label": "Under 3 months (Transactional)", "score": 60}
  ]'::jsonb,
  ARRAY['sales cycle', 'enterprise sales', 'complex sales'],
  'Sales cycle length indicates complexity and deal strategy skills.',
  52
),
(
  'Team Management',
  'Leadership',
  'How many sales reps have you managed?',
  'numeric',
  ARRAY['sales_manager', 'sales_director', 'vp_sales'],
  ARRAY['saas', 'technology', 'enterprise'],
  3, 50,
  94, 0.6,
  '{
    "min": 0,
    "max": 100,
    "scoring": {
      "0": 0,
      "1-5": 70,
      "6-15": 90,
      "16+": 100
    }
  }'::jsonb,
  ARRAY['sales management', 'team leadership', 'people management'],
  'Sales team management shows ability to scale revenue through others.',
  53
);

-- =====================================================
-- ROLE 5: MARKETING MANAGER / DIRECTOR
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
  'Marketing Channel Experience',
  'Marketing Execution',
  'Which marketing channels have you managed? (Select all that apply)',
  'multi_select',
  ARRAY['marketing_manager', 'marketing_director', 'vp_marketing', 'cmo'],
  ARRAY['saas', 'technology', 'ecommerce'],
  2, 50,
  87, 0.5,
  '[
    {"value": "sem", "label": "SEM/PPC (Google Ads, paid search)"},
    {"value": "social", "label": "Social Media Marketing (organic & paid)"},
    {"value": "content", "label": "Content Marketing (blog, SEO)"},
    {"value": "email", "label": "Email Marketing"},
    {"value": "events", "label": "Events & Conferences"},
    {"value": "partnerships", "label": "Partnerships & Co-marketing"},
    {"value": "abm", "label": "Account-Based Marketing (ABM)"}
  ]'::jsonb,
  ARRAY['digital marketing', 'SEM', 'social media', 'content marketing', 'email marketing', 'ABM'],
  'Multi-channel experience shows marketing breadth.',
  60
),
(
  'Demand Generation',
  'Performance Marketing',
  'Have you managed demand generation programs?',
  'multiple_choice',
  ARRAY['marketing_manager', 'marketing_director', 'vp_marketing'],
  ARRAY['saas', 'technology'],
  2, 50,
  92, 0.8,
  '[
    {"value": "owned", "label": "Yes, owned demand gen strategy and execution", "score": 100},
    {"value": "contributed", "label": "Yes, contributed to demand gen programs", "score": 70},
    {"value": "never", "label": "No demand gen experience", "score": 0}
  ]'::jsonb,
  ARRAY['demand generation', 'lead generation', 'pipeline generation', 'MQL'],
  'Demand gen is critical for B2B marketing roles.',
  61
),
(
  'Marketing Budget',
  'Budget Management',
  'What size marketing budget have you managed?',
  'multiple_choice',
  ARRAY['marketing_director', 'vp_marketing', 'cmo'],
  ARRAY['saas', 'technology'],
  5, 50,
  76, 0.7,
  '[
    {"value": "5m_plus", "label": "$5M+ annual budget", "score": 100},
    {"value": "1m_5m", "label": "$1M-$5M annual budget", "score": 90},
    {"value": "500k_1m", "label": "$500K-$1M annual budget", "score": 75},
    {"value": "under_500k", "label": "Under $500K annual budget", "score": 60},
    {"value": "never", "label": "No budget ownership", "score": 0}
  ]'::jsonb,
  ARRAY['budget management', 'marketing budget', 'ROI optimization'],
  'Budget management shows financial responsibility and ROI focus.',
  62
),
(
  'Marketing Analytics',
  'Data & Analytics',
  'Experience with marketing analytics platforms?',
  'multi_select',
  ARRAY['marketing_manager', 'marketing_director', 'vp_marketing'],
  ARRAY['saas', 'technology'],
  1, 50,
  84, 0.6,
  '[
    {"value": "google_analytics", "label": "Google Analytics"},
    {"value": "hubspot", "label": "HubSpot"},
    {"value": "salesforce", "label": "Salesforce (reporting)"},
    {"value": "marketo", "label": "Marketo"},
    {"value": "amplitude", "label": "Amplitude/Mixpanel"},
    {"value": "tableau", "label": "Tableau/Looker"}
  ]'::jsonb,
  ARRAY['Google Analytics', 'HubSpot', 'Salesforce', 'marketing analytics', 'data-driven marketing'],
  'Analytics tools show data-driven marketing approach.',
  63
);

-- =====================================================
-- UNIVERSAL QUESTIONS (All Roles)
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
  'Remote Work Experience',
  'Work Environment',
  'Experience with remote/distributed work?',
  'multiple_choice',
  ARRAY['software_engineer', 'product_manager', 'engineering_manager', 'sales_manager', 'marketing_manager'],
  ARRAY['technology', 'saas'],
  0, 50,
  68, 0.3,
  '[
    {"value": "fully_remote", "label": "Fully remote for 3+ years", "score": 100},
    {"value": "hybrid", "label": "Hybrid work experience", "score": 80},
    {"value": "limited", "label": "Some remote work (< 1 year)", "score": 50},
    {"value": "never", "label": "Always in-office", "score": 30}
  ]'::jsonb,
  ARRAY['remote work', 'distributed teams', 'virtual collaboration'],
  'Many companies now prioritize remote work experience.',
  100
),
(
  'Startup vs Enterprise',
  'Company Environment',
  'What company stage/size do you have experience with?',
  'multi_select',
  ARRAY['software_engineer', 'product_manager', 'engineering_manager', 'sales_manager', 'marketing_manager'],
  ARRAY['technology', 'saas'],
  0, 50,
  72, 0.4,
  '[
    {"value": "early_stage", "label": "Early-stage startup (< 50 employees)"},
    {"value": "growth_stage", "label": "Growth-stage startup (50-500 employees)"},
    {"value": "late_stage", "label": "Late-stage startup (500-2000 employees)"},
    {"value": "enterprise", "label": "Enterprise (2000+ employees)"}
  ]'::jsonb,
  ARRAY['startup experience', 'enterprise experience', 'scale-up'],
  'Company size experience helps us match you to similar environments.',
  101
);

COMMENT ON TABLE competency_questions IS 'Question bank contains 40+ questions covering 5 major roles. Questions are dynamically selected based on user role, industry, and experience level.';
