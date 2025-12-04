import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useQuickScore } from "@/hooks/useQuickScore";
import { 
  Target, 
  Search, 
  BarChart3, 
  Hammer, 
  Sparkles, 
  Trophy,
  Globe,
  Shield,
  Eye,
  TrendingUp,
  Zap,
  Building2,
  ArrowRight,
  CheckCircle2,
  Play
} from "lucide-react";

// The 6 differentiators that make us worth paying for (vs ChatGPT)
const differentiators = [
  {
    icon: Globe,
    title: "Live Market Grounding",
    description: "We fetch REAL job postings to define what 'benchmark' actually means for YOUR target role. Not generic advice—actual market requirements.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10"
  },
  {
    icon: BarChart3,
    title: "2-Layer Benchmark System",
    description: "Foundations (skills, experience) + Intelligence (leadership, strategic impact). Tailored to your career level—Entry to Executive.",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10"
  },
  {
    icon: Shield,
    title: "AI Detection Defeat",
    description: "Our humanization engine removes AI-speak while preserving your voice. Track detection risk before/after. ChatGPT can't do this.",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10"
  },
  {
    icon: Eye,
    title: "Hiring Manager Simulation",
    description: "Real HM review simulation with specific feedback. Know exactly what hiring teams will think before you submit.",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10"
  },
  {
    icon: TrendingUp,
    title: "Live Score Updates",
    description: "Watch your score climb as you edit. ATS score, JD match %, and benchmark fit—updated in real-time with every change.",
    color: "text-rose-500",
    bgColor: "bg-rose-500/10"
  },
  {
    icon: Building2,
    title: "Perplexity-Powered Research",
    description: "Deep company research, industry standards, and competitive intelligence. We know what THIS company wants, not generic advice.",
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10"
  }
];

// The 6-step Benchmark Path
const benchmarkPath = [
  {
    step: 1,
    icon: Target,
    title: "Score",
    description: "See what hiring teams actually see in 90 seconds",
    action: "/quick-score"
  },
  {
    step: 2,
    icon: Search,
    title: "Research",
    description: "AI researches company, industry, and role requirements",
    action: null
  },
  {
    step: 3,
    icon: BarChart3,
    title: "Analyze",
    description: "Gap analysis: where you are vs benchmark standard",
    action: null
  },
  {
    step: 4,
    icon: Hammer,
    title: "Build",
    description: "Section-by-section with live preview and AI assistance",
    action: null
  },
  {
    step: 5,
    icon: Sparkles,
    title: "Polish",
    description: "ATS audit, humanize, and hiring manager simulation",
    action: null
  },
  {
    step: 6,
    icon: Trophy,
    title: "Win",
    description: "Export and apply with confidence—you're the benchmark",
    action: null
  }
];

const BenchmarkHomepageContent = () => {
  const navigate = useNavigate();
  const { data: quickScore } = useQuickScore();

  const hasScore = quickScore?.overall_score !== undefined;
  const currentScore = quickScore?.overall_score || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        
        <div className="container relative mx-auto px-4 py-16 lg:py-24">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            
            {/* Trust Badge */}
            <Badge variant="outline" className="px-4 py-2 text-sm font-medium border-primary/30 bg-primary/5">
              <Sparkles className="h-4 w-4 mr-2 text-primary" />
              Elite Coaching × Intelligent Tech
            </Badge>

            {/* Main Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
              Where Elite Coaching Meets{" "}
              <span className="bg-gradient-to-r from-primary via-blue-500 to-primary bg-clip-text text-transparent">
                Intelligent Career Tech
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-foreground font-medium max-w-3xl mx-auto">
              The AI-Powered Career Engine That Makes You Impossible to Ignore
            </p>
            
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              More than resume rewrites—our platform analyzes real hiring trends, 
              simulates decision-makers, and ensures you rise to the top of the shortlist.
              <br /><br />
              <span className="text-foreground font-medium">
                Plus, continuous live coaching from real experts—because getting hired takes more than AI.
              </span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6 gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
                onClick={() => navigate('/benchmark-builder')}
              >
                <Zap className="h-5 w-5" />
                Build My Benchmark Resume
                <ArrowRight className="h-5 w-5" />
              </Button>
              
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 py-6 gap-2"
                onClick={() => navigate('/quick-score')}
              >
                <Target className="h-5 w-5" />
                {hasScore ? `My Score: ${currentScore}` : "Score My Resume Free"}
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-muted-foreground pt-6">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                No credit card required
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                We never fabricate—ever
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                100,000+ executives coached
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* What Makes Us Different - 6 Cards */}
      <section className="py-16 lg:py-24 border-b">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <Badge variant="secondary" className="px-4 py-1">
              Why Pay When ChatGPT Is Free?
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold">
              What Makes Us <span className="text-primary">Worth It</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              These are capabilities ChatGPT simply cannot match. This is the 19 years distilled.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {differentiators.map((item, index) => (
              <Card key={index} className="relative overflow-hidden hover:shadow-lg transition-all duration-300 group border-2 hover:border-primary/20">
                <div className={`absolute top-0 right-0 w-24 h-24 ${item.bgColor} rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity`} />
                <CardHeader className="relative">
                  <div className={`w-12 h-12 rounded-xl ${item.bgColor} flex items-center justify-center mb-3`}>
                    <item.icon className={`h-6 w-6 ${item.color}`} />
                  </div>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <CardDescription className="text-sm leading-relaxed">
                    {item.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* The Benchmark Path - 6 Steps */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <Badge variant="default" className="px-4 py-1">
              The Benchmark Path
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold">
              From Invisible to <span className="text-primary">Unignorable</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Six clear steps. Each one moves you closer to must-interview status.
            </p>
          </div>

          {/* Steps Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-6xl mx-auto">
            {benchmarkPath.map((item, index) => (
              <Card 
                key={index} 
                className={`relative text-center p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group
                  ${item.action ? 'hover:border-primary/50' : ''}`}
                onClick={() => item.action && navigate(item.action)}
              >
                {/* Step Number */}
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center shadow-lg">
                  {item.step}
                </div>
                
                {/* Icon */}
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  <item.icon className="h-7 w-7 text-primary" />
                </div>
                
                {/* Title */}
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                
                {/* Description */}
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {item.description}
                </p>

                {/* Action indicator */}
                {item.action && (
                  <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Badge variant="outline" className="text-xs">
                      <Play className="h-3 w-3 mr-1" />
                      Start
                    </Badge>
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Main CTA */}
          <div className="text-center mt-12">
            <Button 
              size="lg" 
              className="text-lg px-12 py-6 gap-2 shadow-lg"
              onClick={() => navigate('/benchmark-builder')}
            >
              <Sparkles className="h-5 w-5" />
              Start My Benchmark Journey
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Quick Score Card - If they have a score */}
      {hasScore && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <Card className="max-w-2xl mx-auto bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="pt-8 pb-8 text-center space-y-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 border-4 border-primary/30">
                  <span className="text-3xl font-bold text-primary">{currentScore}</span>
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold mb-2">Your Current Score</h3>
                  <p className="text-muted-foreground">
                    {currentScore >= 85 
                      ? "You're at benchmark level! Time to polish and export."
                      : currentScore >= 70 
                        ? "You're getting close. Let's close those gaps."
                        : "Room for improvement. Let's build your benchmark resume."}
                  </p>
                </div>

                <Button 
                  size="lg" 
                  onClick={() => navigate('/benchmark-builder')}
                  className="gap-2"
                >
                  Continue Building
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Final CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
        
        <div className="container relative mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <Trophy className="h-16 w-16 text-primary mx-auto" />
            
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to Become THE Benchmark?
            </h2>
            
            <p className="text-xl text-muted-foreground">
              Your career is impressive. Your resume should prove it.
              <br />
              <span className="font-medium text-foreground">Let's make hiring teams fight for you.</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="text-lg px-10 py-6 gap-2"
                onClick={() => navigate('/benchmark-builder')}
              >
                <Zap className="h-5 w-5" />
                Build My Benchmark Resume
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg px-8 py-6"
                onClick={() => navigate('/quick-score')}
              >
                Score First (Free)
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default function BenchmarkHomepage() {
  return (
    <ProtectedRoute>
      <BenchmarkHomepageContent />
    </ProtectedRoute>
  );
}
