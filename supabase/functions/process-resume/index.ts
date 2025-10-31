import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import "https://deno.land/x/xhr@0.3.0/mod.ts";
import { getDocumentProxy } from "https://esm.sh/unpdf@0.11.0";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Phase 1.3: Robust Text Cleanup
function robustTextCleanup(text: string): string {
  return text
    .normalize('NFKC')
    .replace(/â€™/g, "'")
    .replace(/â€"/g, "—")
    .replace(/â€œ/g, '"')
    .replace(/â€/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Phase 2.3: Generate Content Hash
async function generateContentHash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Phase 2.2: Circuit Breaker
class AICircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private threshold: number = 3;
  private timeout: number = 60000; // 1 minute

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.failures >= this.threshold && Date.now() - this.lastFailureTime < this.timeout) {
      throw new Error('AI service temporarily unavailable. Please try again in a few moments.');
    }
    
    try {
      const result = await fn();
      this.failures = 0;
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();
      throw error;
    }
  }
}

const circuitBreaker = new AICircuitBreaker();

// Phase 4.1: Intelligent Error Solutions
const ERROR_SOLUTIONS: Record<string, { message: string; solutions: string[] }> = {
  'scanned_pdf': {
    message: 'This appears to be a scanned PDF with no selectable text',
    solutions: [
      'Try using a PDF with selectable text instead',
      'Convert to Word format (.docx) first',
      'Re-scan the document with OCR enabled'
    ]
  },
  'insufficient_content': {
    message: 'Resume appears incomplete or too short',
    solutions: [
      'Ensure all pages were included in the upload',
      'Check for blank pages in your document',
      'Try uploading a different format'
    ]
  },
  'parsing_failed': {
    message: 'Unable to extract text from document',
    solutions: [
      'Try converting to PDF format',
      'Ensure document is not password protected',
      'Use plain text format (.txt) as an alternative'
    ]
  },
  'not_a_resume': {
    message: 'This document does not appear to be a resume',
    solutions: [
      'Ensure you uploaded the correct file',
      'Check that the document contains work experience and skills',
      'Try uploading a standard resume format'
    ]
  },
  'ai_analysis_failed': {
    message: 'AI analysis encountered an error',
    solutions: [
      'The AI service may be temporarily busy',
      'Try again in a few moments',
      'Contact support if the issue persists'
    ]
  },
  'rate_limit_exceeded': {
    message: 'Upload limit reached',
    solutions: [
      'You have reached your hourly upload limit',
      'Please wait before uploading more resumes',
      'Upgrade to premium for higher limits'
    ]
  }
};

// Phase 3.3: Check Rate Limit
async function checkRateLimit(supabase: any, userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const windowStart = new Date();
  windowStart.setHours(windowStart.getHours() - 1);
  
  const { data: limits, error } = await supabase
    .from('rate_limits')
    .select('request_count')
    .eq('user_id', userId)
    .eq('endpoint', 'process-resume')
    .gte('window_start', windowStart.toISOString());

  if (error) {
    console.error('Rate limit check error:', error);
    return { allowed: true, remaining: 100 }; // Fail open
  }

  const totalRequests = limits?.reduce((sum: number, l: any) => sum + l.request_count, 0) || 0;
  const maxRequests = 100; // TODO: Make this tier-based
  
  return {
    allowed: totalRequests < maxRequests,
    remaining: Math.max(0, maxRequests - totalRequests)
  };
}

// Phase 3.3: Record Rate Limit
async function recordRateLimit(supabase: any, userId: string) {
  const windowStart = new Date();
  windowStart.setMinutes(0, 0, 0);
  const windowEnd = new Date(windowStart);
  windowEnd.setHours(windowEnd.getHours() + 1);

  await supabase
    .from('rate_limits')
    .upsert({
      user_id: userId,
      endpoint: 'process-resume',
      window_start: windowStart.toISOString(),
      window_end: windowEnd.toISOString(),
      request_count: 1
    }, {
      onConflict: 'user_id,endpoint,window_start',
      ignoreDuplicates: false
    });
}

// Phase 1.1: Document Parser with pdf-parse and smart fallback
async function parseFile(base64Data: string, fileType: string, apiKey: string): Promise<string> {
  console.log(`[parseFile] Starting to parse file of type: ${fileType}`);
  
  try {
    // For plain text files, decode directly (no AI needed - faster and free)
    if (fileType === 'text/plain' || fileType.includes('txt')) {
      console.log('[parseFile] Plain text file detected, decoding directly');
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return new TextDecoder().decode(bytes);
    }

    // For PDF files - use unpdf library with smart fallback to AI vision for scanned PDFs
    if (fileType.includes('pdf')) {
      console.log('[parseFile] PDF detected, attempting direct text extraction');
      
      try {
        // Convert base64 to Uint8Array
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Parse PDF with unpdf
        const pdf = await getDocumentProxy(bytes);
        const numPages = pdf.numPages;
        
        console.log(`[parseFile] PDF has ${numPages} pages, extracting text...`);
        
        // Extract text from all pages
        let fullText = '';
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str || '')
            .join(' ');
          fullText += pageText + '\n';
        }
        
        const extractedText = fullText.trim();
        
        // Smart fallback: if we extracted very little text, it's likely a scanned PDF
        if (extractedText.length < 100) {
          console.log('[parseFile] Extracted minimal text from PDF, likely scanned - falling back to AI vision');
          return await extractWithVisionAI(base64Data, fileType, apiKey);
        }
        
        console.log(`[parseFile] Successfully extracted ${extractedText.length} characters from PDF using unpdf`);
        return extractedText;
        
      } catch (pdfError: any) {
        console.error('[parseFile] unpdf failed:', pdfError);
        console.log('[parseFile] Falling back to AI vision');
        return await extractWithVisionAI(base64Data, fileType, apiKey);
      }
    }

    // For DOCX files - parse XML structure directly
    if (fileType.includes('word') || fileType.includes('docx') || fileType.includes('doc')) {
      console.log('[parseFile] Word document detected, parsing XML structure');
      
      try {
        // Convert base64 to buffer
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        const zip = await JSZip.loadAsync(bytes);
        const documentXml = await zip.file('word/document.xml')?.async('string');
        
        if (!documentXml) {
          throw new Error('Unable to find document.xml in DOCX');
        }
        
        // Extract text from XML (basic extraction)
        const textMatches = documentXml.match(/<w:t[^>]*>([^<]+)<\/w:t>/g) || [];
        const extractedText = textMatches
          .map(match => match.replace(/<[^>]+>/g, ''))
          .join(' ')
          .trim();
        
        if (extractedText.length < 100) {
          console.log('[parseFile] Extracted minimal text from DOCX - falling back to AI vision');
          return await extractWithVisionAI(base64Data, fileType, apiKey);
        }
        
        console.log(`[parseFile] Successfully extracted ${extractedText.length} characters from DOCX`);
        return extractedText;
        
      } catch (docxError: any) {
        console.error('[parseFile] DOCX parsing failed:', docxError);
        console.log('[parseFile] Falling back to AI vision');
        return await extractWithVisionAI(base64Data, fileType, apiKey);
      }
    }

    // Unsupported file type
    throw new Error(`Unsupported file type: ${fileType}. Please upload PDF, Word (.docx), or text files.`);
    
  } catch (error: any) {
    console.error('[parseFile] Error during file parsing:', error);
    throw error;
  }
}

// Helper function for AI vision extraction (fallback for scanned documents)
async function extractWithVisionAI(base64Data: string, fileType: string, apiKey: string): Promise<string> {
  console.log('[extractWithVisionAI] Using Lovable AI vision for text extraction');
  
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Extract all text content from this document image. Return ONLY the extracted text without any additional commentary, formatting, or explanations. Preserve the original structure and formatting as much as possible.'
          },
          {
            type: 'inline_data',
            inline_data: {
              mime_type: fileType,
              data: base64Data
            }
          }
        ]
      }],
      max_tokens: 4000
    })
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('AI service rate limit reached. Please try again in a few moments.');
    }
    if (response.status === 402) {
      throw new Error('AI service payment required. Please contact support.');
    }
    const errorText = await response.text();
    throw new Error(`AI extraction failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const extractedText = data.choices?.[0]?.message?.content;

  if (!extractedText || extractedText.trim().length < 50) {
    console.log('[extractWithVisionAI] AI extracted minimal or no text');
    throw new Error('Unable to extract sufficient text from document. The document may be blank, corrupted, or contain only images without text.');
  }

  console.log(`[extractWithVisionAI] Successfully extracted ${extractedText.length} characters using AI vision`);
  return extractedText;
}

// Phase 1.2: Detect binary data in text field (for backward compatibility)
function detectBinaryData(text: string): { isBinary: boolean; type?: string } {
  if (text.startsWith('%PDF-')) {
    return { isBinary: true, type: 'pdf' };
  }
  if (text.startsWith('PK\x03\x04') || text.includes('word/')) {
    return { isBinary: true, type: 'docx' };
  }
  // Check for high percentage of non-printable characters
  const nonPrintable = text.split('').filter(c => {
    const code = c.charCodeAt(0);
    return code < 32 && code !== 9 && code !== 10 && code !== 13;
  }).length;
  
  if (nonPrintable > text.length * 0.1) {
    return { isBinary: true, type: 'unknown' };
  }
  
  return { isBinary: false };
}

// Phase 1.3: AI-Powered Resume Validation
async function validateIsResume(text: string, apiKey: string): Promise<{
  isResume: boolean;
  confidence: number;
  reason: string;
}> {
  try {
    const response = await circuitBreaker.call(() => 
      fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          max_tokens: 1024,
          messages: [
            {
              role: "system",
              content: "You are a resume classifier. Respond with structured JSON only."
            },
            {
              role: "user",
              content: `Analyze if this is a professional resume/CV. Look for: contact info, work history, education, skills.

TEXT (first 5000 chars):
${text.substring(0, 5000)}

Respond with confidence 0.0-1.0 and brief reason.`
            }
          ],
          tools: [{
            type: "function",
            function: {
              name: "classify_document",
              parameters: {
                type: "object",
                properties: {
                  isResume: { type: "boolean" },
                  confidence: { type: "number" },
                  reason: { type: "string" }
                },
                required: ["isResume", "confidence", "reason"]
              }
            }
          }],
          tool_choice: { type: "function", function: { name: "classify_document" } }
        }),
      })
    );

    if (!response.ok) throw new Error('Validation failed');
    
    const data = await response.json();
    const result = JSON.parse(data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments || '{}');
    return result;
  } catch (error) {
    // Fallback to keyword-based validation
    const resumeIndicators = [
      /experience|employment|work history|professional background|career/i,
      /education|degree|university|college|academic/i,
      /skills|proficiencies|expertise|competencies/i,
      /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}/i,
      /\b(manager|engineer|developer|analyst|specialist|coordinator|director|consultant)/i
    ];
    
    const matches = resumeIndicators.filter(r => r.test(text)).length;
    return {
      isResume: matches >= 2,
      confidence: matches / resumeIndicators.length,
      reason: matches >= 2 ? 'Contains resume indicators' : 'Missing key resume sections'
    };
  }
}

// Phase 5.3: Smart Default Handling
function estimateYearsFromText(text: string): number {
  const datePattern = /\b(19|20)\d{2}\b/g;
  const years = text.match(datePattern)?.map(y => parseInt(y)).sort() || [];
  if (years.length >= 2) {
    return new Date().getFullYear() - Math.min(...years);
  }
  return 0;
}

function estimateHourlyRate(text: string, years: number): { min: number; max: number } {
  // Base rate estimation from experience
  const baseRate = 50 + (years * 5);
  const min = Math.max(50, baseRate - 20);
  const max = Math.min(250, baseRate + 30);
  
  // Adjust for seniority indicators
  if (/(senior|lead|principal|architect|director)/i.test(text)) {
    return { min: Math.max(100, min + 25), max: max + 50 };
  }
  if (/(manager|head of|vp|chief)/i.test(text)) {
    return { min: Math.max(125, min + 50), max: max + 75 };
  }
  
  return { min, max };
}

// Phase 5.1: Multi-Pass Analysis with Confidence Scoring
async function multiPassAnalysis(
  text: string,
  apiKey: string,
  userId: string,
  maxRetries = 2
): Promise<any> {
  let lastError: Error | null = null;
  
  // First pass: Basic extraction (fast)
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await circuitBreaker.call(() =>
        fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            max_tokens: 4096,
            messages: [
              {
                role: "system",
                content: "You are an expert resume analyzer. Always respond with valid JSON and provide confidence scores."
              },
              {
                role: "user",
                content: `Analyze this resume comprehensively. Extract all data with confidence scores.

CRITICAL INSTRUCTIONS:
1. Extract the candidate's CURRENT OR MOST RECENT job title as "current_role" (e.g., "Senior Drilling Engineer", "VP of Engineering", "Product Manager")
2. Identify the PRIMARY INDUSTRY from their work history as "primary_industry" (e.g., "Oil & Gas", "Technology", "Healthcare", "Financial Services")
3. Extract EXACT employment dates in YYYY-MM format
4. Calculate total years_experience by summing all employment periods
5. Quantify ALL achievements with numbers, percentages, or metrics
6. Identify contract/freelance indicators
7. For each field, provide confidence: "high" (>80%), "medium" (50-80%), "low" (<50%)

EXAMPLES:
- If resume shows "Senior Drilling Engineer at Halliburton" → current_role: "Senior Drilling Engineer", primary_industry: "Oil & Gas"
- If resume shows "VP Engineering at Stripe" → current_role: "VP Engineering", primary_industry: "FinTech"
- If resume shows "Product Manager at Kaiser Permanente" → current_role: "Product Manager", primary_industry: "Healthcare"

RESUME TEXT:
${text}

Focus on: current_role (REQUIRED), primary_industry (REQUIRED), years_experience, key_achievements (quantified), industry_expertise, management_capabilities, skills, target_hourly_rate_min, target_hourly_rate_max, recommended_positions, analysis_summary.

Provide confidence_scores object with confidence level for each major field.`
              }
            ],
            tools: [{
              type: "function",
              function: {
                name: "analyze_resume",
                description: "Extract structured resume data with confidence scoring",
                parameters: {
                  type: "object",
                  properties: {
                    current_role: { 
                      type: "string",
                      description: "The candidate's current or most recent job title (e.g., 'Senior Drilling Engineer', 'VP Engineering')"
                    },
                    primary_industry: { 
                      type: "string",
                      description: "The candidate's primary industry based on work history (e.g., 'Oil & Gas', 'Technology', 'Healthcare')"
                    },
                    years_experience: { type: "number" },
                    key_achievements: { type: "array", items: { type: "string" } },
                    industry_expertise: { type: "array", items: { type: "string" } },
                    management_capabilities: { type: "array", items: { type: "string" } },
                    skills: { type: "array", items: { type: "string" } },
                    target_hourly_rate_min: { type: "number" },
                    target_hourly_rate_max: { type: "number" },
                    recommended_positions: { type: "array", items: { type: "string" } },
                    analysis_summary: { type: "string" },
                    confidence_scores: {
                      type: "object",
                      properties: {
                        current_role: { type: "string" },
                        primary_industry: { type: "string" },
                        years_experience: { type: "string" },
                        skills: { type: "string" },
                        achievements: { type: "string" },
                        rates: { type: "string" },
                        overall: { type: "string" }
                      }
                    },
                    data_quality_issues: {
                      type: "array",
                      items: { type: "string" }
                    }
                  },
                  required: ["current_role", "primary_industry", "years_experience", "key_achievements", "industry_expertise", "skills", "analysis_summary"]
                }
              }
            }],
            tool_choice: { type: "function", function: { name: "analyze_resume" } }
          }),
        })
      );

      if (!response.ok) {
        throw new Error(`AI analysis failed: ${response.status}`);
      }

      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      
      if (!toolCall) {
        throw new Error("No analysis returned from AI");
      }

      // Log what we received from AI for debugging
      console.log('[multiPassAnalysis] Tool call received:', {
        hasToolCall: !!toolCall,
        hasFunctionArgs: !!toolCall?.function?.arguments,
        firstChars: toolCall?.function?.arguments?.substring(0, 100) || 'NO ARGS'
      });

      let analysis;
      const rawArgs = toolCall.function.arguments;
      
      try {
        // First, try to parse as-is
        analysis = JSON.parse(rawArgs);
        console.log('[multiPassAnalysis] Successfully parsed JSON on first attempt');
      } catch (parseError: any) {
        console.error('[multiPassAnalysis] Initial parse failed:', parseError.message);
        console.error('[multiPassAnalysis] Raw args (first 800 chars):', rawArgs.substring(0, 800));
        console.error('[multiPassAnalysis] Raw args (last 200 chars):', rawArgs.substring(Math.max(0, rawArgs.length - 200)));
        
        // Aggressive cleanup for malformed JSON
        try {
          let cleaned = rawArgs;
          
          // Remove any leading garbage (anything before first { or [)
          const firstBrace = cleaned.indexOf('{');
          const firstBracket = cleaned.indexOf('[');
          let startPos = -1;
          if (firstBrace !== -1 && firstBracket !== -1) {
            startPos = Math.min(firstBrace, firstBracket);
          } else if (firstBrace !== -1) {
            startPos = firstBrace;
          } else if (firstBracket !== -1) {
            startPos = firstBracket;
          }
          
          if (startPos > 0) {
            console.log(`[multiPassAnalysis] Removing ${startPos} leading chars`);
            cleaned = cleaned.substring(startPos);
          }
          
          // Remove any trailing garbage (anything after last } or ])
          const lastBrace = cleaned.lastIndexOf('}');
          const lastBracket = cleaned.lastIndexOf(']');
          let endPos = -1;
          if (lastBrace !== -1 && lastBracket !== -1) {
            endPos = Math.max(lastBrace, lastBracket);
          } else if (lastBrace !== -1) {
            endPos = lastBrace;
          } else if (lastBracket !== -1) {
            endPos = lastBracket;
          }
          
          if (endPos !== -1 && endPos < cleaned.length - 1) {
            console.log(`[multiPassAnalysis] Removing ${cleaned.length - endPos - 1} trailing chars`);
            cleaned = cleaned.substring(0, endPos + 1);
          }
          
          // Fix common JSON issues
          cleaned = cleaned
            .replace(/,(\s*[}\]])/g, '$1')    // Remove trailing commas
            .replace(/\n/g, ' ')               // Remove newlines
            .replace(/\r/g, '')                // Remove carriage returns
            .replace(/\t/g, ' ')               // Replace tabs with spaces
            .replace(/\s+/g, ' ')              // Collapse multiple spaces
            .trim();
          
          console.log('[multiPassAnalysis] Cleaned JSON (first 500 chars):', cleaned.substring(0, 500));
          analysis = JSON.parse(cleaned);
          console.log('[multiPassAnalysis] Successfully parsed after cleanup');
        } catch (cleanError: any) {
          console.error('[multiPassAnalysis] Cleanup also failed:', cleanError.message);
          console.error('[multiPassAnalysis] This was attempt', attempt, 'of', maxRetries);
          
          // If not last attempt, retry
          if (attempt < maxRetries) {
            const delay = attempt * 2000; // 2s, 4s, 6s
            console.log(`[multiPassAnalysis] Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            throw new Error(`Retrying after JSON parse failure (attempt ${attempt}/${maxRetries})`);
          }
          
          // Last attempt failed - return error to user
          throw new Error('Unable to process resume format. Please try converting to PDF or pasting text directly.');
        }
      }
      
      // Phase 5.3: Apply smart defaults for missing data
      const yearsEstimate = estimateYearsFromText(text);
      const rateEstimate = estimateHourlyRate(text, analysis.years_experience || yearsEstimate);
      
      return {
        ...analysis,
        years_experience: analysis.years_experience || yearsEstimate,
        target_hourly_rate_min: analysis.target_hourly_rate_min || rateEstimate.min,
        target_hourly_rate_max: analysis.target_hourly_rate_max || rateEstimate.max,
        skills: analysis.skills?.length > 0 ? analysis.skills : extractBasicSkills(text),
        confidence_scores: analysis.confidence_scores || {
          overall: 'medium'
        }
      };
    } catch (error) {
      lastError = error as Error;
      console.error(`[multiPassAnalysis] Attempt ${attempt + 1}/${maxRetries + 1} failed:`, lastError.message);
      
      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`[multiPassAnalysis] Waiting ${waitTime}ms before retry ${attempt + 2}`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError || new Error('Analysis failed after retries');
}

// Phase 5.3: Basic skills extraction fallback
function extractBasicSkills(text: string): string[] {
  const commonSkills = [
    'Leadership', 'Project Management', 'Team Management', 'Strategic Planning',
    'Communication', 'Problem Solving', 'Analysis', 'Planning', 'Budgeting',
    'Microsoft Office', 'Excel', 'PowerPoint', 'Data Analysis'
  ];
  
  return commonSkills.filter(skill => 
    new RegExp(skill, 'i').test(text)
  ).slice(0, 10);
}

// Phase 4: Regex-based fallback for role and industry extraction
function extractRoleAndIndustryFallback(text: string): { role: string | null; industry: string | null } {
  // Common job titles to search for
  const jobTitlePatterns = [
    /\b(Senior|Lead|Principal|Staff|Chief)\s+([\w\s]+?)\s+Engineer\b/i,
    /\b(VP|Vice President|Director|Manager|Head)\s+of\s+([\w\s]+)\b/i,
    /\b(Senior|Lead|Principal)\s+([\w\s]+?)\s+(Manager|Developer|Designer|Analyst|Architect)\b/i,
    /\b([\w\s]+?)\s+(Engineer|Manager|Director|Developer|Designer|Analyst|Architect|Specialist)\b/i,
    /\b(CTO|CEO|COO|CMO|CFO|CIO)\b/i
  ];

  // Common industries to search for
  const industryKeywords: Record<string, RegExp[]> = {
    "Oil & Gas": [/\b(oil|gas|petroleum|drilling|exploration|energy|upstream|downstream|oilfield)\b/i, /\b(halliburton|schlumberger|baker hughes|weatherford|chevron|exxon|shell|bp)\b/i],
    "Technology": [/\b(software|technology|tech|saas|cloud|platform|digital)\b/i, /\b(google|microsoft|amazon|facebook|apple|meta|netflix)\b/i],
    "FinTech": [/\b(fintech|payments|banking|financial services|crypto|blockchain|trading)\b/i, /\b(stripe|paypal|square|coinbase|robinhood)\b/i],
    "Healthcare": [/\b(healthcare|medical|hospital|pharma|biotech|clinical|patient)\b/i, /\b(kaiser|mayo|pfizer|moderna|medtronic)\b/i],
    "E-commerce": [/\b(e-commerce|ecommerce|retail|marketplace|shopping)\b/i, /\b(amazon|shopify|ebay|etsy|walmart)\b/i],
    "Manufacturing": [/\b(manufacturing|production|industrial|factory|automotive)\b/i, /\b(tesla|ford|gm|boeing|caterpillar)\b/i],
    "Consulting": [/\b(consulting|advisory|strategy|professional services)\b/i, /\b(mckinsey|bain|bcg|deloitte|accenture|pwc)\b/i],
    "Finance": [/\b(finance|investment|banking|asset management|private equity|venture capital)\b/i, /\b(goldman|morgan|jpmorgan|blackrock|vanguard)\b/i]
  };

  let detectedRole: string | null = null;
  let detectedIndustry: string | null = null;

  // Try to find job title
  for (const pattern of jobTitlePatterns) {
    const match = text.match(pattern);
    if (match) {
      detectedRole = match[0].trim();
      break;
    }
  }

  // Try to find industry (count matches for each industry)
  const industryScores: Record<string, number> = {};
  for (const [industry, patterns] of Object.entries(industryKeywords)) {
    let score = 0;
    for (const pattern of patterns) {
      const matches = text.match(new RegExp(pattern, 'gi'));
      if (matches) {
        score += matches.length;
      }
    }
    if (score > 0) {
      industryScores[industry] = score;
    }
  }

  // Pick the industry with the highest score
  if (Object.keys(industryScores).length > 0) {
    detectedIndustry = Object.entries(industryScores)
      .sort(([, a], [, b]) => b - a)[0][0];
  }

  return { role: detectedRole, industry: detectedIndustry };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  let queueId: string | null = null;
  let userId: string | null = null;

  try {
    console.log('[PROCESS-RESUME] Starting - content-type:', req.headers.get('content-type'));
    
    const contentType = req.headers.get('content-type') || '';
    let fileText: string | undefined = undefined;
    let fileData: string | undefined = undefined;
    let fileName: string = '';
    let fileSize: number = 0;
    let fileType: string = '';
    let reqUserId: string = '';

    // Handle FormData (from file upload)
    if (contentType.includes('multipart/form-data')) {
      console.log('[PROCESS-RESUME] Parsing FormData');
      const formData = await req.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        throw new Error('No file found in FormData');
      }
      
      // Convert file to base64
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      fileData = btoa(String.fromCharCode(...uint8Array));
      fileName = file.name;
      fileSize = file.size;
      fileType = file.type || 'application/octet-stream';
      
      // Get userId from JWT token
      const authHeader = req.headers.get('authorization');
      if (!authHeader) {
        throw new Error('No authorization header found');
      }
      
      const token = authHeader.replace('Bearer ', '');
      const payload = JSON.parse(atob(token.split('.')[1]));
      reqUserId = payload.sub;
      
      console.log('[PROCESS-RESUME] FormData parsed - file:', fileName, 'size:', fileSize, 'type:', fileType);
    } else {
      // Handle JSON (backward compatibility)
      console.log('[PROCESS-RESUME] Parsing JSON');
      const body = await req.json();
      ({ fileText, fileData, fileName, fileSize, fileType, userId: reqUserId } = body);
      console.log('[PROCESS-RESUME] JSON parsed - file:', fileName);
    }
    
    userId = reqUserId;

    if (!fileName || !userId) {
      throw new Error("Missing required fields: fileName and userId are required");
    }

    if (!fileText && !fileData) {
      throw new Error("Missing required fields: either fileText or fileData must be provided");
    }

    let extractedText = '';

    // Phase 1: Handle file parsing based on what was provided
    if (fileData) {
      // New method: Parse file from base64 data
      await supabase.from('resume_processing_queue')
        .insert({
          user_id: userId,
          file_name: fileName,
          file_size: fileSize || 0,
          file_type: fileType || 'unknown',
          status: 'processing',
          progress: 15
        })
        .select()
        .single()
        .then(({ data, error }) => {
          if (error) throw error;
          queueId = data.id;
        });

      // Parse the file using Lovable AI
      try {
        extractedText = await parseFile(fileData, fileType || '', LOVABLE_API_KEY);
      } catch (error: any) {
        const errorInfo = ERROR_SOLUTIONS['parsing_failed'];
        throw new Error(`${errorInfo.message}: ${error.message}`);
      }
    } else if (fileText) {
      // Legacy method: Check if text is actually binary data
      const binaryCheck = detectBinaryData(fileText);
      if (binaryCheck.isBinary) {
        const errorInfo = ERROR_SOLUTIONS['parsing_failed'];
        throw new Error(`${errorInfo.message}: Detected binary ${binaryCheck.type || 'data'} instead of text. Please send file as base64 in fileData parameter.`);
      }
      extractedText = fileText;
    }

    // Phase 3.3: Check rate limit
    const rateLimit = await checkRateLimit(supabase, userId);
    if (!rateLimit.allowed) {
      const errorInfo = ERROR_SOLUTIONS['rate_limit_exceeded'];
      return new Response(JSON.stringify({
        success: false,
        error: errorInfo.message,
        errorType: 'rate_limit_exceeded',
        solutions: errorInfo.solutions,
        remaining: 0
      }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Phase 3.2: Create queue entry (if not already created during file parsing)
    if (!queueId) {
      const { data: queueEntry, error: queueError } = await supabase
        .from('resume_processing_queue')
        .insert({
          user_id: userId,
          file_name: fileName,
          file_size: fileSize || 0,
          file_type: fileType || 'unknown',
          status: 'processing',
          progress: 10
        })
        .select()
        .single();

      if (queueError) throw queueError;
      queueId = queueEntry.id;
    }

    // Phase 1.4: Clean text
    const cleanedText = robustTextCleanup(extractedText);
    
    await supabase.from('resume_processing_queue')
      .update({ progress: 25 })
      .eq('id', queueId);

    // Phase 2.3: Generate content hash
    const contentHash = await generateContentHash(cleanedText);

    // Check cache
    const { data: cachedResult } = await supabase
      .from('resume_cache')
      .select('*')
      .eq('content_hash', contentHash)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cachedResult) {
      // Update cache hit count
      await supabase
        .from('resume_cache')
        .update({ 
          hit_count: cachedResult.hit_count + 1,
          last_accessed: new Date().toISOString()
        })
        .eq('id', cachedResult.id);

      await supabase.from('resume_processing_queue')
        .update({ 
          status: 'completed',
          progress: 100,
          completed_at: new Date().toISOString()
        })
        .eq('id', queueId);

      // Log success
      await supabase.from('processing_logs').insert({
        user_id: userId,
        queue_id: queueId,
        file_name: fileName,
        file_size: fileSize,
        file_type: fileType,
        processing_time_ms: Date.now() - startTime,
        extracted_text_length: cleanedText.length,
        success: true,
        was_cached: true,
        confidence_level: 'high'
      });

      return new Response(JSON.stringify({
        success: true,
        analysis: cachedResult.analysis_result,
        extractedText: cachedResult.extracted_text,
        cached: true,
        confidence: 'high'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    await supabase.from('resume_processing_queue')
      .update({ progress: 40 })
      .eq('id', queueId);

    // Phase 1.4: Validate document
    const validation = await validateIsResume(cleanedText, LOVABLE_API_KEY);
    
    if (!validation.isResume || validation.confidence < 0.5) {
      const errorInfo = ERROR_SOLUTIONS['not_a_resume'];
      throw new Error(`${errorInfo.message}: ${validation.reason}`);
    }

    await supabase.from('resume_processing_queue')
      .update({ progress: 60 })
      .eq('id', queueId);

    // Phase 5.1: Multi-pass analysis with confidence scoring
    const analysis = await multiPassAnalysis(cleanedText, LOVABLE_API_KEY, userId);

    await supabase.from('resume_processing_queue')
      .update({ progress: 85 })
      .eq('id', queueId);

    // Store in cache
    await supabase.from('resume_cache').insert({
      content_hash: contentHash,
      extracted_text: cleanedText,
      analysis_result: analysis,
      file_type: fileType
    });

    // Store analysis
    const { work_history, ...analysisForDb } = analysis;
    await supabase.from('resume_analysis').insert({
      user_id: userId,
      ...analysisForDb,
      years_experience: Math.round(Number(analysisForDb.years_experience || 0)),
      target_hourly_rate_min: Number(analysisForDb.target_hourly_rate_min) || null,
      target_hourly_rate_max: Number(analysisForDb.target_hourly_rate_max) || null
    });

    // Record rate limit
    await recordRateLimit(supabase, userId);

    await supabase.from('resume_processing_queue')
      .update({ 
        status: 'completed',
        progress: 100,
        completed_at: new Date().toISOString()
      })
      .eq('id', queueId);

    // Log success
    await supabase.from('processing_logs').insert({
      user_id: userId,
      queue_id: queueId,
      file_name: fileName,
      file_size: fileSize,
      file_type: fileType,
      processing_time_ms: Date.now() - startTime,
      extracted_text_length: cleanedText.length,
      success: true,
      validation_score: validation.confidence,
      confidence_level: validation.confidence > 0.8 ? 'high' : validation.confidence > 0.6 ? 'medium' : 'low'
    });

    // Extract role and industry for Career Vault redesign
    // Priority: AI extracted current_role > recommended_positions > regex fallback
    let detectedRole = analysis.current_role || analysis.recommended_positions?.[0] || null;
    let detectedIndustry = analysis.primary_industry || analysis.industry_expertise?.[0] || null;

    // Phase 4: Use regex fallback if AI didn't find role or industry
    if (!detectedRole || !detectedIndustry) {
      console.log('[PROCESS-RESUME] AI extraction incomplete, using regex fallback');
      const fallback = extractRoleAndIndustryFallback(cleanedText);
      detectedRole = detectedRole || fallback.role;
      detectedIndustry = detectedIndustry || fallback.industry;
      console.log('[PROCESS-RESUME] Fallback results:', { role: fallback.role, industry: fallback.industry });
    }

    console.log('[PROCESS-RESUME] Final detected role/industry:', { detectedRole, detectedIndustry });

    return new Response(JSON.stringify({
      success: true,
      analysis,
      extractedText: cleanedText,
      confidence: analysis.confidence_scores?.overall || 
        (validation.confidence > 0.8 ? 'high' : validation.confidence > 0.6 ? 'medium' : 'low'),
      validationReason: validation.reason,
      dataQualityIssues: analysis.data_quality_issues || [],
      confidenceBreakdown: analysis.confidence_scores,
      role: detectedRole,
      industry: detectedIndustry
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorType = Object.keys(ERROR_SOLUTIONS).find(key => 
      errorMessage.toLowerCase().includes(key.replace(/_/g, ' '))
    ) || 'parsing_failed';

    // Update queue status
    if (queueId) {
      await supabase.from('resume_processing_queue')
        .update({
          status: 'failed',
          error_message: errorMessage,
          error_type: errorType,
          completed_at: new Date().toISOString()
        })
        .eq('id', queueId);
    }

    // Log failure
    if (userId) {
      await supabase.from('processing_logs').insert({
        user_id: userId,
        queue_id: queueId,
        file_name: 'unknown',
        file_size: 0,
        file_type: 'unknown',
        processing_time_ms: Date.now() - startTime,
        success: false,
        error_type: errorType,
        error_message: errorMessage
      });
    }

    const errorInfo = ERROR_SOLUTIONS[errorType] || ERROR_SOLUTIONS['parsing_failed'];
    
    return new Response(JSON.stringify({
      success: false,
      error: errorInfo.message,
      errorType,
      solutions: errorInfo.solutions,
      details: errorMessage
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});