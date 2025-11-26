// Upload Resume Modal - Replaces onboarding step 1
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

interface UploadResumeModalProps {
  open: boolean;
  onClose: () => void;
  onUploadComplete: (vaultId: string) => void;
}

interface ProgressUpdate {
  phase: string;
  percentage: number;
  message: string;
  items_extracted?: number;
}

export function UploadResumeModal({ open, onClose, onUploadComplete }: UploadResumeModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState<ProgressUpdate | null>(null);
  const [currentVaultId, setCurrentVaultId] = useState<string | null>(null);

  // Listen to realtime progress updates
  useEffect(() => {
    if (!currentVaultId) return;

    const channel = supabase
      .channel(`extraction-progress-${currentVaultId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT and UPDATE)
          schema: 'public',
          table: 'extraction_progress',
          filter: `vault_id=eq.${currentVaultId}`
        },
        (payload) => {
          console.log('Progress update received:', payload);
          const newProgress = payload.new as ProgressUpdate;
          setProgress(newProgress);
          
          if (newProgress.phase === 'complete') {
            setTimeout(() => {
              setCurrentVaultId(null);
              setProgress(null);
            }, 2000); // Keep complete message visible for 2s
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentVaultId]);

  // Reset file state when modal closes
  const handleClose = () => {
    if (!isUploading) {
      setFile(null);
      setProgress(null);
      setCurrentVaultId(null);
      onClose();
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Step 1: Extract text from PDF/DOCX using process-resume function
      console.log('Processing file:', file.name, file.type, file.size);
      const formData = new FormData();
      formData.append('file', file);

      // Get auth token for the edge function
      const { data: authSession } = await supabase.auth.getSession();
      const authToken = authSession.session?.access_token;

      const { data: processData, error: processError } = await supabase.functions.invoke('process-resume', {
        body: formData,
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });

      if (processError) {
        console.error('Process resume error:', processError);
        console.error('Full error object:', JSON.stringify(processError, null, 2));
        throw new Error(processError.message || 'Failed to process resume file');
      }

      console.log('Process resume response:', processData);

      if (!processData?.success) {
        const errorMsg = processData?.error || processData?.details || 'Unable to process this resume file';
        throw new Error(errorMsg);
      }

      // Extract text from response (try multiple possible formats)
      const text = processData.extractedText || processData.resume_text || processData.text || processData.data?.extractedText || '';

      if (!text || text.length < 100) {
        throw new Error('Unable to read the resume content. Please try a different file.');
      }

      console.log('Successfully extracted text, length:', text.length);

      // Step 2: Create or get vault
      const { data: existingVault } = await supabase
        .from('career_vault')
        .select('id')
        .eq('user_id', user.id)
        .single();

      let vaultId: string;

      if (existingVault) {
        vaultId = existingVault.id;
        // Update existing vault with new resume
        await supabase
          .from('career_vault')
          .update({
            resume_raw_text: text,
            onboarding_step: 'processing'
          })
          .eq('id', vaultId);
      } else {
        // Create new vault
        const { data: newVault, error: createError } = await supabase
          .from('career_vault')
          .insert({
            user_id: user.id,
            resume_raw_text: text,
            onboarding_step: 'processing'
          })
          .select('id')
          .single();

        if (createError) throw createError;
        vaultId = newVault.id;
      }

      console.log('Vault ready, triggering extraction for vaultId:', vaultId);
      
      // Set vault ID to start listening for progress updates
      setCurrentVaultId(vaultId);
      setProgress({ phase: 'initialization', percentage: 0, message: 'Starting extraction...' });

      // Step 3: Trigger extraction
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;

      const response = await supabase.functions.invoke('auto-populate-vault-v3', {
        body: {
          vaultId,
          resumeText: text
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.error) throw response.error;

      // Market research will be triggered after career direction is set
      console.log('Vault created successfully, waiting for career direction...');
      
      setProgress({ phase: 'complete', percentage: 100, message: 'Complete!' });
      onUploadComplete(vaultId);
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Upload failed', {
        description: error instanceof Error ? error.message : 'Please try again'
      });
      setCurrentVaultId(null);
      setProgress(null);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" key={file?.name || 'no-file'}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Upload your most recent resume
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            We&apos;ll use your resume as the foundation for your Career Vault – a single, accurate record of your experience and achievements.
          </DialogDescription>
        </DialogHeader>

        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive ? 'border-indigo-600 bg-indigo-50' : 'border-slate-300'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {file ? (
            <div className="space-y-4" key={file.name}>
              <FileText className="w-12 h-12 mx-auto text-indigo-600" />
              <div>
                <p className="font-medium text-slate-900" data-testid="filename-display">{file.name}</p>
                <p className="text-sm text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <Button
                onClick={() => setFile(null)}
                variant="outline"
                size="sm"
              >
                Remove
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="w-12 h-12 mx-auto text-slate-400" />
              <div>
                <p className="text-sm font-medium mb-2">
                  Drag and drop your resume here, or click to browse.
                </p>
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-indigo-600 hover:text-indigo-700 font-medium">
                    Browse files
                  </span>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileSelect}
                  />
                </label>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Accepted formats: PDF, Word (.doc, .docx). You only need to do this once.
              </p>
            </div>
          )}
        </div>

        {/* Reassurance block */}
        {!file && (
          <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
            <li>• We read your resume to identify roles, achievements, and skills.</li>
            <li>• You stay in control – you can edit or remove anything later.</li>
            <li>• Your details are used only to support your job search.</li>
          </ul>
        )}

        {/* Progress indicator */}
        {isUploading && progress && (
          <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">
                {progress.phase === 'complete' ? (
                  <span className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="w-4 h-4" />
                    Complete!
                  </span>
                ) : (
                  progress.message
                )}
              </span>
              <span className="text-slate-500">{progress.percentage}%</span>
            </div>
            <Progress value={progress.percentage} className="h-2" />
            {progress.items_extracted && progress.items_extracted > 0 && (
              <p className="text-xs text-slate-500">
                Extracted {progress.items_extracted} items so far...
              </p>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={onClose} disabled={isUploading}>
            Not now
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload and build my Career Vault
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
