# Career Vault - Quick Reference Guide

## Key Files by Purpose

### Dashboard Pages
- `/src/pages/CareerVaultDashboard.tsx` - Main dashboard page (62KB)
- `/src/pages/CareerVaultOnboarding.tsx` - Onboarding flow (18KB)

### Core Dashboard Components
| Component | Purpose | Key Features |
|-----------|---------|--------------|
| `VaultStatusHero` | Main score display (0-100) | Shows level, quality distribution, score breakdown |
| `VaultQuickStats` | 4-card metrics grid | Items, Progress%, Score, Last Updated |
| `VaultContents` | Category organization | Core/Leadership/Culture sections |
| `QualityBoosters` | Improvement suggestions | Metrics & Modernization |
| `VaultSuggestionsWidget` | Priority-based tasks | Verify/Add Metrics/Refresh |
| `SmartNextSteps` | Contextual actions | Based on vault state |
| `VaultActivityFeed` | Change log | Chronological modifications |

### Quality Management Components
| Component | Purpose |
|-----------|---------|
| `VerificationWorkflow` | Quiz-based verification of assumed items |
| `FreshnessManager` | Identify & refresh stale items (180+ days) |
| `DuplicateDetector` | Find & merge similar items (85%+ match) |
| `AddMetricsModal` | Add quantification to achievements |
| `ModernizeLanguageModal` | Update language to modern terms |

### Data Tables (10 Intelligence Categories)

```
Core Intelligence (Resume)
├── vault_power_phrases (150-250 typical)
├── vault_transferable_skills (20-40 typical)
└── vault_hidden_competencies (10-20 typical)

Expanded Intelligence
├── vault_soft_skills (10-15 typical)
├── vault_leadership_philosophy (3-5)
├── vault_executive_presence (5-10)
├── vault_personality_traits (5-8)
├── vault_work_style (3-5)
├── vault_values_motivations (5-8)
└── vault_behavioral_indicators (5-10)

Supporting Tables
├── vault_gap_analysis
├── vault_activity_log
└── vault_resume_milestones
```

## Quality Tier System

```
GOLD ⭐⭐⭐⭐
├── User verified via quiz
├── confidence_score > 0.85
├── quiz_verified = true
└── Auto-populate resume

SILVER ⭐⭐⭐
├── AI confidence 0.70-0.85
├── 3+ evidence pieces
└── Present with confidence

BRONZE ⭐⭐
├── AI confidence 0.55-0.70
├── 1-2 evidence pieces
└── Ask user for enhancement

ASSUMED ⭐
├── AI confidence < 0.55
├── No verification
└── Suggest verification quiz
```

## Strength Score Formula

```
Overall Score (0-100) = Weighted Average of:
├── Power Phrases (max 10)
├── Transferable Skills (max 10)
├── Hidden Competencies (max 10)
├── Intangibles (max 40)
├── Quantification (max 15) - % with metrics
└── Modern Terminology (max 15) - % with modern keywords

Quality Tier Weight:
├── Gold: 1.0
├── Silver: 0.8
├── Bronze: 0.6
└── Assumed: 0.4

Freshness Multiplier:
├── 0-30 days: 1.0
├── 31-90 days: 0.9
├── 91-180 days: 0.8
└── [decay to 0.4 after 3+ years]

Levels:
├── 90+: Exceptional
├── 80-89: Elite
├── 70-79: Strong
├── 60-69: Solid
└── <60: Developing
```

## Data Flow Diagram

```
ONBOARDING (User Entry Point)
    ↓
    Resume Upload → parse-resume
    ↓
    analyze-resume-initial
    ↓
    Set Career Direction (target_roles, target_industries)
    ↓
    conduct-industry-research
    ↓
    auto-populate-vault-v2 ← Core AI Extraction
    ↓ (Creates 10 vault tables)
    
DASHBOARD (Display & Quality)
    ↓
    Load: career_vault + all 10 tables (parallel)
    ↓
    Calculate: strength_score, quality_distribution
    ↓
    Render: VaultStatusHero + widgets + activity
    ↓
    User Actions:
    ├── Verify items → VerificationWorkflow
    ├── Add metrics → AddMetricsModal
    ├── Refresh stale → FreshnessManager
    ├── Edit items → VaultItemEditModal
    └── View activity → VaultActivityFeed

RESUME BUILDER (Output)
    ↓
    User enters job description
    ↓
    analyze-job-qualifications
    ↓
    match-vault-to-requirements ← Query all 10 tables
    ↓
    enhanceVaultMatches() ← Add quality scoring
    ↓
    Categorize:
    ├── autoHandled (Gold/Silver)
    ├── needsInput (Bronze)
    └── optionalEnhancement (Assumed)
    ↓
    Auto-generate resume sections
    ↓
    User review + edit
    ↓
    ATS analysis → analyze-ats-score
```

## Key Database Queries

### Get Vault Statistics
```sql
SELECT 
  COUNT(*) FILTER (WHERE quality_tier = 'gold') as gold_count,
  COUNT(*) FILTER (WHERE quality_tier = 'silver') as silver_count,
  COUNT(*) FILTER (WHERE quality_tier = 'bronze') as bronze_count,
  COUNT(*) FILTER (WHERE quality_tier = 'assumed') as assumed_count,
  AVG(effectiveness_score) as avg_effectiveness
FROM vault_power_phrases
WHERE vault_id = $vaultId;
```

### Find Stale Items
```sql
SELECT id, vault_id, last_updated_at, 
  EXTRACT(DAY FROM NOW() - last_updated_at) as days_old
FROM vault_power_phrases
WHERE vault_id = $vaultId 
  AND last_updated_at < NOW() - INTERVAL '180 days'
ORDER BY last_updated_at ASC;
```

### Find Duplicates (client-side)
```typescript
similarity = Levenshtein(item1.content, item2.content)
similarityPercent = ((maxLength - distance) / maxLength) * 100
if (similarityPercent >= 85) // Likely duplicate
```

### Full-Text Search
```sql
SELECT * FROM vault_power_phrases
WHERE vault_id = $vaultId
  AND to_tsvector('english', power_phrase) @@ 
      plainto_tsquery('english', $searchQuery)
ORDER BY ts_rank(...) DESC;
```

## Edge Functions (Top 10 Most Important)

1. **auto-populate-vault-v2** - Core: Extracts intelligence from resume
2. **extract-vault-intelligence** - Extracts from user responses
3. **analyze-resume-initial** - Parse resume structure
4. **match-vault-to-requirements** - Resume builder: match vault to job
5. **generate-vault-recommendations** - Dashboard: suggestions
6. **generate-skill-verification-questions** - Quiz generation
7. **analyze-job-qualifications** - Parse job description
8. **get-vault-data** - Fetch all vault data for display
9. **analyze-ats-score** - Resume: ATS compatibility
10. **gap-analysis** - Competitive analysis

## State Management Pattern

```typescript
// Dashboard pattern:
const [vaultId, setVaultId] = useState("");
const [powerPhrases, setPowerPhrases] = useState<PowerPhrase[]>([]);
const [transferableSkills, setTransferableSkills] = useState<TransferableSkill[]>([]);
// ... 8 more setters for other categories

// On mount:
useEffect(() => {
  fetchData();
}, []);

// Fetch pattern:
const fetchData = async () => {
  const vault = await supabase.from('career_vault')...
  const [phrases, skills, competencies, ...] = await Promise.all([
    supabase.from('vault_power_phrases')...,
    supabase.from('vault_transferable_skills')...,
    // ... fetch all 10 tables
  ]);
  
  // Calculate scores
  const score = calculateStrengthScore(phrases, skills, ...);
  const distribution = calculateQualityDistribution(...);
  
  setStrengthScore(score);
  setQualityDistribution(distribution);
};
```

## Common UI Patterns

### Quality Tier Badge
```
Gold → bg-tier-gold-bg text-tier-gold
Silver → bg-tier-silver-bg text-tier-silver
Bronze → bg-tier-bronze-bg text-tier-bronze
Assumed → bg-tier-assumed-bg text-tier-assumed
```

### Modal Pattern
```typescript
const [modalOpen, setModalOpen] = useState(false);

// Handle user action
<Button onClick={() => setModalOpen(true)}>Open</Button>

// Dialog
<Dialog open={modalOpen} onOpenChange={setModalOpen}>
  <DialogContent>
    <DialogHeader><DialogTitle>Title</DialogTitle></DialogHeader>
    {/* Content */}
  </DialogContent>
</Dialog>
```

## Performance Optimization Tips

1. **Parallel Queries**: Use Promise.all() for all 10 vault tables
2. **Caching**: Recent fetches can be cached for 30 seconds
3. **Indexes**: All queries use indexes on (vault_id, quality_tier, created_at)
4. **FTS**: Use PostgreSQL full-text search for search operations
5. **RLS**: Row-level security ensures user data isolation

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Dashboard slow to load | Missing indexes | Check migration for index creation |
| Items not appearing | RLS policy blocked | Verify auth.uid() = user_id in policies |
| Quality score wrong | All items weighted equally | Weight by tier: gold=1.0, silver=0.8, etc. |
| Duplicates not found | Low threshold | Levenshtein distance needs >= 85% match |
| Activity not logged | Missed log call | Call logActivity() after data updates |

## Testing Vault Data

```typescript
// Check if vault exists and has data
const { data: vault } = await supabase
  .from('career_vault')
  .select('*')
  .eq('user_id', userId)
  .single();

if (vault?.total_power_phrases === 0) {
  console.log("Vault is empty - needs onboarding");
}

// Check quality distribution
const { data: stats } = await supabase
  .rpc('get_vault_statistics', { p_vault_id: vaultId });

console.log(`Gold: ${stats.qualityBreakdown.gold}`);
console.log(`Silver: ${stats.qualityBreakdown.silver}`);
```

## UI Component Import Map

```typescript
// Cards & Layout
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Vault Components
import { VaultStatusHero } from '@/components/career-vault/VaultStatusHero';
import { VaultQuickStats } from '@/components/career-vault/VaultQuickStats';
import { VaultContents } from '@/components/career-vault/VaultContents';
import { QualityBoosters } from '@/components/career-vault/QualityBoosters';

// Modals & Workflows
import { AddMetricsModal } from '@/components/career-vault/AddMetricsModal';
import { VerificationWorkflow } from '@/components/career-vault/VerificationWorkflow';

// Icons
import { Trophy, Brain, Award, TrendingUp } from 'lucide-react';
```

## Next Steps for Dashboard Redesign

1. **Consolidate 3 suggestion widgets** into single "Quick Wins" panel
2. **Simplify VaultStatusHero** - show score + level + 1 primary action
3. **Add quality tier help** - tooltips explaining gold/silver/bronze/assumed
4. **Promote activity feed** - make it first-class, not hidden
5. **Progressive disclosure** - summary by default, expand for details
6. **Merge Add Metrics + Modernize** into single "Enhance Your Vault" modal
7. **Reduce modals** from 8 to 3-4 consolidated workflows

