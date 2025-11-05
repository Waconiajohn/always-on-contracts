/**
 * Test Suite: Error Handling and Retry Logic
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { 
  handlePerplexityError, 
  retryWithBackoff, 
  calculateBackoff,
  AIError
} from '../_shared/error-handling.ts';
import { mockErrors, createRetryTestScenario } from './test-helpers.ts';

// ============================================================================
// Error Classification Tests
// ============================================================================

Deno.test("handlePerplexityError - Rate Limit (429)", () => {
  const error = mockErrors.rateLimit();
  const result = handlePerplexityError(error);
  
  assertEquals(result.code, 'RATE_LIMIT');
  assertEquals(result.statusCode, 429);
  assertEquals(result.retryable, true);
  assertExists(result.retryAfter);
  assertEquals(result.userMessage?.includes('wait'), true);
});

Deno.test("handlePerplexityError - Payment Required (402)", () => {
  const error = mockErrors.paymentRequired();
  const result = handlePerplexityError(error);
  
  assertEquals(result.code, 'PAYMENT_REQUIRED');
  assertEquals(result.statusCode, 402);
  assertEquals(result.retryable, false);
  assertEquals(result.userMessage?.includes('credits'), true);
});

Deno.test("handlePerplexityError - Timeout", () => {
  const error = mockErrors.timeout();
  const result = handlePerplexityError(error);
  
  assertEquals(result.code, 'TIMEOUT');
  assertEquals(result.statusCode, 408);
  assertEquals(result.retryable, true);
});

Deno.test("handlePerplexityError - Invalid JSON", () => {
  const error = mockErrors.invalidJson();
  const result = handlePerplexityError(error);
  
  assertEquals(result.code, 'INVALID_RESPONSE');
  assertEquals(result.retryable, true);
});

Deno.test("handlePerplexityError - Server Error (500)", () => {
  const error = mockErrors.serverError();
  const result = handlePerplexityError(error);
  
  assertEquals(result.code, 'API_ERROR');
  assertEquals(result.statusCode, 500);
  assertEquals(result.retryable, true);
});

Deno.test("handlePerplexityError - Generic Error", () => {
  const error = new Error("Unknown error occurred");
  const result = handlePerplexityError(error);
  
  assertEquals(result.code, 'API_ERROR');
  assertEquals(result.retryable, true);
  assertExists(result.userMessage);
});

// ============================================================================
// Backoff Calculation Tests
// ============================================================================

Deno.test("calculateBackoff - Exponential Growth", () => {
  const delay0 = calculateBackoff(0, 1000);
  const delay1 = calculateBackoff(1, 1000);
  const delay2 = calculateBackoff(2, 1000);
  
  // Should grow exponentially
  assertEquals(delay0 < delay1, true);
  assertEquals(delay1 < delay2, true);
  
  // Should respect max delay
  const delay10 = calculateBackoff(10, 1000, 5000);
  assertEquals(delay10 <= 5000 * 1.25, true); // Account for jitter
});

Deno.test("calculateBackoff - Jitter Variation", () => {
  const delays = Array.from({ length: 10 }, () => calculateBackoff(2, 1000));
  
  // All delays should be different due to jitter
  const uniqueDelays = new Set(delays);
  assertEquals(uniqueDelays.size > 1, true, "Jitter should create variation");
  
  // All should be within reasonable range (base * 2^attempt ± 25%)
  const expectedBase = 1000 * Math.pow(2, 2); // 4000
  delays.forEach(delay => {
    assertEquals(delay >= expectedBase * 0.75, true);
    assertEquals(delay <= expectedBase * 1.25, true);
  });
});

// ============================================================================
// Retry Logic Tests
// ============================================================================

Deno.test("retryWithBackoff - Success on First Try", async () => {
  const scenario = createRetryTestScenario(1);
  
  const result = await retryWithBackoff(scenario.mockFn, 3);
  
  assertEquals(scenario.getAttemptCount(), 1);
  assertExists(result);
});

Deno.test("retryWithBackoff - Success on Third Try", async () => {
  const scenario = createRetryTestScenario(3);
  
  const result = await retryWithBackoff(scenario.mockFn, 3);
  
  assertEquals(scenario.getAttemptCount(), 3);
  assertExists(result);
});

Deno.test("retryWithBackoff - Max Retries Exceeded", async () => {
  const scenario = createRetryTestScenario(10); // Will never succeed
  
  let error: any;
  try {
    await retryWithBackoff(scenario.mockFn, 3);
  } catch (e) {
    error = e;
  }
  
  assertExists(error);
  assertEquals(scenario.getAttemptCount(), 4); // Initial + 3 retries
});

Deno.test("retryWithBackoff - Non-Retryable Error", async () => {
  const paymentError = mockErrors.paymentRequired();
  const aiError = handlePerplexityError(paymentError);
  
  const mockFn = async () => {
    throw aiError;
  };
  
  let caughtError: any;
  try {
    await retryWithBackoff(mockFn, 3);
  } catch (e) {
    caughtError = e;
  }
  
  assertExists(caughtError);
  assertEquals(caughtError.retryable, false);
  assertEquals(caughtError.code, 'PAYMENT_REQUIRED');
});

Deno.test("retryWithBackoff - Retry Callback Invoked", async () => {
  const scenario = createRetryTestScenario(3);
  const retryCallbacks: number[] = [];
  
  await retryWithBackoff(
    scenario.mockFn,
    3,
    (attempt, error) => {
      retryCallbacks.push(attempt);
    }
  );
  
  assertEquals(retryCallbacks, [1, 2], "Callback should be called for each retry");
});

Deno.test("retryWithBackoff - Timing Verification", async () => {
  const scenario = createRetryTestScenario(2);
  
  const startTime = Date.now();
  await retryWithBackoff(scenario.mockFn, 3);
  const duration = Date.now() - startTime;
  
  // Should have waited at least the backoff delay
  // First retry: ~1000ms, so total should be > 500ms
  assertEquals(duration > 500, true, "Should wait before retrying");
});

// ============================================================================
// AIError Class Tests
// ============================================================================

Deno.test("AIError - Constructor Properties", () => {
  const error = new AIError(
    "Test error",
    'RATE_LIMIT',
    429,
    true,
    "User-friendly message",
    60
  );
  
  assertEquals(error.message, "Test error");
  assertEquals(error.code, 'RATE_LIMIT');
  assertEquals(error.statusCode, 429);
  assertEquals(error.retryable, true);
  assertEquals(error.userMessage, "User-friendly message");
  assertEquals(error.retryAfter, 60);
  assertEquals(error.name, 'AIError');
});

Deno.test("AIError - Default Values", () => {
  const error = new AIError("Simple error", 'API_ERROR');
  
  assertEquals(error.retryable, false); // Default
  assertEquals(error.statusCode, undefined);
  assertEquals(error.userMessage, undefined);
  assertEquals(error.retryAfter, undefined);
});

console.log("✅ All error handling tests completed");
