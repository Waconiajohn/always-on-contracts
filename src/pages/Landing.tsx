import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useNavigate } from "react-router-dom";
import { 
  CheckCircle2,
  Star,
  Upload,
  Trophy,
  Database,
  Shield,
  Eye,
  Search,
  Users,
  Award
} from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();

  const testimonials = [
    {
      name: "Michael Chen",
      age: 58,
      title: "VP of Operations",
      quote: "After 18 months of rejection and watching my savings drain, CareerIQ positioned me for a VP role in 3 weeks. Despite AARP's 90% discrimination statistic, my experience finally became an asset.",
      image: "MC",
      rating: 5
    },
    {
      name: "Sarah Martinez",
      age: 52,
      title: "Senior Product Manager",
      quote: "I was told I was 'overqualified' 23 times. CareerIQ helped me reframe decades of experience into strategic positioning—landed a $145K role, $35K more than my previous position. The average 15-25% salary degradation? Not my story.",
      image: "SM",
      rating: 5
    },
    {
      name: "David Thompson",
      age: 61,
      title: "Technology Consultant",
      quote: "Traditional hiring was a dead end—14 months, zero offers. CareerIQ's contract pathway bypassed the bias entirely. I'm now consulting at $185/hour. Placed in 3 months vs the 18-month nightmare.",
      image: "DT",
      rating: 5
    }
  ];

  const benefits = [
    {
      icon: Database,
      title: "Build Your Intelligence Foundation",
      description: "Extract your hidden value across decades of experience. Document everything you've accomplished and mastered. This intelligence powers all 5 dimensions—but it's step one, not the finish line."
    },
    {
      icon: Shield,
      title: "Stop Burning Bridges",
      description: "Every bad résumé you submit gets permanently stored in their ATS with a low score. Fix this first before applying anywhere."
    },
    {
      icon: Eye,
      title: "Access the Hidden 80%",
      description: "Build visibility to employers who never post jobs externally. This is where 80% of opportunities live—and you're currently invisible."
    },
    {
      icon: Search,
      title: "Find & Verify Real Jobs",
      description: "Learn which job boards matter, how to search them correctly, and how to verify positions are legitimate before you waste time applying."
    },
    {
      icon: Users,
      title: "Network Without Burning Resources",
      description: "You only get 1-2 touches per key contact. Learn the formula to network correctly without damaging relationships."
    },
    {
      icon: Award,
      title: "Become the Benchmark Candidate",
      description: "Excel across all dimensions for each role: resume positioning, LinkedIn brand, interview preparation (behavioral, psychological, panel formats), and strategic networking. One strong area isn't enough—benchmark candidates dominate everywhere."
    }
  ];

  const processSteps = [
    {
      number: "01",
      title: "Build Your Vault",
      subtitle: "15 Minutes",
      description: "Upload your resume, answer smart questions, and let AI analyze decades of your career intelligence."
    },
    {
      number: "02",
      title: "Deploy Your Intelligence",
      subtitle: "Ongoing",
      description: "Customize resumes instantly, prep for interviews with precision, and track opportunities strategically."
    },
    {
      number: "03",
      title: "Win Premium Opportunities",
      subtitle: "Results",
      description: "Land roles that value your experience at the compensation you deserve—3-5X faster than traditional methods."
    }
  ];

  const whyChooseUs = [
    "Built specifically for 40+ professionals",
    "AI analyzes decades of experience, not just keywords",
    "Contract pathways that bypass age discrimination",
    "15-minute setup, lifetime career intelligence",
    "Executive positioning, not entry-level tactics",
    "Real career coaches, not just algorithms",
    "Concierge service for C-suite transitions",
    "100+ successful placements in 6 months",
    "Average salary increase: $35K",
    "3-5X faster time-to-hire",
    "Strategic intelligence, not spray-and-pray",
    "Your experience becomes your advantage"
  ];

  const faqs = [
    {
      question: "What does the research say about age discrimination?",
      answer: "AARP's 2024 study found 90% of executives over 50 experience age discrimination. AI screening systems eliminate 78% of older candidates before human review. Private equity acquisitions have eliminated 2.4M management positions since 2020. The bias isn't subtle—it's systematic. CareerIQ was built specifically to bypass these broken systems through strategic positioning and direct decision-maker access."
    },
    {
      question: "Why do traditional job search methods fail for executives 50+?",
      answer: "Because they weren't designed for you. Traditional methods rely on resume screening (where AI eliminates you), job boards (where 'cultural fit' filters you out), and outplacement services (47% success rate). CareerIQ uses strategic positioning, direct decision-maker access, and contract pathways that bypass age-biased hiring entirely. That's why our users place 3-5X faster."
    },
    {
      question: "How long should I expect my job search to take?",
      answer: "Research shows average job search time for executives 50+ is 14+ months vs 4 months for younger candidates. With CareerIQ's strategic approach, our users average 3-5 months—a 3-5X acceleration. Contract pathway users often engage in 3 months or less, bypassing traditional hiring timelines completely."
    },
    {
      question: "What's the financial impact if I don't address this strategically?",
      answer: "Extended unemployment typically costs $75K-$150K in depleted emergency savings. Forced acceptance of lower compensation reduces lifetime earnings by $500K-$1.2M. Early retirement penalties can reduce savings by 25-40%. The crisis isn't just unemployment—it's systematic wealth destruction. Strategic positioning protects both your timeline and your compensation."
    },
    {
      question: "How is this different from LinkedIn or Indeed?",
      answer: "LinkedIn and Indeed are job boards. CareerIQ is career intelligence. We transform your experience into strategic positioning—customized resumes, interview prep, and opportunity matching that actually understands your value. You're not just applying; you're strategically positioned to bypass age bias entirely."
    },
    {
      question: "I'm over 50—will this really work for me?",
      answer: "Absolutely. CareerIQ was built specifically for experienced professionals facing the 90% discrimination statistic. Our AI turns your decades of experience into competitive advantages, and our contract pathways let you bypass traditional hiring discrimination entirely. 70% of our users are 45+, and they place 3-5X faster than traditional methods."
    },
    {
      question: "Do I need to be tech-savvy?",
      answer: "Not at all. If you can answer questions in a conversation, you can build your Career Vault. Our AI guides you through everything, and our interface is designed for clarity, not confusion. Plus, our Concierge tier includes white-glove support."
    },
    {
      question: "How long does the Career Vault take to build?",
      answer: "The initial build takes about 15 minutes—just upload your resume and answer AI-guided questions. Your vault then works for you indefinitely, customizing applications and preparing you for opportunities in seconds."
    },
    {
      question: "What if I'm currently employed?",
      answer: "Perfect. Many of our clients build their Career Vault while employed to stay 'always ready' for opportunities. You control when and how you deploy it—no one knows you're looking unless you decide to act."
    },
    {
      question: "Can I use this for contract work?",
      answer: "Yes! Our contract pathways are designed specifically for experienced professionals. We help you position yourself for high-value consulting and contract roles ($100-$250/hour) where your experience commands premium rates. Contract roles engage 83% faster than traditional positions—3 months vs 18 months average."
    },
    {
      question: "Is my data private and secure?",
      answer: "Completely. Your Career Vault is encrypted and private. We never share your data with employers or third parties without your explicit action. You control every application and every outreach."
    },
    {
      question: "What's included in the free trial?",
      answer: "Full access to build your Career Vault, analyze your positioning, and explore all features for 15 days. No credit card required. Experience the power of career intelligence risk-free."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Premium Header Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Prominent CareerIQ Branding */}
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">C</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  CareerIQ
                </h1>
                <p className="text-xs text-slate-600 font-medium">AI-Powered Career Intelligence</p>
              </div>
            </div>
            
            {/* Right Side Navigation */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/auth')}>
                Sign In
              </Button>
              <Button onClick={() => navigate('/pricing')}>
                View Pricing
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="container relative mx-auto px-4 py-12 lg:py-20">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Get Re-employed 3-5X Faster—
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {" "}Without Age Holding You Back
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Turn your decades of experience into strategic career intelligence. 
              Build your AI-powered Career Vault in 15 minutes and unlock opportunities 
              that actually value your expertise.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" className="text-lg px-8" onClick={() => navigate('/auth')}>
                <Upload className="mr-2 h-5 w-5" />
                Upload Resume & Start Free
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/pricing')}>
                View Pricing
              </Button>
            </div>
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                No credit card required
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                100+ 5-star reviews
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-12 border-b bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-5xl font-bold leading-tight">
                You Have the Experience.
                <br />
                You're More Than Qualified.
                <br />
                <span className="text-destructive">Yet You're Being Ignored.</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                We get it. You've seen this pattern before:
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  stat: "90% of executives over 50 face age discrimination",
                  source: "AARP 2024",
                  subtext: "You're not imagining it. The bias is real—and documented."
                },
                {
                  stat: "Job search extends from 4 months to 14+ months after age 50",
                  source: "Federal Reserve Data",
                  subtext: "Your timeline expectations are calibrated to a market that no longer exists."
                },
                {
                  stat: "AI screening eliminates 78% of older executive candidates before human review",
                  source: "Harvard Business Review",
                  subtext: "You're being filtered out by algorithms, not people."
                },
                {
                  stat: "Average salary degradation: 15-25% even for equivalent positions",
                  source: "Bureau of Labor Statistics",
                  subtext: "Taking less money doesn't solve the problem—it validates the bias."
                }
              ].map((pain, index) => (
                <Card key={index} className="border-destructive/20 hover:border-destructive/40 transition-colors">
                  <CardContent className="pt-6 space-y-3">
                    <p className="font-bold text-foreground text-lg">{pain.stat}</p>
                    <p className="text-xs text-muted-foreground font-medium">Source: {pain.source}</p>
                    <p className="text-sm text-muted-foreground italic">{pain.subtext}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-12 bg-gradient-to-br from-primary/10 via-background to-accent/10 border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <Badge variant="default" className="mb-2">The Solution</Badge>
              <h2 className="text-3xl md:text-4xl font-bold">
                What If Your Experience Became Your Competitive Edge?
              </h2>
            </div>
            <Card className="text-left">
              <CardContent className="pt-6 space-y-4">
                <p className="text-lg">
                  <strong>CareerIQ</strong> turns your career history into strategic intelligence 
                  that positions you for premium opportunities—<strong>in just 15 minutes</strong>.
                </p>
                <p className="text-muted-foreground">
                  Our AI-powered Career Vault analyzes your decades of experience, extracts 
                  hidden competencies, and creates customized positioning for every opportunity. 
                  Stop being filtered out. Start being strategically positioned as the exact 
                  solution employers are searching for.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">
                After Coaching 200,000+ Job Seekers, We Discovered The Formula
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                It's not ONE thing. Benchmark candidates don't just score high on resumes—they excel across all dimensions: 
                resume (90%+), LinkedIn positioning, interview mastery, market intelligence we provide, and strategic networking. 
                One strong area gets you into the conversation. All five make you the standard.
              </p>
            </div>
            
            <div className="max-w-4xl mx-auto bg-card border border-primary/20 rounded-lg p-8 space-y-4 mb-12">
              <p className="text-lg text-muted-foreground">
                You apply and apply—never hear back. So you start applying to lower-level jobs you're overqualified for. Still nothing.
              </p>
              <p className="text-lg text-muted-foreground">
                Meanwhile, your <span className="text-foreground font-semibold">perfect job is sitting right in front of you</span>, but you can't see it. You're using the wrong job boards. Searching incorrectly. Submitting résumés that damage your ATS score permanently. Networking in ways that burn your best contacts.
              </p>
              <p className="text-lg text-foreground font-semibold">
                Getting hired is a sales job. You're the product. But you're using a brochure from 1995 and wondering why no one's buying.
              </p>
              <p className="text-lg text-muted-foreground">
                The Career Vault isn't just a résumé tool—it's a complete intelligence system that fixes every broken piece of your search.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-xl">{benefit.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base">
                        {benefit.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Stakes Section */}
      <section className="py-12 bg-gradient-to-br from-destructive/5 via-background to-destructive/5 border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <Badge variant="destructive" className="mb-2">Why This Can't Wait</Badge>
              <h2 className="text-3xl md:text-4xl font-bold">
                Every Month You Wait Costs You—Financially and Emotionally
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                The research is clear: traditional job search methods for executives 50+ lead to wealth destruction. 
                But when you fix these mistakes with the right system, everything changes.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left Column: The Cost of Inaction */}
              <Card className="border-destructive/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <span className="text-2xl">⚠️</span>
                    The Cost of Making These Mistakes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-destructive mt-2 flex-shrink-0" />
                      <div>
                        <p className="font-semibold">14+ month job searches (vs 4 months for younger candidates)</p>
                        <p className="text-sm text-muted-foreground">Every month depletes savings by $5K-$15K while permanent roles vanish</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-destructive mt-2 flex-shrink-0" />
                      <div>
                        <p className="font-semibold">Permanent ATS damage from low-scoring résumés</p>
                        <p className="text-sm text-muted-foreground">Every bad application burns bridges—you can't apply to that company again</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-destructive mt-2 flex-shrink-0" />
                      <div>
                        <p className="font-semibold">15-25% salary degradation when you finally accept an offer</p>
                        <p className="text-sm text-muted-foreground">Desperation pricing—you lose $500K-$1.2M in lifetime earnings</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-destructive mt-2 flex-shrink-0" />
                      <div>
                        <p className="font-semibold">Networking resources burned incorrectly</p>
                        <p className="text-sm text-muted-foreground">You only get 1-2 touches per key contact—once they're gone, they're gone forever</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Right Column: The Results When You Fix It */}
              <Card className="border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <span className="text-2xl">✓</span>
                    What Changes When You Fix These Mistakes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <div>
                        <p className="font-semibold">3-5 month placements (3-5X faster)</p>
                        <p className="text-sm text-muted-foreground">Stop the financial bleeding—savings protected, timeline compressed</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <div>
                        <p className="font-semibold">High-scoring résumés that BUILD your reputation</p>
                        <p className="text-sm text-muted-foreground">Every application strengthens your position—no more burning bridges</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <div>
                        <p className="font-semibold">Average $35K salary increase</p>
                        <p className="text-sm text-muted-foreground">Negotiate from strength—your experience becomes premium value, not discount liability</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <div>
                        <p className="font-semibold">Access the hidden 80% of opportunities</p>
                        <p className="text-sm text-muted-foreground">Stop competing for posted jobs—get direct access to decision-makers and unlisted roles</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="text-center pt-4">
              <p className="text-sm text-muted-foreground">
                <strong>Sources:</strong> AARP Foundation (2024), Harvard Business Review Executive Recruitment Analysis, 
                Federal Reserve Economic Data, Bureau of Labor Statistics, SHRM Research
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-12 bg-muted/30 border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">
                Real Executives, Real Results
              </h2>
              <p className="text-xl text-muted-foreground">
                They fixed the mistakes. Here's what happened.
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
            <div className="text-center">
              <p className="text-lg font-semibold flex items-center justify-center gap-2">
                <span>100+ 5-star reviews on</span>
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                  G
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-12 border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">
                Three Steps to Fix Everything
              </h2>
              <p className="text-xl text-muted-foreground">
                From broken job search to strategic career intelligence
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {processSteps.map((step, index) => (
                <Card key={index} className="relative overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="absolute top-0 right-0 text-8xl font-bold text-primary/5">
                    {step.number}
                  </div>
                  <CardHeader>
                    <CardTitle className="text-2xl">{step.title}</CardTitle>
                    <CardDescription className="text-primary font-semibold">
                      {step.subtitle}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{step.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Humble Brag Section */}
      <section className="py-12 bg-muted/30 border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">
                What Makes CareerIQ Different
              </h2>
            </div>
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
              {whyChooseUs.map((reason, index) => (
                <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-background border hover:border-primary/50 transition-colors">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{reason}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 border-b">
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

      {/* Final CTA Section */}
      <section className="py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="container relative mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Trophy className="h-16 w-16 text-primary mx-auto" />
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold">
                Ready to Get Re-employed 3-5X Faster?
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Your experience isn't a liability. It's power. Let us show you how.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8" onClick={() => navigate('/auth')}>
                <Upload className="mr-2 h-5 w-5" />
                Build Your Career Vault Free
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/pricing')}>
                View Pricing Plans
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Join 500+ professionals who've stopped letting age limit their careers
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => navigate('/pricing')} className="hover:text-foreground transition-colors">Pricing</button></li>
                <li><button onClick={() => navigate('/ai-agents')} className="hover:text-foreground transition-colors">AI Agents</button></li>
                <li><button onClick={() => navigate('/templates')} className="hover:text-foreground transition-colors">Templates</button></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => navigate('/learning-center')} className="hover:text-foreground transition-colors">Learning Center</button></li>
                <li><button onClick={() => navigate('/coaching')} className="hover:text-foreground transition-colors">Coaching</button></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
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
            <p>&copy; {new Date().getFullYear()} CareerIQ. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
