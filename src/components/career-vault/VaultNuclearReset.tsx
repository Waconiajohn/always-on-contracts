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
      console.log('🔥 NUCLEAR RESET: Starting complete vault wipe for vault:', vaultId);
      
      // 1. Delete ALL vault items from all 10 tables with logging
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

        // Count before deletion
        const { count: beforeCount } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
          .eq(tableConfig, vaultId);

        console.log(`📊 ${tableName}: ${beforeCount} items before deletion`);

        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq(tableConfig, vaultId);

        if (error) {
          console.error(`❌ Failed to delete from ${tableName}:`, error);
          throw error;
        }

        // Verify deletion
        const { count: afterCount } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
          .eq(tableConfig, vaultId);

        console.log(`✅ ${tableName}: ${afterCount} items after deletion (deleted ${beforeCount})`);
        
        return { tableName, deleted: beforeCount };
      });

      const deletionResults = await Promise.all(deletePromises);
      const totalDeleted = deletionResults.reduce((sum, r) => sum + (r.deleted || 0), 0);
      console.log(`🗑️ Total vault items deleted: ${totalDeleted}`);

      // 2. Delete gap analysis data
      console.log('🧹 Deleting gap analysis data...');
      const { error: gapError } = await supabase
        .from('vault_gap_analysis')
        .delete()
        .eq('vault_id', vaultId);
      
      if (gapError) {
        console.error('❌ Failed to delete gap analysis:', gapError);
        throw gapError;
      }

      // 3. Delete career context cache
      console.log('🧹 Deleting career context cache...');
      const { error: contextError } = await supabase
        .from('vault_career_context')
        .delete()
        .eq('vault_id', vaultId);
      
      if (contextError) {
        console.error('❌ Failed to delete career context:', contextError);
        throw contextError;
      }

      // 4. Delete new vault tables
      console.log('🧹 Deleting thought leadership, network, competitive advantages...');
      await Promise.all([
        supabase.from('vault_thought_leadership').delete().eq('vault_id', vaultId),
        supabase.from('vault_professional_network').delete().eq('vault_id', vaultId),
        supabase.from('vault_competitive_advantages').delete().eq('vault_id', vaultId),
      ]);

      // 5. Delete structured resume data (work positions, education, milestones)
      console.log('🧹 Deleting work positions, education, and milestones...');
      await Promise.all([
        supabase.from('vault_work_positions').delete().eq('vault_id', vaultId),
        supabase.from('vault_education').delete().eq('vault_id', vaultId),
        supabase.from('vault_resume_milestones').delete().eq('vault_id', vaultId),
      ]);

      // 6. Delete verification results
      console.log('🧹 Deleting verification results...');
      await supabase.from('resume_verification_results').delete().eq('vault_id', vaultId);

      // 7. Reset career_vault metadata to zero state
      console.log('♻️ Resetting career_vault metadata to zero...');
      const { error: resetError } = await supabase
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
          resume_raw_text: null,
          initial_analysis: null,
        })
        .eq('id', vaultId);

      if (resetError) {
        console.error('❌ Failed to reset career_vault metadata:', resetError);
        throw resetError;
      }

      console.log('✅ NUCLEAR RESET COMPLETE: All data wiped to zero state (including resume)');

      toast.success('Vault completely cleared. Resume deleted. Upload a resume to start fresh.');
      
      // Force cache invalidation to show zero state immediately
      if (onResetComplete) {
        onResetComplete();
      }
    } catch (error: any) {
      console.error('❌ NUCLEAR RESET FAILED:', error);
      toast.error(
        error.message || 'Failed to reset vault. Some data may remain. Please refresh and try again.',
        { duration: 5000 }
      );
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
          Delete ALL vault items, resume, and reset everything to zero. You'll need to upload a resume afterward to start completely fresh.
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
                  <li>Your uploaded resume text</li>
                  <li>All {VAULT_TABLE_NAMES.length} vault item tables</li>
                  <li>All gap analysis data</li>
                  <li>All career context and AI analysis</li>
                  <li>All extraction history</li>
                </ul>
                Everything will be set to ZERO. You'll need to upload a resume afterward to start completely fresh.
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
