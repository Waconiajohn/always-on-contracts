// =====================================================
// STEP 1A: Upload Resume & Job Description
// =====================================================

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useResumeBuilderV3Store, FitAnalysisResult } from "@/stores/resumeBuilderV3Store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, FileText, Upload, CheckCircle2, BookOpen, Zap } from "lucide-react";
import { toast } from "sonner";
import { LoadingSkeletonV3 } from "./LoadingSkeletonV3";
import { useResumeBuilderApi } from "./hooks/useResumeBuilderApi";
import { logger } from "@/lib/logger";
import { useMasterResume } from "@/hooks/useMasterResume";
import { invokeEdgeFunction } from "@/lib/edgeFunction";
import { cn } from "@/lib/utils";

import { RESUME_LIMITS } from "@/types/resume-builder-v3";

const { MAX_RESUME_CHARS, MAX_JOB_CHARS, MIN_RESUME_CHARS, MIN_JOB_CHARS } = RESUME_LIMITS;

export function UploadStep() {
  const {
    resumeText,
    jobDescription,
    setResumeText,
    setJobDescription,
    setFitAnalysis,
    setLoading,
    isLoading,
  } = useResumeBuilderV3Store();

  // CRITICAL: All hooks must be called before any conditional returns
  const { callApi, isRetrying, currentAttempt, cancel, maxAttempts } = useResumeBuilderApi();
  const { masterResume, isLoading: isMasterLoading } = useMasterResume();

  const [localResume, setLocalResume] = useState(resumeText);
  const [localJob, setLocalJob] = useState(jobDescription);
  const [useMasterResumeToggle, setUseMasterResumeToggle] = useState(false);
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);

  // Sync local state with store when store updates (handles session recovery)
  useEffect(() => {
    if (resumeText && !localResume) {
      setLocalResume(resumeText);
    }
    if (jobDescription && !localJob) {
      setLocalJob(jobDescription);
    }
  }, [resumeText, jobDescription, localResume, localJob]);

  // Handle toggle for using Master Resume
  const handleUseMasterResumeToggle = useCallback((checked: boolean) => {
    setUseMasterResumeToggle(checked);
    if (checked && masterResume?.content) {
      setLocalResume(masterResume.content);
      setResumeFileName(null);
      toast.success("Master Resume loaded!");
    } else if (!checked && masterResume?.content && localResume === masterResume.content) {
      setLocalResume("");
    }
  }, [masterResume?.content, localResume]);

  const [isParsingFile, setIsParsingFile] = useState(false);

  const resumeOverLimit = localResume.length > MAX_RESUME_CHARS;
  const jobOverLimit = localJob.length > MAX_JOB_CHARS;
  const canAnalyze = 
    localResume.trim().length >= MIN_RESUME_CHARS && 
    localJob.trim().length >= MIN_JOB_CHARS &&
    !resumeOverLimit &&
    !jobOverLimit;

  // File drop handler for resume - uses parse-resume edge function (same as Quick Score)
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsParsingFile(true);
    setResumeFileName(file.name);

    try {
      // Handle plain text files directly (no need for edge function)
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        const text = await file.text();
        setLocalResume(text);
        toast.success(`${file.name} loaded successfully`);
        setIsParsingFile(false);
        return;
      }

      // For PDF/DOCX, use the parse-resume edge function (same as Quick Score)
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          
          const { data, error } = await invokeEdgeFunction('parse-resume', {
            fileData: base64,
            fileName: file.name
          });

          if (error || !data?.success) {
            throw new Error(data?.error || error?.message || 'Failed to parse resume');
          }

          setLocalResume(data.text);
          toast.success(`${file.name} processed successfully`);
        } catch (err: any) {
          logger.error("File parsing error:", err);
          toast.error(err.message || "Failed to parse file");
          setResumeFileName(null);
        } finally {
          setIsParsingFile(false);
        }
      };
      reader.onerror = () => {
        toast.error("Failed to read file");
        setResumeFileName(null);
        setIsParsingFile(false);
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      logger.error("File upload error:", error);
      toast.error("Failed to upload file");
      setResumeFileName(null);
      setIsParsingFile(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    disabled: isLoading || isParsingFile,
  });

  const handleAnalyze = async () => {
    if (!canAnalyze) return;

    setLoading(true);
    setResumeText(localResume);
    setJobDescription(localJob);

    const result = await callApi<FitAnalysisResult>({
      step: "fit_analysis",
      body: {
        resumeText: localResume,
        jobDescription: localJob,
      },
      successMessage: "Analysis complete!",
    });

    if (result) {
      setFitAnalysis(result);
    }
    
    setLoading(false);
  };

  // Show loading skeleton when analyzing
  if (isLoading) {
    return (
      <div aria-busy="true" aria-label="Analyzing your resume">
        <LoadingSkeletonV3 
          type="analysis" 
          message={isRetrying ? `Retrying... (Attempt ${currentAttempt}/${maxAttempts})` : undefined}
          onCancel={() => {
            cancel();
            setLoading(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold mb-2 text-foreground">Let's Optimize Your Resume</h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Upload your resume and paste the job description. We'll analyze the fit and help you improve it.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Resume Upload */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Your Resume
            </div>
            
            {/* Master Resume Toggle */}
            {masterResume && (
              <div className="flex items-center gap-2">
                <Switch
                  id="use-master-resume"
                  checked={useMasterResumeToggle}
                  onCheckedChange={handleUseMasterResumeToggle}
                  disabled={isMasterLoading}
                />
                <label 
                  htmlFor="use-master-resume" 
                  className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1"
                >
                  <BookOpen className="h-3 w-3" />
                  Master
                </label>
              </div>
            )}
          </div>

          <div
            {...getRootProps()}
            className={cn(
              'border border-border rounded-lg p-8 text-center cursor-pointer transition-all bg-background hover:bg-muted/30',
              isDragActive && 'border-primary bg-primary/5',
              isParsingFile && 'opacity-50 cursor-wait'
            )}
          >
            <input {...getInputProps()} />
            {isParsingFile ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Processing {resumeFileName}...</p>
              </div>
            ) : resumeFileName && localResume ? (
              <div className="flex flex-col items-center gap-2">
                <CheckCircle2 className="h-8 w-8 text-primary" />
                <p className="font-medium text-sm">{resumeFileName}</p>
                <p className="text-xs text-muted-foreground">Click to replace</p>
              </div>
            ) : isDragActive ? (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-primary" />
                <p className="font-medium text-sm">Drop your resume here...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="font-medium text-sm">Drop your resume here</p>
                <p className="text-xs text-muted-foreground">PDF, DOCX, or TXT</p>
              </div>
            )}
          </div>

          {!resumeFileName && (
            <div>
              <div className="flex items-center gap-2 my-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">or paste text</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <Textarea
                placeholder="Paste your resume text here..."
                value={localResume}
                onChange={(e) => setLocalResume(e.target.value)}
                className={cn(
                  'min-h-[120px] text-sm resize-none',
                  resumeOverLimit && 'border-destructive'
                )}
                aria-describedby="resume-char-count"
              />
            </div>
          )}

          <div id="resume-char-count" className="flex items-center justify-between text-xs text-muted-foreground">
            <span className={cn(resumeOverLimit && 'text-destructive')}>
              {localResume.length.toLocaleString()} / {MAX_RESUME_CHARS.toLocaleString()} characters
            </span>
            {localResume.length < MIN_RESUME_CHARS && localResume.length > 0 && (
              <span className="text-muted-foreground">
                Need {MIN_RESUME_CHARS - localResume.length} more
              </span>
            )}
          </div>
        </div>

        {/* Job Description */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Job Description
          </div>
          <Textarea
            placeholder="Paste the full job description here..."
            value={localJob}
            onChange={(e) => setLocalJob(e.target.value)}
            className={cn(
              'min-h-[280px] text-sm resize-none',
              jobOverLimit && 'border-destructive'
            )}
            aria-describedby="job-char-count"
          />
          <div id="job-char-count" className="flex items-center justify-between text-xs text-muted-foreground">
            <span className={cn(jobOverLimit && 'text-destructive')}>
              {localJob.length.toLocaleString()} / {MAX_JOB_CHARS.toLocaleString()} characters
            </span>
            {localJob.length < MIN_JOB_CHARS && localJob.length > 0 && (
              <span className="text-muted-foreground">
                Need {MIN_JOB_CHARS - localJob.length} more
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Analyze Button */}
      <div className="flex justify-center pt-4">
        <Button
          size="lg"
          onClick={handleAnalyze}
          disabled={!canAnalyze || isLoading}
          className="gap-2 px-8"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              Analyze Fit
            </>
          )}
        </Button>
      </div>

      {/* Features - Minimal */}
      <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground pt-2">
        <span>Gap Analysis</span>
        <span className="w-1 h-1 rounded-full bg-border" />
        <span>Keyword Matching</span>
        <span className="w-1 h-1 rounded-full bg-border" />
        <span>AI Optimization</span>
      </div>
    </div>
  );
}
