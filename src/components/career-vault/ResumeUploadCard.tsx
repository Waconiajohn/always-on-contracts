import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ResumeUploadCardProps {
  resumeFile: File | null;
  isUploading: boolean;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
}

export const ResumeUploadCard = ({
  resumeFile,
  isUploading,
  onFileSelect,
  onUpload,
}: ResumeUploadCardProps) => {
  if (isUploading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-full" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-muted rounded-lg p-8 space-y-4">
            <Skeleton className="h-12 w-12 mx-auto rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-64 mx-auto" />
              <Skeleton className="h-4 w-48 mx-auto" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <p className="text-sm text-center text-muted-foreground animate-pulse">
              Analyzing your resume with AI...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle>Upload Your Resume</CardTitle>
        <CardDescription>
          Upload your current resume to kickstart your Career Vault development
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center space-y-4 transition-colors hover:border-primary/50">
          <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
          <div>
            <p className="font-medium">Drop your resume here or click to browse</p>
            <p className="text-sm text-muted-foreground">PDF, DOCX, or TXT up to 10MB</p>
          </div>
          <input
            id="resume-upload"
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={onFileSelect}
            className="hidden"
          />
          <label htmlFor="resume-upload">
            <Button variant="outline" asChild>
              <span>Choose File</span>
            </Button>
          </label>
          {resumeFile && (
            <div className="flex items-center justify-center gap-2 text-sm text-primary animate-scale-in">
              <span className="font-medium">Selected:</span>
              <span>{resumeFile.name}</span>
            </div>
          )}
        </div>
        <Button
          onClick={onUpload}
          disabled={!resumeFile}
          className="w-full"
        >
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};
