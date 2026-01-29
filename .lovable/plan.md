
# Production-Grade Fix: Complete the Resume Parsing Pipeline

## Problem Summary

Resumes entering the system have **raw text** but no **structured JSON**. This breaks the Fix page's "Compare" tab because `JDComparisonView` requires structured sections (summary, skills, experience, education).

**This affects ALL entry points:**
- Quick Score imports → saves `raw_text` only
- Regular file uploads → saves `raw_text` only (the `parse-resume` function never returns `parsed`)

## Root Cause

The `parse-resume` edge function extracts text from PDF/DOCX files but does NOT parse it into structured sections. It returns:
```json
{ "success": true, "text": "..." }
```

But `UploadPage.tsx` expects:
```json
{ "success": true, "text": "...", "parsed": { "summary": "...", "skills": [...], "experience": [...] } }
```

## Production-Grade Solution

**Enhance the existing `parse-resume` function** to include AI-powered structure parsing. This ensures ALL resumes entering the system get proper structured JSON.

### Changes to `supabase/functions/parse-resume/index.ts`

1. **Add AI parsing step** after text extraction
2. **Return structured `parsed` object** alongside raw text
3. **Use existing Lovable AI infrastructure**

```text
Before:
  File → Text Extraction → Return { text }

After:
  File → Text Extraction → AI Structure Parsing → Return { text, parsed, spanIndex }
```

### AI Parsing Logic

The function will call Lovable AI to extract:
- `header`: { fullName, headline, contactLine }
- `summary`: string
- `skills`: string[]
- `experience`: [{ title, company, dates, bullets }]
- `education`: [{ degree, school, year }]

### Example AI Prompt

```
Parse this resume into structured sections:

{resume_text}

Return JSON with:
- header: { fullName, headline, contactLine }
- summary: The professional summary paragraph
- skills: Array of skill strings
- experience: Array of { title, company, dates, bullets: string[] }
- education: Array of { degree, school, year }
```

---

## Secondary Changes

### 1. Quick Score Import (`ResumeBuilderIndex.tsx`)

After saving `raw_text`, trigger the structure parsing:

```typescript
// After inserting document with raw_text
if (state.resumeText) {
  await supabase
    .from("rb_documents")
    .insert({ project_id: project.id, raw_text: state.resumeText, doc_type: "resume" });

  // Trigger AI parsing in background
  supabase.functions.invoke('rb-parse-resume-structure', {
    body: { project_id: project.id }
  });
}
```

### 2. Processing Page (`ProcessingPage.tsx`)

Add a parsing check before the pipeline runs:

```typescript
// Check if parsed_json exists, if not trigger parsing first
const { data: doc } = await supabase
  .from('rb_documents')
  .select('parsed_json')
  .eq('project_id', projectId)
  .maybeSingle();

if (doc && !doc.parsed_json) {
  await supabase.functions.invoke('rb-parse-resume-structure', {
    body: { project_id: projectId }
  });
}
```

---

## New Edge Function: `rb-parse-resume-structure`

A focused function that:
1. Loads `raw_text` from `rb_documents`
2. Calls AI to parse into structured JSON
3. Updates `rb_documents.parsed_json`

This can be called:
- During Quick Score import
- During Processing if `parsed_json` is missing
- As a standalone repair operation

---

## Technical Summary

| Component | Change | Purpose |
|-----------|--------|---------|
| `supabase/functions/rb-parse-resume-structure/index.ts` | **New** | AI-powered parsing of raw text to structured JSON |
| `src/pages/resume-builder/ResumeBuilderIndex.tsx` | Update | Trigger parsing after Quick Score import |
| `src/pages/resume-builder/ProcessingPage.tsx` | Update | Ensure `parsed_json` exists before pipeline runs |

---

## Why This is Production-Grade

1. **Single source of truth** - One function handles all structure parsing
2. **Works for all entry points** - Quick Score, uploads, future integrations
3. **No UI fallbacks needed** - Data is correct at the source
4. **Idempotent** - Can safely re-run without duplicates
5. **Background processing** - Doesn't block user workflow

---

## Verification Checklist

After implementation:
- [ ] Quick Score import → `parsed_json` is populated
- [ ] Regular file upload → `parsed_json` is populated
- [ ] Fix page Compare tab → Shows structured resume sections
- [ ] 15-year experience check → Works with `experience` array
- [ ] Keyword highlighting → Works in all sections
