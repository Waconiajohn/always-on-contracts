import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useNavigate } from "react-router-dom";
import { 
  CheckCircle2,
  Star,
  Target,
  ArrowRight,
  Sparkles,
  Users,
  Brain,
  Eye,
  TrendingUp,
  Headphones,
  Zap,
  MessageCircle
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
      icon: TrendingUp,
      title: "Real Hiring Intelligence",
      description: "Our AI analyzes actual hiring patterns, not generic advice. Know what decision-makers are really looking for."
    },
    {
      icon: Eye,
      title: "Decision-Maker Simulation",
      description: "See your resume through the eyes of hiring managers, recruiters, and ATS systems before you apply."
    },
    {
      icon: Target,
      title: "Rise to the Shortlist",
      description: "Position yourself in the top 5% of applicants with precision-tailored resumes that demand attention."
    },
    {
      icon: Headphones,
      title: "Live Expert Coaching",
      description: "AI does the heavy lifting. Real coaches ensure you cross the finish line. Because getting hired takes more than algorithms."
    }
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
                <p className="text-xs text-muted-foreground">Elite Coaching × Intelligent Tech</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="hidden md:flex items-center gap-1.5 px-3 py-1 border-green-500/50 text-green-600 dark:text-green-400">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Live Coaches Available
              </Badge>
              <Button variant="ghost" size="sm" onClick={() => navigate('/resume-optimizer-info')}>
                Resume Optimizer
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
                Sign In
              </Button>
              <Button size="sm" onClick={() => navigate('/auth')}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-accent/5" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
        
        <div className="container relative mx-auto px-4 py-20 lg:py-28">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="px-4 py-1.5 text-sm font-medium">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Elite Coaching × Intelligent Tech
            </Badge>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight">
              Where Elite Coaching Meets
              <span className="block bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent pb-2">
                Intelligent Career Tech
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-foreground font-medium max-w-3xl mx-auto">
              The AI-Powered Resume Engine That Makes You Impossible to Ignore
            </p>
            
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              More than resume rewrites—our platform analyzes real hiring trends, 
              simulates decision-makers, and ensures you rise to the top of the shortlist.
              <br /><br />
              <span className="text-foreground font-medium">
                Plus, continuous live coaching from real experts—because getting hired takes more than AI.
              </span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button 
                size="lg" 
                className="text-lg px-8 h-14 gap-2 shadow-lg hover:shadow-xl transition-shadow" 
                onClick={() => navigate('/auth')}
              >
                <Sparkles className="h-5 w-5" />
                Start Free
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 h-14 gap-2" 
                onClick={() => navigate('/quick-score')}
              >
                <MessageCircle className="h-5 w-5" />
                Talk to a Coach
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground">
              No credit card required. See results in 60 seconds.
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
              <span className="text-muted-foreground">Executives Coached</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
              <span className="font-semibold">19 Years</span>
              <span className="text-muted-foreground">Coaching Excellence</span>
            </div>
            <div className="flex items-center gap-2">
              <Headphones className="h-5 w-5 text-green-500" />
              <span className="font-semibold">Live</span>
              <span className="text-muted-foreground">Expert Coaches Available</span>
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
                The only platform that combines AI precision with human expertise
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

      {/* WHY BOTH AI + COACHING SECTION */}
      <section className="py-20 bg-muted/30 border-y">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <Badge variant="secondary" className="mb-2">The Hybrid Advantage</Badge>
                <h2 className="text-3xl md:text-4xl font-bold">
                  Why AI Alone Isn't Enough
                </h2>
                <div className="space-y-4 text-lg text-muted-foreground">
                  <p>
                    AI can analyze. AI can optimize. AI can tailor.
                  </p>
                  <p>
                    But AI can't sit across from a hiring manager.<br />
                    AI can't read the room in a final interview.<br />
                    AI can't negotiate your offer.
                  </p>
                  <p className="text-foreground font-medium">
                    That's why CareerIQ combines intelligent career tech with continuous access to real coaches who've placed thousands of executives.
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Brain className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-1">The AI makes you impossible to ignore</h3>
                        <p className="text-muted-foreground">Analyzes trends, optimizes positioning, tailors every application</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-2 border-accent/20 bg-gradient-to-br from-accent/5 to-transparent">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <Headphones className="h-5 w-5 text-accent-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-1">The coaches make sure you close the deal</h3>
                        <p className="text-muted-foreground">Interview prep, salary negotiation, career strategy</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FREE ANALYSIS CTA */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium">
              <Zap className="h-4 w-4" />
              See Where You Stand in 60 Seconds
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold">
              Get Your Free Analysis
            </h2>
            
            <p className="text-xl text-muted-foreground">
              Paste a job description. Our AI simulates how hiring managers will scan your resume—
              <span className="text-foreground font-medium"> and shows you exactly what's working and what's not.</span>
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
              No signup required. Just honest insights.
            </p>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 border-y">
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
              Ready to Become Impossible to Ignore?
            </h2>
            
            <p className="text-xl text-muted-foreground">
              Join 100,000+ executives who've stopped competing and started commanding attention.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                size="lg" 
                className="text-lg px-8 h-14 gap-2 shadow-lg"
                onClick={() => navigate('/auth')}
              >
                <Sparkles className="h-5 w-5" />
                Start Free
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 h-14 gap-2"
                onClick={() => navigate('/quick-score')}
              >
                <MessageCircle className="h-5 w-5" />
                Talk to a Coach
              </Button>
            </div>
            
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground pt-4">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                No credit card required
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Live coaches available
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">C</span>
              </div>
              <span className="font-semibold">CareerIQ</span>
            </div>
            
            <p className="text-sm text-muted-foreground">
              © 2024 CareerIQ. Built on 19 years of executive coaching excellence.
            </p>
            
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm">Privacy</Button>
              <Button variant="ghost" size="sm">Terms</Button>
              <Button variant="ghost" size="sm">Contact</Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
