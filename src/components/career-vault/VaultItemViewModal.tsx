import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface VaultItem {
  id: string;
  category: string;
  content: any;
  quality_tier?: string | null;
  source?: string | null;
  usage_count?: number;
  last_updated_at?: string | null;
  created_at?: string;
}

interface VaultItemViewModalProps {
  item: VaultItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const VaultItemViewModal = ({ item, open, onOpenChange }: VaultItemViewModalProps) => {
  if (!item) return null;

  const getQualityBadge = (tier: string | null | undefined) => {
    const t = tier || 'assumed';
    
    if (t === 'gold') {
      return (
        <Badge className="bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Verified
        </Badge>
      );
    }
    
    if (t === 'silver' || t === 'bronze') {
      return (
        <Badge className="bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Verified
        </Badge>
      );
    }
    
    return (
      <Badge className="bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Needs Review
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Badge variant="outline">{item.category}</Badge>
            {getQualityBadge(item.quality_tier)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Main Content */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Content</h3>
            <p className="text-base">{item.content.text}</p>
          </div>

          {/* Evidence */}
          {item.content.evidence && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Evidence</h3>
              <p className="text-sm">{item.content.evidence}</p>
            </div>
          )}

          {/* Examples */}
          {item.content.examples && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Examples</h3>
              <p className="text-sm">{item.content.examples}</p>
            </div>
          )}

          {/* Description */}
          {item.content.description && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
              <p className="text-sm">{item.content.description}</p>
            </div>
          )}

          {/* Behavior */}
          {item.content.behavior && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Behavior</h3>
              <p className="text-sm">{item.content.behavior}</p>
            </div>
          )}

          {/* Manifestation */}
          {item.content.manifestation && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Manifestation</h3>
              <p className="text-sm">{item.content.manifestation}</p>
            </div>
          )}

          {/* Style */}
          {item.content.style && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Style</h3>
              <p className="text-sm">{item.content.style}</p>
            </div>
          )}

          {/* Keywords */}
          {item.content.keywords && Array.isArray(item.content.keywords) && item.content.keywords.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {item.content.keywords.map((keyword: string, idx: number) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="pt-4 border-t space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Source:</span>
              <span className="font-medium">{item.source}</span>
            </div>
            
            {item.usage_count !== undefined && item.usage_count > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Usage Count:</span>
                <span className="font-medium">{item.usage_count} resume{item.usage_count !== 1 ? 's' : ''}</span>
              </div>
            )}
            
            {item.last_updated_at && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Last Updated:</span>
                <span className="font-medium">
                  {format(new Date(item.last_updated_at), 'MMM d, yyyy h:mm a')}
                </span>
              </div>
            )}
            
            {item.created_at && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Created:</span>
                <span className="font-medium">
                  {format(new Date(item.created_at), 'MMM d, yyyy h:mm a')}
                </span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
