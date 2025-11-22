import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CanonicalResume } from "@/lib/resumeModel";
import { Loader2 } from "lucide-react";

interface LiveResumeCanvasProps {
  resumeData: CanonicalResume;
  templateId: string;
  activeSectionId?: string;
  onSectionClick: (sectionId: string) => void;
  scale?: number;
}

export function LiveResumeCanvas({
  resumeData,
  templateId,
  activeSectionId,
  onSectionClick,
  scale = 0.8
}: LiveResumeCanvasProps) {
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [cssContent, setCssContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTemplate = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('resume_templates')
          .select('html_structure, css_styles')
          .eq('id', templateId)
          .maybeSingle();

        if (error || !data) {
          console.error('Error fetching template:', error);
          return;
        }

        setCssContent(data.css_styles || "");
        
        // Process HTML
        let processedHtml = data.html_structure || "";
        
        // Inject Header
        processedHtml = processedHtml.replace(/\{\{fullName\}\}/g, escapeHtml(resumeData.header.fullName));
        processedHtml = processedHtml.replace(/\{\{headline\}\}/g, escapeHtml(resumeData.header.headline || ''));
        processedHtml = processedHtml.replace(/\{\{contactLine\}\}/g, escapeHtml(resumeData.header.contactLine || ''));

        // Inject Sections
        const sectionsHtml = resumeData.sections
          .map(section => {
            const heading = escapeHtml(section.heading);
            const content = section.paragraph 
              ? `<p class="section-paragraph">${escapeHtml(section.paragraph)}</p>`
              : section.bullets.length > 0
                ? `<ul class="section-bullets">${section.bullets.map(b => {
                    const text = typeof b === 'string' ? b : b.content;
                    return `<li class="section-bullet">${escapeHtml(text)}</li>`;
                  }).join('')}</ul>`
                : '';

            // Add data-section-id for interactivity
            // We assume the template style expects a container class like "resume-section"
            // If the template is strict, we might need to be careful where we add the attribute.
            // Ideally, we wrap it in a div if not already, but let's assume standard structure.
            
            return `
              <div class="resume-section ${activeSectionId === section.id ? 'active-section-highlight' : ''}" data-section-id="${section.id}">
                <h2 class="section-heading">${heading}</h2>
                ${content}
              </div>
            `;
          })
          .join('\n');

        processedHtml = processedHtml.replace(/\{\{sections\}\}/g, sectionsHtml);
        setHtmlContent(processedHtml);

      } catch (error) {
        console.error('Template processing error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplate();
  }, [resumeData, templateId, activeSectionId]);

  // Handle clicks via delegation
  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const sectionEl = target.closest('[data-section-id]');
    if (sectionEl) {
      const sectionId = sectionEl.getAttribute('data-section-id');
      if (sectionId) {
        onSectionClick(sectionId);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-gray-100 overflow-auto p-8 flex justify-center">
      {/* Shadow DOM or Iframe would be safer, but simple div works for trusted content */}
      <div 
        ref={containerRef}
        className="bg-white shadow-2xl transition-transform origin-top"
        style={{
          width: '210mm', // A4 width
          minHeight: '297mm', // A4 height
          transform: `scale(${scale})`,
          marginBottom: `${(1 - scale) * 100}%` // Compensate for scale
        }}
        onClick={handleClick}
      >
        <style>{`
          ${cssContent}
          /* Interactive Overrides */
          .resume-section {
            position: relative;
            cursor: pointer;
            border: 2px solid transparent;
            transition: all 0.2s ease;
            border-radius: 4px;
          }
          .resume-section:hover {
            border-color: rgba(59, 130, 246, 0.5); /* Blue-500 with opacity */
            background-color: rgba(59, 130, 246, 0.05);
          }
          .active-section-highlight {
            border-color: #3b82f6 !important; /* Blue-500 */
            background-color: rgba(59, 130, 246, 0.1) !important;
          }
        `}</style>
        <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
      </div>
    </div>
  );
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
