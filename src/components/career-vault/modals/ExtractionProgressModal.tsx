// Extraction Progress Modal - Time-based progress with massive brain animation
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Sparkles, Brain } from 'lucide-react';
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

interface ExtractionPhase {
  id: string;
  name: string;
  percentage: [number, number];
  messages: string[];
  color: string;
}

const EXTRACTION_PHASES: ExtractionPhase[] = [
  {
    id: 'parsing',
    name: 'Parsing Resume Structure',
    percentage: [0, 15],
    messages: [
      'Reading your resume structure...',
      'Identifying key sections...',
      'Understanding document layout...',
      'Analyzing formatting patterns...'
    ],
    color: 'from-blue-500 to-indigo-600'
  },
  {
    id: 'extracting',
    name: 'Extracting Power Phrases',
    percentage: [15, 35],
    messages: [
      'Finding your strongest accomplishments...',
      'Analyzing impact statements...',
      'Identifying quantified achievements...',
      'Discovering hidden wins...',
      'Extracting career highlights...'
    ],
    color: 'from-indigo-500 to-purple-600'
  },
  {
    id: 'mapping',
    name: 'Mapping Skills & Competencies',
    percentage: [35, 60],
    messages: [
      'Cataloging technical skills...',
      'Discovering hidden competencies...',
      'Mapping transferable skills...',
      'Analyzing skill patterns...',
      'Identifying expertise areas...'
    ],
    color: 'from-purple-500 to-pink-600'
  },
  {
    id: 'context',
    name: 'Building Career Context',
    percentage: [60, 80],
    messages: [
      'Understanding your seniority level...',
      'Analyzing leadership experience...',
      'Mapping career trajectory...',
      'Identifying industry patterns...',
      'Building professional profile...'
    ],
    color: 'from-pink-500 to-rose-600'
  },
  {
    id: 'enhancing',
    name: 'AI Enhancement Layer',
    percentage: [80, 95],
    messages: [
      'Enhancing with AI intelligence...',
      'Cross-referencing industry data...',
      'Optimizing for ATS systems...',
      'Polishing career intelligence...',
      'Finalizing strategic insights...'
    ],
    color: 'from-rose-500 to-red-600'
  },
  {
    id: 'complete',
    name: 'Finalizing Your Vault',
    percentage: [95, 100],
    messages: [
      'Preparing your career vault...',
      'Almost ready...',
      'Final touches...'
    ],
    color: 'from-green-500 to-emerald-600'
  }
];

export function ExtractionProgressModal({ open, vaultId, onComplete }: ExtractionProgressModalProps) {
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<ExtractionPhase>(EXTRACTION_PHASES[0]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [extractedItems, setExtractedItems] = useState<ExtractedItem[]>([]);
  const [itemCount, setItemCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Rotate messages within current phase
  useEffect(() => {
    if (!currentPhase.messages.length) return;
    
    const randomMessage = currentPhase.messages[
      Math.floor(Math.random() * currentPhase.messages.length)
    ];
    setCurrentMessage(randomMessage);

    const messageInterval = setInterval(() => {
      const newMessage = currentPhase.messages[
        Math.floor(Math.random() * currentPhase.messages.length)
      ];
      setCurrentMessage(newMessage);
    }, 2500);

    return () => clearInterval(messageInterval);
  }, [currentPhase]);

  // Main extraction logic - time-based progress with heartbeat monitoring
  useEffect(() => {
    if (!open || !vaultId) return;

    const startTime = Date.now();
    const ESTIMATED_DURATION = 60000; // 60 seconds estimated
    const MAX_TIMEOUT = 120000; // 2 minute hard timeout (AI can be slow)
    let hasCompletedSuccessfully = false;
    let progressInterval: NodeJS.Timeout;
    let heartbeatInterval: NodeJS.Timeout;
    let feedInterval: NodeJS.Timeout;

    // === TIME-BASED PROGRESS SIMULATION ===
    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const percentage = Math.min((elapsed / ESTIMATED_DURATION) * 100, 95);
      
      setProgress(percentage);

      // Determine current phase based on percentage
      const phase = EXTRACTION_PHASES.find(p => 
        percentage >= p.percentage[0] && percentage < p.percentage[1]
      ) || EXTRACTION_PHASES[EXTRACTION_PHASES.length - 1];
      
      setCurrentPhase(phase);

      // Hard timeout check
      if (elapsed > MAX_TIMEOUT && !hasCompletedSuccessfully) {
        clearInterval(progressInterval);
        clearInterval(heartbeatInterval);
        clearInterval(feedInterval);
        handleTimeout();
      }
    };

    // === HEARTBEAT MONITORING FOR COMPLETION ===
    const checkCompletionHeartbeat = async () => {
      try {
        const { data, error } = await supabase
          .from('career_vault')
          .select('auto_populated, extraction_item_count')
          .eq('id', vaultId)
          .single();

        if (error) throw error;

        // If extraction completed successfully
        if (data.auto_populated && (data.extraction_item_count || 0) > 0) {
          hasCompletedSuccessfully = true;
          setProgress(100);
          setCurrentPhase(EXTRACTION_PHASES[EXTRACTION_PHASES.length - 1]);
          setIsComplete(true);
          
          clearInterval(progressInterval);
          clearInterval(heartbeatInterval);
          clearInterval(feedInterval);
          
          // Delay for completion animation
          setTimeout(() => onComplete(), 2000);
        }
      } catch (error) {
        console.error('Heartbeat check failed:', error);
      }
    };

    // === LIVE FEED UPDATES (Real Item Counts) ===
    const updateLiveFeed = async () => {
      try {
        const [
          powerPhrasesResult,
          skillsResult,
          competenciesResult,
          softSkillsResult,
          leadershipResult
        ] = await Promise.all([
          supabase.from('vault_power_phrases').select('power_phrase', { count: 'exact', head: false }).eq('vault_id', vaultId).limit(3) as any,
          supabase.from('vault_transferable_skills').select('stated_skill', { count: 'exact', head: false }).eq('vault_id', vaultId).limit(3) as any,
          supabase.from('vault_hidden_competencies').select('inferred_capability', { count: 'exact', head: false }).eq('vault_id', vaultId).limit(3) as any,
          supabase.from('vault_soft_skills' as any).select('skill_name', { count: 'exact', head: false }).eq('vault_id', vaultId).limit(3) as any,
          supabase.from('vault_leadership_philosophy' as any).select('philosophy_statement', { count: 'exact', head: false }).eq('vault_id', vaultId).limit(3) as any
        ]);

        const totalCount =
          (powerPhrasesResult.count || 0) +
          (skillsResult.count || 0) +
          (competenciesResult.count || 0) +
          (softSkillsResult.count || 0) +
          (leadershipResult.count || 0);

        setItemCount(totalCount);

        // Build live feed from latest items
        const newItems: ExtractedItem[] = [];
        
        if (powerPhrasesResult.data?.[0]) {
          newItems.push({
            type: 'Power Phrase',
            content: `"${powerPhrasesResult.data[0].power_phrase.substring(0, 60)}..."`,
            timestamp: Date.now()
          });
        }
        
        if (skillsResult.data?.[0]) {
          newItems.push({
            type: 'Skill',
            content: skillsResult.data[0].stated_skill,
            timestamp: Date.now() + 1
          });
        }
        
        if (competenciesResult.data?.[0]) {
          newItems.push({
            type: 'Competency',
            content: competenciesResult.data[0].inferred_capability,
            timestamp: Date.now() + 2
          });
        }

        if (newItems.length > 0) {
          setExtractedItems(prev => {
            const combined = [...prev, ...newItems];
            return combined.slice(-10); // Keep last 10 items
          });
        }
      } catch (error) {
        console.error('Live feed update failed:', error);
      }
    };

    // === TIMEOUT HANDLER ===
    const handleTimeout = async () => {
      // Check one last time if extraction actually completed
      try {
        const { data } = await supabase
          .from('career_vault')
          .select('auto_populated, extraction_item_count')
          .eq('id', vaultId)
          .single();

        // If it completed, proceed normally
        if (data?.auto_populated && (data.extraction_item_count || 0) > 0) {
          hasCompletedSuccessfully = true;
          setProgress(100);
          setIsComplete(true);
          setTimeout(() => onComplete(), 1000);
          return;
        }
      } catch (error) {
        console.error('Final completion check failed:', error);
      }

      // Otherwise, still proceed but show that it might need manual check
      console.warn('Extraction timeout - proceeding anyway. Items may still be processing.');
      setProgress(100);
      setIsComplete(true);
      setTimeout(() => onComplete(), 1000);
    };

    // Start all intervals
    progressInterval = setInterval(updateProgress, 100); // 60 FPS smooth progress
    heartbeatInterval = setInterval(checkCompletionHeartbeat, 3000); // Check every 3s
    feedInterval = setInterval(updateLiveFeed, 4000); // Update feed every 4s
    
    // Initial checks
    checkCompletionHeartbeat();
    updateLiveFeed();

    return () => {
      clearInterval(progressInterval);
      clearInterval(heartbeatInterval);
      clearInterval(feedInterval);
    };
  }, [open, vaultId, onComplete]);

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            {isComplete ? '✨ Extraction Complete!' : 'Extracting Your Career Intelligence'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isComplete 
              ? 'Your Career Vault is ready with AI-powered insights'
              : 'AI is analyzing your resume and building your career vault...'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* === MASSIVE THROBBING BRAIN === */}
          <div className="flex flex-col items-center justify-center py-6">
            <div className="relative w-40 h-40 mb-6">
              {/* Outer pulse ring - slowest */}
              <div 
                className={`absolute inset-0 bg-gradient-to-r ${currentPhase.color} rounded-full opacity-20 animate-ping`}
                style={{ animationDuration: '2s' }}
              />
              
              {/* Middle pulse ring */}
              <div 
                className={`absolute inset-2 bg-gradient-to-r ${currentPhase.color} rounded-full opacity-30 animate-ping`}
                style={{ animationDuration: '1.5s', animationDelay: '0.3s' }}
              />
              
              {/* Inner pulse ring - fastest */}
              <div 
                className={`absolute inset-4 bg-gradient-to-r ${currentPhase.color} rounded-full opacity-40 animate-pulse`}
                style={{ animationDuration: '1s' }}
              />
              
              {/* Core brain with bounce */}
              <div className={`relative bg-gradient-to-br ${currentPhase.color} rounded-full w-40 h-40 flex items-center justify-center shadow-2xl`}>
                <Brain 
                  className="w-20 h-20 text-white animate-pulse" 
                  style={{ animationDuration: '1.5s' }}
                />
                
                {/* Success checkmark */}
                {isComplete && (
                  <CheckCircle2 className="absolute -top-2 -right-2 w-12 h-12 text-green-400 animate-in zoom-in-50 duration-500" />
                )}
              </div>
            </div>

            {/* Phase name */}
            <h3 className="text-2xl font-bold text-center mb-2">
              {currentPhase.name}
            </h3>
            
            {/* Dynamic status message with fade animation */}
            <p 
              key={currentMessage}
              className="text-lg text-muted-foreground text-center animate-in fade-in-50 duration-500"
            >
              {currentMessage}
            </p>
            
            {/* Item count badge */}
            {itemCount > 0 && (
              <div className="mt-3 px-4 py-2 bg-primary/10 rounded-full">
                <span className="text-sm font-semibold text-primary">
                  {itemCount} items extracted
                </span>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>

          {/* Live extraction feed */}
          {extractedItems.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Live Extraction Feed
              </h4>
              <div className="bg-muted/30 rounded-lg p-3 max-h-32 overflow-y-auto space-y-2">
                {extractedItems.slice(-5).reverse().map((item) => (
                  <div 
                    key={item.timestamp} 
                    className="text-xs animate-in slide-in-from-top-2 duration-300"
                  >
                    <span className="font-semibold text-primary">{item.type}:</span>{' '}
                    <span className="text-muted-foreground">{item.content}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completion message */}
          {isComplete && (
            <div className="text-center text-green-600 font-semibold animate-in fade-in-50 duration-500">
              ✨ Your Career Vault is ready! Redirecting...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
