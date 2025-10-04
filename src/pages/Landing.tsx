import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, Shield, Zap, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground">
            Turn Experience Into
            <span className="block text-primary">Your Unfair Advantage</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
            AI-powered career intelligence platform for mid-career and executive professionals. Your strategic command center for permanent and contract opportunities.
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
              Your Experience Isn't A Liability—It's Power
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground">
              Stop letting age work against you. Strategic positioning for professionals 40+ who deserve premium opportunities.
            </p>
            <div className="grid md:grid-cols-2 gap-8 pt-8 text-left">
              <div className="bg-card p-6 rounded-lg border-2 border-destructive/20">
                <h3 className="text-2xl font-semibold mb-4 text-destructive">❌ Traditional Approach</h3>
                <ul className="space-y-3 text-lg text-muted-foreground">
                  <li>• Age discrimination limits opportunities</li>
                  <li>• Scattered job search across platforms</li>
                  <li>• Generic applications get ignored</li>
                  <li>• No strategic career positioning</li>
                  <li>• Undervalued experience and skills</li>
                </ul>
              </div>
              <div className="bg-card p-6 rounded-lg border-2 border-primary/20">
                <h3 className="text-2xl font-semibold mb-4 text-primary">✓ With CareerIQ</h3>
                <ul className="space-y-3 text-lg text-muted-foreground">
                  <li>• AI-powered strategic positioning</li>
                  <li>• Contract pathways bypass age bias</li>
                  <li>• Executive-level career intelligence</li>
                  <li>• Concierge service with command center control</li>
                  <li>• Turn 40+ experience into premium value</li>
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
              Your Career Intelligence Command Center
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold">Strategic Intelligence</h3>
                <p className="text-lg text-muted-foreground">
                  AI analyzes your experience and positions you for premium permanent roles and strategic contract opportunities that value seasoned professionals.
                </p>
              </div>
              
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold">Command Center</h3>
                <p className="text-lg text-muted-foreground">
                  Manage your entire career strategy from one dashboard. Track applications, prepare for interviews, and maintain your professional network with precision.
                </p>
              </div>
              
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold">Concierge Service</h3>
                <p className="text-lg text-muted-foreground">
                  Premium tiers include dedicated support, direct C-suite outreach, and white-glove career transitions designed for executives and senior professionals.
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
                <h3 className="text-2xl font-bold mb-4">Career Command</h3>
                <div className="mb-6">
                  <span className="text-5xl font-bold">$49</span>
                  <span className="text-xl text-muted-foreground">/month</span>
                </div>
                <p className="text-lg text-muted-foreground mb-6">
                  For professionals actively seeking permanent or contract roles
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
                <h3 className="text-2xl font-bold mb-4">Always Ready</h3>
                <div className="mb-6">
                  <span className="text-5xl font-bold">$29</span>
                  <span className="text-xl opacity-90">/month</span>
                </div>
                <p className="text-lg opacity-90 mb-6">
                  Stay market-ready while employed with passive opportunity monitoring
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
                <h3 className="text-2xl font-bold mb-4">Concierge Elite</h3>
                <div className="mb-6">
                  <span className="text-5xl font-bold">$99</span>
                  <span className="text-xl text-muted-foreground">/month</span>
                </div>
                <p className="text-lg text-muted-foreground mb-6">
                  White-glove service for C-suite and senior executives
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
              Ready to Turn Experience Into Your Career Advantage?
            </h2>
            <p className="text-xl md:text-2xl opacity-90">
              Join mid-career and executive professionals who've stopped letting age limit their opportunities.
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

      {/* Footer */}
      <footer className="bg-card border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <h3 className="text-xl font-bold">CareerIQ</h3>
              <p className="text-muted-foreground">
                Career intelligence platform for mid-career and executive professionals who refuse to be undervalued.
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Product</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <button onClick={() => navigate('/pricing')} className="hover:text-foreground transition-colors">
                    Pricing
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/auth')} className="hover:text-foreground transition-colors">
                    Sign Up
                  </button>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Resources</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <button className="hover:text-foreground transition-colors">
                    Help Center
                  </button>
                </li>
                <li>
                  <button className="hover:text-foreground transition-colors">
                    Documentation
                  </button>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Legal</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <button className="hover:text-foreground transition-colors">
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button className="hover:text-foreground transition-colors">
                    Terms of Service
                  </button>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-muted-foreground">
            <p>&copy; 2025 CareerIQ. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
