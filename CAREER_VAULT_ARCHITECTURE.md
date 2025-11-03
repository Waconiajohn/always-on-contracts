# Career Vault System Architecture - Complete Map

## Executive Summary
The Career Vault is a sophisticated AI-powered career intelligence platform that extracts, organizes, and validates professional accomplishments across 10 distinct intelligence categories. It serves as the central data source for resume building, interview prep, and job search optimization.

---

## 1. COMPONENT STRUCTURE (60+ components)

### A. Dashboard Components (Main UI)
**Location**: `src/components/career-vault/`

#### Hero & Overview Components
- **VaultStatusHero.tsx** - Main status card showing strength score (0-100), level (Developing→Solid→Strong→Elite→Exceptional), total items, quality distribution
- **VaultQuickStats.tsx** - 4-card stat grid: Intelligence Items, Interview Progress %, Strength Score, Last Updated timestamp
- **MilestoneProgress.tsx** - Timeline of career milestones with age risk detection

#### Content Organization
- **VaultContents.tsx** - Hierarchical view of all vault categories grouped into 3 sections:
  - Core Intelligence (Resume): Power Phrases, Transferable Skills, Hidden Competencies
  - Leadership Intelligence (Interview): Leadership Philosophy, Executive Presence, Personality Traits
  - Culture Fit (Intangibles): Work Style, Values/Motivations, Behavioral Indicators
- **VaultContentsTable.tsx** - Detailed table view with quality tiers, confidence scores, last updated dates
- **VaultContentsTableEnhanced.tsx** - Advanced version with filtering and sorting

#### Quality Management
- **VaultQualityScore.tsx** - Visual quality meter and breakdown by category
- **QualityBoosters.tsx** - Two main boosters:
  1. Add Metrics to Phrases (quantification score)
  2. Modernize Language (modern terminology score)
- **QualityTierExplainer.tsx** - Educational modal explaining Gold/Silver/Bronze/Assumed tiers

#### Recommendations & Suggestions
- **VaultSuggestionsWidget.tsx** - Priority-based suggestions:
  - Verify X AI-assumed items
  - Add metrics to Y phrases
  - Update Z stale items (>6 months)
- **VaultRecommendationsPanel.tsx** - Comprehensive recommendations panel
- **SmartNextSteps.tsx** - Contextual next actions based on vault state

#### Data Quality Features
- **FreshnessManager.tsx** - Identifies and refreshes stale items (>180 days)
- **DuplicateDetector.tsx** - Finds similar/duplicate items using Levenshtein distance
- **VerificationWorkflow.tsx** - Quiz-based verification for assumed items
- **CategoryOrganizer.tsx** - Organize and consolidate vault items

#### Activity & Transparency
- **VaultActivityFeed.tsx** - Chronological log of all vault modifications
- **RecentActivityFeed.tsx** - Quick recent activity summary

#### Item Management
- **VaultItemViewModal.tsx** - Read-only view of vault item details with quality info
- **VaultItemEditModal.tsx** - Edit vault items with quality tier updates
- **VaultItemAttributionBadge.tsx** - Shows item source (extracted from resume, verified, inferred, etc.)

#### Search & Discovery
- **VaultSearchBar.tsx** - Quick search across all vault items
- **AdvancedVaultSearch.tsx** - Full-text search with filters by category, quality tier, freshness
- **VaultReviewInterface.tsx** - Smart review interface for items needing verification

---

### B. Onboarding Components (Flow Components)
**Location**: `src/components/career-vault/onboarding/`

1. **ResumeAnalysisStep.tsx** - Initial resume upload and parsing
2. **CareerDirectionStep.tsx** - Set target roles and industries
3. **IndustryResearchProgress.tsx** - Research market and industry trends
4. **AutoPopulationProgress.tsx** - AI extraction of vault intelligence in progress
5. **SmartReviewWorkflow.tsx** - Guided review of extracted items
6. **GapFillingQuestionsFlow.tsx** - Interview-style questions to fill gaps
7. **VaultCompletionSummary.tsx** - Final onboarding summary

---

### C. Modal & Workflow Components

#### Modals
- **AddMetricsModal.tsx** - Add quantification to power phrases
- **ModernizeLanguageModal.tsx** - Suggest modern terminology updates
- **ResumeUploadChoiceModal.tsx** - Choose upload method
- **ResumeManagementModal.tsx** - Manage resume versions
- **MicroQuestionsModal.tsx** - Quick questions for specific intelligence
- **VaultDuplicationDialog.tsx** - Resolve duplicate items
- **VaultExportDialog.tsx** - Export vault data to various formats

#### Workflows
- **WorkingKnowledgeAssessment.tsx** - Assess depth of knowledge
- **STARStoryBuilder.tsx** - Build STAR-format stories from vault items
- **CompetencyQuizEngine.tsx** - Quiz for skill verification
- **CompetencyQuizResults.tsx** - Quiz result analysis
- **InferredItemsReview.tsx** - Review AI-inferred items
- **BenchmarkComparisonReview.tsx** - Compare against industry benchmarks

#### Special Steps
- **AIAnalysisStep.tsx** - AI analysis progress
- **SkillConfirmationStep.tsx** - Confirm extracted skills
- **InterviewStep.tsx** - Conduct interview questions
- **CareerGoalsStep.tsx** - Set career goals
- **BuildingStep.tsx** - Building/extraction in progress

---

### D. Support Components
- **ProgressHeader.tsx** - Step progress indicator
- **VaultSidebar.tsx** - Navigation sidebar
- **SkillCard.tsx** - Individual skill card display
- **BulkVaultOperations.tsx** - Batch operations on items
- **VoiceNoteRecorder.tsx** - Record voice notes for items
- **AIResearchProgress.tsx** - Research progress indicator
- **CareerFocusClarifier.tsx** - Clarify career direction
- **IntelligentQuestionFlow.tsx** - Adaptive questioning
- **QuestionBatchCard.tsx** - Show batch of questions
- **ResumeUploadCard.tsx** - Resume upload component
- **ResumeUploadStep.tsx** - Upload step component
- **MilestoneManager.tsx** - Manage career milestones

---

## 2. DATABASE SCHEMA

### Main Tables

#### Career Vault Master Table
```
career_vault (master table)
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── created_at, updated_at, last_refreshed_at
├── onboarding_step (state machine)
├── onboarding_completed_at
├── vault_version (currently 2)
├── gap_analysis_id (FK → vault_gap_analysis)
├── resume_raw_text (full resume text)
├── initial_analysis (parsed resume data)
├── target_roles, target_industries
├── vault_strength_before_qa, vault_strength_after_qa
├── overall_strength_score (0-100)
├── review_completion_percentage
├── Total counts: total_power_phrases, total_transferable_skills, etc.
```

#### 10 Intelligence Category Tables
```
1. vault_power_phrases
   ├── id, vault_id, power_phrase
   ├── impact_metrics (JSONB)
   ├── category, keywords (array)
   ├── quality_tier (gold/silver/bronze/assumed)
   ├── confidence_score (0-1)
   ├── effectiveness_score
   ├── times_used, needs_user_review
   └── last_updated_at, created_at

2. vault_transferable_skills
   ├── id, vault_id, stated_skill
   ├── equivalent_skills (array)
   ├── evidence, proficiency_level
   ├── quality_tier, confidence_score
   ├── effectiveness_score, needs_user_review
   └── last_updated_at, created_at

3. vault_hidden_competencies
   ├── id, vault_id, competency_area
   ├── inferred_capability, supporting_evidence (array)
   ├── certification_equivalent
   ├── quality_tier, confidence_score
   ├── effectiveness_score, needs_user_review
   └── last_updated_at, created_at

4. vault_soft_skills
   ├── id, vault_id, skill_name, examples
   ├── impact, proficiency_level
   ├── quality_tier, ai_confidence
   ├── inferred_from, needs_user_review
   └── created_at, updated_at

5. vault_leadership_philosophy
   ├── id, vault_id, philosophy_statement
   ├── leadership_style, real_world_application
   ├── core_principles (array)
   ├── quality_tier, ai_confidence
   └── created_at, updated_at

6. vault_executive_presence
   ├── id, vault_id, presence_indicator
   ├── situational_example, perceived_impact
   ├── brand_alignment
   ├── quality_tier, ai_confidence
   └── created_at, updated_at

7. vault_personality_traits
   ├── id, vault_id, trait_name
   ├── behavioral_evidence, work_context
   ├── quality_tier, ai_confidence
   └── created_at, updated_at

8. vault_work_style
   ├── id, vault_id, preference_area
   ├── preference_description, ideal_environment
   ├── quality_tier, ai_confidence
   └── created_at, updated_at

9. vault_values_motivations
   ├── id, vault_id, value_name
   ├── importance_level, manifestation
   ├── quality_tier, ai_confidence
   └── created_at, updated_at

10. vault_behavioral_indicators
    ├── id, vault_id, indicator_type
    ├── specific_behavior, context, outcome_pattern
    ├── quality_tier, ai_confidence
    └── created_at, updated_at
```

#### Supporting Tables
```
vault_gap_analysis
├── id, vault_id, user_id
├── target_role, target_industry
├── gaps, strengths, opportunities (JSONB arrays)
├── recommendations (JSONB array)
├── competitive_advantages, market_positioning
├── percentile_ranking, vault_strength_at_analysis
└── analyzed_at, created_at, updated_at

vault_activity_log
├── id, vault_id, user_id
├── activity_type (strength_score_change, verification, etc.)
├── description, metadata (JSONB)
└── created_at

vault_resume_milestones
├── id, vault_id
├── milestone_type (job|education)
├── company_name, job_title, description
├── start_date, end_date, graduation_date
├── hidden_from_resume, hide_dates
├── date_display_preference, privacy_notes
└── created_at, updated_at
```

### Indexes & Functions
```
Full-text search indexes:
├── idx_power_phrases_fts (GIN on power_phrase)
├── idx_transferable_skills_fts (GIN on skill + evidence)
├── idx_hidden_competencies_fts (GIN on competency + capability)
└── idx_soft_skills_fts (GIN on skill_name + examples)

Quality & Review indexes:
├── idx_power_phrases_quality (vault_id, quality_tier, confidence DESC)
├── idx_power_phrases_needs_review (WHERE needs_user_review = true)
├── idx_skills_effectiveness (vault_id, effectiveness_score DESC)
└── idx_activity_log_chronological (vault_id, created_at DESC)

Database Functions:
├── search_vault_items() - Advanced search across all items
├── get_vault_statistics() - Stats by category and quality
└── update_vault_gap_analysis_timestamp() - Auto-update timestamps
```

---

## 3. DATA FLOW ARCHITECTURE

### Flow 1: Onboarding → Vault Population → Dashboard

```
1. RESUME UPLOAD
   User uploads resume
   ↓
   ResumeUploadStep.tsx
   ↓
   supabase.functions.invoke('parse-resume')
   ↓
   Career vault created with resume_raw_text

2. INITIAL ANALYSIS
   ↓
   supabase.functions.invoke('analyze-resume-initial')
   ↓
   Extracts key info: dates, companies, roles, achievements
   ↓
   Stores in career_vault.initial_analysis (JSONB)

3. SET CAREER DIRECTION
   CareerDirectionStep.tsx
   ↓
   Set target_roles and target_industries
   ↓
   Stored in career_vault table

4. INDUSTRY RESEARCH
   ↓
   supabase.functions.invoke('conduct-industry-research')
   ↓
   Perplexity AI research on market trends
   ↓
   Context for auto-population

5. AUTO-POPULATE VAULT (Core Intelligence Extraction)
   ↓
   AutoPopulationProgress.tsx
   ↓
   supabase.functions.invoke('auto-populate-vault-v2')
   ↓
   DEEP EXTRACTION:
      - Analyzes resume + target roles + industry context
      - Extracts 10 categories of intelligence
      - Assigns quality tiers based on confidence
      - Stores in 10 vault_* tables
   ↓
   Items stored with:
      - quality_tier (gold/silver/bronze/assumed)
      - confidence_score (AI confidence)
      - needs_user_review flag

6. SMART REVIEW WORKFLOW
   SmartReviewWorkflow.tsx
   ↓
   Shows items grouped by quality tier
   ↓
   User can:
      - Approve items (quality tier ↑)
      - Reject items (deleted)
      - Edit items (manual refinement)
      - Request verification (quiz)

7. GAP FILLING QUESTIONS
   GapFillingQuestionsFlow.tsx
   ↓
   supabase.functions.invoke('generate-intelligent-questions')
   ↓
   User answers targeted questions
   ↓
   Extract additional intelligence from responses:
      - supabase.functions.invoke('extract-vault-intelligence')
      - Add to vault tables with source tracking

8. VAULT COMPLETION
   VaultCompletionSummary.tsx
   ↓
   Calculate final strength score:
      - Count items by quality tier
      - Weight by freshness (recent > old)
      - Calculate category scores
      - Overall score: weighted average
   ↓
   Set onboarding_step = 'onboarding_complete'
   ↓
   Redirect to CareerVaultDashboard

9. DASHBOARD DISPLAY
   CareerVaultDashboard.tsx
   ↓
   Parallel fetch of all 10 vault tables:
      const [
        powerPhrases,
        transferableSkills,
        hiddenCompetencies,
        softSkills,
        leadershipPhilosophy,
        executivePresence,
        personalityTraits,
        workStyle,
        values,
        behavioralIndicators
      ] = await Promise.all([...])
   ↓
   Calculate quality distribution (gold/silver/bronze/assumed)
   ↓
   Calculate strength score across all items
   ↓
   Render:
      - VaultStatusHero (score & level)
      - VaultQuickStats (4 key metrics)
      - VaultContents (category overview)
      - QualityBoosters (improvement tips)
      - SmartNextSteps (contextual actions)
      - VaultActivityFeed (recent changes)
      - VaultSuggestionsWidget (recommended tasks)
```

### Flow 2: Dashboard → Resume Builder

```
Resume Builder Initialization
   ↓
   User inputs job description
   ↓
   supabase.functions.invoke('analyze-job-qualifications')
   ↓
   Extracts job requirements

Match Vault to Requirements
   ↓
   supabase.functions.invoke('match-vault-to-requirements')
   ↓
   Queries all 10 vault tables:
      SELECT * FROM vault_power_phrases WHERE ...
      SELECT * FROM vault_transferable_skills WHERE ...
      [etc for all 10 tables]
   ↓
   Enhanced with quality scoring:
      const matches = enhanceVaultMatches(rawMatches)
      ↓
      Each match gets:
         - qualityTier (gold/silver/bronze/assumed)
         - freshnessScore (based on last_updated_at)
         - confidence (AI + verification confidence)

Requirement Categorization
   ↓
   categorizedRequirements = {
      autoHandled: [],     // Gold/Silver items that match
      needsInput: [],      // Bronze items needing user input
      optionalEnhancement: [] // Assumed items for enhancement
   }

Resume Section Generation
   ↓
   For each requirement:
      1. Get matching vault items sorted by quality tier
      2. If Gold/Silver: Auto-populate section
      3. If Bronze: Ask user for enhancement
      4. If Assumed: Optional improvement suggestions

Interactive Preview
   ↓
   InteractiveResumeBuilder.tsx
   ↓
   User can:
      - Edit auto-generated content
      - Pull in alternative vault items
      - Add custom content
      - Quantify achievements (pull metrics from vault)
      - Modernize language (suggest modern terms from vault)

ATS Analysis
   ↓
   supabase.functions.invoke('analyze-ats-score')
   ↓
   Cross-reference vault items against job keywords
   ↓
   Suggest improvements from vault data
```

### Flow 3: Quality Management

```
Strength Score Calculation (VaultStatusHero)
   ↓
   For each vault item:
      quality_tier_weight = {
         gold: 1.0,
         silver: 0.8,
         bronze: 0.6,
         assumed: 0.4
      }
      ↓
      freshness_multiplier:
         0-30 days: 1.0
         31-90 days: 0.9
         91-180 days: 0.8
         [decay over time]
      ↓
      item_score = quality_tier_weight * freshness_multiplier
   ↓
   overall_score = AVG(all_item_scores) * 100

Quality Distribution (VaultStatusHero Details)
   ↓
   Count items by quality_tier:
      SELECT COUNT(*) FROM vault_power_phrases WHERE quality_tier = 'gold'
      [repeat for silver, bronze, assumed]
   ↓
   Calculate percentages for pie chart

Freshness Detection
   ↓
   getStaleItems(vaultId, daysThreshold=180)
   ↓
   For each of 10 tables:
      SELECT * WHERE last_updated_at < (NOW() - 180 days)
   ↓
   FreshnessManager.tsx displays stale items
   ↓
   User can: refreshItem() → updates timestamp

Duplicate Detection
   ↓
   findDuplicates(vaultId, similarityThreshold=85)
   ↓
   For each pair of items:
      Calculate similarity = Levenshtein distance
      If similarity >= 85%: flag as duplicate
   ↓
   DuplicateDetector.tsx shows groups
   ↓
   User can: merge or delete

Verification Workflow
   ↓
   Show assumed items with low confidence
   ↓
   VerificationWorkflow.tsx:
      - Show item
      - Ask verification question
      - Update quality_tier from assumed→bronze/silver/gold
      - Log activity
```

---

## 4. KEY FEATURES ARCHITECTURE

### Quality Tier System (4 levels)
```
GOLD (verified, high confidence)
├── User verified via quiz (quiz_verified = true)
├── Verification status set to 'verified'
├── High confidence score (>0.85) + evidence
└── Display: Gold badge, trusted in resume builder

SILVER (high confidence, good evidence)
├── AI confidence 0.70-0.85
├── Multiple evidence pieces (3+)
├── Well-structured extraction
└── Display: Silver badge, auto-populate resume

BRONZE (moderate confidence)
├── AI confidence 0.55-0.70
├── Some evidence (1-2 pieces)
├── AI-inferred items
└── Display: Bronze badge, ask user for enhancement

ASSUMED (low confidence)
├── AI confidence < 0.55
├── No verification/evidence
├── Needs user review
└── Display: Assumed badge, suggestion for verification
```

### Strength Score Components
```
Overall Score (0-100):
├── Power Phrases: max 10 points
├── Transferable Skills: max 10 points
├── Hidden Competencies: max 10 points
├── Intangibles: max 40 points (7 categories × ~6 each)
├── Quantification: max 15 points (% phrases with metrics)
└── Modern Terminology: max 15 points (% with modern keywords)

Level Assignment:
├── 90+: Exceptional
├── 80-89: Elite
├── 70-79: Strong
├── 60-69: Solid
└── <60: Developing
```

### Verification System
```
Verification Quiz Workflow:
1. Select items needing verification (usually assumed tier)
2. Generate quiz using: supabase.functions.invoke('generate-skill-verification-questions')
3. Present question (e.g., "Describe your experience with X")
4. User answers
5. evaluate answer:
   - If validates skill: upgrade quality_tier → gold/silver
   - If doesn't validate: downgrade or flag for review
6. Update vault item: quality_tier, quiz_verified, needs_user_review
7. Recalculate strength score
```

### Freshness Management
```
Stale Item Detection:
├── Items not updated for 180+ days
├── Tracked via last_updated_at field
└── FreshnessManager.tsx shows aged items

Refresh Options:
├── Bulk refresh: click "Update X stale items"
├── Individual: click refresh on item card
└── Automatic: Can be scheduled via cron job

Freshness Score (separate from quality):
├── 0-30 days old: 100
├── 31-90 days: 90
├── 91-180 days: 80
├── [decay to 40 after 3+ years]
└── Used in strength score calculation
```

### Duplicate Detection
```
Algorithm: Levenshtein distance
├── Calculate string distance between items
├── Similarity % = (max_length - distance) / max_length * 100
├── Flag if >= 85% similar
└── Show in groups for consolidation

Merge Options:
├── Keep one, delete others
├── Combine descriptions
├── Highest quality tier wins
└── Log as consolidation activity
```

---

## 5. UI/UX COMPONENT HIERARCHY

### Main Dashboard Layout
```
CareerVaultDashboard
├── ContentLayout (left sidebar + main + right sidebar)
│   ├── ContextSidebar (left)
│   ├── Main Content
│   │   ├── VaultStatusHero (strength score hero)
│   │   ├── VaultQuickStats (4-card grid)
│   │   ├── Tabs (Overview | Contents | Activity)
│   │   │   ├── Overview
│   │   │   │   ├── SmartNextSteps
│   │   │   │   ├── VaultSuggestionsWidget
│   │   │   │   ├── QualityBoosters
│   │   │   │   ├── RecentActivityFeed
│   │   │   │   └── MilestoneManager
│   │   │   ├── Contents
│   │   │   │   ├── VaultContents (category overview)
│   │   │   │   └── VaultContentsTable (detailed list)
│   │   │   └── Activity
│   │   │       └── VaultActivityFeed
│   │   ├── Modals
│   │   │   ├── AddMetricsModal
│   │   │   ├── ModernizeLanguageModal
│   │   │   ├── ResumeManagementModal
│   │   │   ├── VaultItemViewModal
│   │   │   └── VaultItemEditModal
│   │   └── Workflows
│   │       ├── VerificationWorkflow
│   │       ├── DuplicateDetector
│   │       └── FreshnessManager
│   └── Right Sidebar
│       └── VaultSidebar (quick actions)
└── Alerts & Toasts
```

### Dashboard Card Component Map
```
VaultStatusHero
├── Main: Trophy icon + "Your Career Vault: {level}" + "{score}/100"
├── Status: "Your vault can generate {type} resumes..."
├── Stats: "{totalItems} intelligence items" + "{quickWins} Quick Wins available"
├── Expandable Details:
│   ├── Quality Distribution (4 mini-cards: gold/silver/bronze/assumed counts)
│   └── Score Breakdown (6 mini progress bars by component)
└── Actions: "Refresh Vault", "View Details", "Take Quick Wins →"

VaultQuickStats (4-column grid)
├── Card 1: Brain icon + "{totalItems}" Intelligence Items
├── Card 2: Target icon + "{interviewProgress}%" Interview Progress
├── Card 3: Award icon + "{strengthScore}" Strength Score
└── Card 4: Clock icon + "{lastUpdated}" Last Updated

VaultContents (Categories)
├── Section 1: Core Intelligence (Resume)
│   ├── Power Phrases (icon + count + quality badges)
│   ├── Transferable Skills
│   └── Hidden Competencies
├── Section 2: Leadership Intelligence (Interview)
│   ├── Leadership Philosophy
│   ├── Executive Presence
│   └── Personality Traits
├── Section 3: Culture Fit (Intangibles)
│   ├── Work Style
│   ├── Values & Motivations
│   └── Behavioral Indicators
└── Action: "Show All X Categories" toggle

QualityBoosters (2 sections)
├── Quantification Booster
│   ├── "Add Metrics to Phrases"
│   ├── "{phrasesWithMetrics} of {totalPhrases} phrases have metrics"
│   ├── Example: Before/After comparison
│   └── Action Button
└── Modernization Booster
    ├── "Modernize Your Language"
    ├── "{phrasesWithModernTerms} phrases use modern keywords"
    ├── Example: Outdated vs Modern terms
    └── Action Button

VaultSuggestionsWidget (Priority-based)
├── If assumedCount > 0:
│   ├── Title: "Verify X AI-assumed items"
│   ├── Desc: "Quick quiz to upgrade quality"
│   ├── Impact Badge: "{points} points possible"
│   └── Priority: HIGH (AlertTriangle icon)
├── If weakPhrasesCount > 0:
│   ├── Title: "Add metrics to Y phrases"
│   ├── Desc: "Transform vague bullets to quantified"
│   └── Priority: HIGH
└── If staleItemsCount > 0:
    ├── Title: "Update Z stale items"
    ├── Desc: "Items older than 6 months"
    └── Priority: MEDIUM

SmartNextSteps (Contextual actions)
├── Card per recommendation with:
│   ├── Icon + Title
│   ├── Description
│   ├── Impact badge
│   ├── Time estimate
│   └── Action button
└── Ordered by priority (1=highest)

RecentActivityFeed (Timeline)
├── Activity entries:
│   ├── Icon (matches activity type)
│   ├── "User {action}" 
│   ├── Timestamp
│   └── Metadata (item type, count, etc.)
└── Scrollable list
```

---

## 6. STATE MANAGEMENT

### Component State Pattern
```
VaultDashboardContent uses useState for:
├── vaultId, vault (main data)
├── stats (counts for all 10 categories)
├── 10 separate states: powerPhrases[], transferableSkills[], etc.
├── strengthScore (calculated from all items)
├── qualityDistribution (gold/silver/bronze/assumed counts)
├── selectedItem, viewModalOpen, editModalOpen
├── resumeModalOpen, restartDialogOpen
├── modals: addMetricsModalOpen, modernizeModalOpen
└── Loading states: loading, isReanalyzing

Data Fetch Pattern:
1. On mount: useEffect with empty dependency = fetchData()
2. fetchData() does:
   ├── Get authenticated user
   ├── Query career_vault table
   ├── Then Promise.all() to fetch all 10 vault tables
   ├── Set state for each table
   ├── Calculate strength score
   ├── Calculate quality distribution
   └── Set loading = false
```

### Shared Hooks
- **useCareerVaultGate()** - Check if vault exists
- **useResumeMilestones()** - Load career milestones
- **useOnboardingAutoSave()** - Auto-save onboarding progress

---

## 7. EDGE FUNCTIONS (Backend API Orchestration)

### Intelligence Extraction Functions
```
auto-populate-vault-v2/index.ts
├── Input: resumeText, vaultId, targetRoles, targetIndustries
├── Process:
│   ├── Call Perplexity AI with expert prompt
│   ├── Request extraction across all 10 categories
│   └── Parse JSON response
├── Store: Insert into all 10 vault_* tables with:
│   ├── quality_tier (assigned based on confidence)
│   ├── confidence_score (from AI)
│   └── needs_user_review (based on tier)
└── Return: Count of items per category

extract-vault-intelligence/index.ts
├── Input: responseText (user answer), questionText, vaultId
├── Process:
│   ├── Call Perplexity AI for deep analysis
│   ├── Request extraction across all 20 categories (not just 10)
│   └── Parse JSON response
├── Store: Insert into vault tables with source tracking
└── Return: Extracted items by category

analyze-resume-initial/index.ts
├── Parse resume for basic structure
├── Extract: dates, companies, roles, achievements
├── Store: in career_vault.initial_analysis (JSONB)
└── Support for auto-populate with context
```

### Analysis Functions
```
analyze-resume/index.ts
├── Deep resume analysis for job search
├── Extract: work history, skills, achievements
├── Return: structured data for job matching

analyze-job-qualifications/index.ts
├── Input: Job description
├── Extract: Requirements, preferred qualifications, nice-to-have
└── Segment by criticality

match-vault-to-requirements/index.ts
├── Input: vaultId, job requirements
├── Query: All 10 vault tables for matches
├── Score: Quality tier × relevance × freshness
├── Return: Categorized matches (autoHandled, needsInput, etc.)

conduct-industry-research/index.ts
├── Input: targetRoles, targetIndustries
├── Research: Market trends, salary ranges, in-demand skills
├── Return: JSONB context for auto-population
```

### UI Support Functions
```
get-vault-data/index.ts
├── Input: userId
├── Output: All vault data (career_vault + all 10 categories)
├── Used by: Resume builder, dashboard initialization
└── Replaces: MCP calls for reliability

search-vault-advanced/index.ts
├── Input: searchQuery, vaultId, filters (category, quality_tier)
├── Uses: PostgreSQL full-text search indexes
├── Output: Ranked results with match scores
└── Powers: Advanced vault search UI

calculate-completeness-score/index.ts
├── Input: vaultId
├── Calculate: Onboarding completion %
├── Return: Progress percentage for header
```

### Quality Management Functions
```
generate-vault-recommendations/index.ts
├── Input: vaultId
├── Analyze:
│   ├── Count items by quality_tier
│   ├── Identify assumed items for verification
│   ├── Find items without metrics
│   └── Detect stale items (>6 months)
├── Return: [VaultRecommendation] array with:
│   ├── id, title, description
│   ├── action (what to do)
│   ├── scoreBoost (expected points)
│   └── timeEstimate
└── Used by: VaultSuggestionsWidget

generate-skill-verification-questions/index.ts
├── Input: itemIds (assumed items to verify)
├── Generate: Quiz questions for each item
├── Return: [Question] for VerificationWorkflow
└── User answers → quality_tier upgrade

gap-analysis/index.ts
├── Input: vaultId, targetRole, targetIndustry
├── Analyze: Vault vs requirements
├── Return: vault_gap_analysis record with:
│   ├── gaps, strengths, opportunities
│   ├── recommendations, competitive_advantages
│   └── percentile_ranking
└── Stored and linked to career_vault
```

### Resume Builder Functions
```
generate-resume-section/index.ts
├── Input: sectionType, vaultMatches, jobRequirements
├── Generate: Tailored resume section text
├── Use: Vault items as foundation
├── Return: HTML/text section ready for display

customize-resume/index.ts
├── Input: resumeSection, customizations
├── Enhance: Make section more impactful
├── Return: Refined section text

optimize-resume-with-audit/index.ts
├── Input: resumeText, jobDescription
├── Analyze: ATS compatibility
├── Return: Score + specific improvement suggestions

analyze-ats-score/index.ts
├── Input: resumeText, jobDescription
├── Score: ATS keyword matching
├── Suggest: Improvements from vault data
└── Highlight: Items to add/strengthen
```

---

## 8. DATA FLOW IN RESUME BUILDER

### Sequence Diagram
```
User inputs Job Description
  ↓
analyze-job-qualifications()
  ↓ (Extract requirements)
  ↓
User sees: "Found X requirements"
  ↓
match-vault-to-requirements()
  ↓ (Query all 10 vault tables)
  ↓
enhanceVaultMatches() (client-side)
  ├── assignQualityTier() for each match
  ├── calculateFreshnessScore() for each match
  └── Return: VaultMatchWithQuality[]
  ↓
Categorize matches:
  ├── autoHandled (Gold/Silver)
  ├── needsInput (Bronze - user decides)
  └── optionalEnhancement (Assumed - nice to have)
  ↓
For each Requirement:
  ├── If autoHandled: generate-resume-section()
  ├── If needsInput: ask user which vault item to use
  └── If optionalEnhancement: offer suggestions
  ↓
generate-resume-section() for each auto-handled
  ├── Input: vault item + job requirement
  ├── Generate: Tailored bullet point
  └── Return: Resume-ready text
  ↓
User preview + edit in InteractiveResumeBuilder
  ↓
Quantification & Modernization options
  ├── Pull from: impact_metrics in vault
  ├── Suggest: modern_keywords from vault
  └── User can: edit inline
  ↓
analyze-ats-score() before finalization
  ├── Check keyword coverage
  ├── Suggest vault items to include
  └── Show score impact
  ↓
Export/Save Resume
```

---

## 9. CRITICAL INTEGRATION POINTS

### Resume Builder ↔ Vault
```
Pull Data:
├── Resume Builder queries: career_vault + all 10 tables
├── Filter by: quality_tier, relevance, freshness
├── Sort by: effectiveness_score, confidence_score
└── Return: Enhanced with quality metadata

Quality Usage:
├── Gold items: Auto-populate resume
├── Silver items: Present with confidence
├── Bronze items: Ask user confirmation
├── Assumed items: Optional enhancement
```

### Dashboard ↔ Onboarding
```
Onboarding completes:
  ├── Set: career_vault.onboarding_step = 'onboarding_complete'
  └── Navigate to: /career-vault-dashboard

Dashboard can trigger re-onboarding:
  ├── Button: "Restart Vault Analysis"
  ├── Set: onboarding_step = 'not_started'
  └── Clear: vault data (optional)
```

### Quality Management ↔ Dashboard
```
User actions on dashboard:
├── Verify item: VerificationWorkflow
│   └── Update: quality_tier, quiz_verified
├── Add metrics: AddMetricsModal
│   └── Update: impact_metrics in vault item
├── Modernize: ModernizeLanguageModal
│   └── Add: modern_keywords, update last_updated_at
├── Refresh stale: FreshnessManager
│   └── Update: last_updated_at = NOW()
└── All actions logged: vault_activity_log table
```

---

## 10. RECOMMENDED DASHBOARD UI/UX IMPROVEMENTS

Based on current complexity, here are simplification opportunities:

### Current Pain Points
1. **Too many modals** (8+ different modals)
2. **Information overload** (VaultStatusHero shows too much)
3. **Multiple similar widgets** (VaultSuggestionsWidget + QualityBoosters + SmartNextSteps overlap)
4. **Category organization unclear** (Users confused about 10 vs 20 categories)
5. **Quality tier system complex** (4 tiers not well understood)
6. **Activity feed not prominent** (Users don't see what changed)

### Redesign Recommendations
1. **Consolidate modals** into 2-3 workflows
2. **Simplify hero card** - show only score + level + 1 primary action
3. **Merge suggestion widgets** into single "Quick Wins" panel
4. **Reorganize categories** by use case (Resume | Interview | Culture Fit)
5. **Add quality tier education** with visual examples
6. **Make activity feed first-class** - prominent timeline view
7. **Progressive disclosure** - show summary, expand for details

---

## 11. KEY FILES TO MODIFY FOR DASHBOARD REDESIGN

```
Priority 1 (Core UI):
├── src/pages/CareerVaultDashboard.tsx (main layout)
├── src/components/career-vault/VaultStatusHero.tsx (hero card)
├── src/components/career-vault/VaultContents.tsx (category view)
└── src/components/career-vault/QualityBoosters.tsx (improvement tips)

Priority 2 (Widgets):
├── src/components/career-vault/VaultSuggestionsWidget.tsx
├── src/components/career-vault/SmartNextSteps.tsx
├── src/components/career-vault/VaultQuickStats.tsx
└── src/components/career-vault/RecentActivityFeed.tsx

Priority 3 (Modals):
├── src/components/career-vault/AddMetricsModal.tsx
├── src/components/career-vault/ModernizeLanguageModal.tsx
├── src/components/career-vault/VaultItemViewModal.tsx
└── src/components/career-vault/VaultItemEditModal.tsx

Supporting Services:
├── src/lib/vaultQualityScoring.ts (quality logic)
├── src/lib/services/vaultRecommendations.ts (suggestions)
├── src/lib/services/vaultDuplicateDetector.ts (duplicates)
└── src/lib/utils/vaultDataTransformer.ts (data transform)
```

