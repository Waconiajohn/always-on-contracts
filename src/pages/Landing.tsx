import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useNavigate } from "react-router-dom";
import { 
  CheckCircle2,
  Star,
  Trophy,
  Database,
  Shield,
  Eye,
  Zap,
  Target,
  MessageSquare,
  ArrowRight,
  Sparkles
} from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();

  const testimonials = [
    {
      name: "Michael Chen",
      age: 58,
      title: "VP of Operations",
      quote: "After 18 months of sending résumés into the void, CareerIQ helped me create a must-interview résumé. Three weeks later, I had the VP role I wanted. My experience finally became an asset.",
      image: "MC",
      rating: 5
    },
    {
      name: "Sarah Martinez",
      age: 52,
      title: "Senior Product Manager",
      quote: "I was told I was 'overqualified' 23 times. CareerIQ helped me show why that experience mattered for the specific role. Landed at $145K—$35K more than before. Finally seen as must-interview, not must-skip.",
      image: "SM",
      rating: 5
    },
    {
      name: "David Thompson",
      age: 61,
      title: "Technology Consultant",
      quote: "14 months, zero offers. CareerIQ rewrote how I presented my career—same experience, completely different response. Now consulting at $185/hour. The must-interview résumé changed everything.",
      image: "DT",
      rating: 5
    }
  ];

  const howItWorks = [
    {
      step: "01",
      title: "Upload Your Current Résumé",
      description: "Drop in your existing résumé and a target job description. We'll analyze both to understand the gap between where you are and where you need to be."
    },
    {
      step: "02",
      title: "We Build Your Career Brain",
      description: "Our AI creates a structured profile of your entire career: achievements, metrics, scope, tools, and impact. This becomes the foundation for every future must-interview résumé."
    },
    {
      step: "03",
      title: "We Study the Role & Company",
      description: "We analyze the job description (and when available, the company and industry) to build a Job Blueprint—the exact competencies, keywords, and structure that will resonate."
    },
    {
      step: "04",
      title: "We Match Your Best Self to This Job",
      description: "We map your Career Brain to the Job Blueprint, selecting and organizing the most relevant achievements for this specific opportunity."
    },
    {
      step: "05",
      title: "Answer a Few Targeted Questions",
      description: "We ask focused questions to fill in the gaps: metrics, scope, tools, budgets, team sizes, outcomes. No endless forms—just the details that unlock real impact."
    },
    {
      step: "06",
      title: "Get Your Must-Interview Résumé",
      description: "We generate a tailored résumé designed for ATS systems, fast scanning by hiring teams, and clear alignment to the role. Export, edit, and reuse for future roles in minutes."
    }
  ];

  const whyDifferent = [
    "We extract the best 1-2% of your career story",
    "We align it to the job, company, and industry",
    "We translate it into hiring-manager language",
    "We never invent titles, roles, or fake wins",
    "19+ years coaching 100,000+ executives",
    "AI-powered but human-vetted methodology",
    "Your experience, finally presented right",
    "ATS-optimized and recruiter-approved",
    "Reusable Career Brain for future roles",
    "Built for executives 40+ fighting age bias",
    "3-5X faster time-to-hire for our users",
    "Average $35K salary increase"
  ];

  const faqs = [
    {
      question: "What is a 'must-interview' résumé?",
      answer: "A must-interview résumé is one that makes hiring teams think: 'This is exactly who we've been trying to hire. We need to meet this person.' It's not about buzzwords or fluff—it's about alignment, credibility, and clarity that's visible in a 6-20 second scan."
    },
    {
      question: "Do you make things up or exaggerate?",
      answer: "Never. We don't fabricate experience, inflate titles, or invent achievements. You're already qualified for the roles you're targeting. Your résumé just shows 1/10th of 1% of what you've accomplished. We help you show the other 99.9%—truthfully and compellingly."
    },
    {
      question: "How is this different from ChatGPT or other AI tools?",
      answer: "Generic AI tools don't understand career positioning. They might clean up grammar or suggest better words, but they don't know what hiring managers for your specific role actually look for. Our system is built on 19+ years of coaching executives—the prompts, the structure, the methodology all come from real hiring manager feedback and 100,000+ successful placements."
    },
    {
      question: "I'm over 50—will this really help with age discrimination?",
      answer: "Yes. 90% of executives 50+ face age discrimination (AARP 2024). The résumé that gets you past that is one that's so aligned and compelling, hiring managers don't want to risk losing you. We focus on what matters: results, relevance, and readiness—not your graduation year."
    },
    {
      question: "How long does it take?",
      answer: "Your first must-interview résumé takes about 15-20 minutes: upload your résumé, paste a job description, answer a few targeted questions, and get your tailored result. Future résumés for new roles take just 3-5 minutes because your Career Brain is already built."
    },
    {
      question: "Can I edit the résumé you generate?",
      answer: "Absolutely. You own everything we create. Export as PDF or Word, make any edits you want, and use it however you need. Many users fine-tune the AI output before sending—that's expected and encouraged."
    },
    {
      question: "What about LinkedIn, interview prep, and other career stuff?",
      answer: "Great question. A must-interview résumé gets you in the door—but Benchmark Candidates dominate every dimension. That's why we also offer LinkedIn optimization, interview prep with real questions from your target companies, strategic networking guidance, and more. The résumé is step one of a complete system."
    },
    {
      question: "What's the free score all about?",
      answer: "Before you commit to anything, you can score your current résumé for free. We'll show you how it stacks up against what hiring teams actually look for—and what's missing to make it must-interview worthy. No signup required for the initial score."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Premium Header Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-amber-500 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">C</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">CareerIQ</h1>
                <p className="text-xs text-slate-600 font-medium">Must-Interview Résumé Engine</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/auth')}>
                Sign In
              </Button>
              <Button onClick={() => navigate('/quick-score')} variant="outline">
                Free Score
              </Button>
              <Button onClick={() => navigate('/auth')}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="container relative mx-auto px-4 py-16 lg:py-24">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge variant="outline" className="px-4 py-1 text-sm">
              19+ Years • 100,000+ Executives • Must-Interview Results
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Your résumé shows 1/10th of 1% of what you've accomplished.
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {" "}Let's fix that.
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We turn your real career into a <strong>must-interview résumé</strong> for every role—so hiring teams move you to the top of the interview list, not the bottom of the stack.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" className="text-lg px-8 gap-2" onClick={() => navigate('/auth')}>
                <Sparkles className="h-5 w-5" />
                Build My Must-Interview Résumé
              </Button>
              <Button size="lg" variant="outline" className="gap-2" onClick={() => navigate('/quick-score')}>
                <Target className="h-5 w-5" />
                Get My Free Score (90 Seconds)
              </Button>
            </div>
            
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground pt-4">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                No credit card required
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                We don't fabricate—ever
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                19+ years of methodology
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM SECTION */}
      <section className="py-16 border-b bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <Badge variant="destructive" className="mb-2">The Problem</Badge>
              <h2 className="text-3xl md:text-4xl font-bold leading-tight">
                Your career is impressive.
                <br />
                <span className="text-destructive">Your résumé doesn't show it.</span>
              </h2>
            </div>
            
            <div className="text-left space-y-4 text-lg text-muted-foreground">
              <p>
                Most professionals—especially at senior levels—are terrible at talking about themselves on paper:
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { issue: "Key wins are buried or missing", icon: "📉" },
                { issue: "Bullets are generic and interchangeable", icon: "📝" },
                { issue: "Résumé isn't aligned to any specific role or company", icon: "🎯" },
                { issue: "For 50+, age bias magnifies the problem", icon: "⏰" }
              ].map((item, index) => (
                <Card key={index} className="border-destructive/20 hover:border-destructive/40 transition-colors">
                  <CardContent className="pt-6 flex items-start gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <p className="text-left text-muted-foreground">{item.issue}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <Card className="bg-destructive/5 border-destructive/20">
              <CardContent className="pt-6">
                <p className="text-lg">
                  In <strong>6-20 seconds</strong>, a hiring team decides whether you move forward or disappear into the pile.
                </p>
                <p className="text-lg mt-4">
                  Right now, your résumé probably makes you look <strong>"qualified."</strong>
                  <br />
                  Our goal is different: we want you to look <strong className="text-primary">must-interview</strong>.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* WHAT IS MUST-INTERVIEW SECTION */}
      <section className="py-16 bg-gradient-to-br from-primary/10 via-background to-accent/10 border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center space-y-4 mb-12">
              <Badge variant="default" className="mb-2">The Solution</Badge>
              <h2 className="text-3xl md:text-4xl font-bold">
                What Is a "Must-Interview" Résumé?
              </h2>
            </div>
            
            <Card className="mb-8">
              <CardContent className="pt-8 pb-8">
                <blockquote className="text-xl md:text-2xl italic text-center text-muted-foreground">
                  "This is exactly the kind of person we've been trying to hire.
                  <br />
                  <span className="text-foreground font-semibold">We need to meet them."</span>
                </blockquote>
              </CardContent>
            </Card>
            
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <Target className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Alignment</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Your experience mapped directly to <em>this</em> role, <em>this</em> company, <em>this</em> industry.
                  </CardDescription>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <Shield className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Credibility</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Specific metrics, scope, tools, and impact that feel real and verifiable.
                  </CardDescription>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <Eye className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Clarity</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    A story that's easy to understand in under 20 seconds.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
            
            <p className="text-center text-lg mt-8 font-medium">
              Not just <span className="text-muted-foreground">qualified</span>.
              <span className="text-primary ml-2">Must-interview.</span>
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="py-16 border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">
                How It Works
              </h2>
              <p className="text-xl text-muted-foreground">
                From invisible applicant to must-interview candidate in six steps
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {howItWorks.map((step, index) => (
                <Card key={index} className="relative overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="absolute top-0 right-0 text-8xl font-bold text-primary/5">
                    {step.step}
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">{step.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TRUST SECTION */}
      <section className="py-16 bg-muted/30 border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">
                We Don't Fabricate. We <span className="text-primary">Better Represent.</span>
              </h2>
            </div>
            
            <Card className="mb-8">
              <CardContent className="pt-8 space-y-4">
                <p className="text-lg">
                  Lots of tools "pretty up" your résumé. We do something more important:
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-background border">
                    <Database className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Extract</p>
                      <p className="text-sm text-muted-foreground">The best 1-2% of your career story</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-background border">
                    <Target className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Align</p>
                      <p className="text-sm text-muted-foreground">To the job, company, and industry</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-background border">
                    <MessageSquare className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Translate</p>
                      <p className="text-sm text-muted-foreground">Into hiring-manager language</p>
                    </div>
                  </div>
                </div>
                <p className="text-lg font-medium text-center pt-4">
                  We never invent titles, roles, or fake wins. <span className="text-primary">You're already good enough.</span>
                  <br />
                  We just stop hiding it.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FREE SCORE CTA SECTION */}
      <section className="py-16 bg-gradient-to-br from-primary/5 via-background to-primary/10 border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <Zap className="h-12 w-12 text-primary mx-auto" />
            <h2 className="text-3xl md:text-4xl font-bold">
              See What Hiring Teams Actually See
            </h2>
            <p className="text-xl text-muted-foreground">
              Most résumés only show a small fraction of your real value. Our free score analyzes your résumé the way a hiring team would—and shows how close you are to <strong>must-interview</strong> status.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/quick-score')} className="gap-2">
                <Target className="h-5 w-5" />
                Score My Résumé (Free)
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/auth')}>
                Skip to Full Builder
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              No signup required for your initial score
            </p>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section className="py-16 border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">
                From Ignored to Must-Interview
              </h2>
              <p className="text-xl text-muted-foreground">
                Real executives, real transformations
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex gap-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                      ))}
                    </div>
                    <p className="text-muted-foreground italic">"{testimonial.quote}"</p>
                    <div className="flex items-center gap-3 pt-4 border-t">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                        {testimonial.image}
                      </div>
                      <div>
                        <p className="font-semibold">{testimonial.name}, {testimonial.age}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* WHY DIFFERENT SECTION */}
      <section className="py-16 bg-muted/30 border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">
                What Makes This Different
              </h2>
              <p className="text-lg text-muted-foreground">
                Built for serious candidates who want serious results
              </p>
            </div>
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
              {whyDifferent.map((reason, index) => (
                <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-background border hover:border-primary/50 transition-colors">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{reason}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-16 border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">
                Frequently Asked Questions
              </h2>
            </div>
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left hover:no-underline">
                    <span className="font-semibold">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="container relative mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Trophy className="h-16 w-16 text-primary mx-auto" />
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold">
                Ready to Become Must-Interview?
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Your career is impressive. It's time your résumé showed it.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 gap-2" onClick={() => navigate('/auth')}>
                <Sparkles className="h-5 w-5" />
                Build My Must-Interview Résumé
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/quick-score')}>
                Get My Free Score First
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Join 100,000+ executives who stopped being ignored
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => navigate('/quick-score')} className="hover:text-foreground transition-colors">Free Résumé Score</button></li>
                <li><button onClick={() => navigate('/pricing')} className="hover:text-foreground transition-colors">Pricing</button></li>
                <li><button onClick={() => navigate('/ai-agents')} className="hover:text-foreground transition-colors">AI Agents</button></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => navigate('/learning-center')} className="hover:text-foreground transition-colors">Learning Center</button></li>
                <li><button onClick={() => navigate('/coaching')} className="hover:text-foreground transition-colors">Executive Coaching</button></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About (19+ Years)</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} CareerIQ. 19+ years helping executives become must-interview candidates.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
