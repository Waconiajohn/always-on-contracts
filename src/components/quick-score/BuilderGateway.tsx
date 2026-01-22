/**
 * BuilderGateway - CTA section with mini-roadmap
 * Leads users from Quick Score into Resume Builder
 */

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check, MessageSquare, FileText, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface BuilderGatewayProps {
  score: number;
  gapCount?: number;
  onStartBuilder: () => void;
  onScoreAnother: () => void;
}

export function BuilderGateway({ score, gapCount, onStartBuilder, onScoreAnother }: BuilderGatewayProps) {
  const pointsToMustInterview = Math.max(0, 91 - score);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      className="space-y-6"
    >
      {/* Main CTA Card */}
      <div className="border border-border rounded-xl bg-gradient-to-br from-card to-primary/5 p-6 md:p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-lg font-medium text-foreground">
            Your résumé scores <span className="text-primary">{score}/100</span>
          </p>
          {pointsToMustInterview > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              You're <span className="font-medium text-foreground">{pointsToMustInterview} points</span> away from "Must-Interview" status
            </p>
          )}
        </div>

        {/* Mini Roadmap */}
        <div className="flex items-center justify-center gap-2 md:gap-4 mb-8">
          {/* Step 1 - Complete */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <Check className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium text-primary">Score</span>
          </div>

          {/* Connector */}
          <div className="h-0.5 w-8 md:w-16 bg-border" />

          {/* Step 2 */}
          <div className="flex flex-col items-center gap-2 relative">
            <div className="w-10 h-10 rounded-full border-2 border-muted-foreground/30 text-muted-foreground flex items-center justify-center">
              <MessageSquare className="h-5 w-5" />
            </div>
            <span className="text-xs text-muted-foreground">Answer 3 Qs</span>
            {gapCount !== undefined && gapCount > 0 && (
              <Badge 
                variant="secondary" 
                className="absolute -top-1 -right-2 h-5 min-w-5 px-1.5 text-[10px] font-medium animate-pulse"
              >
                {gapCount}
              </Badge>
            )}
          </div>

          {/* Connector */}
          <div className="h-0.5 w-8 md:w-16 bg-border" />

          {/* Step 3 */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full border-2 border-muted-foreground/30 text-muted-foreground flex items-center justify-center">
              <FileText className="h-5 w-5" />
            </div>
            <span className="text-xs text-muted-foreground">Get Résumé</span>
          </div>
        </div>

        {/* Value proposition */}
        <p className="text-center text-sm text-muted-foreground mb-6">
          Answer 3 quick questions to fill the gaps, then we'll generate an optimized résumé. 
          <span className="font-medium text-foreground"> Takes ~5 minutes.</span>
        </p>

        {/* Primary CTA */}
        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            onClick={onStartBuilder}
            className="w-full gap-2 h-12 text-base"
          >
            <Sparkles className="h-4 w-4" />
            Fix My Résumé
            <ArrowRight className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            onClick={onScoreAnother}
            className="text-muted-foreground hover:text-foreground"
          >
            Score Another Résumé
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
