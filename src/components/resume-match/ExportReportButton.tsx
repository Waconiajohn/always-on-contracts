import { useState } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { ResumeMatchResult } from './types';
import jsPDF from 'jspdf';

interface ExportReportButtonProps {
  result: ResumeMatchResult | null;
}

export function ExportReportButton({ result }: ExportReportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  if (!result) return null;

  const generateTextReport = (): string => {
    const lines: string[] = [
      '═══════════════════════════════════════════════════════════════',
      '                    RESUME MATCH REPORT',
      '═══════════════════════════════════════════════════════════════',
      '',
      `Generated: ${new Date().toLocaleString()}`,
      `Target Role: ${result.detected?.role || 'Not specified'}`,
      `Industry: ${result.detected?.industry || 'Not specified'}`,
      `Level: ${result.detected?.level || 'Not specified'}`,
      '',
      '───────────────────────────────────────────────────────────────',
      '                        OVERALL SCORE',
      '───────────────────────────────────────────────────────────────',
      '',
      `  ${result.tier?.emoji || '📊'} ${result.overallScore}% - ${result.tier?.tier || 'N/A'}`,
      `  ${result.tier?.message || ''}`,
      '',
      `  Points to next tier: ${result.pointsToNextTier}`,
      '',
      '───────────────────────────────────────────────────────────────',
      '                      SCORE BREAKDOWN',
      '───────────────────────────────────────────────────────────────',
      '',
      `  JD Match:          ${result.scores?.jdMatch?.score || 0}% (weight: 60%)`,
      `  Industry Benchmark: ${result.scores?.industryBenchmark?.score || 0}% (weight: 20%)`,
      `  ATS Compliance:    ${result.scores?.atsCompliance?.score || 0}% (weight: 12%)`,
      `  Human Voice:       ${result.scores?.humanVoice?.score || 0}% (weight: 8%)`,
      '',
    ];

    // Keywords section
    if (result.breakdown?.jdMatch) {
      lines.push('───────────────────────────────────────────────────────────────');
      lines.push('                    KEYWORD ANALYSIS');
      lines.push('───────────────────────────────────────────────────────────────');
      lines.push('');
      
      const matched = result.breakdown.jdMatch.matchedKeywords || [];
      const missing = result.breakdown.jdMatch.missingKeywords || [];
      
      lines.push(`  ✓ Matched Keywords (${matched.length}):`);
      matched.forEach(kw => {
        lines.push(`    • ${kw.keyword} [${kw.priority}]`);
      });
      lines.push('');
      
      lines.push(`  ✗ Missing Keywords (${missing.length}):`);
      missing.forEach(kw => {
        lines.push(`    • ${kw.keyword} [${kw.priority}]${kw.prevalence ? ` - ${kw.prevalence}` : ''}`);
      });
      lines.push('');
    }

    // Gap Analysis
    if (result.gapAnalysis) {
      lines.push('───────────────────────────────────────────────────────────────');
      lines.push('                      GAP ANALYSIS');
      lines.push('───────────────────────────────────────────────────────────────');
      lines.push('');
      
      if (result.gapAnalysis.fullMatches?.length) {
        lines.push('  ✓ FULL MATCHES:');
        result.gapAnalysis.fullMatches.forEach(item => {
          lines.push(`    • ${item.requirement}`);
          if (item.evidence) lines.push(`      Evidence: ${item.evidence}`);
        });
        lines.push('');
      }
      
      if (result.gapAnalysis.partialMatches?.length) {
        lines.push('  ~ PARTIAL MATCHES:');
        result.gapAnalysis.partialMatches.forEach(item => {
          lines.push(`    • ${item.requirement}`);
          if (item.recommendation) lines.push(`      Action: ${item.recommendation}`);
        });
        lines.push('');
      }
      
      if (result.gapAnalysis.missingRequirements?.length) {
        lines.push('  ✗ MISSING REQUIREMENTS:');
        result.gapAnalysis.missingRequirements.forEach(item => {
          lines.push(`    • ${item.requirement}`);
          if (item.workaround) lines.push(`      Workaround: ${item.workaround}`);
        });
        lines.push('');
      }
    }

    // Quick Wins
    if (result.quickWins?.length) {
      lines.push('───────────────────────────────────────────────────────────────');
      lines.push('                       QUICK WINS');
      lines.push('───────────────────────────────────────────────────────────────');
      lines.push('');
      result.quickWins.forEach((win, i) => {
        lines.push(`  ${i + 1}. ${win}`);
      });
      lines.push('');
    }

    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('              Generated by CareerIQ ResumeMatch');
    lines.push('═══════════════════════════════════════════════════════════════');

    return lines.join('\n');
  };

  const handleExportText = async () => {
    setIsExporting(true);
    try {
      const report = generateTextReport();
      const blob = new Blob([report], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resume-match-report-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Report downloaded');
    } catch (error) {
      toast.error('Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      const margin = 20;
      let y = margin;
      const lineHeight = 6;
      const pageWidth = doc.internal.pageSize.getWidth();

      // Title
      doc.setFontSize(18);
      doc.setTextColor(30, 58, 138);
      doc.text('Resume Match Report', pageWidth / 2, y, { align: 'center' });
      y += lineHeight * 2;

      // Date and meta
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
      y += lineHeight;
      doc.text(`Role: ${result.detected?.role || 'N/A'} | Industry: ${result.detected?.industry || 'N/A'}`, margin, y);
      y += lineHeight * 2;

      // Overall Score Box
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(margin, y, pageWidth - margin * 2, 25, 3, 3, 'F');
      
      doc.setFontSize(24);
      doc.setTextColor(30, 58, 138);
      doc.text(`${result.overallScore}%`, margin + 10, y + 17);
      
      doc.setFontSize(12);
      doc.text(`${result.tier?.tier || 'N/A'}`, margin + 45, y + 15);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(result.tier?.message || '', margin + 45, y + 21);
      y += 35;

      // Score Breakdown
      doc.setFontSize(12);
      doc.setTextColor(30, 58, 138);
      doc.text('Score Breakdown', margin, y);
      y += lineHeight;

      doc.setFontSize(10);
      doc.setTextColor(55, 65, 81);
      const scores = [
        `JD Match: ${result.scores?.jdMatch?.score || 0}%`,
        `Industry: ${result.scores?.industryBenchmark?.score || 0}%`,
        `ATS: ${result.scores?.atsCompliance?.score || 0}%`,
        `Voice: ${result.scores?.humanVoice?.score || 0}%`
      ];
      doc.text(scores.join('  |  '), margin, y);
      y += lineHeight * 2;

      // Quick Wins
      if (result.quickWins?.length) {
        doc.setFontSize(12);
        doc.setTextColor(30, 58, 138);
        doc.text('Quick Wins', margin, y);
        y += lineHeight;

        doc.setFontSize(10);
        doc.setTextColor(55, 65, 81);
        result.quickWins.forEach((win, i) => {
          const lines = doc.splitTextToSize(`${i + 1}. ${win}`, pageWidth - margin * 2);
          doc.text(lines, margin, y);
          y += lines.length * lineHeight;
        });
      }

      doc.save(`resume-match-report-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF downloaded');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportText}>
          <FileText className="h-4 w-4 mr-2" />
          Export as Text
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportPDF}>
          <FileText className="h-4 w-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
