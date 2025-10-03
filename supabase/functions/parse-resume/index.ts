import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    // For PDF and DOC files, use pdf.co API for parsing
    else if (fileName.endsWith('.pdf') || fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      const PDFCO_API_KEY = Deno.env.get('PDFCO_API_KEY');
      
      if (!PDFCO_API_KEY) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Document parsing service not configured. Please contact support.',
            needsConfig: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      // Use pdf.co API to convert document to text
      const endpoint = fileName.endsWith('.pdf') 
        ? 'https://api.pdf.co/v1/pdf/convert/to/text'
        : 'https://api.pdf.co/v1/file/convert/to/text';

      const pdfCoResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': PDFCO_API_KEY,
        },
        body: JSON.stringify({
          base64: fileData,
          async: false
        }),
      });

      if (!pdfCoResponse.ok) {
        const errorText = await pdfCoResponse.text();
        console.error('PDF.co extraction error:', errorText);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Failed to parse document. Please try a different format or contact support.' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      const pdfCoResult = await pdfCoResponse.json();
      
      if (!pdfCoResult.body) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Could not extract text from document. Please try a different file.' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      extractedText = pdfCoResult.body;
    } else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Unsupported file type. Please use .txt, .pdf, .doc, or .docx files.' 
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
