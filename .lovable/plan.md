

# Fix Plan: Remove `require()` Calls From KeywordChip.tsx

## Problem Identified

The `FixPage` crashes with **"Can't find variable: require"** because `KeywordChip.tsx` uses Node.js-style `require()` statements inside component functions:

- **Line 173-174**: `KeywordChipGroup` uses `require()` for Card and Badge
- **Line 218-221**: `GapCard` uses `require()` for Card, Badge, Button, AlertCircle, Plus

This is incompatible with browser JavaScript. Vite uses ES Modules, which means all imports must use the `import` statement at the top of the file.

---

## The Fix

Convert all `require()` calls to standard ES Module `import` statements at the top of the file.

### Current (Broken)
```typescript
export function KeywordChipGroup(...) {
  const { Card } = require('@/components/ui/card');  // ❌ Crashes
  const { Badge } = require('@/components/ui/badge'); // ❌ Crashes
  ...
}

export function GapCard(...) {
  const { Card } = require('@/components/ui/card');   // ❌ Crashes
  const { Badge } = require('@/components/ui/badge'); // ❌ Crashes
  const { Button } = require('@/components/ui/button'); // ❌ Crashes
  const { AlertCircle, Plus } = require('lucide-react'); // ❌ Crashes
  ...
}
```

### Fixed (Working)
```typescript
// Move all imports to the top of the file
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// Button and some icons are already imported at the top
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/resume-builder/KeywordChip.tsx` | Replace `require()` with proper imports |

---

## Implementation Steps

1. Add missing imports at the top of the file:
   - `Card` from `@/components/ui/card`
   - `Badge` from `@/components/ui/badge`

2. Remove inline `require()` calls from:
   - `KeywordChipGroup` function (lines 173-174)
   - `GapCard` function (lines 218-221)

3. Note: `Button`, `AlertCircle`, and `Plus` are already imported at the top (lines 4-16), so those `require()` calls are redundant anyway.

---

## Technical Details

**Why this happened**: Someone likely tried to avoid circular dependencies or lazily load components using `require()`, but this pattern doesn't work in browser environments with ES Modules.

**Why it breaks**: 
- `require()` is a CommonJS function that only exists in Node.js
- Vite/React uses ES Modules which use `import/export`
- When the code runs in the browser, `require` is undefined → ReferenceError

---

## Verification

After the fix:
1. Navigate to `/resume-builder/{projectId}/fix`
2. Page should load without crashing
3. Keywords tab should display keyword chips
4. Gaps tab should display gap cards

