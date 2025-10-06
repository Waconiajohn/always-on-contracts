import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { ResponseReviewModal } from './ResponseReviewModal';
import { Loader2, TrendingUp, Edit } from 'lucide-react';

interface InterviewResponse {
  id: string;
  question: string;
  response: string;
  quality_score: number;
  phase: string;
  created_at: string;
}

interface InterviewResponsesTabProps {
  vaultId: string;
}

export function InterviewResponsesTab({ vaultId }: InterviewResponsesTabProps) {
  const [responses, setResponses] = useState<InterviewResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResponse, setSelectedResponse] = useState<InterviewResponse | null>(null);

  const fetchResponses = async () => {
    const { data } = await supabase
      .from('vault_interview_responses')
      .select('*')
      .eq('vault_id', vaultId)
      .order('quality_score', { ascending: true });

    if (data) setResponses(data as any);
    setLoading(false);
  };

  useEffect(() => {
    fetchResponses();
  }, [vaultId]);

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 70) return 'text-blue-600 dark:text-blue-400';
    return 'text-amber-600 dark:text-amber-400';
  };

  return (
    <>
      <div className="grid gap-4">
        {responses.map((response) => (
          <Card key={response.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="font-medium mb-2">{response.question}</p>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{response.response}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={getScoreColor(response.quality_score)}>
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {response.quality_score}/100
                  </Badge>
                  <Badge variant="secondary">{response.phase}</Badge>
                </div>
              </div>
              {response.quality_score < 80 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedResponse(response)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Enhance
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {selectedResponse && (
        <ResponseReviewModal
          open={!!selectedResponse}
          onOpenChange={(open) => !open && setSelectedResponse(null)}
          responseId={selectedResponse.id}
          vaultId={vaultId}
          question={selectedResponse.question}
          currentAnswer={selectedResponse.response}
          currentScore={selectedResponse.quality_score}
          onSuccess={fetchResponses}
        />
      )}
    </>
  );
}
