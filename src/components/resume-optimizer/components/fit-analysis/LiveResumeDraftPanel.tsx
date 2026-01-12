import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  X, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  CheckCircle2,
  Trash2,
  GripVertical
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { StagedBullet } from '../../types';
import { OneClickImproveButton } from './OneClickImproveButton';
import { toast } from 'sonner';

interface LiveResumeDraftPanelProps {
  stagedBullets: StagedBullet[];
  onRemoveBullet: (index: number) => void;
  onUpdateBullet?: (index: number, newText: string) => void;
  onClearAll?: () => void;
  jobDescription?: string;
  className?: string;
}

const SECTION_COLORS: Record<string, string> = {
  experience: 'bg-blue-100 text-blue-800 border-blue-200',
  summary: 'bg-purple-100 text-purple-800 border-purple-200',
  skills: 'bg-green-100 text-green-800 border-green-200',
  achievements: 'bg-amber-100 text-amber-800 border-amber-200',
  education: 'bg-rose-100 text-rose-800 border-rose-200',
};

export const LiveResumeDraftPanel: React.FC<LiveResumeDraftPanelProps> = ({
  stagedBullets,
  onRemoveBullet,
  onUpdateBullet,
  onClearAll,
  jobDescription,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  // Group bullets by section
  const bulletsBySection = stagedBullets.reduce((acc, bullet, idx) => {
    const section = bullet.sectionHint || 'experience';
    if (!acc[section]) acc[section] = [];
    acc[section].push({ ...bullet, originalIndex: idx });
    return acc;
  }, {} as Record<string, (StagedBullet & { originalIndex: number })[]>);

  if (stagedBullets.length === 0 && isMinimized) {
    return null;
  }

  // Minimized floating button
  if (isMinimized) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={cn("fixed bottom-6 right-6 z-50", className)}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => setIsMinimized(false)}
                size="lg"
                className="h-14 w-14 rounded-full shadow-lg relative"
              >
                <FileText className="h-6 w-6" />
                {stagedBullets.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-bold">
                    {stagedBullets.length}
                  </span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Resume Draft ({stagedBullets.length} bullets)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 100, opacity: 0 }}
      className={cn(
        "fixed right-4 top-24 bottom-24 z-40 transition-all duration-300",
        isExpanded ? "w-80" : "w-12",
        className
      )}
    >
      <Card className="h-full shadow-xl border-2 border-primary/20 bg-background/95 backdrop-blur-sm flex flex-col">
        {/* Collapse toggle */}
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-12 w-6 rounded-l-lg rounded-r-none border-r-0 shadow-md"
          >
            {isExpanded ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {isExpanded ? (
            <motion.div
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col h-full"
            >
              <CardHeader className="pb-2 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Live Resume Draft
                  </CardTitle>
                  <div className="flex gap-1">
                    {onClearAll && stagedBullets.length > 0 && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={onClearAll}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Clear all bullets</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsMinimized(true)}
                      className="h-7 w-7 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Badge variant="secondary" className="w-fit text-xs">
                  {stagedBullets.length} bullet{stagedBullets.length !== 1 ? 's' : ''} staged
                </Badge>
              </CardHeader>

              <CardContent className="flex-1 overflow-hidden p-3">
                {stagedBullets.length > 0 ? (
                  <ScrollArea className="h-full pr-2">
                    <div className="space-y-4">
                      {Object.entries(bulletsBySection).map(([section, bullets]) => (
                        <div key={section} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className={cn("text-[10px]", SECTION_COLORS[section] || SECTION_COLORS.experience)}
                            >
                              {section.charAt(0).toUpperCase() + section.slice(1)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              ({bullets.length})
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            {bullets.map((bullet) => (
                              <motion.div
                                key={bullet.originalIndex}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="group relative p-2 rounded-md bg-muted/50 border text-xs hover:bg-muted transition-colors"
                              >
                                <div className="flex gap-1.5">
                                  <GripVertical className="h-3 w-3 text-muted-foreground/50 flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                                  <div className="flex-1 space-y-1.5">
                                    <p className="line-clamp-3 leading-relaxed">
                                      {bullet.text}
                                    </p>
                                    {onUpdateBullet && (
                                      <OneClickImproveButton
                                        bulletText={bullet.text}
                                        jobDescription={jobDescription}
                                        onImproved={(newBullet) => {
                                          onUpdateBullet(bullet.originalIndex, newBullet);
                                          toast.success('Bullet improved!');
                                        }}
                                        variant="inline"
                                      />
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onRemoveBullet(bullet.originalIndex)}
                                    className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4">
                    <Sparkles className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">
                      No bullets staged yet
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      Add bullets from the gap analysis or refine existing evidence
                    </p>
                  </div>
                )}
              </CardContent>

              {/* Footer with stats */}
              {stagedBullets.length > 0 && (
                <div className="p-3 border-t bg-muted/30 flex-shrink-0">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-emerald-600">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Ready for customization</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center py-4"
            >
              <FileText className="h-5 w-5 text-primary mb-2" />
              <div className="writing-mode-vertical text-xs font-medium text-muted-foreground rotate-180" style={{ writingMode: 'vertical-lr' }}>
                Draft ({stagedBullets.length})
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};
