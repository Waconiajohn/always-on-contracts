/**
 * JSON Parser Utilities
 * Safely extract JSON from AI responses that may include markdown code blocks
 */

/**
 * Extract JSON from AI response that might be wrapped in markdown code blocks
 */
export function extractJSON(content: string): any {
  // Remove markdown code blocks if present
  let cleaned = content.trim();
  
  // Handle ```json ... ``` format
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } 
  // Handle ``` ... ``` format
  else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }

  // Try to find JSON object/array in the text
  const jsonMatch = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Failed to parse JSON from AI response:", cleaned);
    throw new Error(`Invalid JSON in AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Safely parse JSON with fallback
 */
export function safeJSONParse<T>(content: string, fallback: T): T {
  try {
    return extractJSON(content);
  } catch {
    return fallback;
  }
}
