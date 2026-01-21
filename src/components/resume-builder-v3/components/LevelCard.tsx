// =====================================================
// LEVEL CARD - Premium Minimal Design
// =====================================================
// Individual acceptance level display with expandable details
// =====================================================

import { useState } from "react";
import { LevelScore } from "@/types/resume-builder-v3";
import { cn } from "@/lib/utils";
import { ChevronDown, Check, AlertTriangle, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LevelCardProps {
  levelScore: LevelScore;
  index: number;
}

const STATUS_CONFIG = {
  passing: {
    icon: Check,
    iconClass: "text-primary",
    bgClass: "bg-primary/5",
    borderClass: "border-primary/20",
  },
  needs_work: {
    icon: AlertTriangle,
    iconClass: "text-amber-500",
    bgClass: "bg-amber-500/5",
    borderClass: "border-amber-500/20",
  },
  critical: {
    icon: Zap,
    iconClass: "text-destructive",
    bgClass: "bg-destructive/5", 
    borderClass: "border-destructive/20",
  },
};

export function LevelCard({ levelScore, index }: LevelCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = STATUS_CONFIG[levelScore.status];
  const StatusIcon = config.icon;

  const hasDetails = levelScore.blockers.length > 0 || levelScore.actions.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      className={cn(
        "rounded-lg border p-4 transition-all duration-200",
        config.bgClass,
        config.borderClass,
        hasDetails && "cursor-pointer hover:border-primary/40"
      )}
      onClick={() => hasDetails && setIsExpanded(!isExpanded)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <StatusIcon className={cn("h-4 w-4 flex-shrink-0", config.iconClass)} />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
              {levelScore.label}
            </span>
          </div>
          
          {/* Score */}
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-light text-foreground tabular-nums">
              {levelScore.score}
            </span>
            <span className="text-sm text-muted-foreground">%</span>
          </div>
        </div>

        {hasDetails && (
          <ChevronDown 
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform flex-shrink-0 mt-1",
              isExpanded && "rotate-180"
            )} 
          />
        )}
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-1 bg-border/50 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${levelScore.score}%` }}
          transition={{ delay: index * 0.1 + 0.3, duration: 0.6, ease: "easeOut" }}
          className={cn(
            "h-full rounded-full",
            levelScore.status === "passing" && "bg-primary",
            levelScore.status === "needs_work" && "bg-amber-500",
            levelScore.status === "critical" && "bg-destructive"
          )}
        />
      </div>

      {/* Expandable details */}
      <AnimatePresence>
        {isExpanded && hasDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-4 space-y-3 border-t border-border/50 mt-4">
              {/* Description */}
              <p className="text-sm text-muted-foreground">
                {levelScore.description}
              </p>

              {/* Blockers */}
              {levelScore.blockers.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Blockers
                  </span>
                  <ul className="space-y-1">
                    {levelScore.blockers.map((blocker, i) => (
                      <li key={i} className="text-sm text-foreground flex items-start gap-2">
                        <span className="text-destructive mt-0.5">•</span>
                        {blocker}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              {levelScore.actions.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Quick Wins
                  </span>
                  <ul className="space-y-1">
                    {levelScore.actions.map((action, i) => (
                      <li key={i} className="text-sm text-foreground flex items-start gap-2">
                        <span className="text-primary mt-0.5">→</span>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
