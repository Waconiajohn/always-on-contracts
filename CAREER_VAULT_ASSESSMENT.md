# Career Vault 2.0 - Senior Engineering Assessment
**Date:** 2025-01-07  
**Severity:** 🔴 **CRITICAL** - 1463-line monolith, deprecated code in production, UX confusion

---

## Problems Found

### 1. **Code Quality** 🔴
- **1463-line dashboard** (CareerVaultDashboard.tsx) - should be < 200 lines
- **20+ useState hooks** in single component (state explosion)  
- **No data layer abstraction** - every component queries Supabase directly
- **Deprecated code still shipping** - DuplicateDetector wrapper, old algorithms

### 2. **Routing Chaos** 🔴  
```
/career-vault                    ← doesn't exist
/career-vault-dashboard          ← actual dashboard  
/career-vault-onboarding         ← new onboarding
/career-vault-onboarding-legacy  ← WHY STILL HERE?
```

### 3. **UX Confusion** 🔴
- **Multiple conflicting CTAs:** "Review Now", "Start Verification", "Verify 722 Items"
- **Wrong verification count:** Shows 722 when should be ~52  
- **Duplicate UI** elements: "Strategic Command Center" vs "Items need review" banner
- **8 tabs** - too many, user doesn't know where to go
- **397 duplicates** still visible despite DB fixes

### 4. **Architecture Issues** 🔴
- Calculations mixed with UI rendering
- No separation of concerns  
- Impossible to unit test
- No proper error handling
- No caching strategy

---

## Refactoring Plan

### **PHASE 1: IMMEDIATE CLEANUP** (Today)

**Delete Deprecated Code:**
```bash
# Remove these files:
src/components/career-vault/DuplicateDetector.tsx (wrapper only)
src/lib/services/vaultDuplicateDetector.ts (old algorithm)
src/pages/CareerVaultOnboardingLegacy.tsx

# Update imports to use AutoDuplicateCleanup directly
```

**Fix Routing:**
```typescript
// OLD (confusing)
/career-vault-dashboard

// NEW (clean)
/career-vault
```

**Add Auto-Cleanup:**
- Integrate `AutoDuplicateCleanup` into Strategic Command Center
- Run on mount if duplicates > 50
- Show success toast

---

### **PHASE 2: BREAK DOWN MONOLITH** (Week 1)

**Before:** 1463 lines in one file ❌

**After:** Focused components ✅
```
pages/
  CareerVaultDashboard.tsx (150 lines - orchestration only)
  
hooks/
  useVaultData.ts (fetch + cache all vault data)
  useVaultStats.ts (strength calc, quality distribution)
  useVaultMissions.ts (mission generation logic)
  
components/career-vault/dashboard/
  VaultHeader.tsx
  MissionsPanel.tsx
  QuickActionsBar.tsx
  ActivityPanel.tsx
```

---

### **PHASE 3: DATA LAYER** (Week 1-2)

**Current:** No abstraction ❌
```typescript
// Repeated 50+ times:
const { data } = await supabase.from('vault_...').select()
```

**New:** Proper hooks with caching ✅
```typescript
const { vault, stats, missions, isLoading } = useVaultData(vaultId);
// ✅ Cached with React Query
// ✅ Auto-refresh on mutations  
// ✅ Consistent error handling
```

---

### **PHASE 4: UX SIMPLIFICATION** (Week 2)

**Simplify Dashboard:**
- ❌ Remove: "Items need review" banner (confusing)
- ❌ Remove: 8 tabs → 3 tabs (Dashboard, Items, Settings)
- ✅ Add: Single source of truth (Strategic Command Center)
- ✅ Add: Mission-based navigation

**Fix Verification Count:**
- Show only items with `confidence < 70%` OR `needs_review = true`
- Should be ~52 items, not 722

**Consolidate CTAs:**
```
Before: 5+ different buttons saying different things
After: 1 clear "Start Next Mission" button
```

---

## Implementation Order

### Today (Phase 1):
1. ✅ Created database cleanup function  
2. ✅ Created AutoDuplicateCleanup component
3. ✅ Created VaultNuclearReset component  
4. 🔄 Delete deprecated files
5. 🔄 Fix routing  
6. 🔄 Add cleanup to dashboard

### This Week (Phase 2-3):
1. Create data hooks (`useVaultData`, `useVaultStats`, `useVaultMissions`)
2. Break down 1463-line dashboard into focused components
3. Add React Query caching
4. Update all components to use hooks

### Next Week (Phase 4):
1. Simplify tab structure (8 → 3)
2. Fix verification count logic
3. Remove duplicate UI elements
4. Add mission-based navigation

---

## Success Criteria

**Code Quality:**
- ✅ Dashboard < 200 lines (from 1463)
- ✅ 0 deprecated code
- ✅ Data hooks reused everywhere
- ✅ 90+ Lighthouse score

**UX:**
- ✅ User knows exactly what to do next
- ✅ 0 duplicate items visible
- ✅ Single clear CTA  
- ✅ < 5 min to complete verification

---

**Next:** Implement Phase 1 cleanup immediately
