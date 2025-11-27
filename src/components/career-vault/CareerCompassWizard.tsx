import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Target, FileText, Search, Zap, Trophy, Home, Loader2, ArrowRight } from 'lucide-react';
import ResumeAnalysisStep from './onboarding/ResumeAnalysisStep';
import CareerDirectionStep from './onboarding/CareerDirectionStep';
import MarketResearchStep from './onboarding/MarketResearchStep';
import GapFillingQuestionsFlow from './onboarding/GapFillingQuestionsFlow';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Wizard Steps
const STEPS = [
  { id: 'welcome', label: 'Welcome', icon: Home },
  { id: 'resume', label: 'Resume Foundation', icon: FileText },
  { id: 'direction', label: 'Target Declaration', icon: Target },
  { id: 'market', label: 'Market Research', icon: Search },
  { id: 'gaps', label: 'Gap Analysis', icon: Zap },
  { id: 'complete', label: 'Career Vault Ready', icon: Trophy },
];

export default function CareerCompassWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // Wizard State
  const [vaultId, setVaultId] = useState<string>('');
  const [resumeText, setResumeText] = useState<string>('');
  const [initialAnalysis, setInitialAnalysis] = useState<any>(null);
  const [targetRoles, setTargetRoles] = useState<string[]>([]);
  const [targetIndustries, setTargetIndustries] = useState<string[]>([]);
  const [industryResearch, setIndustryResearch] = useState<any>(null);

  const currentStep = STEPS[currentStepIndex];
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  // Restore state on load
  useEffect(() => {
    restoreState();
  }, []);

  const restoreState = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Get Vault Data
      const { data: vault } = await supabase
        .from('career_vault')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (vault) {
        setVaultId(vault.id);
        setResumeText(vault.resume_raw_text || '');
        setTargetRoles(vault.target_roles || []);
        setTargetIndustries(vault.target_industries || []);

        // Force step from URL if present (e.g. ?step=direction)
        const stepParam = searchParams.get('step');
        if (stepParam) {
          const stepIndex = STEPS.findIndex(s => s.id === stepParam);
          if (stepIndex !== -1) {
            setCurrentStepIndex(stepIndex);
            setIsLoading(false);
            return;
          }
        }

        // Otherwise determine step based on data presence
        // CRITICAL: Never skip resume step if no resume exists
        let step = 0; // Welcome
        
        console.log('🔍 RESTORE STATE: Checking vault data...', {
          hasResumeText: !!vault.resume_raw_text,
          resumeLength: vault.resume_raw_text?.length || 0,
          hasTargetRoles: !!vault.target_roles,
          targetRolesCount: vault.target_roles?.length || 0,
          careerDirection: vault.career_direction,
          onboardingStep: vault.onboarding_step
        });
        
        // Only advance past resume step if resume exists
        if (vault.resume_raw_text && vault.resume_raw_text.trim().length > 0) {
          step = 2; // Can skip to Direction step
          
          // Only advance to market research if we ALSO have target roles/industries
          if (vault.target_roles && vault.target_roles.length > 0) {
            step = 3; // Move to Market Research
            
            // Check if market research is complete
            const { data: research } = await supabase
              .from('vault_market_research')
              .select('*')
              .eq('vault_id', vault.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            // Only advance to gap analysis if we have research
            if (research) {
              step = 4; 
            }
          }
        }
        
        // CRITICAL GUARD: Force step 1 if no resume exists, regardless of other state
        if (step > 1 && (!vault.resume_raw_text || vault.resume_raw_text.trim().length === 0)) {
          console.warn('⚠️ GUARD TRIGGERED: Step was', step, 'but no resume exists. Forcing to step 1 (Resume Upload).');
          step = 1;
        }
        
        console.log('✅ RESTORE STATE: Final step determined:', step, STEPS[step]?.label);
        
        if (step > 0) {
          setCurrentStepIndex(step);
        }
      }
    } catch (error) {
      console.error('Error restoring state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishLater = () => {
    navigate('/career-vault');
    toast({
      title: "Progress Saved",
      description: "You can return to the Career Compass at any time."
    });
  };

  // Step Handlers
  const handleWelcomeNext = () => {
    // If resume exists, we can skip to Step 2, otherwise Step 1
    if (resumeText) {
      setCurrentStepIndex(2);
    } else {
      setCurrentStepIndex(1);
    }
  };

  const handleResumeComplete = (data: { vaultId: string; resumeText: string; initialAnalysis: any }) => {
    setVaultId(data.vaultId);
    setResumeText(data.resumeText);
    setInitialAnalysis(data.initialAnalysis);
    setCurrentStepIndex(2); // Move to Direction
  };

  const handleDirectionComplete = (data: { targetRoles: string[]; targetIndustries: string[] }) => {
    setTargetRoles(data.targetRoles);
    setTargetIndustries(data.targetIndustries);
    setCurrentStepIndex(3); // Move to Market Research
  };

  const handleMarketResearchComplete = (data: { marketData: any; researchId: string }) => {
    setIndustryResearch([{ results: data.marketData }]); 
    setCurrentStepIndex(4); // Move to Gap Analysis
  };

  const handleGapAnalysisComplete = (_data: { newVaultStrength: number }) => {
    setCurrentStepIndex(5); // Move to Complete
    
    setTimeout(() => {
      navigate('/career-vault');
      toast({
        title: "Career Compass Complete!",
        description: "Your vault has been built and optimized based on your goals."
      });
    }, 5000); // 5 seconds to read the summary
  };

  const handleSkipGapAnalysis = () => {
    setCurrentStepIndex(5); // Move to Complete
    
    setTimeout(() => {
      navigate('/career-vault');
      toast({
        title: "Career Compass Complete!",
        description: "Your vault has been built and optimized based on your goals."
      });
    }, 5000); // 5 seconds to read the summary
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/10 to-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header with Exit Button */}
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Career Compass</h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              {currentStep.label}
            </p>
          </div>
          <Button variant="outline" onClick={handleFinishLater}>
            Finish Later
          </Button>
        </div>

        {/* Progress Stepper */}
        <div className="bg-card rounded-xl shadow-sm border p-6">
          <div className="relative">
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-muted">
              <div
                style={{ width: `${progress}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap justify-center bg-primary transition-all duration-500"
              ></div>
            </div>
            <div className="flex justify-between">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentStepIndex;
                const isCompleted = index < currentStepIndex;

                return (
                  <div 
                    key={step.id} 
                    className={`flex flex-col items-center ${
                      isActive ? 'text-primary' : isCompleted ? 'text-accent' : 'text-muted-foreground'
                    }`}
                  >
                    <div className={`
                      flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 mb-2 transition-all
                      ${isActive 
                        ? 'border-primary bg-primary/10' 
                        : isCompleted 
                          ? 'border-accent bg-accent/10' 
                          : 'border-border bg-muted'
                      }
                    `}>
                      {isCompleted ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                    </div>
                    <span className="text-[10px] sm:text-xs font-medium hidden sm:block">{step.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStepIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentStepIndex === 0 && (
              <Card className="bg-card/80 backdrop-blur-sm border shadow-xl text-center py-12">
                <CardContent className="space-y-8 max-w-2xl mx-auto">
                  <div className="space-y-4">
                    <h2 className="text-3xl font-bold">Welcome to Your Career Vault</h2>
                    <p className="text-lg text-muted-foreground">
                      We've redesigned the career journey to be logical, data-driven, and effective.
                      Here is the roadmap we will follow together:
                    </p>
                  </div>

                  <div className="grid gap-6 text-left">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">1. Foundation</h3>
                        <p className="text-muted-foreground">Upload your resume so we understand your starting point.</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <Target className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">2. Direction</h3>
                        <p className="text-muted-foreground">Declare your target role and industry. Where do you want to go?</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                        <Search className="w-5 h-5 text-success" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">3. Market Reality</h3>
                        <p className="text-muted-foreground">We analyze live job postings to tell you exactly what the market demands.</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center flex-shrink-0">
                        <Zap className="w-5 h-5 text-warning" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">4. Gap Closing</h3>
                        <p className="text-muted-foreground">We identify gaps and help you fill them with targeted AI questions.</p>
                      </div>
                    </div>
                  </div>

                  <Button size="lg" onClick={handleWelcomeNext} className="w-full sm:w-auto">
                    Start Your Journey
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {currentStepIndex === 1 && (
              <ResumeAnalysisStep 
                onComplete={handleResumeComplete} 
                existingData={{
                  vaultId,
                  resumeText,
                  initialAnalysis
                }}
              />
            )}

            {currentStepIndex === 2 && (
              <CareerDirectionStep 
                onComplete={handleDirectionComplete}
                initialAnalysis={initialAnalysis || { detectedRole: 'Unknown', detectedIndustry: 'General' }} // Fallback if missing
                vaultId={vaultId}
              />
            )}

            {currentStepIndex === 3 && (
              <MarketResearchStep
                onComplete={handleMarketResearchComplete}
                vaultId={vaultId}
                targetRoles={targetRoles}
                targetIndustries={targetIndustries}
                resumeText={resumeText}
              />
            )}

            {currentStepIndex === 4 && (
              <GapFillingQuestionsFlow
                vaultId={vaultId}
                currentVaultStrength={0}
                industryResearch={industryResearch}
                onComplete={handleGapAnalysisComplete}
                onSkip={handleSkipGapAnalysis}
              />
            )}

            {currentStepIndex === 5 && (
              <Card className="bg-white/80 backdrop-blur-sm border-2 border-primary/30 shadow-xl">
                <CardContent className="py-12 space-y-8">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                      <Trophy className="w-12 h-12 text-primary" />
                    </div>
                    <h2 className="text-4xl font-bold mb-4">Career Compass Complete!</h2>
                    <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
                      Your Career Vault has been built and is ready to power your job search.
                    </p>
                  </div>
                  
                  {/* Summary Stats */}
                  <Card className="max-w-2xl mx-auto border-2">
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-3 gap-6 text-center">
                        <div>
                          <div className="text-3xl font-bold text-primary mb-1">
                            {initialAnalysis?.items_extracted || '50+'}
                          </div>
                          <div className="text-sm text-muted-foreground">Items Extracted</div>
                        </div>
                        <div>
                          <div className="text-3xl font-bold text-primary mb-1">
                            {targetRoles.length || 1}
                          </div>
                          <div className="text-sm text-muted-foreground">Target Roles</div>
                        </div>
                        <div>
                          <div className="text-3xl font-bold text-primary mb-1">
                            25+
                          </div>
                          <div className="text-sm text-muted-foreground">Jobs Analyzed</div>
                        </div>
                      </div>
                      
                      {targetRoles.length > 0 && (
                        <div className="mt-6 pt-6 border-t">
                          <p className="text-sm text-muted-foreground mb-2">Focused On:</p>
                          <div className="flex flex-wrap gap-2 justify-center">
                            {targetRoles.slice(0, 3).map(role => (
                              <span key={role} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                                {role}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <div className="text-center space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Your vault is now optimized for {targetRoles[0] || 'your target role'}
                    </p>
                    <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
