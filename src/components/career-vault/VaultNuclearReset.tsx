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
  resumeText: string;
  targetRoles?: string[];
  targetIndustries?: string[];
  onResetComplete?: () => void;
}

export const VaultNuclearReset = ({ 
  vaultId, 
  resumeText, 
  targetRoles, 
  targetIndustries,
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
      
      toast.success('Vault cleared successfully');

      // 2. Trigger v3 extraction
      const { error: extractError } = await supabase.functions.invoke('auto-populate-vault-v3', {
        body: { 
          resumeText,
          vaultId,
          targetRoles: targetRoles || [],
          targetIndustries: targetIndustries || []
        }
      });

      if (extractError) throw extractError;

      toast.success('Vault re-extracted with v3 - check for improvements!');
      
      if (onResetComplete) {
        onResetComplete();
      }
    } catch (error) {
      console.error('Error during nuclear reset:', error);
      toast.error('Failed to reset vault');
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
          Delete ALL vault items and re-extract cleanly with v3
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
                  Clear Vault & Re-Extract
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all {VAULT_TABLE_NAMES.length} vault tables 
                and re-extract everything from your resume using v3. 
                <br /><br />
                This action cannot be undone.
                <br /><br />
                <strong>Use this to fix:</strong>
                <ul className="list-disc list-inside mt-2">
                  <li>Massive duplicates</li>
                  <li>Wrong categorization (management in wrong table)</li>
                  <li>Poor quality extractions from v2</li>
                </ul>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={clearVaultAndReExtract}>
                Yes, Reset Everything
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};
