import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Sparkles, Building2, CheckCircle2, Loader2, Info, TrendingUp } from 'lucide-react';
import { useSupabaseClient } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ProfessionalResourcesQuestionnaireProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vaultId: string;
  onComplete: (newScore: number) => void;
}

interface Question {
  id: string;
  text: string;
  type: 'text' | 'checkbox' | 'input';
  whyItMatters: string;
  impactScore: number;
  options?: string[];
  placeholder?: string;
}

const QUESTIONS: Question[] = [
  {
    id: 'enterprise-systems',
    text: 'What enterprise systems have you used? (Select all that apply)',
    type: 'checkbox',
    whyItMatters: 'Enterprise system experience signals you can operate at scale. Someone who knows Salesforce + SAP is more valuable than someone who only knows spreadsheets.',
    impactScore: 3,
    options: [
      'Salesforce (CRM)',
      'SAP (ERP)',
      'Oracle (Database/ERP)',
      'Microsoft Dynamics',
      'Workday (HR)',
      'ServiceNow (ITSM)',
      'Tableau/Power BI (Analytics)',
      'AWS/Azure/GCP (Cloud)',
      'Other enterprise platform',
    ],
  },
  {
    id: 'training-investments',
    text: 'What professional training has your employer invested in? (e.g., certifications, courses, executive education)',
    type: 'text',
    whyItMatters: 'Employer-funded training shows they saw you as high-potential. A $15K leadership program signals company investment in your future.',
    impactScore: 4,
    placeholder: 'Example: Company-sponsored AWS certification ($3K), Wharton Executive Leadership ($15K)',
  },
  {
    id: 'conferences-attended',
    text: 'What industry conferences or trade shows have you attended?',
    type: 'text',
    whyItMatters: 'Conference attendance signals you stay current with industry trends. Most high performers attend 1-2 conferences annually.',
    impactScore: 2,
    placeholder: 'Example: SaaStr Annual (2022, 2023), Dreamforce, AWS re:Invent',
  },
  {
    id: 'professional-memberships',
    text: 'Are you a member of any professional organizations?',
    type: 'checkbox',
    whyItMatters: 'Professional memberships demonstrate commitment to your field and provide networking advantages.',
    impactScore: 2,
    options: [
      'Project Management Institute (PMI)',
      'Society for Human Resource Management (SHRM)',
      'American Marketing Association (AMA)',
      'Institute of Electrical and Electronics Engineers (IEEE)',
      'CFA Institute',
      'Industry-specific association',
      'Not currently a member',
    ],
  },
  {
    id: 'consultant-experience',
    text: 'Have you worked with external consultants or agencies? If so, which firms?',
    type: 'text',
    whyItMatters: 'Collaboration with top-tier consultants (McKinsey, Deloitte, etc.) signals you have been on strategic, high-stakes projects.',
    impactScore: 3,
    placeholder: 'Example: McKinsey (digital transformation project), Deloitte (process improvement)',
  },
  {
    id: 'premium-tools',
    text: 'What premium software/tools did you have access to at work?',
    type: 'text',
    whyItMatters: 'Access to premium tools (Gartner, Bloomberg Terminal, etc.) shows your employer invested in giving you the best resources.',
    impactScore: 2,
    placeholder: 'Example: Gartner research access, Adobe Creative Cloud, Slack Enterprise',
  },
  {
    id: 'certifications',
    text: 'What professional certifications do you hold?',
    type: 'text',
    whyItMatters: 'Certifications validate your expertise and show commitment to professional development.',
    impactScore: 3,
    placeholder: 'Example: PMP, AWS Solutions Architect, CPA, Six Sigma Black Belt',
  },
];

export function ProfessionalResourcesQuestionnaire({
  open,
  onOpenChange,
  vaultId,
  onComplete,
}: ProfessionalResourcesQuestionnaireProps) {
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = useSupabaseClient();
  const { toast } = useToast();

  const handleResponseChange = (questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Format responses into structured data for JSONB fields
      const enterpriseSystems = Array.isArray(responses['enterprise-systems']) 
        ? responses['enterprise-systems'] 
        : [];
      
      const professionalMemberships = Array.isArray(responses['professional-memberships'])
        ? responses['professional-memberships']
        : [];

      // Insert or update professional resources
      const { error: upsertError } = await supabase
        .from('vault_professional_resources')
        .upsert({
          vault_id: vaultId,
          enterprise_systems: enterpriseSystems,
          proficiency_levels: {},
          training_programs: [{ description: responses['training-investments'] || '' }],
          certifications_funded: [{ description: responses['certifications'] || '' }],
          conferences_attended: [{ description: responses['conferences-attended'] || '' }],
          professional_memberships: professionalMemberships,
          consultant_experience: [{ description: responses['consultant-experience'] || '' }],
          external_coaches: [],
          quality_tier: 'silver',
          ai_confidence: 0.9,
          user_verified: true,
          last_updated_at: new Date().toISOString(),
        });

      if (upsertError) throw upsertError;

      // Calculate impact (estimated +15 points from architecture doc)
      const estimatedNewScore = 15;

      toast({
        title: '🎉 Professional Resources Added!',
        description: 'Your executive intelligence has been enhanced',
      });

      onComplete(estimatedNewScore);
      onOpenChange(false);
    } catch (err: any) {
      console.error('Submit error:', err);
      toast({
        title: 'Submission Failed',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQuestion = QUESTIONS[currentQuestionIndex];
  const answeredCount = Object.keys(responses).length;
  const progressPercentage = (answeredCount / QUESTIONS.length) * 100;
  const totalImpact = QUESTIONS.reduce((sum, q) => sum + q.impactScore, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" />
            Professional Development & Resources
          </DialogTitle>
          <DialogDescription>
            Help us understand your access to enterprise systems, training, and industry exposure
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Marketing Message */}
          <Alert className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <AlertDescription className="text-sm">
              <strong className="text-blue-700">Why this matters:</strong> Most candidates miss this section. 
              Showing your access to enterprise systems and premium training positions you as someone 
              companies have invested in. <strong>6-8 minutes to complete, +{totalImpact} points potential.</strong>
            </AlertDescription>
          </Alert>

          {/* Progress */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progress</span>
              <Badge variant="outline">{answeredCount}/{QUESTIONS.length}</Badge>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Current Question */}
          <div className="border rounded-lg p-6 bg-card">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-1">Q{currentQuestionIndex + 1}</Badge>
                <div className="flex-1">
                  <h4 className="font-medium text-lg mb-3">{currentQuestion.text}</h4>

                  {/* Why It Matters */}
                  <div className="flex items-start gap-2 bg-blue-50 rounded p-3 mb-4">
                    <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-900">{currentQuestion.whyItMatters}</p>
                  </div>

                  {/* Input Field */}
                  {currentQuestion.type === 'text' && (
                    <Input
                      value={responses[currentQuestion.id] || ''}
                      onChange={(e) => handleResponseChange(currentQuestion.id, e.target.value)}
                      placeholder={currentQuestion.placeholder}
                      className="w-full"
                    />
                  )}

                  {currentQuestion.type === 'checkbox' && (
                    <div className="space-y-2">
                      {currentQuestion.options?.map((option) => (
                        <div 
                          key={option} 
                          className="flex items-center space-x-3 p-3 border rounded hover:bg-accent transition-colors"
                        >
                          <Checkbox
                            id={`${currentQuestion.id}-${option}`}
                            checked={(responses[currentQuestion.id] || []).includes(option)}
                            onCheckedChange={(checked) => {
                              const currentValues = responses[currentQuestion.id] || [];
                              const newValue = checked
                                ? [...currentValues, option]
                                : currentValues.filter((v: string) => v !== option);
                              handleResponseChange(currentQuestion.id, newValue);
                            }}
                          />
                          <Label 
                            htmlFor={`${currentQuestion.id}-${option}`} 
                            className="cursor-pointer flex-1"
                          >
                            {option}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Impact Badge */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4">
                    <TrendingUp className="w-3 h-3 text-green-600" />
                    Impact: +{currentQuestion.impactScore} points
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </Button>

            <span className="text-sm text-muted-foreground">
              Question {currentQuestionIndex + 1} of {QUESTIONS.length}
            </span>

            {currentQuestionIndex < QUESTIONS.length - 1 ? (
              <Button onClick={handleNext}>
                Next Question
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Complete
                    <CheckCircle2 className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
