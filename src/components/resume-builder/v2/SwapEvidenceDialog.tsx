import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SwapEvidenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requirementId: string;
  requirementText: string;
  currentEvidenceId?: string;
  onSwapComplete: (newEvidence: any) => void;
}

export function SwapEvidenceDialog({
  open,
  onOpenChange,
  requirementId,
  requirementText,
  currentEvidenceId,
  onSwapComplete
}: SwapEvidenceDialogProps) {
  const [loading, setLoading] = useState(false);
  const [alternatives, setAlternatives] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchAlternatives();
    }
  }, [open]);

  const fetchAlternatives = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch milestones with joined work positions for context
      // Fix: Query updated to use correct columns
      const { data: milestones, error } = await supabase
        .from('vault_resume_milestones')
        .select(`
          id,
          description,
          milestone_title,
          company_name,
          vault_id,
          created_at
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // For each milestone, calculate a simple match score against the requirement
      // In a real app, this would use the match-requirements-to-bullets edge function
      // For now, we'll just list them all
      
      const processed = (milestones || []).map((m: any) => ({
        id: m.id,
        bullet: m.description || m.milestone_title,
        source: {
          company: m.company_name || 'Unknown',
          // Fallback for missing job title/dates since they aren't in milestones table directly
          jobTitle: 'Role', 
          dateRange: 'Past'
        },
        matchScore: Math.floor(Math.random() * 40) + 40 // Mock score for now
      }));

      setAlternatives(processed);
      if (currentEvidenceId) {
        setSelectedId(currentEvidenceId);
      }
    } catch (error: any) {
      console.error('Error fetching alternatives:', error);
      toast({
        title: "Error loading evidence",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = () => {
    const selected = alternatives.find(a => a.id === selectedId);
    if (selected) {
      onSwapComplete(selected);
      onOpenChange(false);
    }
  };

  const getMatchColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800";
    if (score >= 60) return "bg-yellow-100 text-yellow-800";
    return "bg-orange-100 text-orange-800";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Swap Evidence</DialogTitle>
        </DialogHeader>
        
        <div className="py-4 border-b">
          <h4 className="text-sm font-medium text-muted-foreground mb-2">For Requirement:</h4>
          <p className="text-sm font-semibold">{requirementText}</p>
        </div>

        <div className="flex-1 overflow-hidden relative">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : alternatives.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No alternative evidence found</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {alternatives.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedId === item.id
                        ? "border-primary bg-primary/5"
                        : "border-transparent bg-muted/50 hover:bg-muted"
                    }`}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex gap-2">
                        <Badge variant="secondary" className={getMatchColor(item.matchScore)}>
                          {item.matchScore}% Match
                        </Badge>
                        <span className="text-xs text-muted-foreground mt-1">
                          {item.source.company}
                        </span>
                      </div>
                      {selectedId === item.id && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <p className="text-sm">{item.bullet}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSwap} disabled={!selectedId || selectedId === currentEvidenceId}>
            Use Selected Evidence
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
