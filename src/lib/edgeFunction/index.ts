/**
 * Edge Function Utilities
 * 
 * Centralized utilities for calling Supabase edge functions with:
 * - Input validation using Zod schemas
 * - Consistent error handling
 * - Type safety
 * - Rate limit handling
 */

export * from './errorHandler';
export * from './schemas';

// Re-export for convenience
export { z } from 'zod';
