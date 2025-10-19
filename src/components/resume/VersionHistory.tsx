import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, Eye, Download, Trash2, GitCompare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ResumeVersion {
  id: string;
  version_name: string;
  created_at: string;
  match_score: number | null;
  customizations: {
    persona?: string;
    job_title?: string;
    company_name?: string;
  };
}

interface VersionHistoryProps {
  versions: ResumeVersion[];
  currentVersionId?: string;
  onPreview: (version: ResumeVersion) => void;
  onCompare: (versionA: ResumeVersion, versionB: ResumeVersion) => void;
  onDownload: (version: ResumeVersion) => void;
  onDelete: (versionId: string) => void;
  loading?: boolean;
}

export function VersionHistory({
  versions,
  currentVersionId,
  onPreview,
  onCompare,
  onDownload,
  onDelete,
  loading
}: VersionHistoryProps) {
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);

  const handleToggleCompare = (versionId: string) => {
    setSelectedForCompare(prev => {
      if (prev.includes(versionId)) {
        return prev.filter(id => id !== versionId);
      }
      if (prev.length >= 2) {
        return [prev[1], versionId];
      }
      return [...prev, versionId];
    });
  };

  const handleCompare = () => {
    if (selectedForCompare.length === 2) {
      const versionA = versions.find(v => v.id === selectedForCompare[0]);
      const versionB = versions.find(v => v.id === selectedForCompare[1]);
      if (versionA && versionB) {
        onCompare(versionA, versionB);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5" />
            <CardTitle>Version History</CardTitle>
          </div>
          {selectedForCompare.length === 2 && (
            <Button onClick={handleCompare} size="sm" className="gap-2">
              <GitCompare className="h-4 w-4" />
              Compare Selected
            </Button>
          )}
        </div>
        <CardDescription>
          {versions.length} saved version{versions.length !== 1 ? 's' : ''}
          {selectedForCompare.length > 0 && ` • ${selectedForCompare.length} selected for comparison`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No resume versions yet</p>
            <p className="text-sm mt-1">Generated resumes will appear here</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-3">
              {versions.map((version) => {
                const isSelected = selectedForCompare.includes(version.id);
                const isCurrent = version.id === currentVersionId;
                
                return (
                  <div
                    key={version.id}
                    className={`border rounded-lg p-4 space-y-3 transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : isCurrent
                        ? 'border-primary/50 bg-primary/5'
                        : 'hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm">{version.version_name}</h4>
                          {isCurrent && (
                            <Badge variant="default" className="text-xs">Current</Badge>
                          )}
                          {isSelected && (
                            <Badge variant="secondary" className="text-xs">Selected</Badge>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
                          </span>
                          
                          {version.customizations?.job_title && (
                            <>
                              <span>•</span>
                              <span>{version.customizations.job_title}</span>
                            </>
                          )}
                          
                          {version.customizations?.company_name && (
                            <>
                              <span>•</span>
                              <span>{version.customizations.company_name}</span>
                            </>
                          )}
                        </div>

                        {version.customizations?.persona && (
                          <Badge variant="outline" className="text-xs mt-1">
                            {version.customizations.persona}
                          </Badge>
                        )}

                        {version.match_score && (
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all"
                                style={{ width: `${version.match_score}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium">{version.match_score}%</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPreview(version)}
                        className="gap-2"
                      >
                        <Eye className="h-3 w-3" />
                        Preview
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleCompare(version.id)}
                        className="gap-2"
                      >
                        <GitCompare className="h-3 w-3" />
                        {isSelected ? 'Deselect' : 'Compare'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDownload(version)}
                        className="gap-2"
                      >
                        <Download className="h-3 w-3" />
                        Download
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(version.id)}
                        className="gap-2 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

// Missing import
import { useState } from "react";
