import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, AlertTriangle } from 'lucide-react';
import { VAULT_TABLE_NAMES } from '@/lib/constants/vaultTables';

interface VaultNuclearResetProps {
  vaultId: string;
  onResetComplete?: () => void;
}

export const VaultNuclearReset = ({ 
  vaultId, 
  onResetComplete 
}: VaultNuclearResetProps) => {
  const [isResetting, setIsResetting] = useState(false);

  const clearVaultAndReExtract = async () => {
    setIsResetting(true);

    try {
      // 1. Delete ALL vault items from all 10 tables
      const deletePromises = VAULT_TABLE_NAMES.map(async (tableName) => {
        const tableConfig = {
          vault_power_phrases: 'vault_id',
          vault_transferable_skills: 'vault_id',
          vault_hidden_competencies: 'vault_id',
          vault_soft_skills: 'vault_id',
          vault_leadership_philosophy: 'vault_id',
          vault_executive_presence: 'vault_id',
          vault_personality_traits: 'vault_id',
          vault_work_style: 'vault_id',
          vault_values_motivations: 'vault_id',
          vault_behavioral_indicators: 'vault_id',
        }[tableName] || 'vault_id';

        return supabase
          .from(tableName)
          .delete()
          .eq(tableConfig, vaultId);
      });

      await Promise.all(deletePromises);

      // 2. Delete gap analysis data (cached analysis from before AI extraction fix)
      await supabase
        .from('vault_gap_analysis')
        .delete()
        .eq('vault_id', vaultId);

      // 3. Delete career context cache
      await supabase
        .from('vault_career_context')
        .delete()
        .eq('vault_id', vaultId);

      // 4. Delete new vault tables (thought leadership, network, competitive advantages)
      await supabase.from('vault_thought_leadership').delete().eq('vault_id', vaultId);
      await supabase.from('vault_professional_network').delete().eq('vault_id', vaultId);
      await supabase.from('vault_competitive_advantages').delete().eq('vault_id', vaultId);

      // 5. Reset career_vault metadata to zero state
      await supabase
        .from('career_vault')
        .update({
          onboarding_step: 'not_started',
          review_completion_percentage: 0,
          vault_strength_before_qa: null,
          vault_strength_after_qa: null,
          total_power_phrases: 0,
          total_transferable_skills: 0,
          total_hidden_competencies: 0,
          extraction_item_count: 0,
        })
        .eq('id', vaultId);

      toast.success('Vault completely cleared. All data set to zero. Upload a resume to start fresh.');
      
      if (onResetComplete) {
        onResetComplete();
      }
    } catch (error) {
      // Error already handled by invokeEdgeFunction
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Nuclear Reset
        </CardTitle>
        <CardDescription>
          Delete ALL vault items and reset everything to zero. Upload a resume afterward to start fresh.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="destructive" 
              disabled={isResetting}
              className="w-full"
            >
              {isResetting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Clear Vault to Zero
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete:
                <ul className="list-disc list-inside mt-2 mb-2">
                  <li>All {VAULT_TABLE_NAMES.length} vault item tables</li>
                  <li>All gap analysis data</li>
                  <li>All career context</li>
                  <li>All extraction history</li>
                </ul>
                Everything will be set to ZERO. You'll need to upload a resume afterward to start fresh.
                <br /><br />
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={clearVaultAndReExtract}>
                Yes, Clear to Zero
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};
