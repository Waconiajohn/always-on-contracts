import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { cn } from "@/lib/utils";

interface ResumeSection {
  id: string;
  type: string;
  title: string;
  content: any[];
  order: number;
  status?: 'complete' | 'in_progress' | 'needs_attention';
  vaultItemsUsed?: any[];
  atsKeywords?: string[];
  requirementsCovered?: string[];
}

interface VisualResumePreviewProps {
  sections?: ResumeSection[];
  responses?: any[];
  addressedGaps?: string[];
  vaultMatches?: any[];
  atsKeywords?: any;
}

export const VisualResumePreview = ({ 
  sections = [], 
  responses = [], 
  addressedGaps = [],
  vaultMatches = [],
  atsKeywords = { critical: [], important: [], nice_to_have: [] }
}: VisualResumePreviewProps) => {
  // Support both modes: sections (new) or responses (legacy)
  const displaySections = sections.length > 0 ? sections : [];
  const completedResponses = responses.filter(r => r.editedContent);
  
  const getSectionStatus = (section: ResumeSection) => {
    if (section.content && section.content.length > 0) return 'complete';
    if (section.status) return section.status;
    return 'needs_attention';
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete': return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-warning animate-pulse" />;
      default: return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'complete': return 'Complete';
      case 'in_progress': return 'Generating...';
      default: return 'Pending';
    }
  };
  
  const totalVaultItems = vaultMatches.length;
  const totalKeywords = [...atsKeywords.critical, ...atsKeywords.important, ...atsKeywords.nice_to_have].length;

  // Show empty state if no sections and no responses
  if (displaySections.length === 0 && completedResponses.length === 0) {
    return (
      <Card className="h-full flex items-center justify-center">
        <EmptyState
          icon={FileText}
          title="Resume Preview"
          description="Your resume will appear here as sections are generated"
        />
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b bg-muted/30">
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-lg">Live Resume Preview</CardTitle>
          <Badge variant="outline" className="bg-background">
            {displaySections.filter(s => getSectionStatus(s) === 'complete').length} of {displaySections.length} complete
          </Badge>
        </div>
        
        {/* Preview Stats */}
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="bg-card p-2 rounded border">
            <div className="text-muted-foreground mb-1">Vault Items</div>
            <div className="font-semibold text-primary">{totalVaultItems}</div>
          </div>
          <div className="bg-card p-2 rounded border">
            <div className="text-muted-foreground mb-1">ATS Keywords</div>
            <div className="font-semibold text-primary">{totalKeywords}</div>
          </div>
          <div className="bg-card p-2 rounded border">
            <div className="text-muted-foreground mb-1">Gaps Addressed</div>
            <div className="font-semibold text-success">{addressedGaps.length}</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-auto p-6 space-y-4">
        {/* Modern Sections Display */}
        {displaySections.length > 0 ? (
          displaySections
            .sort((a, b) => a.order - b.order)
            .map((section) => {
              const status = getSectionStatus(section);
              const hasContent = section.content && section.content.length > 0;
              
              return (
                <div
                  key={section.id}
                  className={cn(
                    "border rounded-lg p-4 transition-all",
                    status === 'complete' ? "border-success/30 bg-success/5" :
                    status === 'in_progress' ? "border-warning/30 bg-warning/5" :
                    "border-border bg-muted/20"
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(status)}
                      <h3 className="font-semibold text-sm">{section.title}</h3>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs",
                        status === 'complete' ? "bg-success/10 text-success border-success/30" :
                        status === 'in_progress' ? "bg-warning/10 text-warning border-warning/30" :
                        "bg-muted text-muted-foreground"
                      )}
                    >
                      {getStatusText(status)}
                    </Badge>
                  </div>

                  {hasContent ? (
                    <div className="space-y-2">
                      {section.content.map((item, idx) => (
                        <div key={idx} className="text-sm text-foreground/90 pl-3 border-l-2 border-primary/30">
                          {typeof item === 'string' ? item : item.content}
                        </div>
                      ))}
                      
                      {/* Show metadata if available */}
                      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border/50">
                        {section.vaultItemsUsed && section.vaultItemsUsed.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {section.vaultItemsUsed.length} vault items
                          </Badge>
                        )}
                        {section.atsKeywords && section.atsKeywords.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {section.atsKeywords.length} ATS keywords
                          </Badge>
                        )}
                        {section.requirementsCovered && section.requirementsCovered.length > 0 && (
                          <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/30">
                            {section.requirementsCovered.length} requirements covered
                          </Badge>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground italic py-4 text-center border-2 border-dashed rounded">
                      {status === 'in_progress' 
                        ? 'AI is generating this section...' 
                        : 'Address gaps or generate with AI to populate this section'}
                    </div>
                  )}
                </div>
              );
            })
        ) : (
          // Legacy mode: show completed responses
          completedResponses.map((response, index) => (
            <div key={index} className="border-l-2 border-primary pl-4 py-2">
              <div className="mb-2">
                <Badge variant="secondary" className="text-xs">
                  {response.requirement.priority}
                </Badge>
                <p className="text-sm font-medium mt-1">{response.requirement.text}</p>
              </div>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                {response.editedContent}
              </div>
              {index < completedResponses.length - 1 && <Separator className="mt-4" />}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
