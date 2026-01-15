# Master Resume 2.0 - API Documentation

## Overview

Master Resume 2.0 provides 13 edge functions for career intelligence extraction, analysis, search, and management.

**Base URL:** `https://<project-ref>.supabase.co/functions/v1/`
**Authentication:** Bearer token in `Authorization` header

---

## Table of Contents

1. [Onboarding Functions](#onboarding-functions)
2. [Gap Filling & Benchmarking](#gap-filling--benchmarking)
3. [Dashboard Functions](#dashboard-functions)
4. [Response Formats](#response-formats)
5. [Error Handling](#error-handling)

---

## Onboarding Functions

### 1. analyze-resume-initial

**Purpose:** Instant AI analysis of uploaded resume (<5 seconds)

**Endpoint:** `POST /analyze-resume-initial`

**Request:**
```json
{
  "resumeId": "uuid",
  "resumeText": "string (full resume text)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "detectedRole": "VP of Engineering",
    "detectedIndustry": "FinTech",
    "yearsExperience": 15,
    "seniorityLevel": "executive",
    "keyAchievements": ["Reduced costs by 40%", "Led 45 engineers"],
    "previousRoles": [
      { "title": "Director", "company": "Acme Corp", "years": 5 }
    ],
    "educationHighlights": ["MBA Stanford", "BS Computer Science"],
    "careerTrajectory": "rapid_advancement",
    "executiveSummary": "Seasoned technical executive..."
  },
  "meta": {
    "message": "Analysis complete in 4.2s",
    "uniqueValue": "Unlike basic parsers, we understand executive careers"
  }
}
```

---

### 2. suggest-career-paths

**Purpose:** AI-powered career path suggestions with match scores

**Endpoint:** `POST /suggest-career-paths`

**Request:**
```json
{
  "resumeId": "uuid",
  "currentRole": "VP Engineering",
  "currentIndustry": "FinTech",
  "targetIndustry": "FinTech",
  "careerDirection": "stay" | "pivot" | "explore",
  "analysisContext": {
    "yearsExperience": 15,
    "seniorityLevel": "executive"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestedRoles": [
      {
        "title": "Chief Technology Officer",
        "reasoning": "Natural progression from VP Engineering...",
        "matchScore": 0.92,
        "skillsAlignment": ["Technical leadership", "Strategic planning"],
        "skillsGap": ["Board-level communication"],
        "marketDemand": "high",
        "salaryPotential": "$250K-$400K"
      }
    ]
  },
  "meta": {
    "message": "Found 7 matching roles",
    "uniqueValue": "We analyze transferable skills with quantified match scores"
  }
}
```

---

### 3. research-industry-standards

**Purpose:** Real-time market intelligence via Perplexity AI

**Endpoint:** `POST /research-industry-standards`

**Request:**
```json
{
  "resumeId": "uuid",
  "targetRoles": ["CTO", "VP Engineering"],
  "targetIndustries": ["FinTech", "SaaS"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "results": {
      "CTO in FinTech": {
        "mustHaveSkills": ["Cloud architecture", "Security compliance"],
        "preferredSkills": ["AI/ML", "Blockchain"],
        "executiveCompetencies": ["Strategic planning", "Team building"],
        "seniorityExpectations": "15+ years",
        "salaryRange": "$250K-$450K",
        "citations": [
          { "title": "...", "url": "...", "snippet": "..." }
        ]
      }
    }
  },
  "meta": {
    "message": "Research complete for 2 role×industry combinations",
    "uniqueValue": "Live research vs 2-year-old templates"
  }
}
```

---

### 4. auto-populate-resume-v2

**Purpose:** Deep intelligence extraction across 10 categories (150-250 items)

**Endpoint:** `POST /auto-populate-vault-v2`

**Request:**
```json
{
  "resumeId": "uuid",
  "resumeText": "string (full resume)",
  "targetRoles": ["CTO"],
  "targetIndustries": ["FinTech"],
  "industryBenchmarks": { ... }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalExtracted": 237,
    "breakdown": {
      "power_phrases": 45,
      "transferable_skills": 38,
      "hidden_competencies": 22,
      "soft_skills": 28,
      "leadership_philosophy": 15,
      "executive_presence": 18,
      "personality_traits": 25,
      "work_style": 20,
      "values": 16,
      "behavioral_indicators": 10
    },
    "estimatedTime": "78s",
    "qualityDistribution": {
      "gold": 0,
      "silver": 89,
      "bronze": 103,
      "assumed": 45
    }
  },
  "meta": {
    "message": "Extraction complete: 237 insights discovered",
    "uniqueValue": "Extracting insights far beyond what's written"
  }
}
```

---

### 5. extract-resume-intangibles

**Purpose:** Extract executive intelligence layer (leadership brand, presence)

**Endpoint:** `POST /extract-resume-intangibles`

**Request:**
```json
{
  "resumeId": "uuid",
  "resumeText": "string",
  "powerPhrases": [],
  "transferableSkills": []
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalExtracted": 88,
    "breakdown": {
      "leadership_philosophy": 15,
      "executive_presence": 18,
      "personality_traits": 25,
      "work_style": 20,
      "values": 16,
      "behavioral_indicators": 10
    }
  },
  "meta": {
    "message": "Intangibles extraction complete",
    "uniqueValue": "Impossible for traditional resume scanners to capture"
  }
}
```

---

### 6. process-review-actions

**Purpose:** Batch processing of review actions (confirm/edit/reject)

**Endpoint:** `POST /process-review-actions`

**Request:**
```json
{
  "resumeId": "uuid",
  "actions": [
    {
      "itemId": "uuid",
      "tableName": "vault_power_phrases",
      "action": "confirm" | "reject" | "edit",
      "editedContent": { ... }
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "processed": 25,
    "confirmed": 20,
    "rejected": 3,
    "edited": 2,
    "newResumeStrength": 82
  },
  "meta": {
    "message": "Batch review complete",
    "timeSaved": "~5 minutes vs item-by-item"
  }
}
```

---

## Gap Filling & Benchmarking

### 7. generate-gap-filling-questions

**Purpose:** Generate 10-15 targeted questions to fill identified gaps

**Endpoint:** `POST /generate-gap-filling-questions`

**Request:**
```json
{
  "resumeId": "uuid",
  "currentResumeData": { ... },
  "industryBenchmarks": { ... }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "id": "uuid",
        "text": "Have you ever presented to a board of directors?",
        "type": "yes_no",
        "category": "executive_presence",
        "gapType": "board_communication",
        "impactScore": 8,
        "whyItMatters": "Critical for VP+ roles...",
        "options": null
      },
      {
        "id": "uuid",
        "text": "How many direct reports did you manage in your largest team?",
        "type": "number",
        "category": "leadership_philosophy",
        "gapType": "team_scale",
        "impactScore": 6,
        "whyItMatters": "Demonstrates leadership scale...",
        "options": null
      }
    ],
    "totalQuestions": 12,
    "estimatedTimeToComplete": "5-10 minutes"
  },
  "meta": {
    "message": "Generated 12 gap-filling questions",
    "uniqueValue": "Each question fills a specific gap vs generic forms"
  }
}
```

---

### 8. process-gap-filling-responses

**Purpose:** Convert user responses into gold-tier vault items

**Endpoint:** `POST /process-gap-filling-responses`

**Request:**
```json
{
  "resumeId": "uuid",
  "responses": [
    {
      "questionId": "uuid",
      "questionText": "Have you presented to boards?",
      "answer": "yes",
      "category": "executive_presence",
      "gapType": "board_communication"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "itemsCreated": 12,
    "resumeStrengthIncrease": 8,
    "newResumeStrength": 90
  },
  "meta": {
    "message": "Responses transformed into gold-tier intelligence",
    "uniqueValue": "User-provided = highest confidence"
  }
}
```

---

### 9. generate-completion-benchmark

**Purpose:** Competitive positioning analysis vs industry leaders

**Endpoint:** `POST /generate-completion-benchmark`

**Request:**
```json
{
  "resumeId": "uuid",
  "targetRoles": ["CTO"],
  "targetIndustries": ["FinTech"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "percentileRanking": {
      "percentile": 10,
      "ranking": "top 10%",
      "comparisonStatement": "You rank higher than 90% of professionals..."
    },
    "overallScore": {
      "resumeStrength": 92,
      "qualityScore": 88,
      "coverageScore": 95,
      "competitivenessRating": "Elite"
    },
    "strengths": [
      {
        "area": "Quantified Leadership Impact",
        "description": "45 power phrases with metrics vs industry avg of 25-30",
        "advantage": "Places you in top 15%",
        "examples": ["Reduced costs by 40%"]
      }
    ],
    "opportunities": [
      {
        "area": "Industry Certifications",
        "description": "Could add 2-3 certifications",
        "impact": "+5% credibility",
        "priority": "medium",
        "estimatedEffort": "1-2 weeks"
      }
    ],
    "gaps": [
      {
        "area": "Board-Level Communication",
        "description": "No evidence of board presentations",
        "impact": "Critical for VP+ roles",
        "priority": "high",
        "howToFill": "Add board presentation examples"
      }
    ],
    "recommendations": [
      {
      "title": "Add Board Communication Examples",
      "description": "Include 2-3 board presentations",
      "impact": "high",
      "estimatedBoost": "+5-8% resume strength",
      "timeToImplement": "10 minutes",
      "category": "executive_presence"
      }
    ]
  },
  "meta": {
    "message": "Competitive analysis complete: top 10%",
    "uniqueValue": "EXACTLY where you stand vs industry leaders"
  }
}
```

---

## Dashboard Functions

### 10. search-resume-advanced

**Purpose:** Full-text search across all 10 categories with relevance ranking

**Endpoint:** `POST /search-resume-advanced`

**Request:**
```json
{
  "resumeId": "uuid",
  "query": "leadership team building",
  "category": "leadership_philosophy" | null,
  "qualityTier": "gold" | null,
  "limit": 50
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "item_id": "uuid",
        "item_type": "leadership_philosophy",
        "content": "Led cross-functional team of 45 engineers...",
        "quality_tier": "gold",
        "confidence_score": 0.95,
        "effectiveness_score": 0.88,
        "match_rank": 0.92
      }
    ],
    "resultsByCategory": {
      "leadership_philosophy": [ ... ],
      "power_phrases": [ ... ]
    },
    "insights": {
      "totalResults": 45,
      "qualityBreakdown": { "gold": 12, "silver": 20, "bronze": 10, "assumed": 3 },
      "avgMatchRank": 0.82,
      "categoriesFound": ["leadership_philosophy", "power_phrases"]
    }
  },
  "meta": {
    "message": "Found 45 matching items across 2 categories",
    "uniqueValue": "AI-powered context-aware search",
    "searchTip": "High relevance scores—very closely matched!"
  }
}
```

---

### 11. bulk-resume-operations

**Purpose:** Mass update/delete/archive operations

**Endpoint:** `POST /bulk-resume-operations`

**Request:**
```json
{
  "resumeId": "uuid",
  "operations": [
    {
      "operation": "update_quality" | "delete" | "archive",
      "tableName": "vault_power_phrases",
      "itemIds": ["id1", "id2", "id3"],
      "newValues": { "quality_tier": "silver" }
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "operation": "update_quality",
        "table": "vault_power_phrases",
        "itemsProcessed": 3,
        "newQualityTier": "silver"
      }
    ],
    "totalProcessed": 3,
    "newResumeStrength": 87
  },
  "meta": {
    "message": "Successfully processed 3 items",
    "uniqueValue": "Bulk ops saved 1 minute vs manual updates",
    "timeSaved": "~1 minutes"
  }
}
```

---

### 12. export-resume

**Purpose:** Multi-format export (JSON/CSV/Text)

**Endpoint:** `POST /export-resume`

**Request:**
```json
{
  "resumeId": "uuid",
  "format": "json" | "csv" | "text",
  "categories": ["power_phrases", "transferable_skills"],
  "qualityTiers": ["gold", "silver"],
  "includeMetadata": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "content": "... (formatted export content) ...",
    "filename": "master-resume-12345678-1234567890.json",
    "contentType": "application/json",
    "totalItems": 45,
    "categories": ["power_phrases", "transferable_skills"]
  },
  "meta": {
    "message": "Exported 45 items across 2 categories",
    "uniqueValue": "JSON backup includes all metadata for migration",
    "dataOwnership": "Your data is YOURS. Export anytime, use anywhere."
  }
}
```

---

## Response Formats

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "message": "Human-readable success message",
    "uniqueValue": "Marketing differentiation message",
    "additionalKey": "Additional context"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Technical error message",
  "userMessage": "User-friendly error message"
}
```

---

## Error Handling

### Common HTTP Status Codes

- **200 OK** - Request successful
- **400 Bad Request** - Invalid parameters
- **401 Unauthorized** - Missing/invalid auth token
- **500 Internal Server Error** - Server-side error

### Error Types

#### Authentication Errors
```json
{
  "success": false,
  "error": "Missing authorization header",
  "userMessage": "Please log in to continue"
}
```

#### Validation Errors
```json
{
  "success": false,
  "error": "resumeId is required",
  "userMessage": "Invalid request. Please try again."
}
```

#### API Rate Limit Errors
```json
{
  "success": false,
  "error": "Perplexity API rate limit exceeded",
  "userMessage": "Too many requests. Please try again in 1 minute."
}
```

#### Timeout Errors
```json
{
  "success": false,
  "error": "Request timeout after 180s",
  "userMessage": "Processing took too long. Please try with a shorter resume."
}
```

---

## Rate Limits

### External API Limits
- **Perplexity AI:** 20 requests/minute
- **Google Gemini:** 60 requests/minute

### Retry Logic
All functions implement exponential backoff:
- Initial delay: 1s
- Max retries: 3
- Backoff multiplier: 2x

---

## Best Practices

### 1. Error Handling
Always check `success` field:
```typescript
const { data, error } = await supabase.functions.invoke('search-resume-advanced', {
  body: { resumeId, query }
});

if (!data.success) {
  console.error(data.error);
  toast.error(data.userMessage);
  return;
}

// Use data.data
console.log(data.data.results);
```

### 2. Progress Indicators
For long-running functions (auto-populate, research):
```typescript
setLoading(true);
toast.info('Processing... this may take 60-90 seconds');

const { data } = await supabase.functions.invoke('auto-populate-vault-v2', {
  body: { ... }
});

setLoading(false);
```

### 3. Batch Operations
Use bulk operations instead of loops:
```typescript
// ❌ Bad: Multiple individual calls
for (const itemId of itemIds) {
  await updateQualityTier(itemId, 'silver');
}

// ✅ Good: Single batch call
await supabase.functions.invoke('bulk-resume-operations', {
  body: {
    operations: [{
      operation: 'update_quality',
      itemIds: itemIds,
      newValues: { quality_tier: 'silver' }
    }]
  }
});
```

---

## Support

For API issues:
1. Check edge function logs in Supabase dashboard
2. Verify authentication token is valid
3. Ensure request body matches schema
4. Check API rate limits

**Last Updated:** January 15, 2026
