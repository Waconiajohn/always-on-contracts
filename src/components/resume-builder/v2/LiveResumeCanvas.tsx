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

        // Inject Sections with metadata
        const sectionsHtml = resumeData.sections
          .map(section => {
            const heading = escapeHtml(section.heading);
            const content = section.paragraph 
              ? `<p class="section-paragraph">${escapeHtml(section.paragraph)}</p>`
              : section.bullets.length > 0
                ? `<ul class="section-bullets">${section.bullets.map((b, idx) => {
                    const bulletObj = typeof b === 'string' ? { id: `bullet-${idx}`, content: b } : b;
                    const meta = bulletObj.meta || {};
                    
                    // Build data attributes for traceability
                    const dataAttrs = [
                      `data-bullet-id="${bulletObj.id || idx}"`,
                      meta.requirementText ? `data-requirement="${escapeHtml(meta.requirementText)}"` : '',
                      meta.matchScore ? `data-match-score="${meta.matchScore}"` : '',
                      meta.matchStrength ? `data-match-strength="${meta.matchStrength}"` : '',
                      meta.originalSource?.company ? `data-source="${escapeHtml(meta.originalSource.company)}"` : '',
                      meta.originalSource?.jobTitle ? `data-job-title="${escapeHtml(meta.originalSource.jobTitle)}"` : ''
                    ].filter(Boolean).join(' ');
                    
                    return `<li class="section-bullet" ${dataAttrs}>${escapeHtml(bulletObj.content)}</li>`;
                  }).join('')}</ul>`
                : '';

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
            border-color: rgba(59, 130, 246, 0.5);
            background-color: rgba(59, 130, 246, 0.05);
          }
          .active-section-highlight {
            border-color: #3b82f6 !important;
            background-color: rgba(59, 130, 246, 0.1) !important;
          }
          
          /* Bullet Hover Tooltips */
          .section-bullet {
            position: relative;
            cursor: help;
          }
          .section-bullet[data-requirement]:hover::before {
            content: "📋 " attr(data-requirement) " • Match: " attr(data-match-score) "% • From: " attr(data-source);
            position: absolute;
            bottom: 100%;
            left: 0;
            background: hsl(var(--popover));
            color: hsl(var(--popover-foreground));
            padding: 8px 12px;
            border-radius: 6px;
            border: 1px solid hsl(var(--border));
            font-size: 11px;
            white-space: nowrap;
            z-index: 1000;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            animation: fadeIn 0.2s ease-in;
          }
          .section-bullet[data-match-strength="Gold"]::after {
            content: "🥇";
            margin-left: 4px;
            font-size: 0.9em;
          }
          .section-bullet[data-match-strength="Silver"]::after {
            content: "🥈";
            margin-left: 4px;
            font-size: 0.9em;
          }
          .section-bullet[data-match-strength="Bronze"]::after {
            content: "🥉";
            margin-left: 4px;
            font-size: 0.9em;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(5px); }
            to { opacity: 1; transform: translateY(0); }
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
