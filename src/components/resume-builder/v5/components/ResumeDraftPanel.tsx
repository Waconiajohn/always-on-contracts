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
  justUpdatedBulletId?: string | null;
}

export function ResumeDraftPanel({
  resumeData,
  selectedBulletId,
  onSelectBullet,
  justUpdatedBulletId
}: ResumeDraftPanelProps) {
  return (
    <div className="h-full flex flex-col bg-background">
      {/* Resume sections with header inside scroll */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Header with contact info - now scrolls */}
          <div className="pb-4 border-b mb-6">
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

        {(() => {
          let experienceHeaderShown = false;
          
          return resumeData.sections.map((section) => {
            // Experience section with multiple positions
            if (section.type === 'experience' && section.positions) {
              const showHeader = !experienceHeaderShown;
              experienceHeaderShown = true;
              
              return (
                <div key={section.id} className="space-y-4">
                  {showHeader && (
                    <h2 className="text-lg font-semibold uppercase tracking-wide border-b pb-2">
                      {section.title}
                    </h2>
                  )}
                  
                  {/* Company header */}
                  {section.company && (
                    <h3 className="font-semibold text-base">{section.company}</h3>
                  )}
                  
                  {/* Multiple positions at same company */}
                  {section.positions.map((position, posIdx) => (
                    <div key={`${section.id}-pos-${posIdx}`} className="ml-4 space-y-2">
                      <div className="flex justify-between items-baseline">
                        <h4 className="font-medium">{position.title}</h4>
                        <span className="text-sm text-muted-foreground">{position.dates}</span>
                      </div>
                      <div className="space-y-2">
                        {position.bullets.map((bullet: ResumeBullet) => (
                          <ContentBlock
                            key={bullet.id}
                            id={bullet.id}
                            text={bullet.userEditedText || bullet.text}
                            confidence={bullet.confidence}
                            isSelected={selectedBulletId === bullet.id}
                            isEdited={bullet.isEdited}
                            isJustUpdated={justUpdatedBulletId === bullet.id}
                            onClick={() => onSelectBullet(bullet.id)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            }
            
            // Education section
            if (section.type === 'education' && section.entries) {
              return (
                <div key={section.id} className="space-y-3">
                  <h2 className="text-lg font-semibold uppercase tracking-wide border-b pb-2">
                    {section.title}
                  </h2>
                  {section.entries.map((entry, idx) => {
                    const eduEntry = entry as { institution: string; degree: string; field?: string; graduationYear?: string; gpa?: string };
                    const eduText = `${eduEntry.degree}${eduEntry.field ? ` in ${eduEntry.field}` : ''} from ${eduEntry.institution}`;
                    return (
                      <ContentBlock
                        key={`edu-${idx}`}
                        id={`edu-${idx}`}
                        text={eduText}
                        confidence="exact"
                        isSelected={selectedBulletId === `edu-${idx}`}
                        isJustUpdated={justUpdatedBulletId === `edu-${idx}`}
                        onClick={() => onSelectBullet(`edu-${idx}`)}
                      />
                    );
                  })}
                </div>
              );
            }
            
            // Certifications section
            if (section.type === 'certifications' && section.entries) {
              return (
                <div key={section.id} className="space-y-3">
                  <h2 className="text-lg font-semibold uppercase tracking-wide border-b pb-2">
                    {section.title}
                  </h2>
                  <div className="space-y-2">
                    {section.entries.map((entry, idx) => {
                      const certEntry = entry as { name: string; issuer?: string; year?: string };
                      const certText = `${certEntry.name}${certEntry.issuer ? ` • ${certEntry.issuer}` : ''}${certEntry.year ? ` • ${certEntry.year}` : ''}`;
                      return (
                        <ContentBlock
                          key={`cert-${idx}`}
                          id={`cert-${idx}`}
                          text={certText}
                          confidence="exact"
                          isSelected={selectedBulletId === `cert-${idx}`}
                          isJustUpdated={justUpdatedBulletId === `cert-${idx}`}
                          onClick={() => onSelectBullet(`cert-${idx}`)}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            }
            
            // Skills section
            if (section.type === 'skills' && section.skills) {
              return (
                <div key={section.id} className="space-y-3">
                  <h2 className="text-lg font-semibold uppercase tracking-wide border-b pb-2">
                    {section.title}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {section.skills.map((skill, idx) => (
                      <ContentBlock
                        key={`skill-${idx}`}
                        id={`skill-${idx}`}
                        text={skill}
                        confidence="exact"
                        isSelected={selectedBulletId === `skill-${idx}`}
                        isJustUpdated={justUpdatedBulletId === `skill-${idx}`}
                        onClick={() => onSelectBullet(`skill-${idx}`)}
                      />
                    ))}
                  </div>
                </div>
              );
            }
            
            // Standard section (summary, etc.)
            return (
              <div key={section.id} className="space-y-3">
                <h2 className="text-lg font-semibold uppercase tracking-wide border-b pb-2">
                  {section.title}
                </h2>

                {/* Paragraph content (for summary sections) */}
                {section.paragraph && (
                  <ContentBlock
                    id={`${section.id}-paragraph`}
                    text={section.paragraph}
                    confidence="enhanced"
                    isSelected={selectedBulletId === `${section.id}-paragraph`}
                    isJustUpdated={justUpdatedBulletId === `${section.id}-paragraph`}
                    onClick={() => onSelectBullet(`${section.id}-paragraph`)}
                  />
                )}

                {/* Bullet points */}
                <div className="space-y-2">
                  {section.bullets?.map((bullet: ResumeBullet) => (
                    <div key={bullet.id} className="space-y-1">
                      <ContentBlock
                        id={bullet.id}
                        text={bullet.userEditedText || bullet.text}
                        confidence={bullet.confidence}
                        isSelected={selectedBulletId === bullet.id}
                        isEdited={bullet.isEdited}
                        isJustUpdated={justUpdatedBulletId === bullet.id}
                        onClick={() => onSelectBullet(bullet.id)}
                      />
                      {/* Show ATS keywords as clickable badges */}
                      {bullet.atsKeywords && bullet.atsKeywords.length > 0 && (
                        <div className="flex flex-wrap gap-1 ml-6">
                          {bullet.atsKeywords.map((keyword, i) => (
                            <span
                              key={i}
                              className="text-[10px] px-1.5 py-0.5 bg-primary/5 text-primary/70 rounded cursor-default"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          });
        })()}
        </div>
      </ScrollArea>

      {/* Compact Legend */}
      <div className="px-3 py-2 border-t bg-muted/20">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 bg-green-500 rounded"></div>
            <span>Verified</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 bg-yellow-500 rounded"></div>
            <span>AI enhanced</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 bg-red-500 rounded"></div>
            <span>AI generated</span>
          </div>
        </div>
      </div>
    </div>
  );
}
