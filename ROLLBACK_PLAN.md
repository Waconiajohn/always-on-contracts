# 🔄 Rollback Plan - Career Vault 2.0

## Quick Rollback (Emergency - 5 minutes)

If critical issues occur post-deployment:

### Step 1: Revert to Previous Version
1. Open Lovable project
2. Click version history icon (left sidebar)
3. Find the last working version (before deployment)
4. Click "Restore this version"
5. Publish immediately

### Step 2: Database Rollback (if needed)
```sql
-- Restore from backup via Lovable Cloud Backend
-- Go to Backend → Database → Backups
-- Select pre-deployment backup
-- Click "Restore"
```

### Step 3: Notify Users
- Post status update: "Temporary maintenance - returning shortly"
- Send email to active users if downtime > 30 minutes

---

## Partial Rollback (Feature-Specific - 15 minutes)

If only Career Vault 2.0 has issues:

### Option A: Revert to Old Onboarding
```typescript
// In App.tsx, comment out new route:
// <Route path="/career-vault/onboarding" element={<CareerVaultOnboardingEnhanced />} />

// Uncomment old route:
<Route path="/career-vault/onboarding" element={<CareerVaultOnboarding />} />
```

### Option B: Disable Auto-Population
```typescript
// In AutoPopulateStep.tsx
// Add emergency bypass:
const EMERGENCY_DISABLE = true; // Set to true to skip AI auto-population
```

---

## Database Rollback Scenarios

### Scenario 1: Migration Broke Something
```sql
-- Check migration history
SELECT * FROM supabase_migrations.schema_migrations 
ORDER BY version DESC LIMIT 5;

-- Rollback specific migration (careful!)
-- Contact Lovable support for guidance
```

### Scenario 2: Data Corruption
```bash
# Restore from backup (via Backend UI)
1. Backend → Database → Backups
2. Select backup from [pre-deployment timestamp]
3. Click "Restore" (creates new database)
4. Verify data integrity
5. Update connection if needed
```

---

## Monitoring & Detection

### Health Check Endpoint
```bash
# Test system health
curl https://[your-project].lovable.app/api/health-check

# Should return:
{
  "status": "healthy",
  "services": {
    "database": "up",
    "auth": "up"
  }
}
```

### Key Metrics to Watch (First 24 Hours)
- ❌ Auth failures spike (> 10%)
- ❌ API response time > 2 seconds
- ❌ Database query errors increase
- ❌ User complaints in support

### Automatic Rollback Triggers
- Database connection failures
- Auth system down > 5 minutes
- Critical error rate > 5%
- User can't complete onboarding

---

## Communication Plan

### Internal Team
- **Slack/Discord:** Immediate notification
- **Email:** Within 15 minutes
- **Incident report:** Within 24 hours

### Users
- **Status page:** Update immediately
- **In-app banner:** "We're experiencing issues"
- **Email:** If downtime > 1 hour

---

## Post-Rollback Actions

1. ✅ Document what went wrong
2. ✅ Identify root cause
3. ✅ Create fix in staging
4. ✅ Test thoroughly
5. ✅ Schedule re-deployment
6. ✅ Communicate lessons learned

---

## Emergency Contacts

- **Lovable Support:** help@lovable.dev
- **Project Lead:** [Your contact]
- **Technical Lead:** [Your contact]

---

## Testing Rollback (Do This BEFORE Launch!)

1. Create a test deployment
2. Simulate a critical issue
3. Execute rollback procedures
4. Verify system returns to working state
5. Time the entire process

**Target rollback time: < 10 minutes**

---

## Version Recovery Points

- **Current (v2.0):** Career Vault 2.0 with AI auto-population
- **Previous (v1.5):** Original interview-based onboarding
- **Stable (v1.0):** Pre-Career Vault enhancement

Use Lovable version history to restore any of these.
