import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { EvidenceTag } from './EvidenceTag';
import { RequirementCardProps, RISK_COLORS } from './types';
import { useOptimizerStore } from '@/stores/optimizerStore';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Copy, Plus, Check, Lightbulb, RefreshCw, Pencil, X, 
  FileText, AlertTriangle, Target, Sparkles 
} from 'lucide-react';

export function RequirementCard({ entry, getRequirementById, getEvidenceById }: RequirementCardProps) {
  const { toast } = useToast();
  const requirement = getRequirementById(entry.requirementId);
  const addStagedBullet = useOptimizerStore(state => state.addStagedBullet);
  const stagedBullets = useOptimizerStore(state => state.stagedBullets);
  const jobDescription = useOptimizerStore(state => state.jobDescription);
  
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [customText, setCustomText] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  
  if (!requirement) return null;
  
  const displayedLanguage = customText ?? entry.resumeLanguage;
  const isStaged = stagedBullets.some(b => b.text === displayedLanguage);
  
  const handleCopy = async () => {
    if (!displayedLanguage) return;
    
    try {
      await navigator.clipboard.writeText(displayedLanguage);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Resume language copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Please select and copy manually',
        variant: 'destructive'
      });
    }
  };
  
  const handleAddToResume = () => {
    if (!displayedLanguage || isStaged) return;
    
    addStagedBullet({
      text: displayedLanguage,
      requirementId: entry.requirementId,
      sectionHint: 'experience'
    });
    
    toast({
      title: 'Added to Resume Draft',
      description: 'This bullet will be included in your optimized resume',
    });
  };
  
  const handleRegenerate = async () => {
    if (!displayedLanguage || !requirement) return;
    
    setIsRegenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('regenerate-bullet', {
        body: {
          bulletId: entry.requirementId,
          sectionType: requirement.type,
          jobDescription: jobDescription || '',
          currentText: displayedLanguage,
          requirementText: requirement.requirement
        }
      });
      
      if (error) throw error;
      
      if (data?.newText) {
        setCustomText(data.newText);
        toast({
          title: 'Regenerated!',
          description: 'New version created. Click again for another variation.',
        });
      }
    } catch (err) {
      console.error('Regenerate error:', err);
      toast({
        title: 'Regeneration failed',
        description: 'Please try again',
        variant: 'destructive'
      });
    } finally {
      setIsRegenerating(false);
    }
  };
  
  const handleStartEdit = () => {
    setEditText(displayedLanguage || '');
    setIsEditing(true);
  };
  
  const handleSaveEdit = () => {
    if (editText.trim()) {
      setCustomText(editText.trim());
      toast({
        title: 'Saved!',
        description: 'Your edit has been saved.',
      });
    }
    setIsEditing(false);
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditText('');
  };
  
  const getCategoryBorderColor = () => {
    if (entry.category === 'HIGHLY QUALIFIED') return 'border-l-emerald-500';
    if (entry.category === 'PARTIALLY QUALIFIED') return 'border-l-amber-500';
    return 'border-l-red-500';
  };
  
  return (
    <Card className={cn(
      "overflow-hidden border-l-4 shadow-md hover:shadow-lg transition-all",
      getCategoryBorderColor()
    )}>
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-muted/50 to-transparent border-b">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="outline" className="text-xs font-mono bg-background">
                {requirement.id}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {requirement.type}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {requirement.senioritySignal}
              </Badge>
            </div>
            <div className="flex items-start gap-2">
              <Target className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <h4 className="font-semibold text-base">{requirement.requirement}</h4>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={cn("text-xs font-medium", RISK_COLORS[entry.riskLevel])}>
              {entry.riskLevel} Risk
            </Badge>
            <span className="text-xs text-muted-foreground font-medium">{entry.confidence}</span>
          </div>
        </div>
      </div>
      
      <CardContent className="p-6 space-y-5">
        {/* Category-specific content */}
        {entry.category === 'HIGHLY QUALIFIED' && entry.whyQualified && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/50"
          >
            <Sparkles className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-1">Why you're highly qualified:</p>
              <p className="text-base text-foreground/80">{entry.whyQualified}</p>
            </div>
          </motion.div>
        )}
        
        {entry.category === 'PARTIALLY QUALIFIED' && (
          <div className="space-y-4">
            {entry.whyQualified && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/50">
                <FileText className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-1">Partial match:</p>
                  <p className="text-base text-foreground/80">{entry.whyQualified}</p>
                </div>
              </div>
            )}
            {entry.gapExplanation && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-100/50 dark:bg-amber-900/20 border-l-4 border-l-amber-500">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-1">Gap to address:</p>
                  <p className="text-base text-foreground/80">{entry.gapExplanation}</p>
                </div>
              </div>
            )}
          </div>
        )}
        
        {entry.category === 'EXPERIENCE GAP' && (
          <div className="space-y-4">
            {entry.gapExplanation && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-100/50 dark:bg-red-900/20 border-l-4 border-l-red-500">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">Experience gap:</p>
                  <p className="text-base text-foreground/80">{entry.gapExplanation}</p>
                </div>
              </div>
            )}
            {entry.whyQualified && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border border-border/50">
                <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Transferable strengths:</p>
                  <p className="text-base text-foreground/80">{entry.whyQualified}</p>
                </div>
              </div>
            )}
            {entry.bridgingStrategy && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                <Lightbulb className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-primary mb-1">Bridging Strategy:</p>
                  <p className="text-base text-foreground/80">{entry.bridgingStrategy}</p>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Resume Language Box - Prominent */}
        {displayedLanguage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "p-5 rounded-xl border-2 relative overflow-hidden",
              entry.category === 'HIGHLY QUALIFIED' && "bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 border-emerald-300 dark:border-emerald-700",
              entry.category === 'PARTIALLY QUALIFIED' && "bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 border-amber-300 dark:border-amber-700",
              entry.category === 'EXPERIENCE GAP' && "bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-300 dark:border-blue-700"
            )}
          >
            {/* Label */}
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-background/80 shadow-sm">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-bold uppercase tracking-wider text-primary">
                {entry.category === 'EXPERIENCE GAP' ? 'Suggested Bridging Language' : 'Add This to Your Resume'}
              </span>
              {customText && (
                <Badge variant="secondary" className="text-xs ml-auto">Edited</Badge>
              )}
            </div>
            
            {isEditing ? (
              <div className="space-y-3">
                <Textarea 
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="text-base min-h-[100px] bg-background/80"
                  placeholder="Edit your resume bullet..."
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveEdit} className="h-9">
                    <Check className="h-4 w-4 mr-1" /> Save Changes
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancelEdit} className="h-9">
                    <X className="h-4 w-4 mr-1" /> Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-base leading-relaxed mb-4 font-medium">{displayedLanguage}</p>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleRegenerate}
                    disabled={isRegenerating}
                    className="h-9 bg-background/80 hover:bg-background"
                  >
                    <RefreshCw className={cn("h-4 w-4 mr-1.5", isRegenerating && "animate-spin")} />
                    {isRegenerating ? 'Regenerating...' : 'Regenerate'}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleStartEdit}
                    className="h-9 bg-background/80 hover:bg-background"
                  >
                    <Pencil className="h-4 w-4 mr-1.5" /> Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleCopy}
                    className="h-9 bg-background/80 hover:bg-background"
                  >
                    {copied ? <Check className="h-4 w-4 mr-1.5" /> : <Copy className="h-4 w-4 mr-1.5" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleAddToResume}
                    disabled={isStaged}
                    className={cn(
                      "h-9",
                      isStaged && "bg-emerald-600 hover:bg-emerald-600"
                    )}
                  >
                    {isStaged ? <Check className="h-4 w-4 mr-1.5" /> : <Plus className="h-4 w-4 mr-1.5" />}
                    {isStaged ? 'Added!' : 'Add to Resume'}
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        )}
        
        {/* Fallback to rationale */}
        {!entry.whyQualified && entry.rationale && (
          <p className="text-sm text-muted-foreground">{entry.rationale}</p>
        )}
        
        {/* Gap Taxonomy */}
        {entry.gapTaxonomy && entry.gapTaxonomy.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-muted-foreground font-medium">Gap Type:</span>
            {entry.gapTaxonomy.map((gap, idx) => (
              <Badge key={idx} variant="destructive" className="text-xs">
                {gap}
              </Badge>
            ))}
          </div>
        )}
        
        {/* Evidence Citations */}
        {entry.evidenceIds && entry.evidenceIds.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center pt-2 border-t">
            <span className="text-sm text-muted-foreground font-medium">Evidence:</span>
            {entry.evidenceIds.map((evidenceId) => (
              <EvidenceTag 
                key={evidenceId}
                evidenceId={evidenceId} 
                getEvidenceById={getEvidenceById} 
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
