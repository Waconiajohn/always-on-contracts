// =====================================================
// KEYWORDS ANALYSIS SECTION
// =====================================================
// Comprehensive keyword analysis with contextual insights
// Shows strong matches, context mismatches, and missing keywords
// =====================================================

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, AlertTriangle, Check, X } from "lucide-react";
import { extractKeywordContexts } from "@/lib/keywordContextExtractor";
import { KeywordContextCard } from "./KeywordContextCard";
import { Button } from "@/components/ui/button";

interface KeywordsAnalysisProps {
  keywordsFound: string[];
  keywordsMissing: string[];
  jobDescription: string;
  resumeText: string;
}

export function KeywordsAnalysis({
  keywordsFound,
  keywordsMissing,
  jobDescription,
  resumeText,
}: KeywordsAnalysisProps) {
  const [expandedSection, setExpandedSection] = useState<"alerts" | "strong" | "missing" | null>("alerts");
  const [showAllStrong, setShowAllStrong] = useState(false);
  const [showAllMissing, setShowAllMissing] = useState(false);

  const analysis = useMemo(
    () => extractKeywordContexts(keywordsFound, keywordsMissing, jobDescription, resumeText),
    [keywordsFound, keywordsMissing, jobDescription, resumeText]
  );

  const { strongMatches, weakMatches, missing, stats } = analysis;

  const toggleSection = (section: "alerts" | "strong" | "missing") => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Limit displayed items
  const displayedStrong = showAllStrong ? strongMatches : strongMatches.slice(0, 6);
  const displayedMissing = showAllMissing ? missing : missing.slice(0, 6);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-xl border border-border bg-card/50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Keywords Analysis</h3>
        <span className="text-sm text-muted-foreground">
          {stats.strong + stats.weak} of {stats.total} matched
        </span>
      </div>

      {/* Context Alerts - Most Important */}
      {weakMatches.length > 0 && (
        <div className="border-b border-border">
          <button
            onClick={() => toggleSection("alerts")}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="font-medium text-foreground">Context Alerts</span>
              <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                {weakMatches.length} keyword{weakMatches.length !== 1 ? "s" : ""} found but context doesn't match
              </span>
            </div>
            {expandedSection === "alerts" ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          
          <AnimatePresence>
            {expandedSection === "alerts" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="p-4 pt-0 space-y-3">
                  {weakMatches.map((context) => (
                    <KeywordContextCard
                      key={context.keyword}
                      context={context}
                      showDetails
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Strong Matches */}
      <div className="border-b border-border">
        <button
          onClick={() => toggleSection("strong")}
          className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span className="font-medium text-foreground">Strong Matches</span>
            <span className="text-xs text-muted-foreground">
              ({strongMatches.length})
            </span>
          </div>
          {expandedSection === "strong" ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        
        <AnimatePresence>
          {expandedSection === "strong" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-4 pt-0">
                <div className="flex flex-wrap gap-2">
                  {displayedStrong.map((context) => (
                    <KeywordContextCard
                      key={context.keyword}
                      context={context}
                      showDetails={false}
                    />
                  ))}
                </div>
                {strongMatches.length > 6 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAllStrong(!showAllStrong);
                    }}
                    className="mt-2 text-xs"
                  >
                    {showAllStrong ? "Show less" : `Show all ${strongMatches.length}`}
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Missing Keywords */}
      <div>
        <button
          onClick={() => toggleSection("missing")}
          className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <X className="h-4 w-4 text-destructive" />
            <span className="font-medium text-foreground">Missing</span>
            <span className="text-xs text-muted-foreground">
              ({missing.length})
            </span>
          </div>
          {expandedSection === "missing" ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        
        <AnimatePresence>
          {expandedSection === "missing" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-4 pt-0">
                <div className="flex flex-wrap gap-2">
                  {displayedMissing.map((context) => (
                    <KeywordContextCard
                      key={context.keyword}
                      context={context}
                      showDetails={false}
                    />
                  ))}
                </div>
                {missing.length > 6 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAllMissing(!showAllMissing);
                    }}
                    className="mt-2 text-xs"
                  >
                    {showAllMissing ? "Show less" : `Show all ${missing.length}`}
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
