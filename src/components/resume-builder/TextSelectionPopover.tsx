import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Wand2, ArrowDownNarrowWide, Zap, Plus, Target, Tags } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TextSelectionPopoverProps {
  containerRef: React.RefObject<HTMLElement>;
  onEdit: (originalText: string, editedText: string) => void;
  context?: {
    job_title?: string;
    company?: string;
    section_name?: string;
  };
}

interface PopoverPosition {
  top: number;
  left: number;
}

const QUICK_ACTIONS = [
  { id: 'strengthen', label: 'Strengthen', icon: Zap, instruction: 'Make this more impactful with stronger action verbs' },
  { id: 'shorter', label: 'Shorter', icon: ArrowDownNarrowWide, instruction: 'Make this more concise while keeping the meaning' },
  { id: 'add_metric', label: '+ Metric', icon: Plus, instruction: 'Add a quantified metric or result if possible' },
  { id: 'clarify_scope', label: 'Clarify', icon: Target, instruction: 'Clarify the scope and context of this responsibility or achievement' },
  { id: 'add_keywords', label: '+ Keywords', icon: Tags, instruction: 'Incorporate relevant industry keywords naturally into this text' },
  { id: 'rewrite', label: 'Rewrite', icon: Wand2, instruction: 'Rewrite this completely for better impact' },
];

export function TextSelectionPopover({
  containerRef,
  onEdit,
  context,
}: TextSelectionPopoverProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<PopoverPosition>({ top: 0, left: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const handleSelectionChange = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !containerRef.current) {
      setIsVisible(false);
      return;
    }

    const text = selection.toString().trim();
    if (text.length < 5) {
      setIsVisible(false);
      return;
    }

    // Check if selection is within the container
    const range = selection.getRangeAt(0);
    if (!containerRef.current.contains(range.commonAncestorContainer)) {
      setIsVisible(false);
      return;
    }

    const rect = range.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    setSelectedText(text);
    setPosition({
      top: rect.top - containerRect.top - 40,
      left: rect.left - containerRect.left + rect.width / 2,
    });
    setIsVisible(true);
  }, [containerRef]);

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [handleSelectionChange]);

  // Hide popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsVisible(false);
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isVisible]);

  const handleAction = async (instruction: string) => {
    if (!selectedText || isLoading) return;

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please sign in to continue');
        return;
      }

      const { data, error } = await supabase.functions.invoke('rb-micro-edit', {
        body: {
          bullet_text: selectedText,
          edit_instruction: instruction,
          context,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.edited) {
        onEdit(selectedText, data.edited);
        toast.success('Text updated');
        setIsVisible(false);
      }
    } catch (err) {
      console.error('Micro-edit failed:', err);
      toast.error('Failed to edit text');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div
      ref={popoverRef}
      className="absolute z-50 flex items-center gap-1 p-1 bg-popover border rounded-lg shadow-lg"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translateX(-50%)',
      }}
    >
      {isLoading ? (
        <div className="px-3 py-1">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        QUICK_ACTIONS.map((action) => (
          <Button
            key={action.id}
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs gap-1"
            onClick={() => handleAction(action.instruction)}
          >
            <action.icon className="h-3 w-3" />
            {action.label}
          </Button>
        ))
      )}
    </div>
  );
}
