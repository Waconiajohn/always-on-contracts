import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type RegenerableCategory = 'leadership' | 'soft_skills' | 'executive_presence';

const TABLE_MAP: Record<RegenerableCategory, string> = {
  leadership: 'vault_leadership_philosophy',
  soft_skills: 'vault_soft_skills',
  executive_presence: 'vault_executive_presence',
};

const CATEGORY_LABELS: Record<RegenerableCategory, string> = {
  leadership: 'Leadership Philosophy',
  soft_skills: 'Soft Skills',
  executive_presence: 'Executive Presence',
};

interface CategoryRegenerateButtonProps {
  category: RegenerableCategory;
  vaultId: string;
  resumeText: string;
  onComplete: () => void;
}

export const CategoryRegenerateButton = ({ 
  category, 
  vaultId, 
  resumeText,
  onComplete 
}: CategoryRegenerateButtonProps) => {
  const [isRegenerating, setIsRegenerating] = useState(false);
  
  const handleRegenerate = async () => {
    setIsRegenerating(true);
    
    try {
      // 1. Delete existing items for this category
      const tableName = TABLE_MAP[category];
      const { error: deleteError } = await (supabase
        .from(tableName as any)
        .delete()
        .eq('vault_id', vaultId));

      if (deleteError) throw deleteError;

      // 2. Re-extract with improved prompts using edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-vault-intangibles`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ 
            resumeText, 
            vaultId
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Extraction failed');
      }

      toast.success(`${CATEGORY_LABELS[category]} regenerated with improved AI`);
      onComplete();
    } catch (error: any) {
      console.error('Regeneration error:', error);
      toast.error(`Failed to regenerate: ${error.message}`);
    } finally {
      setIsRegenerating(false);
    }
  };
  
  return (
    <Button 
      variant="outline" 
      size="sm"
      onClick={handleRegenerate}
      disabled={isRegenerating}
    >
      {isRegenerating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Regenerating...
        </>
      ) : (
        <>
          <RefreshCw className="h-4 w-4 mr-2" />
          Regenerate with Improved AI
        </>
      )}
    </Button>
  );
};
