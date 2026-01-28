

# Plan: Redesign Quick Score Keyword & Key Phrase Display

## What's Wrong Right Now

After reviewing the code, I can see the following critical UI/UX failures:

### 1. **Keywords are "piled together" instead of organized in columns**
The current `OrganizedKeywordPanel` uses:
- Collapsible sections with Badge components wrapped in `flex flex-wrap gap-1.5`
- All keywords are dumped into the same visual space
- No visual distinction between "JD mentions this" vs "Your resume has this"

### 2. **Ugly shaded buttons/badges**
Current styling uses:
```css
bg-primary/5 border-primary/20 text-primary  // Matched keywords
bg-destructive/5 border-destructive/20 text-destructive  // Missing critical
bg-muted/50  // Missing lower priority
```
This creates the "shaded pill" look that clutters the interface.

### 3. **No side-by-side comparison**
The prompts specify:
> "For MATCHED keywords: include exact quotes from BOTH the JD and resume showing context"

But the UI doesn't show this visually - it's hidden behind click interactions (popovers).

### 4. **Not following "Apple-simple" design rules**
Per the memory entries about design:
- Should use subtle borders and professional text labels
- Should avoid "card spam" and heavy visual weight
- High-contrast typography, minimal decoration

---

## The Correct Design (What We Will Build)

### New Component: `KeywordComparisonTable`

A **two-column table layout** that shows:

```text
┌──────────────────────────────────────────────────────────────┐
│  KEYWORD ANALYSIS                          12/24 matched (50%) │
├────────────────────────────┬─────────────────────────────────┤
│  JOB DESCRIPTION           │  YOUR RESUME                    │
├────────────────────────────┼─────────────────────────────────┤
│  ✓ Python                  │  ✓ "Developed Python scripts..." │
│  ✓ Machine Learning        │  ✓ "ML pipeline for..."         │
│  ✗ Kubernetes              │  — not found                    │
│  ✗ AWS                     │  — not found                    │
│  ✓ Data Engineering        │  ✓ "Data engineering lead..."   │
└────────────────────────────┴─────────────────────────────────┘
```

**Key Design Principles:**
1. **Two distinct columns** - Left = what JD wants, Right = what resume shows
2. **Clean rows, not pills** - Each keyword gets its own row with clear status
3. **Visual check/X indicators** - Simple ✓ and ✗ instead of shaded badges
4. **Context quotes inline** - Show the evidence directly, not hidden in popovers
5. **Grouped by priority** - Critical → High → Medium sections
6. **Subtle dividers** - Use borders, not background colors

---

## Implementation Details

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/components/quick-score/KeywordComparisonTable.tsx` | **CREATE** | New two-column table component |
| `src/components/quick-score/OrganizedKeywordPanel.tsx` | **DELETE/DEPRECATE** | Remove old cluttered design |
| `src/components/quick-score/KeywordAnalysisPanel.tsx` | **DELETE/DEPRECATE** | Remove old design |
| `src/pages/QuickScore.tsx` | **MODIFY** | Use new KeywordComparisonTable |

### New Component Structure

```tsx
// KeywordComparisonTable.tsx

interface KeywordRow {
  keyword: string;
  priority: 'critical' | 'high' | 'medium';
  category: 'required' | 'preferred' | 'nice-to-have';
  isMatched: boolean;
  jdContext?: string;      // Quote from JD
  resumeContext?: string;  // Quote from resume (if matched)
  suggestedPhrasing?: string; // If missing
}

export function KeywordComparisonTable({
  keywords,
  onAddKeyword
}: {
  keywords: KeywordRow[];
  onAddKeyword?: (keyword: KeywordRow) => void;
}) {
  // Group by matched/missing, then by priority
  const matched = keywords.filter(k => k.isMatched);
  const missing = keywords.filter(k => !k.isMatched);
  
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Keyword Analysis</h3>
          <span className="text-sm text-muted-foreground">
            {matched.length}/{keywords.length} matched
          </span>
        </div>
      </div>
      
      {/* Two-column header */}
      <div className="grid grid-cols-2 border-b border-border text-xs font-medium text-muted-foreground">
        <div className="p-3 border-r border-border">JOB DESCRIPTION</div>
        <div className="p-3">YOUR RESUME</div>
      </div>
      
      {/* Keyword rows */}
      <div className="divide-y divide-border">
        {keywords.map((kw, i) => (
          <KeywordRow key={i} keyword={kw} onAdd={onAddKeyword} />
        ))}
      </div>
    </div>
  );
}

function KeywordRow({ keyword, onAdd }) {
  return (
    <div className={cn(
      "grid grid-cols-2 text-sm",
      !keyword.isMatched && keyword.priority === 'critical' && "bg-destructive/5"
    )}>
      {/* Left: JD Column */}
      <div className="p-3 border-r border-border">
        <div className="flex items-center gap-2">
          {keyword.isMatched ? (
            <Check className="h-4 w-4 text-primary flex-shrink-0" />
          ) : (
            <X className="h-4 w-4 text-destructive flex-shrink-0" />
          )}
          <span className="font-medium">{keyword.keyword}</span>
          {keyword.priority === 'critical' && (
            <span className="text-[10px] text-destructive">REQUIRED</span>
          )}
        </div>
        {keyword.jdContext && (
          <p className="mt-1 text-xs text-muted-foreground italic pl-6">
            "{keyword.jdContext}"
          </p>
        )}
      </div>
      
      {/* Right: Resume Column */}
      <div className="p-3">
        {keyword.isMatched ? (
          <div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-primary">Found</span>
            </div>
            {keyword.resumeContext && (
              <p className="mt-1 text-xs text-muted-foreground italic pl-6">
                "{keyword.resumeContext}"
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Not found</span>
            {onAdd && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 text-xs"
                onClick={() => onAdd(keyword)}
              >
                + Add
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

### Visual Changes Summary

| Before | After |
|--------|-------|
| Shaded badge pills | Clean text rows with check/X icons |
| `flex flex-wrap` chaos | Two-column table layout |
| Hidden context (click to expand) | Context quotes visible inline |
| Multiple collapsible sections | Single scrollable table |
| Heavy visual weight | Subtle borders, white background |
| No clear JD vs Resume distinction | Clear left/right columns |

---

## Integration Changes to QuickScore.tsx

Replace:
```tsx
<OrganizedKeywordPanel
  matchedKeywords={matchedKeywordsForUi}
  missingKeywords={missingKeywordsForUi}
  onAddToResume={handleAddKeywordToResume}
/>
```

With:
```tsx
<KeywordComparisonTable
  keywords={allKeywordsNormalized}
  onAddKeyword={handleAddKeywordToResume}
/>
```

Where `allKeywordsNormalized` combines matched and missing into a single array with proper structure.

---

## Component Cleanup

The following components will be **deprecated/removed** as they use the old "piled together" design:
- `OrganizedKeywordPanel.tsx` - Delete
- `KeywordAnalysisPanel.tsx` - Delete  
- `KeywordContextPopover.tsx` - Keep for potential mobile use, but not primary

---

## Priority Grouping (Optional Enhancement)

If the table gets long, we can add section headers:

```text
┌─ CRITICAL (Required Skills) ───────────────────────────────────┐
│  Python                        │  ✓ Found: "Python scripts..." │
│  Kubernetes                    │  ✗ Not found                  │
├─ HIGH PRIORITY ────────────────────────────────────────────────┤
│  Docker                        │  ✓ Found: "Docker containers" │
│  CI/CD                         │  ✗ Not found                  │
├─ RECOMMENDED ──────────────────────────────────────────────────┤
│  Terraform                     │  ✗ Not found                  │
└────────────────────────────────────────────────────────────────┘
```

---

## Technical Notes

1. **Data source remains the same** - The `instant-resume-score` edge function already returns `jdContext` and `resumeContext` for each keyword

2. **No backend changes needed** - This is purely a UI refactor

3. **Responsive behavior** - On mobile, stack the columns vertically instead of side-by-side

4. **Accessibility** - Use semantic table elements with proper headers

---

## Verification Checklist

After implementation:
- [ ] Keywords appear in two distinct columns (JD vs Resume)
- [ ] Matched keywords show ✓ with context quotes from both sources
- [ ] Missing keywords show ✗ with "+ Add" action
- [ ] Critical/Required keywords are visually distinguished (not with ugly shading)
- [ ] No more "piled together" badge clusters
- [ ] Follows Apple-simple aesthetic (subtle borders, clean typography)
- [ ] Context is visible inline, not hidden behind clicks

