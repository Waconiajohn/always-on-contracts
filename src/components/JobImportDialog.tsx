import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Link, Upload, Search, Loader2 } from "lucide-react";
import { 
  ParseJobDocumentSchema,
  validateInput,
  invokeEdgeFunction 
} from '@/lib/edgeFunction';

interface JobImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJobImported: (jobData: {
    jobTitle: string;
    jobDescription: string;
    companyName?: string;
    source: string;
    externalUrl?: string;
  }) => void;
}

export function JobImportDialog({ open, onOpenChange, onJobImported }: JobImportDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("paste");

  // Paste tab state
  const [pasteText, setPasteText] = useState("");
  const [pasteTitle, setPasteTitle] = useState("");
  const [pasteCompany, setPasteCompany] = useState("");

  // URL tab state
  const [urlInput, setUrlInput] = useState("");

  // File tab state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handlePasteImport = async () => {
    if (!pasteText.trim()) {
      toast({
        title: "Missing Information",
        description: "Please paste the job description",
        variant: "destructive",
      });
      return;
    }

    if (!pasteTitle.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter the job title",
        variant: "destructive",
      });
      return;
    }

    onJobImported({
      jobTitle: pasteTitle,
      jobDescription: pasteText,
      companyName: pasteCompany || undefined,
      source: "manual",
    });

    resetForm();
    onOpenChange(false);
  };

  const handleUrlImport = async () => {
    if (!urlInput.trim()) {
      toast({
        title: "Missing URL",
        description: "Please enter a job posting URL",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const validated = validateInput(ParseJobDocumentSchema, {
        url: urlInput
      });

      const { data, error } = await invokeEdgeFunction(
        supabase,
        'parse-job-document',
        validated,
        { successMessage: 'Job imported successfully!' }
      );

      if (error) return;

      if (!data.success) {
        toast({
          title: "Import Failed",
          description: data.error || "Failed to parse job URL",
          variant: "destructive",
        });
        return;
      }

      onJobImported({
        jobTitle: data.jobTitle || "Imported Job",
        jobDescription: data.jobDescription,
        companyName: data.companyName,
        source: "url",
        externalUrl: urlInput,
      });

      resetForm();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const handleFileImport = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    // Check file size (10MB limit)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "File size must be less than 10MB",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop()?.toLowerCase();
      
      if (fileExt === 'txt') {
        // Handle text file directly
        const text = await selectedFile.text();
        onJobImported({
          jobTitle: selectedFile.name.replace('.txt', ''),
          jobDescription: text,
          source: "file",
        });
        
        toast({
          title: "File Imported",
          description: "Text file loaded successfully",
        });
        
        resetForm();
        onOpenChange(false);
      } else if (fileExt === 'pdf' || fileExt === 'docx' || fileExt === 'doc') {
        // For PDF/DOCX, suggest copy/paste
        toast({
          title: "Copy/Paste Recommended",
          description: "For best results, please copy the text from your file and use the Paste tab instead.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Unsupported Format",
          description: "Please upload a .txt, .pdf, .doc, or .docx file",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('File import error:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to import file";
      toast({
        title: "Import Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPasteText("");
    setPasteTitle("");
    setPasteCompany("");
    setUrlInput("");
    setSelectedFile(null);
    setActiveTab("paste");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Job Description</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="paste">
              <FileText className="w-4 h-4 mr-2" />
              Paste Text
            </TabsTrigger>
            <TabsTrigger value="url">
              <Link className="w-4 h-4 mr-2" />
              URL
            </TabsTrigger>
            <TabsTrigger value="file">
              <Upload className="w-4 h-4 mr-2" />
              Upload File
            </TabsTrigger>
          </TabsList>

          <TabsContent value="paste" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="paste-title">Job Title *</Label>
              <Input
                id="paste-title"
                placeholder="e.g., Senior Software Engineer"
                value={pasteTitle}
                onChange={(e) => setPasteTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paste-company">Company Name (Optional)</Label>
              <Input
                id="paste-company"
                placeholder="e.g., Acme Corp"
                value={pasteCompany}
                onChange={(e) => setPasteCompany(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paste-description">Job Description *</Label>
              <Textarea
                id="paste-description"
                placeholder="Paste the full job description here..."
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                rows={12}
                className="font-mono text-sm"
              />
            </div>

            <Button onClick={handlePasteImport} className="w-full" disabled={loading}>
              Import Job
            </Button>
          </TabsContent>

          <TabsContent value="url" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url-input">Job Posting URL</Label>
              <Input
                id="url-input"
                type="url"
                placeholder="https://company.com/careers/job-posting"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Enter the URL of a job posting (LinkedIn, Indeed, company career page, etc.)
              </p>
            </div>

            <Button onClick={handleUrlImport} className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Import from URL
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="file" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file-input">Select File</Label>
              <Input
                id="file-input"
                type="file"
                accept=".txt,.pdf,.doc,.docx"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
              <p className="text-sm text-muted-foreground">
                Supported formats: .txt, .pdf, .doc, .docx (max 10MB)
              </p>
              {selectedFile && (
                <p className="text-sm text-primary">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            <Button onClick={handleFileImport} className="w-full" disabled={loading || !selectedFile}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import File
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}