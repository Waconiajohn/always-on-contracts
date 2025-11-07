# Deploy Vault Migration Functions

## Problem
Migration ran but showed 0 items deleted / 0 items extracted because the new Supabase Edge Functions aren't deployed yet.

## Functions That Need Deployment

1. **vault-cleanup** (NEW) - Clears vault data safely
2. **auto-populate-vault-v3** (UPDATED) - Re-extracts with v3 quality

## Deployment Options

### Option A: Deploy via Supabase CLI (Recommended if you have CLI installed)

```bash
# Deploy vault-cleanup function
supabase functions deploy vault-cleanup

# Deploy updated auto-populate-vault-v3 function
supabase functions deploy auto-populate-vault-v3
```

### Option B: Ask Lovable to Deploy

Since you're using Lovable's automatic Supabase integration, Lovable should auto-deploy these functions. However, there might be a delay or you may need to trigger it.

**Tell Lovable**:
> "Please deploy the new Supabase Edge Functions to production:
> 1. vault-cleanup (new function in supabase/functions/vault-cleanup/)
> 2. auto-populate-vault-v3 (updated function with mode parameter and cleanup logic)"

### Option C: Manual Deployment via Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Edge Functions
4. Click "Deploy new function"
5. Deploy both functions listed above

## After Deployment

Once deployed, run the migration again from your Career Vault dashboard:

1. Refresh the page
2. Click "Run Vault Migration" button
3. You should see:
   - Step 1: Cleaning existing items → **Should delete ~1308 items**
   - Step 2: Re-extracting with V3 → **Should extract ~50-150 clean items**
   - Confidence: ~85% (not 8000%)

## Verification

After successful migration, verify:
- [ ] Total items reduced from 1308 to 50-150
- [ ] No duplicates (check if same phrase appears multiple times)
- [ ] Management blocker resolved (check career progression screen)
- [ ] Quality grade improved from F to B+ or higher
- [ ] "Verify 722 items" reduced to <100 items

## Troubleshooting

**If functions still don't work after deployment**:

Check Supabase Edge Function logs:
1. Go to Supabase Dashboard → Edge Functions
2. Click on the function name
3. View logs to see errors

**Common issues**:
- Function timeout (increase timeout in supabase config)
- Missing environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
- Database permissions (service role key should have full access)

## Next Steps After Successful Migration

1. Verify blocker is resolved
2. Continue with Phase 2: Fix extraction consistency (update AutoPopulateStep.tsx)
3. Continue with Phase 4: Simplify UI/UX
4. Continue with Phase 5: Production hardening
