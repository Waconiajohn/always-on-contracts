import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, FileText, Plus, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { validateInput, invokeEdgeFunction, AutoPopulateVaultSchema } from '@/lib/edgeFunction';

interface ResumeManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vaultId: string;
  onResumeUploaded: () => void;
}

export const ResumeManagementModal = ({
  open,
  onOpenChange,
  vaultId,
  onResumeUploaded
}: ResumeManagementModalProps) => {
  const [selectedAction, setSelectedAction] = useState<'replace' | 'add' | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  // Reset state when modal closes or opens
  useEffect(() => {
    if (!open) {
      setSelectedAction(null);
      setUploading(false);
    }
  }, [open]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // For PDFs, parse the file first to extract text
      let text: string;
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        // Upload PDF to storage first for parsing
        const fileName = `${user.id}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(fileName, file, { upsert: true });

        if (uploadError) throw uploadError;

        // Parse PDF using edge function
        const { data: parseData, error: parseError } = await invokeEdgeFunction(
          'parse-resume',
          { fileName, userId: user.id }
        );

        if (parseError) throw parseError;
        text = parseData.text || '';
        
        // Clean up storage file after parsing
        await supabase.storage.from('resumes').remove([fileName]);
      } else {
        // Plain text files can be read directly
        text = await file.text();
      }

      if (selectedAction === 'replace') {
        console.log('[VAULT-CLEAR] Starting complete vault replacement...');
        
        toast({
          title: 'Clearing vault...',
          description: 'Removing old data before processing new resume.',
        });

        // CRITICAL: Delete ALL existing vault data first and wait for completion
        // Note: vault_confirmed_skills uses user_id, not vault_id
        const deleteResults = await Promise.allSettled([
          supabase.from('vault_power_phrases').delete().eq('vault_id', vaultId),
          supabase.from('vault_transferable_skills').delete().eq('vault_id', vaultId),
          supabase.from('vault_hidden_competencies').delete().eq('vault_id', vaultId),
          supabase.from('vault_soft_skills').delete().eq('vault_id', vaultId),
          supabase.from('vault_leadership_philosophy').delete().eq('vault_id', vaultId),
          supabase.from('vault_executive_presence').delete().eq('vault_id', vaultId),
          supabase.from('vault_personality_traits').delete().eq('vault_id', vaultId),
          supabase.from('vault_work_style').delete().eq('vault_id', vaultId),
          supabase.from('vault_values_motivations').delete().eq('vault_id', vaultId),
          supabase.from('vault_behavioral_indicators').delete().eq('vault_id', vaultId),
          supabase.from('vault_interview_responses').delete().eq('vault_id', vaultId),
          supabase.from('vault_resume_milestones').delete().eq('vault_id', vaultId),
          supabase.from('vault_confirmed_skills').delete().eq('user_id', user.id), // Uses user_id!
        ]);

        // Check if any deletes failed
        const failedDeletes = deleteResults.filter(r => r.status === 'rejected');
        if (failedDeletes.length > 0) {
          console.error('[VAULT-CLEAR] Some vault deletes failed:', failedDeletes);
          throw new Error('Failed to clear vault completely. Please try again.');
        }

        console.log('[VAULT-CLEAR] All vault items deleted successfully');

        // CRITICAL: Reset vault progress AND extraction_item_count to 0
        const { error: resetError } = await supabase
          .from('career_vault')
          .update({
            interview_completion_percentage: 0,
            review_completion_percentage: 0,
            total_power_phrases: 0,
            total_transferable_skills: 0,
            total_hidden_competencies: 0,
            total_soft_skills: 0,
            total_leadership_philosophy: 0,
            total_executive_presence: 0,
            total_personality_traits: 0,
            total_work_style: 0,
            total_values: 0,
            total_behavioral_indicators: 0,
            overall_strength_score: 0,
            extraction_item_count: 0, // CRITICAL FIX: Reset to 0
            resume_raw_text: text,
            auto_populated: false,
            extraction_timestamp: new Date().toISOString()
          })
          .eq('id', vaultId);

        if (resetError) {
          console.error('[VAULT-CLEAR] Failed to reset vault:', resetError);
          throw new Error('Failed to reset vault progress. Please try again.');
        }

        console.log('[VAULT-CLEAR] Vault reset complete');

        // VERIFICATION STEP: Confirm vault is actually empty
        const verificationResults = await Promise.all([
          supabase.from('vault_power_phrases').select('id', { count: 'exact', head: true }).eq('vault_id', vaultId),
          supabase.from('vault_transferable_skills').select('id', { count: 'exact', head: true }).eq('vault_id', vaultId),
          supabase.from('vault_confirmed_skills').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
        ]);

        const totalRemaining = verificationResults.reduce((sum, result) => sum + (result.count || 0), 0);
        
        if (totalRemaining > 0) {
          console.error('[VAULT-CLEAR] Verification failed: Found', totalRemaining, 'remaining items');
          throw new Error(`Vault clear verification failed: ${totalRemaining} items still exist. Please try again.`);
        }

        console.log('[VAULT-CLEAR] Verification passed: Vault is empty. Starting AI analysis...');

        toast({
          title: 'Vault cleared successfully',
          description: 'Running AI analysis on new resume...',
        });
      } else {
        // For 'add' action, append to existing resume text
        const { data: existingVault } = await supabase
          .from('career_vault')
          .select('resume_raw_text')
          .eq('id', vaultId)
          .single();

        const combinedText = existingVault?.resume_raw_text
          ? `${existingVault.resume_raw_text}\n\n--- Additional Document ---\n\n${text}`
          : text;

        await supabase
          .from('career_vault')
          .update({ resume_raw_text: combinedText })
          .eq('id', vaultId);

        toast({
          title: 'Document added',
          description: 'Running AI analysis to extract intelligence...',
        });
      }

      // Get target roles and industries from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('target_roles, target_industries')
        .eq('user_id', user.id)
        .single();

      // Run auto-populate AI analysis
      const validatedInput = validateInput(AutoPopulateVaultSchema, {
        vaultId,
        resumeText: text,
        targetRoles: profile?.target_roles,
        targetIndustries: profile?.target_industries
      });

      const { data: autoPopData, error: autoPopError } = await invokeEdgeFunction(
        'auto-populate-vault-v3',
        validatedInput
      );

      if (autoPopError) throw autoPopError;

      if (!autoPopData.success) {
        throw new Error(autoPopData.error || 'Auto-population failed');
      }

      const action = selectedAction === 'replace' ? 'replaced' : 'added';
      toast({
        title: `Document ${action} successfully!`,
        description: `AI extracted ${autoPopData.totalExtracted} intelligence items across ${autoPopData.categories?.length || 0} categories`,
      });

      onResumeUploaded();
      onOpenChange(false);

    } catch (error) {
      // Error already handled by invokeEdgeFunction
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Document Management</DialogTitle>
          <DialogDescription>
            Upload a new resume, add supplementary documents, or replace existing content to enhance your Career Vault intelligence
          </DialogDescription>
        </DialogHeader>

        {!selectedAction ? (
          <div className="space-y-4">
            <Card className="p-6 cursor-pointer hover:border-primary transition-colors" onClick={() => setSelectedAction('replace')}>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-destructive/10 rounded-lg">
                  <Upload className="h-6 w-6 text-destructive" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">Replace Primary Resume</h3>
                  <p className="text-sm text-muted-foreground">
                    Clear existing data and start fresh. Use this when your career has significantly changed.
                  </p>
                  <p className="text-xs text-destructive mt-2">⚠️ This will reset your vault and interview progress</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 cursor-pointer hover:border-primary transition-colors" onClick={() => setSelectedAction('add')}>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">Add Supplementary Document</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload another version, project list, or related document. We'll extract additional intelligence and merge it with your existing vault.
                  </p>
                  <p className="text-xs text-primary mt-2">✓ Keeps all existing intelligence</p>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert variant={selectedAction === 'replace' ? 'destructive' : 'default'}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {selectedAction === 'replace' 
                  ? 'Warning: This will delete all existing milestones and interview responses. Only use this if you want to completely restart.'
                  : 'This will run auto-populate analysis on your new document and add any new intelligence to your vault. Your existing intelligence will be preserved.'}
              </AlertDescription>
            </Alert>

            <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 space-y-4">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  {selectedAction === 'replace' ? 'Upload your new resume' : 'Upload additional resume'}
                </p>
                <label htmlFor="resume-upload">
                  <Button disabled={uploading} asChild>
                    <span>
                      {uploading ? 'Processing...' : 'Choose File'}
                    </span>
                  </Button>
                  <input
                    id="resume-upload"
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setSelectedAction(null)} disabled={uploading}>
                Back
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};