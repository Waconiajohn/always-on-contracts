import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Sparkles, 
  ChevronDown, 
  ArrowRight,
  Check,
  X,
  RefreshCw,
  Copy,
  Loader2,
  Wand2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface BulletRewriteCardProps {
  originalBullet: string;
  requirementId: string;
  requirementText?: string;
  jobDescription?: string;
  onAcceptRewrite: (bullet: string, requirementId: string) => void;
  className?: string;
}

export function BulletRewriteCard({
  originalBullet,
  requirementId,
  requirementText,
  jobDescription,
  onAcceptRewrite,
  className,
}: BulletRewriteCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rewrittenBullet, setRewrittenBullet] = useState<string | null>(null);
  const [improvements, setImprovements] = useState<string[]>([]);

  const handleRewrite = async () => {
    setIsLoading(true);
    setRewrittenBullet(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-rewrite-bullet', {
        body: {
          originalBullet,
          requirementText: requirementText || '',
          jobDescription: jobDescription || '',
        }
      });
      
      if (error) throw error;
      
      if (data?.rewrittenBullet) {
        setRewrittenBullet(data.rewrittenBullet);
        setImprovements(data.improvements || []);
        setIsOpen(true);
        toast.success('AI rewrite generated!');
      }
    } catch (err) {
      console.error('Rewrite error:', err);
      toast.error('Failed to generate rewrite. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = () => {
    if (rewrittenBullet) {
      onAcceptRewrite(rewrittenBullet, requirementId);
      toast.success('Rewritten bullet added to draft!');
    }
  };

  const handleCopy = () => {
    if (rewrittenBullet) {
      navigator.clipboard.writeText(rewrittenBullet);
      toast.success('Copied to clipboard');
    }
  };

  const handleReject = () => {
    setRewrittenBullet(null);
    setImprovements([]);
    setIsOpen(false);
  };

  return (
    <Card className={cn("border transition-all", className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="p-4">
          {/* Original bullet */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs bg-muted/50">
                Current Bullet
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs h-7 text-primary hover:text-primary hover:bg-primary/10"
                onClick={handleRewrite}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-3 w-3" />
                    AI Rewrite
                  </>
                )}
              </Button>
            </div>
            <p className={cn(
              "text-sm leading-relaxed",
              rewrittenBullet && "text-muted-foreground line-through"
            )}>
              {originalBullet}
            </p>
          </div>

          {/* Rewritten bullet preview (collapsed state) */}
          {rewrittenBullet && !isOpen && (
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full mt-3 justify-between text-xs h-8 bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3" />
                  View AI Improvement
                </span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </CollapsibleTrigger>
          )}
        </div>

        <CollapsibleContent>
          {rewrittenBullet && (
            <CardContent className="pt-0 pb-4 space-y-4">
              {/* Before/After comparison */}
              <div className="rounded-lg border bg-gradient-to-r from-red-50/50 via-transparent to-emerald-50/50 p-3 space-y-3">
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <span className="text-red-600 font-medium">Before</span>
                  <ArrowRight className="h-3 w-3" />
                  <span className="text-emerald-600 font-medium">After</span>
                </div>
                
                {/* New bullet */}
                <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200">
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-sm leading-relaxed text-emerald-900 font-medium">
                      {rewrittenBullet}
                    </p>
                  </div>
                </div>
              </div>

              {/* Improvements list */}
              {improvements.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">What improved:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {improvements.map((improvement, idx) => (
                      <Badge 
                        key={idx} 
                        variant="secondary" 
                        className="text-xs bg-emerald-100 text-emerald-700"
                      >
                        ✓ {improvement}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-2">
                <Button
                  size="sm"
                  className="gap-1.5 flex-1"
                  onClick={handleAccept}
                >
                  <Check className="h-3.5 w-3.5" />
                  Accept & Add
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={handleCopy}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={handleRewrite}
                  disabled={isLoading}
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-muted-foreground hover:text-destructive"
                  onClick={handleReject}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          )}
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
