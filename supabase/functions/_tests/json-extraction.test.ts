/**
 * Test Suite: JSON Extraction from Various AI Response Formats
 */

import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { extractJSON } from '../_shared/json-parser.ts';
import { CompetitivePositionSchema } from '../_shared/ai-response-schemas.ts';

const validCompetitivePositionData = {
  competitiveScore: 75,
  marketPosition: "Above Average",
  strengths: ["Strong experience"],
  gaps: ["Missing certification"],
  recommendations: ["Get certified"]
};

Deno.test("extractJSON - Direct JSON Parse", () => {
  const content = JSON.stringify(validCompetitivePositionData);
  const result = extractJSON(content, CompetitivePositionSchema);
  
  assertEquals(result.success, true);
  assertEquals(result.data?.competitiveScore, 75);
});

Deno.test("extractJSON - From Markdown Code Block", () => {
  const content = `Here's the analysis:

\`\`\`json
${JSON.stringify(validCompetitivePositionData, null, 2)}
\`\`\`

Hope this helps!`;

  const result = extractJSON(content, CompetitivePositionSchema);
  assertEquals(result.success, true);
  assertEquals(result.data?.competitiveScore, 75);
});

Deno.test("extractJSON - From Code Block Without Language", () => {
  const content = `\`\`\`
${JSON.stringify(validCompetitivePositionData)}
\`\`\``;

  const result = extractJSON(content, CompetitivePositionSchema);
  assertEquals(result.success, true);
});

Deno.test("extractJSON - Embedded in Text", () => {
  const content = `Based on the analysis, here are the results: ${JSON.stringify(validCompetitivePositionData)} as you can see from the data above.`;

  const result = extractJSON(content, CompetitivePositionSchema);
  assertEquals(result.success, true);
  assertEquals(result.data?.competitiveScore, 75);
});

Deno.test("extractJSON - With Citation Markers", () => {
  const dataWithCitations = {
    ...validCompetitivePositionData,
    strengths: ["Strong experience [1]", "Proven track record [2]"]
  };
  
  const content = JSON.stringify(dataWithCitations);
  const result = extractJSON(content);
  
  assertEquals(result.success, true);
  // Citations should be preserved in raw extraction
});

Deno.test("extractJSON - With Trailing Commas", () => {
  const content = `{
    "competitiveScore": 75,
    "marketPosition": "Above Average",
    "strengths": ["Test",],
    "gaps": [],
    "recommendations": ["Get certified",],
  }`;

  const result = extractJSON(content, CompetitivePositionSchema);
  assertEquals(result.success, true);
});

Deno.test("extractJSON - With Comments", () => {
  const content = `{
    // This is the competitive score
    "competitiveScore": 75,
    /* Market position comment */
    "marketPosition": "Above Average",
    "strengths": ["Test"],
    "gaps": [],
    "recommendations": []
  }`;

  const result = extractJSON(content, CompetitivePositionSchema);
  assertEquals(result.success, true);
});

Deno.test("extractJSON - Invalid JSON", () => {
  const content = "This is not JSON at all, just plain text.";
  const result = extractJSON(content, CompetitivePositionSchema);
  
  assertEquals(result.success, false);
  assertEquals(result.error?.includes('Could not extract valid JSON'), true);
});

Deno.test("extractJSON - JSON Array", () => {
  const arrayContent = JSON.stringify([validCompetitivePositionData]);
  const result = extractJSON(arrayContent);
  
  assertEquals(result.success, true);
  assertEquals(Array.isArray(result.data), true);
});

Deno.test("extractJSON - Schema Validation Failure", () => {
  const invalidData = {
    competitiveScore: 150, // Out of range
    marketPosition: "Test"
    // Missing required fields
  };
  
  const content = JSON.stringify(invalidData);
  const result = extractJSON(content, CompetitivePositionSchema);
  
  assertEquals(result.success, false);
  assertEquals(result.error?.includes('Schema validation failed'), true);
});

Deno.test("extractJSON - Nested JSON in Multiple Code Blocks", () => {
  const content = `
First block:
\`\`\`json
{"test": "wrong"}
\`\`\`

Second block (correct):
\`\`\`json
${JSON.stringify(validCompetitivePositionData)}
\`\`\`
`;

  const result = extractJSON(content, CompetitivePositionSchema);
  // Should find the first valid JSON that matches schema
  assertEquals(result.success, true);
});

Deno.test("extractJSON - Malformed Escaped Quotes", () => {
  const content = `{
    "competitiveScore": 75,
    "marketPosition": "Above \\"Average\\"",
    "strengths": ["Test"],
    "gaps": [],
    "recommendations": []
  }`;

  const result = extractJSON(content, CompetitivePositionSchema);
  assertEquals(result.success, true);
});

console.log("✅ All JSON extraction tests completed");
