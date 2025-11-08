# Career Vault v3.0 - The 3-Layer Hybrid Structure

**Implementation Date:** November 8, 2025  
**Status:** ✅ Phase 1 Complete, Phase 2 In Progress  
**Architecture:** 3-Layer Hybrid (Resume Foundations → Executive Intelligence → Market Positioning)

---

## 🎯 Core Philosophy

**Goal:** Get enough detail to properly position who you are in the market.

**Method:** Progressive disclosure from familiar (resume sections) to sophisticated (executive intelligence), with **industry benchmarking** at every layer.

**User Message:** "We're building a complete picture of your professional value so we can position you accurately against industry standards."

---

## 📊 3-Layer Structure

### **LAYER 1: RESUME FOUNDATIONS** 
*What users recognize and expect from a resume*

#### 1. Work Experience
- **Data Source:** `vault_power_phrases` table
- **What it shows:** Career history with quantified achievements
- **Benchmark:** 60%+ of bullets should have metrics
- **Completion:** Based on power phrases with `impact_metrics`

#### 2. Skills & Expertise
- **Data Source:** `vault_transferable_skills` table
- **What it shows:** Technical skills, software, methodologies
- **Benchmark:** 15+ relevant skills for target role
- **Completion:** Based on skills count

#### 3. Education & Credentials
- **Data Source:** `career_vault.education_details` JSON field
- **What it shows:** Degrees, certifications, training programs
- **Benchmark:** 65% of senior roles require bachelor's degree
- **Completion:** Binary (exists or doesn't)

#### 4. Professional Highlights
- **Data Source:** `vault_power_phrases` with `quality_tier='gold'`
- **What it shows:** Awards, recognition, publications, speaking
- **Benchmark:** 2+ recognition events per 3 years
- **Completion:** Based on gold-tier achievements

---

### **LAYER 2: EXECUTIVE INTELLIGENCE**
*AI magic that powers resume generation but doesn't appear directly on it*

#### 5. Leadership Approach
- **Data Source:** `vault_leadership_philosophy` table
- **What it shows:** Management style, decision-making, coaching philosophy
- **Benchmark:** Modern leadership (inclusive, data-driven, growth-focused)
- **Impact:** +20 points to vault score
- **Completion:** Based on leadership entries

#### 6. Strategic Impact
- **Data Source:** `vault_power_phrases` with `impact_metrics`
- **What it shows:** Business outcomes, financial impact, ROI
- **Benchmark:** 80%+ of accomplishments should have numbers
- **Impact:** +25 points to vault score
- **Completion:** Based on quantified achievements

#### 7. Professional Development & Resources ⭐ **NEW**
- **Data Source:** `vault_professional_resources` table (created in Phase 1)
- **What it shows:** 
  - Enterprise systems experience (Salesforce, SAP, etc.)
  - Training investments (courses, conferences, certifications)
  - Industry exposure (trade shows, professional memberships)
  - Consultant/external resources access
- **Benchmark:** Enterprise-grade tools + $5K-$15K annual training investment
- **Impact:** +15 points to vault score
- **Completion:** Based on resources documented

#### 8. Professional Network
- **Data Source:** TBD (future implementation)
- **What it shows:** Industry relationships, cross-functional collaboration
- **Benchmark:** Senior roles should have VP/C-suite relationships
- **Impact:** +10 points to vault score
- **Status:** 🚧 Coming Soon

---

### **LAYER 3: MARKET POSITIONING**
*Competitive intelligence (future phase)*

#### 9. Competitive Advantages
- **What it shows:** Unique differentiators vs. other candidates
- **Status:** 🚧 Phase 3

#### 10. Gap Analysis
- **What it shows:** What's missing vs. industry benchmarks
- **Status:** 🚧 Phase 3

---

## 🗄️ Database Schema

### New Table: `vault_professional_resources`

```sql
CREATE TABLE vault_professional_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID NOT NULL REFERENCES career_vault(id) ON DELETE CASCADE,
  
  -- Enterprise Systems
  enterprise_systems JSONB DEFAULT '[]'::jsonb,
  proficiency_levels JSONB DEFAULT '{}'::jsonb,
  
  -- Training Investments
  training_programs JSONB DEFAULT '[]'::jsonb,
  certifications_funded JSONB DEFAULT '[]'::jsonb,
  
  -- Industry Exposure
  conferences_attended JSONB DEFAULT '[]'::jsonb,
  trade_shows JSONB DEFAULT '[]'::jsonb,
  professional_memberships JSONB DEFAULT '[]'::jsonb,
  
  -- Consultant/External Resources
  consultant_experience JSONB DEFAULT '[]'::jsonb,
  external_coaches JSONB DEFAULT '[]'::jsonb,
  
  -- Quality Metadata
  quality_tier VARCHAR(20) DEFAULT 'assumed',
  ai_confidence DECIMAL(3,2) DEFAULT 0.5,
  user_verified BOOLEAN DEFAULT FALSE,
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Status:** ✅ Created  
**RLS Policies:** ✅ Enabled  
**Edge Function Updated:** ✅ `get-vault-data` now fetches this table

---

## 🎨 UI Components

### Phase 2 Components (✅ Created)

1. **`PlainEnglishHero.tsx`**
   - Linear progress bar (not radial)
   - Plain English score interpretation ("Excellent", "Needs Work", etc.)
   - Contextual messaging based on score
   - Single clear CTA

2. **`Layer1FoundationsCard.tsx`**
   - Shows 4 resume foundation sections
   - Progress bars with completion %
   - Industry benchmarks per section
   - Priority action card for next step

3. **`Layer2IntelligenceCard.tsx`**
   - Shows 4 executive intelligence sections
   - Impact points display (+20, +25, +15, +10)
   - Highest impact action highlighted
   - Gradient background for visual distinction

### Dashboard Integration (✅ Updated)

- **File:** `src/pages/CareerVaultDashboardV2.tsx`
- **Changes:**
  - Replaced `UnifiedHeroCard` with `PlainEnglishHero`
  - Added 2-column grid for Layer1 and Layer2 cards
  - Added section click handler for routing to questionnaires
  - Old hero hidden (not deleted yet for rollback safety)

---

## 📈 Completion Calculation

### Layer 1 Completion
```typescript
const layer1Completion = (
  workExpPercentage + 
  skillsPercentage + 
  educationPercentage + 
  highlightsPercentage
) / 4;
```

### Layer 2 Completion
```typescript
const layer2Completion = (
  leadershipPercentage + 
  strategicPercentage + 
  resourcesPercentage + 
  networkPercentage
) / 4;
```

### Overall Vault Score
```typescript
const vaultScore = (layer1Completion * 0.4) + (layer2Completion * 0.6);
```
*Layer 2 weighted higher because executive intelligence is more valuable*

---

## 🎯 Benchmarks by Role Level

### Entry-Level (0-2 years)
- Layer 1: 60% completion minimum
- Layer 2: 20% completion acceptable
- Focus: Skills & Education

### Mid-Level (3-7 years)
- Layer 1: 80% completion target
- Layer 2: 50% completion target
- Focus: Work Experience + Strategic Impact

### Senior (8-15 years)
- Layer 1: 90% completion target
- Layer 2: 70% completion target
- Focus: Leadership + Professional Resources

### Executive (15+ years)
- Layer 1: 95% completion target
- Layer 2: 85% completion target
- Focus: All sections, especially Executive Presence

---

## 🚀 Implementation Status

### ✅ Phase 1: Database + Backend (COMPLETE)
- [x] Created `vault_professional_resources` table
- [x] Added RLS policies
- [x] Updated `get-vault-data` edge function
- [x] Tested database connection

### ✅ Phase 2: Dashboard UI (IN PROGRESS)
- [x] Created `PlainEnglishHero` component
- [x] Created `Layer1FoundationsCard` component
- [x] Created `Layer2IntelligenceCard` component
- [x] Updated `CareerVaultDashboardV2.tsx`
- [ ] Create section-specific questionnaires
- [ ] Update gap-filling logic
- [ ] Add "Why This Matters" explanations

### 🚧 Phase 3: Questionnaires (NEXT)
- [ ] Professional Resources Questionnaire
- [ ] Leadership Approach Questionnaire
- [ ] Strategic Impact Questionnaire
- [ ] Enhanced gap-filling with Layer prioritization

### 🚧 Phase 4: Benchmarking System
- [ ] Industry benchmark data by role
- [ ] Comparison logic in edge function
- [ ] Display benchmark status per section
- [ ] Personalized recommendations

### 🚧 Phase 5: Testing + Cleanup
- [ ] End-to-end testing
- [ ] Delete old components:
  - `UnifiedHeroCard.tsx`
  - `AIPrimaryAction.tsx`
  - Old vault tabs structure
- [ ] Update documentation

---

## 🗑️ Components Marked for Deletion (After Phase 5)

These components will be **removed** once the 3-layer structure is fully tested:

1. `src/components/career-vault/dashboard/UnifiedHeroCard.tsx`
2. `src/components/career-vault/dashboard/AIPrimaryAction.tsx`
3. `src/components/career-vault/dashboard/legacy/CompactVaultStats.tsx`
4. Old mission/quick wins logic (replaced by Layer-based priorities)

**DO NOT DELETE YET** - Safety rollback in case of issues.

---

## 📝 Key Terminology Changes

| Old Term | New Term (Plain English) |
|----------|-------------------------|
| Career Vault | Your Resume Analysis |
| Power Phrases | Quantified Achievements |
| Transferable Skills | Skills & Experience |
| Hidden Competencies | Unique Strengths |
| Career Intelligence | Resume Details |
| Vault Strength | Resume Strength |
| Industry Authority | Professional Development & Resources |

---

## 🎓 User Education Messages

### On Dashboard Load
> "We're building a complete picture of your professional value to position you accurately against industry standards."

### Layer 1 Description
> "What hiring managers expect to see. These are the foundations of a strong resume."

### Layer 2 Description
> "What makes you stand out. This intelligence powers your resume, LinkedIn, cover letters, and interview prep."

### When Completing Sections
> "Why this matters: Most candidates miss this. Showing [specific detail] positions you as someone companies have invested in."

---

## 🔗 Related Documentation

- [Benchmarking System](./career-vault-benchmarking.md) (Phase 4)
- [Questionnaires](./career-vault-questionnaires.md) (Phase 3)
- [Migration Guide v2→v3](./migration-guide-v3.md)
- [Original Proposal](./3-layer-proposal-2025-11-08.md)

---

## 📊 Success Metrics

**Before (v2):**
- User sees: "40 score, 32 items, grade E"
- User thinks: "What does this mean?"
- User does: Closes tab in confusion

**After (v3):**
- User sees: "Layer 1: 95% complete ✅, Layer 2: 30% complete ⚠️"
- User thinks: "I need to build out my executive intelligence"
- User does: Clicks "Complete Professional Development" (5 min questionnaire)
- User sees: Score goes 40 → 55, benchmark improves
- User feels: Progress, clarity, agency

---

**Last Updated:** November 8, 2025  
**Next Review:** November 15, 2025 (after Phase 3 completion)