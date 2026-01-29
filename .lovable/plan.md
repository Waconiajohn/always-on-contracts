

# Resume Builder Studio - Critical Data Flow Fixes

## Executive Summary

The Resume Builder Studio has significant data flow issues causing:
1. **Empty left panel** - Shows "No evidence extracted yet" instead of original content or evidence
2. **Entire resume shown in right panel** - Shows full resume text for every section instead of section-specific content
3. **No evidence extraction running** - Processing pipeline calls non-existent edge functions

---

## Root Cause Analysis

### Issue 1: Processing Pipeline Calls Wrong Edge Functions

**Location**: `src/pages/resume-builder/ProcessingPage.tsx` (lines 131-167)

The Processing page calls edge functions that **do not exist**:

| Called Function | Should Be |
|-----------------|-----------|
| `extract-jd-requirements` | `rb-extract-jd-requirements` |
| `generate-role-benchmark` | `rb-generate-benchmark` |
| `extract-resume-claims` | `rb-extract-resume-claims` |

This means when users go through the processing step, no evidence gets extracted into `rb_evidence` table, which is why it's empty.

---

### Issue 2: Section Content Falls Back to Full Resume

**Location**: `src/hooks/useRewriteSection.ts` (lines 272-284)

```typescript
// Current behavior: Falls back to ENTIRE raw_text
const { data: doc } = await supabase
  .from('rb_documents')
  .select('raw_text')
  .eq('project_id', projectId)
  .maybeSingle();

const rawText = doc?.raw_text || '';
setContent(rawText);  // <-- Sets ENTIRE resume as content
```

The hook does not extract section-specific content. It should:
1. First check for section-specific version in `rb_versions`
2. If not found, parse `parsed_json` from `rb_documents` to extract only the relevant section

---

### Issue 3: Left Panel Shows EvidenceSidebar, Not Original Section

**Location**: `src/pages/resume-builder/studio/ExperiencePage.tsx` (line 43)

```typescript
<StudioLayout
  leftPanel={<EvidenceSidebar evidence={evidence} />}  // <-- Only shows evidence
```

The `SummaryPage.tsx` does it better with `OriginalContentPanel`, but still doesn't extract section-specific content. The left panel should show:
1. **Original section content** (extracted from resume for this specific section)
2. **Verified evidence** relevant to this section

---

### Issue 4: Evidence Not Filtered by Section

**Location**: `src/hooks/useStudioPageData.ts` (lines 43-52)

```typescript
const loadEvidence = useCallback(async () => {
  const { data } = await supabase
    .from('rb_evidence')
    .select('*')
    .eq('project_id', projectId)
    .eq('is_active', true)  // <-- No section filter!
```

Evidence is loaded for the entire project, not filtered by the current section (summary, skills, experience, education). The evidence table has `span_location` with section info that should be used.

---

## Technical Solution

### Fix 1: Update ProcessingPage to Call Correct Edge Functions

**File**: `src/pages/resume-builder/ProcessingPage.tsx`

```typescript
// Stage 1: Change from "extract-jd-requirements" to:
const { error: jdError } = await supabase.functions.invoke(
  "rb-extract-jd-requirements",
  { body: { project_id: projectId, jd_text: jdText } }
);

// Stage 2: Change from "generate-role-benchmark" to:
const { error: benchError } = await supabase.functions.invoke(
  "rb-generate-benchmark",
  { body: { project_id: projectId, role_title, seniority_level, industry } }
);

// Stage 3: Change from "extract-resume-claims" to:
const { error: claimsError } = await supabase.functions.invoke(
  "rb-extract-resume-claims",
  { body: { project_id: projectId } }
);
```

---

### Fix 2: Add Section Content Extraction Logic

**File**: `src/hooks/useRewriteSection.ts` - Update `useSectionContent`

Create a new utility to extract section-specific content from parsed resume:

```typescript
function extractSectionContent(parsedJson: ParsedResume | null, sectionName: string): string {
  if (!parsedJson) return '';
  
  switch (sectionName) {
    case 'summary':
      return parsedJson.summary || '';
    case 'skills':
      // Extract skills as bullet list
      return (parsedJson.skills || []).map(s => `• ${s}`).join('\n');
    case 'experience':
      // Extract work experience bullets
      return (parsedJson.experience || []).map(exp => {
        const header = `${exp.title} at ${exp.company} (${exp.dates})`;
        const bullets = (exp.bullets || []).map(b => `• ${b}`).join('\n');
        return `${header}\n${bullets}`;
      }).join('\n\n');
    case 'education':
      return (parsedJson.education || []).map(edu => 
        `${edu.degree} - ${edu.institution} (${edu.year})`
      ).join('\n');
    default:
      return '';
  }
}
```

Then update `loadContent`:

```typescript
const loadContent = useCallback(async () => {
  // First try active version (existing code)
  const { data: version } = await supabase
    .from('rb_versions')
    .select('content')
    .eq('project_id', projectId)
    .eq('section_name', sectionName)
    .eq('is_active', true)
    .maybeSingle();

  if (version?.content) {
    setContent(version.content);
    return;
  }

  // Fall back to extracting from parsed_json
  const { data: doc } = await supabase
    .from('rb_documents')
    .select('raw_text, parsed_json')
    .eq('project_id', projectId)
    .maybeSingle();

  const parsedJson = doc?.parsed_json as ParsedResume | null;
  const sectionContent = extractSectionContent(parsedJson, sectionName);
  
  if (sectionContent) {
    setContent(sectionContent);
    setOriginalContent(sectionContent);
  } else {
    // Ultimate fallback - shouldn't happen with proper parsing
    console.warn('No parsed section found, using raw text excerpt');
    setContent(doc?.raw_text || '');
    setOriginalContent(doc?.raw_text || '');
  }
}, [projectId, sectionName]);
```

---

### Fix 3: Create Combined Left Panel Component

**New File**: `src/components/resume-builder/OriginalAndEvidencePanel.tsx`

```typescript
interface OriginalAndEvidencePanelProps {
  originalContent: string;
  evidence: RBEvidence[];
  sectionName: string;
}

export function OriginalAndEvidencePanel({ 
  originalContent, 
  evidence, 
  sectionName 
}: OriginalAndEvidencePanelProps) {
  return (
    <div className="space-y-6">
      {/* Original Section Content */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Original {sectionName}
        </h3>
        {originalContent ? (
          <div className="text-sm whitespace-pre-wrap bg-muted/50 rounded p-3 max-h-[200px] overflow-y-auto">
            {originalContent}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            No original content found for this section
          </p>
        )}
      </div>

      {/* Evidence for this section */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" />
          Verified Evidence
        </h3>
        <EvidenceSidebar evidence={evidence} maxItems={5} readOnly />
      </div>
    </div>
  );
}
```

---

### Fix 4: Filter Evidence by Section

**File**: `src/hooks/useStudioPageData.ts`

Update `loadEvidence` to filter by section:

```typescript
const loadEvidence = useCallback(async () => {
  if (!projectId) return;
  
  // Map section name to evidence categories
  const sectionCategories = {
    summary: ['skill', 'domain', 'leadership'],
    skills: ['skill', 'tool', 'domain'],
    experience: ['responsibility', 'metric', 'leadership'],
    education: ['domain', 'skill'],
  };
  
  const relevantCategories = sectionCategories[sectionName as keyof typeof sectionCategories] || [];
  
  const { data } = await supabase
    .from('rb_evidence')
    .select('*')
    .eq('project_id', projectId)
    .eq('is_active', true)
    .in('category', relevantCategories)  // Filter by relevant categories
    .order('confidence', { ascending: false });
  
  setEvidence((data as RBEvidence[]) || []);
}, [projectId, sectionName]);
```

---

### Fix 5: Update Studio Pages to Use New Panel

**Files**: All studio pages (ExperiencePage, SkillsPage, EducationPage)

```typescript
// Change from:
leftPanel={<EvidenceSidebar evidence={evidence} />}

// To:
leftPanel={
  <OriginalAndEvidencePanel
    originalContent={originalSectionContent}
    evidence={evidence}
    sectionName={SECTION_NAME}
  />
}
```

Add `originalSectionContent` to `useStudioPageData` return values.

---

## Summary of Changes

| File | Change Type | Description |
|------|-------------|-------------|
| `src/pages/resume-builder/ProcessingPage.tsx` | Fix | Correct edge function names (3 changes) |
| `src/hooks/useRewriteSection.ts` | Enhance | Add section content extraction from `parsed_json` |
| `src/hooks/useStudioPageData.ts` | Enhance | Filter evidence by section, expose original content |
| `src/components/resume-builder/OriginalAndEvidencePanel.tsx` | New | Combined panel showing original + evidence |
| `src/pages/resume-builder/studio/ExperiencePage.tsx` | Update | Use new combined panel |
| `src/pages/resume-builder/studio/SkillsPage.tsx` | Update | Use new combined panel |
| `src/pages/resume-builder/studio/EducationPage.tsx` | Update | Use new combined panel |

---

## Verification Checklist

After implementation:
- [ ] Processing pipeline calls `rb-*` edge functions correctly
- [ ] `rb_evidence` table populates after processing
- [ ] Each studio page shows only section-specific content (not full resume)
- [ ] Left panel shows original section content
- [ ] Left panel shows evidence filtered to relevant categories
- [ ] Editing experience doesn't show skills content and vice versa

