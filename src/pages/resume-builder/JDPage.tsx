import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowRight, FileQuestion } from "lucide-react";
import { ResumeBuilderShell } from "@/components/resume-builder/ResumeBuilderShell";
import { toast } from "sonner";

const MAX_CHARS = 15000;

export default function JDPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [jdText, setJdText] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      loadExistingJD();
    }
  }, [projectId]);

  const loadExistingJD = async () => {
    if (!projectId) return;
    try {
      const { data, error } = await supabase
        .from("rb_projects")
        .select("jd_text")
        .eq("id", projectId)
        .single();

      if (error) throw error;
      if (data?.jd_text) {
        setJdText(data.jd_text);
      }
    } catch (err) {
      console.error("Failed to load JD:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async () => {
    if (!jdText.trim() || !projectId) {
      toast.error("Please paste a job description");
      return;
    }

    setSaving(true);
    try {
      // Save JD text to project
      const { error } = await supabase
        .from("rb_projects")
        .update({ 
          jd_text: jdText.trim(),
          status: "target",
        })
        .eq("id", projectId);

      if (error) throw error;

      navigate(`/resume-builder/${projectId}/target`);
    } catch (err) {
      console.error("Failed to save JD:", err);
      toast.error("Failed to save job description");
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    // Navigate to target page for manual entry
    navigate(`/resume-builder/${projectId}/target?manual=true`);
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
        { label: "Job Description" },
      ]}
    >
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Paste Job Description</h1>
          <p className="text-sm text-muted-foreground">
            We'll analyze the requirements and match them against your resume
          </p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Job Description</span>
              <span className="text-xs font-normal text-muted-foreground">
                {jdText.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value.slice(0, MAX_CHARS))}
              placeholder="Paste the full job description here, including requirements, responsibilities, and qualifications..."
              className="min-h-[300px] resize-none text-sm leading-6"
            />
            
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="text-muted-foreground"
              >
                <FileQuestion className="h-4 w-4 mr-2" />
                I don't have a JD
              </Button>
              
              <Button onClick={handleContinue} disabled={saving || !jdText.trim()}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate(`/resume-builder/${projectId}/upload`)}
          >
            ← Back to Upload
          </Button>
        </div>
      </div>
    </ResumeBuilderShell>
  );
}
