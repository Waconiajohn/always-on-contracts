# Competency Benchmark Cron Job Setup

## Overview

The `update-competency-benchmarks` edge function should run nightly to aggregate user competency data and calculate percentile benchmarks.

## Scheduling Options

### Option 1: Supabase Cron Jobs (Recommended)

Supabase provides built-in cron scheduling via pg_cron extension.

1. Enable the cron extension in your Supabase project:
   ```sql
   -- Run in SQL Editor
   CREATE EXTENSION IF NOT EXISTS pg_cron;
   ```

2. Schedule the function to run daily at 2 AM UTC:
   ```sql
   -- Run in SQL Editor
   SELECT cron.schedule(
     'update-competency-benchmarks',  -- Job name
     '0 2 * * *',                     -- Cron expression: Daily at 2 AM UTC
     $$
     SELECT
       net.http_post(
         url := 'https://ubcghjlfxkamyyefnbkf.supabase.co/functions/v1/update-competency-benchmarks',
         headers := jsonb_build_object(
           'Content-Type', 'application/json',
           'Authorization', 'Bearer ' || current_setting('app.service_role_key')
         ),
         body := '{}'::jsonb
       ) AS request_id;
     $$
   );
   ```

3. Verify the job is scheduled:
   ```sql
   SELECT * FROM cron.job;
   ```

4. View job execution history:
   ```sql
   SELECT * FROM cron.job_run_details
   WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'update-competency-benchmarks')
   ORDER BY start_time DESC
   LIMIT 10;
   ```

### Option 2: External Cron Service

Use a service like GitHub Actions, Render Cron, or EasyCron:

**GitHub Actions Example** (`.github/workflows/update-benchmarks.yml`):

```yaml
name: Update Competency Benchmarks

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
  workflow_dispatch:  # Allow manual trigger

jobs:
  update-benchmarks:
    runs-on: ubuntu-latest
    steps:
      - name: Call Supabase Function
        run: |
          curl -X POST \
            https://ubcghjlfxkamyyefnbkf.supabase.co/functions/v1/update-competency-benchmarks \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            -d '{}'
```

## Manual Execution

To manually trigger the benchmark update:

```bash
curl -X POST \
  https://ubcghjlfxkamyyefnbkf.supabase.co/functions/v1/update-competency-benchmarks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [YOUR_SERVICE_ROLE_KEY]"
```

## Function Behavior

### What It Does

1. Fetches all user competency profiles with proficiency levels
2. Groups by competency name
3. Calculates percentiles (25th, 50th, 75th, 90th)
4. Updates `competency_benchmarks` table
5. Returns stats on benchmarks updated

### Minimum Data Requirements

- Requires at least 5 users with a competency to calculate benchmarks
- Skips competencies with insufficient data
- Logs skipped competencies for monitoring

### Expected Output

```json
{
  "success": true,
  "benchmarksUpdated": 47,
  "stats": {
    "totalBenchmarks": 47,
    "avgSampleSize": 23,
    "minSampleSize": 5,
    "maxSampleSize": 156,
    "totalDataPoints": 1081
  },
  "topCompetencies": [
    {
      "competency": "Project Management",
      "sampleSize": 156,
      "p50": 3,
      "p90": 5
    },
    ...
  ]
}
```

## Monitoring

### Check Last Update Time

```sql
SELECT
  competency_name,
  category,
  sample_size,
  last_updated
FROM competency_benchmarks
ORDER BY last_updated DESC
LIMIT 10;
```

### Find Stale Benchmarks

```sql
SELECT
  competency_name,
  sample_size,
  last_updated,
  NOW() - last_updated AS age
FROM competency_benchmarks
WHERE last_updated < NOW() - INTERVAL '2 days'
ORDER BY last_updated ASC;
```

### Competencies Waiting for Benchmarks

```sql
-- Competencies with enough data but no benchmark
SELECT
  competency_name,
  COUNT(*) as user_count
FROM user_competency_profile
WHERE has_experience = true
  AND proficiency_level IS NOT NULL
  AND competency_name NOT IN (
    SELECT competency_name FROM competency_benchmarks
  )
GROUP BY competency_name
HAVING COUNT(*) >= 5
ORDER BY user_count DESC;
```

## Troubleshooting

### Cron Job Not Running

1. Check if pg_cron extension is enabled:
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_cron';
   ```

2. Verify cron job exists:
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'update-competency-benchmarks';
   ```

3. Check for errors in execution history:
   ```sql
   SELECT * FROM cron.job_run_details
   WHERE status = 'failed'
   ORDER BY start_time DESC;
   ```

### No Benchmarks Being Updated

- Check if users have completed competency quiz
- Verify `user_competency_profile` has proficiency_level data
- Ensure at least 5 users per competency

### Function Timeout

If processing takes too long:
- Current implementation processes all competencies in one run
- For very large datasets, consider batching or parallel processing
- Monitor execution time via Supabase function logs

## Performance Considerations

### Current Scale

- Typical execution: 500ms - 2 seconds
- Handles up to 10,000 competency records efficiently
- Memory usage: ~50MB for 10k records

### Scaling for Growth

If you exceed 50,000+ competency records:

1. **Batch Processing**: Process competencies in chunks
2. **Incremental Updates**: Only update competencies with new data
3. **Role/Industry Segmentation**: Calculate benchmarks per role/industry separately

## Related Documentation

- [Competency Quiz System](./CAREER_VAULT_ASSESSMENT.md)
- [Quality Tier System](./RESUME_BUILDER_REDESIGN.md)
- [Vault Effectiveness Tracking](./supabase/migrations/20251021190000_add_vault_effectiveness_tracking.sql)
