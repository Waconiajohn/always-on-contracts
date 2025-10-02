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
            Smart Contract Job Search
            <span className="block text-primary">Made Simple</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
            AI-powered tools to help you find and manage contract opportunities faster.
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
              Finding Contract Work Takes Too Long
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground">
              Stop wasting time on manual job searches and application tracking.
            </p>
            <div className="grid md:grid-cols-2 gap-8 pt-8 text-left">
              <div className="bg-card p-6 rounded-lg border-2 border-destructive/20">
                <h3 className="text-2xl font-semibold mb-4 text-destructive">❌ Manual Search</h3>
                <ul className="space-y-3 text-lg text-muted-foreground">
                  <li>• Hours spent browsing job boards</li>
                  <li>• Forgetting to follow up with recruiters</li>
                  <li>• Losing track of applications</li>
                  <li>• Manually customizing each resume</li>
                  <li>• Unclear what your rate should be</li>
                </ul>
              </div>
              <div className="bg-card p-6 rounded-lg border-2 border-primary/20">
                <h3 className="text-2xl font-semibold mb-4 text-primary">✓ With ContractCareer Pro</h3>
                <ul className="space-y-3 text-lg text-muted-foreground">
                  <li>• AI matches jobs to your profile</li>
                  <li>• Track recruiter conversations in one place</li>
                  <li>• Manage your application pipeline</li>
                  <li>• Get resume customization suggestions</li>
                  <li>• Calculate fair market rates instantly</li>
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
              Everything You Need to Manage Your Contract Career
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold">AI-Powered Matching</h3>
                <p className="text-lg text-muted-foreground">
                  Upload your resume and get AI-powered job matches based on your skills, experience, and preferences.
                </p>
              </div>
              
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold">Application Queue</h3>
                <p className="text-lg text-muted-foreground">
                  Review matched opportunities, get resume customization suggestions, and track your applications in one place.
                </p>
              </div>
              
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold">Recruiter Network</h3>
                <p className="text-lg text-muted-foreground">
                  Access 200+ staffing agencies, track your outreach, and use templates to streamline communication.
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
              Ready to Simplify Your Contract Job Search?
            </h2>
            <p className="text-xl md:text-2xl opacity-90">
              Get started in minutes and find your next contract opportunity faster.
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
              <h3 className="text-xl font-bold">ContractCareer Pro</h3>
              <p className="text-muted-foreground">
                Smart tools to help contract professionals find their next opportunity.
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
            <p>&copy; 2025 ContractCareer Pro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
