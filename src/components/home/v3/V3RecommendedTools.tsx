import { FileText, Search, Briefcase, User, Sparkles, Lock } from "lucide-react";
import { CollapsibleSection } from "./CollapsibleSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Tool {
  id: string;
  title: string;
  description: string;
  icon: any;
  path: string;
  isPrimary?: boolean;
  requiredVault: number;
  aiModels: string[];
  vaultDeps: string;
  successMetric: string;
}

interface V3RecommendedToolsProps {
  vaultCompletion: number;
  activeApplications: number;
  upcomingInterviews: number;
}

export function V3RecommendedTools({
  vaultCompletion,
  activeApplications,
  upcomingInterviews
}: V3RecommendedToolsProps) {
  const navigate = useNavigate();

  const allTools: Tool[] = [
    {
      id: 'quick-score',
      title: 'Quick Resume Score',
      description: 'See what hiring teams actually see—get must-interview status',
      icon: Sparkles,
      path: '/quick-score',
      isPrimary: vaultCompletion < 30,
      requiredVault: 0,
      aiModels: ['Gemini 2.5 Flash', 'GPT-5'],
      vaultDeps: 'No vault required - instant analysis of any resume',
      successMetric: 'Know if you\'re "qualified" or "must-interview" in 90 seconds'
    },
    {
      id: 'interview-prep',
      title: 'Interview Prep',
      description: 'AI-powered practice with your vault data',
      icon: Sparkles,
      path: '/interview-prep',
      isPrimary: upcomingInterviews > 0,
      requiredVault: 40,
      aiModels: ['Gemini 3.0 Pro', 'GPT-5'],
      vaultDeps: 'Work Experience (40%+), Leadership (20%+)',
      successMetric: 'Users who prep with vault data are 2.5x more likely to get offers'
    },
    {
      id: 'career-vault',
      title: 'Career Vault',
      description: 'Build your career intelligence foundation',
      icon: Briefcase,
      path: '/career-vault',
      isPrimary: vaultCompletion < 60,
      requiredVault: 0,
      aiModels: ['Gemini 3.0 Pro', 'Gemini 2.5 Flash'],
      vaultDeps: 'No requirements - builds your vault',
      successMetric: '60%+ vault completion unlocks all AI features'
    },
    {
      id: 'resume-builder',
      title: 'Must-Interview Resume Builder',
      description: 'Extract value, align to reality, translate to hiring language',
      icon: FileText,
      path: '/resume-builder',
      isPrimary: vaultCompletion >= 60 && activeApplications === 0,
      requiredVault: 50,
      aiModels: ['GPT-5', 'Gemini 2.5 Flash'],
      vaultDeps: 'Work Experience (50%+), Skills (40%+)',
      successMetric: 'Must-interview resumes get 45% more callbacks—we don\'t fabricate, we better represent'
    },
    {
      id: 'job-search',
      title: 'Job Search',
      description: 'AI-matched opportunities based on your vault',
      icon: Search,
      path: '/job-search',
      requiredVault: 60,
      aiModels: ['GPT-5'],
      vaultDeps: 'Work Experience (60%+), Skills (50%+)',
      successMetric: 'AI matching increases relevance by 80%'
    },
    {
      id: 'linkedin',
      title: 'LinkedIn Optimization',
      description: 'Transform your profile with vault insights',
      icon: User,
      path: '/linkedin',
      requiredVault: 70,
      aiModels: ['Gemini 3.0 Pro'],
      vaultDeps: 'Complete vault recommended',
      successMetric: 'Optimized profiles get 3x more recruiter views'
    }
  ];

  // Determine primary tool
  const primaryTool = allTools.find(t => t.isPrimary) || allTools.find(t => vaultCompletion >= t.requiredVault) || allTools[1];
  
  // Secondary tools (exclude primary, show max 3)
  const secondaryTools = allTools
    .filter(t => t.id !== primaryTool.id)
    .slice(0, 3);

  const isUnlocked = (tool: Tool) => vaultCompletion >= tool.requiredVault;

  return (
    <CollapsibleSection
      title="🛠️ Recommended Tools"
      defaultOpen={true}
      className="mb-6"
    >
      <Alert className="mb-6 border-primary/20 bg-primary/5">
        <Info className="h-4 w-4 text-primary" />
        <AlertDescription className="text-sm">
          <span className="font-medium">Must-Interview Methodology:</span> Each tool applies 19+ years of positioning science. Quick Score shows where you are. Resume Builder transforms you from "qualified" to "must-interview." No fabrication—better representation of what you've actually accomplished.
        </AlertDescription>
      </Alert>

      {/* Primary Tool */}
      <div className="mb-6 border border-primary/20 rounded-lg p-6 bg-gradient-to-br from-primary/5 to-background">
        <Badge className="mb-3">Recommended for you</Badge>
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <primaryTool.icon className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold mb-2">{primaryTool.title}</h3>
            <p className="text-muted-foreground mb-3">{primaryTool.description}</p>
            
            <div className="space-y-2 text-sm mb-4">
              <div className="flex items-start gap-2">
                <span className="font-medium text-foreground min-w-[120px]">Vault Data Used:</span>
                <span className="text-muted-foreground">{primaryTool.vaultDeps}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-medium text-foreground min-w-[120px]">Success Rate:</span>
                <span className="text-muted-foreground">{primaryTool.successMetric}</span>
              </div>
            </div>

            <Button
              onClick={() => navigate(primaryTool.path)}
              disabled={!isUnlocked(primaryTool)}
              className="w-full md:w-auto"
            >
              {isUnlocked(primaryTool) ? (
                'Get Started'
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Unlock at {primaryTool.requiredVault}% vault
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Secondary Tools Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        {secondaryTools.map(tool => {
          const Icon = tool.icon;
          const unlocked = isUnlocked(tool);

          return (
            <div
              key={tool.id}
              className={`border rounded-lg p-4 transition-all ${
                unlocked
                  ? 'border-border bg-card hover:border-primary/30 cursor-pointer'
                  : 'border-border bg-muted/30 opacity-60'
              }`}
              onClick={() => unlocked && navigate(tool.path)}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className={`p-2 rounded-lg ${unlocked ? 'bg-primary/10' : 'bg-muted'}`}>
                  {unlocked ? (
                    <Icon className="h-4 w-4 text-primary" />
                  ) : (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm mb-1">{tool.title}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">{tool.description}</p>
                </div>
              </div>

              {!unlocked && (
                <p className="text-xs text-muted-foreground">
                  Unlock at {tool.requiredVault}% vault completion
                </p>
              )}
            </div>
          );
        })}
      </div>
    </CollapsibleSection>
  );
}
