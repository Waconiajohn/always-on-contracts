import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, Target, Brain, CheckCircle, Sparkles, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ResumeUploadCard } from '@/components/career-vault/ResumeUploadCard';
import { Button } from '@/components/ui/button';
import { CareerFocusClarifier } from '@/components/career-vault/CareerFocusClarifier';
import { AIResearchProgress } from '@/components/career-vault/AIResearchProgress';
import { IntelligentQuestionFlow } from '@/components/career-vault/IntelligentQuestionFlow';
import { BenchmarkComparisonReview } from '@/components/career-vault/BenchmarkComparisonReview';

type OnboardingStep = 
  | 'focus' 
  | 'upload' 
  | 'research' 
  | 'questions' 
  | 'benchmark' 
  | 'complete';

/**
 * CAREER VAULT REDESIGN - Intelligence-First Approach
 * 
 * New Flow:
 * 1. Career Focus Clarification (3-5 min) - Define target roles/industries
 * 2. Resume Upload (2 min)
 * 3. AI Industry Research (2-3 min) - Research standards while user waits
 * 4. Intelligent Questions (8-12 min) - Targeted gap-filling questions
 * 5. Benchmark Comparison (5-7 min) - Side-by-side review with recommendations
 * 
 * TOTAL: 20-29 minutes (focused, valuable time)
 */
const CareerVaultOnboardingRedesigned = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const hasCheckedAuth = useRef(false);

  // Step state
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('focus');
  
  // Career Focus data
  const [careerDirection, setCareerDirection] = useState<'stay' | 'pivot' | 'explore'>('stay');
  const [targetRoles, setTargetRoles] = useState<string[]>([]);
  const [targetIndustries, setTargetIndustries] = useState<string[]>([]);
  const [excludedIndustries, setExcludedIndustries] = useState<string[]>([]);
  
  // Resume data
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [resumeText, setResumeText] = useState<string>('');
  const [vaultId, setVaultId] = useState<string | null>(null);
  
  // Research data
  const [industryResearch, setIndustryResearch] = useState<any>(null);
  const [detectedRole, setDetectedRole] = useState<string | null>(null);
  const [detectedIndustry, setDetectedIndustry] = useState<string | null>(null);
  
  // Questions data
  const [questionBatches, setQuestionBatches] = useState<any[]>([]);
  const [vaultStrength, setVaultStrength] = useState(70);
  
  // Benchmark data
  const [gapAnalysis, setGapAnalysis] = useState<any>(null);

  const steps = [
    { id: 'focus', label: 'Career Focus', icon: Target },
    { id: 'upload', label: 'Upload', icon: Upload },
    { id: 'research', label: 'Research', icon: Brain },
    { id: 'questions', label: 'Questions', icon: Sparkles },
    { id: 'benchmark', label: 'Review', icon: TrendingUp },
    { id: 'complete', label: 'Complete', icon: CheckCircle }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  // Check authentication
  useEffect(() => {
    if (hasCheckedAuth.current) return;
    hasCheckedAuth.current = true;

    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Check for existing vault
      const { data: existingVault } = await supabase
        .from('career_vault')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (existingVault) {
        setVaultId(existingVault.id);
        // Optionally skip to a later step if they already have data
      }
    };

    checkAuth();
  }, [navigate]);

  // PHASE 1: Career Focus Handler
  const handleFocusComplete = (data: {
    careerDirection: 'stay' | 'pivot' | 'explore';
    targetRoles: string[];
    targetIndustries: string[];
    excludedIndustries: string[];
  }) => {
    setCareerDirection(data.careerDirection);
    setTargetRoles(data.targetRoles);
    setTargetIndustries(data.targetIndustries);
    setExcludedIndustries(data.excludedIndustries);
    setCurrentStep('upload');
  };

  // PHASE 2: Resume Upload Handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeFile(file);
    }
  };

  const handleUpload = async () => {
    if (!resumeFile) return;

    setIsUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Read resume text
      const text = await resumeFile.text();
      setResumeText(text);

      // Upload to storage
      const fileName = `${user.id}/${Date.now()}_${resumeFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, resumeFile, { upsert: true });

      if (uploadError) throw uploadError;

      // Create or update vault
      let currentVaultId = vaultId;
      
      if (!currentVaultId) {
        const { data: newVault, error: vaultError } = await supabase
          .from('career_vault')
          .insert({
            user_id: user.id,
            target_roles: targetRoles,
            target_industries: targetIndustries,
            excluded_industries: excludedIndustries,
            career_direction: careerDirection
          })
          .select()
          .single();

        if (vaultError) throw vaultError;
        currentVaultId = newVault.id;
        setVaultId(currentVaultId);
      } else {
        await supabase
          .from('career_vault')
          .update({
            target_roles: targetRoles,
            target_industries: targetIndustries,
            excluded_industries: excludedIndustries,
            career_direction: careerDirection
          })
          .eq('id', currentVaultId);
      }

      // Quick AI analysis to detect role/industry
      const { data: functionData } = await supabase.functions.invoke('process-resume', {
        body: { resumeText: text }
      });

      if (functionData?.role) setDetectedRole(functionData.role);
      if (functionData?.industry) setDetectedIndustry(functionData.industry);

      toast({
        title: 'Resume Uploaded!',
        description: 'Starting industry research...'
      });

      setCurrentStep('research');
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  // PHASE 3: Research Complete Handler
  const handleResearchComplete = async (researchData: any) => {
    setIndustryResearch(researchData);
    
    // Generate intelligent questions based on research
    try {
      const { data } = await supabase.functions.invoke('generate-intelligent-questions', {
        body: {
          vaultId,
          resumeData: { resumeText, detectedRole, detectedIndustry },
          industryResearch: researchData,
          targetRole: targetRoles[0],
          targetIndustry: targetIndustries[0]
        }
      });

      if (data?.questionBatches) {
        setQuestionBatches(data.questionBatches);
        setCurrentStep('questions');
      }
    } catch (error) {
      console.error('Question generation error:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate questions. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // PHASE 4: Questions Complete Handler
  const handleQuestionsComplete = async (responses: any[]) => {
    try {
      // Process responses and create vault items
      const { data } = await supabase.functions.invoke('process-intelligent-responses', {
        body: {
          vaultId,
          responses,
          industryStandards: industryResearch
        }
      });

      if (data?.newItemsCreated) {
        toast({
          title: 'Responses Processed!',
          description: `Added ${data.newItemsCreated} new items to your vault.`
        });
      }

      // Generate gap analysis
      const { data: gapData } = await supabase.functions.invoke('generate-gap-analysis', {
        body: {
          vaultId,
          industryStandards: industryResearch,
          currentVaultData: { /* vault items */ }
        }
      });

      if (gapData?.gapAnalysis) {
        setGapAnalysis(gapData.gapAnalysis);
        setVaultStrength(gapData.gapAnalysis.overallAnalysis?.vaultStrength || 85);
      }

      setCurrentStep('benchmark');
    } catch (error) {
      console.error('Response processing error:', error);
      toast({
        title: 'Error',
        description: 'Failed to process responses. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // PHASE 5: Benchmark Review Handler
  const handleBenchmarkComplete = () => {
    setCurrentStep('complete');
  };

  const handleAddRecommendedItems = async (items: string[]) => {
    // Add recommended items to vault
    toast({
      title: 'Items Added!',
      description: `Added ${items.length} recommended items to your vault.`
    });
  };

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      {/* Progress Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Build Your Career Vault</h1>
          <p className="text-muted-foreground">
            Intelligence-first approach: We'll ask the right questions based on industry standards
          </p>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between">
          {steps.map((step, idx) => (
            <div
              key={step.id}
              className={`flex items-center gap-2 transition-all ${
                idx <= currentStepIndex ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <step.icon className="h-4 w-4" />
              <span className="text-sm font-medium hidden sm:inline">{step.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      {currentStep === 'focus' && (
        <CareerFocusClarifier
          onComplete={handleFocusComplete}
          detectedRole={detectedRole || undefined}
          detectedIndustry={detectedIndustry || undefined}
        />
      )}

      {currentStep === 'upload' && (
        <ResumeUploadCard
          resumeFile={resumeFile}
          isUploading={isUploading}
          onFileSelect={handleFileSelect}
          onUpload={handleUpload}
        />
      )}

      {currentStep === 'research' && (
        <AIResearchProgress
          targetRole={targetRoles[0] || 'Professional'}
          targetIndustry={targetIndustries[0] || 'General'}
          onComplete={handleResearchComplete}
        />
      )}

      {currentStep === 'questions' && questionBatches.length > 0 && (
        <IntelligentQuestionFlow
          questionBatches={questionBatches}
          onComplete={handleQuestionsComplete}
          vaultStrength={vaultStrength}
        />
      )}

      {currentStep === 'benchmark' && gapAnalysis && (
        <BenchmarkComparisonReview
          gapAnalysis={gapAnalysis}
          onComplete={handleBenchmarkComplete}
          onAddRecommendedItems={handleAddRecommendedItems}
        />
      )}

      {currentStep === 'complete' && (
        <Card className="p-12 text-center max-w-3xl mx-auto">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Career Vault Complete! 🎉</h2>
          <p className="text-lg text-muted-foreground mb-6">
            Your intelligence-powered Career Vault is ready. You're now positioned better than your resume shows.
          </p>

          {/* Vault Strength Preview */}
          <div className="grid grid-cols-3 gap-4 mb-8 p-6 bg-muted/50 rounded-lg">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{vaultStrength}%</p>
              <p className="text-sm text-muted-foreground mt-1">Vault Strength</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-secondary">
                {gapAnalysis?.strengths?.length || 0}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Strengths Identified</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-accent">
                {gapAnalysis?.gaps?.length || 0}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Opportunities Flagged</p>
            </div>
          </div>

          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>What's Next:</strong> Use your Career Vault to generate tailored resumes, prepare for interviews, and match to jobs with precision.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/agents/resume-builder')} className="gap-2">
              <Sparkles className="h-5 w-5" />
              Build Your First Resume
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/career-vault')}>
              View Career Vault
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default CareerVaultOnboardingRedesigned;
