import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Check, Trash2 } from 'lucide-react';

interface CleanupResults {
  total_removed: number;
  breakdown: {
    power_phrases: number;
    transferable_skills: number;
    soft_skills: number;
    hidden_competencies: number;
    leadership_philosophy: number;
    executive_presence: number;
    personality_traits: number;
    work_style: number;
    values_motivations: number;
    behavioral_indicators: number;
  };
}

interface AutoDuplicateCleanupProps {
  vaultId: string;
  onCleanupComplete?: () => void;
}

export const AutoDuplicateCleanup = ({ vaultId, onCleanupComplete }: AutoDuplicateCleanupProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<CleanupResults | null>(null);

  const autoCleanup = async () => {
    setIsScanning(true);
    
    try {
      const { data, error } = await supabase.rpc('cleanup_vault_duplicates' as any, {
        p_vault_id: vaultId
      });
      
      if (error) throw error;
      
      const results = data as unknown as CleanupResults;
      setResults(results);
      
      if (results && results.total_removed > 0) {
        toast.success(`Removed ${results.total_removed} duplicate items automatically`);
      } else {
        toast.success('No duplicates found - your vault is clean!');
      }
      
      if (onCleanupComplete) {
        onCleanupComplete();
      }
    } catch (error) {
      console.error('Error cleaning duplicates:', error);
      toast.error('Failed to clean duplicates');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          Duplicate Cleanup
        </CardTitle>
        <CardDescription>
          Automatically remove duplicate items and keep the highest quality version
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!results ? (
          <Button 
            onClick={autoCleanup} 
            disabled={isScanning}
            className="w-full"
          >
            {isScanning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scanning & Cleaning...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Auto-Remove Duplicates
              </>
            )}
          </Button>
        ) : (
          <Alert>
            <Check className="h-4 w-4" />
            <AlertTitle>Cleanup Complete</AlertTitle>
            <AlertDescription>
              <div className="mt-2 space-y-1">
                <p className="font-semibold">
                  Removed {results.total_removed} duplicate items
                </p>
                {results.total_removed > 0 && (
                  <div className="mt-2 text-sm space-y-1">
                    {Object.entries(results.breakdown)
                      .filter(([_, count]) => count > 0)
                      .map(([category, count]) => (
                        <p key={category} className="text-muted-foreground">
                          {category.replace(/_/g, ' ')}: {count}
                        </p>
                      ))}
                  </div>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setResults(null)}
                  className="mt-4"
                >
                  Run Again
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
