import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Pricing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
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
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Choose Your Career Mode
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Start with a free trial. Switch plans anytime as your career needs change.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Career Command Tier */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-3xl">Career Command</CardTitle>
                <CardDescription className="text-lg">
                  For professionals actively seeking permanent or contract roles
                </CardDescription>
                <div className="pt-4">
                  <span className="text-5xl font-bold">$49</span>
                  <span className="text-xl text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <Button className="w-full text-lg py-6" onClick={() => navigate('/dashboard')}>
                  Start Free Trial
                </Button>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <p className="text-lg">Full resume analysis & strategy</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <p className="text-lg">Communication templates</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <p className="text-lg">200+ staffing agency database</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <p className="text-lg">LinkedIn optimization</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <p className="text-lg">Rate calculator & negotiation tools</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <p className="text-lg">Manual application tracking</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Always Ready Tier */}
            <Card className="border-4 border-primary relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-bold">
                MOST POPULAR
              </div>
              <CardHeader className="bg-primary/5">
                <CardTitle className="text-3xl">Always Ready</CardTitle>
                <CardDescription className="text-lg">
                  Stay market-ready while employed with passive monitoring
                </CardDescription>
                <div className="pt-4">
                  <span className="text-5xl font-bold text-primary">$29</span>
                  <span className="text-xl text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <Button className="w-full text-lg py-6" onClick={() => navigate('/dashboard')}>
                  Start Free Trial
                </Button>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <p className="text-lg font-semibold">Automated relationship maintenance</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <p className="text-lg font-semibold">AI job scanning (50+ boards daily)</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <p className="text-lg font-semibold">Anonymous profile matching</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <p className="text-lg font-semibold">Market rate monitoring</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <p className="text-lg font-semibold">60-day contract-end alerts</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <p className="text-lg font-semibold">Background recruiter engagement</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Concierge Elite Tier */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-3xl">Concierge Elite</CardTitle>
                <CardDescription className="text-lg">
                  White-glove service for C-suite and senior executives
                </CardDescription>
                <div className="pt-4">
                  <span className="text-5xl font-bold">$99</span>
                  <span className="text-xl text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <Button className="w-full text-lg py-6" onClick={() => navigate('/dashboard')}>
                  Start Free Trial
                </Button>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <p className="text-lg">Everything in Autopilot</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <p className="text-lg font-semibold">Dedicated relationship manager</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <p className="text-lg font-semibold">Direct C-suite outreach campaigns</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <p className="text-lg font-semibold">Board-level networking</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <p className="text-lg font-semibold">Personal brand management</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <p className="text-lg font-semibold">White-glove transitions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* FAQ Section */}
          <Card className="bg-muted">
            <CardHeader>
              <CardTitle className="text-3xl">Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">Can I switch between plans?</h3>
                <p className="text-lg text-muted-foreground">
                  Yes! You can upgrade or downgrade anytime. When you land a role, downgrade to Always Ready. 
                  When actively seeking new opportunities, upgrade to Career Command.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">What's included in the free trial?</h3>
                <p className="text-lg text-muted-foreground">
                  You get full access to all features of your chosen plan for 14 days. No credit card required to start.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">What is the &lt;30 day transition guarantee?</h3>
                <p className="text-lg text-muted-foreground">
                  With Always Ready active, we guarantee you'll have qualified opportunities in your pipeline 
                  within 30 days of when you need them.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Is there a setup fee?</h3>
                <p className="text-lg text-muted-foreground">
                  No. There are no setup fees, hidden costs, or long-term contracts. Pay monthly and cancel anytime.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Pricing;
