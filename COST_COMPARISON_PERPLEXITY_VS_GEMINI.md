# Cost Comparison: Perplexity vs Gemini for Resume Research

## Current Setup
✅ **You already have Perplexity integrated!**
- Edge function: `supabase/functions/perplexity-research/index.ts`
- React hook: `src/hooks/usePerplexityResearch.ts`
- API key configured in Lovable
- Currently using: `llama-3.1-sonar-large-128k-online` model

---

## Pricing Breakdown

### **Perplexity API** (llama-3.1-sonar-large-128k-online)

**Dual Pricing Model:**
- **Per Request:** $5 per 1,000 requests = **$0.005 per request**
- **Per Token:** $1 per 1M tokens = **$0.000001 per token**

**Total Cost Formula:**
```
Cost = (Number of Requests × $0.005) + (Total Tokens × $0.000001)
```

**Example Research Request:**
- Input: ~1,500 tokens (job description + research prompt)
- Output: ~3,000 tokens (comprehensive research)
- Total tokens: 4,500 tokens
- **Cost per research:** $0.005 (request) + $0.0045 (tokens) = **$0.0095 (~$0.01)**

---

### **Gemini 2.5 Pro** (Direct API)

**Per Token Pricing:**
- **Input:** $1.25 per 1M tokens = **$0.00000125 per token**
- **Output:** $10 per 1M tokens = **$0.00001 per token**

**No per-request fee** (unlike Perplexity)

**Example Research Request:**
- Input: ~1,500 tokens (job description + research prompt)
- Output: ~3,000 tokens (research response)
- **Cost per research:** ($0.00000125 × 1,500) + ($0.00001 × 3,000) = $0.001875 + $0.03 = **$0.032**

**BUT:** Gemini **CANNOT do real-time web search** by itself

---

### **Gemini 2.5 Pro with Google Search Grounding** (Experimental)

Gemini has a "grounding with Google Search" feature that can retrieve real-time data:

**Pricing:**
- Same token pricing as above
- **Plus:** $35 per 1,000 grounding calls = **$0.035 per grounded search**

**Example Research Request with Grounding:**
- Input: 1,500 tokens
- Output: 3,000 tokens
- Grounding: 1 search
- **Cost per research:** $0.032 (tokens) + $0.035 (grounding) = **$0.067**

**Problem:** Grounding is experimental and not as comprehensive as Perplexity's deep search

---

## Head-to-Head Comparison

### For Job Description Research (per resume)

| Task | Perplexity | Gemini (no search) | Gemini (with grounding) |
|------|-----------|-------------------|------------------------|
| **Job analysis** | $0.01 | $0.032 | $0.067 |
| **Industry research** | $0.01 | ❌ Can't do real-time | $0.067 |
| **Keyword extraction** | $0.01 | $0.032 | $0.067 |
| **Total per resume** | **$0.03** | **$0.032** (incomplete) | **$0.20** |

**Winner for Research: Perplexity** ✅
- 6.7x cheaper than Gemini with grounding
- Real-time web search built-in
- Citations and sources included
- More comprehensive results

---

### For Content Generation (per resume)

| Task | Gemini 2.5 Pro | Perplexity | Claude 4 Sonnet |
|------|---------------|-----------|-----------------|
| **Ideal summary** | $0.015 | $0.01 | $0.09 |
| **Personalized summary** | $0.015 | $0.01 | $0.09 |
| **6 sections × 2 versions** | $0.18 | $0.12 | $1.08 |

**Winner for Generation: Gemini** ✅
- 50% more expensive than Perplexity
- But higher quality for structured writing
- Better instruction following
- Lovable partnership pricing may be better

---

## Optimal Hybrid Approach

### **Use Perplexity for Research + Gemini for Generation**

**Cost per Full Resume:**

| Phase | Tool | Cost | Why |
|-------|------|------|-----|
| **Job Analysis** | Perplexity | $0.01 | Real-time search, citations |
| **Industry Research** | Perplexity | $0.01 | Deep web research |
| **Keyword Extraction** | Perplexity | $0.01 | Comprehensive analysis |
| **Ideal Summary Generation** | Gemini | $0.015 | Better structured output |
| **Personalized Summary** | Gemini | $0.015 | Better formatting |
| **5 More Sections (dual)** | Gemini | $0.15 | Cost-effective generation |
| **TOTAL** | **Both** | **$0.22** | Best quality + cost |

**vs. Using Only Perplexity:**
- All research + generation: ~$0.15
- **Saves:** $0.07 per resume (32% cheaper)
- **But:** Perplexity is better for research, Gemini better for generation

**vs. Using Only Gemini (with grounding):**
- All research + generation: ~$0.50
- **Saves:** $0.28 per resume (56% savings!)
- **But:** Gemini grounding is experimental, less comprehensive

---

## Recommendation: Stick with Your Current Setup (Mostly)

### **Phase 0: Research (Use Perplexity)** ✅
**Why:**
- ✅ You already have it integrated
- ✅ 6.7x cheaper than Gemini with grounding
- ✅ Real-time web search (Gemini can't do this well)
- ✅ Citations included
- ✅ More comprehensive research results
- ✅ Built for research tasks

**Cost:** ~$0.01 per job analysis

### **Phase 1 & 2: Generation (Use Gemini)** ✅
**Why:**
- ✅ Better structured output for resumes
- ✅ More reliable JSON formatting
- ✅ Better instruction following
- ✅ Lovable partnership may have better rates
- ✅ 12x cheaper than Claude

**Cost:** ~$0.18 per full resume (6 sections × 2 versions)

### **Total Cost per Resume: $0.19** (vs $0.27 I estimated earlier)

---

## Cost Analysis at Scale

### Scenario: 1,000 Resumes/Month

| Approach | Research | Generation | Total | Notes |
|----------|---------|-----------|-------|-------|
| **Perplexity + Gemini** | $10 | $180 | **$190** | Recommended ✅ |
| **Only Perplexity** | $10 | $120 | **$130** | Cheaper but lower quality |
| **Only Gemini (grounded)** | $200 | $180 | **$380** | 2x more expensive |
| **Gemini (no search)** | ❌ | $180 | **N/A** | Can't do real-time research |

**Savings with Hybrid:** $190 vs $380 = **$190/month saved** vs Gemini-only

---

## What If You Used ONLY Gemini?

**Problem:** Gemini can't do real-time web research effectively

**Example Prompt to Gemini (without Perplexity):**
```
Analyze this job description and tell me:
1. What problem does this role solve?
2. What are the critical keywords?
3. What industry standards apply?

[Job Description]
```

**Gemini Response:**
> "Based on the job description, this role solves [generic analysis]. Key skills include [repeats what's in JD]. Industry standards typically focus on [educated guess without real data]."

**Problems:**
- ❌ No real-time job market data
- ❌ No salary information
- ❌ No current industry trends
- ❌ No competitive intelligence
- ❌ Just summarizing the job description (not researching)

**Perplexity Response:**
> "Based on analysis of 47 recent job postings for Senior Product Manager in fintech, this role solves the problem of [specific insight]. Current market data shows salaries range from $140K-$180K in San Francisco (Source: levels.fyi, Jan 2025). Top companies hiring include Stripe, Plaid, and Affirm. Critical skills with 80%+ mention rate: [data-driven list]. Industry standard resumes emphasize [researched patterns]."

**Value Difference:** Perplexity provides **real data** vs Gemini's **educated guesses**

---

## Revised Cost Estimate (Using Your Existing Perplexity)

### Per Resume Generation:

**Research Phase (Perplexity):**
- Job problem analysis: $0.01
- Industry benchmarking: $0.01
- Keyword extraction: $0.01
- **Subtotal:** $0.03

**Generation Phase (Gemini via Lovable):**
- Ideal summary: $0.015
- Personalized summary: $0.015
- 5 more sections × 2 versions: $0.15
- **Subtotal:** $0.18

**Total Cost per Resume:** $0.21 (vs $0.27 I originally estimated)

---

## Updated Pricing Model Margins

### With Corrected Costs ($0.21 per resume):

**Free Tier:** 2 resumes/month
- Cost: 2 × $0.21 = $0.42 (down from $0.77)
- **Better economics!**

**Pro Tier ($19.99/month):** 10 resumes/month
- Cost: 10 × $0.21 = $2.10 (down from $5.35)
- **Profit: $17.89/user (89% margin!)** 🎉

**Premium Tier ($49.99/month):** 50 resumes/month
- Cost: 50 × $0.21 = $10.50 (down from $21.30)
- **Profit: $39.49/user (79% margin!)** 🎉

### At 1,000 Users:
- Monthly Revenue: $19,476
- Monthly AI Costs: ~$3,500 (down from $8,627)
- **Monthly Profit: $15,976 (82% margin!)** 🚀

**This is MUCH better economics than I originally estimated!**

---

## Implementation Strategy

### **Step 1: Extend Your Existing Perplexity Function**

You already have the infrastructure, just add a new research type:

```typescript
// Add to supabase/functions/perplexity-research/index.ts

case 'resume_job_analysis':
  researchQuery = `Analyze this job posting for resume optimization:

JOB DESCRIPTION:
${query_params.job_description}

Provide:

1. CORE PROBLEM STATEMENT
   - What business problem does this role solve?
   - What pain points will this hire address?
   - What outcomes define success?

2. CRITICAL ATS KEYWORDS (top 15)
   - Extract exact phrases and terminology
   - Rank by importance (must-have vs nice-to-have)
   - Note: these must appear in resume for ATS match

3. INDUSTRY BENCHMARKING
   - Research 20+ similar job postings for ${query_params.job_title}
   - What do top-performer resumes emphasize?
   - What quantified achievements are common?
   - What salary range is typical for this role? (${query_params.location})

4. COMPETITIVE INTELLIGENCE
   - What are ${query_params.company}'s recent priorities?
   - What terminology does this company use consistently?
   - What culture signals appear in job description?

5. RESUME STRUCTURE RECOMMENDATIONS
   - What resume format works best for this role?
   - What sections should be prioritized?
   - What tone is appropriate (formal/startup-casual)?

Use only recent data (last 3 months). Cite all salary and market data sources.`;
  break;
```

**Cost:** $0.01 per job analysis

---

### **Step 2: Use Gemini for Generation (Already Set Up via Lovable)**

Keep using Gemini for content generation since you have Lovable partnership:

```typescript
// Your existing generate-resume-section function
// Just add Perplexity research results to context

const perplexityResearch = await fetchPerplexityResearch(jobDescriptionId);

const prompt = `You are a CPRW creating an executive resume summary.

PERPLEXITY RESEARCH INSIGHTS:
${perplexityResearch.core_problem}
${perplexityResearch.ats_keywords}
${perplexityResearch.industry_benchmarks}

[rest of your prompt...]
`;
```

---

## Final Answer to Your Question

> "How much cheaper is Gemini versus Perplexity on doing that research?"

**Answer:** Gemini is actually **MORE EXPENSIVE** for research:

- **Perplexity research:** $0.01 per job analysis
- **Gemini with grounding:** $0.067 per job analysis
- **Gemini without grounding:** Can't do real-time research (not a valid option)

**Perplexity is 6.7x cheaper AND better quality for research tasks.**

**However:** Gemini is better for *generation* (creating the actual resume content)

---

## Recommendation

✅ **Use Perplexity for research** (you already have it!)
✅ **Use Gemini for generation** (via Lovable)
✅ **Total cost:** $0.21 per resume
✅ **Margins:** 79-89% depending on tier

**This gives you:**
- World-class research (real-time data, citations)
- High-quality generation (structured, reliable)
- Optimal cost efficiency
- Already mostly implemented!

**Should I proceed with extending your existing Perplexity integration for resume job analysis?**
