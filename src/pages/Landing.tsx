import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useNavigate } from "react-router-dom";
import { 
  CheckCircle2,
  Star,
  Database,
  Shield,
  Target,
  ArrowRight,
  Sparkles,
  Users,
  FileText,
  BarChart3,
  UserCheck
} from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();

  const testimonials = [
    {
      name: "Michael Chen",
      age: 58,
      title: "VP of Operations",
      quote: "After 18 months of sending résumés into the void, CareerIQ helped me create a must-interview résumé. Three weeks later, I had the VP role I wanted.",
      image: "MC",
      rating: 5
    },
    {
      name: "Sarah Martinez",
      age: 52,
      title: "Senior Product Manager",
      quote: "I was told I was 'overqualified' 23 times. CareerIQ helped me show why that experience mattered. Landed at $145K—$35K more than before.",
      image: "SM",
      rating: 5
    },
    {
      name: "David Thompson",
      age: 61,
      title: "Technology Consultant",
      quote: "14 months, zero offers. CareerIQ rewrote how I presented my career—same experience, completely different response. Now consulting at $185/hour.",
      image: "DT",
      rating: 5
    }
  ];

  const benefits = [
    {
      icon: Database,
      title: "Real Hiring Data",
      description: "Your resume learns from thousands of successful placements, not generic templates."
    },
    {
      icon: Target,
      title: "Precision Tailoring",
      description: "One click adapts your entire resume to match each job description with surgeon-level accuracy."
    },
    {
      icon: Shield,
      title: "The ATS + Human Test",
      description: "Pass both machine filters and hiring manager expectations in the same document."
    },
    {
      icon: UserCheck,
      title: "Built on Proven Method",
      description: "19 years of executive coaching distilled into an AI that knows what works."
    }
  ];

  const differentiators = [
    "Built by career coaches, not engineers",
    "Powered by real market data, not assumptions",
    "Designed for humans, optimized for systems",
    "Your story stays intact. Your impact gets sharper."
  ];

  const faqs = [
    {
      question: "What is a 'must-interview' résumé?",
      answer: "A must-interview résumé is one that makes hiring teams think: 'This is exactly who we've been trying to hire. We need to meet this person.' It's not about buzzwords—it's about alignment, credibility, and clarity visible in a 6-20 second scan."
    },
    {
      question: "Do you make things up or exaggerate?",
      answer: "Never. We don't fabricate experience, inflate titles, or invent achievements. You're already qualified. Your résumé just shows 1/10th of 1% of what you've accomplished. We help you show the other 99.9%—truthfully and compellingly."
    },
    {
      question: "How is this different from ChatGPT or other AI tools?",
      answer: "Generic AI tools don't understand career positioning. Our system is built on 19+ years of coaching executives—the prompts, structure, and methodology all come from real hiring manager feedback and 100,000+ successful placements."
    },
    {
      question: "I'm over 50—will this really help with age discrimination?",
      answer: "Yes. 90% of executives 50+ face age discrimination (AARP 2024). The résumé that gets you past that is one that's so aligned and compelling, hiring managers don't want to risk losing you. We focus on results, relevance, and readiness—not your graduation year."
    },
    {
      question: "How long does it take?",
      answer: "Your first must-interview résumé takes about 15-20 minutes. Future résumés for new roles take just 3-5 minutes because your Career Brain is already built."
    },
    {
      question: "Can I edit the résumé you generate?",
      answer: "Absolutely. You own everything we create. Export as PDF or Word, make any edits you want, and use it however you need."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Premium Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
                <span className="text-primary-foreground font-bold text-lg">C</span>
              </div>
              <div>
                <h1 className="text-xl font-bold">CareerIQ</h1>
                <p className="text-xs text-muted-foreground">AI-Powered Resume Tailoring</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
                Sign In
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/quick-score')}>
                Free Analysis
              </Button>
              <Button size="sm" onClick={() => navigate('/auth')}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* HERO SECTION - Outcome-focused */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-accent/5" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
        
        <div className="container relative mx-auto px-4 py-20 lg:py-28">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="px-4 py-1.5 text-sm font-medium">
              Built on 19 Years of Executive Coaching
            </Badge>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight">
              Turn Your Experience Into Your
              <span className="block bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                Competitive Advantage
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Every resume you submit matches what hiring managers actually want to see—
              <span className="text-foreground font-medium"> without losing who you really are.</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button 
                size="lg" 
                className="text-lg px-8 h-14 gap-2 shadow-lg hover:shadow-xl transition-shadow" 
                onClick={() => navigate('/auth')}
              >
                <Sparkles className="h-5 w-5" />
                Create Your Benchmark Resume
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 h-14 gap-2" 
                onClick={() => navigate('/quick-score')}
              >
                <Target className="h-5 w-5" />
                Try Free Analysis
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground">
              No credit card. No email required for analysis. Just honest results.
            </p>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF BAR */}
      <section className="border-y bg-muted/30 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="font-semibold">100,000+</span>
              <span className="text-muted-foreground">Executives Served</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
              <span className="font-semibold">19 Years</span>
              <span className="text-muted-foreground">Coaching Experience</span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <span className="font-semibold">$35K</span>
              <span className="text-muted-foreground">Avg. Salary Increase</span>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFIT CARDS */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center space-y-4 mb-14">
              <h2 className="text-3xl md:text-4xl font-bold">
                What Makes This Different
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                AI-powered resume tailoring built on proven coaching methodology
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => (
                <Card key={index} className="relative overflow-hidden border-2 hover:border-primary/30 transition-colors group">
                  <CardHeader className="pb-2">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                      <benefit.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {benefit.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FREE ANALYSIS CTA */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-primary/5 to-background border-y">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium">
              <FileText className="h-4 w-4" />
              Free Resume Analysis
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold">
              Try Your Free Analysis
            </h2>
            
            <p className="text-xl text-muted-foreground">
              Paste a job description. Get immediate feedback on how your resume stacks up.
              <br />
              <span className="text-foreground font-medium">See where you're strong. See what's missing.</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="text-lg px-8 h-14 gap-2"
                onClick={() => navigate('/quick-score')}
              >
                <Target className="h-5 w-5" />
                Get My Free Analysis
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground">
              No credit card required. No email required. Just honest results.
            </p>
          </div>
        </div>
      </section>

      {/* THE REAL DIFFERENCE */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">
                The Real Difference
              </h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {differentiators.map((item, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-4 p-5 rounded-xl border bg-card hover:bg-accent/5 transition-colors"
                >
                  <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0" />
                  <span className="text-lg">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 bg-muted/30 border-y">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center space-y-4 mb-14">
              <Badge variant="secondary" className="mb-2">Success Stories</Badge>
              <h2 className="text-3xl md:text-4xl font-bold">
                From First-Time Job Seekers to C-Suite Leaders
              </h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="relative">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold">
                        {testimonial.image}
                      </div>
                      <div>
                        <CardTitle className="text-base">{testimonial.name}</CardTitle>
                        <CardDescription>{testimonial.title}, {testimonial.age}</CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-amber-500 fill-amber-500" />
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground italic">"{testimonial.quote}"</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">
                Common Questions
              </h2>
            </div>
            
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="border rounded-xl px-6 data-[state=open]:bg-accent/5"
                >
                  <AccordionTrigger className="text-left hover:no-underline py-5">
                    <span className="font-medium text-base">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 bg-gradient-to-br from-primary/15 via-primary/10 to-accent/10 border-t">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to Turn Your Experience Into Your Advantage?
            </h2>
            
            <p className="text-xl text-muted-foreground">
              Join 100,000+ executives who've transformed how they present their careers.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                size="lg" 
                className="text-lg px-8 h-14 gap-2 shadow-lg"
                onClick={() => navigate('/auth')}
              >
                <Sparkles className="h-5 w-5" />
                Get Started Free
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 h-14 gap-2"
                onClick={() => navigate('/quick-score')}
              >
                Try Free Analysis First
              </Button>
            </div>
            
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground pt-4">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                No credit card required
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Cancel anytime
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 border-t bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">C</span>
              </div>
              <span className="font-semibold">CareerIQ</span>
            </div>
            
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} CareerIQ. All rights reserved.
            </p>
            
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
