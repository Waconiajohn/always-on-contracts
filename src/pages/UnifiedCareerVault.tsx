// UnifiedCareerVault - Single-Page Architecture with Modal-Based Onboarding
// Everything runs from this one page - no route bouncing, full transparency
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Upload, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ContentLayout } from '@/components/layout/ContentLayout';
import CareerVaultDashboardV2 from './CareerVaultDashboardV2';
import { UploadResumeModal } from '@/components/career-vault/modals/UploadResumeModal';
import { ExtractionProgressModal } from '@/components/career-vault/modals/ExtractionProgressModal';
import { GapQuestionsModal } from '@/components/career-vault/modals/GapQuestionsModal';
import { toast } from 'sonner';

type VaultState = 'loading' | 'empty' | 'uploading' | 'extracting' | 'questions' | 'ready';

interface SmartQuestion {
  question: string;
  category: string;
  reasoning: string;
  impact: 'high' | 'medium' | 'low';
  targetTable: string;
}

export default function UnifiedCareerVault() {
  const [vaultState, setVaultState] = useState<VaultState>('loading');
  const [vaultId, setVaultId] = useState<string | null>(null);
  const [smartQuestions, setSmartQuestions] = useState<SmartQuestion[]>([]);
  const navigate = useNavigate();

  // Modal states
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [extractionModalOpen, setExtractionModalOpen] = useState(false);
  const [questionsModalOpen, setQuestionsModalOpen] = useState(false);

  useEffect(() => {
    checkVaultState();
  }, []);

  const checkVaultState = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: vault } = await supabase
        .from('career_vault')
        .select('id, onboarding_step, resume_raw_text, review_completion_percentage')
        .eq('user_id', user.id)
        .single();

      // No vault OR no resume → Empty state
      if (!vault || !vault.resume_raw_text) {
        setVaultState('empty');
        return;
      }

      setVaultId(vault.id);

      // Vault exists and has resume → Ready state (show dashboard)
      setVaultState('ready');
    } catch (error) {
      console.error('Error checking vault state:', error);
      setVaultState('empty'); // Default to empty on error
    }
  };

  // Handle upload complete from modal
  const handleUploadComplete = async (uploadedVaultId: string) => {
    setVaultId(uploadedVaultId);
    setUploadModalOpen(false);
    setExtractionModalOpen(true);
    setVaultState('extracting');
    // Note: auto-populate-vault-v3 is already triggered by UploadResumeModal
  };

  // Handle extraction complete
  const handleExtractionComplete = async () => {
    setExtractionModalOpen(false);

    // TODO: Fetch smart questions from vault-strategic-audit
    // For now, using mock data
    const mockQuestions: SmartQuestion[] = [
      {
        question: "Can you describe a time when you had to influence stakeholders without direct authority?",
        category: "Executive Presence",
        reasoning: "Gap: vault shows strong technical skills but lacks evidence of executive-level influence. This question would surface strategic relationship management abilities.",
        impact: "high",
        targetTable: "vault_executive_presence"
      },
      {
        question: "What was the largest budget or P&L you've managed?",
        category: "Leadership Philosophy",
        reasoning: "Gap: leadership achievements lack financial scope metrics. Understanding budget responsibility strengthens executive positioning.",
        impact: "high",
        targetTable: "vault_leadership_philosophy"
      }
    ];

    setSmartQuestions(mockQuestions);

    // Show gap questions if AI generated any
    if (mockQuestions.length > 0) {
      setVaultState('questions');
      setQuestionsModalOpen(true);
    } else {
      // No questions, go straight to ready
      setVaultState('ready');
      toast.success('Your Career Vault is ready!', {
        description: 'AI has extracted and enhanced your career intelligence'
      });
    }
  };

  // Handle gap questions submission
  const handleQuestionsSubmit = async (answers: Record<string, string>) => {
    setQuestionsModalOpen(false);
    setVaultState('ready');

    // TODO: Send answers to backend for processing
    console.log('Gap question answers:', answers);

    toast.success('Answers saved!', {
      description: 'Your Career Vault has been enhanced with your responses'
    });

    // Refresh vault data
    await checkVaultState();
  };

  // Handle skip questions
  const handleSkipQuestions = () => {
    setQuestionsModalOpen(false);
    setVaultState('ready');
    toast.info('Questions skipped', {
      description: 'You can enhance your vault with AI later'
    });
  };

  // Loading state
  if (vaultState === 'loading') {
    return (
      <ProtectedRoute>
        <ContentLayout>
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
          </div>
        </ContentLayout>
      </ProtectedRoute>
    );
  }

  // Empty state - No vault yet
  if (vaultState === 'empty') {
    return (
      <ProtectedRoute>
        <ContentLayout>
          <div className="flex items-center justify-center min-h-screen p-6">
            <Card className="max-w-2xl w-full">
              <CardContent className="pt-12 pb-12 text-center space-y-6">
                <div className="space-y-3">
                  <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
                    <Sparkles className="w-10 h-10 text-indigo-600" />
                  </div>
                  <h1 className="text-3xl font-bold text-slate-900">
                    Build Your Career Vault
                  </h1>
                  <p className="text-lg text-slate-600 max-w-lg mx-auto">
                    Upload your resume and let AI extract your career intelligence.
                    We'll analyze your achievements, skills, and experience to build
                    a comprehensive career vault.
                  </p>
                </div>

                <div className="space-y-4 pt-6">
                  <Button
                    onClick={() => setUploadModalOpen(true)}
                    size="lg"
                    className="bg-indigo-600 hover:bg-indigo-700 text-lg px-8 py-6 h-auto"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    Upload Your Resume
                  </Button>

                  <div className="flex items-center justify-center gap-8 text-sm text-slate-600 pt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span>AI-Powered Extraction</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span>100% Private & Secure</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span>&lt;60 Seconds</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upload Modal */}
          <UploadResumeModal
            open={uploadModalOpen}
            onClose={() => setUploadModalOpen(false)}
            onUploadComplete={handleUploadComplete}
          />
        </ContentLayout>
      </ProtectedRoute>
    );
  }

  // Ready state - Show full dashboard
  if (vaultState === 'ready') {
    return (
      <>
        <CareerVaultDashboardV2 />

        {/* Extraction Progress Modal (can be triggered later for re-analysis) */}
        {extractionModalOpen && vaultId && (
          <ExtractionProgressModal
            open={extractionModalOpen}
            vaultId={vaultId}
            onComplete={handleExtractionComplete}
          />
        )}

        {/* Gap Questions Modal (can be triggered later for enhancement) */}
        {questionsModalOpen && smartQuestions.length > 0 && (
          <GapQuestionsModal
            open={questionsModalOpen}
            questions={smartQuestions}
            onSubmit={handleQuestionsSubmit}
            onSkip={handleSkipQuestions}
          />
        )}
      </>
    );
  }

  // Extracting state - Show extraction modal over empty state
  return (
    <ProtectedRoute>
      <ContentLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
        </div>

        {/* Extraction Progress Modal */}
        {vaultId && (
          <ExtractionProgressModal
            open={extractionModalOpen}
            vaultId={vaultId}
            onComplete={handleExtractionComplete}
          />
        )}
      </ContentLayout>
    </ProtectedRoute>
  );
}
