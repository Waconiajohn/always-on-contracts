import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, MessageCircle, SlidersHorizontal, FileText, Users, Check, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const steps = [
  {
    id: 1,
    title: "Gap Analysis",
    icon: Target,
    description: "AI reads the job posting and scans your resume",
  },
  {
    id: 2,
    title: "Answer Assistant",
    icon: MessageCircle,
    description: "Targeted questions fill your gaps",
  },
  {
    id: 3,
    title: "Customization",
    icon: SlidersHorizontal,
    description: "Choose your intensity and tone",
  },
  {
    id: 4,
    title: "Resume Generation",
    icon: FileText,
    description: "AI writes with traceable evidence",
  },
  {
    id: 5,
    title: "Hiring Manager Review",
    icon: Users,
    description: "See through their eyes",
  },
];

const GapAnalysisScene = () => {
  const [scanProgress, setScanProgress] = useState(0);
  const [matches, setMatches] = useState<number[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setScanProgress((prev) => Math.min(prev + 2, 100));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scanProgress > 30 && !matches.includes(1)) setMatches((m) => [...m, 1]);
    if (scanProgress > 50 && !matches.includes(2)) setMatches((m) => [...m, 2]);
    if (scanProgress > 70 && !matches.includes(3)) setMatches((m) => [...m, 3]);
  }, [scanProgress, matches]);

  const requirements = [
    { text: "10+ years leadership experience", match: "strong" },
    { text: "P&L management $50M+", match: "partial" },
    { text: "Digital transformation", match: "gap" },
  ];

  return (
    <div className="grid md:grid-cols-2 gap-6 p-6">
      <div className="space-y-3">
        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Job Requirements</div>
        {requirements.map((req, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: matches.includes(i + 1) ? 1 : 0.3, x: 0 }}
            transition={{ delay: i * 0.3 }}
            className={`p-3 rounded-lg border text-sm ${
              matches.includes(i + 1)
                ? req.match === "strong"
                  ? "border-green-500/50 bg-green-500/10"
                  : req.match === "partial"
                  ? "border-amber-500/50 bg-amber-500/10"
                  : "border-red-500/50 bg-red-500/10"
                : "border-border/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span>{req.text}</span>
              {matches.includes(i + 1) && (
                <Badge variant={req.match === "strong" ? "default" : req.match === "partial" ? "secondary" : "destructive"} className="text-xs">
                  {req.match === "strong" ? "Strong Match" : req.match === "partial" ? "Partial" : "Gap"}
                </Badge>
              )}
            </div>
          </motion.div>
        ))}
      </div>
      <div className="space-y-3">
        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Scanning Resume...</div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-accent"
            initial={{ width: 0 }}
            animate={{ width: `${scanProgress}%` }}
          />
        </div>
        <div className="text-xs text-muted-foreground">{scanProgress}% complete</div>
      </div>
    </div>
  );
};

const AnswerAssistantScene = () => {
  const [showQuestion, setShowQuestion] = useState(false);
  const [typingAnswer, setTypingAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const fullAnswer = "Led $3M digital transformation initiative at Acme Corp...";

  useEffect(() => {
    const timer1 = setTimeout(() => setShowQuestion(true), 500);
    const timer2 = setTimeout(() => {
      let i = 0;
      const typing = setInterval(() => {
        if (i < fullAnswer.length) {
          setTypingAnswer(fullAnswer.slice(0, i + 1));
          i++;
        } else {
          clearInterval(typing);
          setTimeout(() => setShowResult(true), 500);
        }
      }, 30);
    }, 1500);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <AnimatePresence>
          {showQuestion && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-muted/50 rounded-lg p-4 max-w-md"
            >
              <p className="text-sm">I noticed a gap in digital transformation experience. Can you tell me about any technology initiatives you've led?</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {typingAnswer && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="ml-11 bg-primary/10 rounded-lg p-4 max-w-md"
        >
          <p className="text-sm">{typingAnswer}<span className="animate-pulse">|</span></p>
        </motion.div>
      )}
      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="ml-11 flex items-center gap-2 text-sm text-green-600"
          >
            <Check className="w-4 h-4" />
            <span>Answer added to your Bullet Bank</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CustomizationScene = () => {
  const [intensity, setIntensity] = useState(0);
  const [tone, setTone] = useState(0);
  const intensityLabels = ["Conservative", "Moderate", "Aggressive"];
  const toneLabels = ["Formal", "Conversational", "Technical", "Executive"];

  useEffect(() => {
    const interval = setInterval(() => {
      setIntensity((prev) => (prev + 1) % 3);
      setTimeout(() => setTone((prev) => (prev + 1) % 4), 500);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-3">
        <div className="text-sm font-medium">Optimization Intensity</div>
        <div className="flex gap-2">
          {intensityLabels.map((label, i) => (
            <motion.div
              key={label}
              animate={{ scale: intensity === i ? 1.05 : 1 }}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                intensity === i ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}
            >
              {label}
            </motion.div>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <div className="text-sm font-medium">Writing Tone</div>
        <div className="flex flex-wrap gap-2">
          {toneLabels.map((label, i) => (
            <motion.div
              key={label}
              animate={{ scale: tone === i ? 1.05 : 1 }}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                tone === i ? "bg-accent text-accent-foreground" : "bg-muted"
              }`}
            >
              {label}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ResumeGenerationScene = () => {
  const [lines, setLines] = useState<string[]>([]);
  const resumeLines = [
    "Chief Operating Officer | Digital Transformation Leader",
    "Delivered $47M revenue growth through operational excellence",
    "Led 150+ person organization across 3 global regions",
  ];

  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];
    resumeLines.forEach((line, i) => {
      const timeout = setTimeout(() => setLines((prev) => [...prev, line]), (i + 1) * 800);
      timeouts.push(timeout);
    });
    return () => timeouts.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full"
        />
        <span>AI Writing Your Resume...</span>
      </div>
      <div className="bg-card border rounded-lg p-4 space-y-3 min-h-[120px]">
        {lines.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2"
          >
            <span className="text-sm">{line}</span>
            <Badge variant="outline" className="shrink-0 text-xs bg-green-500/10 text-green-600 border-green-500/30">
              Evidence
            </Badge>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const HiringManagerScene = () => {
  const [messages, setMessages] = useState<number[]>([]);
  const feedback = [
    { name: "Sarah Chen", role: "VP Talent", message: "Strong executive presence in the summary" },
    { name: "Michael Torres", role: "COO", message: "Would want to dig into the P&L details" },
    { name: "Lisa Park", role: "CHRO", message: "Impressive digital transformation story" },
  ];

  useEffect(() => {
    feedback.forEach((_, i) => {
      setTimeout(() => setMessages((prev) => [...prev, i]), (i + 1) * 1000);
    });
  }, []);

  return (
    <div className="p-6 space-y-4">
      <div className="text-sm text-muted-foreground">Simulating hiring manager review...</div>
      <div className="space-y-3">
        {feedback.map((item, i) => (
          <AnimatePresence key={i}>
            {messages.includes(i) && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-3 bg-muted/50 rounded-lg p-3"
              >
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">
                  {item.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <div className="text-sm font-medium">{item.name}</div>
                  <div className="text-xs text-muted-foreground">{item.role}</div>
                  <div className="text-sm mt-1">"{item.message}"</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        ))}
      </div>
    </div>
  );
};

const scenes = [
  GapAnalysisScene,
  AnswerAssistantScene,
  CustomizationScene,
  ResumeGenerationScene,
  HiringManagerScene,
];

export const AnimatedWalkthrough = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const CurrentScene = scenes[currentStep];

  return (
    <section className="py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">See It In Action</Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Watch the AI Work
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            See how our AI analyzes, questions, and writes—all grounded in your actual experience.
          </p>
        </div>

        <div
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* App Window Mockup */}
          <div className="bg-card border rounded-xl shadow-2xl overflow-hidden">
            {/* Window Header */}
            <div className="bg-muted/50 border-b px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="flex-1 text-center text-sm text-muted-foreground">
                Resume Optimizer
              </div>
            </div>

            {/* Step Indicator */}
            <div className="border-b px-4 py-2 flex items-center gap-4 overflow-x-auto">
              {steps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <button
                    key={step.id}
                    onClick={() => setCurrentStep(i)}
                    aria-label={`Go to ${step.title}`}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                      currentStep === i
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{step.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Scene Content */}
            <div className="min-h-[300px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <CurrentScene />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Progress Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {steps.map((step, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                aria-label={`Go to step ${i + 1}: ${step.title}`}
                className={`w-2 h-2 rounded-full transition-all ${
                  currentStep === i ? "w-8 bg-primary" : "bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>

          {isPaused && (
            <div className="absolute top-4 right-4 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded">
              Paused - hover to explore
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
