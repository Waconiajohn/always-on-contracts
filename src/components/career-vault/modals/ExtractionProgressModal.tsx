// Extraction Progress Modal - Shows transparent AI processing with live feed
import { useEffect, useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Sparkles, Brain, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ExtractedItem {
  type: string;
  content: string;
  timestamp: number;
}

interface ExtractionProgressModalProps {
  open: boolean;
  vaultId: string;
  onComplete: () => void;
}

export function ExtractionProgressModal({ open, vaultId, onComplete }: ExtractionProgressModalProps) {
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<'extracting' | 'enhancing' | 'complete'>('extracting');
  const [extractedItems, setExtractedItems] = useState<ExtractedItem[]>([]);
  const [itemCount, setItemCount] = useState(0);

  useEffect(() => {
    if (!open || !vaultId) return;

    let pollInterval: NodeJS.Timeout;
    let isPolling = true;
    let lastItemCount = 0;

    const pollVaultProgress = async () => {
      try {
        // Fetch all vault tables to get real-time counts
        const [
          powerPhrasesResult,
          skillsResult,
          competenciesResult,
          technicalResult,
          softSkillsResult,
          leadershipResult,
          educationResult
        ] = await Promise.all([
          supabase.from('vault_power_phrases').select('power_phrase', { count: 'exact', head: false }).eq('vault_id', vaultId).limit(5),
          supabase.from('vault_transferable_skills').select('stated_skill', { count: 'exact', head: false }).eq('vault_id', vaultId).limit(5),
          supabase.from('vault_hidden_competencies').select('inferred_capability', { count: 'exact', head: false }).eq('vault_id', vaultId).limit(5),
          supabase.from('vault_technical_skills').select('skill_name', { count: 'exact', head: false }).eq('vault_id', vaultId).limit(5),
          supabase.from('vault_soft_skills').select('skill_name', { count: 'exact', head: false }).eq('vault_id', vaultId).limit(5),
          supabase.from('vault_leadership_philosophy').select('philosophy_statement', { count: 'exact', head: false }).eq('vault_id', vaultId).limit(5),
          supabase.from('vault_education').select('degree_type, field', { count: 'exact', head: false }).eq('vault_id', vaultId).limit(5)
        ]);

        const totalCount =
          (powerPhrasesResult.count || 0) +
          (skillsResult.count || 0) +
          (competenciesResult.count || 0) +
          (technicalResult.count || 0) +
          (softSkillsResult.count || 0) +
          (leadershipResult.count || 0) +
          (educationResult.count || 0);

        setItemCount(totalCount);

        // Add new items to feed
        if (totalCount > lastItemCount) {
          // Show recently added items
          const newItems: ExtractedItem[] = [];

          if (powerPhrasesResult.data && powerPhrasesResult.data.length > 0) {
            newItems.push({
              type: 'Power Phrase',
              content: `"${powerPhrasesResult.data[0].power_phrase.substring(0, 60)}${powerPhrasesResult.data[0].power_phrase.length > 60 ? '...' : ''}"`,
              timestamp: Date.now()
            });
          }

          if (skillsResult.data && skillsResult.data.length > 0) {
            newItems.push({
              type: 'Skill',
              content: skillsResult.data[0].stated_skill,
              timestamp: Date.now() + 1
            });
          }

          if (competenciesResult.data && competenciesResult.data.length > 0) {
            newItems.push({
              type: 'Competency',
              content: competenciesResult.data[0].inferred_capability,
              timestamp: Date.now() + 2
            });
          }

          setExtractedItems(prev => [...prev, ...newItems]);
          lastItemCount = totalCount;
        }

        // Update progress and phase
        if (totalCount === 0) {
          setCurrentPhase('extracting');
          setProgress(10);
        } else if (totalCount < 20) {
          setCurrentPhase('extracting');
          setProgress(30 + (totalCount / 20) * 40);
        } else if (totalCount < 40) {
          setCurrentPhase('enhancing');
          setProgress(70 + ((totalCount - 20) / 20) * 20);
        } else {
          setCurrentPhase('complete');
          setProgress(100);
          isPolling = false;
          clearInterval(pollInterval);
          setTimeout(() => onComplete(), 2000);
        }
      } catch (error) {
        console.error('Error polling vault progress:', error);
      }
    };

    // Initial poll
    pollVaultProgress();

    // Poll every 2 seconds
    pollInterval = setInterval(() => {
      if (isPolling) {
        pollVaultProgress();
      }
    }, 2000);

    return () => {
      isPolling = false;
      clearInterval(pollInterval);
    };
  }, [open, vaultId, onComplete]);

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {currentPhase === 'extracting' && (
              <>
                <Brain className="w-5 h-5 text-indigo-600 animate-pulse" />
                Extracting Your Career Intelligence
              </>
            )}
            {currentPhase === 'enhancing' && (
              <>
                <Sparkles className="w-5 h-5 text-purple-600 animate-pulse" />
                AI Enhancing Your Vault
              </>
            )}
            {currentPhase === 'complete' && (
              <>
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Extraction Complete
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {currentPhase === 'extracting' && 'AI is analyzing your resume and extracting career data...'}
            {currentPhase === 'enhancing' && 'AI is discovering hidden competencies and strategic intelligence...'}
            {currentPhase === 'complete' && 'Your Career Vault is ready!'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-slate-700">
                {itemCount} items extracted
              </span>
              <span className="text-slate-500">
                {Math.round(progress)}%
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Live Item Feed */}
          <div className="bg-slate-50 rounded-lg p-4 max-h-[300px] overflow-y-auto space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-3">
              <TrendingUp className="w-4 h-4" />
              Live Extraction Feed
            </div>

            {extractedItems.length === 0 ? (
              <p className="text-sm text-slate-500 italic">Starting extraction...</p>
            ) : (
              <div className="space-y-2">
                {extractedItems.slice().reverse().map((item, idx) => (
                  <div
                    key={item.timestamp}
                    className="flex items-start gap-2 text-sm animate-in slide-in-from-top-2 duration-300"
                  >
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-slate-900">{item.type}:</span>
                      <span className="text-slate-600 ml-1">{item.content.split(':')[1]}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Phase Indicators */}
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className={`flex items-center gap-2 ${currentPhase === 'extracting' ? 'text-indigo-600 font-medium' : 'text-slate-400'}`}>
              <div className={`w-2 h-2 rounded-full ${currentPhase === 'extracting' ? 'bg-indigo-600 animate-pulse' : 'bg-slate-300'}`} />
              Extracting
            </div>
            <div className={`flex items-center gap-2 ${currentPhase === 'enhancing' ? 'text-purple-600 font-medium' : 'text-slate-400'}`}>
              <div className={`w-2 h-2 rounded-full ${currentPhase === 'enhancing' ? 'bg-purple-600 animate-pulse' : 'bg-slate-300'}`} />
              Enhancing
            </div>
            <div className={`flex items-center gap-2 ${currentPhase === 'complete' ? 'text-green-600 font-medium' : 'text-slate-400'}`}>
              <div className={`w-2 h-2 rounded-full ${currentPhase === 'complete' ? 'bg-green-600' : 'bg-slate-300'}`} />
              Complete
            </div>
          </div>

          {currentPhase === 'complete' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-green-900 font-medium">
                Your Career Vault is now populated with {itemCount}+ intelligence items!
              </p>
              <p className="text-sm text-green-700 mt-1">
                AI has enhanced your vault with strategic insights and hidden competencies
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
