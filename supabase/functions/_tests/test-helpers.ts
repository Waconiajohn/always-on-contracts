/**
 * Test Helpers for Edge Function Testing
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.168.0/testing/asserts.ts";

export interface MockPerplexityResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Create mock Perplexity response
 */
export function createMockPerplexityResponse(content: string | object): MockPerplexityResponse {
  const contentString = typeof content === 'string' ? content : JSON.stringify(content);
  return {
    choices: [{
      message: {
        content: contentString
      }
    }],
    usage: {
      prompt_tokens: 100,
      completion_tokens: 200
    }
  };
}

/**
 * Create mock request with auth
 */
export function createMockRequest(body: any, userId: string = 'test-user-123'): Request {
  return new Request('http://localhost:8000', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer mock-token-${userId}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
}

/**
 * Mock Supabase client
 */
export class MockSupabaseClient {
  private mockData: any = {};
  
  setMockData(table: string, data: any) {
    this.mockData[table] = data;
  }

  auth = {
    getUser: async (token: string) => {
      return {
        data: { user: { id: token.replace('mock-token-', '') } },
        error: null
      };
    }
  };

  from(table: string) {
    return {
      select: () => this,
      insert: (data: any) => ({
        select: () => ({
          single: async () => ({
            data: this.mockData[table] || data,
            error: null
          })
        })
      }),
      single: async () => ({
        data: this.mockData[table],
        error: null
      }),
      eq: () => this,
      gte: () => this,
      order: () => this,
      limit: () => this
    };
  }

  functions = {
    invoke: async (name: string, options: any) => ({
      data: { success: true },
      error: null
    })
  };
}

/**
 * Test schema validation
 */
export async function testSchemaValidation(
  schema: any,
  validData: any,
  invalidData: any
) {
  // Test valid data
  const validResult = schema.safeParse(validData);
  assertEquals(validResult.success, true, 'Valid data should pass schema validation');

  // Test invalid data
  const invalidResult = schema.safeParse(invalidData);
  assertEquals(invalidResult.success, false, 'Invalid data should fail schema validation');
  assertExists(invalidResult.error, 'Invalid data should return error');
}

/**
 * Test retry logic
 */
export function createRetryTestScenario(
  shouldSucceedOnAttempt: number,
  maxRetries: number = 3
) {
  let attemptCount = 0;
  
  return {
    mockFn: async () => {
      attemptCount++;
      if (attemptCount < shouldSucceedOnAttempt) {
        throw new Error(`Attempt ${attemptCount} failed`);
      }
      return createMockPerplexityResponse({ success: true, attempt: attemptCount });
    },
    getAttemptCount: () => attemptCount,
    reset: () => { attemptCount = 0; }
  };
}

/**
 * Test error handling
 */
export const mockErrors = {
  rateLimit: () => {
    const error: any = new Error('Rate limit exceeded');
    error.status = 429;
    return error;
  },
  paymentRequired: () => {
    const error: any = new Error('Payment required');
    error.status = 402;
    return error;
  },
  timeout: () => {
    const error: any = new Error('Request timeout');
    error.code = 'ETIMEDOUT';
    return error;
  },
  invalidJson: () => {
    return new Error('Unexpected token in JSON');
  },
  serverError: () => {
    const error: any = new Error('Internal server error');
    error.status = 500;
    return error;
  }
};

/**
 * Assert response structure
 */
export function assertValidResponse(response: Response, expectedStatus: number = 200) {
  assertEquals(response.status, expectedStatus, `Response status should be ${expectedStatus}`);
  assertEquals(
    response.headers.get('Content-Type'),
    'application/json',
    'Response should be JSON'
  );
  assertExists(response.headers.get('Access-Control-Allow-Origin'), 'CORS headers should be set');
}

/**
 * Assert error response structure
 */
export async function assertErrorResponse(
  response: Response,
  expectedStatus: number,
  shouldContain?: string
) {
  assertValidResponse(response, expectedStatus);
  const body = await response.json();
  assertEquals(body.success, false, 'Error response should have success: false');
  assertExists(body.error, 'Error response should contain error message');
  
  if (shouldContain) {
    const errorText = JSON.stringify(body.error).toLowerCase();
    assertEquals(
      errorText.includes(shouldContain.toLowerCase()),
      true,
      `Error should contain "${shouldContain}"`
    );
  }
}

/**
 * Measure execution time
 */
export async function measureExecutionTime<T>(fn: () => Promise<T>): Promise<{ result: T; durationMs: number }> {
  const start = Date.now();
  const result = await fn();
  const durationMs = Date.now() - start;
  return { result, durationMs };
}
