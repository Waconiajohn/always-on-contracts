import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Search, FileText, Network, Linkedin, MessageSquare, GraduationCap, TrendingUp, DollarSign, Target, Briefcase, CheckCircle2, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";

const aiAgents = [
  {
    id: 1,
    name: "Job Search Agent",
    icon: Search,
    status: "active",
    description: "Sophisticated job search across premium job boards with intelligent filtering",
    requiresPaid: false
  },
  {
    id: 2,
    name: "Resume Rewriter",
    icon: FileText,
    status: "active",
    description: "AI-powered resume optimization with persona guidance and hiring manager insights",
    requiresPaid: false
  },
  {
    id: 3,
    name: "Job Description Analyzer",
    icon: Target,
    status: "active",
    description: "Decodes poorly written JDs and identifies standardized profession/industry requirements",
    requiresPaid: false
  },
  {
    id: 4,
    name: "LinkedIn Profile Builder",
    icon: Linkedin,
    status: "active",
    description: "Comprehensive profile optimization with industry-specific keywords and storytelling",
    requiresPaid: true
  },
  {
    id: 5,
    name: "Networking Agent",
    icon: Network,
    status: "active",
    description: "Strategic networking guidance and resume referral pathways",
    requiresPaid: true
  },
  {
    id: 6,
    name: "LinkedIn Blogging Agent",
    icon: MessageSquare,
    status: "active",
    description: "AI-powered content creation for thought leadership and visibility",
    requiresPaid: true
  },
  {
    id: 7,
    name: "Interview Prep Master",
    icon: GraduationCap,
    status: "active",
    description: "Practice interviews with surprise questions from real interview databases",
    requiresPaid: false
  },
  {
    id: 8,
    name: "Career Trends Scout",
    icon: TrendingUp,
    status: "active",
    description: "Aggregates cutting-edge career advice from social media and coaching sources",
    requiresPaid: true
  },
  {
    id: 9,
    name: "Financial Planning Assistant",
    icon: DollarSign,
    status: "active",
    description: "Retirement and financial planning guidance tailored to your career trajectory",
    requiresPaid: true
  },
  {
    id: 10,
    name: "Executive Coaching",
    icon: Bot,
    status: "active",
    description: "Three specialized AI personas for strategic career guidance",
    requiresPaid: true
  },
  {
    id: 11,
    name: "Job Search",
    icon: Briefcase,
    status: "active",
    description: "Live search across 50+ job boards with Boolean search and AI filtering",
    requiresPaid: true
  }
];

export default function AIAgents() {
  const navigate = useNavigate();
  const { subscription } = useSubscription();
  const activeAgents = aiAgents.filter(a => a.status === "active");
  const comingSoon = aiAgents.filter(a => a.status === "coming-soon");
  
  const isLocked = (agent: typeof aiAgents[0]) => {
    if (!agent.requiresPaid) return false;
    return !subscription?.subscribed;
  };

  const agentRoutes: Record<string, string> = {
    'Job Search Agent': '/agents/job-search',
    'Resume Rewriter': '/agents/resume-builder',
    'Job Description Analyzer': '/career-tools',
    'LinkedIn Profile Builder': '/agents/linkedin-profile',
    'Networking Agent': '/agents/networking',
    'LinkedIn Blogging Agent': '/agents/linkedin-blogging',
    'Interview Prep Master': '/agents/interview-prep',
    'Career Trends Scout': '/agents/career-trends',
    'Financial Planning Assistant': '/agents/financial-planning',
    'Executive Coaching': '/coaching',
    'Job Search': '/job-search',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      <div className="container py-8 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">AI Agent Ecosystem</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your comprehensive AI-powered career assistant with 11 specialized agents
          </p>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-primary" />
              Active Agents ({activeAgents.length})
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeAgents.map((agent) => {
                const locked = isLocked(agent);
                return (
                  <Card 
                    key={agent.id} 
                    className={`hover:shadow-lg transition-shadow ${!locked ? 'cursor-pointer' : 'opacity-60'}`}
                    onClick={() => {
                      if (locked) return;
                      const route = agentRoutes[agent.name];
                      if (route) navigate(route);
                    }}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <agent.icon className={`h-8 w-8 ${locked ? 'text-muted-foreground' : 'text-primary'}`} />
                        {locked ? (
                          <Badge variant="secondary" className="gap-1">
                            <Lock className="h-3 w-3" />
                            Upgrade
                          </Badge>
                        ) : (
                          <Badge variant="default">Active</Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg">{agent.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{agent.description}</CardDescription>
                      {locked && (
                        <Button 
                          size="sm" 
                          className="w-full mt-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/pricing');
                          }}
                        >
                          Upgrade to Access
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-accent" />
              Coming Soon ({comingSoon.length})
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {comingSoon.map((agent) => (
                <Card key={agent.id} className="hover:shadow-lg transition-shadow opacity-75">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <agent.icon className="h-8 w-8 text-muted-foreground" />
                      <Badge variant="secondary">Coming Soon</Badge>
                    </div>
                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{agent.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
