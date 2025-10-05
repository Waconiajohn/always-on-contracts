import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Brain, FileText, Target, BookOpen, Users, Gift, AlertCircle, CheckCircle, Package, Lock, Crown, Briefcase } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { Badge } from "@/components/ui/badge";

const HomeContent = () => {
  const navigate = useNavigate();
  const [warChestComplete, setWarChestComplete] = useState(false);
  const [warChestCompletion, setWarChestCompletion] = useState(0);
  const [activeOpportunities, setActiveOpportunities] = useState(0);
  const { subscription } = useSubscription();

  useEffect(() => {
    checkWarChestStatus();
    loadActiveOpportunities();
  }, []);

  const checkWarChestStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('career_war_chest')
        .select('interview_completion_percentage')
        .eq('user_id', user.id)
        .single();

      if (data) {
        const completion = data.interview_completion_percentage || 0;
        setWarChestCompletion(completion);
        setWarChestComplete(completion === 100);
      }
    } catch (error) {
      console.error('Error checking War Chest status:', error);
    }
  };

  const loadActiveOpportunities = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count } = await supabase
        .from('opportunity_matches')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('status', ['new', 'viewed', 'applied']);

      setActiveOpportunities(count || 0);
    } catch (error) {
      console.error('Error loading opportunities:', error);
    }
  };

  const features = [
    {
      icon: Package,
      title: "War Chest",
      description: warChestComplete ? "Your career intelligence foundation is complete" : "Build your career intelligence foundation",
      action: () => navigate(warChestComplete ? "/war-chest" : "/war-chest/onboarding"),
      color: "text-primary",
      locked: false,
      isPrimary: true
    },
    {
      icon: Brain,
      title: "AI Agent Hub",
      description: "Work with specialized AI agents for job search, resume building, and interview prep",
      action: () => navigate("/ai-agents"),
      color: "text-purple-500",
      locked: !warChestComplete
    },
    {
      icon: FileText,
      title: "Active Projects",
      description: "Manage your job applications in one organized workspace",
      action: () => navigate("/projects"),
      color: "text-blue-500",
      locked: !warChestComplete
    },
    {
      icon: Target,
      title: "Job Search",
      description: "Find and track opportunities that match your skills",
      action: () => navigate("/job-search"),
      color: "text-green-500",
      locked: !warChestComplete
    },
    {
      icon: BookOpen,
      title: "Learning Center",
      description: "Access guides, tutorials, and templates to boost your career",
      action: () => navigate("/learn"),
      color: "text-orange-500",
      locked: false
    },
    {
      icon: Users,
      title: "Coaching & Webinars",
      description: "Join live sessions and get personalized career coaching",
      action: () => navigate("/coaching"),
      color: "text-pink-500",
      locked: !warChestComplete
    },
    {
      icon: Gift,
      title: "Referral Program",
      description: "Recommend friends and earn rewards",
      action: () => navigate("/referrals"),
      color: "text-yellow-500",
      locked: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-12">
        {/* War Chest Status Banner */}
        {!warChestComplete && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Complete your War Chest to unlock all features ({warChestCompletion}% done)</span>
              <Button size="sm" onClick={() => navigate('/war-chest/onboarding')}>
                Continue Setup
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        {/* Hero Section */}
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Welcome to CareerIQ
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your career intelligence command center—turn experience into your unfair advantage
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isLocked = feature.locked;
            return (
              <Card 
                key={index}
                className={`hover:shadow-lg transition-all duration-300 cursor-pointer border-2 ${
                  feature.isPrimary 
                    ? 'border-primary/50 bg-primary/5' 
                    : isLocked 
                    ? 'border-muted opacity-60' 
                    : 'hover:border-primary/50'
                }`}
                onClick={feature.action}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-muted ${feature.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="flex items-center gap-2">
                      {feature.title}
                      {isLocked && <Lock className="h-4 w-4 text-muted-foreground" />}
                      {feature.isPrimary && !warChestComplete && (
                        <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded-full">
                          {warChestCompletion}%
                        </span>
                      )}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                  {isLocked && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Complete War Chest to unlock
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Status Overview */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Active Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-2">{activeOpportunities}</div>
              <p className="text-muted-foreground mb-4">Opportunities being tracked</p>
              <Button variant="outline" onClick={() => navigate('/opportunities')}>
                View All Opportunities
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                Subscription Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {subscription?.subscribed ? (
                <>
                  <div className="text-2xl font-bold mb-2 flex items-center gap-2">
                    {subscription.is_retirement_client ? "Lifetime" :
                     subscription.tier === 'career_starter' ? "Career Starter" :
                     subscription.tier === 'always_ready' ? "Always Ready" :
                     subscription.tier === 'concierge_elite' ? "Concierge Elite" : "Active"}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {subscription.is_retirement_client ? "You have lifetime access" :
                     subscription.subscription_end ? 
                     `Renews ${new Date(subscription.subscription_end).toLocaleDateString()}` :
                     "Active subscription"}
                  </p>
                  <Button variant="outline" onClick={() => navigate('/profile')}>
                    Manage Subscription
                  </Button>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold mb-2">Free Tier</div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upgrade to unlock premium features
                  </p>
                  <Button onClick={() => navigate('/pricing')}>
                    View Plans
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">Ready to get started?</h2>
          <div className="flex justify-center gap-4">
            <Button 
              size="lg" 
              onClick={() => navigate(warChestComplete ? "/projects" : "/war-chest/onboarding")}
            >
              {warChestComplete ? "View My Projects" : "Build War Chest"}
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
