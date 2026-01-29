
# Match Report Page - Complete Redesign

## Problems Identified

### 1. Edge Function Failures
The `rb-extract-jd-requirements` function is failing with JSON truncation errors ("Unterminated string in JSON"). The AI is returning responses that exceed output limits and get cut off.

### 2. Missing Keywords Display is Messy
Currently shows awkward long phrases as tiny badge pills:
- "acquisition, development and exploitation of onshore North American properties" 
- These get truncated and look unprofessional

### 3. Irrelevant Interview Card
The "Interview Practice" card is premature - users haven't even fixed their resume yet. This is confusing and clutters the page.

### 4. No Proper Keyword Table
The Quick Score has a professional `KeywordComparisonTable` with:
- Two columns (JD vs Resume)
- Priority groupings (Critical/High/Medium)
- Context quotes showing where keywords appear
- Check/X icons for match status

But the Match Report uses crude badge pills with no context.

### 5. Visual Hierarchy Issues
The page is a flat grid of 4 cards with equal weight. There's no clear priority or flow.

---

## Solution

### Fix 1: Improve Edge Function Reliability
Update `rb-extract-jd-requirements` to:
- Reduce the number of requirements extracted (limit to top 20)
- Shorten the context quotes to prevent truncation
- Add retry logic with fallback to simpler prompts

### Fix 2: Replace Badge Pills with Keyword Table
Import and use `KeywordComparisonTable` from Quick Score:
- Show keywords grouped by priority
- Display check/X for matched vs missing
- Show JD context where keywords appear
- Remove the ugly small badges

### Fix 3: Remove Interview Card
Remove the "Interview Practice" card - it's premature and confusing. Keep only:
- Score card
- Missing Keywords (as proper table)
- Seniority Alignment
- Requirement Coverage
- ATS Compatibility
- "Compare Resume & JD" action

### Fix 4: Improve Visual Layout
Restructure the page:
- Large score at top with clear status
- Full-width Keyword Table below
- Three metric cards in a row (Seniority, Requirements, ATS)
- Single action button to proceed

---

## Technical Changes

### File: `src/pages/resume-builder/ReportPage.tsx`

1. Import KeywordComparisonTable:
```typescript
import { KeywordComparisonTable, KeywordRowData } from '@/components/quick-score/KeywordComparisonTable';
```

2. Load full keyword data with decision info:
```typescript
const keywords: KeywordRowData[] = keywordsRes.data.map(k => ({
  keyword: k.keyword,
  priority: 'high' as const, // Can enhance with JD requirement weight
  isMatched: k.decision === 'ignore', // 'ignore' means already in resume
  jdContext: '', // Could be enhanced later
  resumeContext: k.decision === 'ignore' ? 'Found in resume' : undefined,
}));
```

3. Replace Missing Keywords card with full-width KeywordComparisonTable:
```typescript
{/* Full-width Keyword Analysis */}
<KeywordComparisonTable 
  keywords={keywordTableData}
  onAddKeyword={(kw) => navigate(`/resume-builder/${projectId}/fix`)}
/>
```

4. Remove Interview Practice card (lines 483-502)

5. Reorganize metric cards into single row:
```typescript
<div className="grid gap-4 md:grid-cols-3">
  {/* Seniority Alignment */}
  {/* Requirement Coverage */}
  {/* ATS Compatibility */}
</div>
```

### File: `supabase/functions/rb-extract-jd-requirements/index.ts`

1. Reduce `max_requirements` from 50 to 20
2. Add instruction to limit context quotes to 50 chars
3. Add retry with simplified prompt on JSON parse failure

---

## Summary of Changes

| File | Change |
|------|--------|
| `src/pages/resume-builder/ReportPage.tsx` | Replace badge pills with KeywordComparisonTable, remove Interview card, reorganize layout |
| `supabase/functions/rb-extract-jd-requirements/index.ts` | Reduce output size to prevent truncation |
| `src/components/quick-score/KeywordComparisonTable.tsx` | No changes - already well-designed |

---

## Result

After these changes:
- Keywords displayed in clean two-column table with priority groups
- No more messy badge pills with long phrases
- No confusing "Interview Practice" card
- Better visual hierarchy with score at top, table in middle, metrics at bottom
- Edge function more reliable with smaller outputs
