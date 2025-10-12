import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useNavigate } from "react-router-dom";
import { 
  Target, 
  FileText, 
  MessageSquare, 
  Briefcase, 
  Mail, 
  LayoutDashboard,
  CheckCircle2,
  Star,
  Upload,
  Zap,
  Trophy
} from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();

  const testimonials = [
    {
      name: "Michael Chen",
      title: "VP of Operations",
      quote: "After 6 months of rejection, CareerIQ positioned me for a VP role in 3 weeks. My experience finally became an asset, not a liability.",
      image: "MC",
      rating: 5
    },
    {
      name: "Sarah Martinez",
      title: "Senior Product Manager",
      quote: "I thought being 52 meant settling for less. CareerIQ helped me land a $145K role—$35K more than my previous position.",
      image: "SM",
      rating: 5
    },
    {
      name: "David Thompson",
      title: "Technology Consultant",
      quote: "The contract pathway was a game-changer. I'm now consulting at $185/hour, bypassing traditional hiring bias entirely.",
      image: "DT",
      rating: 5
    }
  ];

  const benefits = [
    {
      icon: Target,
      title: "AI-Powered Positioning",
      description: "Stop being 'overqualified.' Start being 'strategically positioned.'"
    },
    {
      icon: FileText,
      title: "Executive-Level Resumes",
      description: "Instant customization for every opportunity—no more one-size-fits-all."
    },
    {
      icon: MessageSquare,
      title: "Interview Intelligence",
      description: "Walk in knowing exactly what they want to hear, backed by your vault."
    },
    {
      icon: Briefcase,
      title: "Contract Pathways",
      description: "Bypass age bias with high-value contract opportunities at premium rates."
    },
    {
      icon: Mail,
      title: "Strategic Outreach",
      description: "AI-crafted messages that get responses from decision-makers."
    },
    {
      icon: LayoutDashboard,
      title: "Command Center",
      description: "Manage everything from one dashboard—opportunities, applications, insights."
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
      question: "How is this different from LinkedIn or Indeed?",
      answer: "LinkedIn and Indeed are job boards. CareerIQ is career intelligence. We transform your experience into strategic positioning—customized resumes, interview prep, and opportunity matching that actually understands your value. You're not just applying; you're strategically positioned."
    },
    {
      question: "I'm over 50—will this really work for me?",
      answer: "Absolutely. CareerIQ was built specifically for experienced professionals facing age bias. Our AI turns your decades of experience into competitive advantages, and our contract pathways let you bypass traditional hiring discrimination entirely. 70% of our users are 45+."
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
      answer: "Yes! Our contract pathways are designed specifically for experienced professionals. We help you position yourself for high-value consulting and contract roles ($100-$250/hour) where your experience commands premium rates."
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
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="container relative mx-auto px-4 py-20 lg:py-32">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="mb-4">
              Built for Experienced Professionals
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Get Reemployed 3-5X Faster—
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
                <Zap className="mr-2 h-5 w-5" />
                Start Your Free Career Vault
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
      <section className="py-20 border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-12">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">
                You're Experienced. Qualified. 
                <br />
                But the Job Market Isn't Built For You.
              </h2>
              <p className="text-lg text-muted-foreground">
                We get it. You've seen this pattern before:
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                "You apply but never hear back—like your experience doesn't matter",
                "Younger candidates with less experience get interviews",
                "Generic applications disappear into the void",
                "Your decades of expertise feel invisible"
              ].map((pain, index) => (
                <Card key={index} className="border-destructive/20">
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground">{pain}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 bg-muted/30 border-b">
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
      <section className="py-20 border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">
                Here's What Changes When You Build Your Career Vault
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Transform from overlooked to in-demand
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

      {/* Testimonials Section */}
      <section className="py-20 bg-muted/30 border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">
                Don't Just Take Our Word For It
              </h2>
              <p className="text-xl text-muted-foreground">
                Hear what our clients have to say
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
                        <p className="font-semibold">{testimonial.name}</p>
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
      <section className="py-20 border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">
                How We Make The Magic Happen
              </h2>
              <p className="text-xl text-muted-foreground">
                Three simple steps to career intelligence
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
      <section className="py-20 bg-muted/30 border-b">
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
      <section className="py-20 border-b">
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
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="container relative mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Trophy className="h-16 w-16 text-primary mx-auto" />
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold">
                Ready to Get Reemployed 3-5X Faster?
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
