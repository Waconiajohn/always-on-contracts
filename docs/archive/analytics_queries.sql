-- Phase 5.4: Success Rate Dashboard Queries

-- Daily success rate by file type
SELECT 
  DATE(created_at) as date,
  file_type,
  COUNT(*) as total_uploads,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful,
  ROUND(100.0 * SUM(CASE WHEN success THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate,
  AVG(total_time_ms) as avg_time_ms,
  AVG(extracted_text_length) as avg_text_length
FROM processing_metrics
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), file_type
ORDER BY date DESC, file_type;

-- Error breakdown by type
SELECT 
  error_type,
  COUNT(*) as occurrences,
  ARRAY_AGG(DISTINCT file_type) as affected_file_types,
  AVG(file_size) as avg_file_size,
  MAX(created_at) as last_occurrence
FROM processing_metrics
WHERE success = false
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY error_type
ORDER BY occurrences DESC;

-- Performance metrics by file type
SELECT 
  file_type,
  COUNT(*) as total_processed,
  AVG(total_time_ms) as avg_total_time_ms,
  AVG(parse_time_ms) as avg_parse_time_ms,
  AVG(validation_time_ms) as avg_validation_time_ms,
  AVG(analysis_time_ms) as avg_analysis_time_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY total_time_ms) as p95_time_ms
FROM processing_metrics
WHERE success = true
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY file_type
ORDER BY total_processed DESC;

-- Cache effectiveness
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_requests,
  SUM(CASE WHEN was_cached THEN 1 ELSE 0 END) as cache_hits,
  ROUND(100.0 * SUM(CASE WHEN was_cached THEN 1 ELSE 0 END) / COUNT(*), 2) as cache_hit_rate,
  AVG(CASE WHEN was_cached THEN total_time_ms END) as avg_cached_time_ms,
  AVG(CASE WHEN NOT was_cached THEN total_time_ms END) as avg_uncached_time_ms
FROM processing_metrics
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- User-level statistics (top users by volume)
SELECT 
  user_id,
  COUNT(*) as total_uploads,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_uploads,
  SUM(CASE WHEN was_cached THEN 1 ELSE 0 END) as cached_requests,
  AVG(file_size) as avg_file_size,
  MAX(created_at) as last_upload
FROM processing_metrics
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY user_id
HAVING COUNT(*) >= 5
ORDER BY total_uploads DESC
LIMIT 50;
