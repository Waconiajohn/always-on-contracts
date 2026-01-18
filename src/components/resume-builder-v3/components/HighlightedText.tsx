/**
 * HighlightedText - Highlights matched keywords in text
 * Shows matched keywords in green, can optionally show insertable chips for missing keywords
 */

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HighlightedTextProps {
  text: string;
  matchedKeywords?: string[];
  className?: string;
}

export function HighlightedText({
  text,
  matchedKeywords = [],
  className,
}: HighlightedTextProps) {
  // Create a case-insensitive regex pattern for all keywords
  const highlightedText = useMemo(() => {
    if (!matchedKeywords.length || !text) return text;

    // Sort keywords by length (longest first) to avoid partial matches
    const sortedKeywords = [...matchedKeywords].sort((a, b) => b.length - a.length);
    
    // Escape special regex characters
    const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Create a pattern that matches whole words or phrases
    const pattern = sortedKeywords
      .map(kw => `\\b${escapeRegex(kw)}\\b`)
      .join('|');
    
    if (!pattern) return text;

    const regex = new RegExp(`(${pattern})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) => {
      const isMatch = sortedKeywords.some(
        kw => part.toLowerCase() === kw.toLowerCase()
      );

      if (isMatch) {
        return (
          <TooltipProvider key={index}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 px-0.5 rounded cursor-help font-medium">
                  {part}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <p>✓ Matches job requirement</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }

      return part;
    });
  }, [text, matchedKeywords]);

  return (
    <span className={cn(className)}>
      {highlightedText}
    </span>
  );
}

/**
 * Simple version without tooltips for performance in lists
 */
export function HighlightedTextSimple({
  text,
  matchedKeywords = [],
  className,
}: HighlightedTextProps) {
  const highlightedText = useMemo(() => {
    if (!matchedKeywords.length || !text) return text;

    const sortedKeywords = [...matchedKeywords].sort((a, b) => b.length - a.length);
    const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = sortedKeywords.map(kw => `\\b${escapeRegex(kw)}\\b`).join('|');
    
    if (!pattern) return text;

    const regex = new RegExp(`(${pattern})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) => {
      const isMatch = sortedKeywords.some(kw => part.toLowerCase() === kw.toLowerCase());

      if (isMatch) {
        return (
          <span
            key={index}
            className="bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 px-0.5 rounded font-medium"
          >
            {part}
          </span>
        );
      }

      return part;
    });
  }, [text, matchedKeywords]);

  return <span className={cn(className)}>{highlightedText}</span>;
}
