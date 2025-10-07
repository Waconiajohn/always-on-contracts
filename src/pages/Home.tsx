import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { Brain, FileText, Target, BookOpen, Users, Briefcase, Crown, Package, ArrowRight, Zap, TrendingUp, DollarSign, Network, MessageSquare, Calendar, Rocket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { Badge } from "@/components/ui/badge";

const HomeContent = () => {
  const navigate = useNavigate();
  const [vaultComplete, setVaultComplete] = useState(false);
  const [vaultCompletion, setVaultCompletion] = useState(0);
  const [activeOpportunities, setActiveOpportunities] = useState(0);
  const { subscription } = useSubscription();

  useEffect(() => {
    checkVaultStatus();
    loadActiveOpportunities();
  }, []);

  const checkVaultStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: vault } = await supabase
        .from('career_vault')
        .select('interview_completion_percentage')
        .eq('user_id', user.id)
        .maybeSingle();

      if (vault) {
        const completion = vault.interview_completion_percentage || 0;
        setVaultCompletion(completion);
        setVaultComplete(completion === 100);
      }
      
      // Check for saved interview responses
      const { count } = await supabase
        .from('vault_interview_responses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      console.log('[HOME] Saved responses:', count);
    } catch (error) {
      console.error('Error checking Career Vault status:', error);
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

  const processSteps = [
    {
      icon: Package,
      title: "Build",
      description: "Complete your Career Vault—extract every skill, story, and achievement from your career",
      color: "text-primary"
    },
    {
      icon: Rocket,
      title: "Deploy",
      description: "AI agents craft perfect applications, find hidden opportunities, and automate your search",
      color: "text-purple-500"
    },
    {
      icon: TrendingUp,
      title: "Dominate",
      description: "Land interviews faster with AI-powered prep, negotiation intel, and market insights",
      color: "text-green-500"
    }
  ];

  const quickLinks = {
    activeJobSearch: [
      {
        icon: Brain,
        title: "AI Agent Hub",
        description: "Job search, resume builder, interview prep agents",
        path: "/ai-agents",
        locked: !vaultComplete
      },
      {
        icon: Target,
        title: "Job Board",
        description: "Find opportunities with AI-powered matching",
        path: "/agents/job-search",
        locked: !vaultComplete
      },
      {
        icon: FileText,
        title: "Active Projects",
        description: "Track applications and interviews",
        path: "/projects",
        locked: !vaultComplete
      }
    ],
    careerResources: [
      {
        icon: BookOpen,
        title: "Learning Center",
        description: "Guides, templates, and career resources",
        path: "/learn",
        locked: false
      },
      {
        icon: Calendar,
        title: "Live Training",
        description: "Join webinars and coaching sessions",
        path: "/coaching",
        locked: !vaultComplete
      },
      {
        icon: MessageSquare,
        title: "Templates",
        description: "Email templates and outreach scripts",
        path: "/templates",
        locked: false
      }
    ],
    advancedTools: [
      {
        icon: DollarSign,
        title: "Rate Calculator",
        description: "Calculate your market value",
        path: "/rate-calculator",
        locked: false
      },
      {
        icon: Network,
        title: "Agency Matcher",
        description: "Connect with top recruiters",
        path: "/agencies",
        locked: !vaultComplete
      },
      {
        icon: Users,
        title: "Networking Hub",
        description: "Build and manage professional connections",
        path: "/outreach",
        locked: !vaultComplete
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        
        {/* Section 1: Career Vault Hero Status */}
        <Card className="mb-12 border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-background to-purple-500/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-3xl flex items-center gap-3">
                  <Package className="h-8 w-8 text-primary" />
                  Your Career Intelligence Status
                </CardTitle>
                <CardDescription className="text-base">
                  {vaultComplete 
                    ? "Your Career Vault is fully loaded—all AI agents and tools are unlocked" 
                    : "Complete your Career Vault to unlock the full power of CareerIQ"}
                </CardDescription>
              </div>
              <Badge variant={vaultComplete ? "default" : "secondary"} className="h-8 px-4 text-lg">
                {vaultCompletion}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Career Vault Completion</span>
                <span className="font-semibold">{vaultCompletion}% Complete</span>
              </div>
              <Progress value={vaultCompletion} className="h-3" />
            </div>
            
            <div className="flex gap-4">
              <Button 
                size="lg" 
                className="flex-1"
                onClick={() => navigate(vaultComplete ? "/career-vault" : "/career-vault/onboarding")}
              >
                {vaultComplete ? "View Career Vault" : "Continue Career Vault"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              {!vaultComplete && (
                <Button size="lg" variant="outline" onClick={() => navigate("/learn")}>
                  Learn More
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Section 2: The CareerIQ Process */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">The CareerIQ Process</h2>
            <p className="text-muted-foreground text-lg">
              Three steps to transform your career search from reactive to strategic
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {processSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <Card key={index} className="relative overflow-hidden group hover:shadow-lg transition-all">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full" />
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className={`p-3 rounded-lg bg-muted ${step.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl font-bold text-muted-foreground">0{index + 1}</span>
                          <CardTitle className="text-xl">{step.title}</CardTitle>
                        </div>
                        <CardDescription className="text-base leading-relaxed">
                          {step.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Section 3: Quick Links by Career Stage */}
        <div className="mb-12 space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2">Your Arsenal</h2>
            <p className="text-muted-foreground text-lg">
              Access the right tools for your career stage
            </p>
          </div>

          {/* Active Job Search */}
          <div>
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Active Job Search
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              {quickLinks.activeJobSearch.map((link, index) => {
                const Icon = link.icon;
                return (
                  <Card 
                    key={index}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      link.locked ? 'opacity-60' : 'hover:border-primary/50'
                    }`}
                    onClick={() => !link.locked && navigate(link.path)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-primary" />
                        <CardTitle className="text-base">{link.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <CardDescription>{link.description}</CardDescription>
                      {link.locked && (
                        <Badge variant="secondary" className="mt-2 text-xs">
                          Complete Career Vault
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Career Resources */}
          <div>
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Career Resources
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              {quickLinks.careerResources.map((link, index) => {
                const Icon = link.icon;
                return (
                  <Card 
                    key={index}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      link.locked ? 'opacity-60' : 'hover:border-primary/50'
                    }`}
                    onClick={() => !link.locked && navigate(link.path)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-primary" />
                        <CardTitle className="text-base">{link.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <CardDescription>{link.description}</CardDescription>
                      {link.locked && (
                        <Badge variant="secondary" className="mt-2 text-xs">
                          Complete Career Vault
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Advanced Tools */}
          <div>
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Advanced Tools
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              {quickLinks.advancedTools.map((link, index) => {
                const Icon = link.icon;
                return (
                  <Card 
                    key={index}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      link.locked ? 'opacity-60' : 'hover:border-primary/50'
                    }`}
                    onClick={() => !link.locked && navigate(link.path)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-primary" />
                        <CardTitle className="text-base">{link.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <CardDescription>{link.description}</CardDescription>
                      {link.locked && (
                        <Badge variant="secondary" className="mt-2 text-xs">
                          Complete Career Vault
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* Section 4: Stats Snapshot */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Active Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-2">{activeOpportunities}</div>
              <p className="text-muted-foreground mb-4">Jobs you're tracking and applying to</p>
              <Button variant="outline" onClick={() => navigate('/opportunities')} className="w-full">
                View Opportunities
              </Button>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                Subscription
              </CardTitle>
            </CardHeader>
            <CardContent>
              {subscription?.subscribed ? (
                <>
                  <div className="text-2xl font-bold mb-2">
                    {subscription.is_retirement_client ? "Lifetime Access" :
                     subscription.tier === 'career_starter' ? "Career Starter" :
                     subscription.tier === 'always_ready' ? "Always Ready" :
                     subscription.tier === 'concierge_elite' ? "Concierge Elite" : "Active"}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {subscription.is_retirement_client ? "Unlimited access forever" :
                     subscription.subscription_end ? 
                     `Renews ${new Date(subscription.subscription_end).toLocaleDateString()}` :
                     "Your subscription is active"}
                  </p>
                  <Button variant="outline" onClick={() => navigate('/profile')} className="w-full">
                    Manage Plan
                  </Button>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold mb-2">Free Tier</div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upgrade for unlimited AI access & premium features
                  </p>
                  <Button onClick={() => navigate('/pricing')} className="w-full">
                    View Plans
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
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
