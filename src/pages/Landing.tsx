import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, Shield, Zap, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground">
            Your Contract Career,
            <span className="block text-primary">Always Running</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
            The first career management system that works <strong>while you work</strong>. 
            Never scramble between contracts again.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button 
              size="lg" 
              className="text-xl px-8 py-6 h-auto"
              onClick={() => navigate('/auth')}
            >
              Start Your Free Trial
              <ArrowRight className="ml-2 h-6 w-6" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-xl px-8 py-6 h-auto"
              onClick={() => navigate('/pricing')}
            >
              View Pricing
            </Button>
          </div>

          <div className="pt-8 flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              <span>Setup in 30 minutes</span>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="bg-muted py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">
              The Contract Career Problem
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground">
              Traditional contract work has a fatal flaw: <strong>What happens when your contract ends?</strong>
            </p>
            <div className="grid md:grid-cols-2 gap-8 pt-8 text-left">
              <div className="bg-card p-6 rounded-lg border-2 border-destructive/20">
                <h3 className="text-2xl font-semibold mb-4 text-destructive">❌ The Old Way</h3>
                <ul className="space-y-3 text-lg text-muted-foreground">
                  <li>• Contract ends → Panic begins</li>
                  <li>• Restart relationships from scratch</li>
                  <li>• 90+ day gaps between contracts</li>
                  <li>• Age bias increases with each search</li>
                  <li>• Manual follow-ups constantly needed</li>
                </ul>
              </div>
              <div className="bg-card p-6 rounded-lg border-2 border-primary/20">
                <h3 className="text-2xl font-semibold mb-4 text-primary">✓ The New Way</h3>
                <ul className="space-y-3 text-lg text-muted-foreground">
                  <li>• System works while you work</li>
                  <li>• 200+ recruiters always engaged</li>
                  <li>• &lt;30 day transitions guaranteed</li>
                  <li>• Position as premium executive</li>
                  <li>• Zero manual effort required</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
              The Always-On System
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold">Continuous Automation</h3>
                <p className="text-lg text-muted-foreground">
                  AI scans 50+ job boards daily, maintains recruiter relationships, and monitors market rates—all in the background.
                </p>
              </div>
              
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold">Anonymous Applications</h3>
                <p className="text-lg text-muted-foreground">
                  Explore opportunities discretely while employed. Your identity revealed only when there's mutual interest.
                </p>
              </div>
              
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold">60-Day Transition Prep</h3>
                <p className="text-lg text-muted-foreground">
                  AI predicts contract end dates and automatically activates full search mode 60 days before expiration.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Tiers Preview */}
      <section className="bg-muted py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto text-center space-y-12">
            <h2 className="text-4xl md:text-5xl font-bold">
              Choose Your Career Mode
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-card p-8 rounded-lg border-2">
                <h3 className="text-2xl font-bold mb-4">Active Search</h3>
                <div className="mb-6">
                  <span className="text-5xl font-bold">$49</span>
                  <span className="text-xl text-muted-foreground">/month</span>
                </div>
                <p className="text-lg text-muted-foreground mb-6">
                  For professionals actively seeking contracts
                </p>
                <Button 
                  className="w-full text-lg py-6"
                  onClick={() => navigate('/pricing')}
                >
                  Learn More
                </Button>
              </div>
              
              <div className="bg-primary text-primary-foreground p-8 rounded-lg border-2 border-primary relative overflow-hidden">
                <div className="absolute top-4 right-4 bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm font-semibold">
                  MOST POPULAR
                </div>
                <h3 className="text-2xl font-bold mb-4">Contract Autopilot</h3>
                <div className="mb-6">
                  <span className="text-5xl font-bold">$29</span>
                  <span className="text-xl opacity-90">/month</span>
                </div>
                <p className="text-lg opacity-90 mb-6">
                  For professionals currently under contract
                </p>
                <Button 
                  variant="secondary" 
                  className="w-full text-lg py-6"
                  onClick={() => navigate('/pricing')}
                >
                  Learn More
                </Button>
              </div>
              
              <div className="bg-card p-8 rounded-lg border-2">
                <h3 className="text-2xl font-bold mb-4">Executive Concierge</h3>
                <div className="mb-6">
                  <span className="text-5xl font-bold">$99</span>
                  <span className="text-xl text-muted-foreground">/month</span>
                </div>
                <p className="text-lg text-muted-foreground mb-6">
                  Premium service with human support
                </p>
                <Button 
                  variant="outline" 
                  className="w-full text-lg py-6"
                  onClick={() => navigate('/pricing')}
                >
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8 bg-primary text-primary-foreground p-12 rounded-2xl">
            <h2 className="text-4xl md:text-5xl font-bold">
              Never Experience a Contract Gap Again
            </h2>
            <p className="text-xl md:text-2xl opacity-90">
              Join thousands of professionals who've automated their contract career success.
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              className="text-xl px-8 py-6 h-auto"
              onClick={() => navigate('/auth')}
            >
              Start Your Free Trial
              <ArrowRight className="ml-2 h-6 w-6" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
