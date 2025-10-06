import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as pdfjs from 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.6.82/build/pdf.min.mjs';
import * as pdfjsworker from 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.6.82/build/pdf.worker.min.mjs';

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

    let extractedText = '';

    // Handle text files
    if (fileName.endsWith('.txt')) {
      extractedText = atob(fileData);
    }
    // Handle PDF files with pdfjs
    else if (fileName.endsWith('.pdf')) {
      console.log('Parsing PDF with pdfjs library...');
      
      try {
        // Convert base64 to Uint8Array
        const binaryString = atob(fileData);
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
    // For DOC/DOCX files, use Lovable AI
    else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      
      if (!LOVABLE_API_KEY) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Service not configured. Please contact support.',
            needsConfig: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      console.log('Parsing Word document with Lovable AI...');

      try {
        // Create a simpler request focusing on text extraction
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
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
            max_tokens: 4000
          }),
        });

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          console.error('Lovable AI error:', aiResponse.status, errorText);
          
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Unable to process Word document at this time. Please try converting to PDF or using a TXT file.' 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        const aiResult = await aiResponse.json();
        extractedText = aiResult.choices?.[0]?.message?.content || '';

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
        /experience|employment|work history/i,
        /education|degree|university|college/i,
        /skills|proficiencies|expertise/i,
        /objective|summary|profile/i
      ];
      
      const contractIndicators = [
        /agreement|contract|terms and conditions/i,
        /whereas|parties|witnesseth/i,
        /confidential|non-disclosure/i
      ];
      
      const resumeMatches = resumeIndicators.filter(r => r.test(text)).length;
      const contractMatches = contractIndicators.filter(r => r.test(text)).length;
      
      return resumeMatches > contractMatches && resumeMatches >= 2;
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
