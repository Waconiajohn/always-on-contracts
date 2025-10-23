import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Sparkles, CheckCircle2 } from "lucide-react";
import { useState } from "react";

interface VaultItem {
  id: string;
  type: string;
  content: string;
  qualityTier?: 'gold' | 'silver' | 'bronze';
  matchScore?: number;
}

interface Requirement {
  text: string;
  satisfied?: boolean;
}

interface SectionReviewPanelProps {
  sectionTitle: string;
  sectionType: string;
  vaultItemsUsed: VaultItem[];
  requirementsCovered: Requirement[];
  atsKeywords: string[];
  qualityScore: number;
  onRegenerate?: () => void;
  onEdit?: () => void;
}

export const SectionReviewPanel = ({
  vaultItemsUsed = [],
  requirementsCovered = [],
  atsKeywords = [],
  qualityScore = 0,
  onRegenerate,
  onEdit
}: SectionReviewPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const getQualityColor = () => {
    if (qualityScore >= 80) return "text-success";
    if (qualityScore >= 60) return "text-warning";
    return "text-muted-foreground";
  };

  const getTierBadgeColor = (tier?: string) => {
    switch (tier) {
      case 'gold': return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30";
      case 'silver': return "bg-slate-500/20 text-slate-700 dark:text-slate-400 border-slate-500/30";
      case 'bronze': return "bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/30";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-primary/20 bg-primary/5">
        <CollapsibleTrigger asChild>
          <div className="p-3 cursor-pointer hover:bg-primary/10 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">What's in this section</span>
                <Badge variant="outline" className="text-xs">
                  {vaultItemsUsed.length} vault items
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Quality:</span>
                  <span className={`text-sm font-semibold ${getQualityColor()}`}>
                    {qualityScore}%
                  </span>
                </div>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-4 pt-0 space-y-4 border-t border-primary/10">
            {/* Vault Items Used */}
            {vaultItemsUsed.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                  Vault Items Used
                </h4>
                <div className="space-y-2">
                  {vaultItemsUsed.map((item, index) => (
                    <div key={index} className="flex items-start gap-2 text-xs bg-card p-2 rounded border">
                      <CheckCircle2 className="h-3 w-3 text-success mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={`text-xs ${getTierBadgeColor(item.qualityTier)}`}>
                            {item.qualityTier || 'standard'}
                          </Badge>
                          <span className="text-muted-foreground">
                            {item.matchScore ? `${Math.round(item.matchScore)}% match` : ''}
                          </span>
                        </div>
                        <p className="line-clamp-2">{item.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Requirements Covered */}
            {requirementsCovered.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                  Requirements Addressed ({requirementsCovered.length})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {requirementsCovered.slice(0, 6).map((req, index) => (
                    <Badge key={index} variant="outline" className="text-xs bg-success/10 text-success border-success/30">
                      {req.text.length > 40 ? req.text.substring(0, 40) + '...' : req.text}
                    </Badge>
                  ))}
                  {requirementsCovered.length > 6 && (
                    <Badge variant="outline" className="text-xs">
                      +{requirementsCovered.length - 6} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* ATS Keywords */}
            {atsKeywords.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                  ATS Keywords Included ({atsKeywords.length})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {atsKeywords.slice(0, 8).map((keyword, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                  {atsKeywords.length > 8 && (
                    <Badge variant="secondary" className="text-xs">
                      +{atsKeywords.length - 8} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              {onRegenerate && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onRegenerate}
                  className="h-7 text-xs"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Regenerate
                </Button>
              )}
              {onEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onEdit}
                  className="h-7 text-xs"
                >
                  Edit Content
                </Button>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
