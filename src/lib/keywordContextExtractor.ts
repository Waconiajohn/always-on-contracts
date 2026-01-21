// =====================================================
// KEYWORD CONTEXT EXTRACTOR
// =====================================================
// Extracts sentence-level context for keywords from documents
// Enables comparison of HOW keywords are used, not just IF they exist
// =====================================================

export interface KeywordContext {
  keyword: string;
  jdContext: string | null;
  resumeContext: string | null;
  contextMatch: "strong" | "weak" | "missing";
}

export interface ContextExtractionResult {
  strongMatches: KeywordContext[];
  weakMatches: KeywordContext[];
  missing: KeywordContext[];
  stats: {
    total: number;
    strong: number;
    weak: number;
    missing: number;
  };
}

/**
 * Extract the sentence containing a keyword from text
 */
function extractSentence(text: string, keyword: string): string | null {
  if (!text || !keyword) return null;
  
  const lowerText = text.toLowerCase();
  const lowerKeyword = keyword.toLowerCase();
  
  if (!lowerText.includes(lowerKeyword)) return null;
  
  // Split into sentences (handle common abbreviations)
  const sentences = text
    .replace(/([.!?])\s+/g, "$1|SPLIT|")
    .split("|SPLIT|")
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  // Find the sentence containing the keyword
  for (const sentence of sentences) {
    if (sentence.toLowerCase().includes(lowerKeyword)) {
      // Truncate if too long (keep keyword in context)
      if (sentence.length > 150) {
        const keywordIndex = sentence.toLowerCase().indexOf(lowerKeyword);
        const start = Math.max(0, keywordIndex - 60);
        const end = Math.min(sentence.length, keywordIndex + keyword.length + 60);
        const truncated = sentence.slice(start, end);
        return (start > 0 ? "..." : "") + truncated + (end < sentence.length ? "..." : "");
      }
      return sentence;
    }
  }
  
  return null;
}

/**
 * Analyze context quality using heuristics
 * Strong: Both have action verbs/metrics near keyword
 * Weak: JD has action context, resume is passive/listing
 * Missing: Keyword not in resume
 */
function analyzeContextMatch(
  jdContext: string | null,
  resumeContext: string | null
): "strong" | "weak" | "missing" {
  if (!resumeContext) return "missing";
  if (!jdContext) return "strong"; // If not in JD but in resume, consider it found
  
  // Action verbs that indicate strong context
  const actionVerbs = [
    "led", "managed", "developed", "created", "implemented", "achieved",
    "increased", "reduced", "delivered", "built", "designed", "launched",
    "drove", "transformed", "optimized", "executed", "spearheaded"
  ];
  
  // Check for metrics/numbers
  const hasMetrics = (text: string) => /\d+%|\$\d+|\d+\s*(million|billion|k|users|clients|projects)/i.test(text);
  
  // Check for action verbs
  const hasActionVerb = (text: string) => {
    const lower = text.toLowerCase();
    return actionVerbs.some(verb => lower.includes(verb));
  };
  
  const jdHasAction = hasActionVerb(jdContext);
  const resumeHasAction = hasActionVerb(resumeContext);
  const resumeHasMetrics = hasMetrics(resumeContext);
  
  // Strong: Resume has action verbs OR metrics
  if (resumeHasAction || resumeHasMetrics) return "strong";
  
  // Weak: JD expects action but resume is passive
  if (jdHasAction && !resumeHasAction) return "weak";
  
  // Default to strong if both are similar style
  return "strong";
}

/**
 * Extract contextual analysis for all keywords
 */
export function extractKeywordContexts(
  keywordsFound: string[],
  keywordsMissing: string[],
  jobDescription: string,
  resumeText: string
): ContextExtractionResult {
  const strongMatches: KeywordContext[] = [];
  const weakMatches: KeywordContext[] = [];
  const missing: KeywordContext[] = [];
  
  // Analyze found keywords
  for (const keyword of keywordsFound) {
    const jdContext = extractSentence(jobDescription, keyword);
    const resumeContext = extractSentence(resumeText, keyword);
    const contextMatch = analyzeContextMatch(jdContext, resumeContext);
    
    const context: KeywordContext = {
      keyword,
      jdContext,
      resumeContext,
      contextMatch,
    };
    
    if (contextMatch === "strong") {
      strongMatches.push(context);
    } else if (contextMatch === "weak") {
      weakMatches.push(context);
    } else {
      missing.push(context);
    }
  }
  
  // Add missing keywords
  for (const keyword of keywordsMissing) {
    const jdContext = extractSentence(jobDescription, keyword);
    missing.push({
      keyword,
      jdContext,
      resumeContext: null,
      contextMatch: "missing",
    });
  }
  
  return {
    strongMatches,
    weakMatches,
    missing,
    stats: {
      total: keywordsFound.length + keywordsMissing.length,
      strong: strongMatches.length,
      weak: weakMatches.length,
      missing: missing.length,
    },
  };
}

/**
 * Highlight keyword in text with a marker
 */
export function highlightKeyword(text: string, keyword: string): string {
  if (!text || !keyword) return text || "";
  
  const regex = new RegExp(`(${keyword})`, "gi");
  return text.replace(regex, "**$1**");
}
