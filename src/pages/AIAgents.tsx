import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Search, FileText, Network, Linkedin, MessageSquare, GraduationCap, TrendingUp, DollarSign, Target, Briefcase, CheckCircle2 } from "lucide-react";

const aiAgents = [
  {
    id: 1,
    name: "Job Search Agent",
    icon: Search,
    status: "active",
    description: "Sophisticated job scraper across LinkedIn and premium job boards with intelligent filtering"
  },
  {
    id: 2,
    name: "Resume Rewriter",
    icon: FileText,
    status: "active",
    description: "AI-powered resume optimization with persona guidance and hiring manager insights"
  },
  {
    id: 3,
    name: "Job Description Analyzer",
    icon: Target,
    status: "active",
    description: "Decodes poorly written JDs and identifies standardized profession/industry requirements"
  },
  {
    id: 4,
    name: "Auto-Apply Agent (MCP)",
    icon: CheckCircle2,
    status: "active",
    description: "Automated job application submission with smart form-filling capabilities"
  },
  {
    id: 5,
    name: "LinkedIn Profile Builder",
    icon: Linkedin,
    status: "active",
    description: "Comprehensive profile optimization with industry-specific keywords and storytelling"
  },
  {
    id: 6,
    name: "Networking Agent",
    icon: Network,
    status: "active",
    description: "Strategic networking guidance and resume referral pathways"
  },
  {
    id: 7,
    name: "LinkedIn Blogging Agent",
    icon: MessageSquare,
    status: "active",
    description: "AI-powered content creation for thought leadership and visibility"
  },
  {
    id: 8,
    name: "Interview Prep Master",
    icon: GraduationCap,
    status: "active",
    description: "Practice interviews with surprise questions from real interview databases"
  },
  {
    id: 9,
    name: "Career Trends Scout",
    icon: TrendingUp,
    status: "active",
    description: "Aggregates cutting-edge career advice from social media and coaching sources"
  },
  {
    id: 10,
    name: "Financial Planning Assistant",
    icon: DollarSign,
    status: "active",
    description: "Retirement and financial planning guidance tailored to your career trajectory"
  },
  {
    id: 11,
    name: "Executive Coaching",
    icon: Bot,
    status: "active",
    description: "Three specialized AI personas for strategic career guidance"
  },
  {
    id: 12,
    name: "Contract Opportunities",
    icon: Briefcase,
    status: "active",
    description: "Specialized agent for contract and interim executive positions"
  }
];

export default function AIAgents() {
  const activeAgents = aiAgents.filter(a => a.status === "active");
  const comingSoon = aiAgents.filter(a => a.status === "coming-soon");

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      <div className="container py-8 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">AI Agent Ecosystem</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your comprehensive AI-powered career assistant with 12 specialized agents
          </p>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-primary" />
              Active Agents ({activeAgents.length})
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeAgents.map((agent) => (
                <Card key={agent.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <agent.icon className="h-8 w-8 text-primary" />
                      <Badge variant="default">Active</Badge>
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
