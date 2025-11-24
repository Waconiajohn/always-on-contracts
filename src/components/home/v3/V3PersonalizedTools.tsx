import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { 
  Target, FileText, MessageSquare, Briefcase, 
  Linkedin, ArrowRight, Sparkles
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface V3PersonalizedToolsProps {
  vaultCompletion: number;
  activeApplications: number;
  upcomingInterviews: number;
}

interface Tool {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  path: string;
  isPrimary?: boolean;
}

export function V3PersonalizedTools({
  vaultCompletion,
  activeApplications,
  upcomingInterviews
}: V3PersonalizedToolsProps) {
  const navigate = useNavigate();
  
  // Smart tool prioritization
  const getRelevantTools = (): Tool[] => {
    const tools: Tool[] = [];
    
    // Priority 1: Interviews scheduled
    if (upcomingInterviews > 0) {
      tools.push({
        id: 'interview-prep',
        title: 'Interview Prep',
        description: `You have ${upcomingInterviews} interview${upcomingInterviews > 1 ? 's' : ''} coming up. Practice with vault-powered responses based on your experience.`,
        icon: MessageSquare,
        path: '/agents/interview-prep',
        isPrimary: true
      });
    }
    
    // Priority 2: Vault incomplete
    if (vaultCompletion < 60 && tools.length === 0) {
      tools.push({
        id: 'career-vault',
        title: 'Career Vault',
        description: 'Build your career intelligence foundation. Complete your vault to unlock AI resume generation and job matching.',
        icon: Target,
        path: '/career-vault',
        isPrimary: true
      });
    }
    
    // Priority 3: Vault ready but no resume
    if (vaultCompletion >= 60 && tools.length === 0) {
      tools.push({
        id: 'resume-builder',
        title: 'Resume Builder',
        description: 'Your vault is ready. Generate AI-powered, ATS-optimized resumes tailored to specific roles.',
        icon: FileText,
        path: '/agents/resume-builder-wizard',
        isPrimary: true
      });
    }
    
    // Secondary tools
    if (activeApplications < 5 && vaultCompletion >= 60) {
      tools.push({
        id: 'job-search',
        title: 'Job Search',
        description: 'AI-powered matching with your vault',
        icon: Briefcase,
        path: '/job-search'
      });
    }
    
    if (vaultCompletion >= 80) {
      tools.push({
        id: 'linkedin-profile',
        title: 'LinkedIn Profile',
        description: 'Optimize your professional presence',
        icon: Linkedin,
        path: '/agents/linkedin-profile-builder'
      });
    }
    
    if (vaultCompletion >= 60 && !tools.find(t => t.id === 'resume-builder')) {
      tools.push({
        id: 'resume-builder',
        title: 'Resume Builder',
        description: 'Generate tailored resumes',
        icon: FileText,
        path: '/agents/resume-builder-wizard'
      });
    }
    
    return tools.slice(0, 5);
  };
  
  const tools = getRelevantTools();
  const primaryTool = tools.find(t => t.isPrimary);
  const secondaryTools = tools.filter(t => !t.isPrimary);
  
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Recommended For You</h2>
      
      {/* Primary Tool - Large Card */}
      {primaryTool && (
        <Card 
          className="cursor-pointer hover:shadow-lg transition-all border-primary/40 bg-gradient-to-br from-primary/5 to-background"
          onClick={() => navigate(primaryTool.path)}
        >
          <CardContent className="p-8">
            <div className="flex items-start gap-6">
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <primaryTool.icon className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-semibold">{primaryTool.title}</h3>
                  <Badge className="bg-primary/20 text-primary border-primary/30">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Priority
                  </Badge>
                </div>
                <p className="text-base leading-relaxed">
                  {primaryTool.description}
                </p>
                <Button size="lg" className="group">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Secondary Tools - Grid */}
      {secondaryTools.length > 0 && (
        <div className="grid md:grid-cols-3 gap-4">
          {secondaryTools.map(tool => {
            const Icon = tool.icon;
            return (
              <Card 
                key={tool.id}
                className="cursor-pointer hover:shadow-md transition-all group"
                onClick={() => navigate(tool.path)}
              >
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <CardTitle className="text-lg">{tool.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-base text-muted-foreground mb-4">
                    {tool.description}
                  </p>
                  <div className="flex items-center text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Open Tool <ArrowRight className="ml-1 h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
