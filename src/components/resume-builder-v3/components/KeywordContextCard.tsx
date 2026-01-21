// =====================================================
// KEYWORD CONTEXT CARD
// =====================================================
// Displays a keyword with its contextual usage from both documents
// Shows WHERE and HOW the keyword is used, not just that it exists
// =====================================================

import { KeywordContext } from "@/lib/keywordContextExtractor";
import { cn } from "@/lib/utils";
import { Check, AlertTriangle, X } from "lucide-react";
import { motion } from "framer-motion";

interface KeywordContextCardProps {
  context: KeywordContext;
  showDetails?: boolean;
}

export function KeywordContextCard({ context, showDetails = false }: KeywordContextCardProps) {
  const { keyword, jdContext, resumeContext, contextMatch } = context;

  const statusConfig = {
    strong: {
      icon: Check,
      label: "Strong Match",
      borderClass: "border-green-500/30",
      bgClass: "bg-green-500/5",
      iconClass: "text-green-500",
    },
    weak: {
      icon: AlertTriangle,
      label: "Context Mismatch",
      borderClass: "border-amber-500/30",
      bgClass: "bg-amber-500/5",
      iconClass: "text-amber-500",
    },
    missing: {
      icon: X,
      label: "Missing",
      borderClass: "border-destructive/30",
      bgClass: "bg-destructive/5",
      iconClass: "text-destructive",
    },
  };

  const config = statusConfig[contextMatch];
  const Icon = config.icon;

  // Highlight the keyword in context text
  const highlightText = (text: string | null) => {
    if (!text) return null;
    
    const regex = new RegExp(`(${keyword})`, "gi");
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      part.toLowerCase() === keyword.toLowerCase() ? (
        <mark key={i} className="bg-primary/20 text-foreground px-0.5 rounded font-medium">
          {part}
        </mark>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  if (!showDetails) {
    // Compact pill view
    return (
      <motion.span
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
          config.borderClass,
          config.bgClass
        )}
      >
        <Icon className={cn("h-3 w-3", config.iconClass)} />
        {keyword}
      </motion.span>
    );
  }

  // Expanded card view with context
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-lg border p-4 space-y-3",
        config.borderClass,
        config.bgClass
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn("h-4 w-4", config.iconClass)} />
          <span className="font-semibold text-foreground">{keyword}</span>
        </div>
        <span className={cn("text-xs", config.iconClass)}>{config.label}</span>
      </div>

      {/* Context Comparison */}
      <div className="space-y-2 text-sm">
        {jdContext && (
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Job Description
            </span>
            <p className="text-muted-foreground leading-relaxed italic">
              "{highlightText(jdContext)}"
            </p>
          </div>
        )}
        
        {resumeContext ? (
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Your Resume
            </span>
            <p className="text-foreground leading-relaxed">
              "{highlightText(resumeContext)}"
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Your Resume
            </span>
            <p className="text-muted-foreground italic">
              Not found in your resume
            </p>
          </div>
        )}
      </div>

      {/* Insight for weak matches */}
      {contextMatch === "weak" && (
        <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded px-2 py-1">
          💡 The job description uses this keyword with action-oriented language. Consider strengthening how you demonstrate this skill.
        </p>
      )}
    </motion.div>
  );
}
