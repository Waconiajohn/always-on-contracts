import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle2, Circle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AlternativeBullet {
  id: string;
  original_bullet: string;
  job_title: string;
  company: string;
  date_range: string;
  match_score: number;
}

interface SwapEvidenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requirementId: string;
  requirementText: string;
  currentEvidenceId: string;
  onSwapComplete: (newEvidenceId: string, newOriginalBullet: string) => void;
}

export const SwapEvidenceDialog = ({
  open,
  onOpenChange,
  requirementId,
  requirementText,
  currentEvidenceId,
  onSwapComplete,
}: SwapEvidenceDialogProps) => {
  const { toast } = useToast();
  const [alternatives, setAlternatives] = useState<AlternativeBullet[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchAlternatives();
    }
  }, [open, currentEvidenceId]);

  const fetchAlternatives = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get user's vault ID
      const { data: vaultData } = await supabase
        .from("career_vault")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!vaultData) throw new Error("Career vault not found");

      // Fetch work positions for context
      const { data: workPositions } = await supabase
        .from("vault_work_positions")
        .select("company_name, job_title, start_date, end_date")
        .eq("vault_id", vaultData.id);

      // Fetch alternative milestones from vault
      const { data: milestones } = await supabase
        .from("vault_resume_milestones")
        .select("id, description, milestone_title, company_name, vault_id, created_at")
        .eq("vault_id", vaultData.id)
        .neq("id", currentEvidenceId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!milestones || milestones.length === 0) {
        setAlternatives([]);
        setLoading(false);
        return;
      }

      // Re-run matching algorithm to score alternatives
      const { data: matchData, error: matchError } = await supabase.functions.invoke(
        "match-requirements-to-bullets",
        {
          body: {
            userId: user.id,
            jobRequirements: [
              {
                id: requirementId,
                text: requirementText,
                priority: "required",
              },
            ],
            atsKeywords: { critical: [], important: [], nice_to_have: [] },
          },
        }
      );

      if (matchError) throw matchError;

      // Map milestones with work position context and match scores
      const scored = milestones.map((m) => {
        // Find matching work position for context
        const position = (workPositions || []).find((p: any) => 
          p.company_name?.toLowerCase() === m.company_name?.toLowerCase()
        );
        
        const match = matchData?.evidenceMatrix?.find(
          (ev: any) => ev.milestoneId === m.id
        );
        
        const startYear = position?.start_date ? new Date(position.start_date).getFullYear() : '';
        const endYear = position?.end_date ? new Date(position.end_date).getFullYear() : 'Present';
        
        return {
          id: m.id,
          original_bullet: m.description || m.milestone_title || '',
          job_title: position?.job_title || 'Unknown Position',
          company: m.company_name || 'Unknown Company',
          date_range: `${startYear}${endYear ? ` - ${endYear}` : ''}`,
          match_score: match?.matchScore || 0,
        };
      }).filter(a => a.match_score > 30) // Only show reasonable alternatives
        .sort((a, b) => b.match_score - a.match_score)
        .slice(0, 5);

      setAlternatives(scored);
    } catch (error) {
      console.error("Error fetching alternatives:", error);
      toast({
        title: "Failed to load alternatives",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = () => {
    if (!selectedId) return;
    const selected = alternatives.find((a) => a.id === selectedId);
    if (!selected) return;
    onSwapComplete(selectedId, selected.original_bullet);
    onOpenChange(false);
  };

  const getMatchColor = (score: number) => {
    if (score >= 0.8) return "text-green-600 dark:text-green-400";
    if (score >= 0.6) return "text-yellow-600 dark:text-yellow-400";
    return "text-orange-600 dark:text-orange-400";
  };

  const getMatchLabel = (score: number) => {
    if (score >= 0.8) return "Strong Match";
    if (score >= 0.6) return "Good Match";
    return "Moderate Match";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Swap Evidence</DialogTitle>
          <DialogDescription className="text-sm">
            Select a different accomplishment from your career vault to better address this requirement
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4 p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-2">Requirement:</p>
          <p className="text-sm text-muted-foreground">{requirementText}</p>
        </div>

        <ScrollArea className="h-[400px] pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : alternatives.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No alternative evidence found.</p>
              <p className="text-sm mt-2">
                The current match is the best available from your vault.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {alternatives.map((alt) => (
                <Card
                  key={alt.id}
                  className={`p-4 cursor-pointer transition-all ${
                    selectedId === alt.id
                      ? "ring-2 ring-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedId(alt.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {selectedId === alt.id ? (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant="outline"
                          className={getMatchColor(alt.match_score)}
                        >
                          {getMatchLabel(alt.match_score)} ({Math.round(alt.match_score * 100)}%)
                        </Badge>
                      </div>
                      <p className="text-sm mb-2">{alt.original_bullet}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium">{alt.job_title}</span>
                        <span>•</span>
                        <span>{alt.company}</span>
                        <span>•</span>
                        <span>{alt.date_range}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSwap} disabled={!selectedId || loading}>
            Swap Evidence
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
