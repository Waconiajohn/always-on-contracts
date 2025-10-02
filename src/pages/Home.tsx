import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Brain, FileText, Target, BookOpen, Users, Gift } from "lucide-react";

const HomeContent = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Brain,
      title: "AI Agent Hub",
      description: "Work with specialized AI agents for job search, resume building, and interview prep",
      action: () => navigate("/ai-agents"),
      color: "text-purple-500"
    },
    {
      icon: FileText,
      title: "Active Projects",
      description: "Manage your job applications in one organized workspace",
      action: () => navigate("/projects"),
      color: "text-blue-500"
    },
    {
      icon: Target,
      title: "Job Search",
      description: "Find and track opportunities that match your skills",
      action: () => navigate("/job-search"),
      color: "text-green-500"
    },
    {
      icon: BookOpen,
      title: "Learning Center",
      description: "Access guides, tutorials, and templates to boost your career",
      action: () => navigate("/learn"),
      color: "text-orange-500"
    },
    {
      icon: Users,
      title: "Coaching & Webinars",
      description: "Join live sessions and get personalized career coaching",
      action: () => navigate("/coaching"),
      color: "text-pink-500"
    },
    {
      icon: Gift,
      title: "Referral Program",
      description: "Recommend friends and earn rewards",
      action: () => navigate("/referrals"),
      color: "text-yellow-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Welcome to Max Job Offers
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your AI-powered career assistant that helps you land more interviews and job offers
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index}
                className="hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary/50"
                onClick={feature.action}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-muted ${feature.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">Ready to get started?</h2>
          <div className="flex justify-center gap-4">
            <Button size="lg" onClick={() => navigate("/projects")}>
              View My Projects
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/ai-agents")}>
              Meet the AI Agents
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  return (
    <ProtectedRoute>
      <HomeContent />
    </ProtectedRoute>
  );
}
