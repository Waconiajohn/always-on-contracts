import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { 
  Sparkles, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp,
  Zap,
  MapPin,
  FileText
} from 'lucide-react';

interface KeywordSuggestion {
  keyword: string;
  whereToAdd: string;
  template: string;
}

interface KeywordInjectionCardProps {
  suggestions: KeywordSuggestion[];
  onApplySuggestion?: (suggestion: KeywordSuggestion) => void;
  className?: string;
}

export function KeywordInjectionCard({ 
  suggestions, 
  onApplySuggestion,
  className 
}: KeywordInjectionCardProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
  if (suggestions.length === 0) return null;
  
  const handleCopy = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };
  
  // Group suggestions by section
  const groupedSuggestions = suggestions.reduce((acc, suggestion) => {
    const section = suggestion.whereToAdd || 'General';
    if (!acc[section]) acc[section] = [];
    acc[section].push(suggestion);
    return acc;
  }, {} as Record<string, KeywordSuggestion[]>);
  
  return (
    <Card className={cn("border-2 border-amber-200 bg-gradient-to-br from-amber-50/50 to-orange-50/50", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-100">
              <Sparkles className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <span>Keyword Injection Suggestions</span>
              <p className="text-sm font-normal text-muted-foreground">
                {suggestions.length} keywords can be naturally added
              </p>
            </div>
          </div>
          <Badge variant="outline" className="bg-amber-100 border-amber-300 text-amber-700">
            <Zap className="h-3 w-3 mr-1" />
            Quick Wins
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(groupedSuggestions).map(([section, sectionSuggestions]) => (
          <div key={section} className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{section}</span>
              <Badge variant="secondary" className="text-xs">
                {sectionSuggestions.length}
              </Badge>
            </div>
            
            <div className="space-y-2">
              {sectionSuggestions.map((suggestion) => {
                const globalIdx = suggestions.indexOf(suggestion);
                const isExpanded = expandedIndex === globalIdx;
                
                return (
                  <motion.div
                    key={globalIdx}
                    layout
                    className={cn(
                      "border rounded-lg bg-background transition-all duration-200",
                      isExpanded ? "border-amber-400 shadow-md" : "border-border hover:border-amber-300"
                    )}
                  >
                    {/* Header - always visible */}
                    <button
                      className="w-full p-3 flex items-center justify-between text-left"
                      onClick={() => setExpandedIndex(isExpanded ? null : globalIdx)}
                    >
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant="outline" 
                          className="bg-amber-100 border-amber-300 text-amber-800 font-mono"
                        >
                          {suggestion.keyword}
                        </Badge>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                    
                    {/* Expanded content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 pb-3 space-y-3 border-t pt-3">
                            {/* Template suggestion */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                <FileText className="h-3 w-3" />
                                Suggested phrasing:
                              </div>
                              <div className="p-3 bg-muted/50 rounded-lg border border-dashed">
                                <p className="text-sm">
                                  {suggestion.template.split(new RegExp(`(${suggestion.keyword})`, 'gi')).map((part, i) => 
                                    part.toLowerCase() === suggestion.keyword.toLowerCase() ? (
                                      <span key={i} className="bg-amber-200 px-1 rounded font-medium">
                                        {part}
                                      </span>
                                    ) : (
                                      <span key={i}>{part}</span>
                                    )
                                  )}
                                </p>
                              </div>
                            </div>
                            
                            {/* Actions */}
                            <div className="flex items-center gap-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="gap-1"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCopy(suggestion.template, globalIdx);
                                      }}
                                    >
                                      {copiedIndex === globalIdx ? (
                                        <>
                                          <Check className="h-3 w-3 text-emerald-600" />
                                          Copied
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="h-3 w-3" />
                                          Copy
                                        </>
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Copy suggested text</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              
                              {onApplySuggestion && (
                                <Button
                                  size="sm"
                                  className="gap-1 bg-amber-600 hover:bg-amber-700"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onApplySuggestion(suggestion);
                                  }}
                                >
                                  <Zap className="h-3 w-3" />
                                  Apply to Draft
                                </Button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
