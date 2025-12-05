/**
 * ExportCelebration - Beautiful export experience with celebration
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Download,
  FileText,
  File,
  Copy,
  Check,
  Share2,
  ArrowLeft,
  Loader2,
  Trophy,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateTier, type ScoreBreakdown } from '../types';

interface ExportCelebrationProps {
  finalScore: number;
  scores: ScoreBreakdown;
  resumeContent: string;
  onExport: (format: 'pdf' | 'docx' | 'txt') => Promise<void>;
  onBack: () => void;
  onStartNew: () => void;
}

export function ExportCelebration({
  finalScore,
  scores,
  resumeContent,
  onExport,
  onBack,
  onStartNew
}: ExportCelebrationProps) {
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [exportedFormats, setExportedFormats] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const tier = calculateTier(finalScore);
  const isBenchmarkAchieved = finalScore >= 90;

  // Show confetti for benchmark achievement
  useEffect(() => {
    if (isBenchmarkAchieved) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isBenchmarkAchieved]);

  const handleExport = async (format: 'pdf' | 'docx' | 'txt') => {
    setIsExporting(format);
    try {
      await onExport(format);
      setExportedFormats(prev => new Set([...prev, format]));
    } finally {
      setIsExporting(null);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(resumeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportOptions = [
    { 
      format: 'pdf' as const, 
      label: 'PDF', 
      icon: <FileText className="h-5 w-5" />,
      description: 'Best for applications',
      recommended: true
    },
    { 
      format: 'docx' as const, 
      label: 'Word', 
      icon: <File className="h-5 w-5" />,
      description: 'Easy to edit later'
    },
    { 
      format: 'txt' as const, 
      label: 'Plain Text', 
      icon: <FileText className="h-5 w-5" />,
      description: 'For copy-paste'
    }
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Confetti Animation (simplified CSS) */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                backgroundColor: ['#ff0', '#f0f', '#0ff', '#0f0', '#f00'][Math.floor(Math.random() * 5)]
              }}
              initial={{ y: -20, opacity: 1 }}
              animate={{ 
                y: window.innerHeight + 20,
                x: (Math.random() - 0.5) * 200,
                rotate: Math.random() * 720,
                opacity: 0
              }}
              transition={{ 
                duration: 2 + Math.random() * 2,
                delay: Math.random() * 0.5,
                ease: 'easeOut'
              }}
            />
          ))}
        </div>
      )}

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Celebration Header */}
          <motion.div 
            className="text-center space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {isBenchmarkAchieved ? (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                >
                  <Trophy className="h-20 w-20 mx-auto text-amber-500" />
                </motion.div>
                <h2 className="text-3xl font-bold">
                  🎉 Benchmark Achieved!
                </h2>
                <p className="text-lg text-muted-foreground">
                  Your resume is in the top tier. You're ready to stand out!
                </p>
              </>
            ) : (
              <>
                <Sparkles className="h-16 w-16 mx-auto text-primary" />
                <h2 className="text-3xl font-bold">Resume Complete!</h2>
                <p className="text-lg text-muted-foreground">
                  Great progress! Your resume is ready for download.
                </p>
              </>
            )}
          </motion.div>

          {/* Final Score Display */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className={cn(
              "overflow-hidden",
              isBenchmarkAchieved && "ring-2 ring-amber-400"
            )}>
              <div className={cn(
                "p-6 text-center",
                tier.tier === 'ON_FIRE' && "bg-gradient-to-r from-red-500 to-orange-500 text-white",
                tier.tier === 'HOT' && "bg-gradient-to-r from-orange-500 to-amber-500 text-white",
                tier.tier === 'WARM' && "bg-gradient-to-r from-amber-400 to-yellow-400 text-black",
                tier.tier === 'LUKEWARM' && "bg-gradient-to-r from-yellow-300 to-yellow-200 text-black",
                tier.tier === 'COLD' && "bg-gradient-to-r from-blue-400 to-blue-500 text-white",
                tier.tier === 'FREEZING' && "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
              )}>
                <p className="text-sm opacity-80 mb-2">Final Score</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-6xl font-bold">{Math.round(finalScore)}</span>
                  <span className="text-4xl">{tier.emoji}</span>
                </div>
                <p className="mt-2 font-medium">{tier.message}</p>
              </div>
              <CardContent className="p-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold">{scores.ats}%</p>
                    <p className="text-xs text-muted-foreground">ATS Score</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{scores.requirements}%</p>
                    <p className="text-xs text-muted-foreground">Match Score</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{scores.competitive}%</p>
                    <p className="text-xs text-muted-foreground">Competitive</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Export Options */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold text-center">Download Your Resume</h3>
            <div className="grid grid-cols-3 gap-4">
              {exportOptions.map((option) => {
                const isExported = exportedFormats.has(option.format);
                const isCurrentlyExporting = isExporting === option.format;

                return (
                  <Button
                    key={option.format}
                    variant={isExported ? "secondary" : option.recommended ? "default" : "outline"}
                    className={cn(
                      "h-auto flex-col py-4 gap-2 relative",
                      option.recommended && !isExported && "ring-2 ring-primary ring-offset-2"
                    )}
                    onClick={() => handleExport(option.format)}
                    disabled={isCurrentlyExporting}
                  >
                    {option.recommended && !isExported && (
                      <Badge className="absolute -top-2 -right-2 text-xs">
                        Recommended
                      </Badge>
                    )}
                    {isCurrentlyExporting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : isExported ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : (
                      option.icon
                    )}
                    <span className="font-medium">{option.label}</span>
                    <span className="text-xs opacity-70">{option.description}</span>
                  </Button>
                );
              })}
            </div>
          </motion.div>

          {/* Additional Actions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex items-center justify-center gap-4"
          >
            <Button variant="outline" onClick={handleCopy} className="gap-2">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy Text'}
            </Button>
            <Button variant="outline" className="gap-2">
              <Share2 className="h-4 w-4" />
              Share Score
            </Button>
          </motion.div>

          {/* Start New */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="text-center pt-4"
          >
            <Button variant="ghost" onClick={onStartNew} className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Score Another Resume
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t px-6 py-4 bg-muted/30 flex justify-between">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Review
        </Button>
        <Button onClick={() => handleExport('pdf')} className="gap-2">
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
      </div>
    </div>
  );
}
