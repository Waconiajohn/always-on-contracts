import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Loader2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ResumeAnalysisFeed } from "../LiveAnalysisFeed";
import { MarketFitResults } from "../MarketFitResults";

interface Phase1Props {
  vaultId: string;
  onProgress: (progress: number) => void;
  onTimeEstimate: (estimate: string) => void;
  onComplete: () => void;
}

export const Phase1_MarketResearch = ({
  vaultId,
  onProgress,
  onTimeEstimate,
  onComplete
}: Phase1Props) => {
  const [step, setStep] = useState<'upload' | 'analyzing' | 'results'>('upload');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState("");
  const [targetIndustry, setTargetIndustry] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [itemsExtracted, setItemsExtracted] = useState(0);
  const [jobsAnalyzed, setJobsAnalyzed] = useState(0);

  useEffect(() => {
    // Load existing target roles if available
    loadExistingTargets();
  }, [vaultId]);

  const loadExistingTargets = async () => {
    try {
      const { data: vault } = await supabase
        .from('career_vault')
        .select('target_roles, target_industries')
        .eq('id', vaultId)
        .single();

      if (vault?.target_roles?.[0]) setTargetRole(vault.target_roles[0]);
      if (vault?.target_industries?.[0]) setTargetIndustry(vault.target_industries[0]);
    } catch (error) {
      console.error('Error loading targets:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf' && !file.name.endsWith('.docx')) {
        toast.error('Please upload a PDF or DOCX file');
        return;
      }
      setResumeFile(file);
    }
  };

  const handleAnalyze = async () => {
    if (!resumeFile || !targetRole) {
      toast.error('Please upload resume and specify target role');
      return;
    }

    setIsProcessing(true);
    setStep('analyzing');
    onProgress(10);
    onTimeEstimate('~3 minutes left');

    try {
      // Step 1: Upload resume
      onProgress(20);
      const fileName = `${vaultId}/${Date.now()}_${resumeFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, resumeFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(fileName);

      // Step 2: Parse resume
      onProgress(30);
      setItemsExtracted(5);
      const { data: parseData, error: parseError } = await supabase.functions.invoke('parse-resume', {
        body: { resumeUrl: publicUrl }
      });

      if (parseError) throw parseError;

      setItemsExtracted(parseData?.items?.length || 10);
      onProgress(50);

      // Step 3: Extract vault items
      const { error: extractError } = await supabase.functions.invoke('auto-populate-vault-v3', {
        body: {
          vaultId,
          resumeText: parseData?.text,
          resumeUrl: publicUrl
        }
      });

      if (extractError) throw extractError;

      onProgress(60);
      setJobsAnalyzed(3);

      // Step 4: Analyze market fit
      onTimeEstimate('~2 minutes left');
      const { data: marketData, error: marketError } = await supabase.functions.invoke('analyze-market-fit', {
        body: {
          vaultId,
          targetRole,
          targetIndustry,
          resumeText: parseData?.text,
          numJobs: 10
        }
      });

      if (marketError) throw marketError;

      setJobsAnalyzed(marketData?.marketData?.jobsAnalyzed || 10);
      onProgress(90);

      // Step 5: Update vault with targets
      await supabase
        .from('career_vault')
        .update({
          target_roles: [targetRole],
          target_industries: targetIndustry ? [targetIndustry] : [],
          resume_raw_text: parseData?.text
        })
        .eq('id', vaultId);

      onProgress(100);
      setAnalysisData(marketData);
      setStep('results');
      toast.success('Market analysis complete!');

    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze resume. Please try again.');
      setStep('upload');
    } finally {
      setIsProcessing(false);
    }
  };

  if (step === 'analyzing') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Analyzing Your Market Fit</h2>
          <p className="text-muted-foreground">
            Extracting your experience and researching live job market...
          </p>
        </div>
        <ResumeAnalysisFeed
          isAnalyzing={isProcessing}
          itemsExtracted={itemsExtracted}
          jobsAnalyzed={jobsAnalyzed}
        />
      </div>
    );
  }

  if (step === 'results') {
    return (
      <MarketFitResults
        vaultId={vaultId}
        marketData={analysisData?.marketData}
        gaps={analysisData?.gaps || []}
        onContinue={onComplete}
      />
    );
  }

  // Upload step
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold">Let's Analyze Your Market Fit</h2>
        <p className="text-lg text-muted-foreground">
          Upload your resume and we'll compare it to what companies are actually hiring for
        </p>
      </div>

      <Card className="p-6 space-y-6">
        {/* Resume Upload */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Resume (PDF or DOCX)</label>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => document.getElementById('resume-upload')?.click()}
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              {resumeFile ? resumeFile.name : 'Choose File'}
            </Button>
            <input
              id="resume-upload"
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>

        {/* Target Role */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Target Role *</label>
          <Input
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="e.g., Senior Product Manager"
          />
          <p className="text-xs text-muted-foreground">
            What job title are you targeting? We'll search live postings for this role.
          </p>
        </div>

        {/* Target Industry (Optional) */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Target Industry (Optional)</label>
          <Input
            value={targetIndustry}
            onChange={(e) => setTargetIndustry(e.target.value)}
            placeholder="e.g., SaaS, Healthcare, Finance"
          />
        </div>

        {/* Analyze Button */}
        <Button
          onClick={handleAnalyze}
          disabled={!resumeFile || !targetRole || isProcessing}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              Analyze Market Fit
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </Card>

      {/* Info Card */}
      <Card className="p-4 bg-muted/50 border-dashed">
        <p className="text-sm text-muted-foreground">
          <strong>What happens next:</strong> We'll extract your achievements, 
          search 10+ live job postings for "{targetRole || 'your role'}", 
          and show you exactly what you're missing vs. market expectations.
        </p>
      </Card>
    </div>
  );
};
