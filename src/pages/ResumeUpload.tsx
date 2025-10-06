import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { toast } from "@/hooks/use-toast";
import { Upload, FileText, ArrowLeft, CheckCircle, Loader2, Trash2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ResumeUploadContent = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [savedFilename, setSavedFilename] = useState<string>("");
  const [existingResumes, setExistingResumes] = useState<any[]>([]);
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [processingStage, setProcessingStage] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);
  const [errorSolutions, setErrorSolutions] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchExistingResumes();
  }, []);

  const fetchExistingResumes = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from("resumes")
      .select("*")
      .eq("user_id", session.user.id)
      .order("upload_date", { ascending: false });

    if (!error && data) {
      setExistingResumes(data);
    }
  };

  const handleDeleteResume = async (resumeId: string, fileName: string) => {
    try {
      const { error } = await supabase
        .from("resumes")
        .delete()
        .eq("id", resumeId);

      if (error) throw error;

      toast({
        title: "Resume deleted",
        description: `${fileName} has been removed`,
      });

      fetchExistingResumes();
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Phase 4.3: Enhanced client-side validation
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (!validTypes.includes(selectedFile.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF, DOC, DOCX, or TXT file",
          variant: "destructive",
        });
        return;
      }
      
      // Increased to 20MB for scale
      if (selectedFile.size > 20 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 20MB",
          variant: "destructive",
        });
        return;
      }

      // Check for duplicate filename
      const isDuplicate = existingResumes.some(r => r.file_name === selectedFile.name);
      setDuplicateWarning(isDuplicate);
      
      setFile(selectedFile);
      setProgress(0);
      setProcessingStage("");
      setErrorSolutions([]);
      
      toast({
        title: isDuplicate ? "Duplicate filename detected" : "File loaded",
        description: isDuplicate 
          ? "A resume with this filename already exists. You can still upload it."
          : "Resume ready to upload",
        variant: isDuplicate ? "default" : "default",
      });
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    try {
      setUploading(true);
      setProgress(5);
      setProcessingStage("Uploading file...");

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const filePath = `${session.user.id}/${Date.now()}_${file.name}`;
      
      // Phase 4.2: Upload progress (0-25%)
      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(filePath, file);

      if (uploadError) throw uploadError;
      setProgress(25);

      const { data: { publicUrl } } = supabase.storage
        .from("resumes")
        .getPublicUrl(filePath);

      const { data: resumeData, error: resumeError } = await supabase
        .from("resumes")
        .insert({
          user_id: session.user.id,
          file_name: file.name,
          file_url: publicUrl,
        })
        .select()
        .single();

      if (resumeError) throw resumeError;

      setUploadComplete(true);
      setSavedFilename(file.name);
      setProcessingStage("Preparing file...");
      setProgress(30);

      setAnalyzing(true);

      // Convert file to base64
      const arrayBuffer = await file.arrayBuffer();
      const base64Data = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      setProgress(35);
      setProcessingStage("Analyzing with AI...");

      // Phase 2.1: Use unified process-resume function with base64 data
      const { data: processData, error: processError } = await supabase.functions.invoke(
        "process-resume",
        {
          body: {
            fileData: base64Data,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            userId: session.user.id,
          },
        }
      );

      if (processError) throw processError;

      if (!processData.success) {
        // Phase 4.1: Display intelligent error messages with solutions
        setErrorSolutions(processData.solutions || []);
        throw new Error(processData.error || "Analysis failed");
      }

      setProgress(90);
      setProcessingStage("Finalizing...");

      toast({
        title: processData.cached ? "Analysis retrieved from cache!" : "Analysis complete!",
        description: processData.cached 
          ? "Found matching resume in our system. Redirecting..."
          : "Your resume has been analyzed. Redirecting to dashboard...",
      });

      setProgress(100);
      fetchExistingResumes();
      
      setTimeout(() => {
        navigate("/home");
      }, 2000);
    } catch (error: any) {
      console.error("Error:", error);
      
      // Phase 4.1: Show error with solutions if available
      const errorMessage = error.message || "Failed to upload resume";
      
      toast({
        title: "Upload failed",
        description: errorSolutions.length > 0 
          ? `${errorMessage}. See suggestions below.`
          : errorMessage,
        variant: "destructive",
      });
      
      setUploadComplete(false);
      setProgress(0);
      setProcessingStage("");
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <Button variant="ghost" size="lg" onClick={() => navigate('/home')}>
            <ArrowLeft className="mr-2 h-6 w-6" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Upload Your Resume</h1>
            <p className="text-xl text-muted-foreground">
              Our AI will analyze your experience and create a personalized career intelligence strategy in minutes.
            </p>
          </div>

          {existingResumes.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-2xl">Your Resumes</CardTitle>
                <CardDescription className="text-lg">
                  {existingResumes.length} resume{existingResumes.length > 1 ? 's' : ''} uploaded. The most recent is used for matching.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {existingResumes.map((resume, index) => (
                    <div key={resume.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3 flex-1">
                        <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{resume.file_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(resume.upload_date).toLocaleDateString()} 
                            {index === 0 && <span className="ml-2 text-primary font-medium">(Active)</span>}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteResume(resume.id, resume.file_name)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl">What We'll Analyze</CardTitle>
              <CardDescription className="text-lg">
                Our AI extracts key information to build your strategy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-lg">Years of Experience</p>
                    <p className="text-muted-foreground">To calculate your premium rate</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-lg">Industry Expertise</p>
                    <p className="text-muted-foreground">Target the right opportunities</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-lg">Leadership Roles</p>
                    <p className="text-muted-foreground">Position you as an executive</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-lg">Key Achievements</p>
                    <p className="text-muted-foreground">Highlight your value proposition</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Upload Your Resume</CardTitle>
              <CardDescription className="text-lg">
                Accepted formats: PDF, DOC, DOCX, TXT (Max 20MB)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!uploadComplete ? (
                <>
                  {duplicateWarning && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        A resume with this filename already exists. Uploading will create a duplicate entry. Consider deleting the old one first.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {/* Phase 4.1: Display error solutions */}
                  {errorSolutions.length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <p className="font-semibold mb-2">Suggestions to fix the issue:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {errorSolutions.map((solution, idx) => (
                            <li key={idx}>{solution}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                  <div
                    className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer"
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    {file ? (
                      <div className="space-y-4">
                        <FileText className="h-16 w-16 text-primary mx-auto" />
                        <div>
                          <p className="text-xl font-semibold">{file.name}</p>
                          <p className="text-lg text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFile(null);
                          }}
                        >
                          Choose Different File
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Upload className="h-16 w-16 text-muted-foreground mx-auto" />
                        <div>
                          <p className="text-xl font-semibold mb-2">Click to upload or drag and drop</p>
                          <p className="text-lg text-muted-foreground">
                            PDF, DOC, DOCX, or TXT up to 10MB
                          </p>
                        </div>
                      </div>
                    )}
                    <input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleFileChange}
                    />
                  </div>

                  {file && (
                    <>
                      {/* Phase 4.2: Progress indicator */}
                      {(uploading || analyzing) && progress > 0 && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{processingStage}</span>
                            <span className="font-medium">{progress}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                      
                      <Button 
                        className="w-full text-lg py-6" 
                        size="lg"
                        onClick={handleUpload}
                        disabled={uploading || analyzing}
                      >
                        {uploading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                        {analyzing && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                        {uploading ? "Uploading Resume..." : analyzing ? "AI Analysis in Progress..." : "Upload & Analyze"}
                      </Button>
                    </>
                  )}
                </>
              ) : (
                <div className="text-center space-y-4 py-8">
                  {analyzing ? (
                    <>
                      <Loader2 className="h-16 w-16 text-primary mx-auto animate-spin" />
                      <h3 className="text-2xl font-bold">Analyzing Your Resume...</h3>
                      <p className="text-lg text-muted-foreground">
                        Our AI is extracting insights from {savedFilename}...
                      </p>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-16 w-16 text-primary mx-auto" />
                      <h3 className="text-2xl font-bold">Analysis Complete!</h3>
                      <p className="text-lg text-muted-foreground">
                        Successfully analyzed {savedFilename}. Redirecting to dashboard...
                      </p>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mt-8 bg-muted">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Your Data is Secure</h3>
                  <p className="text-lg text-muted-foreground">
                    We use bank-level encryption to protect your resume. Your data is never shared 
                    with third parties and you can delete it at any time.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

const ResumeUpload = () => {
  return (
    <ProtectedRoute>
      <ResumeUploadContent />
    </ProtectedRoute>
  );
};

export default ResumeUpload;
