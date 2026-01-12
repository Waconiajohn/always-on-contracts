import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { 
  Search, 
  ChevronDown, 
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { KeywordCoverageScore } from './KeywordCoverageScore';
import { KeywordInjectionCard } from './KeywordInjectionCard';
import { ATSAlignment } from '../../types';

interface KeywordAnalysisPanelProps {
  atsAlignment: ATSAlignment;
  onApplyKeywordSuggestion?: (suggestion: { keyword: string; whereToAdd: string; template: string }) => void;
  className?: string;
}

export function KeywordAnalysisPanel({ 
  atsAlignment, 
  onApplyKeywordSuggestion,
  className 
}: KeywordAnalysisPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'covered' | 'addable' | 'gaps'>('overview');
  
  const { topKeywords, covered, missingButAddable, missingRequiresExperience } = atsAlignment;
  
  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp, color: '' },
    { id: 'covered', label: `Covered (${covered.length})`, icon: CheckCircle2, color: 'text-emerald-600' },
    { id: 'addable', label: `Addable (${missingButAddable.length})`, icon: Sparkles, color: 'text-amber-600' },
    { id: 'gaps', label: `Gaps (${missingRequiresExperience.length})`, icon: XCircle, color: 'text-red-500' },
  ] as const;
  
  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded} className={className}>
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Search className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <span>Keyword Optimizer</span>
                  <p className="text-sm font-normal text-muted-foreground">
                    {topKeywords.length} key terms • {covered.length} covered • {missingButAddable.length} opportunities
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className={cn(
                    "px-3",
                    covered.length >= topKeywords.length * 0.7 
                      ? "bg-emerald-100 border-emerald-300 text-emerald-700"
                      : covered.length >= topKeywords.length * 0.4
                        ? "bg-amber-100 border-amber-300 text-amber-700"
                        : "bg-red-100 border-red-300 text-red-700"
                  )}
                >
                  {Math.round((covered.length / Math.max(1, topKeywords.length)) * 100)}% ATS Match
                </Badge>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-6 pt-0">
            {/* Tab Navigation */}
            <div className="flex gap-1 p-1 bg-muted rounded-lg">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  size="sm"
                  variant={activeTab === tab.id ? "default" : "ghost"}
                  className={cn(
                    "flex-1 gap-1.5 text-xs",
                    activeTab !== tab.id && tab.color
                  )}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                </Button>
              ))}
            </div>
            
            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {/* Coverage Score */}
                  <KeywordCoverageScore
                    covered={covered.length}
                    addable={missingButAddable.length}
                    missing={missingRequiresExperience.length}
                  />
                  
                  {/* Top Keywords Quick View */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Top Job Keywords</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {topKeywords.map((keyword, idx) => {
                        const isCovered = covered.some(c => c.keyword.toLowerCase() === keyword.toLowerCase());
                        const isAddable = missingButAddable.some(m => m.keyword.toLowerCase() === keyword.toLowerCase());
                        
                        return (
                          <TooltipProvider key={idx}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge 
                                  variant="outline" 
                                  className={cn(
                                    "cursor-help transition-all",
                                    isCovered && "bg-emerald-100 border-emerald-300 text-emerald-700",
                                    isAddable && "bg-amber-100 border-amber-300 text-amber-700",
                                    !isCovered && !isAddable && "bg-red-50 border-red-200 text-red-600"
                                  )}
                                >
                                  {isCovered && <CheckCircle2 className="h-3 w-3 mr-1" />}
                                  {isAddable && <Sparkles className="h-3 w-3 mr-1" />}
                                  {!isCovered && !isAddable && <XCircle className="h-3 w-3 mr-1" />}
                                  {keyword}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                {isCovered && "✓ Found in your resume"}
                                {isAddable && "⚡ Can be naturally added"}
                                {!isCovered && !isAddable && "✗ Requires relevant experience"}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
              
              {activeTab === 'covered' && (
                <motion.div
                  key="covered"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  <p className="text-sm text-muted-foreground">
                    These keywords are already in your resume. Great job! 🎉
                  </p>
                  <div className="grid gap-2">
                    {covered.map((item, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg"
                      >
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                        <span className="font-medium text-emerald-800">{item.keyword}</span>
                        {item.evidenceIds.length > 0 && (
                          <Badge variant="secondary" className="ml-auto text-xs">
                            {item.evidenceIds.length} mention{item.evidenceIds.length !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
              
              {activeTab === 'addable' && (
                <motion.div
                  key="addable"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <KeywordInjectionCard
                    suggestions={missingButAddable}
                    onApplySuggestion={onApplyKeywordSuggestion}
                    className="border-0 bg-transparent p-0"
                  />
                </motion.div>
              )}
              
              {activeTab === 'gaps' && (
                <motion.div
                  key="gaps"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  <p className="text-sm text-muted-foreground">
                    These keywords require actual experience you may not have. Consider if transferable skills apply.
                  </p>
                  <div className="grid gap-2">
                    {missingRequiresExperience.map((item, idx) => (
                      <div 
                        key={idx}
                        className="p-3 bg-red-50 border border-red-200 rounded-lg"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          <span className="font-medium text-red-800">{item.keyword}</span>
                        </div>
                        <p className="text-sm text-red-600 ml-6">{item.whyGap}</p>
                      </div>
                    ))}
                  </div>
                  
                  {missingRequiresExperience.length > 0 && (
                    <div className="p-3 bg-muted rounded-lg mt-4">
                      <p className="text-sm text-muted-foreground">
                        <strong>💡 Tip:</strong> Focus on the "Addable" keywords first. These gaps are secondary priorities.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
