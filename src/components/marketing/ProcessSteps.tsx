import { Target, MessageCircle, SlidersHorizontal, FileText, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const steps = [
  {
    number: "01",
    title: "Gap Analysis",
    subtitle: "The Fit Blueprint",
    icon: Target,
    description: "AI reads the job posting and identifies every requirement. Then it scans your resume to find evidence, categorizing each requirement as a Strong Match, Partial Match, or Gap.",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    number: "02",
    title: "Answer Assistant",
    subtitle: "Fill in the Blanks",
    icon: MessageCircle,
    description: "For each gap, AI asks you targeted questions. Your answers—real experiences you may have forgotten—become ammunition for your new resume.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    number: "03",
    title: "Customize Approach",
    subtitle: "Your Voice, Your Way",
    icon: SlidersHorizontal,
    description: "Choose how bold to go (Conservative to Aggressive) and your writing tone (Formal, Conversational, Technical, or Executive). Control every aspect.",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    number: "04",
    title: "Generate Resume",
    subtitle: "AI Writes, You Verify",
    icon: FileText,
    description: "AI creates your optimized resume with evidence tags showing exactly where every claim comes from. Nothing made up—everything traceable.",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    number: "05",
    title: "Hiring Manager Review",
    subtitle: "See Through Their Eyes",
    icon: Users,
    description: "AI simulates a panel of hiring managers reviewing your resume. Get their likely concerns, strengths they'd notice, and questions they'd ask in an interview.",
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
  },
];

export const ProcessSteps = () => {
  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">The Process</Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Five Steps to Your Perfect Resume
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            A systematic approach that transforms your experience into a compelling story for each specific job.
          </p>
        </div>

        <div className="relative">
          {/* Connection Line - Desktop */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 via-purple-500 to-rose-500 -translate-y-1/2 z-0" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <Card
                  key={step.number}
                  className="relative z-10 group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-card"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-12 h-12 rounded-xl ${step.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <Icon className={`w-6 h-6 ${step.color}`} />
                      </div>
                      <span className="text-4xl font-bold text-muted-foreground/20">
                        {step.number}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold mb-1">{step.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{step.subtitle}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
