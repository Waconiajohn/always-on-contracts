import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Upload, FileText, Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BatchResult {
  fileName: string;
  success: boolean;
  analysis?: any;
  error?: string;
  errorType?: string;
  solutions?: string[];
}

export function BatchResumeUpload() {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<BatchResult[]>([]);
  const [progress, setProgress] = useState(0);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    if (selectedFiles.length > 10) {
      toast({
        title: "Too many files",
        description: "Maximum 10 resumes can be processed at once",
        variant: "destructive"
      });
      return;
    }

    const validFiles = selectedFiles.filter(file => {
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      const isValid = validTypes.includes(file.type) && file.size <= 20 * 1024 * 1024;
      
      if (!isValid) {
        toast({
          title: `Invalid file: ${file.name}`,
          description: "Must be PDF, DOC, DOCX, or TXT under 20MB",
          variant: "destructive"
        });
      }
      
      return isValid;
    });

    setFiles(validFiles);
    setResults([]);
    setProgress(0);
  };

  const handleBatchUpload = async () => {
    if (files.length === 0) return;

    setProcessing(true);
    setResults([]);
    setProgress(0);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const resumesData = await Promise.all(
        files.map(async (file) => {
          // Convert to base64 for all file types
          const arrayBuffer = await file.arrayBuffer();
          const base64Data = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
          
          return {
            fileName: file.name,
            fileData: base64Data,
            fileSize: file.size,
            fileType: file.type
          };
        })
      );

      // Upload to storage first
      const uploadPromises = files.map(async (file) => {
        const filePath = `${session.user.id}/${Date.now()}_${file.name}`;
        return supabase.storage.from("resumes").upload(filePath, file);
      });

      await Promise.all(uploadPromises);
      setProgress(20);

      // Process batch
      const { data, error } = await supabase.functions.invoke('batch-process-resumes', {
        body: {
          resumes: resumesData,
          userId: session.user.id
        }
      });

      if (error) throw error;

      setResults(data.results || []);
      setProgress(100);

      toast({
        title: "Batch Processing Complete",
        description: `${data.successCount} succeeded, ${data.failureCount} failed`,
      });

    } catch (error: any) {
      console.error("Batch upload error:", error);
      toast({
        title: "Batch Upload Failed",
        description: error.message || "Failed to process batch",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Batch Resume Upload</CardTitle>
        <CardDescription>
          Upload and process up to 10 resumes at once
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Selection */}
        <div
          className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
          onClick={() => document.getElementById('batch-upload')?.click()}
        >
          {files.length === 0 ? (
            <div className="space-y-4">
              <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <p className="text-lg font-semibold mb-2">Select Multiple Resumes</p>
                <p className="text-sm text-muted-foreground">
                  PDF, DOC, DOCX, or TXT up to 20MB each (max 10 files)
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <FileText className="h-12 w-12 text-primary mx-auto" />
              <div>
                <p className="text-lg font-semibold">{files.length} files selected</p>
                <p className="text-sm text-muted-foreground">
                  Total size: {(files.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={(e) => {
                  e.stopPropagation();
                  setFiles([]);
                }}
              >
                Clear Selection
              </Button>
            </div>
          )}
          <input
            id="batch-upload"
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.txt"
            multiple
            onChange={handleFileSelect}
          />
        </div>

        {/* Selected Files List */}
        {files.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold">Selected Files:</h3>
            <ScrollArea className="h-[200px] border rounded-lg p-4">
              <div className="space-y-2">
                {files.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate max-w-[300px]">{file.name}</span>
                    </div>
                    <span className="text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Processing Progress */}
        {processing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Processing batch...</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Processing Results</h3>
              <div className="flex gap-2">
                <Badge variant="default" className="gap-1">
                  <CheckCircle className="h-3 w-3" />
                  {results.filter(r => r.success).length} success
                </Badge>
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="h-3 w-3" />
                  {results.filter(r => !r.success).length} failed
                </Badge>
              </div>
            </div>

            <ScrollArea className="h-[400px] border rounded-lg p-4">
              <div className="space-y-3">
                {results.map((result, idx) => (
                  <div key={idx} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {result.success ? (
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                        )}
                        <p className="font-medium">{result.fileName}</p>
                      </div>
                      <Badge variant={result.success ? "default" : "destructive"}>
                        {result.success ? "Success" : "Failed"}
                      </Badge>
                    </div>

                    {result.error && result.solutions && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <p className="font-medium mb-1">{result.error}</p>
                          <ul className="list-disc list-inside text-xs space-y-0.5">
                            {result.solutions.map((solution, sidx) => (
                              <li key={sidx}>{solution}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}

                    {result.success && result.analysis && (
                      <div className="text-xs text-muted-foreground">
                        <p>Experience: {result.analysis.years_experience} years</p>
                        <p>Skills: {result.analysis.skills?.length || 0} identified</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Upload Button */}
        {files.length > 0 && !processing && (
          <Button 
            className="w-full" 
            size="lg"
            onClick={handleBatchUpload}
          >
            {processing && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
            Process {files.length} Resume{files.length > 1 ? 's' : ''}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}