import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { ResumeBuilderShell } from "@/components/resume-builder/ResumeBuilderShell";
import { toast } from "sonner";

type StageStatus = "pending" | "running" | "complete" | "error";

interface Stage {
  id: string;
  label: string;
  description: string;
  status: StageStatus;
  error?: string;
}

const INITIAL_STAGES: Stage[] = [
  { 
    id: "jd_requirements", 
    label: "Extract JD Requirements", 
    description: "Analyzing job description for key requirements",
    status: "pending" 
  },
  { 
    id: "benchmark", 
    label: "Generate Role Benchmark", 
    description: "Creating expected profile for this role level",
    status: "pending" 
  },
  { 
    id: "claims", 
    label: "Extract Resume Claims", 
    description: "Identifying skills and achievements from your resume",
    status: "pending" 
  },
  { 
    id: "gaps", 
    label: "Gap Analysis", 
    description: "Comparing your profile against requirements",
    status: "pending" 
  },
  { 
    id: "score", 
    label: "Compute Match Score", 
    description: "Calculating your overall match percentage",
    status: "pending" 
  },
];

export default function ProcessingPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [stages, setStages] = useState<Stage[]>(INITIAL_STAGES);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [hasError, setHasError] = useState(false);
  const pipelineStarted = useRef(false);

  useEffect(() => {
    if (projectId && !pipelineStarted.current) {
      pipelineStarted.current = true;
      runPipeline();
    }
  }, [projectId]);

  const updateStage = (index: number, updates: Partial<Stage>) => {
    setStages(prev => prev.map((s, i) => 
      i === index ? { ...s, ...updates } : s
    ));
  };

  const runPipeline = async () => {
    if (!projectId) return;
    
    try {
      // Load project data
      const { data: project, error: projectError } = await supabase
        .from("rb_projects")
        .select("*, rb_documents(*)")
        .eq("id", projectId)
        .single();

      if (projectError) throw projectError;

      const jdText = project.jd_text;
      const resumeText = project.rb_documents?.[0]?.raw_text;

      if (!jdText) {
        throw new Error("No job description found");
      }
      if (!resumeText) {
        throw new Error("No resume found");
      }

      // Stage 1: Extract JD Requirements
      setCurrentStageIndex(0);
      updateStage(0, { status: "running" });
      
      const { error: jdError } = await supabase.functions.invoke(
        "extract-jd-requirements",
        { body: { jdText, projectId } }
      );
      
      if (jdError) throw new Error(`JD extraction failed: ${jdError.message}`);
      updateStage(0, { status: "complete" });

      // Stage 2: Generate Benchmark
      setCurrentStageIndex(1);
      updateStage(1, { status: "running" });
      
      const { error: benchError } = await supabase.functions.invoke(
        "generate-role-benchmark",
        { 
          body: { 
            roleTitle: project.role_title,
            seniorityLevel: project.seniority_level,
            industry: project.industry,
            projectId,
          } 
        }
      );
      
      if (benchError) throw new Error(`Benchmark generation failed: ${benchError.message}`);
      updateStage(1, { status: "complete" });

      // Stage 3: Extract Resume Claims
      setCurrentStageIndex(2);
      updateStage(2, { status: "running" });
      
      const { error: claimsError } = await supabase.functions.invoke(
        "extract-resume-claims",
        { body: { resumeText, projectId } }
      );
      
      if (claimsError) throw new Error(`Claims extraction failed: ${claimsError.message}`);
      updateStage(2, { status: "complete" });

      // Stage 4: Gap Analysis
      setCurrentStageIndex(3);
      updateStage(3, { status: "running" });
      
      const { data: gaps, error: gapsError } = await supabase.functions.invoke(
        "analyze-resume-gaps",
        { body: { projectId } }
      );
      
      if (gapsError) throw new Error(`Gap analysis failed: ${gapsError.message}`);
      updateStage(3, { status: "complete" });

      // Stage 5: Compute Score (deterministic, no AI call)
      setCurrentStageIndex(4);
      updateStage(4, { status: "running" });
      
      // Calculate score from gap analysis
      const score = gaps?.score ?? calculateScore(gaps);
      
      // Save score to project
      await supabase
        .from("rb_projects")
        .update({ 
          current_score: score,
          original_score: score,
          status: "report",
        })
        .eq("id", projectId);

      updateStage(4, { status: "complete" });

      // Navigate to report after brief delay
      setTimeout(() => {
        navigate(`/resume-builder/${projectId}/report`);
      }, 1500);

    } catch (err) {
      console.error("Pipeline failed:", err);
      setHasError(true);
      updateStage(currentStageIndex, { 
        status: "error", 
        error: err instanceof Error ? err.message : "Unknown error" 
      });
      toast.error("Processing failed. Please try again.");
    }
  };

  const calculateScore = (gaps: Record<string, unknown> | null): number => {
    // Fallback deterministic scoring
    if (!gaps) return 50;
    
    const met = (gaps.met as unknown[])?.length || 0;
    const partial = (gaps.partial as unknown[])?.length || 0;
    const unmet = (gaps.unmet as unknown[])?.length || 0;
    const total = met + partial + unmet;
    
    if (total === 0) return 50;
    
    return Math.round(((met * 1 + partial * 0.5) / total) * 100);
  };

  const getStageIcon = (stage: Stage) => {
    switch (stage.status) {
      case "complete":
        return <CheckCircle2 className="h-5 w-5 text-primary" />;
      case "running":
        return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground/30" />;
    }
  };

  return (
    <ResumeBuilderShell
      breadcrumbs={[
        { label: "Projects", href: "/resume-builder" },
        { label: "Processing" },
      ]}
    >
      <div className="max-w-xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Analyzing Your Match</h1>
          <p className="text-sm text-muted-foreground">
            {hasError 
              ? "An error occurred during processing"
              : "We're comparing your resume against job requirements"
            }
          </p>
        </div>

        <Card>
          <CardContent className="py-6">
            <div className="space-y-4">
              {stages.map((stage) => (
                <div 
                  key={stage.id}
                  className={`flex items-start gap-4 p-3 rounded-lg transition-colors ${
                    stage.status === "running" ? "bg-primary/5" : ""
                  } ${stage.status === "error" ? "bg-destructive/5" : ""}`}
                >
                  <div className="mt-0.5">{getStageIcon(stage)}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${
                      stage.status === "pending" ? "text-muted-foreground" : ""
                    }`}>
                      {stage.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {stage.error || stage.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {hasError && (
          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        )}
      </div>
    </ResumeBuilderShell>
  );
}
