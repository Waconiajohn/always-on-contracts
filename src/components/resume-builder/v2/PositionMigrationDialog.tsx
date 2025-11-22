import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Sparkles, Copy, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface WorkPosition {
  id: string;
  job_title: string;
  company_name: string;
  start_date: string;
  end_date: string | null;
}

interface PositionMigrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBullet: string;
  currentPosition: {
    jobTitle: string;
    company: string;
    dateRange: string;
  };
  requirement: string;
  onMigrationComplete: (newEvidence: any) => void;
}

export function PositionMigrationDialog({
  open,
  onOpenChange,
  currentBullet,
  currentPosition,
  requirement,
  onMigrationComplete
}: PositionMigrationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [positions, setPositions] = useState<WorkPosition[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<string>("");
  const [migrationMode, setMigrationMode] = useState<'clone' | 'ai'>('ai');
  const [migrating, setMigrating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchPositions();
    }
  }, [open]);

  const fetchPositions = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('vault_work_positions')
        .select('id, job_title, company_name, start_date, end_date')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setPositions(data || []);
    } catch (error: any) {
      console.error('Error fetching positions:', error);
      toast({
        title: "Error loading positions",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDateRange = (start: string, end: string | null) => {
    const startYear = new Date(start).getFullYear();
    const endYear = end ? new Date(end).getFullYear() : 'Present';
    return `${startYear} - ${endYear}`;
  };

  const handleMigrate = async () => {
    if (!selectedPosition) return;

    setMigrating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const targetPosition = positions.find(p => p.id === selectedPosition);
      if (!targetPosition) throw new Error('Target position not found');

      const { data: vaultData, error: vaultError } = await supabase
        .from('career_vault')
        .select('id')
        .eq('user_id', user.id)
        .single();
        
      if (vaultError) throw vaultError;
      if (!vaultData) throw new Error('Career vault not found');

      if (migrationMode === 'clone') {
        // Clone exact text to new position and save to database
        const { error: insertError } = await supabase
          .from('vault_resume_milestones')
          .insert({
            vault_id: vaultData.id,
            user_id: user.id,
            work_position_id: selectedPosition, // ← THE FIX: Save with FK
            milestone_title: currentBullet,
            description: currentBullet,
            milestone_type: 'job',
            quality_tier: 'gold',
            confidence_score: 0.95,
            extraction_source: 'user-migration-clone'
          });
        
        if (insertError) throw insertError;
        
        toast({
          title: "Experience updated",
          description: `Using this experience for ${targetPosition.job_title}`
        });

        onMigrationComplete({
          bullet: currentBullet,
          source: {
            company: targetPosition.company_name,
            jobTitle: targetPosition.job_title,
            dateRange: formatDateRange(targetPosition.start_date, targetPosition.end_date)
          }
        });
      } else {
        const { data, error } = await supabase.functions.invoke('migrate-evidence-to-position', {
          body: {
            originalBullet: currentBullet,
            originalContext: {
              jobTitle: currentPosition.jobTitle,
              company: currentPosition.company,
              dateRange: currentPosition.dateRange
            },
            targetContext: {
              jobTitle: targetPosition.job_title,
              company: targetPosition.company_name,
              dateRange: formatDateRange(targetPosition.start_date, targetPosition.end_date)
            },
            requirement
          }
        });

        if (error) throw error;
        if (!data?.newBullet) throw new Error('No new bullet generated');

        // Save the AI-generated bullet to database
        const { error: insertError } = await supabase
          .from('vault_resume_milestones')
          .insert({
            vault_id: vaultData.id,
            user_id: user.id,
            work_position_id: selectedPosition, // ← THE FIX: Save with FK
            milestone_title: data.newBullet,
            description: data.newBullet,
            milestone_type: 'job',
            quality_tier: 'gold',
            confidence_score: 0.90,
            extraction_source: 'ai-migration-generated'
          });
        
        if (insertError) throw insertError;

        toast({
          title: "New experience generated",
          description: `AI created a contextualized bullet for ${targetPosition.job_title}`
        });

        onMigrationComplete({
          bullet: data.newBullet,
          source: {
            company: targetPosition.company_name,
            jobTitle: targetPosition.job_title,
            dateRange: formatDateRange(targetPosition.start_date, targetPosition.end_date)
          }
        });
      }

      onOpenChange(false);
    } catch (error: any) {
      console.error('Migration error details:', {
        error: error.message,
        mode: migrationMode,
        timestamp: new Date().toISOString()
      });
      
      const userFriendlyMessage = error.message?.includes('Career vault not found')
        ? 'Your career vault could not be found. Please try refreshing the page.'
        : error.message?.includes('Target position not found')
        ? 'Selected position no longer exists. Please select a different position.'
        : error.message?.includes('rate limit')
        ? 'Rate limit exceeded. Please wait a moment and try again.'
        : 'Migration failed. Please try again.';
      
      toast({
        title: "Migration failed",
        description: userFriendlyMessage,
        variant: "destructive"
      });
    } finally {
      setMigrating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Experience to Recent Position</DialogTitle>
          <DialogDescription>
            Move this achievement to a more recent role in your career history
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 border-b space-y-3">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Current Experience:</h4>
            <p className="text-sm">{currentBullet}</p>
            <p className="text-xs text-muted-foreground mt-1">
              From: {currentPosition.jobTitle} at {currentPosition.company} • {currentPosition.dateRange}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">For Requirement:</h4>
            <p className="text-sm font-semibold">{requirement}</p>
          </div>
        </div>

        <div className="space-y-4 flex-1 overflow-hidden">
          <div>
            <Label className="text-sm font-medium mb-3 block">Migration Mode:</Label>
            <RadioGroup value={migrationMode} onValueChange={(v) => setMigrationMode(v as 'clone' | 'ai')}>
              <div className="flex items-start space-x-2 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer">
                <RadioGroupItem value="ai" id="ai" />
                <Label htmlFor="ai" className="cursor-pointer flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="font-medium">AI Generate (Recommended)</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Create a new, contextualized bullet optimized for the target position
                  </p>
                </Label>
              </div>
              <div className="flex items-start space-x-2 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer">
                <RadioGroupItem value="clone" id="clone" />
                <Label htmlFor="clone" className="cursor-pointer flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Copy className="h-4 w-4" />
                    <span className="font-medium">Clone Exact Text</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Copy the exact bullet to the new position without changes
                  </p>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex-1 overflow-hidden">
            <Label className="text-sm font-medium mb-3 block">Select Target Position:</Label>
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <ScrollArea className="h-[250px] pr-4">
                <RadioGroup value={selectedPosition} onValueChange={setSelectedPosition}>
                  <div className="space-y-2">
                    {positions.map((pos) => (
                      <div
                        key={pos.id}
                        className={`flex items-start space-x-2 p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedPosition === pos.id
                            ? "border-primary bg-primary/5"
                            : "hover:bg-accent/50"
                        }`}
                        onClick={() => setSelectedPosition(pos.id)}
                      >
                        <RadioGroupItem value={pos.id} id={pos.id} />
                        <Label htmlFor={pos.id} className="cursor-pointer flex-1">
                          <div className="font-medium">{pos.job_title}</div>
                          <div className="text-sm text-muted-foreground">{pos.company_name}</div>
                          <div className="flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3" />
                            <span className="text-xs text-muted-foreground">
                              {formatDateRange(pos.start_date, pos.end_date)}
                            </span>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </ScrollArea>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={migrating}>
            Cancel
          </Button>
          <Button onClick={handleMigrate} disabled={!selectedPosition || migrating}>
            {migrating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {migrationMode === 'ai' ? 'Generating...' : 'Adding...'}
              </>
            ) : (
              <>
                {migrationMode === 'ai' ? 'Generate & Add' : 'Clone & Add'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
