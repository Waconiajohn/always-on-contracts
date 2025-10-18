import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, FileText, Plus, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      // Read file as text
      const text = await file.text();

      if (selectedAction === 'replace') {
        // Delete existing milestones
        await supabase
          .from('vault_resume_milestones')
          .delete()
          .eq('vault_id', vaultId);

        // Delete existing responses
        await supabase
          .from('vault_interview_responses')
          .delete()
          .eq('vault_id', vaultId);

        // Reset vault progress
        await supabase
          .from('career_vault')
          .update({
            interview_completion_percentage: 0,
            total_power_phrases: 0,
            total_transferable_skills: 0,
            total_hidden_competencies: 0
          })
          .eq('id', vaultId);

        toast({
          title: 'Old data cleared',
          description: 'Parsing new resume...',
        });
      }

      // Parse new resume
      const { data, error } = await supabase.functions.invoke('parse-resume-milestones', {
        body: {
          resumeText: text,
          vaultId: vaultId
        }
      });

      if (error) throw error;

      toast({
        title: 'Resume uploaded successfully',
        description: `${data.milestones.length} job milestones extracted. Ready to continue interview.`,
      });

      onResumeUploaded();
      onOpenChange(false);

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Could not process resume',
        variant: 'destructive'
      });
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
