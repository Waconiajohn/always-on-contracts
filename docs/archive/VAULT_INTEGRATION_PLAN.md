# Career Vault Integration Plan - Mid-Senior Focus

**Date:** October 21, 2025
**Target Users:** 95% (Individual Contributors, Managers, Directors)
**Key Insight:** We already have LinkedIn, Blogging, and Interview Prep - we just need to CONNECT them to the vault!

---

## Current State Analysis

### ✅ What Already Exists:

1. **LinkedIn Profile Builder** ([LinkedInProfileBuilder.tsx](src/pages/agents/LinkedInProfileBuilder.tsx))
   - Optimizes headline and about section
   - Uses `optimize-linkedin-with-audit` edge function
   - Already pulls from `vault_power_phrases`, `vault_transferable_skills`, `vault_hidden_competencies`
   - Saves to `linkedin_profile_sections` table
   - ✅ **Already integrated with vault!**

2. **LinkedIn Blogging Agent** ([LinkedInBloggingAgent.tsx](src/pages/agents/LinkedInBloggingAgent.tsx))
   - Generates LinkedIn posts
   - Has weekly post calendar
   - Series planner for multi-post campaigns
   - Uses `generate-linkedin-post` edge function
   - ❌ **NOT integrated with vault** (uses manual topic input)

3. **Interview Prep Agent** ([InterviewPrepAgent.tsx](src/pages/agents/InterviewPrepAgent.tsx))
   - Generates interview questions from job description
   - Has elevator pitch builder, 30-60-90 day plan
   - Panel interview guide, 3-2-1 framework
   - Uses `generate-interview-prep` edge function
   - ✅ **Already pulls from vault!** (fetches vault_power_phrases, etc.)

4. **Career Vault Dashboard** ([CareerVaultDashboard.tsx](src/pages/CareerVaultDashboard.tsx))
   - Shows vault stats and strength scores
   - Manages power phrases, skills, competencies
   - Has metrics modal, language modernization
   - ✅ **Central hub exists!**

---

## The Gap: What's Missing

### LinkedIn Blogging NOT using vault data
- User has amazing power phrases in vault like "Reduced latency 60% (800ms → 320ms)"
- LinkedIn blogging agent doesn't suggest posts based on vault content
- **Result:** User has to manually think of topics instead of AI suggesting "Write about your latency optimization project"

### Interview Prep NOT personalizing with vault insights
- Vault has user's best achievements
- Interview prep generates generic questions
- **Result:** Suggested answers don't leverage user's specific vault items

### No Auto-Sync Between Vault Updates and Applications
- User adds new project to vault
- LinkedIn profile, blog posts, interview prep don't auto-update
- **Result:** User has to manually regenerate everything

---

## Implementation Plan - 3 Priorities

### **Priority 1: Improve Vault Quality (3-4 Days)**
Make vault data better quality so integrations are more valuable.

**Tasks:**
1. Add 5 mid-senior questions (promotions, projects, recognition) - *2 days*
2. Add AI inference review (flag guesses for confirmation) - *1 day*
3. Better micro-question prompting (examples, guidance) - *1 day*

**Files to Create:**
- `supabase/migrations/20251022100000_add_mid_senior_questions.sql`
- `supabase/migrations/20251022110000_add_inference_review_flags.sql`
- `supabase/functions/generate-micro-questions/index.ts` (update)
- `src/components/career-vault/InferredItemsReview.tsx` (new)

**Impact:** Better vault data = better LinkedIn posts, better interview prep, better resumes

---

### **Priority 2: Connect Vault to LinkedIn Blogging (2-3 Days)**
Auto-suggest blog post topics from vault power phrases.

**Current Flow:**
```
User manually enters topic → AI generates post
```

**New Flow:**
```
Vault has "Reduced cart abandonment 45% → 12%"
→ AI suggests: "Write about UX optimization lessons from reducing cart abandonment"
→ User clicks "Generate" → Post created with vault data
```

**Implementation:**

#### Step 1: Add "Suggest Topics from Vault" Button
```typescript
// File: src/pages/agents/LinkedInBloggingAgent.tsx

const suggestTopicsFromVault = async () => {
  const { data: vault } = await supabase
    .from('career_vault')
    .select(`
      vault_power_phrases(power_phrase, category, impact_metrics),
      vault_transferable_skills(stated_skill, evidence)
    `)
    .eq('user_id', user.id)
    .single();

  // Get top 5 power phrases with best metrics
  const topPhrases = vault.vault_power_phrases
    .filter(p => p.impact_metrics)
    .sort((a, b) => b.confidence_score - a.confidence_score)
    .slice(0, 5);

  // Call AI to generate post topic ideas
  const { data } = await supabase.functions.invoke('suggest-linkedin-topics-from-vault', {
    body: { powerPhrases: topPhrases }
  });

  setTopicSuggestions(data.topics);
};
```

#### Step 2: Create Edge Function
```typescript
// File: supabase/functions/suggest-linkedin-topics-from-vault/index.ts

serve(async (req) => {
  const { powerPhrases } = await req.json();

  const prompt = `You are a LinkedIn content strategist. Based on these career achievements, suggest 5 engaging LinkedIn post topics:

ACHIEVEMENTS:
${powerPhrases.map(p => `- ${p.power_phrase}`).join('\n')}

For each topic, provide:
- Hook: Engaging opening line
- Angle: "How-to", "Lessons learned", "Case study", "Counterintuitive insight"
- Estimated engagement: Low/Medium/High

Return JSON:
[
  {
    "topic": "5 lessons from reducing cart abandonment by 33%",
    "hook": "Most teams focus on adding features. We got better results by removing friction.",
    "angle": "lessons-learned",
    "estimatedEngagement": "high",
    "vaultItemUsed": "power_phrase_id"
  }
]`;

  const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: "json_object" }
    })
  });

  const data = await aiResponse.json();
  const topics = JSON.parse(data.choices[0].message.content);

  return new Response(JSON.stringify({ topics }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

#### Step 3: Update UI
```typescript
// Add section in LinkedInBloggingAgent.tsx

<Card>
  <CardHeader>
    <CardTitle>💡 Topic Ideas from Your Vault</CardTitle>
    <CardDescription>
      We found {topicSuggestions.length} post ideas based on your achievements
    </CardDescription>
  </CardHeader>
  <CardContent>
    {topicSuggestions.map(topic => (
      <div key={topic.topic} className="border p-4 rounded-lg mb-3">
        <h4 className="font-semibold">{topic.topic}</h4>
        <p className="text-sm text-muted-foreground mt-1">{topic.hook}</p>
        <div className="flex gap-2 mt-2">
          <Badge>{topic.angle}</Badge>
          <Badge variant={topic.estimatedEngagement === 'high' ? 'default' : 'outline'}>
            {topic.estimatedEngagement} engagement
          </Badge>
        </div>
        <Button
          size="sm"
          className="mt-2"
          onClick={() => {
            setTopic(topic.topic);
            handleGenerate(); // Auto-fill and generate
          }}
        >
          Generate Post
        </Button>
      </div>
    ))}
  </CardContent>
</Card>
```

**Files to Create/Modify:**
- `supabase/functions/suggest-linkedin-topics-from-vault/index.ts` (new)
- `src/pages/agents/LinkedInBloggingAgent.tsx` (update)
- `supabase/config.toml` (register new function)

**Estimated Time:** 2-3 days

**Acceptance Criteria:**
- ✅ "Suggest Topics from Vault" button appears in LinkedIn Blogging Agent
- ✅ AI suggests 5 post topics from top vault power phrases
- ✅ User can click "Generate Post" to auto-fill topic and create content
- ✅ Generated posts reference specific vault items

---

### **Priority 3: Enhance Interview Prep with Vault STAR Stories (2-3 Days)**
Interview prep already pulls vault data - let's make it generate better STAR answers.

**Current State:**
- Interview prep generates questions
- Uses vault data but doesn't format as STAR stories

**Improvement:**
- For each behavioral question, suggest STAR answer using specific vault items

**Implementation:**

#### Update Interview Prep Edge Function
```typescript
// File: supabase/functions/generate-interview-prep/index.ts

// After generating questions, add suggested answers from vault

const generateSTARAnswers = async (questions, vaultData) => {
  const answersPrompt = `You are an interview coach. For each question, create a STAR answer using the candidate's vault data.

QUESTIONS:
${JSON.stringify(questions)}

CANDIDATE'S ACHIEVEMENTS (Vault Power Phrases):
${vaultData.vault_power_phrases.map(p => p.power_phrase).join('\n')}

CANDIDATE'S SKILLS:
${vaultData.vault_transferable_skills.map(s => s.stated_skill).join(', ')}

For each behavioral/situational question, return:
{
  "questionId": "1",
  "suggestedAnswer": {
    "situation": "Specific situation from vault",
    "task": "The challenge",
    "action": "What they did (reference vault skills)",
    "result": "Outcome with metrics (reference vault power phrase)"
  },
  "vaultItemsUsed": ["power_phrase_id_1", "skill_id_2"],
  "strengthOfAnswer": "strong|medium|weak",
  "improvementTip": "How to make answer even better"
}`;

  // Call AI to generate STAR answers
  const aiResponse = await fetch(aiEndpoint, {
    body: JSON.stringify({ prompt: answersPrompt })
  });

  return await aiResponse.json();
};

// In main handler:
const questions = /* generated questions */;
const starAnswers = await generateSTARAnswers(questions, vaultData);

return {
  questions,
  suggestedAnswers: starAnswers
};
```

#### Update UI to Show STAR Suggestions
```typescript
// File: src/pages/agents/InterviewPrepAgent.tsx

// In question display:
<Card>
  <CardHeader>
    <CardTitle>{question.question}</CardTitle>
    <Badge>{question.category}</Badge>
  </CardHeader>
  <CardContent>
    <div className="space-y-3">
      <div>
        <h4 className="font-semibold text-sm">💡 Suggested Answer (from your vault):</h4>
        <div className="mt-2 bg-blue-50 p-3 rounded-lg">
          <p><strong>Situation:</strong> {suggestedAnswer.situation}</p>
          <p><strong>Task:</strong> {suggestedAnswer.task}</p>
          <p><strong>Action:</strong> {suggestedAnswer.action}</p>
          <p><strong>Result:</strong> {suggestedAnswer.result}</p>
        </div>
        <Badge variant="outline" className="mt-2">
          Using: {suggestedAnswer.vaultItemsUsed.length} vault items
        </Badge>
      </div>

      <Alert>
        <Lightbulb className="h-4 w-4" />
        <AlertDescription>
          <strong>Improvement Tip:</strong> {suggestedAnswer.improvementTip}
        </AlertDescription>
      </Alert>
    </div>
  </CardContent>
</Card>
```

**Files to Modify:**
- `supabase/functions/generate-interview-prep/index.ts` (update)
- `src/pages/agents/InterviewPrepAgent.tsx` (update)

**Estimated Time:** 2-3 days

**Acceptance Criteria:**
- ✅ Interview prep generates STAR answers for behavioral questions
- ✅ Answers use specific vault power phrases and skills
- ✅ UI shows which vault items are being used
- ✅ Users can edit suggested answers
- ✅ Improvement tips provided for each answer

---

## Optional Priority 4: Project Showcase (3-4 Days)

**Goal:** Let users highlight 2-3 "hero projects" in vault

**Why It Matters:**
- Mid-senior professionals are judged by their best work
- Makes resume generation easier (pull from showcase)
- LinkedIn profile gets stronger (about section from projects)
- Interview prep more focused (STAR stories from showcase)

**Implementation:**
- Create `vault_project_showcase` table
- UI for adding projects (Problem → Solution → Result)
- Mark up to 3 as "Featured"
- Use featured projects as primary source for LinkedIn/interview

**Estimated Time:** 3-4 days

**See MID_SENIOR_VAULT_ROADMAP.md for full details**

---

## Implementation Timeline

### Week 1: Priority 1 (Better Vault Quality)
- **Days 1-2:** Add 5 mid-senior questions
- **Day 3:** AI inference review
- **Day 4:** Better micro-question prompting
- **Ship:** Vault quality improvements

### Week 2: Priority 2 (LinkedIn Blogging Integration)
- **Days 1-2:** Create suggest-topics-from-vault edge function
- **Day 3:** Update LinkedIn Blogging Agent UI
- **Day 4:** Testing and refinement
- **Ship:** "Suggest Topics from Vault" feature

### Week 3: Priority 3 (Interview Prep Enhancement)
- **Days 1-2:** Update generate-interview-prep to create STAR answers
- **Day 3:** Update Interview Prep Agent UI
- **Day 4:** Testing and refinement
- **Ship:** STAR answer suggestions from vault

### Optional Week 4: Priority 4 (Project Showcase)
- **Days 1-2:** Create vault_project_showcase table and migration
- **Days 3-4:** Build Project Showcase UI component
- **Day 5:** Integrate with resume/LinkedIn generation
- **Ship:** Project Showcase feature

---

## Key Integration Points

### Vault → LinkedIn Profile Builder
**Status:** ✅ Already working!
- Pulls vault_power_phrases, vault_transferable_skills
- Generates optimized headline and about section
- Saves to linkedin_profile_sections table

**No changes needed** - this already works great!

---

### Vault → LinkedIn Blogging (NEW)
**Current:** User manually enters topics
**After Priority 2:**
- Click "Suggest Topics from Vault"
- AI analyzes top 5 power phrases
- Suggests 5 post ideas with engagement estimates
- User clicks "Generate" → post created with vault data

---

### Vault → Interview Prep (ENHANCED)
**Current:** Pulls vault data, generates questions
**After Priority 3:**
- For each behavioral question → STAR answer suggested
- Answer uses specific vault power phrases
- Shows which vault items are referenced
- Provides improvement tips

---

### Vault → Resume Generation
**Status:** ✅ Already working!
- Resume builder already pulls from vault
- Uses power phrases, skills, competencies
- Dual version approach (ideal vs personalized)

**No changes needed** - this already works!

---

## What We're NOT Building (C-Suite Features)

❌ Board & Governance vault table (< 5% of users need this)
❌ P&L tracking (VPs+ only)
❌ M&A experience vault (executives only)
❌ Transformation stories vault (too complex for 95%)
❌ Executive narrative engine (overkill)
❌ Full cross-app auto-sync (too complex, LinkedIn API limitations)
❌ Thought leadership tracking (nice-to-have, not critical)
❌ Executive competency framework (5% of users)

**Why Skip These:**
- **User Base:** 95% of users are ICs/Managers/Directors, not C-suite
- **Complexity:** Executive features are 10x more complex
- **ROI:** Better to nail the 95% use case first
- **Speed:** Ship quick wins vs. 3-month executive roadmap

---

## Success Metrics

**Priority 1 (Vault Quality):**
- 80%+ users complete new mid-senior questions
- AI hallucination complaints drop 70%
- Micro-question completion rate improves 30%

**Priority 2 (LinkedIn Blogging):**
- 50%+ users try "Suggest Topics from Vault"
- 30%+ of LinkedIn posts generated use vault data
- User feedback: "Topics are more relevant to my experience"

**Priority 3 (Interview Prep):**
- 70%+ users find STAR suggestions helpful
- Users save 10+ minutes per interview prep session
- Suggested answers use average of 2-3 vault items each

**Priority 4 (Project Showcase - Optional):**
- 60%+ users create at least 1 project showcase
- Featured projects appear in 90%+ of generated resumes
- LinkedIn "About" section quality score improves 20%

---

## Technical Architecture

```
CAREER VAULT (Source of Truth)
├── vault_power_phrases
├── vault_transferable_skills
├── vault_hidden_competencies
├── vault_soft_skills
├── vault_leadership_philosophy
└── [NEW] vault_project_showcase (Priority 4)

INTEGRATIONS (Read from Vault)
├── LinkedIn Profile Builder ✅ (already integrated)
├── LinkedIn Blogging Agent 🔄 (Priority 2: add topic suggestions)
├── Interview Prep Agent 🔄 (Priority 3: add STAR answers)
└── Resume Generator ✅ (already integrated)

EDGE FUNCTIONS
├── optimize-linkedin-with-audit ✅ (existing, uses vault)
├── generate-linkedin-post ✅ (existing, will enhance)
├── generate-interview-prep ✅ (existing, will enhance)
├── [NEW] suggest-linkedin-topics-from-vault (Priority 2)
└── generate-micro-questions 🔄 (Priority 1: add examples)

DATA FLOW
Vault Update → Edge Function → Application UI
- No real-time sync (too complex)
- User clicks "Regenerate" to pull latest vault data
- Copy-to-clipboard for manual paste to LinkedIn
```

---

## Database Schema Updates

### Priority 1: Mid-Senior Questions
```sql
CREATE TABLE mid_senior_question_responses (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  vault_id UUID REFERENCES career_vaults,
  question_id TEXT,
  response JSONB,
  follow_up_responses JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE vault_power_phrases
ADD COLUMN needs_user_review BOOLEAN DEFAULT false,
ADD COLUMN inferred_from TEXT,
ADD COLUMN ai_confidence DECIMAL(3,2);

-- Similar for other vault tables
```

### Priority 4: Project Showcase (Optional)
```sql
CREATE TABLE vault_project_showcase (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  vault_id UUID REFERENCES career_vaults,
  project_name TEXT NOT NULL,
  role TEXT NOT NULL,
  problem TEXT NOT NULL,
  solution TEXT NOT NULL,
  result TEXT NOT NULL,
  team_size TEXT,
  technologies TEXT[],
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER,
  quality_tier TEXT DEFAULT 'gold',
  times_used INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## User Experience Flow

### Before (Current State):
1. User fills out vault (power phrases, skills, etc.)
2. User goes to LinkedIn Profile Builder → manually enters info
3. User goes to LinkedIn Blogging → manually thinks of topics
4. User goes to Interview Prep → gets generic questions
5. **Result:** Vault exists but not fully leveraged

### After (With Integrations):
1. User fills out vault once (15-30 min)
2. **LinkedIn Profile:** Click "Generate from Vault" → headline + about created ✅ (already works!)
3. **LinkedIn Blogging:** Click "Suggest Topics" → 5 post ideas from achievements → click to generate
4. **Interview Prep:** Get questions + STAR answers pre-filled from vault → edit and practice
5. **Result:** Vault is single source of truth for all career content

---

## Recommendation

**Ship Priority 1 this week** (3-4 days):
- Add 5 mid-senior questions
- AI inference review
- Better micro-question examples

**Then ship Priority 2** (next week, 2-3 days):
- LinkedIn blogging topic suggestions from vault

**Then ship Priority 3** (week 3, 2-3 days):
- Interview prep STAR answer suggestions

**Priority 4 is optional** based on user demand.

**Bottom Line:**
- We already have 70% of the integrations built (LinkedIn profile, interview prep)
- We just need to ENHANCE them to use vault data better
- Focus on 95% of users (ICs/Managers/Directors), not 5% (C-suite)
- Ship small, high-impact improvements every week

---

## Files to Create/Modify

### Priority 1 (Vault Quality):
- ✅ `supabase/migrations/20251022100000_add_mid_senior_questions.sql`
- ✅ `supabase/migrations/20251022110000_add_inference_review_flags.sql`
- ✅ `supabase/functions/generate-micro-questions/index.ts` (update)
- ✅ `src/components/career-vault/InferredItemsReview.tsx` (new)

### Priority 2 (LinkedIn Blogging):
- ✅ `supabase/functions/suggest-linkedin-topics-from-vault/index.ts` (new)
- ✅ `src/pages/agents/LinkedInBloggingAgent.tsx` (update)
- ✅ `supabase/config.toml` (register function)

### Priority 3 (Interview Prep):
- ✅ `supabase/functions/generate-interview-prep/index.ts` (update)
- ✅ `src/pages/agents/InterviewPrepAgent.tsx` (update)

### Priority 4 (Project Showcase - Optional):
- ✅ `supabase/migrations/20251022120000_add_project_showcase.sql` (new)
- ✅ `src/components/career-vault/ProjectShowcase.tsx` (new)
- ✅ `src/pages/CareerVaultDashboard.tsx` (add showcase tab)

---

## Next Steps

1. **Review this plan** - Does it align with your vision?
2. **Prioritize** - Which priority should we start with?
3. **Implement** - I'll begin coding Priority 1 (3-4 days of work)
4. **Ship and iterate** - Get user feedback, adjust priorities

**Question for you:** Should I start implementing Priority 1 (vault quality improvements) now, or do you want to adjust the plan first?
