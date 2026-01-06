import { useState, useEffect, useCallback } from 'react';
import { Zap, RotateCcw, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useResumeMatchStorage } from '@/hooks/useResumeMatchStorage';
import { useRealtimeResumeScore } from '@/hooks/useRealtimeResumeScore';
import { ResumeInputPanel } from './ResumeInputPanel';
import { JobDescriptionPanel } from './JobDescriptionPanel';
import { ResultsPanel } from './ResultsPanel';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ResumeMatchWorkspaceProps {
  className?: string;
}

export function ResumeMatchWorkspace({ className }: ResumeMatchWorkspaceProps) {
  const {
    resumeText,
    jobDescription,
    updateResume,
    updateJobDescription,
    clearAll,
    isLoaded
  } = useResumeMatchStorage();

  const {
    result,
    isAnalyzing,
    error,
    analyze,
    clearResult
  } = useRealtimeResumeScore();

  const [isLoadingVault, setIsLoadingVault] = useState(false);

  // Load vault data on mount
  useEffect(() => {
    const loadVaultData = async () => {
      if (!isLoaded) return;
      if (resumeText) return; // Don't overwrite existing text

      setIsLoadingVault(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: vault } = await supabase
          .from('career_vault')
          .select('resume_raw_text')
          .eq('user_id', user.id)
          .single();

        if (vault?.resume_raw_text) {
          updateResume(vault.resume_raw_text);
          toast.success('Resume loaded from Career Vault');
        }
      } catch (error) {
        // Ignore - vault may not exist
      } finally {
        setIsLoadingVault(false);
      }
    };

    loadVaultData();
  }, [isLoaded]);

  const handleAnalyze = useCallback(() => {
    if (!resumeText || !jobDescription) {
      toast.error('Please add both resume and job description');
      return;
    }
    analyze(resumeText, jobDescription);
  }, [resumeText, jobDescription, analyze]);

  const handleReset = useCallback(() => {
    clearAll();
    clearResult();
    toast.success('Workspace cleared');
  }, [clearAll, clearResult]);

  const canAnalyze = resumeText.length >= 100 && jobDescription.length >= 50;
  const hasContent = resumeText.length > 0 || jobDescription.length > 0;

  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* Header with actions */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">ResumeMatch</h2>
          <p className="text-xs text-muted-foreground">
            Compare your resume against job descriptions
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasContent && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleReset}
              disabled={isAnalyzing}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          )}
          <Button 
            onClick={handleAnalyze}
            disabled={!canAnalyze || isAnalyzing}
            className="min-w-[140px]"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Analyze Match
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 3-Panel Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
        {/* Left: Resume Input */}
        <div className="flex flex-col min-h-[300px] lg:min-h-0">
          <ResumeInputPanel
            resumeText={resumeText}
            onResumeChange={updateResume}
            isAnalyzing={isAnalyzing || isLoadingVault}
          />
        </div>

        {/* Center: Job Description */}
        <div className="flex flex-col min-h-[300px] lg:min-h-0">
          <JobDescriptionPanel
            jobDescription={jobDescription}
            onJobDescriptionChange={updateJobDescription}
            isAnalyzing={isAnalyzing}
          />
        </div>

        {/* Right: Results */}
        <div className="flex flex-col min-h-[400px] lg:min-h-0">
          <ResultsPanel
            result={result}
            isAnalyzing={isAnalyzing}
            error={error}
            resumeText={resumeText}
            hasContent={hasContent}
          />
        </div>
      </div>

      {/* Mobile: Show arrow between panels */}
      <div className="lg:hidden flex justify-center py-2">
        <ArrowRight className="h-5 w-5 text-muted-foreground" />
      </div>
    </div>
  );
}
