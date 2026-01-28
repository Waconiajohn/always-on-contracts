import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { 
  Loader2, 
  ArrowRight, 
  AlertTriangle, 
  ChevronDown,
  CheckCircle2,
  Info
} from "lucide-react";
import { ResumeBuilderShell } from "@/components/resume-builder/ResumeBuilderShell";
import { toast } from "sonner";
import { mapUILevelToDB, mapDBLevelToUI } from "@/lib/seniority-utils";
import type { RBProject } from "@/types/resume-builder";

const SENIORITY_LEVELS = [
  "Entry Level",
  "Junior",
  "Mid-Level",
  "Senior",
  "Lead",
  "Principal",
  "Manager",
  "Director",
  "VP",
  "C-Level",
];

// mapSeniorityToUI moved to seniority-utils.ts as mapDBLevelToUI

const INDUSTRIES = [
  "Technology",
  "Finance & Banking",
  "Healthcare",
  "Consulting",
  "Manufacturing",
  "Retail & E-commerce",
  "Media & Entertainment",
  "Education",
  "Government",
  "Non-Profit",
  "Other",
];

export default function TargetPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const isManualEntry = searchParams.get("manual") === "true";
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [classifying, setClassifying] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [hasClassified, setHasClassified] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);

  // Form state
  const [roleTitle, setRoleTitle] = useState("");
  const [seniorityLevel, setSeniorityLevel] = useState("");
  const [industry, setIndustry] = useState("");
  const [subIndustry, setSubIndustry] = useState("");
  
  // Classification results
  const [confidence, setConfidence] = useState<number | null>(null);
  const [reasoning, setReasoning] = useState<string | null>(null);

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const loadProject = async () => {
    if (!projectId) return;
    try {
      const { data, error } = await supabase
        .from("rb_projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (error) throw error;

      const project = data as unknown as RBProject;
      
      // If already classified, populate fields
      if (project.role_title) {
        setRoleTitle(project.role_title);
        setSeniorityLevel(project.seniority_level || "");
        setIndustry(project.industry || "");
        setSubIndustry(project.sub_industry || "");
        setConfidence(project.jd_confidence);
        setHasClassified(true);
      } else if (project.jd_text && !isManualEntry) {
        // Auto-classify if we have JD text
        classifyJD(project.jd_text);
      }
    } catch (err) {
      console.error("Failed to load project:", err);
      toast.error("Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  const classifyJD = async (jdText: string) => {
    if (!projectId) return;
    setClassifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("rb-classify-jd", {
        body: { jd_text: jdText },
      });

      if (error) throw error;

      setRoleTitle(data.role_title || "");
      setSeniorityLevel(mapDBLevelToUI(data.seniority_level) || "");
      setIndustry(data.industry || "");
      setSubIndustry(data.sub_industry || "");
      setConfidence(data.confidence || 0);
      setReasoning(data.justification ? 
        `Role: ${data.justification.role}\nLevel: ${data.justification.level}\nIndustry: ${data.justification.industry}` 
        : null);
      setHasClassified(true);

      // Save classification results
      await supabase
        .from("rb_projects")
        .update({
          role_title: data.role_title,
          seniority_level: data.seniority_level, // Keep original for DB
          industry: data.industry,
          sub_industry: data.sub_industry,
          jd_confidence: data.confidence,
        })
        .eq("id", projectId);
    } catch (err) {
      console.error("Classification failed:", err);
      toast.error("Failed to classify job description");
    } finally {
      setClassifying(false);
    }
  };

  const handleConfirm = async () => {
    if (!projectId) return;
    if (!roleTitle.trim()) {
      toast.error("Please enter a role title");
      return;
    }
    if (!seniorityLevel) {
      toast.error("Please select a seniority level");
      return;
    }
    if (!industry) {
      toast.error("Please select an industry");
      return;
    }

    setConfirming(true);
    try {
      const { error } = await supabase
        .from("rb_projects")
        .update({
          role_title: roleTitle.trim(),
          seniority_level: mapUILevelToDB(seniorityLevel),
          industry,
          sub_industry: subIndustry || null,
          target_confirmed: true,
          status: "processing",
        })
        .eq("id", projectId);

      if (error) throw error;

      navigate(`/resume-builder/${projectId}/processing`);
    } catch (err) {
      console.error("Failed to confirm target:", err);
      toast.error("Failed to save settings");
    } finally {
      setConfirming(false);
    }
  };

  const getConfidenceBadge = () => {
    if (confidence === null) return null;
    
    if (confidence >= 0.75) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
          <CheckCircle2 className="h-3 w-3" />
          High Confidence
        </span>
      );
    } else if (confidence >= 0.65) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-accent text-accent-foreground">
          <Info className="h-3 w-3" />
          Medium Confidence
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
          <AlertTriangle className="h-3 w-3" />
          Low Confidence
        </span>
      );
    }
  };

  if (loading) {
    return (
      <ResumeBuilderShell>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </ResumeBuilderShell>
    );
  }

  return (
    <ResumeBuilderShell
      breadcrumbs={[
        { label: "Projects", href: "/resume-builder" },
        { label: "Target Role" },
      ]}
    >
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {isManualEntry ? "Define Target Role" : "Confirm Target Role"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isManualEntry 
              ? "Tell us about the role you're targeting"
              : "Review the detected role details and adjust if needed"
            }
          </p>
        </div>

        {classifying && (
          <Card className="border-primary/50">
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center space-y-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">Analyzing job description...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {!classifying && (
          <>
            {/* Low confidence warning */}
            {confidence !== null && confidence < 0.65 && (
              <Card className="border-destructive/50 bg-destructive/5">
                <CardContent className="flex items-start gap-3 py-4">
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-destructive">Low Classification Confidence</p>
                    <p className="text-xs text-muted-foreground">
                      We couldn't confidently determine the role details. Please review and correct the fields below.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Role Details</CardTitle>
                  {getConfidenceBadge()}
                </div>
                {hasClassified && !isManualEntry && (
                  <CardDescription className="text-xs">
                    These fields were auto-detected from your job description
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="roleTitle">Role Title</Label>
                  <Input
                    id="roleTitle"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    placeholder="e.g., Senior Software Engineer"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Seniority Level</Label>
                    <Select value={seniorityLevel} onValueChange={setSeniorityLevel}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        {SENIORITY_LEVELS.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Industry</Label>
                    <Select value={industry} onValueChange={setIndustry}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDUSTRIES.map((ind) => (
                          <SelectItem key={ind} value={ind}>
                            {ind}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subIndustry">Sub-Industry / Specialization (Optional)</Label>
                  <Input
                    id="subIndustry"
                    value={subIndustry}
                    onChange={(e) => setSubIndustry(e.target.value)}
                    placeholder="e.g., FinTech, SaaS, Enterprise Software"
                  />
                </div>

                {/* Reasoning collapsible */}
                {reasoning && (
                  <Collapsible open={showReasoning} onOpenChange={setShowReasoning}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full justify-between">
                        <span className="text-xs text-muted-foreground">Why we think this</span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${showReasoning ? "rotate-180" : ""}`} />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-2 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground leading-relaxed">
                        {reasoning}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-center">
              <Button 
                size="lg" 
                onClick={handleConfirm} 
                disabled={confirming || !roleTitle.trim()}
              >
                {confirming ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Confirm & Run Match
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </>
        )}

        <div className="text-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate(`/resume-builder/${projectId}/jd`)}
          >
            ← Back to Job Description
          </Button>
        </div>
      </div>
    </ResumeBuilderShell>
  );
}
