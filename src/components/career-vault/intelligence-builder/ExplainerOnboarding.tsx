import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, TrendingUp, Target, Zap } from "lucide-react";

interface ExplainerOnboardingProps {
  onStart: () => void;
}

const BENEFITS = [
  {
    icon: TrendingUp,
    title: "82% Higher Response Rate",
    description: "Our users get 3x more interview callbacks than industry average"
  },
  {
    icon: Target,
    title: "Know Exactly What's Missing",
    description: "We analyze 10+ live job postings to show you the gaps holding you back"
  },
  {
    icon: Zap,
    title: "AI-Powered Evidence Builder",
    description: "Turn vague experience into quantified, market-ready achievements"
  }
];

const PROCESS_STEPS = [
  {
    phase: "Phase 1",
    title: "Upload & Analyze",
    description: "We extract your experience and research what companies actually want",
    time: "~3 min"
  },
  {
    phase: "Phase 2",
    title: "Map Your Story",
    description: "Organize your work history with AI-enhanced bullets",
    time: "~5 min"
  },
  {
    phase: "Phase 3",
    title: "Reveal Gaps",
    description: "See exactly what you're missing vs. market expectations",
    time: "~2 min"
  },
  {
    phase: "Phase 4",
    title: "Fill Gaps",
    description: "Answer smart questions that build missing evidence",
    time: "~15 min"
  },
  {
    phase: "Phase 5",
    title: "Your Vault",
    description: "Access your organized library to generate tailored resumes instantly",
    time: "Ongoing"
  }
];

export const ExplainerOnboarding = ({ onStart }: ExplainerOnboardingProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <Card className="max-w-4xl w-full p-8 space-y-8 animate-fade-in">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            Build Your Career Intelligence Vault
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transform your resume into a market-ready asset library. 
            We'll analyze what companies want and help you build the evidence to match.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {BENEFITS.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <Card key={index} className="p-6 border-2 hover:border-primary/50 transition-colors">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Process Timeline */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-center mb-6">
            Here's How It Works <span className="text-muted-foreground">(~25 minutes)</span>
          </h2>
          <div className="space-y-3">
            {PROCESS_STEPS.map((step, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                    {index + 1}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-primary">{step.phase}</span>
                    <span className="text-xs text-muted-foreground">{step.time}</span>
                  </div>
                  <h3 className="font-semibold mb-1">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* What You'll Get */}
        <Card className="p-6 bg-primary/5 border-primary/20">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            What You'll Get
          </h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span><strong>Organized evidence library</strong> - All achievements linked to specific roles</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span><strong>Market fit score</strong> - Know exactly where you stand vs. expectations</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span><strong>Instant resume generation</strong> - Create tailored resumes in seconds, not hours</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span><strong>Reusable everywhere</strong> - Powers your LinkedIn, cover letters, interviews</span>
            </li>
          </ul>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <Button
            size="lg"
            onClick={onStart}
            className="px-8 py-6 text-lg hover-scale"
          >
            Start Building My Vault
            <Zap className="ml-2 h-5 w-5" />
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            No credit card required • Your data stays private
          </p>
        </div>
      </Card>
    </div>
  );
};
