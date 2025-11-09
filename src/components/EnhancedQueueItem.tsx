import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, ExternalLink, MessageSquare, TrendingUp, Users } from 'lucide-react';
import { KeywordScoreCard } from './KeywordScoreCard';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { 
  AnalyzeJobQualificationsSchema,
  GenerateExecutiveResumeSchema,
  ScoreResumeMatchSchema,
  validateInput,
  invokeEdgeFunction 
} from '@/lib/edgeFunction';

interface QueueItemProps {
  item: any;
  onApprove: (itemId: string) => void;
  onReject: (itemId: string) => void;
  isPending: boolean;
}

export const EnhancedQueueItem: React.FC<QueueItemProps> = ({
  item,
  onApprove,
  onReject,
  isPending,
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showConversation, setShowConversation] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [qualifications, setQualifications] = useState(item.critical_qualifications || []);
  const [keywordAnalysis, setKeywordAnalysis] = useState(item.keyword_analysis);

  const handleNetworkJob = () => {
    // Navigate to networking agent with pre-filled job info
    const jobInfo = encodeURIComponent(JSON.stringify({
      jobTitle: item.opportunity.job_title,
      companyName: item.opportunity.company_name || "Unknown Company",
      jobDescription: item.opportunity.job_description
    }));
    navigate(`/agents/networking?job=${jobInfo}`);
    toast({
      title: "Opening Networking Agent",
      description: "Pre-filled with job details for targeted outreach",
    });
  };

  const startConversation = async () => {
    if (qualifications.length === 0) {
      setIsAnalyzing(true);
      try {
        const validated = validateInput(AnalyzeJobQualificationsSchema, {
          jobDescription: item.opportunity?.job_description || '',
          resumeText: '', // Not provided in this context
          jobId: item.opportunity_id
        });

        const { data, error } = await invokeEdgeFunction(
          supabase,
          'analyze-job-qualifications',
          validated
        );

        if (error) return;

        setQualifications(data.critical_qualifications || []);
        setShowConversation(true);
      } finally {
        setIsAnalyzing(false);
      }
    } else {
      setShowConversation(true);
    }
  };

  const handleConversationComplete = async (responses: Record<string, string>) => {
    try {
      // Save conversation responses
      await supabase
        .from('application_queue')
        .update({ 
          conversation_data: responses,
        })
        .eq('id', item.id);

      // Generate executive resume with conversation context
      const validated = validateInput(GenerateExecutiveResumeSchema, {
        jobDescription: item.opportunity?.job_description || '',
        vaultId: item.vault_id // Assuming vault_id is in item
      });

      const { data, error } = await invokeEdgeFunction(
        supabase,
        'generate-executive-resume',
        { ...validated, conversationResponses: responses, persona: 'executive', format: 'html' },
        { successMessage: 'Resume optimized!' }
      );

      if (error) return;

      // Score the new resume
      const scoreValidated = validateInput(ScoreResumeMatchSchema, {
        keywords: data.keywords || [],
        resumeContent: data
      });

      const { data: scoreData, error: scoreError } = await invokeEdgeFunction(
        supabase,
        'score-resume-match',
        scoreValidated
      );

      if (!scoreError && scoreData) {
        setKeywordAnalysis(scoreData);
        await supabase
          .from('application_queue')
          .update({ 
            customized_resume_content: data,
            keyword_analysis: scoreData,
            ai_customization_notes: data.customization_notes,
          })
          .eq('id', item.id);
      }

      setShowConversation(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to optimize resume",
        variant: "destructive",
      });
    }
  };

  const isHighMatch = item.match_score >= 85;

  if (showConversation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resume Optimization Questions</CardTitle>
          <CardDescription>
            Answer these questions to customize your resume for this {Math.round(item.match_score)}% match opportunity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Interactive resume optimization coming soon. For now, your resume will be automatically customized.
          </p>
          <div className="flex gap-2">
            <Button onClick={() => handleConversationComplete({})}>
              Continue with Auto-Optimization
            </Button>
            <Button variant="outline" onClick={() => setShowConversation(false)}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 flex-wrap">
              {item.opportunity.job_title}
              <Badge variant={isHighMatch ? "default" : "secondary"}>
                {Math.round(item.match_score)}% Match
              </Badge>
              {isHighMatch && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                  Top Match
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {item.opportunity.company_name} • {item.opportunity.location}
            </CardDescription>
          </div>
          {isPending && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onReject(item.id)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button
                size="sm"
                onClick={() => onApprove(item.id)}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Rate and Date Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-semibold">Rate:</span> $
            {item.opportunity.hourly_rate_min}-
            {item.opportunity.hourly_rate_max}/hr
          </div>
          <div>
            <span className="font-semibold">Queued:</span>{" "}
            {new Date(item.created_at).toLocaleDateString()}
          </div>
        </div>

        {/* High Match CTA */}
        {isHighMatch && !item.conversation_data && isPending && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-sm mb-1">This is an excellent match!</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Answer a few questions to create a perfectly tailored resume that highlights your most relevant qualifications.
                  </p>
                  <Button 
                    size="sm" 
                    onClick={startConversation}
                    disabled={isAnalyzing}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    {isAnalyzing ? 'Analyzing...' : 'Optimize Resume'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Keyword Analysis */}
        {keywordAnalysis && keywordAnalysis.keywords_found && keywordAnalysis.keywords_missing && (
          <KeywordScoreCard
            analysis={keywordAnalysis}
            totalKeywords={keywordAnalysis.keywords_found.length + keywordAnalysis.keywords_missing.length}
          />
        )}

        {/* AI Customization Notes */}
        {item.ai_customization_notes && (
          <div className="bg-muted p-4 rounded-md">
            <p className="font-semibold text-sm mb-2">AI Customization Notes:</p>
            <p className="text-sm">{item.ai_customization_notes}</p>
          </div>
        )}

        {/* Resume Preview */}
        {item.customized_resume_content && (
          <div className="space-y-2">
            <p className="font-semibold text-sm">Customized Resume Preview:</p>
            <div className="bg-muted p-4 rounded-md space-y-2 text-sm">
              {item.customized_resume_content.executive_summary && (
                <div>
                  <span className="font-semibold">Summary:</span>{" "}
                  {item.customized_resume_content.executive_summary}
                </div>
              )}
              {item.customized_resume_content.key_achievements && (
                <div>
                  <span className="font-semibold">Key Achievements:</span>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    {item.customized_resume_content.key_achievements.slice(0, 3).map((achievement: string, idx: number) => (
                      <li key={idx}>{achievement}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* External Link and Networking */}
        <div className="flex gap-2">
          {item.opportunity.external_url && (
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <a
                href={item.opportunity.external_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View Posting
              </a>
            </Button>
          )}
          <Button
            variant="default"
            size="sm"
            onClick={handleNetworkJob}
          >
            <Users className="mr-2 h-4 w-4" />
            Network This Job
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
