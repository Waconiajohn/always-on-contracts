// src/components/resume-builder/CanonicalResumePreview.tsx

import React, { useMemo, useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  builderStateToCanonicalResume,
  canonicalResumeToHTML,
} from "@/lib/resumeSerialization";
import { BuilderResumeSection } from "@/lib/resumeModel";
import { renderResumeWithTemplate } from "@/lib/resumeTemplateRenderer";
import { getFormat } from "@/lib/resumeFormats";

interface CanonicalResumePreviewProps {
  /**
   * User profile from vault/auth – we only need name/headline/contact,
   * but keep this loose to avoid type drama.
   */
  userProfile: any;
  /**
   * The resumeSections array that InteractiveResumeBuilder already maintains.
   */
  resumeSections: any[];
  /**
   * Optional – what job this resume is targeting. Useful for small labels.
   */
  jobTitle?: string;
  /**
   * If the builder is still loading / generating content.
   */
  isLoading?: boolean;
  /**
   * Selected format ID to apply template styling
   */
  selectedFormatId?: string;
}

/**
 * Helper to map current builder sections into BuilderResumeSection[]
 * in the same way the export pipeline expects.
 */
function mapToBuilderSections(rawSections: any[]): BuilderResumeSection[] {
  return (rawSections ?? []).map((section: any) => ({
    id: section.id ?? section.sectionId ?? crypto.randomUUID(),
    type: section.type ?? section.sectionType ?? section.title ?? "Other",
    title: section.title ?? section.type ?? "Section",
    order: section.order ?? 0,
    items: (section.items ?? section.content ?? []).map((item: any, idx: number) => ({
      id: item.id ?? `${section.id ?? "section"}-item-${idx}`,
      content: typeof item === "string" ? item : item.content ?? "",
      order: item.order ?? idx,
    })),
  }));
}

/**
 * Extract just the <body> contents from the full HTML string so
 * we can embed it cleanly inside the app.
 */
function extractBody(html: string): string {
  const match = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (match && match[1]) {
    return match[1].trim();
  }
  return html;
}

export const CanonicalResumePreview: React.FC<CanonicalResumePreviewProps> = ({
  userProfile,
  resumeSections,
  jobTitle,
  isLoading,
  selectedFormatId,
}) => {
  const [templateHtml, setTemplateHtml] = useState<string>("");
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);

  const canonical = useMemo(() => {
    if (!resumeSections || resumeSections.length === 0) {
      return null;
    }

    const builderSections = mapToBuilderSections(resumeSections);
    return builderStateToCanonicalResume({
      userProfile,
      sections: builderSections,
    });
  }, [userProfile, resumeSections]);

  useEffect(() => {
    const loadTemplate = async () => {
      if (!canonical) {
        setTemplateHtml("");
        return;
      }

      // If no format selected or format doesn't have templateId, use default HTML
      if (!selectedFormatId) {
        const fullHtml = canonicalResumeToHTML(canonical);
        setTemplateHtml(extractBody(fullHtml));
        return;
      }

      const format = getFormat(selectedFormatId);
      if (!format || !format.templateId) {
        const fullHtml = canonicalResumeToHTML(canonical);
        setTemplateHtml(extractBody(fullHtml));
        return;
      }

      // Apply template
      setIsLoadingTemplate(true);
      try {
        const styledHtml = await renderResumeWithTemplate(canonical, format.templateId);
        setTemplateHtml(extractBody(styledHtml));
      } catch (error) {
        console.error('[PREVIEW] Error rendering template:', error);
        const fullHtml = canonicalResumeToHTML(canonical);
        setTemplateHtml(extractBody(fullHtml));
      } finally {
        setIsLoadingTemplate(false);
      }
    };

    loadTemplate();
  }, [canonical, selectedFormatId]);

  const headerSummary = useMemo(() => {
    if (!canonical) return "";
    const name = canonical.header.fullName || "";
    const headline = canonical.header.headline || "";
    const contact = canonical.header.contactLine || "";
    return [name, headline, contact].filter(Boolean).join(" • ");
  }, [canonical]);

  if (isLoading || isLoadingTemplate) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Resume preview</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {isLoadingTemplate ? 'Applying template styling…' : 'Generating your resume layout…'}
        </CardContent>
      </Card>
    );
  }

  if (!canonical) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Resume preview</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Once you select a job and start building, we'll show the resume layout here
          using the same structure we use for ATS-friendly exports.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="border-b">
        <CardTitle className="flex flex-col gap-1">
          <span>Resume preview</span>
          {jobTitle && (
            <span className="text-xs font-normal text-muted-foreground">
              Targeting: {jobTitle}
            </span>
          )}
          {headerSummary && (
            <span className="text-[11px] font-normal text-muted-foreground">
              {headerSummary}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="bg-muted/30">
        <div className="border bg-white shadow-sm rounded-md max-h-[70vh] overflow-auto p-6">
          {/* We intentionally use the same HTML the export pipeline uses,
             so preview == exported result. */}
          <div
            className="text-[12px] leading-snug"
            dangerouslySetInnerHTML={{ __html: templateHtml }}
          />
        </div>
      </CardContent>
    </Card>
  );
};
