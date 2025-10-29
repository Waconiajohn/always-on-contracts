import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ResearchStage {
  id: string;
  label: string;
  duration: number;
  funFact?: string;
}

interface AIResearchProgressProps {
  targetRole: string;
  targetIndustry: string;
  onComplete: (researchData: any) => void;
}

export const AIResearchProgress = ({ 
  targetRole, 
  targetIndustry, 
  onComplete 
}: AIResearchProgressProps) => {
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [researchData, setResearchData] = useState<any>(null);

  const stages: ResearchStage[] = [
    {
      id: 'analyzing',
      label: 'Analyzing your resume...',
      duration: 3,
      funFact: 'Extracting your unique career fingerprint'
    },
    {
      id: 'researching-executives',
      label: `Researching top executives in ${targetIndustry}...`,
      duration: 15,
      funFact: `Did you know? Top ${targetRole}s in ${targetIndustry} average 4.2 board interactions per year`
    },
    {
      id: 'analyzing-role',
      label: `Analyzing ${targetRole} role expectations...`,
      duration: 15,
      funFact: 'Identifying must-have vs. nice-to-have skills'
    },
    {
      id: 'gap-identification',
      label: 'Identifying skill gaps and opportunities...',
      duration: 10,
      funFact: 'Finding hidden strengths in your background'
    },
    {
      id: 'complete',
      label: 'Research complete!',
      duration: 2,
      funFact: ''
    }
  ];

  useEffect(() => {
    const performResearch = async () => {
      // Simulate progress through stages
      for (let i = 0; i < stages.length; i++) {
        setCurrentStage(i);
        const stage = stages[i];
        
        // Animate progress during this stage
        const steps = stage.duration * 10;
        for (let j = 0; j <= steps; j++) {
          await new Promise(resolve => setTimeout(resolve, 100));
          const stageProgress = (j / steps) * 100;
          const totalProgress = ((i + (j / steps)) / stages.length) * 100;
          setProgress(totalProgress);
        }
      }

      // Mock research data (in real implementation, this would come from the edge function)
      const mockResearchData = {
        roleOverview: {
          description: `${targetRole} in ${targetIndustry}`,
          typicalSeniority: 'Executive',
          averageTenure: '3-5 years'
        },
        mustHaveSkills: [
          { skill: 'Leadership', importance: 'critical', marketFrequency: 95 },
          { skill: 'Strategic Planning', importance: 'critical', marketFrequency: 90 },
          { skill: 'Budget Management', importance: 'important', marketFrequency: 85 }
        ],
        leadershipScope: {
          typicalTeamSize: { min: 30, max: 100 },
          typicalBudgetRange: '$5M-$25M'
        },
        expectedExperiences: [
          { experience: 'Board presentations', frequency: 75 },
          { experience: 'Fundraising involvement', frequency: 60 }
        ]
      };

      setResearchData(mockResearchData);
      setTimeout(() => onComplete(mockResearchData), 1000);
    };

    performResearch();
  }, [targetRole, targetIndustry]);

  const currentStageData = stages[currentStage];
  const isComplete = currentStage === stages.length - 1;

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          {isComplete ? (
            <CheckCircle2 className="w-8 h-8 text-success animate-scale-in" />
          ) : (
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          )}
          <div className="flex-1">
            <CardTitle className="text-2xl">
              {isComplete ? 'Industry Research Complete!' : 'Researching Industry Standards'}
            </CardTitle>
            <CardDescription>
              {currentStageData.label}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Progress value={progress} className="h-3" />
          <p className="text-sm text-muted-foreground text-center">
            {Math.round(progress)}% complete
          </p>
        </div>

        <div className="space-y-3">
          {stages.slice(0, currentStage + 1).map((stage, index) => (
            <div key={stage.id} className="flex items-start gap-3">
              <div className="mt-1">
                {index < currentStage ? (
                  <CheckCircle2 className="w-5 h-5 text-success" />
                ) : index === currentStage && !isComplete ? (
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-success" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium">{stage.label}</p>
                {stage.funFact && index === currentStage && (
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    {stage.funFact}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {isComplete && researchData && (
          <div className="mt-6 p-4 bg-accent rounded-lg">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Research Insights
            </h3>
            <div className="space-y-2 text-sm">
              <p>✓ Found {researchData.mustHaveSkills?.length || 0} critical skills for your role</p>
              <p>✓ Identified typical leadership scope expectations</p>
              <p>✓ Discovered {researchData.expectedExperiences?.length || 0} key experiences</p>
              <Badge variant="secondary" className="mt-2">
                Ready to generate personalized questions
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
