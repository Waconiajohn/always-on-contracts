/**
 * Standardized AI Response Handler
 * 
 * Provides consistent error handling, validation, and logging for all AI function calls.
 * Use this wrapper to ensure compliance with AI prompt standards.
 */

import { extractJSON } from './json-parser.ts';

export interface ParseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ValidationRule {
  field: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  arrayType?: 'string' | 'number' | 'object';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
}

export interface AIResponseHandlerOptions<T> {
  functionName: string;
  rawResponse: string;
  validationRules: ValidationRule[];
  logFullResponse?: boolean;
}

/**
 * Standardized AI response handler with validation and logging
 */
export function handleAIResponse<T>(
  options: AIResponseHandlerOptions<T>
): ParseResult<T> {
  const { functionName, rawResponse, validationRules, logFullResponse = false } = options;

  // 1. Log raw response (first 500 chars for debugging)
  console.log(`[${functionName}] Raw AI response:`, rawResponse.substring(0, 500));
  
  if (logFullResponse) {
    console.log(`[${functionName}] Full response:`, rawResponse);
  }

  // 2. Parse JSON
  const parseResult = extractJSON(rawResponse);

  if (!parseResult.success || !parseResult.data) {
    console.error(`[${functionName}] JSON parse failed:`, parseResult.error);
    console.error(`[${functionName}] Full response:`, rawResponse);
    return {
      success: false,
      error: `Failed to parse AI response: ${parseResult.error}`
    };
  }

  // 3. Validate structure
  const data = parseResult.data;
  const validationErrors = validateResponse(data, validationRules);

  if (validationErrors.length > 0) {
    console.error(`[${functionName}] Validation failed:`, validationErrors);
    console.error(`[${functionName}] Received data:`, JSON.stringify(data, null, 2));
    return {
      success: false,
      error: `AI response validation failed: ${validationErrors.join(', ')}`
    };
  }

  console.log(`[${functionName}] Response validated successfully`);
  
  return {
    success: true,
    data: data as T
  };
}

/**
 * Validate response data against defined rules
 */
function validateResponse(data: any, rules: ValidationRule[]): string[] {
  const errors: string[] = [];

  for (const rule of rules) {
    const value = data[rule.field];

    // Check required fields
    if (rule.required && (value === undefined || value === null)) {
      errors.push(`Missing required field: ${rule.field}`);
      continue;
    }

    // Skip optional fields that are not present
    if (!rule.required && (value === undefined || value === null)) {
      continue;
    }

    // Type validation
    switch (rule.type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push(`Field ${rule.field} must be a string, got ${typeof value}`);
        } else {
          if (rule.minLength && value.length < rule.minLength) {
            errors.push(`Field ${rule.field} must be at least ${rule.minLength} characters`);
          }
          if (rule.maxLength && value.length > rule.maxLength) {
            errors.push(`Field ${rule.field} must be at most ${rule.maxLength} characters`);
          }
        }
        break;

      case 'number':
        if (typeof value !== 'number') {
          errors.push(`Field ${rule.field} must be a number, got ${typeof value}`);
        } else {
          if (rule.min !== undefined && value < rule.min) {
            errors.push(`Field ${rule.field} must be at least ${rule.min}`);
          }
          if (rule.max !== undefined && value > rule.max) {
            errors.push(`Field ${rule.field} must be at most ${rule.max}`);
          }
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push(`Field ${rule.field} must be a boolean, got ${typeof value}`);
        }
        break;

      case 'array':
        if (!Array.isArray(value)) {
          errors.push(`Field ${rule.field} must be an array, got ${typeof value}`);
        } else {
          if (rule.minLength && value.length < rule.minLength) {
            errors.push(`Field ${rule.field} must have at least ${rule.minLength} items`);
          }
          if (rule.maxLength && value.length > rule.maxLength) {
            errors.push(`Field ${rule.field} must have at most ${rule.maxLength} items`);
          }
          // Validate array item types if specified
          if (rule.arrayType) {
            for (let i = 0; i < value.length; i++) {
              const item = value[i];
              if (rule.arrayType === 'object' && (typeof item !== 'object' || item === null)) {
                errors.push(`Field ${rule.field}[${i}] must be an object`);
              } else if (rule.arrayType !== 'object' && typeof item !== rule.arrayType) {
                errors.push(`Field ${rule.field}[${i}] must be a ${rule.arrayType}`);
              }
            }
          }
        }
        break;

      case 'object':
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          errors.push(`Field ${rule.field} must be an object, got ${typeof value}`);
        }
        break;
    }
  }

  return errors;
}

/**
 * Helper function to create validation rules
 */
export function createValidationRules(
  rules: Partial<ValidationRule>[]
): ValidationRule[] {
  return rules.map(rule => ({
    field: rule.field || '',
    type: rule.type || 'string',
    required: rule.required ?? true,
    arrayType: rule.arrayType,
    minLength: rule.minLength,
    maxLength: rule.maxLength,
    min: rule.min,
    max: rule.max,
  }));
}

/**
 * Example usage:
 * 
 * const validationRules = createValidationRules([
 *   { field: 'enhanced_content', type: 'string', required: true, minLength: 10 },
 *   { field: 'new_tier', type: 'string', required: true },
 *   { field: 'confidence_score', type: 'number', required: false, min: 0, max: 1 },
 *   { field: 'improvements_made', type: 'array', required: true, arrayType: 'string', minLength: 1 }
 * ]);
 * 
 * const result = handleAIResponse<MyResponseType>({
 *   functionName: 'my-function',
 *   rawResponse: response.choices[0].message.content,
 *   validationRules,
 *   logFullResponse: false
 * });
 * 
 * if (!result.success) {
 *   throw new Error(result.error);
 * }
 * 
 * const data = result.data; // Fully validated and typed
 */
