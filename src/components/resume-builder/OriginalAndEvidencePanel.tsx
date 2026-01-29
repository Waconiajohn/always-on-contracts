import { FileText, ShieldCheck } from 'lucide-react';
import { EvidenceSidebar } from './EvidenceSidebar';
import type { RBEvidence } from '@/types/resume-builder';

interface OriginalAndEvidencePanelProps {
  originalContent: string;
  evidence: RBEvidence[];
  sectionName: string;
  onEvidenceRemoved?: (evidenceId: string) => void;
}

const SECTION_DISPLAY_NAMES: Record<string, string> = {
  summary: 'Summary',
  skills: 'Skills',
  experience: 'Experience',
  education: 'Education',
};

export function OriginalAndEvidencePanel({ 
  originalContent, 
  evidence, 
  sectionName,
  onEvidenceRemoved,
}: OriginalAndEvidencePanelProps) {
  const displayName = SECTION_DISPLAY_NAMES[sectionName] || sectionName;
  
  return (
    <div className="space-y-6">
      {/* Original Section Content */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
          <FileText className="h-4 w-4" />
          Original {displayName}
        </h3>
        {originalContent ? (
          <div className="text-sm whitespace-pre-wrap bg-muted/50 rounded-md p-3 max-h-[200px] overflow-y-auto border">
            {originalContent}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic p-3 border border-dashed rounded-md text-center">
            No original content found for this section
          </p>
        )}
      </div>

      {/* Evidence for this section */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
          <ShieldCheck className="h-4 w-4" />
          Verified Evidence
        </h3>
        <EvidenceSidebar 
          evidence={evidence} 
          maxItems={5} 
          onEvidenceRemoved={onEvidenceRemoved}
        />
      </div>
    </div>
  );
}
