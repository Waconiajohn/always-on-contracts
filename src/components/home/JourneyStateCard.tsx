import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { Target, TrendingUp, Rocket, Briefcase, Users, CheckCircle2 } from "lucide-react";
import type { JourneyState } from "@/hooks/useJourneyState";

interface JourneyStateCardProps {
  state: JourneyState;
  vaultCompletion: number;
  activeApplications: number;
  upcomingInterviews: number;
}

export const JourneyStateCard = ({ 
  state, 
  vaultCompletion, 
  activeApplications,
  upcomingInterviews 
}: JourneyStateCardProps) => {
  const navigate = useNavigate();

  if (state === 'getting-started') {
    return (
      <Card className="p-8 bg-gradient-to-br from-primary/5 to-background">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-shrink-0">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Target className="h-10 w-10 text-primary" />
            </div>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-semibold mb-2">Build Your Career Vault</h2>
            <p className="text-muted-foreground mb-4">
              Create your AI-powered career intelligence system in 15 minutes. 
              Unlock all features and start landing opportunities faster.
            </p>
            <Button size="lg" onClick={() => navigate('/career-vault-onboarding')}>
              Start Building
            </Button>
          </div>
        </div>

        {/* Abbreviated Steps - Show what's coming */}
        <div className="grid grid-cols-3 gap-4 pt-6 mt-6 border-t">
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="text-sm font-semibold">Step 1: Build</p>
            <p className="text-xs text-muted-foreground mt-1">Career Vault Interview</p>
          </div>
          <div className="text-center opacity-60">
            <div className="flex justify-center mb-2">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <Rocket className="h-5 w-5" />
              </div>
            </div>
            <p className="text-sm font-semibold">Step 2: Deploy</p>
            <p className="text-xs text-muted-foreground mt-1">Apply to jobs & network</p>
          </div>
          <div className="text-center opacity-60">
            <div className="flex justify-center mb-2">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <p className="text-sm font-semibold">Step 3: Win</p>
            <p className="text-xs text-muted-foreground mt-1">Interviews & offers</p>
          </div>
        </div>
      </Card>
    );
  }

  if (state === 'building-momentum') {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">Career Vault Progress</h3>
            <p className="text-sm text-muted-foreground">Keep going! You're {vaultCompletion}% complete</p>
          </div>
        </div>
        <Progress value={vaultCompletion} className="h-3 mb-4" />
        <div className="flex gap-2 mb-6">
          <Button onClick={() => navigate('/career-vault-onboarding')}>
            Continue Interview
          </Button>
          <Button variant="outline" onClick={() => navigate('/ai-agents')}>
            Preview Features
          </Button>
        </div>

        {/* Abbreviated Steps - Show progress */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="text-sm font-semibold">Step 1: Build</p>
            <p className="text-xs text-primary mt-1">{vaultCompletion}% Complete</p>
          </div>
          <div className="text-center opacity-60">
            <div className="flex justify-center mb-2">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <Rocket className="h-5 w-5" />
              </div>
            </div>
            <p className="text-sm font-semibold">Step 2: Deploy</p>
            <p className="text-xs text-muted-foreground mt-1">Coming soon</p>
          </div>
          <div className="text-center opacity-60">
            <div className="flex justify-center mb-2">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <p className="text-sm font-semibold">Step 3: Win</p>
            <p className="text-xs text-muted-foreground mt-1">Coming soon</p>
          </div>
        </div>
      </Card>
    );
  }

  if (state === 'vault-complete-first-time') {
    return (
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-background">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">Vault Complete - Ready to Deploy!</h3>
            <p className="text-sm text-muted-foreground">Your career intelligence system is built. Time to start applying!</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <Button onClick={() => navigate('/opportunities')}>
            Search for Jobs
          </Button>
          <Button variant="outline" onClick={() => navigate('/agents/resume-builder')}>
            Build Resume
          </Button>
          <Button variant="outline" onClick={() => navigate('/ai-agents')}>
            Explore AI Agents
          </Button>
        </div>

        {/* Abbreviated Steps */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span className="font-semibold">Step 1: Build ✓</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Rocket className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Step 2: Deploy</span>
          </div>
          <div className="flex items-center gap-2 text-sm opacity-50">
            <Users className="h-4 w-4" />
            <span className="text-muted-foreground">Step 3: Win</span>
          </div>
        </div>
      </Card>
    );
  }

  if (state === 'actively-deploying') {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Rocket className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">Deploy Phase: Active</h3>
            <p className="text-sm text-muted-foreground">Your AI agents are working for you</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-primary">{activeApplications}</div>
            <div className="text-sm text-muted-foreground">Active Applications</div>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-primary">{upcomingInterviews}</div>
            <div className="text-sm text-muted-foreground">Interviews Scheduled</div>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <Button onClick={() => navigate('/opportunities')}>
            Find More Jobs
          </Button>
          <Button variant="outline" onClick={() => navigate('/application-queue')}>
            View Queue
          </Button>
        </div>

        {/* Abbreviated Steps */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Step 1: Build</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Rocket className="h-4 w-4 text-primary" />
            <span className="font-semibold">Step 2: Deploy</span>
          </div>
          <div className="flex items-center gap-2 text-sm opacity-50">
            <Users className="h-4 w-4" />
            <span className="text-muted-foreground">Step 3: Win</span>
          </div>
        </div>
      </Card>
    );
  }

  if (state === 'interview-phase') {
    return (
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-background">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">Win Phase: Interview Ready</h3>
            <p className="text-sm text-muted-foreground">
              {upcomingInterviews} interview{upcomingInterviews !== 1 ? 's' : ''} scheduled
            </p>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-muted/50 mb-4">
          <Briefcase className="h-5 w-5 text-primary mb-2" />
          <p className="text-sm">Focus on interview preparation and follow-up communications</p>
        </div>

        <div className="flex gap-2 mb-6">
          <Button onClick={() => navigate('/agents/interview-prep')}>
            Prepare for Interview
          </Button>
          <Button variant="outline" onClick={() => navigate('/projects')}>
            View All Projects
          </Button>
        </div>

        {/* Abbreviated Steps */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Step 1: Build</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Step 2: Deploy</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-primary" />
            <span className="font-semibold">Step 3: Win</span>
          </div>
        </div>
      </Card>
    );
  }

  return null;
};
