import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Download, Share2, FileText } from "lucide-react";
import { toast } from "sonner";

interface ResumeVersion {
  id: string;
  version_number: number;
  template_name: string;
  created_at: string;
  content: any;
  html_content?: string;
}

interface BatchExportProps {
  versions: ResumeVersion[];
  onExport: (versionIds: string[], format: string) => Promise<void>;
  onShare?: (versionIds: string[]) => Promise<void>;
}

export function BatchExport({ versions, onExport, onShare }: BatchExportProps) {
  const [selectedVersions, setSelectedVersions] = useState<Set<string>>(new Set());
  const [exportFormat, setExportFormat] = useState<string>("pdf");
  const [isExporting, setIsExporting] = useState(false);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedVersions(new Set(versions.map(v => v.id)));
    } else {
      setSelectedVersions(new Set());
    }
  };

  const handleSelectVersion = (versionId: string, checked: boolean) => {
    const newSelection = new Set(selectedVersions);
    if (checked) {
      newSelection.add(versionId);
    } else {
      newSelection.delete(versionId);
    }
    setSelectedVersions(newSelection);
  };

  const handleBatchExport = async () => {
    if (selectedVersions.size === 0) {
      toast.error("Please select at least one version to export");
      return;
    }

    setIsExporting(true);
    try {
      await onExport(Array.from(selectedVersions), exportFormat);
      toast.success(`Exported ${selectedVersions.size} resume(s) successfully`);
    } catch (error) {
      toast.error("Failed to export resumes");
    } finally {
      setIsExporting(false);
    }
  };

  const handleBatchShare = async () => {
    if (selectedVersions.size === 0) {
      toast.error("Please select at least one version to share");
      return;
    }

    if (!onShare) {
      toast.error("Share functionality not available");
      return;
    }

    try {
      await onShare(Array.from(selectedVersions));
      toast.success(`Shared ${selectedVersions.size} resume(s)`);
    } catch (error) {
      toast.error("Failed to share resumes");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Batch Export & Distribution</CardTitle>
          <CardDescription>
            Select multiple resume versions to export or share
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Version Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Select Versions</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={selectedVersions.size === versions.length && versions.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <label
                  htmlFor="select-all"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Select All
                </label>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-4">
              {versions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No versions available
                </p>
              ) : (
                versions.map((version) => (
                  <div
                    key={version.id}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <Checkbox
                      id={version.id}
                      checked={selectedVersions.has(version.id)}
                      onCheckedChange={(checked) =>
                        handleSelectVersion(version.id, checked as boolean)
                      }
                    />
                    <label
                      htmlFor={version.id}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          Version {version.version_number}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {version.template_name}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(version.created_at).toLocaleDateString()}
                      </p>
                    </label>
                  </div>
                ))
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              {selectedVersions.size} version(s) selected
            </p>
          </div>

          {/* Export Format */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Export Format</Label>
            <RadioGroup value={exportFormat} onValueChange={setExportFormat}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="cursor-pointer">
                  PDF - Best for printing and sharing
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="docx" id="docx" />
                <Label htmlFor="docx" className="cursor-pointer">
                  DOCX - Editable Word document
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="html" id="html" />
                <Label htmlFor="html" className="cursor-pointer">
                  HTML - Web-ready format
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="txt" id="txt" />
                <Label htmlFor="txt" className="cursor-pointer">
                  TXT - Plain text for ATS systems
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleBatchExport}
              disabled={isExporting || selectedVersions.size === 0}
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Selected
            </Button>
            {onShare && (
              <Button
                variant="outline"
                onClick={handleBatchShare}
                disabled={selectedVersions.size === 0}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            )}
          </div>

          {/* Distribution Options */}
          <Card className="bg-accent/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Distribution Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>• PDF format is recommended for job applications</p>
              <p>• DOCX format allows recruiters to make notes</p>
              <p>• TXT format ensures ATS compatibility</p>
              <p>• Export multiple versions to test different approaches</p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
