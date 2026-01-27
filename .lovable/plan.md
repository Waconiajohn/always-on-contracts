
## What’s actually going on (why it “crashes” + why my prior audit was wrong)

You’re right to question it. The current problems are not “small wiring issues”—they’re **schema/contract mismatches** between the Resume Builder UI and the backend database rules. That mismatch makes inserts/updates fail, which then cascades into the “Import failed” toast and leaves you on a confusing “Projects” screen with duplicate CTAs.

### Root cause #1 — `rb_projects.status` DB constraint does NOT match the app’s workflow states
**Database currently allows only:**
- `draft`, `processing`, `ready`, `completed`, `archived`  
(confirmed by DB check constraint `rb_projects_status_check`)

**But the Resume Builder UI writes and expects:**
- `upload`, `jd`, `target`, `processing`, `report`, `fix`, `studio`, `review`, `export`, `complete`  
(confirmed in `UploadPage.tsx`, `JDPage.tsx`, `ProcessingPage.tsx`, and `ResumeBuilderIndex.tsx`)

So:
- Clicking **New Project** (which inserts `{ status: "upload" }`) will violate the DB constraint.
- Progressing through the builder (e.g. setting status `"jd"` or `"report"`) will also violate the DB constraint.

This alone can cause:
- “Project creation failed”
- empty project list
- duplicated “New Project / Create First Project” state looking broken
- unexpected behavior after Quick Score import

### Root cause #2 — `rb_projects.seniority_level` constraint rejects Quick Score’s detected level
**Database allows only these values:**
- `IC`, `Senior IC`, `Manager`, `Senior Manager`, `Director`, `Senior Director`, `VP`, `SVP`, `C-Level`

But Quick Score passes `detected.level` as something like:
- `entry | mid | senior | executive | c-level` (or similar)

And the import code currently does:
```ts
seniority_level: state.scoreResult?.detected?.level || null
```
That is exactly the error you’re seeing:
> violates check constraint "rb_projects_seniority_level_check"

### Root cause #3 — Duplicate buttons are real (and illogical)
`ResumeBuilderIndex.tsx` renders:
- Header button: **New Project**
- Empty-state button: **Create First Project**

They do the same thing (call `createNewProject()`), so your complaint is accurate even if everything else worked.

### Where my prior “audit” was wrong
I previously claimed “everything is aligned.” It’s not. The biggest gap is that **the database schema constraints were not aligned with the product’s step-by-step builder states**, meaning the workflow cannot be reliable regardless of how good prompts/UI are.

---

## What we will do now (start-from-scratch reassessment, but with concrete fixes)

We’ll fix the system by enforcing a single “contract” across:
1) database constraints  
2) builder routing/status machine  
3) Quick Score → Builder import mapping  
4) UI wording and duplicate CTAs  

This is the minimum required to restore trust and stability.

---

## Implementation Plan (what I will change once you switch me back to default mode)

### Phase A — Fix the backend contract (so inserts/updates stop failing)
**A1. Update `rb_projects_status_check`**
- Change the DB check constraint to allow the actual workflow statuses used by the builder:
  - `upload`, `jd`, `target`, `processing`, `report`, `fix`, `studio`, `review`, `export`, `complete`
- Optionally keep: `draft`, `ready`, `completed`, `archived` if you want backwards compatibility, but we should pick one canonical set to avoid drift.

**Why this matters:** it removes a fundamental blocker that currently makes the builder impossible to use end-to-end.

**A2. Add/confirm a canonical “status list”**
- We’ll define a single source of truth in code (a const array) matching the DB constraint values to prevent drift.

### Phase B — Fix Quick Score → Builder import so it never violates constraints
**B1. Map detected seniority to allowed DB values**
Add a deterministic mapper like:
- `entry` → `IC`
- `mid` → `IC`
- `senior` → `Senior IC`
- `manager` → `Manager`
- `executive` → `Director` (or `VP` depending on your preference)
- `c-level` / `c_level` → `C-Level`

If the value can’t be mapped safely:
- set `seniority_level = null` and let the Target step collect/confirm it later.

**B2. Improve import error visibility**
When import fails, show the *actual* reason in the toast (sanitized), e.g.:
- “Import failed: invalid seniority level (mid).”

That way you’re not stuck with vague “Could not import” messages.

### Phase C — Fix the duplicate/illogical buttons (and make the screen coherent)
**C1. Remove the “two buttons” problem**
On the Projects screen:
- If there are no projects: show *one* primary CTA.
- If there are projects: show *one* “New project” CTA in the header.

**C2. Rename to Apple-simple, unambiguous labels**
Recommended:
- Header: “New resume project”
- Empty state: “Start a resume project”

Or even simpler:
- Just one button everywhere: “Start” (with subtitle explaining what it does)

### Phase D — Re-audit against your “20 prompts” + all AI prompts (so we don’t repeat this)
This is not about rewriting prompts; it’s about verifying every prompt is:
- **used somewhere** (or intentionally not used)
- **wired to the correct UI surface**
- **returning data that is rendered, not ignored**
- **not blocked by DB contract issues** (like the ones above)

Deliverable: a table that for each of your prompts answers:
- Where it is invoked (function/file)
- What data it produces (schema fields)
- Where that data is shown in UI (component)
- What happens if the field is missing/malformed (fallback behavior)

This will explicitly identify any remaining “giant gaps” vs “just wiring.”

---

## Specific files and areas we’ll touch (once in default mode)
1) **Database migration**
- Update `rb_projects_status_check`
- (Optional) add helper comments / normalize

2) **Resume Builder**
- `src/pages/resume-builder/ResumeBuilderIndex.tsx`
  - seniority mapping in `handleQuickScoreTransition`
  - remove duplicate CTAs
  - rename labels

3) **Quick Score**
- `src/pages/QuickScore.tsx`
  - (optional) normalize `detected.level` earlier, or pass raw + mapped value

---

## Verification checklist (what we will test)
1) Run Quick Score, click “Fix My Resume”:
- project insert succeeds
- no “Import failed”
- lands on `/resume-builder/:id/report`

2) From `/resume-builder` Projects page:
- only one CTA is shown (no duplicates)
- creating a new project works (no DB constraint errors)
- moving upload → jd → target → processing → report works

3) Confirm no console errors:
- specifically no constraint errors `23514` for `status` or `seniority_level`

---

## Why this will restore trust
Right now the system fails for deterministic reasons (DB constraints). Fixing prompts/UI without fixing the DB contract is like polishing a dashboard while the engine won’t start. This plan fixes the engine first, then validates the prompt + UI work against real end-to-end behavior.

