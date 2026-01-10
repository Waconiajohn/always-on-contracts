import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { EvidenceTag } from './EvidenceTag';
import { BulletOptionsPanel, BulletOption } from './BulletOptionsPanel';
import { DisputeGapModal, DisputeResult } from './DisputeGapModal';
import { RequirementCardProps } from './types';
import { useOptimizerStore } from '@/stores/optimizerStore';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Copy, Plus, Check, Lightbulb, RefreshCw, Pencil, X, 
  FileText, AlertTriangle, Target, Sparkles, Wand2, MessageSquarePlus
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
  const [isGeneratingOptions, setIsGeneratingOptions] = useState(false);
  const [customText, setCustomText] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [bulletOptions, setBulletOptions] = useState<BulletOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | undefined>();
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeResult, setDisputeResult] = useState<DisputeResult | null>(null);
  
  if (!requirement) return null;
  
  const displayedLanguage = customText ?? entry.resumeLanguage;
  const isStaged = stagedBullets.some(b => b.text === displayedLanguage);
  
  // Determine effective category (may be updated by dispute)
  const effectiveCategory = disputeResult?.categoryChanged 
    ? disputeResult.newCategory 
    : entry.category;
  
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
        setBulletOptions([]); // Clear options when regenerating single
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

  const handleGenerateOptions = async () => {
    if (!requirement) return;
    
    setIsGeneratingOptions(true);
    setBulletOptions([]);
    setSelectedOption(undefined);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-bullet-options', {
        body: {
          requirementText: requirement.requirement,
          currentBullet: displayedLanguage,
          jobDescription: jobDescription || '',
          evidenceContext: entry.evidenceIds?.map(id => {
            const ev = getEvidenceById(id);
            return ev ? `${ev.id}: ${ev.text}` : '';
          }).filter(Boolean).join('\n'),
          gapExplanation: entry.gapExplanation,
          bridgingStrategy: entry.bridgingStrategy
        }
      });
      
      if (error) throw error;
      
      if (data?.options) {
        setBulletOptions(data.options);
        toast({
          title: '3 Options Generated!',
          description: 'Choose your preferred style below.',
        });
      }
    } catch (err) {
      console.error('Generate options error:', err);
      toast({
        title: 'Generation failed',
        description: 'Please try again',
        variant: 'destructive'
      });
    } finally {
      setIsGeneratingOptions(false);
    }
  };

  const handleSelectOption = (option: BulletOption) => {
    setSelectedOption(option.id);
    setCustomText(option.bullet);
    toast({
      title: `Option ${option.id} selected`,
      description: option.label,
    });
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

  const handleDisputeResolved = (result: DisputeResult) => {
    setDisputeResult(result);
    if (result.suggestedBullet) {
      setCustomText(result.suggestedBullet);
    }
  };
  
  // Professional neutral color scheme - only subtle left border for category
  const getCategoryBorderColor = () => {
    if (effectiveCategory === 'HIGHLY QUALIFIED') return 'border-l-primary';
    if (effectiveCategory === 'PARTIALLY QUALIFIED') return 'border-l-muted-foreground';
    return 'border-l-muted-foreground/50';
  };

  const getCategoryBadge = () => {
    if (effectiveCategory === 'HIGHLY QUALIFIED') {
      return <Badge variant="outline" className="text-xs border-primary/50 text-primary bg-primary/5">Strong Match</Badge>;
    }
    if (effectiveCategory === 'PARTIALLY QUALIFIED') {
      return <Badge variant="outline" className="text-xs border-muted-foreground/50 text-muted-foreground">Partial Match</Badge>;
    }
    return <Badge variant="outline" className="text-xs border-muted-foreground/30 text-muted-foreground">Gap</Badge>;
  };
  
  return (
    <>
      <Card className={cn(
        "overflow-hidden border-l-4 shadow-sm hover:shadow-md transition-all bg-card",
        getCategoryBorderColor()
      )}>
        {/* Header - Clean, minimal */}
        <div className="px-6 py-4 border-b bg-muted/30">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge variant="secondary" className="text-xs font-mono">
                  {requirement.id}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {requirement.type}
                </Badge>
                {getCategoryBadge()}
              </div>
              <div className="flex items-start gap-2">
                <Target className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <h4 className="font-medium text-base text-foreground">{requirement.requirement}</h4>
              </div>
            </div>
          </div>
        </div>
        
        <CardContent className="p-6 space-y-5">
          {/* Category-specific content - Neutral styling */}
          {effectiveCategory === 'HIGHLY QUALIFIED' && (entry.whyQualified || disputeResult?.newWhyQualified) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border border-border"
            >
              <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-primary mb-1">Why you're qualified:</p>
                <p className="text-sm text-foreground/80">{disputeResult?.newWhyQualified || entry.whyQualified}</p>
              </div>
            </motion.div>
          )}
          
          {effectiveCategory === 'PARTIALLY QUALIFIED' && (
            <div className="space-y-3">
              {(entry.whyQualified || disputeResult?.newWhyQualified) && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 border border-border">
                  <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">What you have:</p>
                    <p className="text-sm text-foreground/80">{disputeResult?.newWhyQualified || entry.whyQualified}</p>
                  </div>
                </div>
              )}
              {(entry.gapExplanation || disputeResult?.newGapExplanation) && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border-l-4 border-l-muted-foreground/50 border border-border">
                  <AlertTriangle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground mb-1">What's missing:</p>
                    <p className="text-sm text-foreground/80">{disputeResult?.newGapExplanation || entry.gapExplanation}</p>
                    {/* Dispute Button */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3 h-8 text-xs"
                      onClick={() => setShowDisputeModal(true)}
                    >
                      <MessageSquarePlus className="h-3 w-3 mr-1.5" />
                      I have this skill
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {effectiveCategory === 'EXPERIENCE GAP' && (
            <div className="space-y-3">
              {(entry.gapExplanation || disputeResult?.newGapExplanation) && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border-l-4 border-l-muted-foreground/30 border border-border">
                  <AlertTriangle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground mb-1">Experience Gap:</p>
                    <p className="text-sm text-foreground/80">{disputeResult?.newGapExplanation || entry.gapExplanation}</p>
                    {/* Dispute Button */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3 h-8 text-xs"
                      onClick={() => setShowDisputeModal(true)}
                    >
                      <MessageSquarePlus className="h-3 w-3 mr-1.5" />
                      Actually, I have this
                    </Button>
                  </div>
                </div>
              )}
              {entry.whyQualified && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 border border-border">
                  <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Transferable strengths:</p>
                    <p className="text-sm text-foreground/80">{entry.whyQualified}</p>
                  </div>
                </div>
              )}
              {entry.bridgingStrategy && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <Lightbulb className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-primary mb-1">Bridging Strategy:</p>
                    <p className="text-sm text-foreground/80">{entry.bridgingStrategy}</p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Bullet Options Panel */}
          {(bulletOptions.length > 0 || isGeneratingOptions) && (
            <BulletOptionsPanel
              options={bulletOptions}
              isLoading={isGeneratingOptions}
              onSelect={handleSelectOption}
              selectedId={selectedOption}
            />
          )}
          
          {/* Resume Language Box - Clean, professional */}
          {displayedLanguage && !bulletOptions.length && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-xl border-2 border-border bg-card relative overflow-hidden"
            >
              {/* Label */}
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-muted">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {effectiveCategory === 'EXPERIENCE GAP' ? 'Suggested Bridging Language' : 'Resume Bullet'}
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
                    className="text-sm min-h-[100px] bg-background"
                    placeholder="Edit your resume bullet..."
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveEdit} className="h-8">
                      <Check className="h-3 w-3 mr-1" /> Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancelEdit} className="h-8">
                      <X className="h-3 w-3 mr-1" /> Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm leading-relaxed mb-4">{displayedLanguage}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handleGenerateOptions}
                      disabled={isGeneratingOptions}
                      className="h-8 text-xs"
                    >
                      <Wand2 className={cn("h-3 w-3 mr-1.5", isGeneratingOptions && "animate-spin")} />
                      {isGeneratingOptions ? 'Generating...' : '3 Options'}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handleRegenerate}
                      disabled={isRegenerating}
                      className="h-8 text-xs"
                    >
                      <RefreshCw className={cn("h-3 w-3 mr-1.5", isRegenerating && "animate-spin")} />
                      {isRegenerating ? 'Working...' : 'Regenerate'}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handleStartEdit}
                      className="h-8 text-xs"
                    >
                      <Pencil className="h-3 w-3 mr-1.5" /> Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handleCopy}
                      className="h-8 text-xs"
                    >
                      {copied ? <Check className="h-3 w-3 mr-1.5" /> : <Copy className="h-3 w-3 mr-1.5" />}
                      {copied ? 'Copied!' : 'Copy'}
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={handleAddToResume}
                      disabled={isStaged}
                      className="h-8 text-xs"
                    >
                      {isStaged ? <Check className="h-3 w-3 mr-1.5" /> : <Plus className="h-3 w-3 mr-1.5" />}
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
          
          {/* Evidence Citations */}
          {entry.evidenceIds && entry.evidenceIds.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center pt-3 border-t">
              <span className="text-xs text-muted-foreground font-medium">Evidence:</span>
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

      {/* Dispute Modal */}
      <DisputeGapModal
        isOpen={showDisputeModal}
        onClose={() => setShowDisputeModal(false)}
        requirementId={entry.requirementId}
        requirementText={requirement.requirement}
        currentCategory={entry.category}
        gapExplanation={entry.gapExplanation}
        jobDescription={jobDescription || ''}
        onDisputeResolved={handleDisputeResolved}
      />
    </>
  );
}
