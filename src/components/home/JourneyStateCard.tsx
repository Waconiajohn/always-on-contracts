import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { Target, TrendingUp, Rocket, Briefcase, Users } from "lucide-react";
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
            <Button size="lg" onClick={() => navigate('/career-vault')}>
              Start Building
            </Button>
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
        <div className="flex gap-2">
          <Button onClick={() => navigate('/career-vault')}>
            Continue Interview
          </Button>
          <Button variant="outline" onClick={() => navigate('/ai-agents')}>
            Preview Features
          </Button>
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

        <div className="flex gap-2">
          <Button onClick={() => navigate('/opportunities')}>
            Find More Jobs
          </Button>
          <Button variant="outline" onClick={() => navigate('/application-queue')}>
            View Queue
          </Button>
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

        <div className="flex gap-2">
          <Button onClick={() => navigate('/agents/interview-prep')}>
            Prepare for Interview
          </Button>
          <Button variant="outline" onClick={() => navigate('/projects')}>
            View All Projects
          </Button>
        </div>
      </Card>
    );
  }

  return null;
};
