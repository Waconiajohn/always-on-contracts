import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as pdfjs from 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.6.82/build/pdf.min.mjs';
import * as pdfjsworker from 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.6.82/build/pdf.worker.min.mjs';
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';

// Force import of worker
type PDFWorker = typeof pdfjsworker;
pdfjs.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.6.82/build/pdf.worker.min.mjs";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const contentType = req.headers.get('content-type') || '';
    let fileData = '';
    let fileName = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        return new Response(
          JSON.stringify({ success: false, error: 'No file provided' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      fileName = file.name.toLowerCase();
      const arrayBuffer = await file.arrayBuffer();
      fileData = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    } else {
      const body = await req.json();
      fileData = body.fileData;
      fileName = body.fileName?.toLowerCase() || '';
    }

    console.log('Parsing resume file:', fileName);

    // Validate base64 data
    const cleanBase64 = (str: string): string => {
      // Remove whitespace and newlines
      return str.replace(/\s/g, '');
    };

    const isValidBase64 = (str: string): boolean => {
      try {
        const cleaned = cleanBase64(str);
        // Check if it matches base64 pattern
        const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
        if (!base64Regex.test(cleaned)) {
          return false;
        }
        // Try to decode a small portion
        atob(cleaned.slice(0, Math.min(100, cleaned.length)));
        return true;
      } catch {
        return false;
      }
    };

    if (!fileData || fileData.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No file data provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!isValidBase64(fileData)) {
      console.error('Invalid base64 data received, length:', fileData.length);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid file data format. Please try re-uploading your resume.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const cleanedFileData = cleanBase64(fileData);
    let extractedText = '';

    // Handle text files
    if (fileName.endsWith('.txt')) {
      try {
        extractedText = atob(cleanedFileData);
      } catch (err) {
        console.error('Failed to decode text file:', err);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Failed to read text file. Please ensure the file is not corrupted.' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
    }
    // Handle PDF files with pdfjs
    else if (fileName.endsWith('.pdf')) {
      console.log('Parsing PDF with pdfjs library...');
      
      try {
        // Convert base64 to Uint8Array
        const binaryString = atob(cleanedFileData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Parse PDF with pdfjs
        const loadingTask = pdfjs.getDocument({ data: bytes });
        const pdfDocument = await loadingTask.promise;
        
        if (!pdfDocument) {
          throw new Error("Failed to load PDF document");
        }
        
        // Extract text from all pages
        let fullText = '';
        for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
          const page = await pdfDocument.getPage(pageNum);
          const textContent = await page.getTextContent({ includeMarkedContent: false });
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
          fullText += pageText + '\n\n';
        }
        
        extractedText = fullText.trim();
        
        if (!extractedText || extractedText.length < 50) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'No text found in PDF. This might be a scanned document or image-based PDF. Please try converting it to text first or paste the content directly.' 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
        
        console.log('Successfully parsed PDF, extracted text length:', extractedText.length);
      } catch (pdfError: any) {
        console.error('PDF parsing error:', pdfError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Failed to parse PDF: ${pdfError.message}. If this is a scanned PDF, please convert it to text first or paste the content directly.` 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    }
    // For DOC/DOCX files, use Perplexity AI
    else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      console.log('Parsing Word document with Perplexity AI...');

      try {
        const { response: aiResponse, metrics } = await callPerplexity({
          messages: [
            {
              role: 'system',
              content: 'You are a document text extractor. Extract all text content from documents and return only the plain text without any formatting or commentary.'
            },
            {
              role: 'user',
              content: `Please extract all text from this Word document and return only the plain text content.\n\nBase64 data length: ${fileData.length} characters`
            }
          ],
          model: PERPLEXITY_MODELS.DEFAULT,
          max_tokens: 4000,
        }, 'parse-resume-docx', 'system');

        await logAIUsage(metrics);

        extractedText = cleanCitations(aiResponse.choices?.[0]?.message?.content || '');

        if (!extractedText || extractedText.length < 50) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Could not extract readable text from Word document. Please ensure the file contains text content or try converting to PDF.' 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        console.log('Successfully extracted text from Word document, length:', extractedText.length);
      } catch (docError: any) {
        console.error('Word document parsing error:', docError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Failed to process Word document. Please try converting to PDF format.' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    } else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Unsupported file type. Please use PDF, DOCX, or TXT files.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!extractedText || extractedText.trim().length < 50) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Could not extract meaningful text from the file. Please ensure the file contains text content.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Sanitize the text to remove problematic characters
    const sanitizedText = extractedText
      .replace(/\u0000/g, '') // Remove null bytes
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') // Remove other control characters
      .trim();

    console.log('Successfully extracted text, length:', sanitizedText.length);

    // Validate if the document is actually a resume
    const isLikelyResume = (text: string): boolean => {
      const resumeIndicators = [
        /experience|employment|work history|professional background|career|positions?/i,
        /education|degree|university|college|academic|certifications?/i,
        /skills|proficiencies|expertise|competencies|technical|technologies/i,
        /objective|summary|profile|about|background/i,
        /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}/i, // Date patterns common in resumes
        /\b(manager|engineer|developer|analyst|specialist|coordinator|director|consultant)/i // Job titles
      ];
      
      const contractIndicators = [
        /agreement|contract|terms and conditions/i,
        /whereas|parties|witnesseth/i,
        /confidential|non-disclosure/i
      ];
      
      const resumeMatches = resumeIndicators.filter(r => r.test(text)).length;
      const contractMatches = contractIndicators.filter(r => r.test(text)).length;
      
      // More lenient: require only 1 match if no contract indicators, or more resume than contract indicators
      return contractMatches === 0 ? resumeMatches >= 1 : resumeMatches > contractMatches;
    };

    if (!isLikelyResume(sanitizedText)) {
      console.log('Document rejected: does not appear to be a resume');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'The uploaded document does not appear to be a resume. Please upload a proper resume document containing your work experience, education, and skills.'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        text: sanitizedText
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error parsing resume:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse resume file'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
