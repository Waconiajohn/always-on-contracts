/**
 * Robust JSON Parsing for AI Responses
 */

import { ZodSchema } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export interface ParseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Extract JSON from AI response with multiple fallback strategies
 */
export function extractJSON<T = any>(
  content: string,
  schema?: ZodSchema<T>
): ParseResult<T> {
  // Pre-process: Remove <think> tags from reasoning models
  let cleanedContent = content;
  const thinkTagMatch = cleanedContent.match(/<think>[\s\S]*?<\/think>\s*/g);
  if (thinkTagMatch) {
    cleanedContent = cleanedContent.replace(/<think>[\s\S]*?<\/think>\s*/g, '').trim();
  }
  
  // Strategy 1: Direct parse
  try {
    const parsed = JSON.parse(cleanedContent);
    if (schema) {
      const validated = schema.safeParse(parsed);
      if (validated.success) {
        return { success: true, data: validated.data };
      }
      return { success: false, error: `Schema validation failed: ${validated.error.message}` };
    }
    return { success: true, data: parsed };
  } catch {
    // Continue to next strategy
  }

  // Strategy 2: Extract from markdown code blocks
  const codeBlockMatch = cleanedContent.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    try {
      const parsed = JSON.parse(codeBlockMatch[1].trim());
      if (schema) {
        const validated = schema.safeParse(parsed);
        if (validated.success) {
          return { success: true, data: validated.data };
        }
      } else {
        return { success: true, data: parsed };
      }
    } catch {
      // Continue to next strategy
    }
  }

  // Strategy 3: Find JSON object/array in text (more aggressive)
  // Try to find the largest JSON object first
  const findLargestJson = (text: string): string | null => {
    let largestJson: string | null = null;
    let maxLength = 0;
    
    // Find all potential JSON objects (starting with { and ending with })
    let braceCount = 0;
    let startIdx = -1;
    
    for (let i = 0; i < text.length; i++) {
      if (text[i] === '{') {
        if (braceCount === 0) startIdx = i;
        braceCount++;
      } else if (text[i] === '}') {
        braceCount--;
        if (braceCount === 0 && startIdx !== -1) {
          const candidate = text.substring(startIdx, i + 1);
          if (candidate.length > maxLength) {
            try {
              JSON.parse(candidate); // Verify it's valid
              largestJson = candidate;
              maxLength = candidate.length;
            } catch {
              // Invalid JSON, continue
            }
          }
        }
      }
    }
    
    return largestJson;
  };
  
  const largestJson = findLargestJson(cleanedContent);
  if (largestJson) {
    try {
      const parsed = JSON.parse(largestJson);
      if (schema) {
        const validated = schema.safeParse(parsed);
        if (validated.success) {
          return { success: true, data: validated.data };
        }
      } else {
        return { success: true, data: parsed };
      }
    } catch {
      // Continue to next strategy
    }
  }
  
  // Fallback: Original regex approach
  const jsonObjectMatch = cleanedContent.match(/\{[\s\S]*\}/);
  const jsonArrayMatch = cleanedContent.match(/\[[\s\S]*\]/);
  
  for (const match of [jsonObjectMatch, jsonArrayMatch]) {
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        if (schema) {
          const validated = schema.safeParse(parsed);
          if (validated.success) {
            return { success: true, data: validated.data };
          }
        } else {
          return { success: true, data: parsed };
        }
      } catch {
        // Continue
      }
    }
  }

  // Strategy 4: Clean and retry
  const cleaned = cleanAIFormatting(content);
  if (cleaned !== content) {
    try {
      const parsed = JSON.parse(cleaned);
      if (schema) {
        const validated = schema.safeParse(parsed);
        if (validated.success) {
          return { success: true, data: validated.data };
        }
      } else {
        return { success: true, data: parsed };
      }
    } catch {
      // All strategies failed
    }
  }

  return {
    success: false,
    error: 'Could not extract valid JSON from response'
  };
}

/**
 * Clean common AI formatting issues
 */
function cleanAIFormatting(text: string): string {
  return text
    // Remove citation markers
    .replace(/\[\d+\]/g, '')
    .replace(/\[citation:\d+\]/g, '')
    // Remove markdown formatting
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    // Fix escaped quotes
    .replace(/\\"/g, '"')
    // Remove trailing commas
    .replace(/,(\s*[}\]])/g, '$1')
    // Remove comments
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*/g, '')
    .trim();
}

/**
 * Parse AI tool call response
 */
export function extractToolCallJSON<T = any>(
  response: any,
  toolName: string,
  schema?: ZodSchema<T>
): ParseResult<T> {
  try {
    // Check for tool_calls array
    if (response.choices?.[0]?.message?.tool_calls) {
      const toolCall = response.choices[0].message.tool_calls.find(
        (tc: any) => tc.function?.name === toolName
      );
      
      if (toolCall?.function?.arguments) {
        const parsed = typeof toolCall.function.arguments === 'string'
          ? JSON.parse(toolCall.function.arguments)
          : toolCall.function.arguments;
        
        if (schema) {
          const validated = schema.safeParse(parsed);
          if (validated.success) {
            return { success: true, data: validated.data };
          }
          return { success: false, error: `Schema validation failed: ${validated.error.message}` };
        }
        return { success: true, data: parsed };
      }
    }
    
    // Fallback: extract from content
    const content = response.choices?.[0]?.message?.content || '';
    return extractJSON<T>(content, schema);
  } catch (error) {
    return {
      success: false,
      error: `Tool call extraction failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Validate and extract array from response
 */
export function extractArray<T = any>(
  content: string,
  itemSchema?: ZodSchema<T>
): ParseResult<T[]> {
  const result = extractJSON<T[]>(content);
  
  if (!result.success || !result.data) {
    return result;
  }
  
  if (!Array.isArray(result.data)) {
    return {
      success: false,
      error: 'Extracted data is not an array'
    };
  }
  
  if (itemSchema) {
    const validated = result.data.map(item => itemSchema.safeParse(item));
    const errors = validated.filter(v => !v.success);
    
    if (errors.length > 0) {
      return {
        success: false,
        error: `Array validation failed for ${errors.length} items`
      };
    }
    
    return {
      success: true,
      data: validated.map(v => (v as any).data)
    };
  }
  
  return result;
}
