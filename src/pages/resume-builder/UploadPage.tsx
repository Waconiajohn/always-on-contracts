import { useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { ResumeBuilderShell } from "@/components/resume-builder/ResumeBuilderShell";
import { toast } from "sonner";

type UploadStatus = "idle" | "uploading" | "parsing" | "success" | "error";

export default function UploadPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file || !projectId) return;

    // Validate file type
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!validTypes.includes(file.type)) {
      setErrorMessage("Please upload a PDF or DOCX file");
      setStatus("error");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("File size must be less than 10MB");
      setStatus("error");
      return;
    }

    setFileName(file.name);
    setStatus("uploading");
    setErrorMessage(null);

    try {
      // Convert file to base64
      const base64 = await fileToBase64(file);
      setStatus("parsing");

      // Call parse-resume edge function
      const { data, error } = await supabase.functions.invoke("parse-resume", {
        body: { 
          fileContent: base64,
          fileName: file.name,
          fileType: file.type,
        },
      });

      if (error) throw error;
      if (!data?.text) throw new Error("Failed to extract text from resume");

      // Save to rb_documents table
      const { error: saveError } = await supabase
        .from("rb_documents")
        .insert({
          project_id: projectId,
          file_name: file.name,
          raw_text: data.text,
          parsed_json: data.parsed || null,
          span_index: data.spanIndex || null,
        });

      if (saveError) throw saveError;

      // Update project status
      await supabase
        .from("rb_projects")
        .update({ status: "jd" })
        .eq("id", projectId);

      setStatus("success");
      toast.success("Resume uploaded successfully");
      
      // Navigate to JD page after brief delay
      setTimeout(() => {
        navigate(`/resume-builder/${projectId}/jd`);
      }, 1000);
    } catch (err) {
      console.error("Upload failed:", err);
      setErrorMessage(err instanceof Error ? err.message : "Upload failed");
      setStatus("error");
    }
  }, [projectId, navigate]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxFiles: 1,
    disabled: status === "uploading" || status === "parsing",
  });

  return (
    <ResumeBuilderShell 
      breadcrumbs={[
        { label: "Projects", href: "/resume-builder" },
        { label: "Upload Resume" },
      ]}
    >
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Upload Your Resume</h1>
          <p className="text-sm text-muted-foreground">
            We'll extract your experience and skills to match against job requirements
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
                transition-colors
                ${isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}
                ${status === "uploading" || status === "parsing" ? "pointer-events-none opacity-60" : ""}
                ${status === "error" ? "border-destructive/50" : ""}
                ${status === "success" ? "border-primary/50 bg-primary/5" : ""}
              `}
            >
              <input {...getInputProps()} />
              
              {status === "idle" && (
                <>
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-sm font-medium mb-1">
                    {isDragActive ? "Drop your resume here" : "Drag & drop your resume"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    or click to browse • PDF or DOCX only
                  </p>
                </>
              )}

              {(status === "uploading" || status === "parsing") && (
                <>
                  <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin mb-4" />
                  <p className="text-sm font-medium mb-1">
                    {status === "uploading" ? "Uploading..." : "Parsing resume..."}
                  </p>
                  {fileName && (
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
                      <FileText className="h-3 w-3" />
                      {fileName}
                    </p>
                  )}
                </>
              )}

              {status === "success" && (
                <>
                  <CheckCircle2 className="h-12 w-12 mx-auto text-primary mb-4" />
                  <p className="text-sm font-medium mb-1">Resume uploaded successfully</p>
                  <p className="text-xs text-muted-foreground">Redirecting...</p>
                </>
              )}

              {status === "error" && (
                <>
                  <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
                  <p className="text-sm font-medium mb-1 text-destructive">{errorMessage}</p>
                  <p className="text-xs text-muted-foreground">Click to try again</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button variant="ghost" onClick={() => navigate("/resume-builder")}>
            ← Back to Projects
          </Button>
        </div>
      </div>
    </ResumeBuilderShell>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
  });
}
