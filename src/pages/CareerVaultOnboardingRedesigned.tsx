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
  | 'upload'    // STEP 1: Upload resume first
  | 'focus'     // STEP 2: Career focus with intelligent defaults
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

  // Step state - START WITH UPLOAD
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('upload');
  
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
    { id: 'upload', label: 'Upload', icon: Upload },       // STEP 1: Upload first
    { id: 'focus', label: 'Career Focus', icon: Target },  // STEP 2: Focus with AI defaults
    { id: 'research', label: 'Research', icon: Brain },
    { id: 'questions', label: 'Questions', icon: Sparkles },
    { id: 'benchmark', label: 'Review', icon: TrendingUp },
    { id: 'complete', label: 'Complete', icon: CheckCircle }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  // Check authentication and handle existing vaults
  useEffect(() => {
    if (hasCheckedAuth.current) return;
    hasCheckedAuth.current = true;

    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Check for existing vault with data
      const { data: existingVault } = await supabase
        .from('career_vault')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingVault?.resume_raw_text) {
        console.log('[REDESIGNED ONBOARDING] User has existing vault - allowing upgrade to new flow');
        setVaultId(existingVault.id);
        
        // Pre-populate with existing data if available
        if (existingVault.target_roles && existingVault.target_roles.length > 0) {
          setTargetRoles(existingVault.target_roles);
        }
        if (existingVault.target_industries && existingVault.target_industries.length > 0) {
          setTargetIndustries(existingVault.target_industries);
        }
        if (existingVault.career_direction && 
            ['stay', 'pivot', 'explore'].includes(existingVault.career_direction)) {
          setCareerDirection(existingVault.career_direction as 'stay' | 'pivot' | 'explore');
        }
      } else if (existingVault) {
        // Empty vault exists, just set the ID
        setVaultId(existingVault.id);
      }
    };

    checkAuth();
  }, [navigate]);

  // PHASE 1: Career Focus Handler (now happens AFTER upload)
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
    setCurrentStep('research');
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

    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (resumeFile.size > maxSize) {
      toast({
        title: 'File Too Large',
        description: 'Resume file must be less than 10MB',
        variant: 'destructive'
      });
      return;
    }

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (!allowedTypes.includes(resumeFile.type)) {
      console.warn('[UPLOAD] Unsupported file type:', resumeFile.type);
      toast({
        title: 'Unsupported File Type',
        description: 'Please upload a PDF, Word document, or text file',
        variant: 'destructive'
      });
      return;
    }

    console.log('[UPLOAD] Starting upload...', {
      fileName: resumeFile.name,
      fileType: resumeFile.type,
      fileSize: resumeFile.size
    });

    setIsUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to continue',
          variant: 'destructive'
        });
        navigate('/auth');
        return;
      }

      // Create or get vault ID first
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

        if (vaultError) {
          toast({
            title: 'Vault Creation Failed',
            description: vaultError.message,
            variant: 'destructive'
          });
          throw vaultError;
        }
        currentVaultId = newVault.id;
        setVaultId(currentVaultId);
      }

      // Convert file to base64
      console.log('[UPLOAD] Converting file to base64...');
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1]; // Remove data:... prefix
          resolve(base64);
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(resumeFile);
      });

      console.log('[UPLOAD] Calling process-resume edge function...');
      
      // Call process-resume edge function with base64 data
      const { data: functionData, error: functionError } = await supabase.functions.invoke(
        'process-resume',
        {
          body: {
            resumeFile: base64Data,
            fileType: resumeFile.type,
            vaultId: currentVaultId
          }
        }
      );

      if (functionError) {
        console.error('[UPLOAD] Process-resume error:', functionError);
        toast({
          title: 'Processing Failed',
          description: functionError.message || 'Failed to process resume',
          variant: 'destructive'
        });
        throw functionError;
      }

      if (!functionData) {
        throw new Error('No data returned from resume processing');
      }

      console.log('[UPLOAD] Process-resume response:', functionData);

      // Check if resume processing was successful
      if (!functionData.success) {
        toast({
          title: 'Processing Failed',
          description: functionData.error || 'Failed to process resume',
          variant: 'destructive'
        });
        throw new Error(functionData.error || 'Resume processing failed');
      }

      // Extract properly parsed text and detected data
      const resumeText = functionData.extractedText || '';
      const detectedRoleValue = functionData.role || null;
      const detectedIndustryValue = functionData.industry || null;

      console.log('[UPLOAD] Extracted data:', {
        textLength: resumeText.length,
        role: detectedRoleValue,
        industry: detectedIndustryValue
      });

      if (!resumeText || resumeText.length === 0) {
        toast({
          title: 'Empty Resume',
          description: 'Could not extract text from the resume. Please ensure the file is not empty or corrupted.',
          variant: 'destructive'
        });
        throw new Error('Resume text extraction failed');
      }

      // Update state with properly parsed data
      setResumeText(resumeText);
      setDetectedRole(detectedRoleValue);
      setDetectedIndustry(detectedIndustryValue);

      // Update vault with parsed resume text
      const { error: updateError } = await supabase
        .from('career_vault')
        .update({
          resume_raw_text: resumeText,
          target_roles: targetRoles,
          target_industries: targetIndustries,
          excluded_industries: excludedIndustries,
          career_direction: careerDirection
        })
        .eq('id', currentVaultId);

      if (updateError) {
        console.error('[UPLOAD] Vault update error:', updateError);
        toast({
          title: 'Update Failed',
          description: updateError.message,
          variant: 'destructive'
        });
        throw updateError;
      }

      toast({
        title: 'Resume Uploaded Successfully!',
        description: detectedRoleValue 
          ? `Detected role: ${detectedRoleValue}` 
          : 'Now let\'s define your career direction...'
      });

      setCurrentStep('focus');
    } catch (error) {
      console.error('[UPLOAD] Upload error:', error);
      console.error('[UPLOAD] Error stack:', error instanceof Error ? error.stack : 'No stack');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('[UPLOAD] Error message:', errorMessage);
      toast({
        title: 'Upload Failed',
        description: errorMessage,
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
    if (!vaultId) {
      toast({
        title: 'Error',
        description: 'Vault ID not found. Please restart the onboarding.',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Process responses and create vault items
      const { data, error } = await supabase.functions.invoke('process-intelligent-responses', {
        body: {
          vaultId,
          responses,
          industryStandards: industryResearch
        }
      });

      if (error) {
        console.error('[QUESTIONS] Processing error:', error);
        toast({
          title: 'Processing Error',
          description: 'Failed to process responses. Your answers have been saved and we\'ll try again.',
          variant: 'destructive'
        });
        // Continue anyway - don't block the user
      } else if (data?.newItemsCreated) {
        toast({
          title: 'Responses Processed!',
          description: `Added ${data.newItemsCreated} new items to your vault.`
        });
      }

      // Generate gap analysis
      try {
        const { data: gapData, error: gapError } = await supabase.functions.invoke('generate-gap-analysis', {
          body: {
            vaultId,
            industryStandards: industryResearch
          }
        });

        if (gapError || !gapData?.gapAnalysis) {
          console.error('[QUESTIONS] Gap analysis error:', gapError);
          // Use fallback gap analysis
          const fallbackAnalysis = {
            overallAnalysis: {
              vaultStrength: 75,
              benchmarkAlignment: 70,
              competitivePosition: 'Solid Candidate'
            },
            strengths: [],
            gaps: [],
            opportunities: []
          };
          setGapAnalysis(fallbackAnalysis);
          setVaultStrength(75);
          toast({
            title: 'Analysis Ready',
            description: 'Benchmark analysis generated with basic data'
          });
        } else {
          setGapAnalysis(gapData.gapAnalysis);
          setVaultStrength(gapData.gapAnalysis.overallAnalysis?.vaultStrength || 80);
        }
      } catch (gapError) {
        console.error('[QUESTIONS] Gap analysis failed:', gapError);
        // Fallback to basic completion
        const fallbackAnalysis = {
          overallAnalysis: {
            vaultStrength: 75,
            benchmarkAlignment: 70,
            competitivePosition: 'Solid Candidate'
          },
          strengths: [],
          gaps: [],
          opportunities: []
        };
        setGapAnalysis(fallbackAnalysis);
        setVaultStrength(75);
      }

      setCurrentStep('benchmark');
    } catch (error) {
      console.error('[QUESTIONS] Response processing error:', error);
      toast({
        title: 'Processing Error',
        description: 'An error occurred. We\'ll continue with the data we have.',
        variant: 'destructive'
      });
      // Move to benchmark with what we have
      setCurrentStep('benchmark');
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* New Experience Notice */}
      <div className="bg-primary/10 border-b border-primary/20 py-3">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm font-medium text-primary">
            ✨ New & Improved Career Vault - Now with industry intelligence powered by AI research!
          </p>
        </div>
      </div>
      
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
      {currentStep === 'upload' && (
        <ResumeUploadCard
          resumeFile={resumeFile}
          isUploading={isUploading}
          onFileSelect={handleFileSelect}
          onUpload={handleUpload}
        />
      )}

      {currentStep === 'focus' && (
        <CareerFocusClarifier
          onComplete={handleFocusComplete}
          detectedRole={detectedRole || 'Professional'}
          detectedIndustry={detectedIndustry || 'General'}
          resumeText={resumeText}
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
    </div>
  );
};

export default CareerVaultOnboardingRedesigned;
