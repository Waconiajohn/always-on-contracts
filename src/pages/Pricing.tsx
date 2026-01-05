import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Sparkles, Crown, Rocket, ArrowLeft, FileText, Package, Linkedin, MessageSquare, Zap } from "lucide-react";
import { toast } from "sonner";
import { type ModuleId } from "@/config/modules";

const MODULES = [
  {
    id: "resume_jobs_studio" as ModuleId,
    name: "Resume & Jobs Studio",
    price: "$19",
    icon: FileText,
    description: "Build resumes, find jobs, track applications",
    features: [
      "AI Resume Builder",
      "Job Search Engine",
      "Boolean Search Builder",
      "Application Tracking",
      "Resume Templates",
      "ATS Optimization"
    ],
    color: "from-blue-500/20 to-blue-600/5"
  },
  {
    id: "career_vault" as ModuleId,
    name: "Career Vault",
    price: "$19",
    icon: Package,
    description: "Your long-term career intelligence hub",
    features: [
      "AI Career Intelligence",
      "Executive Coaching Agents",
      "STAR Story Builder",
      "WhyMe Narratives",
      "Skills & Competencies",
      "Power Phrases Library"
    ],
    color: "from-purple-500/20 to-purple-600/5"
  },
  {
    id: "linkedin_pro" as ModuleId,
    name: "LinkedIn Pro",
    price: "$19",
    icon: Linkedin,
    description: "Complete LinkedIn presence & networking",
    features: [
      "Profile Optimizer",
      "Recruiter Search Simulator",
      "Networking Message Generator",
      "Content Blogging Agent",
      "Series Planner",
      "Human Writing Analyzer"
    ],
    color: "from-sky-500/20 to-sky-600/5"
  },
  {
    id: "interview_mastery" as ModuleId,
    name: "Interview Mastery",
    price: "$19",
    icon: MessageSquare,
    description: "Interview prep, practice, and follow-up",
    features: [
      "AI Question Practice",
      "STAR Story Generator",
      "Elevator Pitch Builder",
      "Company Research",
      "30-60-90 Day Plans",
      "Salary Negotiation"
    ],
    color: "from-emerald-500/20 to-emerald-600/5"
  }
];

const BUNDLES = [
  {
    id: "free",
    name: "Free Forever",
    price: "$0",
    icon: Zap,
    description: "Get started with Quick Score",
    modules: ["Quick Score (always free)"],
    features: [
      "Upload resume",
      "ATS score check",
      "Basic skills analysis",
      "❌ Can't download resumes",
      "❌ Limited features"
    ],
    highlighted: false
  },
  {
    id: "career_starter",
    name: "Career Starter",
    price: "$29",
    icon: Rocket,
    description: "Resume & Career Vault bundle",
    modules: ["Resume & Jobs Studio", "Career Vault"],
    features: [
      "Everything in Free",
      "Full Resume Builder",
      "Job Search Engine",
      "Career Vault (100% power)",
      "STAR Stories & Coaching"
    ],
    savings: "Save $9/mo",
    highlighted: true
  },
  {
    id: "always_ready",
    name: "Always Ready",
    price: "$49",
    icon: Sparkles,
    description: "All 4 modules unlocked",
    modules: ["All Modules Included"],
    features: [
      "Resume & Jobs Studio",
      "Career Vault",
      "LinkedIn Pro",
      "Interview Mastery",
      "Priority Support"
    ],
    savings: "Save $27/mo",
    highlighted: false
  },
  {
    id: "concierge_elite",
    name: "Concierge Elite",
    price: "$99",
    icon: Crown,
    description: "White-glove career management",
    modules: ["All Modules + Premium"],
    features: [
      "Everything in Always Ready",
      "🤖 AI Job Matching Engine",
      "Automatic job discovery",
      "Unlimited AI agents",
      "24/7 premium support"
    ],
    highlighted: false
  }
];

export default function Pricing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [referralCode, setReferralCode] = useState("");

  const handleSubscribe = async (tierId: string, isModule: boolean = false) => {
    try {
      setLoading(tierId);

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Please sign in to subscribe");
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          tier: tierId,
          isModule,
          promoCode: promoCode || undefined,
          referralCode: referralCode || undefined
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      toast.error(error.message || "Failed to start checkout");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <Button variant="ghost" size="lg" onClick={() => navigate('/')}>
            <ArrowLeft className="mr-2 h-6 w-6" />
            Back to Home
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Choose Your Career Success Path</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Buy individual modules or save with bundles
            </p>
          </div>

          {/* Promo/Referral Code Input */}
          <div className="max-w-md mx-auto mb-8 space-y-3">
            <Input
              placeholder="Promo code (optional)"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              className="text-center"
            />
            <Input
              placeholder="Referral code (optional)"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              className="text-center"
            />
          </div>

          <Tabs defaultValue="bundles" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
              <TabsTrigger value="bundles">Bundles (Best Value)</TabsTrigger>
              <TabsTrigger value="modules">Individual Modules</TabsTrigger>
            </TabsList>

            <TabsContent value="bundles">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {BUNDLES.map((bundle) => {
                  const Icon = bundle.icon;
                  return (
                    <Card 
                      key={bundle.id} 
                      className={`relative flex flex-col ${bundle.highlighted ? 'border-primary shadow-lg ring-2 ring-primary/20' : ''}`}
                    >
                      {bundle.highlighted && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <Badge className="bg-primary">Most Popular</Badge>
                        </div>
                      )}
                      {bundle.savings && (
                        <div className="absolute -top-3 right-4">
                          <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            {bundle.savings}
                          </Badge>
                        </div>
                      )}
                      
                      <CardHeader>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <CardTitle className="text-lg">{bundle.name}</CardTitle>
                        </div>
                        <CardDescription>{bundle.description}</CardDescription>
                        <div className="mt-4">
                          <span className="text-3xl font-bold">{bundle.price}</span>
                          <span className="text-muted-foreground">/month</span>
                        </div>
                      </CardHeader>

                      <CardContent className="flex-1">
                        <div className="mb-4">
                          <p className="text-xs font-medium text-muted-foreground mb-2">INCLUDES:</p>
                          <div className="flex flex-wrap gap-1">
                            {bundle.modules.map((mod, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {mod}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <ul className="space-y-2">
                          {bundle.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                              <span className="text-sm">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>

                      <CardFooter>
                        <Button
                          className="w-full"
                          onClick={() => bundle.id === 'free' ? navigate('/auth') : handleSubscribe(bundle.id)}
                          disabled={loading === bundle.id}
                          variant={bundle.highlighted ? "default" : "outline"}
                        >
                          {bundle.id === 'free' ? "Get Started Free" : loading === bundle.id ? "Loading..." : "Subscribe Now"}
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="modules">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {MODULES.map((module) => {
                  const Icon = module.icon;
                  return (
                    <Card 
                      key={module.id} 
                      className={`relative flex flex-col overflow-hidden`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${module.color} pointer-events-none`} />
                      
                      <CardHeader className="relative">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 rounded-lg bg-background/80 backdrop-blur">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <CardTitle className="text-lg">{module.name}</CardTitle>
                        </div>
                        <CardDescription>{module.description}</CardDescription>
                        <div className="mt-4">
                          <span className="text-3xl font-bold">{module.price}</span>
                          <span className="text-muted-foreground">/month</span>
                        </div>
                      </CardHeader>

                      <CardContent className="flex-1 relative">
                        <ul className="space-y-2">
                          {module.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                              <span className="text-sm">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>

                      <CardFooter className="relative">
                        <Button
                          className="w-full"
                          onClick={() => handleSubscribe(module.id, true)}
                          disabled={loading === module.id}
                          variant="outline"
                        >
                          {loading === module.id ? "Loading..." : "Buy Module"}
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>

              <div className="mt-8 text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Want multiple modules? Our bundles offer better value!
                </p>
                <Button variant="link" onClick={() => {
                  const tabsList = document.querySelector('[role="tablist"]');
                  const bundlesTab = tabsList?.querySelector('[value="bundles"]') as HTMLButtonElement;
                  bundlesTab?.click();
                }}>
                  View Bundles →
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {/* Quick Score - Always Free */}
          <div className="mt-12 text-center">
            <Card className="max-w-lg mx-auto bg-gradient-to-r from-amber-500/10 to-orange-500/5 border-amber-500/20">
              <CardHeader>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Zap className="h-5 w-5 text-amber-500" />
                  <CardTitle>Quick Score is Always Free</CardTitle>
                </div>
                <CardDescription>
                  Upload your resume and get an instant ATS score, skills analysis, and improvement suggestions - no account required.
                </CardDescription>
              </CardHeader>
              <CardFooter className="justify-center">
                <Button onClick={() => navigate("/quick-score")} variant="outline">
                  Try Quick Score Free
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Affiliate CTA */}
          <div className="mt-12 text-center">
            <Card className="max-w-2xl mx-auto bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle>Become an Affiliate Partner</CardTitle>
                <CardDescription>
                  Earn 30% recurring commission for every referral
                </CardDescription>
              </CardHeader>
              <CardFooter className="justify-center">
                <Button 
                  onClick={() => navigate("/affiliate-portal")}
                  variant="outline"
                >
                  Join Affiliate Program
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Retirement Client CTA */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Retirement planning client?{" "}
              <Button 
                variant="link" 
                className="p-0 h-auto"
                onClick={() => navigate("/redeem-code")}
              >
                Redeem your access code
              </Button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}