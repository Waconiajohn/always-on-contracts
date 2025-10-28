# Career Vault Completion Tracking

## Field Usage Rules

### ✅ Use `review_completion_percentage` for:
- **User-facing completion displays** (dashboards, progress bars, widgets)
- **Feature gating logic** (checking if vault is complete before unlocking features)
- **Journey state calculations** (determining where user is in their career journey)
- **Onboarding progress** (tracking user progress through vault setup)

### ❌ Do NOT use `interview_completion_percentage` for:
- Anything user-facing
- Feature gates or conditional logic
- Progress displays or UI indicators

### Legacy Field Explanation

`interview_completion_percentage` is a **LEGACY field** from when users manually answered interview questions about their career. The system has evolved:

**Old Flow (Manual Interview):**
1. User uploads resume
2. User answers 25+ interview questions manually
3. `interview_completion_percentage` tracked manual Q&A progress
4. AI extracted intelligence from interview responses

**Current Flow (AI Auto-Population + Review):**
1. User uploads resume
2. AI auto-populates vault with intelligence (sets `auto_populated = true`)
3. User reviews/edits/approves AI-extracted items
4. `review_completion_percentage` tracks user review progress (0-100%)
5. User completes review (sets `reviewed = true`, `review_completion_percentage = 100`)

The `interview_completion_percentage` field is now only used internally to track AI extraction progress and should **never** be displayed to users or used for feature gating.

## Current Architecture Flow

```
User Action                    Database Updates                           User Sees
───────────────────────────────────────────────────────────────────────────────────────
1. Upload Resume              resume_raw_text populated                  "Upload Complete"
                              auto_populated = false
                              review_completion_percentage = 0

2. AI Extraction Runs         interview_completion_percentage = 100      "Analyzing..."
                              extraction_item_count updated              (internal only)
                              auto_populated = true

3. User Reviews Items         review_completion_percentage += X%         "Review: X% Complete"
   (Approve/Reject/Edit)      reviewed = false

4. User Completes Review      review_completion_percentage = 100         "Vault Complete! 🎉"
                              reviewed = true
```

## Code Pattern Examples

### ✅ CORRECT - User-Facing Completion Display

```typescript
// Dashboard, progress bars, feature gates
const { data: vault } = await supabase
  .from('career_vault')
  .select('review_completion_percentage')
  .eq('user_id', user.id)
  .single();

const isVaultComplete = (vault?.review_completion_percentage || 0) === 100;
```

### ✅ CORRECT - Feature Gating

```typescript
// Gate access to job search until vault review is complete
const { data: vault } = await supabase
  .from('career_vault')
  .select('review_completion_percentage')
  .eq('user_id', user.id)
  .single();

if ((vault?.review_completion_percentage || 0) < 100) {
  return {
    blocked: true,
    message: "Complete your Career Vault review to unlock Job Search"
  };
}
```

### ❌ WRONG - Using Legacy Field

```typescript
// DON'T DO THIS - interview_completion_percentage is internal only
const { data: vault } = await supabase
  .from('career_vault')
  .select('interview_completion_percentage')  // ❌ Wrong field!
  .eq('user_id', user.id)
  .single();

const progress = vault?.interview_completion_percentage || 0;  // ❌ Wrong!
```

## Database Fields Reference

| Field | Type | Purpose | Updated By | User-Facing? |
|-------|------|---------|------------|--------------|
| `review_completion_percentage` | number (0-100) | **PRIMARY** - Tracks user review of AI-extracted items | `VaultReviewInterface.tsx` during user review | ✅ YES |
| `interview_completion_percentage` | number (0-100) | **LEGACY** - Tracks AI extraction progress (deprecated for user display) | Edge function during AI auto-populate | ❌ NO |
| `auto_populated` | boolean | Indicates vault was populated by AI vs manual entry | Edge function `auto-populate-vault` | For logic only |
| `reviewed` | boolean | User completed reviewing all items | `VaultReviewInterface.tsx` on completion | For logic only |
| `extraction_item_count` | number | Total items AI extracted (can be stale) | Edge functions during extraction | For admin only |

## Testing Checklist

When making changes to vault completion logic, verify:

- [ ] Control Panel displays `review_completion_percentage`
- [ ] All progress bars show `review_completion_percentage`
- [ ] Feature gates check `review_completion_percentage`
- [ ] Journey state uses `review_completion_percentage`
- [ ] Onboarding tracks `review_completion_percentage`
- [ ] No user-facing UI references `interview_completion_percentage`
- [ ] Clear vault resets both `interview_completion_percentage` and `review_completion_percentage` to 0

## Migration Notes

**Why both fields exist:**
- `interview_completion_percentage`: Legacy field from manual interview flow (still used internally by AI extraction process)
- `review_completion_percentage`: Current field for user review progress (the source of truth for user-facing features)

**Future plans:**
- Phase out `interview_completion_percentage` completely
- Rename AI extraction progress tracking to a more explicit internal field
- Single source of truth: `review_completion_percentage`

**For now:**
- Keep both fields for backward compatibility
- Always use `review_completion_percentage` for user-facing features
- Never display `interview_completion_percentage` to users

## Common Pitfalls to Avoid

1. **❌ Using the wrong field for UI display**
   ```typescript
   // WRONG
   <Progress value={stats.interview_completion_percentage} />
   
   // CORRECT
   <Progress value={stats.review_completion_percentage} />
   ```

2. **❌ Feature gating on legacy field**
   ```typescript
   // WRONG
   if (vault.interview_completion_percentage < 100) { /* lock feature */ }
   
   // CORRECT
   if (vault.review_completion_percentage < 100) { /* lock feature */ }
   ```

3. **❌ Checking wrong field for completion status**
   ```typescript
   // WRONG
   const isComplete = vault.interview_completion_percentage === 100;
   
   // CORRECT
   const isComplete = vault.review_completion_percentage === 100;
   ```

## Questions?

If you're unsure which field to use:
- **User will see it?** → Use `review_completion_percentage`
- **Controls feature access?** → Use `review_completion_percentage`
- **Shows progress?** → Use `review_completion_percentage`
- **Internal AI tracking?** → Use `interview_completion_percentage` (but document why)

When in doubt, **use `review_completion_percentage`** for all new features.
