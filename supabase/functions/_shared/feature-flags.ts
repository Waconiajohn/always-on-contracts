/**
 * Feature Flags
 * Control gradual rollout and enable/disable features
 */

export interface FeatureFlags {
  USE_V3_EXTRACTION: boolean;
  ENABLE_FRAMEWORK_CONTEXT: boolean;
  ENABLE_VALIDATION_RETRY: boolean;
  ENABLE_OBSERVABILITY: boolean;
  V3_TRAFFIC_PERCENTAGE: number; // 0-100
}

/**
 * Load feature flags from environment
 */
export function loadFeatureFlags(): FeatureFlags {
  return {
    USE_V3_EXTRACTION: Deno.env.get('USE_V3_EXTRACTION') === 'true',
    ENABLE_FRAMEWORK_CONTEXT: Deno.env.get('ENABLE_FRAMEWORK_CONTEXT') !== 'false', // Default true
    ENABLE_VALIDATION_RETRY: Deno.env.get('ENABLE_VALIDATION_RETRY') !== 'false', // Default true
    ENABLE_OBSERVABILITY: Deno.env.get('ENABLE_OBSERVABILITY') !== 'false', // Default true
    V3_TRAFFIC_PERCENTAGE: parseInt(Deno.env.get('V3_TRAFFIC_PERCENTAGE') || '0', 10),
  };
}

/**
 * Determine if user should use V3 extraction
 * Based on feature flags and gradual rollout percentage
 */
export function shouldUseV3Extraction(userId: string, flags?: FeatureFlags): boolean {
  const featureFlags = flags || loadFeatureFlags();

  // If explicitly enabled/disabled, use that
  if (Deno.env.get('USE_V3_EXTRACTION') === 'true') return true;
  if (Deno.env.get('USE_V3_EXTRACTION') === 'false') return false;

  // Gradual rollout by user ID hash
  if (featureFlags.V3_TRAFFIC_PERCENTAGE > 0) {
    const hash = hashUserId(userId);
    const userPercentile = hash % 100;
    return userPercentile < featureFlags.V3_TRAFFIC_PERCENTAGE;
  }

  // Default: use v2
  return false;
}

/**
 * Hash user ID to consistent number 0-99
 */
function hashUserId(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash) % 100;
}

/**
 * Log feature flag status
 */
export function logFeatureFlags(flags?: FeatureFlags): void {
  const featureFlags = flags || loadFeatureFlags();

  console.log('\n🎚️  Feature Flags:');
  console.log(`   USE_V3_EXTRACTION: ${featureFlags.USE_V3_EXTRACTION}`);
  console.log(`   ENABLE_FRAMEWORK_CONTEXT: ${featureFlags.ENABLE_FRAMEWORK_CONTEXT}`);
  console.log(`   ENABLE_VALIDATION_RETRY: ${featureFlags.ENABLE_VALIDATION_RETRY}`);
  console.log(`   ENABLE_OBSERVABILITY: ${featureFlags.ENABLE_OBSERVABILITY}`);
  console.log(`   V3_TRAFFIC_PERCENTAGE: ${featureFlags.V3_TRAFFIC_PERCENTAGE}%\n`);
}
