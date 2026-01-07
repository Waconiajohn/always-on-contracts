import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Shield, 
  Sparkles, 
  ArrowRight, 
  FileCheck, 
  Download, 
  History, 
  Edit, 
  CheckCircle2,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AnimatedWalkthrough } from "@/components/marketing/AnimatedWalkthrough";
import { ComparisonTable } from "@/components/marketing/ComparisonTable";
import { ProcessSteps } from "@/components/marketing/ProcessSteps";

const ResumeOptimizerMarketing = () => {
  const navigate = useNavigate();

  const scrollToWalkthrough = () => {
    document.getElementById("walkthrough")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32 px-4">
        {/* Background Decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/20 rounded-full blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="outline" className="mb-6 px-4 py-1.5">
              <Shield className="w-3.5 h-3.5 mr-1.5" />
              Zero fabrication. 100% your story, better told.
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
          >
            Your Resume, Rewritten by AI.{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Grounded in Your Truth.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10"
          >
            The only resume builder that analyzes real job requirements, fills your gaps 
            with your actual experience, and creates a resume so aligned that hiring managers 
            can't ignore you.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button 
              size="lg" 
              className="text-lg px-8 py-6"
              onClick={() => navigate("/agents/resume-builder-v2")}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Build My Resume
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-6"
              onClick={scrollToWalkthrough}
            >
              Watch How It Works
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
            You're Qualified. Your Resume Just Doesn't Show It.
          </h2>
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div className="text-center">
              <div className="text-5xl font-bold text-primary mb-2">6</div>
              <div className="text-sm text-muted-foreground">Seconds average resume scan time</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-primary mb-2">75%</div>
              <div className="text-sm text-muted-foreground">Resumes filtered by ATS before humans see them</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-primary mb-2">98%</div>
              <div className="text-sm text-muted-foreground">Of generic AI resumes sound exactly alike</div>
            </div>
          </div>
        </div>
      </section>

      {/* Animated Walkthrough */}
      <div id="walkthrough">
        <AnimatedWalkthrough />
      </div>

      {/* Process Steps */}
      <ProcessSteps />

      {/* Zero Hallucination Promise */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
            We Never Make Things Up
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            Unlike generic AI tools that often fabricate credentials and exaggerate achievements, 
            every single bullet point in your Resume Optimizer output is traceable back to something 
            you actually said or wrote.
          </p>
          <div className="bg-card border rounded-xl p-6 max-w-xl mx-auto">
            <div className="flex items-start gap-4 text-left">
              <div className="flex-1">
                <p className="text-sm mb-2">
                  "Delivered $47M revenue growth through operational excellence initiatives..."
                </p>
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Source: Your resume, line 12 + Answer #3
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <ComparisonTable />

      {/* What You Get Section */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">Deliverables</Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              What You Get
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: FileCheck, title: "ATS-Optimized Resume", description: "Formatted to pass automated screening systems" },
              { icon: Download, title: "Multiple Formats", description: "Export as PDF, Word, or plain text" },
              { icon: History, title: "Version History", description: "Track every change with detailed changelog" },
              { icon: Edit, title: "Edit Anytime", description: "Full control to refine and customize" },
            ].map((item) => (
              <Card key={item.title} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">19+</div>
              <div className="text-muted-foreground">Years of career coaching methodology</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">100K+</div>
              <div className="text-muted-foreground">Executives helped advance their careers</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">15 min</div>
              <div className="text-muted-foreground">Average time to optimized resume</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="max-w-3xl mx-auto text-center">
          <Zap className="w-12 h-12 text-primary mx-auto mb-6" />
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
            Build Your Must-Interview Resume in 15 Minutes
          </h2>
          <p className="text-lg text-muted-foreground mb-10">
            Stop sending generic resumes. Start landing interviews.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="text-lg px-8 py-6"
              onClick={() => navigate("/agents/resume-builder-v2")}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Start Building Now
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-6"
              onClick={() => navigate("/quick-score")}
            >
              Try Quick Score Free First
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">FAQ</Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Common Questions
            </h2>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>How is this different from ChatGPT?</AccordionTrigger>
              <AccordionContent>
                ChatGPT generates generic content based on patterns. Resume Optimizer analyzes 
                the specific job you're applying for, maps requirements against your actual 
                experience, asks you targeted questions to fill gaps, and ensures every claim 
                is traceable to something you said. No fabrication, no hallucination.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Do you make things up or exaggerate?</AccordionTrigger>
              <AccordionContent>
                Never. Every bullet point in your generated resume includes an evidence tag 
                showing exactly where that information came from—either your original resume 
                or answers you provided during the process. We transform your story, we don't 
                invent one.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>How long does it take?</AccordionTrigger>
              <AccordionContent>
                Most users complete the entire process in about 15 minutes. The Gap Analysis 
                is instant, questions are targeted to only what's missing, and resume generation 
                takes seconds. Compare that to days waiting for a traditional resume writer.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger>Can I edit the resume afterwards?</AccordionTrigger>
              <AccordionContent>
                Absolutely. You have full control to edit, refine, and customize your resume 
                at any time. We also maintain complete version history so you can track changes 
                or revert if needed.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-5">
              <AccordionTrigger>What if I don't have all the experience?</AccordionTrigger>
              <AccordionContent>
                That's exactly what the Answer Assistant is for. Often, you have relevant 
                experience you've forgotten about or haven't thought to include. Our targeted 
                questions help surface hidden competencies and transferable skills. If a true 
                gap exists, we'll show you—we don't pretend you have experience you don't.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-6">
              <AccordionTrigger>Is the resume ATS-friendly?</AccordionTrigger>
              <AccordionContent>
                Yes. Every resume is formatted to pass Applicant Tracking Systems, with proper 
                headings, keywords from the job description, and clean formatting that both 
                machines and humans can read easily.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>
    </div>
  );
};

export default ResumeOptimizerMarketing;
