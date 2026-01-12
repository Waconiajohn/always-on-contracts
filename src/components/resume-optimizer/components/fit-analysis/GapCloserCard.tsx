import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ChevronDown, 
  ChevronUp,
  AlertTriangle,
  Lightbulb,
  HelpCircle,
  MessageSquare,
  Plus,
  Copy,
  Sparkles
} from 'lucide-react';
import { GapCloserStrategy, ClosingStrategy, GapTaxonomy, BulletTierLevel } from '../../types';
import { MicroEditToolbar, EditType } from './MicroEditToolbar';
import { toast } from 'sonner';

const GAP_TYPE_CONFIG: Record<GapTaxonomy, { label: string; color: string; icon: React.ElementType }> = {
  Domain: { label: 'Domain Gap', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: AlertTriangle },
  Tooling: { label: 'Tool/Tech Gap', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: AlertTriangle },
  Metric: { label: 'Metrics Gap', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: AlertTriangle },
  Ownership: { label: 'Ownership Gap', color: 'bg-red-100 text-red-800 border-red-200', icon: AlertTriangle },
  Scope: { label: 'Scope Gap', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: AlertTriangle },
  Recency: { label: 'Recency Gap', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: AlertTriangle },
};

const STRATEGY_CONFIG: Record<ClosingStrategy['type'], { label: string; icon: React.ElementType; description: string }> = {
  adjacent_proof: { 
    label: 'Adjacent Proof', 
    icon: Lightbulb, 
    description: 'Use similar experience to satisfy requirement intent' 
  },
  equivalent_substitution: { 
    label: 'Equivalent Substitute', 
    icon: Sparkles, 
    description: 'What hiring managers accept as equivalent evidence' 
  },
  proof_extraction: { 
    label: 'Proof Extraction', 
    icon: HelpCircle, 
    description: 'Answer questions to uncover hidden achievements' 
  },
  narrative_positioning: { 
    label: 'Narrative Position', 
    icon: MessageSquare, 
    description: 'Interview/cover-letter framing (not resume claims)' 
  },
};

const TIER_CONFIG: Record<BulletTierLevel, { label: string; color: string }> = {
  conservative: { label: 'Conservative', color: 'bg-slate-100 text-slate-700' },
  strong: { label: 'Strong', color: 'bg-blue-100 text-blue-700' },
  aggressive: { label: 'Aggressive', color: 'bg-amber-100 text-amber-700' },
};

interface GapCloserCardProps {
  strategy: GapCloserStrategy;
  requirementText: string;
  jobDescription?: string;
  onAddBullet: (bullet: string, requirementId: string) => void;
  onAnswerQuestion: (fieldKey: string, value: string) => void;
  confirmedFacts: Record<string, string | number | string[]>;
}

export function GapCloserCard({
  strategy,
  requirementText,
  jobDescription,
  onAddBullet,
  onAnswerQuestion,
  confirmedFacts
}: GapCloserCardProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [activeStrategy, setActiveStrategy] = useState<string>(
    strategy.strategies[0]?.type || 'adjacent_proof'
  );
  const [editedBullets, setEditedBullets] = useState<Record<string, string>>({});

  const gapConfig = GAP_TYPE_CONFIG[strategy.gapType] || GAP_TYPE_CONFIG.Domain;
  const GapIcon = gapConfig.icon;

  const handleCopyBullet = (bullet: string) => {
    navigator.clipboard.writeText(bullet);
    toast.success('Bullet copied to clipboard');
  };

  const handleMicroEdit = (bulletKey: string, editedBullet: string, _editType: EditType) => {
    setEditedBullets(prev => ({ ...prev, [bulletKey]: editedBullet }));
  };

  const getBulletText = (bulletKey: string, originalBullet: string) => {
    return editedBullets[bulletKey] || originalBullet;
  };

  const currentStrategy = strategy.strategies.find(s => s.type === activeStrategy);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-l-4 border-l-amber-400">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={gapConfig.color}>
                    <GapIcon className="h-3 w-3 mr-1" />
                    {gapConfig.label}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {strategy.strategies.length} strategies
                  </Badge>
                </div>
                <CardTitle className="text-sm font-medium line-clamp-2">
                  {requirementText}
                </CardTitle>
              </div>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Strategy Tabs */}
            <Tabs value={activeStrategy} onValueChange={setActiveStrategy}>
              <TabsList className="h-auto flex-wrap gap-1 bg-muted/50 p-1">
                {strategy.strategies.map((s) => {
                  const config = STRATEGY_CONFIG[s.type];
                  const Icon = config.icon;
                  return (
                    <TabsTrigger 
                      key={s.type} 
                      value={s.type}
                      className="text-xs gap-1 data-[state=active]:bg-background"
                    >
                      <Icon className="h-3 w-3" />
                      {config.label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {strategy.strategies.map((s) => (
                <TabsContent key={s.type} value={s.type} className="mt-4 space-y-4">
                  {/* Strategy Explanation */}
                  <div className="p-3 rounded-lg bg-muted/50 border">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Strategy: </span>
                      {s.explanation}
                    </p>
                  </div>

                  {/* Proof Extraction Questions */}
                  {s.type === 'proof_extraction' && s.questions && s.questions.length > 0 && (
                    <div className="space-y-3 p-3 rounded-lg border bg-blue-50/50">
                      <p className="text-xs font-medium text-blue-800 flex items-center gap-1">
                        <HelpCircle className="h-3 w-3" />
                        Answer these to unlock stronger bullets:
                      </p>
                      {s.questions.map((q) => (
                        <div key={q.fieldKey} className="space-y-1">
                          <Label htmlFor={q.fieldKey} className="text-xs">
                            {q.question}
                          </Label>
                          {q.type === 'text' ? (
                            <Textarea
                              id={q.fieldKey}
                              value={(confirmedFacts[q.fieldKey] as string) || ''}
                              onChange={(e) => onAnswerQuestion(q.fieldKey, e.target.value)}
                              placeholder="Enter your answer..."
                              className="text-sm min-h-[60px]"
                            />
                          ) : (
                            <Input
                              id={q.fieldKey}
                              type={q.type === 'number' ? 'number' : 'text'}
                              value={(confirmedFacts[q.fieldKey] as string) || ''}
                              onChange={(e) => onAnswerQuestion(q.fieldKey, e.target.value)}
                              placeholder="Enter value..."
                              className="text-sm"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Bullet Options by Tier */}
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      Choose a bullet approach:
                    </p>
                    {s.bulletOptions.map((option, idx) => {
                      const tierConfig = TIER_CONFIG[option.tier];
                      const bulletKey = `${s.type}-${option.tier}-${idx}`;
                      const displayBullet = getBulletText(bulletKey, option.bullet);
                      const hasConfirmation = option.requiredConfirmations && option.requiredConfirmations.length > 0;
                      
                      return (
                        <div 
                          key={bulletKey}
                          className="p-3 rounded-lg border bg-background space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary" className={tierConfig.color}>
                              {tierConfig.label}
                            </Badge>
                            {hasConfirmation && (
                              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                                Confirm Details
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm leading-relaxed">{displayBullet}</p>
                          
                          {hasConfirmation && (
                            <p className="text-xs text-amber-600">
                              ⚠️ Verify: {option.requiredConfirmations?.join(', ')}
                            </p>
                          )}
                          
                          {/* Micro-edit toolbar */}
                          <div className="pt-2 border-t">
                            <MicroEditToolbar
                              bulletText={displayBullet}
                              onEdit={(edited, editType) => handleMicroEdit(bulletKey, edited, editType)}
                              jobDescription={jobDescription}
                              requirementContext={requirementText}
                              compact
                            />
                          </div>
                          
                          {/* Action buttons */}
                          <div className="flex gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1 text-xs"
                              onClick={() => handleCopyBullet(displayBullet)}
                            >
                              <Copy className="h-3 w-3" />
                              Copy
                            </Button>
                            <Button
                              size="sm"
                              className="gap-1 text-xs"
                              onClick={() => onAddBullet(displayBullet, strategy.requirementId)}
                            >
                              <Plus className="h-3 w-3" />
                              Add to Resume
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Narrative positioning note */}
                  {s.type === 'narrative_positioning' && (
                    <div className="p-3 rounded-lg bg-purple-50/50 border border-purple-200">
                      <p className="text-xs text-purple-700">
                        <strong>Note:</strong> These are interview talking points, not resume claims. 
                        Use them to address this gap in your interview or cover letter.
                      </p>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
