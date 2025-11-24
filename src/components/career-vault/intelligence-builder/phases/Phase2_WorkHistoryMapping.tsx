import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Briefcase, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { InlineAICoach } from "../InlineAICoach";
import { StrategicCoachDrawer } from "../StrategicCoachDrawer";

interface Phase2Props {
  vaultId: string;
  onProgress: (progress: number) => void;
  onTimeEstimate: (estimate: string) => void;
  onComplete: () => void;
}

interface WorkPosition {
  id: string;
  company_name: string;
  job_title: string;
  start_date: string;
  end_date?: string;
  description?: string;
  bullets?: string[];
}

export const Phase2_WorkHistoryMapping = ({
  vaultId,
  onProgress,
  onTimeEstimate,
  onComplete
}: Phase2Props) => {
  const [positions, setPositions] = useState<WorkPosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingBullet, setEditingBullet] = useState<{
    positionId: string;
    bulletIndex: number;
    text: string;
  } | null>(null);
  const [showStrategicCoach, setShowStrategicCoach] = useState(false);
  const [strategicCoachContext, setStrategicCoachContext] = useState<any>(null);

  useEffect(() => {
    loadWorkHistory();
  }, [vaultId]);

  const loadWorkHistory = async () => {
    setIsLoading(true);
    onProgress(10);

    try {
      // Load work positions from vault
      const { data: positionsData, error: positionsError } = await supabase
        .from('vault_work_positions')
        .select('*')
        .eq('vault_id', vaultId)
        .order('start_date', { ascending: false });

      if (positionsError) throw positionsError;

      // Load milestones (bullets) for each position
      const { data: milestonesData, error: milestonesError } = await supabase
        .from('vault_resume_milestones')
        .select('*')
        .eq('vault_id', vaultId);

      if (milestonesError) throw milestonesError;

      // Group milestones by position
      const positionsWithBullets = (positionsData || []).map(pos => ({
        ...pos,
        bullets: (milestonesData || [])
          .filter(m => m.work_position_id === pos.id)
          .map(m => m.achievement_description)
      }));

      setPositions(positionsWithBullets);
      onProgress(100);
      onTimeEstimate('~5 minutes to enhance all bullets');
    } catch (error) {
      console.error('Error loading work history:', error);
      toast.error('Failed to load work history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulletUpdate = async (positionId: string, bulletIndex: number, newText: string) => {
    // Update in state
    setPositions(prev => prev.map(pos => {
      if (pos.id === positionId && pos.bullets) {
        const newBullets = [...pos.bullets];
        newBullets[bulletIndex] = newText;
        return { ...pos, bullets: newBullets };
      }
      return pos;
    }));

    // Update in database
    try {
      const { data: milestones } = await supabase
        .from('vault_resume_milestones')
        .select('*')
        .eq('vault_id', vaultId)
        .eq('work_position_id', positionId);

      if (milestones && milestones[bulletIndex]) {
        await supabase
          .from('vault_resume_milestones')
          .update({ achievement_description: newText })
          .eq('id', milestones[bulletIndex].id);
      }
    } catch (error) {
      console.error('Error updating bullet:', error);
      toast.error('Failed to save changes');
    }
  };

  const handleOpenStrategicCoach = (positionId: string, bulletIndex: number) => {
    const position = positions.find(p => p.id === positionId);
    if (!position || !position.bullets) return;

    setStrategicCoachContext({
      originalText: position.bullets[bulletIndex],
      itemId: undefined,
      itemType: 'milestone',
      positionId,
      vaultId,
      positionTitle: position.job_title
    });
    setEditingBullet({ positionId, bulletIndex, text: position.bullets[bulletIndex] });
    setShowStrategicCoach(true);
  };

  const handleStrategicCoachApply = (improvedText: string) => {
    if (!editingBullet) return;
    handleBulletUpdate(editingBullet.positionId, editingBullet.bulletIndex, improvedText);
    setEditingBullet(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading your work history...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold">Map Your Work History</h2>
        <p className="text-lg text-muted-foreground">
          Organize your experience and enhance each achievement with AI
        </p>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical Line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border" />

        {/* Positions */}
        <div className="space-y-8">
          {positions.map((position, posIndex) => (
            <div key={position.id} className="relative pl-20">
              {/* Timeline Dot */}
              <div className="absolute left-6 top-6 w-5 h-5 rounded-full bg-primary border-4 border-background" />

              <Card className="p-6 space-y-4">
                {/* Position Header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold">{position.job_title}</h3>
                    <p className="text-muted-foreground flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      {position.company_name}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {position.start_date} - {position.end_date || 'Present'}
                    </p>
                  </div>
                </div>

                {/* Description */}
                {position.description && (
                  <p className="text-sm text-muted-foreground border-l-2 border-muted pl-3">
                    {position.description}
                  </p>
                )}

                {/* Bullets */}
                {position.bullets && position.bullets.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-sm">Key Achievements:</h4>
                    {position.bullets.map((bullet, bulletIndex) => (
                      <Card key={bulletIndex} className="p-4 bg-muted/30 space-y-3">
                        <p className="text-sm">{bullet}</p>
                        
                        {/* Inline AI Coach */}
                        <InlineAICoach
                          originalText={bullet}
                          itemType="milestone"
                          positionId={position.id}
                          vaultId={vaultId}
                          onAccept={(newText) => handleBulletUpdate(position.id, bulletIndex, newText)}
                        />

                        {/* Strategic Coach Link */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenStrategicCoach(position.id, bulletIndex)}
                          className="text-xs"
                        >
                          Need strategic guidance? Open AI Coach
                        </Button>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Progress indicator for this position */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Position {posIndex + 1} of {positions.length}</span>
                  {position.bullets && (
                    <span>{position.bullets.length} achievements mapped</span>
                  )}
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Continue Button */}
      <Card className="p-6 bg-primary/5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold mb-1">Ready to See Your Gaps?</h3>
            <p className="text-sm text-muted-foreground">
              We've organized your work history. Next, we'll compare it to market expectations.
            </p>
          </div>
          <Button onClick={onComplete} size="lg">
            Continue to Gap Analysis
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </Card>

      {/* Strategic Coach Drawer */}
      <StrategicCoachDrawer
        open={showStrategicCoach}
        onOpenChange={setShowStrategicCoach}
        context={strategicCoachContext || {}}
        onApply={handleStrategicCoachApply}
      />
    </div>
  );
};
