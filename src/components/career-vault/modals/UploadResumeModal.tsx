// Upload Resume Modal - Replaces onboarding step 1
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UploadResumeModalProps {
  open: boolean;
  onClose: () => void;
  onUploadComplete: (vaultId: string) => void;
}

export function UploadResumeModal({ open, onClose, onUploadComplete }: UploadResumeModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Reset file state when modal closes
  const handleClose = () => {
    if (!isUploading) {
      setFile(null);
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
        throw new Error(processError.message || 'Failed to process resume file');
      }

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

      onUploadComplete(vaultId);
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Upload failed', {
        description: error instanceof Error ? error.message : 'Please try again'
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" key={file?.name || 'no-file'}>
        <DialogHeader>
          <DialogTitle>Upload Your Resume</DialogTitle>
          <DialogDescription>
            Upload your resume to start building your Career Vault
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
                <p className="text-sm text-slate-600 mb-2">
                  Drag and drop your resume here, or
                </p>
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-indigo-600 hover:text-indigo-700 font-medium">
                    browse files
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
              <p className="text-xs text-slate-500">
                Supports PDF, DOC, DOCX, TXT
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              'Upload & Extract'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
