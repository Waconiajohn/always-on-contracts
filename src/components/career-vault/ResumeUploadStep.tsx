import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, CheckCircle2 } from "lucide-react";

interface ResumeUploadStepProps {
  resumeFile: File | null;
  resumeText: string;
  isParsingFile: boolean;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResumeTextChange: (text: string) => void;
  onAnalyze: () => void;
}

export const ResumeUploadStep = ({
  resumeFile,
  resumeText,
  isParsingFile,
  onFileUpload,
  onResumeTextChange,
  onAnalyze,
}: ResumeUploadStepProps) => {
  return (
    <Card className="p-8 animate-fade-in">
      <div className="flex flex-col items-center text-center">
        <Upload className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Upload Your Resume</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Upload your resume (.txt, .pdf, .doc, or .docx) or paste your resume text below.
        </p>
        
        <input
          type="file"
          accept=".txt,.pdf,.doc,.docx"
          onChange={onFileUpload}
          className="hidden"
          id="resume-upload"
          disabled={isParsingFile}
        />
        <div className="flex gap-3 mb-4">
          <label htmlFor="resume-upload">
            <Button size="lg" variant="outline" asChild disabled={isParsingFile}>
              <span>{isParsingFile ? "Parsing..." : "Upload Resume"}</span>
            </Button>
          </label>
        </div>
        
        {/* Parsing status */}
        {isParsingFile && (
          <div className="w-full max-w-md mb-4 p-4 bg-warning/10 border border-warning/20 rounded-lg animate-pulse">
            <div className="flex items-center gap-2 text-warning">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              <p className="font-medium">Extracting text from your file... This usually takes just a few seconds.</p>
            </div>
          </div>
        )}
        
        {/* Show uploaded file status */}
        {resumeFile && !isParsingFile && resumeText && (
          <>
            <div className="w-full max-w-md mb-4 p-4 bg-success/10 border border-success/20 rounded-lg animate-scale-in">
              <div className="flex items-center gap-2 text-success">
                <CheckCircle2 className="w-5 h-5" />
                <div className="flex-1 text-left">
                  <p className="font-medium">Resume parsed successfully</p>
                  <p className="text-sm">{resumeFile.name} • {resumeText.length.toLocaleString()} characters extracted</p>
                </div>
              </div>
            </div>
            
            {/* What Happens Next Info */}
            <div className="w-full max-w-md mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg text-left">
              <h3 className="font-semibold mb-2">What happens next?</h3>
              <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                <li>I'll analyze your resume</li>
                <li>You'll answer 25 questions about your experience</li>
                <li>I'll build your Career Vault with power phrases, skills, and hidden competencies</li>
                <li>Use your Career Vault to supercharge job applications and interviews</li>
              </ol>
            </div>
          </>
        )}
        
        <div className="w-full max-w-md">
          <Textarea
            value={resumeText}
            onChange={(e) => onResumeTextChange(e.target.value)}
            placeholder="Or paste your resume text here..."
            className="min-h-[200px] mb-2"
            disabled={isParsingFile}
          />
          {resumeText && (
            <p className="text-xs text-muted-foreground text-right mb-4">
              {resumeText.length.toLocaleString()} characters
            </p>
          )}
          <Button 
            onClick={onAnalyze} 
            size="lg" 
            className="w-full"
            disabled={!resumeText || isParsingFile}
          >
            {resumeText ? "Start Building My Career Vault" : "Add your resume to continue"}
          </Button>
        </div>
      </div>
    </Card>
  );
};
