/**
 * Batch Processor - Process bulk operations with controlled concurrency
 *
 * Use this for bulk job matching, vault population, or any operation
 * that needs to make multiple AI calls efficiently.
 */

import { callPerplexity, PerplexityRequest, AIUsageMetrics } from './ai-config.ts';
import { createLogger } from './logger.ts';

const logger = createLogger('batch-processor');

interface BatchConfig {
  concurrency?: number;        // Number of concurrent requests (default: 5)
  delayMs?: number;            // Delay between batches (default: 0)
  onProgress?: (completed: number, total: number) => void;
  onBatchComplete?: (batchResults: any[]) => void;
  continueOnError?: boolean;   // Continue processing if one item fails (default: true)
}

interface BatchResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  index: number;
  metrics?: AIUsageMetrics;
}

/**
 * Process array of items in batches with controlled concurrency
 *
 * @example
 * const jobs = await getJobs();
 * const results = await batchProcess(
 *   jobs,
 *   async (job) => analyzeJob(job),
 *   { concurrency: 10, onProgress: (done, total) => console.log(`${done}/${total}`) }
 * );
 */
export async function batchProcess<T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  config: BatchConfig = {}
): Promise<BatchResult<R>[]> {
  const {
    concurrency = 5,
    delayMs = 0,
    onProgress,
    onBatchComplete,
    continueOnError = true
  } = config;

  logger.info('Starting batch processing', {
    totalItems: items.length,
    concurrency,
    delayMs
  });

  const results: BatchResult<R>[] = [];
  const startTime = Date.now();

  // Process items in batches
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchStartIndex = i;

    logger.debug(`Processing batch ${Math.floor(i / concurrency) + 1}`, {
      batchSize: batch.length,
      startIndex: i
    });

    // Process batch concurrently
    const batchPromises = batch.map(async (item, batchIndex) => {
      const globalIndex = batchStartIndex + batchIndex;
      try {
        const data = await processor(item, globalIndex);
        return {
          success: true,
          data,
          index: globalIndex
        } as BatchResult<R>;
      } catch (error) {
        logger.error(`Item ${globalIndex} failed`, error as Error);
        if (!continueOnError) {
          throw error;
        }
        return {
          success: false,
          error: error as Error,
          index: globalIndex
        } as BatchResult<R>;
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Call progress callback
    if (onProgress) {
      onProgress(results.length, items.length);
    }

    // Call batch complete callback
    if (onBatchComplete) {
      onBatchComplete(batchResults);
    }

    // Delay before next batch
    if (delayMs > 0 && i + concurrency < items.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  const duration = Date.now() - startTime;
  const successCount = results.filter(r => r.success).length;
  const errorCount = results.filter(r => !r.success).length;

  logger.info('Batch processing complete', {
    totalItems: items.length,
    successCount,
    errorCount,
    durationMs: duration,
    itemsPerSecond: (items.length / duration * 1000).toFixed(2)
  });

  return results;
}

/**
 * Batch call Perplexity with multiple requests
 *
 * @example
 * const requests = jobs.map(job => ({
 *   messages: [{ role: 'user', content: `Analyze: ${job.title}` }],
 *   model: PERPLEXITY_MODELS.DEFAULT
 * }));
 *
 * const results = await batchCallPerplexity(
 *   requests,
 *   'job-analysis',
 *   userId,
 *   { concurrency: 10 }
 * );
 */
export async function batchCallPerplexity(
  requests: PerplexityRequest[],
  functionName: string,
  userId?: string,
  config: BatchConfig = {}
): Promise<BatchResult<{ response: any; metrics: AIUsageMetrics }>[]> {
  return batchProcess(
    requests,
    async (request, index) => {
      logger.debug(`Calling Perplexity for item ${index}`, { functionName });
      return await callPerplexity(request, `${functionName}-batch`, userId);
    },
    config
  );
}

/**
 * Chunk array into smaller arrays
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Rate limited batch processor - ensures requests don't exceed rate limits
 *
 * @example
 * const results = await rateLimitedBatch(
 *   jobs,
 *   async (job) => analyzeJob(job),
 *   {
 *     requestsPerMinute: 60,
 *     concurrency: 5
 *   }
 * );
 */
export async function rateLimitedBatch<T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  config: BatchConfig & { requestsPerMinute?: number } = {}
): Promise<BatchResult<R>[]> {
  const { requestsPerMinute = 60, concurrency = 5 } = config;

  // Calculate delay to stay under rate limit
  const delayMs = Math.ceil((60 * 1000) / requestsPerMinute);

  return batchProcess(items, processor, {
    ...config,
    concurrency,
    delayMs
  });
}
