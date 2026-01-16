# Career Competency Quiz Architecture

## Question Bank Structure

### Database Schema:

```sql
CREATE TABLE competency_questions (
  id UUID PRIMARY KEY,
  competency_name TEXT NOT NULL,
  category TEXT NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT CHECK (question_type IN ('yes_no', 'scale', 'numeric', 'multiple_choice', 'multi_select')),
  
  -- Targeting
  applicable_roles TEXT[], -- ['engineering_director', 'vp_engineering']
  applicable_industries TEXT[], -- ['saas', 'technology', 'healthcare']
  experience_level_min INT, -- 0-20 years
  experience_level_max INT,
  
  -- Importance
  required_percentage DECIMAL, -- What % of jobs require this competency
  differentiator_weight DECIMAL, -- How much this sets candidates apart (0-1)
  
  -- Answer options
  answer_options JSONB,
  
  -- Evidence linking
  requires_example BOOLEAN, -- Should we ask for a story?
  link_to_milestone BOOLEAN -- Should this link to specific job?
);
```

### Sample Questions for Engineering Director:

```json
{
  "people_management": [
    {
      "competency": "Direct Reports Management",
      "question": "Have you managed direct reports?",
      "type": "multiple_choice",
      "options": [
        {"value": "current", "label": "Yes, currently managing [INPUT] people", "score": 100},
        {"value": "past", "label": "Yes, managed up to [INPUT] people in the past", "score": 75},
        {"value": "never", "label": "No direct management experience", "score": 0}
      ],
      "required_percentage": 98,
      "differentiator_weight": 0.3,
      "follow_up_if": "current OR past",
      "follow_up_question": "Which jobs involved managing people? (Select from your resume)"
    },
    {
      "competency": "Hiring Experience",
      "question": "Have you hired engineering talent?",
      "type": "numeric",
      "prompt": "How many engineers have you hired in the last 3 years?",
      "scoring": {
        "0": 0,
        "1-5": 60,
        "6-15": 80,
        "16+": 100
      },
      "required_percentage": 87,
      "differentiator_weight": 0.4
    }
  ],
  
  "technical_leadership": [
    {
      "competency": "Architecture Decisions",
      "question": "Have you made technology stack decisions?",
      "type": "scale",
      "scale": [
        {"value": 1, "label": "No architecture involvement"},
        {"value": 2, "label": "Contributed input to architecture discussions"},
        {"value": 3, "label": "Made decisions for team/component"},
        {"value": 4, "label": "Made decisions for entire product"},
        {"value": 5, "label": "Set architecture strategy for company"}
      ],
      "required_percentage": 82,
      "differentiator_weight": 0.6
    }
  ],
  
  "business_acumen": [
    {
      "competency": "P&L Ownership",
      "question": "Have you owned a P&L or engineering budget?",
      "type": "multiple_choice",
      "options": [
        {"value": "5m_plus", "label": "Yes, managed $5M+ budget", "score": 100},
        {"value": "1m_5m", "label": "Yes, managed $1M-$5M budget", "score": 90},
        {"value": "500k_1m", "label": "Yes, managed $500K-$1M budget", "score": 75},
        {"value": "under_500k", "label": "Yes, managed under $500K budget", "score": 60},
        {"value": "never", "label": "No budget ownership", "score": 0}
      ],
      "required_percentage": 76,
      "differentiator_weight": 0.8,
      "premium_question": true  // Only for director+ level
    }
  ]
}
```

## Advantages Over STAR:

1. **Comprehensive**: Asks about ALL expected competencies (nothing missed)
2. **Quantifiable**: Structured answers enable scoring/benchmarking
3. **Comparable**: Can compare users in same role/industry
4. **Targeted**: Questions adapt to user's specific role/level
5. **Evidence-linked**: Connects answers to specific jobs from resume
6. **Weighted**: Knows which competencies matter most

## Quiz Flow:

```
1. User uploads resume
   ↓
2. System extracts:
   - Current/target role: "Engineering Director"
   - Industry: "SaaS/Technology"
   - Experience level: 12 years
   ↓
3. System generates personalized quiz:
   - Pulls questions for "engineering_director" + "saas"
   - Filters to experience level 10-15 years
   - Sorts by required_percentage (most important first)
   ↓
4. User completes quiz (15-20 minutes):
   - 40-50 targeted questions
   - Progress bar shows completion
   - "Why we're asking this" tooltips
   ↓
5. System builds vault:
   - Each answer → vault_competency record
   - Links to specific jobs (when applicable)
   - Assigns quality_tier: "gold" (user-provided)
   - Calculates coverage_score: "You have 87% of expected competencies"
   ↓
6. System provides feedback:
   - "Strong areas: Technical Architecture, Product Delivery"
   - "Development areas: Executive presentations, M&A experience"
   - "Your profile matches 78% of Engineering Director postings"
```

## Resume Generation Improvement:

### Current Problem:
```
Job requires: "P&L management experience"
Vault has: AI-inferred "probably has business acumen" (Bronze quality)
Resume says: Generic statement about "business strategy"
```

### With Quiz:
```
Job requires: "P&L management experience"
Vault has: User confirmed "$2.5M budget ownership" (Gold quality)
         + Linked to "Director role at TechCorp 2020-2023"
         + Proficiency: Advanced (4/5)
Resume says: "Managed $2.5M engineering budget at TechCorp, optimizing costs 18% while scaling team 40%"
              ↑ Specific, verified, includes scope from quiz
```

## Benchmark Feature:

After quiz completion:

```
YOUR COMPETENCY PROFILE

Compared to 1,247 Engineering Directors in SaaS:

People Management:        ████████░░ 82nd percentile ⭐
Technical Architecture:   ██████████ 95th percentile ⭐⭐
Business Acumen:          █████░░░░░ 54th percentile
Product/Delivery:         ████████░░ 79th percentile ⭐
Crisis Management:        ███████░░░ 68th percentile

COMPETITIVE POSITIONING:
✅ Strong: Your technical architecture skills are exceptional
✅ Strong: People management well above average
⚠️  Develop: Business acumen below director average
💡 Tip: Highlight technical leadership in applications, downplay P&L
```

## Progressive Enhancement:

After each job application:
```
You applied to "VP Engineering at FinTech Startup"

QUIZ UPDATE PROMPT:
The job emphasized "scaling engineering from 10 to 100+ people"

Quick question: Have you scaled a team this much?
○ Yes, scaled from [__] to [__] at [SELECT JOB]
○ No, my largest scale was [__] to [__]
○ Skip

[This updates your vault + improves future matches]
```

## Implementation Priority:

### Phase 1: Core Question Bank (2 weeks)
- Build 200 questions across 5 common roles:
  - Software Engineer
  - Engineering Manager
  - Product Manager
  - Sales Manager
  - Marketing Manager
- Cover 10 core competency categories

### Phase 2: Quiz Engine (2 weeks)
- Dynamic question selection based on role/industry
- Progress tracking
- Answer validation
- Vault writing

### Phase 3: Benchmarking (1 week)
- Calculate percentiles
- Compare to role averages
- Competitive positioning

### Phase 4: Integration (1 week)
- Connect to resume generation
- Use quiz data instead of AI inference
- Show which competencies were used in each resume

## Success Metrics:

| Metric | STAR Approach | Quiz Approach |
|--------|---------------|---------------|
| Completion time | 20-30 min | 15-20 min |
| Vault quality | 75% (depends on user stories) | 95% (structured data) |
| Coverage | 60% (what user remembers) | 100% (all competencies) |
| Resume edit rate | 50% | 20% (better data = better output) |
| Benchmarking | Impossible | Enabled |

