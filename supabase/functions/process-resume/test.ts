// Phase 5.2: Unit Test Infrastructure
import { assertEquals, assertExists } from "https://deno.land/std@0.168.0/testing/asserts.ts";

// Mock the extractTextFromWordXml function for testing
function extractTextFromWordXml(xml: string, preserveStructure: boolean = true): string {
  const paragraphs: string[] = [];
  const paragraphPattern = /<w:p[^>]*>(.*?)<\/w:p>/gs;
  let paragraphMatch;

  while ((paragraphMatch = paragraphPattern.exec(xml)) !== null) {
    const paragraphXml = paragraphMatch[1];
    const textPattern = /<w:t(?:\s+[^>]*)?>(.*?)<\/w:t>/gs;
    let textMatch;
    const paragraphText: string[] = [];

    while ((textMatch = textPattern.exec(paragraphXml)) !== null) {
      const text = textMatch[1];
      if (text) {
        const decodedText = text
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'");
        paragraphText.push(decodedText);
      }
    }

    if (paragraphText.length > 0) {
      paragraphs.push(paragraphText.join(' ').trim());
    }
  }

  if (preserveStructure) {
    return paragraphs.join('\n\n').trim();
  } else {
    return paragraphs.join(' ').trim();
  }
}

function validateFile(file: any, fileSize: number): { valid: boolean; error?: string } {
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain'
  ];

  if (fileSize > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'File size exceeds 10MB limit'
    };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Unsupported file format'
    };
  }

  return { valid: true };
}

Deno.test("extractTextFromWordXml - basic text extraction", () => {
  const xml = `
    <w:document>
      <w:body>
        <w:p><w:r><w:t>John Doe</w:t></w:r></w:p>
        <w:p><w:r><w:t>Software Engineer</w:t></w:r></w:p>
      </w:body>
    </w:document>
  `;
  
  const result = extractTextFromWordXml(xml);
  assertExists(result);
  assertEquals(result.includes("John Doe"), true);
  assertEquals(result.includes("Software Engineer"), true);
});

Deno.test("extractTextFromWordXml - XML entity decoding", () => {
  const xml = `<w:p><w:r><w:t>5 &gt; 3 &amp; &lt;test&gt;</w:t></w:r></w:p>`;
  const result = extractTextFromWordXml(xml);
  assertEquals(result, "5 > 3 & <test>");
});

Deno.test("extractTextFromWordXml - structure preservation", () => {
  const xml = `
    <w:p><w:r><w:t>First paragraph</w:t></w:r></w:p>
    <w:p><w:r><w:t>Second paragraph</w:t></w:r></w:p>
  `;
  const result = extractTextFromWordXml(xml, true);
  assertEquals(result, "First paragraph\n\nSecond paragraph");
});

Deno.test("validateFile - file size limit", () => {
  const largeFile = { type: 'application/pdf', name: 'test.pdf' };
  const validation = validateFile(largeFile, 15 * 1024 * 1024); // 15MB
  
  assertEquals(validation.valid, false);
  assertEquals(validation.error?.includes('10MB'), true);
});

Deno.test("validateFile - valid PDF file", () => {
  const validFile = { type: 'application/pdf', name: 'test.pdf' };
  const validation = validateFile(validFile, 5 * 1024 * 1024); // 5MB
  
  assertEquals(validation.valid, true);
});

Deno.test("validateFile - unsupported format", () => {
  const invalidFile = { type: 'image/png', name: 'image.png' };
  const validation = validateFile(invalidFile, 1 * 1024 * 1024);
  
  assertEquals(validation.valid, false);
  assertEquals(validation.error, 'Unsupported file format');
});
