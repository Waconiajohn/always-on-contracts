import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, ArrowLeft, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const ResumeUpload = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Check file type
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(selectedFile.type)) {
        toast.error("Please upload a PDF or Word document");
        return;
      }
      
      // Check file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      
      setFile(selectedFile);
      toast.success("Resume loaded successfully!");
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    
    // Simulate upload and processing
    setTimeout(() => {
      setIsUploading(false);
      toast.success("Resume analyzed successfully!");
      navigate('/strategy-results');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <Button variant="ghost" size="lg" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-6 w-6" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Upload Your Resume</h1>
            <p className="text-xl text-muted-foreground">
              Our AI will analyze your experience and create a personalized contract career strategy in minutes.
            </p>
          </div>

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
                Accepted formats: PDF, DOC, DOCX (Max 5MB)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                        PDF, DOC, or DOCX up to 5MB
                      </p>
                    </div>
                  </div>
                )}
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                />
              </div>

              {file && (
                <Button 
                  className="w-full text-lg py-6" 
                  size="lg"
                  onClick={handleUpload}
                  disabled={isUploading}
                >
                  {isUploading ? "Analyzing Resume..." : "Analyze Resume"}
                </Button>
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

export default ResumeUpload;
