import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Upload, Sparkles, CheckCircle2, ArrowRight, Zap, FileText, Crown } from "lucide-react";

export default function QuickStart() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'upload' | 'analyzing' | 'results'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file",
          variant: "destructive"
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a resume to analyze",
        variant: "destructive"
      });
      return;
    }

    setStep('analyzing');
    setProgress(10);

    try {
      // Read file as text
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        setProgress(30);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast({
            title: "Authentication required",
            description: "Please sign in to continue",
            variant: "destructive"
          });
          navigate('/auth');
          return;
        }

        setProgress(50);

        // Call edge function for quick analysis
        const { data, error } = await supabase.functions.invoke('quick-analyze-resume', {
          body: { resumeText: text, userId: user.id }
        });

        setProgress(90);

        if (error) throw error;

        setAnalysisResults(data);
        setProgress(100);
        setStep('results');

        toast({
          title: "Analysis complete!",
          description: "Your Career Intelligence Score is ready"
        });
      };

      reader.readAsText(file);
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis failed",
        description: error.message || "Failed to analyze resume",
        variant: "destructive"
      });
      setStep('upload');
      setProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl">Quick Start - Free Preview</CardTitle>
              <CardDescription className="text-lg mt-2">
                See your Career Intelligence in 30 seconds
              </CardDescription>
            </div>
            <Sparkles className="h-12 w-12 text-primary" />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {[
              { icon: Upload, label: 'Upload', active: step === 'upload' },
              { icon: Zap, label: 'Analyzing', active: step === 'analyzing' },
              { icon: CheckCircle2, label: 'Results', active: step === 'results' }
            ].map((s, idx) => (
              <div key={idx} className="flex items-center flex-1">
                <div className={`flex flex-col items-center ${s.active ? 'opacity-100' : 'opacity-40'}`}>
                  <div className={`p-3 rounded-full ${s.active ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <s.icon className="h-6 w-6" />
                  </div>
                  <span className="text-sm mt-2 font-medium">{s.label}</span>
                </div>
                {idx < 2 && <div className="flex-1 h-px bg-border mx-4" />}
              </div>
            ))}
          </div>

          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-6">
              <div className="border-2 border-dashed border-primary/30 rounded-lg p-12 text-center hover:border-primary/60 transition-colors cursor-pointer"
                onClick={() => document.getElementById('file-input')?.click()}>
                <Upload className="h-16 w-16 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-2">
                  {file ? file.name : 'Upload Your Resume'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  Click to browse or drag and drop (PDF only)
                </p>
                <input
                  id="file-input"
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Badge variant="secondary">Free • No credit card required</Badge>
              </div>

              <Button
                onClick={handleAnalyze}
                disabled={!file}
                size="lg"
                className="w-full"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Analyze My Resume
              </Button>

              <div className="grid md:grid-cols-3 gap-4 mt-8">
                {[
                  { title: "10 Seconds", desc: "Quick upload" },
                  { title: "30 Seconds", desc: "AI analysis" },
                  { title: "Free Forever", desc: "No strings attached" }
                ].map((item, idx) => (
                  <div key={idx} className="text-center p-4 bg-muted rounded-lg">
                    <p className="font-bold text-lg">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Analyzing */}
          {step === 'analyzing' && (
            <div className="space-y-6 py-12">
              <div className="text-center">
                <div className="inline-block p-6 bg-primary/10 rounded-full mb-4 animate-pulse">
                  <Zap className="h-16 w-16 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Analyzing Your Career Intelligence...</h3>
                <p className="text-muted-foreground mb-6">
                  Our AI is extracting power phrases, skills, and hidden competencies
                </p>
                <Progress value={progress} className="h-3 mb-2" />
                <p className="text-sm text-muted-foreground">{progress}% Complete</p>
              </div>
            </div>
          )}

          {/* Step 3: Results */}
          {step === 'results' && analysisResults && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <CheckCircle2 className="h-16 w-16 mx-auto text-green-500 mb-4" />
                <h3 className="text-2xl font-bold mb-2">Your Career Intelligence Preview</h3>
                <p className="text-muted-foreground">Here's what we found in your resume</p>
              </div>

              {/* Career Intelligence Score */}
              <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Badge className="mb-2">Career Intelligence Score</Badge>
                    <div className="text-6xl font-bold text-primary mb-2">
                      {analysisResults.intelligenceScore || 35}%
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Based on resume only. Complete Career Vault for 100% power.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Stats Grid */}
              <div className="grid md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold text-primary">
                      {analysisResults.powerPhrases || 8}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">Power Phrases Extracted</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold text-primary">
                      {analysisResults.skills || 12}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">Skills Identified</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold text-primary">
                      {analysisResults.achievements || 5}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">Key Achievements</p>
                  </CardContent>
                </Card>
              </div>

              {/* Sample Preview (Watermarked) */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Sample Resume Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative p-6 bg-muted/50 rounded-lg border-2 border-dashed">
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <p className="text-6xl font-bold text-muted-foreground/10 rotate-[-30deg]">
                        UPGRADE TO DOWNLOAD
                      </p>
                    </div>
                    <div className="relative space-y-3 blur-sm">
                      <p className="font-bold text-lg">Your Name Here</p>
                      <p className="text-sm">Sample content from your resume...</p>
                      <p className="text-sm">• Achievement 1 with metrics</p>
                      <p className="text-sm">• Achievement 2 with impact</p>
                      <p className="text-sm">• Achievement 3 with results</p>
                    </div>
                  </div>
                  <p className="text-xs text-center text-muted-foreground mt-3">
                    Preview only • Upgrade to download full resumes
                  </p>
                </CardContent>
              </Card>

              {/* Upgrade CTA */}
              <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30">
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <h3 className="text-xl font-bold">Ready to Unlock Full Power?</h3>
                    <p className="text-muted-foreground">
                      Complete your Career Vault and access all features
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button onClick={() => navigate('/pricing')} size="lg">
                        <Crown className="mr-2 h-5 w-5" />
                        View Pricing
                      </Button>
                      <Button onClick={() => navigate('/career-vault/onboarding')} variant="outline" size="lg">
                        <Sparkles className="mr-2 h-5 w-5" />
                        Complete Career Vault (Free)
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="text-center">
                <Button variant="ghost" onClick={() => navigate('/command-center')}>
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
