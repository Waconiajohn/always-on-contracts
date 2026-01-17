// =====================================================
// STEP 1A: Upload Resume & Job Description
// =====================================================

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useResumeBuilderV3Store, FitAnalysisResult } from "@/stores/resumeBuilderV3Store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Sparkles, FileText, Briefcase, Upload, AlertTriangle, BookOpen, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { LoadingSkeletonV3 } from "./LoadingSkeletonV3";
import { useResumeBuilderApi } from "./hooks/useResumeBuilderApi";
import { HelpTooltip, HELP_CONTENT } from "./components/HelpTooltip";
import { logger } from "@/lib/logger";
import { useMasterResume } from "@/hooks/useMasterResume";
import { invokeEdgeFunction } from "@/lib/edgeFunction";

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

  const getCharacterStatus = (current: number, min: number, max: number) => {
    if (current > max) return "text-destructive";
    if (current < min) return "text-muted-foreground";
    if (current > max * 0.9) return "text-amber-600";
    return "text-green-600";
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
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center mb-4 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold mb-2">Let's Optimize Your Resume</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Paste your resume and the job description. We'll analyze the fit and help you improve it.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Resume input with dropzone */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Your Resume
              <HelpTooltip content={HELP_CONTENT.resumeInput} />
            </Label>
            
            {/* Master Resume Toggle */}
            {masterResume && (
              <div className="flex items-center gap-2">
                <Switch
                  id="use-master-resume"
                  checked={useMasterResumeToggle}
                  onCheckedChange={handleUseMasterResumeToggle}
                  disabled={isMasterLoading}
                />
                <Label 
                  htmlFor="use-master-resume" 
                  className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1"
                >
                  <BookOpen className="h-3 w-3" />
                  Use Master Resume
                </Label>
              </div>
            )}
          </div>
          
          {/* Drop zone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? "border-primary bg-primary/5" 
                : "border-muted-foreground/30 hover:border-primary/50"
            } ${isParsingFile ? "opacity-50 cursor-wait" : ""}`}
          >
            <input {...getInputProps()} />
            {isParsingFile ? (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing {resumeFileName}...
              </div>
            ) : resumeFileName && localResume ? (
              <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span>{resumeFileName}</span>
                <span className="text-muted-foreground">(click to replace)</span>
              </div>
            ) : isDragActive ? (
              <p className="text-sm text-primary">Drop your resume here...</p>
            ) : (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Upload className="h-4 w-4" />
                <span>Drop PDF, DOCX, or TXT file here, or click to upload</span>
              </div>
            )}
          </div>

          <Textarea
            placeholder="Or paste your resume text here..."
            value={localResume}
            onChange={(e) => setLocalResume(e.target.value)}
            className={`min-h-[200px] sm:min-h-[260px] font-mono text-sm ${resumeOverLimit ? "border-destructive" : ""}`}
            aria-describedby="resume-char-count"
          />
          <div id="resume-char-count" className="flex items-center justify-between text-xs">
            <span className={getCharacterStatus(localResume.length, MIN_RESUME_CHARS, MAX_RESUME_CHARS)}>
              {localResume.length.toLocaleString()} / {MAX_RESUME_CHARS.toLocaleString()} characters
              {localResume.length < MIN_RESUME_CHARS && ` (need at least ${MIN_RESUME_CHARS})`}
            </span>
            {resumeOverLimit && (
              <span className="flex items-center gap-1 text-destructive">
                <AlertTriangle className="h-3 w-3" />
                Too long
              </span>
            )}
          </div>
        </div>

        {/* Job description input */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Job Description
            <HelpTooltip content={HELP_CONTENT.jobDescription} />
          </Label>
          <Textarea
            placeholder="Paste the job description here..."
            value={localJob}
            onChange={(e) => setLocalJob(e.target.value)}
            className={`min-h-[200px] sm:min-h-[300px] font-mono text-sm ${jobOverLimit ? "border-destructive" : ""}`}
            aria-describedby="job-char-count"
          />
          <div id="job-char-count" className="flex items-center justify-between text-xs">
            <span className={getCharacterStatus(localJob.length, MIN_JOB_CHARS, MAX_JOB_CHARS)}>
              {localJob.length.toLocaleString()} / {MAX_JOB_CHARS.toLocaleString()} characters
              {localJob.length < MIN_JOB_CHARS && ` (need at least ${MIN_JOB_CHARS})`}
            </span>
            {jobOverLimit && (
              <span className="flex items-center gap-1 text-destructive">
                <AlertTriangle className="h-3 w-3" />
                Too long
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-4">
        <Button
          size="lg"
          onClick={handleAnalyze}
          disabled={!canAnalyze || isLoading}
          className="min-w-[200px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Analyze Fit
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
