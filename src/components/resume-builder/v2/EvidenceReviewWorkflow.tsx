import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { RequirementBulletMapper } from "./RequirementBulletMapper";
import { Search, Filter, CheckCircle2, AlertCircle, Clock, Download } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EvidenceReviewWorkflowProps {
  jobId: string;
  evidenceMatrix: any[];
  onComplete: (selections: any) => void;
  onCancel: () => void;
}

export const EvidenceReviewWorkflow = ({ 
  jobId, 
  evidenceMatrix,
  onComplete,
  onCancel 
}: EvidenceReviewWorkflowProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selections, setSelections] = useState<Record<string, any>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Filter requirements based on search and filters
  const filteredRequirements = evidenceMatrix.filter((req) => {
    if (!req || !req.requirement) return false;
    
    // Search filter
    if (searchQuery && !req.requirement.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Priority filter
    if (filterPriority !== "all" && req.priority !== filterPriority) {
      return false;
    }
    
    // Status filter (reviewed/unreviewed)
    if (filterStatus === "reviewed" && !selections[req.requirement]) {
      return false;
    }
    if (filterStatus === "unreviewed" && selections[req.requirement]) {
      return false;
    }
    
    return true;
  });

  const currentRequirement = filteredRequirements[currentIndex];
  const totalReviewed = Object.keys(selections).length;
  const progress = (totalReviewed / evidenceMatrix.length) * 100;

  // Load existing session
  useEffect(() => {
    loadExistingSession();
  }, [jobId]);

  const loadExistingSession = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('evidence_matrix_sessions')
        .select('*')
        .eq('job_id', jobId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSessionId(data.id);
        const savedSelections = typeof data.selections_json === 'object' && data.selections_json !== null 
          ? data.selections_json as Record<string, any>
          : {};
        setSelections(savedSelections);
        toast.info("Resumed previous evidence review session");
      }
    } catch (error) {
      console.error("Error loading session:", error);
    }
  };

  const saveSession = async (selectionsToSave = selections) => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const sessionData = {
        user_id: user.id,
        job_id: jobId,
        requirements_json: evidenceMatrix,
        selections_json: selectionsToSave,
        is_complete: Object.keys(selectionsToSave).length === evidenceMatrix.length,
        updated_at: new Date().toISOString()
      };

      if (sessionId) {
        const { error } = await supabase
          .from('evidence_matrix_sessions')
          .update(sessionData)
          .eq('id', sessionId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('evidence_matrix_sessions')
          .insert(sessionData)
          .select()
          .single();
        if (error) throw error;
        setSessionId(data.id);
      }

      toast.success("Progress saved");
    } catch (error) {
      console.error("Error saving session:", error);
      toast.error("Failed to save progress");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelection = (requirement: string, selection: any) => {
    const newSelections = {
      ...selections,
      [requirement]: selection
    };
    setSelections(newSelections);
    saveSession(newSelections);
  };

  const handleNext = () => {
    if (currentIndex < filteredRequirements.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleBulkAcceptEnhanced = () => {
    const newSelections = { ...selections };
    filteredRequirements.forEach((req) => {
      if (!selections[req.requirement]) {
        newSelections[req.requirement] = {
          type: 'enhanced',
          content: req.enhancedBullet,
          originalBullet: req.originalBullet,
          source: req.source
        };
      }
    });
    setSelections(newSelections);
    saveSession(newSelections);
    toast.success(`Accepted enhanced bullets for ${Object.keys(newSelections).length - totalReviewed} requirements`);
  };

  const handleReviewLowMatches = () => {
    const lowMatchIndex = filteredRequirements.findIndex(
      (req, idx) => idx > currentIndex && req.matchScore < 70
    );
    if (lowMatchIndex !== -1) {
      setCurrentIndex(lowMatchIndex);
    } else {
      toast.info("No more low-match requirements to review");
    }
  };

  const handleComplete = async () => {
    if (Object.keys(selections).length < evidenceMatrix.length) {
      toast.error(`Please review all ${evidenceMatrix.length} requirements (${totalReviewed} completed)`);
      return;
    }

    // Mark session as complete
    if (sessionId) {
      await supabase
        .from('evidence_matrix_sessions')
        .update({ 
          is_complete: true,
          completed_at: new Date().toISOString()
        })
        .eq('id', sessionId);
    }

    onComplete(selections);
  };

  const exportAsInterviewGuide = () => {
    const guide = evidenceMatrix.map((req, i) => {
      const selection = selections[req.requirement];
      return `
${i + 1}. ${req.requirement} ${req.priority ? `(${req.priority})` : ''}

Your Evidence:
${selection?.content || req.enhancedBullet || req.originalBullet}

From: ${req.source?.company || 'Career Vault'}
Match Score: ${req.matchScore}%

STAR Format Suggestion:
Situation: [Context of ${req.source?.company || 'your role'}]
Task: [The challenge that required ${req.requirement}]
Action: [What you did - ${selection?.content?.substring(0, 100) || ''}...]
Result: ${req.source?.metrics || 'Quantified outcome'}

---
`;
    }).join('\n');

    const blob = new Blob([guide], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-prep-guide-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Interview prep guide downloaded");
  };

  if (!currentRequirement) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Requirements Found</CardTitle>
          <CardDescription>
            Adjust your filters or search to find requirements to review.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onCancel}>Back to Resume Builder</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Evidence Review - One-Time Setup</CardTitle>
              <CardDescription>
                Map job requirements to your work history. This happens once, then all sections use these selections.
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{totalReviewed}/{evidenceMatrix.length}</div>
              <div className="text-sm text-muted-foreground">Requirements Reviewed</div>
            </div>
          </div>
          <Progress value={progress} className="mt-4" />
        </CardHeader>
      </Card>

      {/* Filters and Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search requirements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="required">Required</SelectItem>
                <SelectItem value="preferred">Preferred</SelectItem>
                <SelectItem value="nice-to-have">Nice-to-Have</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="unreviewed">Unreviewed</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleBulkAcceptEnhanced} variant="outline">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Accept All Enhanced
            </Button>

            <Button onClick={handleReviewLowMatches} variant="outline">
              <AlertCircle className="h-4 w-4 mr-2" />
              Review Low Matches
            </Button>

            <Button onClick={exportAsInterviewGuide} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Interview Guide
            </Button>

            <Button onClick={() => saveSession()} disabled={isSaving} variant="outline">
              <Clock className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save Progress"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Evidence Mapper */}
      <RequirementBulletMapper
        evidenceMatrix={[currentRequirement]}
        onComplete={(finalSelections) => {
          // Handle individual requirement selection
          const req = currentRequirement.requirement;
          const selection = finalSelections[0];
          handleSelection(req, selection);
          
          // Auto-advance to next
          if (currentIndex < filteredRequirements.length - 1) {
            handleNext();
          }
        }}
        onCancel={onCancel}
      />

      {/* Footer Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-x-2">
              <Button onClick={handlePrevious} disabled={currentIndex === 0} variant="outline">
                Previous
              </Button>
              <Button onClick={handleNext} disabled={currentIndex >= filteredRequirements.length - 1} variant="outline">
                Next
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={onCancel} variant="outline">
                Save & Exit
              </Button>
              <Button 
                onClick={handleComplete} 
                disabled={totalReviewed < evidenceMatrix.length}
              >
                Complete Review ({totalReviewed}/{evidenceMatrix.length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
