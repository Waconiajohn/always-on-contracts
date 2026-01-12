import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { 
  Crown, 
  Minimize2, 
  Zap, 
  Target, 
  Award, 
  Hash,
  Users,
  Layers,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type EditType = 
  | 'more-executive' 
  | 'shorter' 
  | 'more-impact' 
  | 'align-jd' 
  | 'signature-win' 
  | 'add-metrics' 
  | 'add-scope' 
  | 'add-stakeholders'
  | 'add-outcome';

interface EditOption {
  type: EditType;
  icon: React.ElementType;
  label: string;
  tooltip: string;
}

const EDIT_OPTIONS: EditOption[] = [
  { type: 'more-executive', icon: Crown, label: 'Executive', tooltip: 'Sound more executive-level' },
  { type: 'shorter', icon: Minimize2, label: 'Shorter', tooltip: 'Make more concise' },
  { type: 'more-impact', icon: Zap, label: 'Impact', tooltip: 'Amplify impact' },
  { type: 'align-jd', icon: Target, label: 'Align JD', tooltip: 'Align to job description' },
  { type: 'signature-win', icon: Award, label: 'Signature', tooltip: 'Convert to signature win' },
  { type: 'add-metrics', icon: Hash, label: 'Metrics', tooltip: 'Add specific metrics' },
  { type: 'add-scope', icon: Layers, label: 'Scope', tooltip: 'Add scope & scale' },
  { type: 'add-stakeholders', icon: Users, label: 'Stakeholders', tooltip: 'Add leadership context' },
  { type: 'add-outcome', icon: TrendingUp, label: 'Outcome', tooltip: 'Add business outcome' },
];

interface MicroEditToolbarProps {
  bulletText: string;
  onEdit: (editedBullet: string, editType: EditType) => void;
  jobDescription?: string;
  requirementContext?: string;
  roleLevel?: string;
  compact?: boolean;
  disabled?: boolean;
}

export function MicroEditToolbar({
  bulletText,
  onEdit,
  jobDescription,
  requirementContext,
  roleLevel,
  compact = false,
  disabled = false
}: MicroEditToolbarProps) {
  const [loadingType, setLoadingType] = useState<EditType | null>(null);

  const handleEdit = async (editType: EditType) => {
    if (disabled || loadingType) return;
    
    setLoadingType(editType);
    
    try {
      const { data, error } = await supabase.functions.invoke('micro-edit-bullet', {
        body: {
          bulletText,
          editType,
          jobDescription,
          requirementContext,
          roleLevel
        }
      });

      if (error) throw error;

      if (data?.editedBullet) {
        onEdit(data.editedBullet, editType);
        toast.success(`Bullet enhanced: ${editType.replace(/-/g, ' ')}`);
      } else {
        throw new Error('No edited bullet returned');
      }
    } catch (err) {
      console.error('Micro-edit error:', err);
      toast.error('Failed to edit bullet. Please try again.');
    } finally {
      setLoadingType(null);
    }
  };

  if (compact) {
    // Compact mode: just icons in a row
    return (
      <TooltipProvider delayDuration={200}>
        <div className="flex flex-wrap gap-1">
          {EDIT_OPTIONS.slice(0, 6).map((option) => {
            const Icon = option.icon;
            const isLoading = loadingType === option.type;
            
            return (
              <Tooltip key={option.type}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => handleEdit(option.type)}
                    disabled={disabled || !!loadingType}
                  >
                    {isLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Icon className="h-3 w-3" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">{option.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    );
  }

  // Full mode: buttons with labels
  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-wrap gap-1.5">
        {EDIT_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isLoading = loadingType === option.type;
          
          return (
            <Tooltip key={option.type}>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1 px-2"
                  onClick={() => handleEdit(option.type)}
                  disabled={disabled || !!loadingType}
                >
                  {isLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Icon className="h-3 w-3" />
                  )}
                  {option.label}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">{option.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
