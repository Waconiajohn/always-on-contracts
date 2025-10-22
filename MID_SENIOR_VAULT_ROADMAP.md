# Career Vault Improvements - Mid-Senior Professional Focus

**Target Audience:** 95% of users - Individual Contributors, Managers, Senior Managers, Directors
**Current System Grade:** B+ (already works well for this audience!)
**Goal:** Improve from B+ to A with focused, high-impact enhancements

---

## Executive Summary

**Good News:** The current Career Vault system already works well for mid-senior professionals (Managers, Directors, Senior ICs). The 25 universal questions, progressive profiling, and AI recommendations are solid.

**What We're Adding:** Focus on the **80/20 rule** - small improvements that deliver massive value to 95% of users.

**Timeline:**
- **Priority 1** (3-4 days): Critical improvements - Impact 95% of users
- **Priority 2** (1-2 weeks): Nice-to-haves - Polish and refinement
- **Priority 3** (Optional): Advanced features for power users

---

## User Segmentation

### Our Primary Users (95%):

**Individual Contributors (Senior ICs):**
- Senior Software Engineer, Staff Engineer, Principal Engineer
- Senior Product Manager, Senior Designer
- Senior Data Scientist, Senior Analyst
- **Needs:** Showcase technical depth, project impact, team collaboration

**Managers & Senior Managers:**
- Engineering Manager, Product Manager
- Design Manager, Marketing Manager
- **Needs:** Show team leadership, project delivery, stakeholder management

**Directors:**
- Director of Engineering, Product, Marketing
- **Needs:** Multi-team leadership, cross-functional projects, business impact

### Executive Users (2-5%):
- VP, SVP, C-Suite
- **Needs:** Strategic vision, P&L, board experience (the executive roadmap)

**Decision:** Optimize for the 95%, not the 5%. Executive features can be added later if demand warrants.

---

## Priority 1: High-Impact Quick Wins (3-4 Days)

### Task 1.1: Add 5 Mid-Senior Career Questions

**Goal:** Capture career progression details that matter for Managers/Directors/Senior ICs

**Estimated Time:** 1-2 days

**Questions to Add:**

#### Q26: Promotion Trajectory
```typescript
{
  id: 'mid_promotion_trajectory',
  category: 'career_progression',
  text: 'How many times have you been promoted in the last 5 years?',
  type: 'multiple_choice',
  options: [
    { value: '3_plus', label: '3+ promotions' },
    { value: '2', label: '2 promotions' },
    { value: '1', label: '1 promotion' },
    { value: '0', label: 'No promotions (but gained new responsibilities)' },
    { value: '0_none', label: 'No promotions or new responsibilities' }
  ],
  followUp: {
    condition: (answer) => answer !== '0_none',
    questions: [
      {
        text: 'What was your most recent promotion?',
        type: 'text',
        placeholder: 'e.g., "Senior Engineer → Staff Engineer" or "IC → Manager"'
      },
      {
        text: 'What did you achieve to earn it?',
        type: 'text',
        placeholder: 'e.g., "Led migration to microservices, mentored 5 engineers"'
      }
    ]
  },
  vaultMapping: {
    category: 'vault_power_phrases',
    qualityTier: 'gold'
  }
}
```

#### Q27: Cross-Functional Projects
```typescript
{
  id: 'mid_cross_functional',
  category: 'collaboration',
  text: 'Have you led or contributed to cross-functional projects?',
  type: 'multiple_choice',
  options: [
    { value: 'led_multiple', label: 'Led multiple cross-functional projects' },
    { value: 'led_one', label: 'Led 1 cross-functional project' },
    { value: 'contributed', label: 'Contributed to cross-functional projects' },
    { value: 'none', label: 'Primarily worked within my team' }
  ],
  followUp: {
    condition: (answer) => answer !== 'none',
    questions: [
      {
        text: 'Describe your biggest cross-functional project',
        type: 'text',
        placeholder: 'e.g., "Partnered with Sales, Marketing, and Product to launch new pricing model"'
      },
      {
        text: 'What was the outcome?',
        type: 'text',
        placeholder: 'e.g., "Increased conversion 23%, adopted by 80% of customers in 6 months"'
      }
    ]
  },
  vaultMapping: {
    category: 'vault_power_phrases',
    qualityTier: 'gold'
  }
}
```

#### Q28: Technical Leadership (for ICs)
```typescript
{
  id: 'mid_technical_leadership',
  category: 'technical_leadership',
  text: 'Have you provided technical leadership without being a manager?',
  type: 'checkbox',
  options: [
    'Tech lead for major projects',
    'Mentored junior engineers',
    'Designed system architecture',
    'Led technical initiatives (migrations, tooling, standards)',
    'None of the above'
  ],
  followUp: {
    condition: (answers) => !answers.includes('None of the above'),
    questions: [
      {
        text: 'What was your most impactful technical leadership contribution?',
        type: 'text',
        placeholder: 'e.g., "Designed microservices architecture adopted company-wide (20+ services)"'
      }
    ]
  },
  vaultMapping: {
    category: 'vault_leadership_philosophy',
    qualityTier: 'gold'
  }
}
```

#### Q29: Scope and Impact
```typescript
{
  id: 'mid_scope_impact',
  category: 'business_impact',
  text: 'What level of scope/impact do you typically work at?',
  type: 'multiple_choice',
  options: [
    { value: 'company_wide', label: 'Company-wide initiatives (affects entire organization)' },
    { value: 'multi_team', label: 'Multi-team projects (2+ teams)' },
    { value: 'single_team', label: 'Team-level projects' },
    { value: 'individual', label: 'Individual contributor work' }
  ],
  followUp: {
    questions: [
      {
        text: 'Give an example of your largest scope project',
        type: 'text',
        placeholder: 'e.g., "Led API redesign affecting 8 engineering teams and 200+ endpoints"'
      },
      {
        text: 'What was the business impact?',
        type: 'text',
        placeholder: 'e.g., "Reduced latency 60%, enabled 3 new product features, saved $200K/year"'
      }
    ]
  },
  vaultMapping: {
    category: 'vault_power_phrases',
    qualityTier: 'gold'
  }
}
```

#### Q30: Awards and Recognition
```typescript
{
  id: 'mid_recognition',
  category: 'achievements',
  text: 'Have you received professional awards or recognition?',
  type: 'checkbox',
  options: [
    'Company awards (Employee of the Quarter, Spot Bonus, etc.)',
    'Industry awards or certifications',
    'Conference speaker or panelist',
    'Published articles or blog posts',
    'Open source contributions (significant)',
    'None'
  ],
  followUp: {
    condition: (answers) => !answers.includes('None'),
    questions: [
      {
        text: 'Please provide details',
        type: 'text',
        placeholder: 'e.g., "Speaker at React Conf 2024, Employee of Year 2023, 2K GitHub stars on personal project"'
      }
    ]
  },
  vaultMapping: {
    category: 'vault_hidden_competencies',
    qualityTier: 'gold'
  }
}
```

**Why These Questions?**
- **Promotion trajectory** → Shows career growth velocity (hiring managers love this)
- **Cross-functional projects** → Proves collaboration skills (not just claims)
- **Technical leadership** → Differentiates senior ICs from junior ICs
- **Scope and impact** → Helps position candidates at right level
- **Recognition** → Provides third-party validation

**Database Migration:**

```sql
-- File: supabase/migrations/20251022100000_add_mid_senior_questions.sql

-- Add new category for career progression
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'competency_category') THEN
    CREATE TYPE competency_category AS ENUM ('leadership', 'business_impact', 'technical', 'collaboration');
  END IF;
END $$;

ALTER TYPE competency_category ADD VALUE IF NOT EXISTS 'career_progression';
ALTER TYPE competency_category ADD VALUE IF NOT EXISTS 'technical_leadership';
ALTER TYPE competency_category ADD VALUE IF NOT EXISTS 'achievements';

-- Track mid-senior question responses (same pattern as executive questions)
CREATE TABLE IF NOT EXISTS mid_senior_question_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  vault_id UUID REFERENCES career_vaults NOT NULL,
  question_id TEXT NOT NULL,
  response JSONB NOT NULL,
  follow_up_responses JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_mid_senior_responses_user ON mid_senior_question_responses(user_id);
CREATE INDEX idx_mid_senior_responses_vault ON mid_senior_question_responses(vault_id);

-- RLS policies
ALTER TABLE mid_senior_question_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own mid-senior responses"
  ON mid_senior_question_responses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mid-senior responses"
  ON mid_senior_question_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mid-senior responses"
  ON mid_senior_question_responses FOR UPDATE
  USING (auth.uid() = user_id);
```

**Acceptance Criteria:**
- ✅ 5 new questions added (brings total from 25 → 30)
- ✅ All map to existing vault categories (no new tables needed)
- ✅ Questions focus on career growth, collaboration, technical leadership
- ✅ Follow-ups capture quantified outcomes

---

### Task 1.2: Improve AI Inference Review (Same as Executive Roadmap)

**Goal:** Flag AI-inferred items for user confirmation (reduces hallucinations)

**Why It Matters for Mid-Senior:**
- Managers need accurate data for resumes (not AI guesses)
- Directors are just as damaged by false claims as executives
- This benefits **everyone**, not just C-suite

**Implementation:** Same as executive roadmap Priority 1, Task 1.2
- Add `needs_user_review` flag to vault tables
- Show "⚠️ AI guessed this - confirm or edit"
- User confirms (→ Silver), edits (→ Gold), or rejects

**Estimated Time:** 1-2 days

**Acceptance Criteria:**
- ✅ Soft skills require user confirmation
- ✅ UI shows pending items count
- ✅ Review flow is fast (< 30 seconds per item)

---

### Task 1.3: Better Quantification Prompting

**Goal:** Guide users to add numbers/metrics during micro-questions

**Problem:**
- Current micro-questions ask: "How many people were on your team?"
- User answers: "About 10" (vague)
- Better answer: "12 direct reports, 45-person org" (specific)

**Solution:** Add inline examples and prompts

**Example Improvements:**

```typescript
// BEFORE:
{
  questionText: "What was the team size?",
  questionType: "numeric"
}

// AFTER:
{
  questionText: "What was the team size?",
  questionType: "text",  // Changed from numeric to allow richer answers
  placeholder: "e.g., '12 direct reports, 45-person organization' or '8-person squad, part of 60-person engineering org'",
  helpText: "💡 Tip: Include direct vs indirect reports if you're a manager",
  examples: [
    "12 direct reports (3 senior engineers, 5 mid-level, 4 junior)",
    "5-person product team within 40-person product org",
    "Individual contributor on 8-person platform team"
  ]
}
```

**Better Micro-Question Templates:**

```typescript
// Upgrade Bronze → Silver: Team Size
{
  questionText: "How many people did you work with on this project?",
  placeholder: "e.g., '5-person core team + 3 cross-functional partners from Marketing'",
  examples: [
    "Solo project with code reviews from 2 senior engineers",
    "3-person team (1 designer, 2 engineers)",
    "Led team of 8 engineers + 2 PMs + 1 designer"
  ]
}

// Upgrade Bronze → Silver: Budget/Scope
{
  questionText: "What was the scope or budget for this project?",
  placeholder: "e.g., 'Q2-Q3 roadmap item, $200K AWS spend' or '6-month timeline, strategic priority'",
  examples: [
    "$500K annual spend reduction",
    "6-month project, company's #1 priority for H2",
    "3-month sprint, affected 50K users"
  ]
}

// Upgrade Silver → Gold: Measurable Outcomes
{
  questionText: "What measurable results did this project achieve?",
  placeholder: "e.g., 'Reduced load time 45%, increased conversion 12%, saved $150K/year'",
  helpText: "💡 Best: Numbers (%, $, time). Good: User feedback or adoption rate.",
  examples: [
    "Reduced API latency from 800ms to 200ms (75% improvement)",
    "Increased user engagement 34% (DAU: 10K → 13.4K)",
    "Shipped 3 weeks ahead of schedule, adopted by 90% of users in 30 days"
  ]
}
```

**File to Update:**
- `supabase/functions/generate-micro-questions/index.ts`

**Changes:**

```typescript
// Add guidance to AI prompt
const prompt = `Generate ONE micro-question to upgrade from ${currentTier} to ${targetTier}.

ITEM: ${JSON.stringify(item)}

UPGRADE RULES:
${currentTier === 'bronze' || currentTier === 'assumed'
  ? `Bronze → Silver: Need CONCRETE DETAILS
  - Team size: "12 direct reports, 45-person org" NOT "a large team"
  - Budget: "$200K project" or "6-month timeline" NOT "significant resources"
  - Scope: "Affected 8 teams, 200+ API endpoints" NOT "company-wide effort"
  - Timeline: "Q2-Q4 2023 (9 months)" NOT "several months"`
  : `Silver → Gold: Need MEASURABLE OUTCOMES
  - Performance: "Reduced latency 60% (800ms → 320ms)" NOT "made it faster"
  - Business: "Increased revenue $2M annually" NOT "grew the business"
  - Adoption: "90% team adoption in 30 days" NOT "widely adopted"
  - Efficiency: "Saved 20 hours/week for 15 engineers" NOT "improved productivity"`
}

GOOD EXAMPLES:
${currentTier === 'bronze'
  ? `- "How many engineers were on your team?" → Expects: "5 mid-level, 3 senior, 2 junior (10 total)"
  - "What was the project timeline?" → Expects: "Q2-Q3 2024 (6 months), strategic priority"
  - "What was the scope?" → Expects: "Redesigned checkout flow affecting 100K monthly transactions"`
  : `- "What % improvement did this achieve?" → Expects: "Reduced build time 67% (18min → 6min)"
  - "How many users/customers were affected?" → Expects: "Rolled out to 50K users, 85% adoption in 2 weeks"
  - "What was the business impact?" → Expects: "Saved $400K/year in infrastructure costs"`
}

Return JSON with inline examples:
{
  "questionText": "How many people were on your team?",
  "questionType": "text",
  "placeholder": "e.g., '12 direct reports, 45-person organization'",
  "helpText": "Include direct vs indirect if you're a manager",
  "examples": ["8-person squad", "3 engineers + 1 designer + 1 PM"],
  "reasoning": "Need team size to upgrade from Bronze to Silver"
}`;
```

**Estimated Time:** 1 day

**Acceptance Criteria:**
- ✅ Micro-questions include examples
- ✅ Placeholders show good vs bad answers
- ✅ Help text guides users toward quantification
- ✅ Questions use "text" type instead of "numeric" for richer answers

---

### Priority 1 Summary

**Total Effort:** 3-4 days
- Task 1.1: 1-2 days (5 questions)
- Task 1.2: 1-2 days (AI inference review)
- Task 1.3: 1 day (better prompting)

**Impact:**
- Captures career growth trajectory (promotions, scope increases)
- Reduces AI hallucinations (users confirm all inferences)
- Improves data quality (better examples = better answers)

**Who Benefits:** 95% of users (ICs, Managers, Directors)

---

## Priority 2: Nice-to-Have Enhancements (1-2 Weeks)

### Task 2.1: Project Showcase Section

**Goal:** Let users highlight 2-3 "hero projects" in their vault

**Why It Matters:**
- Managers and ICs are judged by their best work
- One exceptional project is worth 10 mediocre ones
- Makes it easy to lead with strongest achievements

**Implementation:**

```sql
-- File: supabase/migrations/20251022110000_add_project_showcase.sql

CREATE TABLE vault_project_showcase (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  vault_id UUID REFERENCES career_vaults NOT NULL,

  -- Project details
  project_name TEXT NOT NULL,
  role TEXT NOT NULL,  -- "Tech Lead", "Product Manager", "Solo Developer"
  company_name TEXT,
  duration TEXT,  -- "6 months (Q1-Q2 2024)"

  -- Problem/Solution (simplified STAR)
  problem TEXT NOT NULL,  -- "Legacy checkout flow had 45% cart abandonment"
  solution TEXT NOT NULL,  -- "Redesigned UX, reduced steps from 7 to 3, added guest checkout"
  result TEXT NOT NULL,   -- "Cart abandonment dropped to 12%, revenue +$2M annually"

  -- Team and scope
  team_size TEXT,  -- "5-person squad (2 engineers, 1 designer, 1 PM, 1 QA)"
  technologies TEXT[],  -- ['React', 'Node.js', 'PostgreSQL']
  cross_functional BOOLEAN DEFAULT false,

  -- Recognition
  recognition TEXT,  -- "Featured in company all-hands, promoted to Senior Engineer after ship"

  -- Metadata
  is_featured BOOLEAN DEFAULT false,  -- User can feature top 2-3
  display_order INTEGER,

  -- Quality tracking (same as other vault items)
  quality_tier TEXT DEFAULT 'gold',  -- User-created, so Gold
  freshness_score INTEGER DEFAULT 100,
  times_used INTEGER DEFAULT 0,
  times_kept INTEGER DEFAULT 0,
  times_edited INTEGER DEFAULT 0,
  times_removed INTEGER DEFAULT 0,
  effectiveness_score DECIMAL(3,2) DEFAULT 0.5,
  last_used_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_vault_projects_user ON vault_project_showcase(user_id);
CREATE INDEX idx_vault_projects_vault ON vault_project_showcase(vault_id);
CREATE INDEX idx_vault_projects_featured ON vault_project_showcase(is_featured) WHERE is_featured = true;

ALTER TABLE vault_project_showcase ENABLE ROW LEVEL SECURITY;

-- RLS policies (same pattern as other vault tables)
CREATE POLICY "Users can view their own projects"
  ON vault_project_showcase FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects"
  ON vault_project_showcase FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON vault_project_showcase FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON vault_project_showcase FOR DELETE
  USING (auth.uid() = user_id);
```

**UI Component:**

```typescript
// src/components/career-vault/ProjectShowcase.tsx
// - Card-based layout (visual appeal)
// - "Add Project" button
// - Form: Problem → Solution → Result (simplified STAR)
// - Mark up to 3 as "Featured" (appear first in resume)
// - Drag-to-reorder
```

**Estimated Time:** 3-4 days

**Acceptance Criteria:**
- ✅ Users can create 2-3 hero projects
- ✅ Form guides users through Problem/Solution/Result
- ✅ Can mark projects as "Featured"
- ✅ Featured projects appear first in resume generation

---

### Task 2.2: Skill Recency Warnings

**Goal:** Warn users when skills are outdated or flag them for refresh

**Why It Matters:**
- Tech skills expire fast (React 2020 vs React 2024)
- Managers haven't used some technical skills in years
- Better to remove than keep stale skills

**Implementation:**

```sql
-- Add skill age tracking
ALTER TABLE vault_transferable_skills
ADD COLUMN IF NOT EXISTS last_used_year INTEGER,
ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT true;

-- Function to detect stale skills
CREATE OR REPLACE FUNCTION detect_stale_skills()
RETURNS TABLE (
  skill_id UUID,
  skill_name TEXT,
  last_used_year INTEGER,
  years_ago INTEGER,
  recommendation TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    id,
    skill,
    last_used_year,
    (EXTRACT(YEAR FROM NOW()) - last_used_year)::INTEGER as years_ago,
    CASE
      WHEN (EXTRACT(YEAR FROM NOW()) - last_used_year) >= 5
        THEN 'Consider removing - not used in 5+ years'
      WHEN (EXTRACT(YEAR FROM NOW()) - last_used_year) >= 3
        THEN 'Flag as past experience, not current skill'
      ELSE 'Skill is recent'
    END as recommendation
  FROM vault_transferable_skills
  WHERE last_used_year IS NOT NULL
    AND (EXTRACT(YEAR FROM NOW()) - last_used_year) >= 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**UI Alert:**

```typescript
// Show warning in vault dashboard
<Alert className="bg-yellow-50 border-yellow-200">
  <AlertTriangle className="h-5 w-5 text-yellow-600" />
  <AlertDescription>
    <strong>5 skills</strong> haven't been used in 3+ years.
    <Button variant="link" onClick={() => openStaleSkillsReview()}>
      Review Now
    </Button>
  </AlertDescription>
</Alert>

// Stale skills review modal:
// - Show skill, last used year
// - Options:
//   [ ] Still using (update to current)
//   [ ] Used occasionally (mark as "past experience")
//   [ ] Remove from vault
```

**Estimated Time:** 2 days

**Acceptance Criteria:**
- ✅ Detect skills not used in 3+ years
- ✅ Show warning in vault dashboard
- ✅ Users can mark as current, past, or remove
- ✅ Resume generation prioritizes current skills

---

### Task 2.3: Simplified Cross-App Sync (LinkedIn Only)

**Goal:** Sync vault to LinkedIn profile (not resume/interview/blog - just LinkedIn)

**Why It Matters:**
- LinkedIn is the #1 professional platform
- Most users keep LinkedIn separate from vault (duplication)
- Syncing LinkedIn alone delivers 80% of cross-app value

**Implementation:**

```typescript
// File: supabase/functions/sync-vault-to-linkedin/index.ts

serve(async (req) => {
  const { vaultId } = await req.json();

  // Fetch vault data
  const { data: projects } = await supabase
    .from('vault_project_showcase')
    .select('*')
    .eq('vault_id', vaultId)
    .eq('is_featured', true)
    .order('display_order');

  const { data: skills } = await supabase
    .from('vault_transferable_skills')
    .select('*')
    .eq('vault_id', vaultId)
    .eq('is_current', true)
    .order('effectiveness_score', { ascending: false });

  // Generate LinkedIn sections
  const linkedInProfile = {
    about: generateAboutSection(projects),
    experience: projects.map(p => ({
      title: p.role,
      company: p.company_name,
      description: `${p.problem}\n\n${p.solution}\n\n${p.result}`
    })),
    skills: skills.map(s => s.skill).slice(0, 50)  // LinkedIn limit
  };

  return new Response(JSON.stringify({ linkedInProfile }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

**UI:**

```typescript
// Add "Sync to LinkedIn" button in vault dashboard
<Button onClick={syncToLinkedIn}>
  <LinkedInIcon className="mr-2" />
  Generate LinkedIn Profile
</Button>

// Shows generated sections with copy buttons:
// - About section (copy to clipboard)
// - Experience bullets (copy to clipboard)
// - Skills list (copy to clipboard)
```

**Estimated Time:** 2-3 days

**Acceptance Criteria:**
- ✅ Generate LinkedIn "About" from featured projects
- ✅ Generate "Experience" bullets from projects
- ✅ Export skills list
- ✅ Copy-to-clipboard UI (user manually pastes into LinkedIn)

---

### Priority 2 Summary

**Total Effort:** 1-2 weeks
- Task 2.1: 3-4 days (Project Showcase)
- Task 2.2: 2 days (Skill Recency)
- Task 2.3: 2-3 days (LinkedIn Sync)

**Impact:**
- Project Showcase → Highlight best work (massive resume impact)
- Skill Recency → Keep vault accurate (removes stale data)
- LinkedIn Sync → 80% of cross-app value with 20% of effort

**Who Benefits:** 95% of users

---

## Priority 3: Optional Advanced Features

### Task 3.1: Career Growth Insights Dashboard

**Goal:** Show users their career trajectory metrics

**Example Metrics:**
- "You've been promoted 2x in 3 years (top 15% of managers)"
- "Your project scope has grown from team-level to company-wide"
- "You've worked with 6 cross-functional teams"

**Estimated Time:** 1 week

---

### Task 3.2: Peer Benchmarking (Non-Executive)

**Goal:** Show how user compares to peers in same role/industry

**Example:**
- "Your team size (12 reports) is above average for Engineering Managers (median: 8)"
- "Your promotion velocity (2 promotions in 3 years) is top 20%"

**Estimated Time:** 1 week

---

### Task 3.3: Resume A/B Testing

**Goal:** Track which vault items lead to interviews

**Implementation:**
- User marks application outcome (interview, no response, rejected)
- System learns which power phrases/skills correlate with success
- Recommends high-performing items for future applications

**Estimated Time:** 2 weeks

---

## Implementation Timeline

### Week 1: Priority 1 (Critical for 95% of users)
- Days 1-2: Add 5 mid-senior questions
- Days 3-4: AI inference review
- Day 5: Better quantification prompting

### Weeks 2-3: Priority 2 (Nice-to-haves)
- Week 2, Days 1-4: Project Showcase
- Week 2, Day 5 - Week 3, Day 1: Skill Recency
- Week 3, Days 2-4: LinkedIn Sync

### Weeks 4-6: Priority 3 (Optional)
- Only if user feedback shows demand

---

## Success Metrics

**Priority 1 Completion:**
- 80%+ users complete new mid-senior questions
- AI hallucination complaints drop by 70%
- Micro-question completion rate improves 30%

**Priority 2 Completion:**
- 60%+ users create at least 1 project showcase
- Stale skill removal increases vault accuracy by 20%
- LinkedIn sync used by 40%+ of users

---

## What We're NOT Building (from Executive Roadmap)

**Removed for Mid-Senior Focus:**
- ❌ Board & Governance questions (irrelevant for 95%)
- ❌ P&L responsibility tracking (only matters for VPs+)
- ❌ M&A experience (C-suite only)
- ❌ Capital raised questions (founders/executives)
- ❌ Transformation stories vault (too complex for most)
- ❌ Thought leadership tracking (nice-to-have, not critical)
- ❌ Executive narrative engine (overkill for ICs/Managers)
- ❌ Executive competency framework (5% of users)

**Why Remove These?**
- **Impact:** These features help <5% of users
- **Complexity:** 10x more complex than mid-senior features
- **ROI:** Better to nail the 95% use case first

---

## Comparison: Executive vs Mid-Senior Roadmap

| Feature | Executive Roadmap | Mid-Senior Roadmap |
|---------|-------------------|-------------------|
| **New Questions** | 10 (board, P&L, M&A) | 5 (promotions, projects, recognition) |
| **New Vault Tables** | 4 (transformations, board, etc.) | 1 (project showcase) |
| **Cross-App Sync** | Full (resume, LinkedIn, interview, blog) | LinkedIn only |
| **Narrative Engine** | STAR stories, transformations | Simple project descriptions |
| **Time to Ship** | 1 week → 1 month → 3 months | 1 week → 2 weeks → optional |
| **Complexity** | High (new patterns, AI) | Low (extends existing patterns) |
| **Users Impacted** | 2-5% | 95% |
| **Expected Impact** | A+ for executives | A for everyone else |

---

## Recommendation

**Ship Priority 1 this week (3-4 days).** This delivers:
- ✅ Career growth questions (promotions, scope, recognition)
- ✅ AI inference review (reduces hallucinations)
- ✅ Better micro-question guidance (improves data quality)

**Impact:** Improves Career Vault for 95% of users with minimal effort.

**Then assess:** If users love it, ship Priority 2. If demand for executive features grows, revisit executive roadmap.

**Bottom line:** Optimize for the many (95%), not the few (5%).
