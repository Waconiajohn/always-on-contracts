# Edge Functions Documentation

Comprehensive documentation of all Supabase Edge Functions in this project, including their purpose, inputs, outputs, and frontend usage locations.

## Table of Contents

- [AI & Generation Functions](#ai--generation-functions)
- [Career Vault Functions](#career-vault-functions)
- [Resume & Job Matching Functions](#resume--job-matching-functions)
- [Payment & Subscription Functions](#payment--subscription-functions)
- [Research & Analysis Functions](#research--analysis-functions)
- [Utility Functions](#utility-functions)

---

## AI & Generation Functions

### `career-vault-chat`
**Purpose**: AI chatbot for career vault assistance using Lovable AI streaming

**Inputs**:
```typescript
{
  messages: Array<{ role: 'user' | 'assistant', content: string }>,
  vaultContext: string // Serialized career vault data
}
```

**Outputs**: Server-Sent Events (SSE) stream of AI responses

**Frontend Usage**:
- `src/components/career-vault/VaultAIAssistant.tsx` (line 74)

**Authentication**: Required (`verify_jwt = true`)

---

### `dual-ai-audit`
**Purpose**: Performs dual AI audit on generated content using two different AI models for quality assurance

**Inputs**:
```typescript
{
  content: string,
  contentType: 'resume' | 'linkedin' | 'interview' | 'post'
}
```

**Outputs**:
```typescript
{
  audit1: { score: number, feedback: string, strengths: string[], improvements: string[] },
  audit2: { score: number, feedback: string, strengths: string[], improvements: string[] },
  aggregatedScore: number,
  consensus: string
}
```

**Frontend Usage**: Called internally by other edge functions

**Authentication**: Required (`verify_jwt = true`)

---

### `recommend-persona`
**Purpose**: Recommends optimal persona based on job description and agent type

**Inputs**:
```typescript
{
  jobDescription: string,
  agentType: 'resume' | 'interview' | 'networking'
}
```

**Outputs**:
```typescript
{
  recommendedPersona: string,
  reasoning: string,
  confidence: number,
  personas: string[]
}
```

**Frontend Usage**:
- Used in persona selection flows

**Authentication**: Required (`verify_jwt = true`)

---

### `modernize-language`
**Purpose**: Updates career phrases with modern industry terminology and buzzwords

**Inputs**:
```typescript
{
  phrase: string,
  context?: string
}
```

**Outputs**:
```typescript
{
  suggestion: {
    original: string,
    modernized: string,
    addedKeywords: string[],
    reasoning: string
  }
}
```

**Frontend Usage**:
- `src/components/career-vault/ModernizeLanguageModal.tsx` (line 102)

**Authentication**: Required (`verify_jwt = true`)

---

## Career Vault Functions

### `auto-populate-vault-v3`
**Purpose**: Latest version of vault auto-population using AI to extract career data

**Inputs**:
```typescript
{
  vaultId: string,
  resumeText?: string,
  targetRoles?: string[],
  targetIndustries?: string[]
}
```

**Outputs**:
```typescript
{
  success: boolean,
  itemsCreated: number,
  categories: {
    powerPhrases: number,
    skills: number,
    competencies: number
  }
}
```

**Frontend Usage**:
- Career vault onboarding flows
- Resume upload processing

**Authentication**: Required (`verify_jwt = true`)

---

### `extract-vault-intangibles`
**Purpose**: Extracts soft skills, personality traits, and intangible qualities from responses

**Inputs**:
```typescript
{
  vaultId: string,
  responseText: string,
  questionText: string
}
```

**Outputs**:
```typescript
{
  extracted: {
    softSkills: Array<{ name: string, evidence: string }>,
    personalityTraits: Array<{ trait: string, context: string }>,
    workStyle: Array<{ area: string, description: string }>
  }
}
```

**Frontend Usage**:
- `src/components/ResponseReviewModal.tsx` (line 101)
- `src/components/career-vault/VoiceNoteRecorder.tsx` (line 194)

**Authentication**: Required (`verify_jwt = true`)

---

### `discover-hidden-competencies`
**Purpose**: AI-powered discovery of implicit competencies from career vault data

**Inputs**:
```typescript
{
  vaultId: string
}
```

**Outputs**:
```typescript
{
  competencies: Array<{
    competencyArea: string,
    inferredCapability: string,
    supportingEvidence: string[],
    confidenceScore: number
  }>,
  count: number
}
```

**Frontend Usage**:
- `src/pages/agents/CorporateAssistant.tsx` (line 469)

**Authentication**: Required (`verify_jwt = true`)

---

### `generate-power-phrases`
**Purpose**: Generates achievement-focused power phrases from vault data

**Inputs**:
```typescript
{
  vaultId: string
}
```

**Outputs**:
```typescript
{
  powerPhrases: Array<{
    phrase: string,
    category: string,
    impact: string
  }>,
  count: number
}
```

**Frontend Usage**:
- Vault intelligence building in `CorporateAssistant.tsx`

**Authentication**: Required (`verify_jwt = true`)

---

### `generate-transferable-skills`
**Purpose**: Identifies and generates transferable skills from career experiences

**Inputs**:
```typescript
{
  vaultId: string
}
```

**Outputs**:
```typescript
{
  skills: Array<{
    skill: string,
    evidence: string,
    transferability: string
  }>,
  count: number
}
```

**Frontend Usage**:
- Vault intelligence building in `CorporateAssistant.tsx`

**Authentication**: Required (`verify_jwt = true`)

---

### `process-review-actions`
**Purpose**: Batch processes user review actions (confirm/edit/reject) on vault items

**Inputs**:
```typescript
{
  vaultId: string,
  actions: Array<{
    itemId: string,
    itemType: string,
    action: 'confirm' | 'edit' | 'reject',
    updatedData?: Record<string, any>
  }>
}
```

**Outputs**:
```typescript
{
  success: boolean,
  processedCount: number,
  newVaultStrength: number,
  message: string
}
```

**Frontend Usage**:
- Review workflows for vault quality assurance

**Authentication**: Required (`verify_jwt = true`)

---

### `detect-role-and-industry`
**Purpose**: AI detection of target roles and industries from resume or vault data

**Inputs**:
```typescript
{
  resumeText?: string,
  vaultId?: string
}
```

**Outputs**:
```typescript
{
  targetRoles: string[],
  targetIndustries: string[],
  confidence: number
}
```

**Frontend Usage**:
- Onboarding flows
- Career direction analysis

**Authentication**: Required (`verify_jwt = true`)

---

### `vault-cleanup`
**Purpose**: Removes duplicate and low-quality items from vault

**Inputs**:
```typescript
{
  vaultId: string,
  aggressive?: boolean
}
```

**Outputs**:
```typescript
{
  itemsRemoved: number,
  duplicatesRemoved: number,
  lowQualityRemoved: number
}
```

**Frontend Usage**:
- `src/components/career-vault/VaultMigrationTool.tsx`

**Authentication**: Required (`verify_jwt = true`)

---

## Resume & Job Matching Functions

### `optimize-resume-with-audit`
**Purpose**: Multi-pass AI resume optimization with hiring manager review and dual audit

**Inputs**:
```typescript
{
  resumeText: string,
  jobDescription: string
}
```

**Outputs**:
```typescript
{
  success: boolean,
  optimizedResume: string,
  analysis: {
    skillsMatchScore: number,
    experienceMatchScore: number,
    achievementsScore: number,
    keywordDensityScore: number,
    formatScore: number,
    overallScore: number
  },
  improvements: string[],
  missingKeywords: string[],
  recommendations: string[]
}
```

**Frontend Usage**:
- `src/lib/services/resumeOptimizer.ts` (line 39)

**Authentication**: Required (`verify_jwt = true`)

---

### `score-resume-match`
**Purpose**: Scores resume match against job keywords with detailed category breakdown

**Inputs**:
```typescript
{
  keywords: string[],
  resumeContent: {
    executive_summary?: string,
    key_achievements?: string[],
    core_competencies?: string[]
  }
}
```

**Outputs**:
```typescript
{
  overallMatch: number,
  categoryScores: {
    technical: number,
    leadership: number,
    domain: number
  },
  strengths: string[],
  gaps: string[],
  recommendation: string
}
```

**Frontend Usage**:
- Resume analysis tools
- Job matching algorithms

**Authentication**: Required (`verify_jwt = true`)

---

### `parse-resume`
**Purpose**: Extracts text from resume files (TXT, PDF, DOCX)

**Inputs**:
```typescript
{
  fileData: string, // base64 encoded
  fileName: string,
  fileType: string
}
```

**Outputs**:
```typescript
{
  success: boolean,
  text: string,
  error?: string
}
```

**Frontend Usage**:
- Resume upload flows
- File parsing utilities

**Authentication**: Required (`verify_jwt = true`)

---

### `parse-resume-milestones`
**Purpose**: AI-powered extraction of employment and education milestones from resume text

**Inputs**:
```typescript
{
  resumeText: string,
  vaultId: string,
  targetRoles?: string[],
  targetIndustries?: string[]
}
```

**Outputs**:
```typescript
{
  success: boolean,
  milestones: Array<{
    type: 'employment' | 'education',
    title: string,
    organization: string,
    startDate: string,
    endDate?: string,
    description: string
  }>,
  summary: string
}
```

**Frontend Usage**:
- Resume parsing workflows
- Career timeline generation

**Authentication**: Required (`verify_jwt = true`)

---

### `parse-job-document`
**Purpose**: Parses job postings from URLs, text, or files to extract structured data

**Inputs**:
```typescript
{
  url?: string,
  text?: string,
  fileData?: string,
  fileName?: string
}
```

**Outputs**:
```typescript
{
  success: boolean,
  jobDescription: string,
  jobTitle?: string,
  companyName?: string
}
```

**Frontend Usage**:
- Job posting input forms
- Job analysis tools

**Authentication**: Required (`verify_jwt = true`)

---

## Payment & Subscription Functions

### `create-checkout`
**Purpose**: Creates Stripe checkout session for subscription payments

**Inputs**:
```typescript
{
  priceId: string,
  successUrl: string,
  cancelUrl: string
}
```

**Outputs**:
```typescript
{
  sessionId: string,
  url: string
}
```

**Frontend Usage**:
- Subscription upgrade flows
- Payment pages

**Authentication**: Required (`verify_jwt = true`)

---

### `customer-portal`
**Purpose**: Generates Stripe customer portal session for subscription management

**Inputs**:
```typescript
{
  returnUrl: string
}
```

**Outputs**:
```typescript
{
  url: string
}
```

**Frontend Usage**:
- Account settings
- Subscription management

**Authentication**: Required (`verify_jwt = true`)

---

### `check-subscription`
**Purpose**: Validates active subscription status

**Inputs**: None (uses authenticated user)

**Outputs**:
```typescript
{
  hasActiveSubscription: boolean,
  subscriptionTier?: string,
  expiresAt?: string
}
```

**Frontend Usage**:
- Feature gating
- Paywall checks

**Authentication**: Required (`verify_jwt = true`)

---

### `redeem-retirement-code`
**Purpose**: Redeems special retirement access codes, refunds active subscriptions, and assigns retirement role

**Inputs**:
```typescript
{
  code: string,
  deviceFingerprint: string
}
```

**Outputs**:
```typescript
{
  success: boolean,
  message: string
}
```

**Frontend Usage**:
- `src/pages/RedeemCode.tsx` (line 42)

**Authentication**: Required (`verify_jwt = true`)

---

## Research & Analysis Functions

### `conduct-industry-research`
**Purpose**: Performs comprehensive industry research for target role and industry

**Inputs**:
```typescript
{
  targetRole: string,
  targetIndustry: string
}
```

**Outputs**:
```typescript
{
  research: {
    skills: string[],
    metrics: string[],
    leadership: string[],
    trends: string[]
  }
}
```

**Frontend Usage**:
- `src/components/career-vault/AIResearchProgress.tsx` (line 81)

**Authentication**: Required (`verify_jwt = true`)

---

### `perplexity-research`
**Purpose**: General-purpose research using Perplexity AI for various career intelligence queries

**Inputs**:
```typescript
{
  research_type: 'market_intelligence' | 'company_research' | 'skills_demand' | 'career_path' | 'interview_prep' | 'resume_job_analysis',
  query_params: Record<string, any>
}
```

**Outputs**:
```typescript
{
  results: string,
  citations: Array<{ title: string, url: string }>,
  relatedQuestions: string[]
}
```

**Frontend Usage**:
- Research tools
- Job market analysis

**Authentication**: Required (`verify_jwt = true`)

---

### `research-industry-standards`
**Purpose**: Real-time research of industry standards using live job postings and market data

**Inputs**:
```typescript
{
  targetRole: string,
  targetIndustry: string,
  vaultId: string,
  careerDirection?: string
}
```

**Outputs**:
```typescript
{
  results: {
    requiredSkills: string[],
    preferredQualifications: string[],
    commonMetrics: string[],
    industryTrends: string[]
  },
  citations: Array<{ title: string, url: string }>
}
```

**Frontend Usage**:
- Industry standards analysis
- Gap analysis preparation

**Authentication**: Required (`verify_jwt = true`)

---

### `optimize-linkedin-profile`
**Purpose**: AI optimization of LinkedIn profile (headline, about, skills) using vault data

**Inputs**:
```typescript
{
  currentProfile: {
    headline?: string,
    about?: string,
    skills?: string[]
  },
  targetRole: string,
  targetIndustry: string
}
```

**Outputs**:
```typescript
{
  optimizedHeadline: string,
  optimizedAbout: string,
  prioritizedSkills: string[],
  reasoning: string
}
```

**Frontend Usage**:
- LinkedIn optimization tools

**Authentication**: Required (`verify_jwt = true`)

---

### `optimize-linkedin-with-audit`
**Purpose**: LinkedIn optimization with integrated dual AI audit

**Inputs**:
```typescript
{
  currentProfile: object,
  targetRole: string,
  targetIndustry: string
}
```

**Outputs**:
```typescript
{
  optimizedProfile: object,
  auditResults: object,
  overallScore: number
}
```

**Frontend Usage**:
- Advanced LinkedIn optimization flows

**Authentication**: Required (`verify_jwt = true`)

---

## Utility Functions

### `generate-completion-benchmark`
**Purpose**: Generates vault completion benchmarks and recommendations

**Inputs**:
```typescript
{
  vaultId: string,
  targetRoles: string[],
  targetIndustries: string[],
  forceRegenerate?: boolean
}
```

**Outputs**:
```typescript
{
  completionScore: number,
  benchmarks: object,
  recommendations: string[]
}
```

**Frontend Usage**:
- `src/components/career-vault/onboarding/VaultCompletionSummary.tsx` (line 82)

**Authentication**: Required (`verify_jwt = true`)

---

### `daily-job-matcher`
**Purpose**: Background job matching service (cron job)

**Inputs**: None (triggered by schedule)

**Outputs**: Background processing

**Frontend Usage**: Not directly called from frontend

**Authentication**: Not required (`verify_jwt = false`)

---

### `mcp-server`
**Purpose**: Model Context Protocol server for external integrations

**Inputs**: MCP protocol requests

**Outputs**: MCP protocol responses

**Frontend Usage**: Not directly called from frontend

**Authentication**: Not required (`verify_jwt = false`)

---

## Function Verification Status

Based on the codebase analysis, the following functions have been verified:

✅ **Active and Used**: 75+ functions actively called from frontend
⚠️ **Background Jobs**: 2 functions (daily-job-matcher, mcp-server)
🗑️ **Recently Cleaned**: 8 unused functions removed

## Usage Patterns

### Most Common Patterns

1. **Direct Invocation**:
```typescript
const { data, error } = await supabase.functions.invoke('function-name', {
  body: { param1, param2 }
});
```

2. **Streaming (SSE)**:
```typescript
const response = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/function-name`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ messages })
  }
);
```

3. **Service Abstraction**:
```typescript
// src/lib/services/resumeOptimizer.ts
export async function optimizeResume(resumeText: string, jobDescription: string) {
  const { data, error } = await supabase.functions.invoke('optimize-resume-with-audit', {
    body: { resumeText, jobDescription }
  });
  return data;
}
```

## Configuration Reference

All edge functions are configured in `supabase/config.toml`:

```toml
project_id = "ubcghjlfxkamyyefnbkf"

[functions.function-name]
verify_jwt = true  # or false for public functions
```

## Error Handling Best Practices

### Standard Error Response Format
```typescript
{
  error: string,
  details?: any
}
```

### Common HTTP Status Codes
- `200`: Success
- `400`: Bad request / validation error
- `401`: Unauthorized
- `402`: Payment required (rate limit / credits)
- `429`: Too many requests
- `500`: Internal server error

## Rate Limiting

Most functions implement rate limiting:
- Default: 10 requests per minute per user
- Burst: 100 requests per hour per user
- Edge functions automatically log AI usage for cost tracking

## Development Guidelines

1. **Always use via backend**: Never call external APIs directly from frontend
2. **Handle errors gracefully**: Surface 429 and 402 errors to users
3. **Add logging**: Use the logger utility for debugging
4. **Cost tracking**: Automatic via `logAIUsage()` utility
5. **Security**: Keep secrets in edge function environment, never expose to client

## Related Documentation

- [Edge Function Verification Report](./EDGE_FUNCTION_VERIFICATION_REPORT.md)
- [Deprecated Functions List](./DEPRECATED_FUNCTIONS.md)
- [Supabase Edge Functions Guide](https://supabase.com/docs/guides/functions)

---

**Last Updated**: 2025-01-XX  
**Maintained By**: Development Team  
**Version**: 1.0
