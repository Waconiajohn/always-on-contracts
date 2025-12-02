/**
 * ResumeDraftPanel - Left column with color-coded elite resume draft
 */

import { ScrollArea } from '@/components/ui/scroll-area';
import { ContentBlock } from './ContentBlock';
import type { EliteResumeData, ResumeBullet } from '../types';

interface ResumeDraftPanelProps {
  resumeData: EliteResumeData;
  selectedBulletId: string | null;
  onSelectBullet: (bulletId: string) => void;
}

export function ResumeDraftPanel({
  resumeData,
  selectedBulletId,
  onSelectBullet
}: ResumeDraftPanelProps) {
  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header with contact info */}
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold mb-1">{resumeData.contactInfo.name}</h1>
        <div className="text-sm text-muted-foreground space-y-0.5">
          {resumeData.contactInfo.email && <p>{resumeData.contactInfo.email}</p>}
          {resumeData.contactInfo.phone && <p>{resumeData.contactInfo.phone}</p>}
          {resumeData.contactInfo.location && <p>{resumeData.contactInfo.location}</p>}
          {resumeData.contactInfo.linkedin && (
            <p className="text-primary">{resumeData.contactInfo.linkedin}</p>
          )}
        </div>
      </div>

      {/* Resume sections */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {resumeData.sections.map((section) => (
            <div key={section.id} className="space-y-3">
              <h2 className="text-lg font-semibold uppercase tracking-wide border-b pb-2">
                {section.title}
              </h2>

              {/* Role info for experience sections */}
              {section.roleInfo && (
                <div className="mb-3">
                  <h3 className="font-semibold">{section.roleInfo.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {section.roleInfo.company} • {section.roleInfo.dates}
                  </p>
                </div>
              )}

              {/* Paragraph content (for summary sections) */}
              {section.paragraph && (
                <ContentBlock
                  id={`${section.id}-paragraph`}
                  text={section.paragraph}
                  confidence="enhanced"
                  isSelected={selectedBulletId === `${section.id}-paragraph`}
                  onClick={() => onSelectBullet(`${section.id}-paragraph`)}
                />
              )}

              {/* Bullet points */}
              <div className="space-y-2">
                {section.bullets.map((bullet: ResumeBullet) => (
                  <ContentBlock
                    key={bullet.id}
                    id={bullet.id}
                    text={bullet.userEditedText || bullet.text}
                    confidence={bullet.confidence}
                    isSelected={selectedBulletId === bullet.id}
                    isEdited={bullet.isEdited}
                    onClick={() => onSelectBullet(bullet.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Legend */}
      <div className="p-4 border-t bg-muted/20">
        <div className="text-xs space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>From your resume/vault (verified)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>AI enhanced (review recommended)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>AI generated gap-filler (must verify)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
