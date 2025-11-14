import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Brain, CheckCircle2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface AuditProgressModalProps {
  open: boolean;
  progress: number;
  currentMessage: string;
  estimatedTimeRemaining?: number;
}

const auditPhases = [
  { icon: Brain, label: "Analyzing vault quality", color: "text-purple-500" },
  { icon: Sparkles, label: "Comparing to benchmarks", color: "text-pink-500" },
  { icon: CheckCircle2, label: "Generating insights", color: "text-green-500" }
];

export const AuditProgressModal = ({ 
  open, 
  progress, 
  currentMessage,
  estimatedTimeRemaining = 30
}: AuditProgressModalProps) => {
  const currentPhaseIndex = Math.floor((progress / 100) * auditPhases.length);
  
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" hideCloseButton>
        <div className="flex flex-col items-center gap-6 py-8">
          {/* Animated Icon */}
          <motion.div
            className="relative"
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl opacity-50 animate-pulse" />
            <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 rounded-full w-24 h-24 flex items-center justify-center shadow-2xl">
              <Brain className="w-12 h-12 text-white" />
            </div>
          </motion.div>

          {/* Title */}
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2">Building Your Intelligence Layer</h2>
            <p className="text-muted-foreground text-sm">
              Analyzing {progress}% complete
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-center text-muted-foreground">
              {currentMessage}
            </p>
          </div>

          {/* Phase Indicators */}
          <div className="flex gap-4 w-full justify-center">
            {auditPhases.map((phase, index) => {
              const Icon = phase.icon;
              const isActive = index === currentPhaseIndex;
              const isComplete = index < currentPhaseIndex;
              
              return (
                <motion.div
                  key={phase.label}
                  className="flex flex-col items-center gap-2"
                  animate={{
                    opacity: isActive ? 1 : 0.4,
                    scale: isActive ? 1.1 : 1
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <div className={`p-3 rounded-full ${isComplete ? 'bg-green-500/20' : isActive ? 'bg-primary/20' : 'bg-muted'}`}>
                    <Icon className={`w-5 h-5 ${isComplete ? 'text-green-500' : isActive ? phase.color : 'text-muted-foreground'}`} />
                  </div>
                  <p className="text-xs text-center max-w-[80px]">{phase.label}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Time Estimate */}
          <p className="text-xs text-muted-foreground">
            Estimated time: ~{estimatedTimeRemaining}s
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
