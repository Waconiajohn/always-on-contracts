# Executive Career Vault - Implementation Roadmap

**Based on:** Senior Engineer Review (October 21, 2025)
**Overall Goal:** Transform Career Vault from B+ (good for mid-level) to A (exceptional for executives)
**Gap Identified:** Missing 60% of executive value proposition

---

## Executive Summary

The Career Vault has a solid technical foundation but needs focused improvements to serve executive-level professionals effectively. This roadmap breaks down the work into three priorities:

- **Priority 1** (1 week): Critical gaps - Executive questions, AI inference review
- **Priority 2** (1 month): Executive vault categories, narrative engine, cross-app sync
- **Priority 3** (3 months): Advanced features - Competency framework, competitive intel, ML

**Expected Impact:**
- Priority 1 → 80% of executive value captured
- Priority 2 → 95% of executive value captured
- Priority 3 → Best-in-class executive intelligence platform

---

## Priority 1: Critical Executive Gaps (1 Week)

### Overview
These changes capture C-suite competencies currently missing and reduce AI hallucination risk.

**Estimated Time:** 5-7 days
**Impact:** Captures 80% of missing executive value
**Risk:** Low (extends existing patterns)

---

### Task 1.1: Add 10 Executive Questions to Quiz

**Goal:** Expand universal questions from 25 → 35 to capture board, P&L, M&A, thought leadership

**Files to Create/Modify:**
1. `supabase/migrations/20251022000000_add_executive_questions.sql`
2. `src/data/competencyQuestions.ts` (if questions stored in code)
3. `supabase/functions/generate-competency-quiz/index.ts` (update to include new questions)

**New Questions:**

#### Q26: Board Experience
```typescript
{
  id: 'exec_board_experience',
  category: 'executive_governance',
  text: 'Have you served on a board of directors or advisory board?',
  type: 'multiple_choice',
  options: [
    { value: 'public_director', label: 'Current director (public company)' },
    { value: 'private_director', label: 'Current director (private company)' },
    { value: 'board_observer', label: 'Board observer' },
    { value: 'advisory_board', label: 'Advisory board member' },
    { value: 'none', label: 'None' }
  ],
  followUp: {
    condition: (answer) => answer !== 'none',
    questions: [
      {
        text: 'What committees have you served on?',
        type: 'checkbox',
        options: ['Audit', 'Compensation', 'Governance', 'Nominating', 'Risk', 'Technology', 'Other']
      },
      {
        text: 'How many boards total?',
        type: 'numeric'
      }
    ]
  },
  vaultMapping: {
    category: 'vault_board_governance',
    qualityTier: 'gold'
  }
}
```

#### Q27: P&L Responsibility
```typescript
{
  id: 'exec_pl_responsibility',
  category: 'executive_financial',
  text: "What's the largest P&L (profit & loss) you've directly managed?",
  type: 'multiple_choice',
  options: [
    { value: 'over_1b', label: '$1B+' },
    { value: '500m_1b', label: '$500M - $1B' },
    { value: '100m_500m', label: '$100M - $500M' },
    { value: '50m_100m', label: '$50M - $100M' },
    { value: '10m_50m', label: '$10M - $50M' },
    { value: 'under_10m', label: 'Under $10M' },
    { value: 'no_pl', label: 'No P&L responsibility' }
  ],
  followUp: {
    condition: (answer) => answer !== 'no_pl',
    questions: [
      {
        text: 'Revenue growth during your tenure?',
        type: 'text',
        placeholder: 'e.g., "Grew from $50M to $200M ARR (4x in 3 years)"'
      },
      {
        text: 'Margin improvement?',
        type: 'text',
        placeholder: 'e.g., "EBITDA: 12% → 28%"'
      }
    ]
  },
  vaultMapping: {
    category: 'vault_financial_outcomes',
    qualityTier: 'gold'
  }
}
```

#### Q28: Team Scale
```typescript
{
  id: 'exec_team_scale',
  category: 'executive_leadership',
  text: "What's the largest team you've built or led?",
  type: 'multiple_choice',
  options: [
    { value: 'over_1000', label: '1,000+ people' },
    { value: '500_1000', label: '500-1,000 people' },
    { value: '100_500', label: '100-500 people' },
    { value: '50_100', label: '50-100 people' },
    { value: '10_50', label: '10-50 people' },
    { value: 'under_10', label: 'Under 10 people' }
  ],
  followUp: {
    condition: (answer) => answer !== 'under_10',
    questions: [
      {
        text: 'How many direct reports?',
        type: 'numeric'
      },
      {
        text: 'Did you build this team from scratch or inherit it?',
        type: 'multiple_choice',
        options: ['Built from scratch', 'Inherited and scaled', 'Mix of both']
      },
      {
        text: 'Key talent outcomes?',
        type: 'text',
        placeholder: 'e.g., "5 promoted to VP, 3 joined from Google/Meta, 90% retention"'
      }
    ]
  },
  vaultMapping: {
    category: 'vault_leadership_philosophy',
    qualityTier: 'gold'
  }
}
```

#### Q29: Capital Raised
```typescript
{
  id: 'exec_capital_raised',
  category: 'executive_financial',
  text: 'Have you raised capital for a company?',
  type: 'multiple_choice',
  options: [
    { value: 'ipo', label: 'Led IPO process' },
    { value: 'series_c_plus', label: 'Series C+ (>$50M)' },
    { value: 'series_ab', label: 'Series A-B ($5-50M)' },
    { value: 'seed', label: 'Angel/Seed (<$5M)' },
    { value: 'debt', label: 'Debt financing' },
    { value: 'none', label: 'None' }
  ],
  followUp: {
    condition: (answer) => answer !== 'none',
    questions: [
      {
        text: 'Total amount raised?',
        type: 'text',
        placeholder: 'e.g., "$150M across Series B, C, D"'
      },
      {
        text: 'Lead investors?',
        type: 'text',
        placeholder: 'e.g., "Sequoia, a16z, Accel"'
      }
    ]
  },
  vaultMapping: {
    category: 'vault_financial_outcomes',
    qualityTier: 'gold'
  }
}
```

#### Q30: M&A Experience
```typescript
{
  id: 'exec_ma_experience',
  category: 'executive_strategic',
  text: 'Have you led mergers, acquisitions, or company sales?',
  type: 'checkbox',
  options: [
    'Acquired companies (buy-side)',
    'Been acquired (sell-side)',
    'Sold company (exit)',
    'Integrated acquisitions post-close',
    'None'
  ],
  followUp: {
    condition: (answers) => !answers.includes('None'),
    questions: [
      {
        text: 'Number of transactions?',
        type: 'numeric'
      },
      {
        text: 'Deal size range?',
        type: 'text',
        placeholder: 'e.g., "$5M-$80M total"'
      },
      {
        text: 'Integration success?',
        type: 'text',
        placeholder: 'e.g., "Retained 85% of acquired talent, hit synergy targets in 12 months"'
      }
    ]
  },
  vaultMapping: {
    category: 'vault_transformation_stories',
    qualityTier: 'gold'
  }
}
```

#### Q31: Market Expansion
```typescript
{
  id: 'exec_market_expansion',
  category: 'executive_strategic',
  text: 'Have you led geographic or product expansion?',
  type: 'checkbox',
  options: [
    'New geographic markets',
    'New product lines',
    'New customer segments',
    'International expansion',
    'None'
  ],
  followUp: {
    condition: (answers) => !answers.includes('None'),
    questions: [
      {
        text: 'Outcome metrics?',
        type: 'text',
        placeholder: 'e.g., "Expanded from 1 market to 12 countries, $0 to $40M international revenue"'
      }
    ]
  },
  vaultMapping: {
    category: 'vault_transformation_stories',
    qualityTier: 'gold'
  }
}
```

#### Q32: Crisis Management
```typescript
{
  id: 'exec_crisis_management',
  category: 'executive_leadership',
  text: 'Have you managed a major company or product crisis?',
  type: 'checkbox',
  options: [
    'PR disaster/reputation crisis',
    'Regulatory investigation',
    'Financial distress/restructuring',
    'Product failure or recall',
    'Security breach/data leak',
    'None'
  ],
  followUp: {
    condition: (answers) => !answers.includes('None'),
    questions: [
      {
        text: 'Outcome and lessons learned?',
        type: 'text',
        placeholder: 'e.g., "Led turnaround of product crisis, restored customer trust in 90 days (NPS 3.1→4.2)"'
      }
    ]
  },
  vaultMapping: {
    category: 'vault_transformation_stories',
    qualityTier: 'gold'
  }
}
```

#### Q33: Thought Leadership
```typescript
{
  id: 'exec_thought_leadership',
  category: 'executive_external',
  text: 'Do you have public visibility as an industry expert?',
  type: 'checkbox',
  options: [
    'Published author (books)',
    'Conference speaker (keynotes, panels)',
    'Media appearances (TV, podcasts)',
    'Industry awards or recognition',
    'Published articles (HBR, Forbes, etc.)',
    'None'
  ],
  followUp: {
    condition: (answers) => !answers.includes('None'),
    questions: [
      {
        text: 'Please provide details',
        type: 'text',
        placeholder: 'e.g., "Author of [Book], keynote at [Conference], quoted in WSJ/Forbes 20+ times"'
      }
    ]
  },
  vaultMapping: {
    category: 'vault_thought_leadership',
    qualityTier: 'gold'
  }
}
```

#### Q34: Talent Development
```typescript
{
  id: 'exec_talent_development',
  category: 'executive_leadership',
  text: 'Have you mentored leaders who went on to executive roles?',
  type: 'multiple_choice',
  options: [
    { value: 'vp_plus', label: 'Yes, multiple people at VP+ level' },
    { value: 'board_founders', label: 'Yes, board members or founders' },
    { value: 'some', label: 'Yes, a few' },
    { value: 'no', label: 'No' },
    { value: 'unsure', label: 'Not sure' }
  ],
  followUp: {
    condition: (answer) => answer !== 'no' && answer !== 'unsure',
    questions: [
      {
        text: 'Where did they go?',
        type: 'text',
        placeholder: 'e.g., "3 promoted to VP at current company, 2 became CEOs, 1 joined Meta as Director"'
      }
    ]
  },
  vaultMapping: {
    category: 'vault_leadership_philosophy',
    qualityTier: 'gold'
  }
}
```

#### Q35: Strategic Transformations
```typescript
{
  id: 'exec_transformations',
  category: 'executive_strategic',
  text: 'Have you led company-wide transformations?',
  type: 'checkbox',
  options: [
    'Digital transformation',
    'Business model pivot',
    'Turnaround (distressed company)',
    'IPO preparation',
    'Restructuring/downsizing',
    'Cultural transformation',
    'None'
  ],
  followUp: {
    condition: (answers) => !answers.includes('None'),
    questions: [
      {
        text: 'Timeline and outcome?',
        type: 'text',
        placeholder: 'e.g., "Led digital transformation over 24 months, migrated 100% to cloud, reduced costs 30%"'
      },
      {
        text: 'Key metrics that improved?',
        type: 'text',
        placeholder: 'e.g., "Revenue +45%, Employee satisfaction +15 pts, Customer NPS +1.2"'
      }
    ]
  },
  vaultMapping: {
    category: 'vault_transformation_stories',
    qualityTier: 'gold'
  }
}
```

**Database Migration:**

```sql
-- File: supabase/migrations/20251022000000_add_executive_questions.sql

-- Add new question categories
ALTER TYPE competency_category ADD VALUE IF NOT EXISTS 'executive_governance';
ALTER TYPE competency_category ADD VALUE IF NOT EXISTS 'executive_financial';
ALTER TYPE competency_category ADD VALUE IF NOT EXISTS 'executive_strategic';
ALTER TYPE competency_category ADD VALUE IF NOT EXISTS 'executive_external';

-- Track executive question completions
CREATE TABLE IF NOT EXISTS executive_question_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  vault_id UUID REFERENCES career_vaults NOT NULL,
  question_id TEXT NOT NULL,
  response JSONB NOT NULL,
  follow_up_responses JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_exec_responses_user ON executive_question_responses(user_id);
CREATE INDEX idx_exec_responses_vault ON executive_question_responses(vault_id);

-- Add RLS policies
ALTER TABLE executive_question_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own executive responses"
  ON executive_question_responses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own executive responses"
  ON executive_question_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own executive responses"
  ON executive_question_responses FOR UPDATE
  USING (auth.uid() = user_id);
```

**Acceptance Criteria:**
- ✅ 10 new questions added to quiz
- ✅ Follow-up questions conditionally displayed
- ✅ Responses stored in appropriate vault categories
- ✅ All marked as Gold tier (user-verified)
- ✅ UI updated to show executive questions section

---

### Task 1.2: Flag AI Inferences for User Review

**Goal:** Reduce AI hallucination by requiring user confirmation of inferred skills

**Files to Create/Modify:**
1. `supabase/migrations/20251022010000_add_inference_review_flags.sql`
2. `supabase/functions/analyze-resume/index.ts` (update AI extraction)
3. `src/components/career-vault/InferredItemsReview.tsx` (new component)
4. `src/pages/CareerVault.tsx` (integrate review UI)

**Database Changes:**

```sql
-- File: supabase/migrations/20251022010000_add_inference_review_flags.sql

-- Add review flags to all vault tables
DO $$
DECLARE
  vault_table TEXT;
BEGIN
  FOR vault_table IN
    SELECT table_name
    FROM information_schema.tables
    WHERE table_name LIKE 'vault_%'
      AND table_schema = 'public'
  LOOP
    EXECUTE format('
      ALTER TABLE %I
      ADD COLUMN IF NOT EXISTS needs_user_review BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS inferred_from TEXT,
      ADD COLUMN IF NOT EXISTS ai_confidence DECIMAL(3,2) CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
      ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS review_action TEXT CHECK (review_action IN (''confirmed'', ''edited'', ''rejected''))
    ', vault_table);
  END LOOP;
END $$;

-- Create index for quick lookup of items needing review
CREATE INDEX IF NOT EXISTS idx_vault_power_phrases_needs_review
  ON vault_power_phrases(user_id, needs_user_review)
  WHERE needs_user_review = true;

CREATE INDEX IF NOT EXISTS idx_vault_soft_skills_needs_review
  ON vault_soft_skills(user_id, needs_user_review)
  WHERE needs_user_review = true;

CREATE INDEX IF NOT EXISTS idx_vault_transferable_skills_needs_review
  ON vault_transferable_skills(user_id, needs_user_review)
  WHERE needs_user_review = true;

CREATE INDEX IF NOT EXISTS idx_vault_hidden_competencies_needs_review
  ON vault_hidden_competencies(user_id, needs_user_review)
  WHERE needs_user_review = true;

-- Function to get all items needing review
CREATE OR REPLACE FUNCTION get_items_needing_review(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_power_phrases JSONB;
  v_soft_skills JSONB;
  v_transferable_skills JSONB;
  v_hidden_competencies JSONB;
BEGIN
  -- Power phrases needing review
  SELECT jsonb_agg(row_to_json(vpp.*))
  INTO v_power_phrases
  FROM vault_power_phrases vpp
  WHERE vpp.user_id = p_user_id
    AND vpp.needs_user_review = true;

  -- Soft skills needing review
  SELECT jsonb_agg(row_to_json(vss.*))
  INTO v_soft_skills
  FROM vault_soft_skills vss
  WHERE vss.user_id = p_user_id
    AND vss.needs_user_review = true;

  -- Transferable skills needing review
  SELECT jsonb_agg(row_to_json(vts.*))
  INTO v_transferable_skills
  FROM vault_transferable_skills vts
  WHERE vts.user_id = p_user_id
    AND vts.needs_user_review = true;

  -- Hidden competencies needing review
  SELECT jsonb_agg(row_to_json(vhc.*))
  INTO v_hidden_competencies
  FROM vault_hidden_competencies vhc
  WHERE vhc.user_id = p_user_id
    AND vhc.needs_user_review = true;

  v_result := jsonb_build_object(
    'powerPhrases', COALESCE(v_power_phrases, '[]'::jsonb),
    'softSkills', COALESCE(v_soft_skills, '[]'::jsonb),
    'transferableSkills', COALESCE(v_transferable_skills, '[]'::jsonb),
    'hiddenCompetencies', COALESCE(v_hidden_competencies, '[]'::jsonb),
    'totalCount', (
      COALESCE(jsonb_array_length(v_power_phrases), 0) +
      COALESCE(jsonb_array_length(v_soft_skills), 0) +
      COALESCE(jsonb_array_length(v_transferable_skills), 0) +
      COALESCE(jsonb_array_length(v_hidden_competencies), 0)
    )
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**AI Extraction Updates:**

```typescript
// File: supabase/functions/analyze-resume/index.ts

// BEFORE:
extractedData.softSkills?.forEach((soft: any) => {
  await supabase.from('vault_soft_skills').insert({
    user_id: userId,
    skill: soft.skill,
    quality_tier: 'bronze'
  });
});

// AFTER:
extractedData.softSkills?.forEach((soft: any) => {
  await supabase.from('vault_soft_skills').insert({
    user_id: userId,
    skill: soft.skill,
    quality_tier: 'assumed',  // Lower tier since it's inferred
    needs_user_review: true,   // Flag for review
    inferred_from: soft.evidence || 'Resume analysis',
    ai_confidence: soft.confidence || 0.6
  });
});

// Same pattern for transferable_skills, hidden_competencies, etc.
```

**Review UI Component:**

```typescript
// File: src/components/career-vault/InferredItemsReview.tsx

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Edit, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const InferredItemsReview = () => {
  const [itemsNeedingReview, setItemsNeedingReview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItemsNeedingReview();
  }, []);

  const loadItemsNeedingReview = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase.rpc('get_items_needing_review', {
      p_user_id: user.id
    });

    if (!error && data) {
      setItemsNeedingReview(data);
    }
    setLoading(false);
  };

  const handleReview = async (category: string, itemId: string, action: 'confirmed' | 'edited' | 'rejected', editedContent?: any) => {
    const tableName = `vault_${category}`;

    if (action === 'rejected') {
      // Delete item
      await supabase.from(tableName).delete().eq('id', itemId);
      toast.success('Item removed');
    } else if (action === 'confirmed') {
      // Upgrade to Silver tier
      await supabase.from(tableName).update({
        needs_user_review: false,
        reviewed_at: new Date().toISOString(),
        review_action: 'confirmed',
        quality_tier: 'silver'
      }).eq('id', itemId);
      toast.success('Item confirmed and upgraded to Silver');
    } else if (action === 'edited') {
      // Update content and upgrade to Gold tier
      await supabase.from(tableName).update({
        ...editedContent,
        needs_user_review: false,
        reviewed_at: new Date().toISOString(),
        review_action: 'edited',
        quality_tier: 'gold'
      }).eq('id', itemId);
      toast.success('Item updated and upgraded to Gold');
    }

    loadItemsNeedingReview();
  };

  if (loading) return <div>Loading...</div>;

  if (!itemsNeedingReview || itemsNeedingReview.totalCount === 0) {
    return null;
  }

  return (
    <Alert className="mb-6 bg-yellow-50 border-yellow-200">
      <AlertTriangle className="h-5 w-5 text-yellow-600" />
      <AlertDescription className="ml-2">
        <strong>{itemsNeedingReview.totalCount} items</strong> need your review.
        AI inferred these from your resume - please confirm or edit them.
      </AlertDescription>
      <Button
        variant="outline"
        size="sm"
        className="ml-auto"
        onClick={() => {/* Open review modal */}}
      >
        Review Now
      </Button>
    </Alert>
  );
};

// Full review modal component would include:
// - List of all inferred items by category
// - Evidence shown ("Inferred from: Led team through pivot")
// - Confidence score ("AI Confidence: 60%")
// - Action buttons: Confirm (→ Silver), Edit (→ Gold), Remove
```

**Acceptance Criteria:**
- ✅ All AI-inferred items flagged with `needs_user_review = true`
- ✅ Evidence and confidence stored
- ✅ UI shows count of items needing review
- ✅ User can confirm (upgrade to Silver), edit (upgrade to Gold), or reject
- ✅ Reviewed items no longer appear in pending list

---

### Task 1.3: Improve Executive Skill Extraction Prompts

**Goal:** Extract strategic competencies and executive achievements instead of generic skills

**Files to Modify:**
1. `supabase/functions/analyze-resume/index.ts`
2. `supabase/functions/generate-skill-verification-questions/index.ts`

**Current Prompt (Generic):**
```typescript
const prompt = `Extract ALL skills, technologies, tools, and methodologies from this resume.

Return JSON:
{
  "technicalSkills": ["JavaScript", "React", ...],
  "softSkills": ["Communication", "Leadership", ...],
  "transferableSkills": ["Project Management", ...]
}`;
```

**New Prompt (Executive-Aware):**
```typescript
const detectSeniorityLevel = (resume: string): string => {
  const executiveTitles = /\b(CEO|CTO|CFO|COO|CMO|President|VP|SVP|EVP|Chief|Director|Head of)\b/i;
  const seniorIndicators = /\b(board|P&L|M&A|\$\d+[MB]|raised|IPO|acquired|scaled)\b/i;

  if (executiveTitles.test(resume) || seniorIndicators.test(resume)) {
    return 'executive';
  }
  return 'professional';
};

const buildExtractionPrompt = (resume: string, seniorityLevel: string) => {
  if (seniorityLevel === 'executive') {
    return `You are analyzing an EXECUTIVE resume. Focus on STRATEGIC competencies and BUSINESS IMPACT.

RESUME:
${resume}

EXTRACT THE FOLLOWING (return valid JSON):

{
  "executiveCompetencies": {
    "scaleMetrics": [
      // Revenue growth, team growth, market expansion
      // Example: "Grew revenue from $50M to $200M ARR (4x in 3 years)"
      {
        "metric": "revenue_growth",
        "baseline": "$50M ARR",
        "endState": "$200M ARR",
        "percentageChange": "300%",
        "timeline": "3 years",
        "evidence": "Quote from resume showing this"
      }
    ],

    "capitalAndFinancial": [
      // Funds raised, P&L size, margin improvement
      {
        "type": "capital_raised" | "pl_size" | "margin_improvement",
        "amount": "$150M",
        "details": "Series B-D from Sequoia, a16z",
        "evidence": "Quote from resume"
      }
    ],

    "transformations": [
      // Turnarounds, pivots, restructuring, IPO
      {
        "type": "turnaround" | "pivot" | "ipo" | "restructuring",
        "situation": "Company state when started",
        "action": "What they did",
        "result": "Quantified outcome",
        "timeline": "Duration",
        "evidence": "Quote from resume"
      }
    ],

    "mAndA": [
      // M&A deals, integrations
      {
        "type": "acquisition" | "integration" | "exit",
        "count": 3,
        "totalValue": "$80M",
        "outcome": "85% talent retention, synergies achieved in 12 months",
        "evidence": "Quote from resume"
      }
    ],

    "boardAndGovernance": [
      // Board seats, committee roles
      {
        "companyType": "public" | "private" | "nonprofit",
        "role": "Director" | "Observer" | "Advisor",
        "committees": ["Audit", "Compensation"],
        "evidence": "Quote from resume"
      }
    ],

    "thoughtLeadership": [
      // Speaking, writing, awards
      {
        "type": "book" | "keynote" | "award" | "media",
        "title": "Published in HBR",
        "reach": "50+ media mentions",
        "evidence": "Quote from resume"
      }
    ]
  },

  "technicalSkills": [
    // Still extract, but lower priority for execs
  ],

  "softSkills": [
    // ONLY if there's QUANTIFIED EVIDENCE
    // Example: "Executive Communication - Delivered 40+ earnings calls with 4.2/5 analyst rating"
    {
      "skill": "Executive Communication",
      "evidence": "Delivered 40+ earnings calls maintaining 4.2/5 analyst rating",
      "confidence": 0.9
    }
  ]
}

CRITICAL RULES:
1. For executives, prioritize BUSINESS OUTCOMES over skills
2. Always include NUMBERS (%, $, #, timeline)
3. Capture SCALE (team size, revenue size, market size)
4. Identify TRANSFORMATION narratives (before → action → after)
5. Look for board, P&L, M&A, capital raising keywords
6. Soft skills MUST have quantified evidence or be rejected
7. Include confidence score (0-1) for each extraction
`;
  }

  // Professional-level extraction (existing logic)
  return `Extract skills and achievements...`;
};

// Usage:
const seniorityLevel = detectSeniorityLevel(resumeText);
const prompt = buildExtractionPrompt(resumeText, seniorityLevel);
```

**Store Executive Extractions:**

```typescript
// After AI extraction for executives:
const aiResponse = await fetch(aiEndpoint, { body: prompt });
const extracted = await aiResponse.json();

if (seniorityLevel === 'executive') {
  // Store in executive-specific vault tables (Priority 2)
  // For now, store in power_phrases with executive context

  extracted.executiveCompetencies.scaleMetrics?.forEach(async (metric) => {
    await supabase.from('vault_power_phrases').insert({
      user_id: userId,
      phrase: `${metric.metric}: ${metric.baseline} → ${metric.endState} (${metric.percentageChange} growth in ${metric.timeline})`,
      context: 'executive_scale_metric',
      quality_tier: 'silver',
      quantified: true,
      metrics: {
        type: metric.metric,
        baseline: metric.baseline,
        endState: metric.endState,
        change: metric.percentageChange
      }
    });
  });

  // Similar for transformations, M&A, etc.
}
```

**Acceptance Criteria:**
- ✅ Resume analysis detects executive vs. professional level
- ✅ Executive resumes use strategic extraction prompt
- ✅ Captures scale metrics (revenue, team, market)
- ✅ Captures capital/financial outcomes
- ✅ Captures transformation narratives
- ✅ Soft skills require quantified evidence
- ✅ All extractions include confidence scores

---

### Priority 1 Summary

**Total Effort:** 5-7 days
- Task 1.1: 2-3 days (10 questions + migration + UI)
- Task 1.2: 2 days (migration + review UI)
- Task 1.3: 1-2 days (prompt engineering + testing)

**Impact:** Captures 80% of missing executive value

**Deliverables:**
- ✅ 10 executive questions in quiz
- ✅ AI inference review system
- ✅ Executive-aware skill extraction
- ✅ All marked as completed in migrations

---

## Priority 2: Executive Vault Categories (1 Month)

### Overview
Create dedicated vault tables for executive-specific intelligence and build cross-application sync.

**Estimated Time:** 3-4 weeks
**Impact:** Captures 95% of executive value, enables storytelling
**Risk:** Medium (new patterns, cross-app integration)

---

### Task 2.1: Create Executive Vault Tables

**Goal:** Add 4 new vault categories for executive intelligence

**Files to Create:**
1. `supabase/migrations/20251023000000_create_executive_vault_tables.sql`
2. `src/components/career-vault/TransformationStoriesManager.tsx`
3. `src/components/career-vault/BoardGovernanceManager.tsx`
4. `src/components/career-vault/ThoughtLeadershipManager.tsx`
5. `src/components/career-vault/FinancialOutcomesManager.tsx`

**Database Schema:**

```sql
-- File: supabase/migrations/20251023000000_create_executive_vault_tables.sql

-- 1. TRANSFORMATION STORIES
-- Captures: turnarounds, pivots, scaling, restructuring
CREATE TABLE vault_transformation_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  vault_id UUID REFERENCES career_vaults NOT NULL,

  -- Narrative components (STAR framework)
  situation TEXT NOT NULL,  -- "Company had 3.1/5 NPS, 25% churn, $10M ARR"
  challenge TEXT NOT NULL,  -- "Needed to pivot from SMB to Enterprise"
  action TEXT NOT NULL,     -- "Built product org 5→45, launched 3 new lines"
  result TEXT NOT NULL,     -- "Grew to $75M ARR, NPS 4.6/5, churn 8%"
  timeline TEXT,            -- "24 months"

  -- Metadata
  transformation_type TEXT CHECK (transformation_type IN (
    'turnaround', 'pivot', 'scaling', 'restructuring',
    'digital_transformation', 'ipo_prep', 'market_entry'
  )),
  role_held TEXT,           -- "CPO", "CTO"
  company_name TEXT,

  -- Metrics
  quantified_impact JSONB,  -- {"revenue": {"from": "10M", "to": "75M"}, "nps": {"from": 3.1, "to": 4.6}}

  -- Quality tracking
  quality_tier TEXT DEFAULT 'silver',
  freshness_score INTEGER DEFAULT 80,
  times_used INTEGER DEFAULT 0,
  times_kept INTEGER DEFAULT 0,
  times_edited INTEGER DEFAULT 0,
  times_removed INTEGER DEFAULT 0,
  effectiveness_score DECIMAL(3,2) DEFAULT 0.5,
  last_used_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_vault_transformations_user ON vault_transformation_stories(user_id);
CREATE INDEX idx_vault_transformations_vault ON vault_transformation_stories(vault_id);
CREATE INDEX idx_vault_transformations_type ON vault_transformation_stories(transformation_type);

-- RLS Policies
ALTER TABLE vault_transformation_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transformation stories"
  ON vault_transformation_stories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transformation stories"
  ON vault_transformation_stories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transformation stories"
  ON vault_transformation_stories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transformation stories"
  ON vault_transformation_stories FOR DELETE
  USING (auth.uid() = user_id);

-- 2. BOARD & GOVERNANCE
CREATE TABLE vault_board_governance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  vault_id UUID REFERENCES career_vaults NOT NULL,

  -- Board details
  company_name TEXT NOT NULL,
  company_type TEXT CHECK (company_type IN ('public', 'private', 'nonprofit', 'advisory')) NOT NULL,
  role TEXT CHECK (role IN ('director', 'observer', 'advisor', 'chair')) NOT NULL,
  committees TEXT[],  -- ['Audit', 'Compensation', 'Governance', 'Nominating', 'Risk', 'Technology']

  -- Tenure
  tenure_start DATE NOT NULL,
  tenure_end DATE,  -- NULL if current
  is_current BOOLEAN GENERATED ALWAYS AS (tenure_end IS NULL) STORED,

  -- Achievements
  achievements TEXT[],  -- ["Led audit committee through SOX compliance", "Recruited new CEO"]
  quantified_impact TEXT,  -- "Improved board diversity from 20% to 40% women"

  -- Quality tracking
  quality_tier TEXT DEFAULT 'gold',  -- Board experience is user-provided, so Gold
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

CREATE INDEX idx_vault_board_user ON vault_board_governance(user_id);
CREATE INDEX idx_vault_board_vault ON vault_board_governance(vault_id);
CREATE INDEX idx_vault_board_current ON vault_board_governance(is_current) WHERE is_current = true;

-- RLS Policies (same pattern as above)
ALTER TABLE vault_board_governance ENABLE ROW LEVEL SECURITY;
-- [RLS policies omitted for brevity - same pattern]

-- 3. THOUGHT LEADERSHIP
CREATE TABLE vault_thought_leadership (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  vault_id UUID REFERENCES career_vaults NOT NULL,

  -- Content details
  type TEXT CHECK (type IN ('book', 'article', 'keynote', 'panel', 'podcast', 'media', 'award')) NOT NULL,
  title TEXT NOT NULL,
  publication TEXT,  -- "Harvard Business Review", "TechCrunch Disrupt", "WSJ"
  date DATE,
  url TEXT,

  -- Impact metrics
  impact_metrics JSONB,  -- {"downloads": 5000, "attendees": 2000, "citations": 50, "shares": 1200}
  description TEXT,      -- "Keynote on AI transformation to 2000+ executives"

  -- Quality tracking
  quality_tier TEXT DEFAULT 'silver',
  freshness_score INTEGER DEFAULT 80,
  times_used INTEGER DEFAULT 0,
  times_kept INTEGER DEFAULT 0,
  times_edited INTEGER DEFAULT 0,
  times_removed INTEGER DEFAULT 0,
  effectiveness_score DECIMAL(3,2) DEFAULT 0.5,
  last_used_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_vault_thought_leadership_user ON vault_thought_leadership(user_id);
CREATE INDEX idx_vault_thought_leadership_vault ON vault_thought_leadership(vault_id);
CREATE INDEX idx_vault_thought_leadership_type ON vault_thought_leadership(type);

ALTER TABLE vault_thought_leadership ENABLE ROW LEVEL SECURITY;
-- [RLS policies omitted for brevity]

-- 4. FINANCIAL OUTCOMES
CREATE TABLE vault_financial_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  vault_id UUID REFERENCES career_vaults NOT NULL,

  -- Metric details
  metric_type TEXT CHECK (metric_type IN (
    'revenue_growth', 'margin_improvement', 'cost_reduction',
    'pl_size', 'capital_raised', 'valuation', 'efficiency'
  )) NOT NULL,

  -- Values
  baseline_value DECIMAL,
  end_value DECIMAL,
  percentage_change DECIMAL,
  absolute_change DECIMAL,
  currency TEXT DEFAULT 'USD',

  -- Context
  time_period TEXT,  -- "18 months", "3 years"
  role_held TEXT,    -- "CFO", "VP Finance"
  company_name TEXT,
  context TEXT,      -- "During market downturn", "Post-acquisition integration"

  -- Quality tracking
  quality_tier TEXT DEFAULT 'silver',
  freshness_score INTEGER DEFAULT 80,
  times_used INTEGER DEFAULT 0,
  times_kept INTEGER DEFAULT 0,
  times_edited INTEGER DEFAULT 0,
  times_removed INTEGER DEFAULT 0,
  effectiveness_score DECIMAL(3,2) DEFAULT 0.5,
  last_used_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_vault_financial_user ON vault_financial_outcomes(user_id);
CREATE INDEX idx_vault_financial_vault ON vault_financial_outcomes(vault_id);
CREATE INDEX idx_vault_financial_type ON vault_financial_outcomes(metric_type);

ALTER TABLE vault_financial_outcomes ENABLE ROW LEVEL SECURITY;
-- [RLS policies omitted for brevity]

-- Add effectiveness tracking for new tables
CREATE OR REPLACE FUNCTION update_vault_effectiveness_scores()
RETURNS void AS $$
BEGIN
  -- Transformation stories
  UPDATE vault_transformation_stories
  SET effectiveness_score = CASE
    WHEN times_used = 0 THEN 0.5
    ELSE ROUND(
      (times_kept::DECIMAL + (times_edited::DECIMAL * 0.5)) /
      (times_kept + times_edited + times_removed),
      2
    )
  END
  WHERE times_used > 0;

  -- Board governance
  UPDATE vault_board_governance
  SET effectiveness_score = CASE
    WHEN times_used = 0 THEN 0.5
    ELSE ROUND(
      (times_kept::DECIMAL + (times_edited::DECIMAL * 0.5)) /
      (times_kept + times_edited + times_removed),
      2
    )
  END
  WHERE times_used > 0;

  -- Thought leadership
  UPDATE vault_thought_leadership
  SET effectiveness_score = CASE
    WHEN times_used = 0 THEN 0.5
    ELSE ROUND(
      (times_kept::DECIMAL + (times_edited::DECIMAL * 0.5)) /
      (times_kept + times_edited + times_removed),
      2
    )
  END
  WHERE times_used > 0;

  -- Financial outcomes
  UPDATE vault_financial_outcomes
  SET effectiveness_score = CASE
    WHEN times_used = 0 THEN 0.5
    ELSE ROUND(
      (times_kept::DECIMAL + (times_edited::DECIMAL * 0.5)) /
      (times_kept + times_edited + times_removed),
      2
    )
  END
  WHERE times_used > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**UI Components:** (Outline only, full implementation similar to existing vault managers)

```typescript
// src/components/career-vault/TransformationStoriesManager.tsx
// Manage transformation narratives with STAR framework
// - Situation input
// - Challenge input
// - Action input
// - Result input
// - Timeline
// - Quantified metrics (revenue growth, NPS improvement, etc.)
```

**Acceptance Criteria:**
- ✅ 4 new executive vault tables created
- ✅ RLS policies configured
- ✅ Effectiveness tracking enabled
- ✅ UI components for managing each category
- ✅ Integration with existing vault dashboard

**Estimated Time:** 1 week

---

### Task 2.2: Build Narrative Assembly Engine

**Goal:** Combine vault items into compelling STAR narratives

**Files to Create:**
1. `supabase/functions/generate-executive-narrative/index.ts`
2. `src/lib/narrativeEngine.ts`

**Implementation:**

```typescript
// File: supabase/functions/generate-executive-narrative/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

interface NarrativeRequest {
  vaultId: string;
  targetRole: string;  // "CTO", "VP Engineering"
  format: 'resume' | 'linkedin' | 'interview' | 'cover_letter';
  maxLength?: number;
}

serve(async (req) => {
  const { vaultId, targetRole, format, maxLength = 500 } = await req.json();

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Fetch all executive vault data
  const { data: transformations } = await supabase
    .from('vault_transformation_stories')
    .select('*')
    .eq('vault_id', vaultId)
    .order('effectiveness_score', { ascending: false });

  const { data: financial } = await supabase
    .from('vault_financial_outcomes')
    .select('*')
    .eq('vault_id', vaultId)
    .order('effectiveness_score', { ascending: false });

  const { data: board } = await supabase
    .from('vault_board_governance')
    .select('*')
    .eq('vault_id', vaultId)
    .is_current(true);

  const { data: thoughtLeadership } = await supabase
    .from('vault_thought_leadership')
    .select('*')
    .eq('vault_id', vaultId)
    .order('date', { ascending: false });

  // Assemble narrative
  const narrative = buildExecutiveNarrative({
    transformations,
    financial,
    board,
    thoughtLeadership,
    targetRole,
    format,
    maxLength
  });

  return new Response(JSON.stringify({ narrative }), {
    headers: { 'Content-Type': 'application/json' }
  });
});

function buildExecutiveNarrative(data) {
  const { transformations, financial, board, thoughtLeadership, format } = data;

  if (format === 'resume') {
    return buildResumeNarrative(data);
  } else if (format === 'linkedin') {
    return buildLinkedInNarrative(data);
  } else if (format === 'interview') {
    return buildInterviewNarrative(data);
  }
}

function buildResumeNarrative({ transformations, financial }) {
  // Pick top transformation
  const topTransformation = transformations[0];

  // Combine with financial outcomes
  const financialContext = financial
    .filter(f => f.role_held === topTransformation.role_held)
    .map(f => `${f.metric_type}: ${f.baseline_value} → ${f.end_value} (${f.percentage_change}%)`)
    .join(', ');

  // STAR format
  return `${topTransformation.situation} ${topTransformation.action}. ${topTransformation.result}. ${financialContext}`;
}

function buildLinkedInNarrative({ transformations, board, thoughtLeadership }) {
  const narrativeParts = [];

  // Opening hook
  narrativeParts.push(`I've spent my career leading transformations that drive measurable business outcomes.`);

  // Highlight top transformation
  if (transformations.length > 0) {
    const t = transformations[0];
    narrativeParts.push(`Most recently, ${t.action.toLowerCase()}, resulting in ${t.result.toLowerCase()}.`);
  }

  // Board/governance
  if (board.length > 0) {
    const boardCount = board.length;
    const publicBoards = board.filter(b => b.company_type === 'public').length;
    narrativeParts.push(`I currently serve on ${boardCount} board${boardCount > 1 ? 's' : ''}${publicBoards > 0 ? ` (${publicBoards} public)` : ''}.`);
  }

  // Thought leadership
  if (thoughtLeadership.length > 0) {
    const keynotes = thoughtLeadership.filter(tl => tl.type === 'keynote');
    const articles = thoughtLeadership.filter(tl => tl.type === 'article');
    if (keynotes.length > 0 || articles.length > 0) {
      narrativeParts.push(`I regularly share insights through ${keynotes.length} keynote${keynotes.length !== 1 ? 's' : ''} and ${articles.length} published article${articles.length !== 1 ? 's' : ''}.`);
    }
  }

  return narrativeParts.join(' ');
}

function buildInterviewNarrative({ transformations }) {
  // For "Tell me about a time..." questions
  const starStories = transformations.map(t => ({
    question: `Tell me about a time you led a transformation`,
    situation: t.situation,
    task: t.challenge,
    action: t.action,
    result: t.result,
    timeline: t.timeline
  }));

  return starStories;
}
```

**Acceptance Criteria:**
- ✅ Edge function generates narratives from vault data
- ✅ Supports resume, LinkedIn, interview formats
- ✅ Assembles STAR stories from transformation data
- ✅ Combines financial outcomes with narratives
- ✅ Highlights board and thought leadership

**Estimated Time:** 1 week

---

### Task 2.3: Cross-Application Intelligence Sharing

**Goal:** Sync vault updates across resume, LinkedIn, interview prep, blogging

**Files to Create/Modify:**
1. `supabase/functions/sync-vault-to-applications/index.ts`
2. `src/lib/vaultSyncEngine.ts`
3. Database trigger to auto-sync on vault updates

**Implementation:**

```sql
-- File: Add to migration for auto-sync triggers

CREATE OR REPLACE FUNCTION sync_vault_item_to_applications()
RETURNS TRIGGER AS $$
BEGIN
  -- Call edge function to sync to all applications
  PERFORM http_post(
    'https://[project-ref].supabase.co/functions/v1/sync-vault-to-applications',
    jsonb_build_object(
      'vaultCategory', TG_TABLE_NAME,
      'vaultItemId', NEW.id,
      'vaultItem', row_to_json(NEW),
      'action', TG_OP
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add triggers to all vault tables
CREATE TRIGGER sync_transformation_stories
  AFTER INSERT OR UPDATE ON vault_transformation_stories
  FOR EACH ROW
  EXECUTE FUNCTION sync_vault_item_to_applications();

-- Repeat for other vault tables
```

```typescript
// File: supabase/functions/sync-vault-to-applications/index.ts

serve(async (req) => {
  const { vaultCategory, vaultItemId, vaultItem, action } = await req.json();

  // 1. Update resumes that use this vault item
  await updateResumesWithVaultItem(vaultItem);

  // 2. Update LinkedIn profile sections
  await updateLinkedInProfile(vaultItem);

  // 3. Generate interview prep answers
  await generateInterviewAnswers(vaultItem);

  // 4. Create LinkedIn post ideas
  await generatePostIdeas(vaultItem);

  // 5. Update cover letter templates
  await updateCoverLetterTemplates(vaultItem);

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
});

async function updateResumesWithVaultItem(vaultItem) {
  // Find all resumes that reference this vault item
  const { data: resumes } = await supabase
    .from('resumes')
    .select('*')
    .contains('vault_items_used', [vaultItem.id]);

  // Regenerate affected sections
  for (const resume of resumes) {
    await supabase.functions.invoke('generate-dual-resume-section', {
      body: {
        resumeId: resume.id,
        section: 'experience',
        refreshVaultData: true
      }
    });
  }
}

async function updateLinkedInProfile(vaultItem) {
  // If transformation story → Update "About" section
  // If board governance → Update "Volunteer Experience" or "Boards"
  // If thought leadership → Update "Publications" or "Featured"
}

async function generateInterviewAnswers(vaultItem) {
  // Generate STAR answers for common interview questions
  // Store in interview_prep table
}

async function generatePostIdeas(vaultItem) {
  // Use AI to create LinkedIn post ideas from transformation stories
  // Example: "3 lessons from scaling revenue 4x in a down market"
}
```

**Acceptance Criteria:**
- ✅ Vault updates automatically sync to applications
- ✅ Resumes regenerate when vault items change
- ✅ LinkedIn profile sections update
- ✅ Interview prep answers auto-generated
- ✅ Blog/post ideas suggested

**Estimated Time:** 1.5 weeks

---

### Priority 2 Summary

**Total Effort:** 3-4 weeks
- Task 2.1: 1 week (4 vault tables + UI)
- Task 2.2: 1 week (narrative engine)
- Task 2.3: 1.5 weeks (cross-app sync)

**Impact:** Captures 95% of executive value, 5x value per vault item

**Deliverables:**
- ✅ 4 executive vault categories
- ✅ Narrative assembly engine
- ✅ Cross-application sync
- ✅ STAR story generation

---

## Priority 3: Advanced Features (3 Months)

### Overview
Build comprehensive executive assessment framework, competitive intelligence, and ML-powered success prediction.

**Estimated Time:** 10-12 weeks
**Impact:** Best-in-class executive intelligence platform
**Risk:** High (ML models, external data, complex algorithms)

---

### Task 3.1: Executive Competency Framework

**Goal:** Map vault data to industry-standard executive frameworks

**Research Frameworks:**
- Spencer Stuart Leadership Assessment
- Korn Ferry Executive Competencies
- Harvard Business Review Leadership Framework

**8 Core Executive Dimensions:**
1. Strategic Vision
2. Operational Excellence
3. Financial Acumen
4. People & Culture
5. Innovation & Growth
6. Stakeholder Management
7. Governance & Risk
8. External Presence

**Implementation:** (High-level outline)

```sql
CREATE TABLE executive_competency_scores (
  user_id UUID,
  dimension TEXT,  -- 'strategic_vision', 'financial_acumen', etc.
  score INTEGER CHECK (score >= 0 AND score <= 100),
  evidence_count INTEGER,
  top_evidence JSONB,  -- Top 3 vault items supporting this score
  peer_percentile DECIMAL,
  updated_at TIMESTAMP
);

-- Calculate scores based on vault completeness
CREATE FUNCTION calculate_executive_competency_scores(p_user_id UUID)
RETURNS JSONB AS $$
  -- Logic to score each dimension based on vault data
$$;
```

**Estimated Time:** 3 weeks

---

### Task 3.2: Competitive Intelligence

**Goal:** Analyze target company job postings and successful profiles

**Implementation:** (High-level outline)

```typescript
// Scrape job postings for target roles
// Analyze LinkedIn profiles of recent hires
// Identify must-haves vs. differentiators
// Return competitive landscape report
```

**Estimated Time:** 4 weeks

---

### Task 3.3: Success Prediction Model

**Goal:** ML model predicting interview likelihood based on vault quality

**Implementation:** (High-level outline)

```sql
CREATE TABLE application_outcomes (
  resume_id UUID,
  job_id UUID,
  vault_items_used UUID[],
  vault_quality_scores JSONB,
  outcome TEXT,  -- 'interview', 'offer', 'rejected'
  outcome_date DATE
);

-- Train ML model:
-- Features: quality_tiers, effectiveness_scores, match_scores
-- Target: Likelihood of interview/offer
```

**Estimated Time:** 5 weeks

---

### Priority 3 Summary

**Total Effort:** 10-12 weeks
**Impact:** Best-in-class platform, predictive analytics

**Deliverables:**
- ✅ Executive competency framework
- ✅ Competitive intelligence
- ✅ Success prediction model

---

## Implementation Timeline

### Week 1: Priority 1 (Critical Gaps)
- Days 1-3: Task 1.1 - Add 10 executive questions
- Days 4-5: Task 1.2 - AI inference review flags
- Days 6-7: Task 1.3 - Executive skill extraction

### Weeks 2-5: Priority 2 (Executive Vault)
- Week 2: Task 2.1 - Create 4 executive vault tables + UI
- Week 3: Task 2.2 - Build narrative assembly engine
- Weeks 4-5: Task 2.3 - Cross-application sync

### Weeks 6-17: Priority 3 (Advanced Features)
- Weeks 6-8: Task 3.1 - Executive competency framework
- Weeks 9-12: Task 3.2 - Competitive intelligence
- Weeks 13-17: Task 3.3 - Success prediction model

---

## Success Metrics

**Priority 1 Completion:**
- 80% of executives report "captured my experience accurately"
- AI hallucination rate < 10% (down from 30%)
- Executive question completion rate > 70%

**Priority 2 Completion:**
- 95% of executives report "tells my story effectively"
- 5x increase in vault item reuse across applications
- LinkedIn profile sync reduces manual entry by 80%

**Priority 3 Completion:**
- Competency scores correlate with job offer rate
- Competitive intel improves application success 15%+
- ML model predicts interview likelihood within 10% accuracy

---

## Risk Mitigation

**Technical Risks:**
- Vault data migration (mitigate: backup before changes)
- Cross-app sync performance (mitigate: queue-based processing)
- ML model accuracy (mitigate: start with rule-based, iterate)

**User Experience Risks:**
- Overwhelming UI with too many inputs (mitigate: progressive disclosure)
- Sync conflicts between apps (mitigate: vault is source of truth)

**Business Risks:**
- Executive users expect perfection (mitigate: set expectations early)
- Long timeline (mitigate: ship Priority 1 in 1 week, get feedback)

---

## Conclusion

This roadmap transforms the Career Vault from a **B+ system for mid-level professionals** into an **A+ platform for executives** by:

1. **Week 1:** Capturing C-suite competencies (80% of gap closed)
2. **Month 1:** Enabling storytelling and cross-app sync (95% of gap closed)
3. **Quarter 1:** Building advanced features for competitive edge (best-in-class)

**Recommendation:** Start with Priority 1 immediately. Ship in 1 week, gather user feedback, then proceed to Priority 2.
