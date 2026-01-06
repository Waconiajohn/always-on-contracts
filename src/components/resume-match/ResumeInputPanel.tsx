import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Trash2, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ResumeInputPanelProps {
  resumeText: string;
  onResumeChange: (text: string) => void;
  isAnalyzing?: boolean;
}

export function ResumeInputPanel({ 
  resumeText, 
  onResumeChange,
  isAnalyzing 
}: ResumeInputPanelProps) {
  const [isParsing, setIsParsing] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsParsing(true);

    try {
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        const text = await file.text();
        onResumeChange(text);
        toast.success('Resume loaded successfully');
      } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        // For PDF, we'll just read as text (basic extraction)
        // In production, you'd use a proper PDF parser
        const text = await file.text();
        if (text.length > 100) {
          onResumeChange(text);
          toast.success('Resume loaded - please review the extracted text');
        } else {
          toast.error('Could not extract text from PDF. Please paste your resume text instead.');
        }
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx')) {
        toast.info('DOCX support coming soon. Please paste your resume text for now.');
      } else {
        toast.error('Unsupported file type. Please use TXT, PDF, or paste text directly.');
      }
    } catch (error) {
      console.error('Error parsing file:', error);
      toast.error('Failed to parse file. Please paste your resume text instead.');
    } finally {
      setIsParsing(false);
    }
  }, [onResumeChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
    disabled: isParsing || isAnalyzing
  });

  const handleClear = () => {
    onResumeChange('');
    toast.success('Resume cleared');
  };

  const wordCount = resumeText.trim() ? resumeText.trim().split(/\s+/).length : 0;

  return (
    <Card className="h-full flex flex-col p-4 bg-card/50">
      <div className="flex items-center justify-between mb-3">
        <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          Your Resume
        </Label>
        {resumeText && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{wordCount} words</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-7 px-2 text-destructive hover:text-destructive"
              disabled={isAnalyzing}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Drop zone - show when empty or always show as compact header */}
      {!resumeText && (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all mb-3",
            isDragActive 
              ? "border-primary bg-primary/5" 
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
            (isParsing || isAnalyzing) && "opacity-50 cursor-not-allowed"
          )}
        >
          <input {...getInputProps()} />
          {isParsing ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Parsing resume...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  {isDragActive ? 'Drop your resume here' : 'Drop resume or click to upload'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  TXT, PDF, or DOCX • Or paste below
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Textarea - always visible */}
      <div className="flex-1 flex flex-col min-h-0">
        <Textarea
          placeholder="Paste your resume text here..."
          value={resumeText}
          onChange={(e) => onResumeChange(e.target.value)}
          className="flex-1 resize-none text-sm font-mono bg-background/50 min-h-[200px]"
          disabled={isAnalyzing}
        />
      </div>

      {/* Privacy notice */}
      <p className="text-[10px] text-muted-foreground mt-2 text-center">
        🔒 Your data stays in your browser during editing
      </p>
    </Card>
  );
}
