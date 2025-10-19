import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ArrowRight, Download } from "lucide-react";
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer';

interface VersionComparisonProps {
  versionA: {
    id: string;
    version_name: string;
    html_content: string;
    customizations: any;
    match_score: number | null;
  };
  versionB: {
    id: string;
    version_name: string;
    html_content: string;
    customizations: any;
    match_score: number | null;
  };
  onClose: () => void;
  onDownload: (versionId: string, format: string) => void;
}

export function VersionComparison({
  versionA,
  versionB,
  onClose,
  onDownload
}: VersionComparisonProps) {
  const getTextContent = (html: string) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  };

  const textA = getTextContent(versionA.html_content);
  const textB = getTextContent(versionB.html_content);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Version Comparison</CardTitle>
            <CardDescription>Side-by-side comparison of resume versions</CardDescription>
          </div>
          <Button variant="outline" onClick={onClose}>
            Close Comparison
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="side-by-side" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="side-by-side">Side by Side</TabsTrigger>
            <TabsTrigger value="diff">Diff View</TabsTrigger>
          </TabsList>

          <TabsContent value="side-by-side" className="mt-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Version A */}
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{versionA.version_name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {versionA.customizations?.persona && (
                        <Badge variant="outline" className="text-xs">
                          {versionA.customizations.persona}
                        </Badge>
                      )}
                      {versionA.match_score && (
                        <Badge variant="secondary" className="text-xs">
                          {versionA.match_score}% match
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDownload(versionA.id, 'pdf')}
                    className="gap-2"
                  >
                    <Download className="h-3 w-3" />
                    Download
                  </Button>
                </div>
                
                <ScrollArea className="h-[600px] border rounded-lg p-4">
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: versionA.html_content }}
                  />
                </ScrollArea>
              </div>

              {/* Version B */}
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{versionB.version_name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {versionB.customizations?.persona && (
                        <Badge variant="outline" className="text-xs">
                          {versionB.customizations.persona}
                        </Badge>
                      )}
                      {versionB.match_score && (
                        <Badge variant="secondary" className="text-xs">
                          {versionB.match_score}% match
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDownload(versionB.id, 'pdf')}
                    className="gap-2"
                  >
                    <Download className="h-3 w-3" />
                    Download
                  </Button>
                </div>
                
                <ScrollArea className="h-[600px] border rounded-lg p-4">
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: versionB.html_content }}
                  />
                </ScrollArea>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 mt-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm font-medium">{versionA.version_name}</span>
              </div>
              <span className="text-muted-foreground">vs</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{versionB.version_name}</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="diff" className="mt-4">
            <div className="border rounded-lg overflow-hidden">
              <ReactDiffViewer
                oldValue={textA}
                newValue={textB}
                splitView={true}
                compareMethod={DiffMethod.WORDS}
                leftTitle={versionA.version_name}
                rightTitle={versionB.version_name}
                styles={{
                  variables: {
                    light: {
                      diffViewerBackground: '#fff',
                      addedBackground: '#e6ffed',
                      addedColor: '#24292e',
                      removedBackground: '#ffeef0',
                      removedColor: '#24292e',
                    },
                  },
                }}
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
