
# Fix Plan: Target Role Auto-Population from Job Description

## Problem Summary

When a user arrives at `/resume-builder/{projectId}/target` with a job description loaded, the role details should auto-populate. Currently this fails because of three mismatches between the frontend and backend:

| Issue | Frontend (TargetPage.tsx) | Backend (rb-classify-jd) |
|-------|--------------------------|-------------------------|
| Function name | `classify-job-description` | `rb-classify-jd` |
| Request body | `{ jdText }` | `{ jd_text }` |
| Response keys | `roleTitle`, `seniorityLevel` | `role_title`, `seniority_level` |

Additionally, the **seniority levels don't align**:
- UI dropdown: `Entry Level, Junior, Mid-Level, Senior, Lead, Principal, Manager, Director, VP, C-Level`
- Edge function returns: `IC, Senior IC, Manager, Senior Manager, Director, Senior Director, VP, SVP, C-Level`

---

## Fix Details

### File: `src/pages/resume-builder/TargetPage.tsx`

#### 1. Fix function name (line 124)
Change from:
```typescript
supabase.functions.invoke("classify-job-description", {
```
To:
```typescript
supabase.functions.invoke("rb-classify-jd", {
```

#### 2. Fix request body key (line 125)
Change from:
```typescript
body: { jdText },
```
To:
```typescript
body: { jd_text: jdText },
```

#### 3. Fix response mapping (lines 130-135)
Change from:
```typescript
setRoleTitle(data.roleTitle || "");
setSeniorityLevel(data.seniorityLevel || "");
setIndustry(data.industry || "");
setSubIndustry(data.subIndustry || "");
setConfidence(data.confidence || 0);
setReasoning(data.reasoning || null);
```
To:
```typescript
setRoleTitle(data.role_title || "");
setSeniorityLevel(mapSeniorityToUI(data.seniority_level) || "");
setIndustry(data.industry || "");
setSubIndustry(data.sub_industry || "");
setConfidence(data.confidence || 0);
setReasoning(data.justification ? 
  `Role: ${data.justification.role}\nLevel: ${data.justification.level}\nIndustry: ${data.justification.industry}` 
  : null);
```

#### 4. Add seniority level mapping helper
```typescript
// Map edge function seniority values to UI dropdown values
function mapSeniorityToUI(edgeLevel: string | null): string {
  if (!edgeLevel) return "";
  const mapping: Record<string, string> = {
    "IC": "Mid-Level",
    "Senior IC": "Senior",
    "Manager": "Manager",
    "Senior Manager": "Lead",
    "Director": "Director",
    "Senior Director": "Director",
    "VP": "VP",
    "SVP": "VP",
    "C-Level": "C-Level",
  };
  return mapping[edgeLevel] || edgeLevel;
}
```

#### 5. Fix database update keys (lines 142-147)
The update already uses snake_case which is correct, but needs to map seniority back:
```typescript
await supabase
  .from("rb_projects")
  .update({
    role_title: data.role_title,
    seniority_level: data.seniority_level, // Keep original for DB
    industry: data.industry,
    sub_industry: data.sub_industry,
    jd_confidence: data.confidence,
  })
  .eq("id", projectId);
```

---

## Verification

After these changes:
1. Navigate to a project with JD text loaded
2. The Target Role page should show "Analyzing job description..." spinner
3. Then auto-populate:
   - Role Title (e.g., "Technical Sales Consultant")
   - Seniority Level (mapped to UI-friendly value)
   - Industry
   - Sub-Industry
4. Confidence badge should appear (High/Medium/Low)
5. "Why we think this" should show the justification text
