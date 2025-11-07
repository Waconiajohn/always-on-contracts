# Career Vault Dashboard Refactor Plan

## Current State (374 lines)

**Components in use**:
1. VaultHeader (grade, resume, re-analyze)
2. BlockerAlert (critical issues)
3. VaultMigrationTool (cleanup/re-extract)
4. CompactVaultStats (7 metrics)
5. StrategicCommandCenter (missions, actions)
6. QuickWinsPanel (improvement suggestions)
7. QuickActionsBar (add metrics, modernize)
8. VaultTabs (main content)
9. InferredItemsReview (review AI items)
10. VaultSidebar (right sidebar)
11. VaultAIAssistant (bottom assistant)
12. Various modals (Resume, AddMetrics, Modernize, View, Edit)

**Layout**: ContentLayout with right sidebar

## New Design (Target: ~250 lines, -33% reduction)

###Components to **CREATE** (New):
1. ✅ **UnifiedHeroCard** - Replaces VaultHeader + CompactVaultStats
2. ✅ **AIPrimaryAction** - Smart next action determination
3. **SimplifiedTabs** - Cleaner tab interface with progressive disclosure

### Components to **KEEP** (Modified):
1. **BlockerAlert** - Keep for critical issues (only severity=critical shown)
2. **VaultMigrationTool** - Keep but hide if grade >= B
3. **VaultTabs** - Keep but simplify (remove redundant content)
4. **VaultAIAssistant** - Keep but make floating/dismissible
5. **Modals** - Keep all (Resume, AddMetrics, Modernize, View, Edit)

### Components to **REMOVE**:
1. ❌ **VaultHeader** - Functionality merged into UnifiedHeroCard
2. ❌ **CompactVaultStats** - Functionality merged into UnifiedHeroCard
3. ❌ **StrategicCommandCenter** - Replaced by AIPrimaryAction
4. ❌ **QuickWinsPanel** - Integrated into AIPrimaryAction logic
5. ❌ **QuickActionsBar** - Actions moved to contextual locations
6. ❌ **VaultSidebar** - Content moved to main area (remove right sidebar)
7. ❌ **InferredItemsReview** - Merged into VaultTabs

## New Layout Structure

```typescript
<ContentLayout rightSidebar={null}> {/* Remove sidebar */}
  <div className="p-4 md:p-8 max-w-7xl mx-auto">

    {/* HERO SECTION (Above fold) */}
    <UnifiedHeroCard
      score={score}
      grade={grade}
      level={careerLevel}
      summary={aiGeneratedSummary}
      totalItems={totalItems}
      marketPercentile={marketRank}
      itemsToReview={unverifiedItems}
      onManageResume={() => setResumeModalOpen(true)}
      onReanalyze={handleReanalyze}
      onSettings={() => navigate('/settings')}
      isReanalyzing={isReanalyzing}
    />

    {/* CRITICAL BLOCKERS (Only severity=critical) */}
    {criticalBlockers.length > 0 && (
      <div className="mb-6">
        {criticalBlockers.map((blocker) => (
          <BlockerAlert key={blocker.id} blocker={blocker} />
        ))}
      </div>
    )}

    {/* MIGRATION TOOL (Conditional: only if grade < B or user explicitly wants it) */}
    {(grade < 'B' || showMigrationTool) && (
      <VaultMigrationTool />
    )}

    {/* AI PRIMARY ACTION (THE single next step) */}
    <AIPrimaryAction
      action={determinePrimaryAction({
        hasBlockers: criticalBlockers.length > 0,
        blockerMessage: criticalBlockers[0]?.description,
        blockerRoute: criticalBlockers[0]?.actionRoute,
        unverifiedItems: unverifiedItems,
        quickWins: quickWins,
        score: score,
      })}
      onActionClick={(route) => navigate(route)}
    />

    {/* CONTENT TABS (Progressive disclosure) */}
    <VaultTabs
      vaultId={vaultId}
      vault={vault}
      vaultData={vaultData}
      onRefresh={refetch}
      onEdit={handleEditItem}
      onView={handleViewItem}
    />

    {/* MODALS (Same as before) */}
    <ResumeManagementModal />
    <AddMetricsModal />
    <ModernizeLanguageModal />
    <VaultItemViewModal />
    <VaultItemEditModal />
  </div>

  {/* AI ASSISTANT (Floating, bottom-right) */}
  <VaultAIAssistant
    floating={true}
    position="bottom-right"
    dismissible={true}
  />
</ContentLayout>
```

## Key Changes

### 1. Remove Right Sidebar
**Before**: ContentLayout with VaultSidebar on right (breaks mobile, 50-50 split issue)
**After**: Full-width main content, no sidebar

**Sidebar content moved to**:
- Completion % → UnifiedHeroCard metrics
- Total items → UnifiedHeroCard metrics
- Strength score → UnifiedHeroCard radial progress

### 2. Unify Header + Stats
**Before**: VaultHeader (grade, actions) + CompactVaultStats (7 metrics) = 2 components
**After**: UnifiedHeroCard (all-in-one) = 1 component

**Benefits**:
- Single source of truth
- Less visual clutter
- Clearer hierarchy
- Better mobile experience

### 3. Smart Primary Action
**Before**: Multiple action areas (Quick Actions Bar, Strategic Command, Quick Wins) confusing priority
**After**: One AI-powered primary action based on vault state

**Logic**:
```typescript
Priority:
1. Fix blocker (if exists)
2. Review items (if >10 unverified)
3. Quick win (if available)
4. Ready (vault optimized)
```

### 4. Progressive Disclosure
**Before**: Everything visible at once (information overload)
**After**: Critical above fold, details in tabs (progressive disclosure)

**Above fold** (user sees immediately):
- Vault status (score, grade, level)
- Critical blockers (if any)
- Primary next action
- Progress indicators

**Below fold** (user clicks to see):
- Detailed tabs (Overview, Strengths, Analytics, Management)
- Advanced features (migration tool if needed)
- Item lists and management

### 5. Conditional Rendering
**Before**: All components always visible
**After**: Smart visibility based on context

**Examples**:
- Migration Tool: Only if grade < B or quality issues detected
- Blockers: Only severity=critical shown (high/medium collapsed)
- Quick Wins: Integrated into primary action (top 1 shown, rest in tabs)
- Inferred Items Review: Merged into Vault Tabs (not separate section)

## Implementation Steps

### Step 1: Create New Components ✅
- [x] UnifiedHeroCard.tsx
- [x] AIPrimaryAction.tsx
- [ ] Update VaultTabs.tsx (add Overview tab)

### Step 2: Refactor Dashboard
- [ ] Remove imports for deleted components
- [ ] Add imports for new components
- [ ] Restructure layout (remove sidebar)
- [ ] Implement new component order
- [ ] Add conditional rendering logic

### Step 3: Move Content
- [ ] Sidebar metrics → UnifiedHeroCard
- [ ] Header actions → UnifiedHeroCard
- [ ] Stats grid → UnifiedHeroCard
- [ ] Quick wins → AIPrimaryAction logic
- [ ] Inferred items → VaultTabs

### Step 4: Cleanup
- [ ] Delete unused components
- [ ] Remove redundant state
- [ ] Simplify data fetching
- [ ] Update types if needed

### Step 5: Polish
- [ ] Responsive design testing
- [ ] Accessibility audit
- [ ] Performance optimization
- [ ] User testing

## Expected Results

### Metrics
- **File size**: 374 lines → ~250 lines (-33%)
- **Components**: 14 → 8 (-43%)
- **Above-fold content**: Reduced by 60%
- **User comprehension**: <3 seconds to understand status

### User Experience
- ✅ Single-glance status understanding
- ✅ Clear next action (no confusion)
- ✅ Better mobile experience
- ✅ Faster page load
- ✅ Less cognitive load

### Technical
- ✅ Cleaner code architecture
- ✅ Better component reusability
- ✅ Easier maintenance
- ✅ Improved accessibility

## Risk Mitigation

### Potential Issues
1. **User resistance to change**: Mitigate with clear onboarding tooltip
2. **Missing functionality**: Audit all removed components to ensure nothing critical lost
3. **Breaking changes**: Test all user flows before deployment

### Rollback Plan
- Keep old components in `dashboard/legacy/` folder (don't delete yet)
- Feature flag: `useNewDashboard` to toggle between old/new
- Monitor analytics for user drop-off

## Timeline

- **Hour 1**: Create new components (UnifiedHeroCard, AIPrimaryAction) ✅
- **Hour 2**: Refactor CareerVaultDashboard.tsx layout
- **Hour 3**: Move content and implement conditional logic
- **Hour 4**: Test, polish, accessibility
- **Hour 5**: User testing and refinement

**Total**: 5 hours for production-grade implementation

---

**Next**: Refactor CareerVaultDashboard.tsx with new layout!
