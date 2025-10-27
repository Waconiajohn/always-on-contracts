import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Check, Sparkles, Crown, Rocket, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const TIERS = [
  {
    id: "free",
    name: "Free Forever",
    price: "$0",
    icon: Rocket,
    description: "Build your foundation",
    features: [
      "Upload resume",
      "AI career intelligence extraction",
      "Career Vault (40% power)",
      "Browse job opportunities",
      "❌ Can't download resumes",
      "❌ Can't apply to jobs",
      "❌ Limited AI features"
    ],
    highlighted: false
  },
  {
    id: "career_starter",
    name: "Career Starter",
    price: "$29",
    icon: Rocket,
    description: "Full career intelligence",
    features: [
      "Everything in Free",
      "Download unlimited resumes",
      "Apply to jobs",
      "Full Career Vault (100% power - optional)",
      "Resume Builder AI",
      "LinkedIn Optimizer",
      "Interview Prep Agent",
      "Networking Tools"
    ],
    highlighted: true
  },
  {
    id: "always_ready",
    name: "Always Ready",
    price: "$49",
    icon: Sparkles,
    description: "Stay interview-ready with comprehensive tools",
    features: [
      "Everything in Career Starter",
      "Automated applications (up to 5/day)",
      "Executive coaching AI agents",
      "Advanced market intelligence",
      "Interview prep assistant",
      "Priority support"
    ],
    highlighted: false
  },
  {
    id: "concierge_elite",
    name: "Concierge Elite",
    price: "$99",
    icon: Crown,
    description: "White-glove career management",
    features: [
      "Everything in Always Ready",
      "🤖 AI Job Matching Engine",
      "Automatic job discovery & recommendations",
      "Personalized match scoring with AI insights",
      "Unlimited AI agents",
      "Dedicated career strategist",
      "Custom automation workflows",
      "Retirement planning integration",
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

  const handleSubscribe = async (tierId: string) => {
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
              Unlock your executive potential with AI-powered career tools
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

          <div className="grid md:grid-cols-3 gap-8">
            {TIERS.map((tier) => {
              const Icon = tier.icon;
              return (
                <Card 
                  key={tier.id} 
                  className={`relative ${tier.highlighted ? 'border-primary shadow-lg scale-105' : ''}`}
                >
                  {tier.highlighted && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary">Most Popular</Badge>
                    </div>
                  )}
                  
                  <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                      <Icon className="h-8 w-8 text-primary" />
                      {tier.highlighted && <Sparkles className="h-5 w-5 text-primary" />}
                    </div>
                    <CardTitle className="text-2xl">{tier.name}</CardTitle>
                    <CardDescription>{tier.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">{tier.price}</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <ul className="space-y-3">
                      {tier.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter>
                    <Button
                      className="w-full"
                      onClick={() => tier.id === 'free' ? navigate('/auth') : handleSubscribe(tier.id)}
                      disabled={loading === tier.id}
                      variant={tier.highlighted ? "default" : "outline"}
                    >
                      {tier.id === 'free' ? "Get Started Free" : loading === tier.id ? "Loading..." : "Subscribe Now"}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          {/* Affiliate CTA */}
          <div className="mt-16 text-center">
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