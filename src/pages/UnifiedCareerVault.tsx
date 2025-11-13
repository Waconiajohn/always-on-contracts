// UnifiedCareerVault - Single-Page Architecture with Modal-Based Onboarding
// Everything runs from this one page - no route bouncing, full transparency
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Upload, Sparkles, FileText, Brain, TrendingUp, Award, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ContentLayout } from '@/components/layout/ContentLayout';
import { UploadResumeModal } from '@/components/career-vault/modals/UploadResumeModal';
import { ExtractionProgressModal } from '@/components/career-vault/modals/ExtractionProgressModal';
import { GapQuestionsModal } from '@/components/career-vault/modals/GapQuestionsModal';
import { runVaultStrategicAudit, submitSmartQuestionAnswer, type SmartQuestion } from '@/lib/services/vaultStrategicAudit';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

type VaultState = 'loading' | 'empty' | 'uploading' | 'extracting' | 'questions' | 'ready';

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
    
    if (!vaultId) {
      setVaultState('ready');
      return;
    }

    setVaultState('questions');
    
    try {
      const auditResult = await runVaultStrategicAudit(vaultId);
      setSmartQuestions(auditResult.smartQuestions || []);
      
      if (auditResult.smartQuestions && auditResult.smartQuestions.length > 0) {
        setQuestionsModalOpen(true);
      } else {
        // No questions to ask, go straight to ready
        setVaultState('ready');
        toast.success('Your Career Vault is ready!', {
          description: 'AI has extracted and enhanced your career intelligence'
        });
      }
    } catch (error) {
      console.error("Error running strategic audit:", error);
      toast.error("Failed to generate smart questions");
      // Still show ready state even if audit fails
      setVaultState('ready');
    }
  };

  // Handle gap questions submission
  const handleQuestionsSubmit = async (answers: Record<string, string>) => {
    if (!vaultId) return;
    
    setQuestionsModalOpen(false);
    
    const submissionPromises = Object.entries(answers).map(([index, answer]) => {
      const question = smartQuestions[parseInt(index)];
      return submitSmartQuestionAnswer(vaultId, question.targetTable, answer, question);
    });

    try {
      const results = await Promise.all(submissionPromises);
      const failedCount = results.filter(r => !r.success).length;
      
      if (failedCount > 0) {
        toast.error(`${failedCount} answer(s) failed to save`);
      } else if (results.length > 0) {
        toast.success("All answers saved successfully!");
      }
    } catch (error) {
      console.error("Error submitting answers:", error);
      toast.error("Failed to save some answers");
    }
    
    setVaultState('ready');
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

  // Ready state - Show clean vault dashboard
  if (vaultState === 'ready') {
    return (
      <ProtectedRoute>
        <ContentLayout>
          <div className="p-8 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Career Vault</h1>
                <p className="text-slate-600 mt-1">Your AI-extracted career intelligence</p>
              </div>
              <Button
                onClick={() => setUploadModalOpen(true)}
                variant="outline"
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload New Resume
              </Button>
            </div>

            {/* Simple Vault Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <VaultStatCard
                icon={Award}
                title="Power Phrases"
                vaultId={vaultId}
                table="vault_power_phrases"
                iconColor="text-indigo-600"
                bgColor="bg-indigo-50"
              />
              <VaultStatCard
                icon={Briefcase}
                title="Skills"
                vaultId={vaultId}
                table="vault_transferable_skills"
                iconColor="text-purple-600"
                bgColor="bg-purple-50"
              />
              <VaultStatCard
                icon={Brain}
                title="Competencies"
                vaultId={vaultId}
                table="vault_hidden_competencies"
                iconColor="text-green-600"
                bgColor="bg-green-50"
              />
              <VaultStatCard
                icon={TrendingUp}
                title="Total Items"
                vaultId={vaultId}
                table="all"
                iconColor="text-orange-600"
                bgColor="bg-orange-50"
              />
            </div>

            {/* Vault Items */}
            <VaultItemsList vaultId={vaultId} />
          </div>

          {/* Modals */}
          <UploadResumeModal
            open={uploadModalOpen}
            onClose={() => setUploadModalOpen(false)}
            onUploadComplete={handleUploadComplete}
          />

          {extractionModalOpen && vaultId && (
            <ExtractionProgressModal
              open={extractionModalOpen}
              vaultId={vaultId}
              onComplete={handleExtractionComplete}
            />
          )}

          {questionsModalOpen && smartQuestions.length > 0 && (
            <GapQuestionsModal
              open={questionsModalOpen}
              questions={smartQuestions}
              onSubmit={handleQuestionsSubmit}
              onSkip={handleSkipQuestions}
            />
          )}
        </ContentLayout>
      </ProtectedRoute>
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

// Simple Stat Card Component
function VaultStatCard({
  icon: Icon,
  title,
  vaultId,
  table,
  iconColor,
  bgColor
}: {
  icon: any;
  title: string;
  vaultId: string | null;
  table: string;
  iconColor: string;
  bgColor: string;
}) {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!vaultId) return;

    const fetchCount = async () => {
      try {
        if (table === 'all') {
          // Count all items across all tables
          const [powerPhrases, skills, competencies] = await Promise.all([
            supabase.from('vault_power_phrases').select('*', { count: 'exact', head: true }).eq('vault_id', vaultId),
            supabase.from('vault_transferable_skills').select('*', { count: 'exact', head: true }).eq('vault_id', vaultId),
            supabase.from('vault_hidden_competencies').select('*', { count: 'exact', head: true }).eq('vault_id', vaultId)
          ]);
          setCount((powerPhrases.count || 0) + (skills.count || 0) + (competencies.count || 0));
        } else {
          const { count: tableCount } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true })
            .eq('vault_id', vaultId);
          setCount(tableCount || 0);
        }
      } catch (error) {
        console.error('Error fetching count:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCount();
  }, [vaultId, table]);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">{title}</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              {loading ? '...' : count}
            </p>
          </div>
          <div className={`${bgColor} p-3 rounded-lg`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Simple Vault Items List
function VaultItemsList({ vaultId }: { vaultId: string | null }) {
  const [powerPhrases, setPowerPhrases] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [competencies, setCompetencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!vaultId) return;

    const fetchItems = async () => {
      try {
        const [phrasesResult, skillsResult, competenciesResult] = await Promise.all([
          supabase.from('vault_power_phrases').select('*').eq('vault_id', vaultId).limit(10),
          supabase.from('vault_transferable_skills').select('*').eq('vault_id', vaultId).limit(10),
          supabase.from('vault_hidden_competencies').select('*').eq('vault_id', vaultId).limit(10)
        ]);

        setPowerPhrases(phrasesResult.data || []);
        setSkills(skillsResult.data || []);
        setCompetencies(competenciesResult.data || []);
      } catch (error) {
        console.error('Error fetching items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [vaultId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Power Phrases */}
      {powerPhrases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              Power Phrases
            </CardTitle>
            <CardDescription>High-impact achievements and results</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {powerPhrases.map((phrase) => (
              <div key={phrase.id} className="p-4 bg-slate-50 rounded-lg">
                <p className="text-slate-900">{phrase.power_phrase}</p>
                {phrase.context && (
                  <p className="text-sm text-slate-600 mt-1">{phrase.context}</p>
                )}
                <Badge variant="secondary" className="mt-2">{phrase.quality_tier}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-purple-600" />
              Transferable Skills
            </CardTitle>
            <CardDescription>Core capabilities across roles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <Badge key={skill.id} variant="outline" className="text-sm">
                  {skill.stated_skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Competencies */}
      {competencies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-green-600" />
              Hidden Competencies
            </CardTitle>
            <CardDescription>AI-discovered strategic capabilities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {competencies.map((comp) => (
              <div key={comp.id} className="p-4 bg-slate-50 rounded-lg">
                <p className="text-slate-900 font-medium">{comp.inferred_capability}</p>
                {comp.evidence_quote && (
                  <p className="text-sm text-slate-600 mt-1 italic">"{comp.evidence_quote}"</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
