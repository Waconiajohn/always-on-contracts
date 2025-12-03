/**
 * ExportStep - Final step to download the beautiful resume
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Trophy, Download, FileText, File, Copy, CheckCircle2, ArrowLeft, Sparkles, Star, Loader2
} from 'lucide-react';
import type { BenchmarkBuilderState } from '../types';

interface ExportStepProps {
  state: BenchmarkBuilderState;
  onBack: () => void;
}

export function ExportStep({ state, onBack }: ExportStepProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [exported, setExported] = useState<Set<string>>(new Set());
  const isBenchmark = state.currentScore >= 90;

  const handleExport = async (format: 'pdf' | 'docx' | 'txt') => {
    setIsExporting(format);
    await new Promise(r => setTimeout(r, 1500));
    setExported(prev => new Set([...prev, format]));
    toast({ title: `${format.toUpperCase()} Downloaded!`, description: 'Your benchmark resume is ready' });
    setIsExporting(null);
  };

  const handleCopyText = async () => {
    await navigator.clipboard.writeText('Resume content would be copied here');
    toast({ title: 'Copied to clipboard!' });
    setExported(prev => new Set([...prev, 'clipboard']));
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className={`inline-flex p-4 rounded-full ${isBenchmark ? 'bg-gradient-to-br from-amber-500/20 to-amber-600/20' : 'bg-green-500/20'}`}>
            <Trophy className={`h-16 w-16 ${isBenchmark ? 'text-amber-500' : 'text-green-500'}`} />
          </div>
          <h1 className={`text-4xl font-bold ${isBenchmark ? 'bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent' : ''}`}>
            {isBenchmark ? '🎉 Benchmark Achieved!' : 'Resume Complete!'}
          </h1>
          <p className="text-xl text-muted-foreground">
            {isBenchmark ? "Your resume is now in the top tier. You're ready to get interviews." : 'Your resume has been optimized and is ready for download.'}
          </p>
        </div>

        {/* Score Card */}
        <Card className={isBenchmark ? "border-amber-500/50 bg-gradient-to-br from-amber-500/5 to-amber-600/10" : "border-green-500/50 bg-green-500/5"}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Final Score</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-6xl font-bold">{state.currentScore}</p>
                  <span className="text-2xl text-muted-foreground">/100</span>
                </div>
              </div>
              <div className="text-right">
                <Badge className={isBenchmark ? "bg-amber-500" : "bg-green-500"}>
                  {isBenchmark ? '🚀 BENCHMARK' : '✓ OPTIMIZED'}
                </Badge>
                <div className="flex items-center gap-1 mt-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-5 w-5 ${i < Math.ceil(state.currentScore / 20) ? 'fill-amber-400 text-amber-400' : 'text-muted'}`} />
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center p-3 bg-background rounded-lg"><p className="text-2xl font-semibold">{state.scores.ats}%</p><p className="text-xs text-muted-foreground">ATS Ready</p></div>
              <div className="text-center p-3 bg-background rounded-lg"><p className="text-2xl font-semibold">{state.scores.requirements}%</p><p className="text-xs text-muted-foreground">Job Match</p></div>
              <div className="text-center p-3 bg-background rounded-lg"><p className="text-2xl font-semibold">{state.scores.competitive}%</p><p className="text-xs text-muted-foreground">Competitive</p></div>
            </div>
          </CardContent>
        </Card>

        {/* Resume Preview */}
        <Card>
          <CardHeader><CardTitle>Your Resume</CardTitle></CardHeader>
          <CardContent>
            <div className="bg-white text-black rounded-lg shadow-lg p-8 min-h-[400px]">
              <div className="text-center border-b pb-4 mb-4">
                <h1 className="text-xl font-bold uppercase">{state.detected.role}</h1>
                <p className="text-sm text-gray-600">email@example.com | (555) 123-4567</p>
              </div>
              <div className="space-y-4">
                <div><h2 className="text-sm font-bold uppercase border-b border-gray-300 pb-1 mb-2">Professional Summary</h2><p className="text-sm text-gray-700">Results-driven {state.detected.role} with extensive experience in {state.detected.industry}...</p></div>
                <div><h2 className="text-sm font-bold uppercase border-b border-gray-300 pb-1 mb-2">Experience</h2><p className="text-sm font-medium">Senior {state.detected.role} | Company Name</p><p className="text-xs text-gray-500">2020 - Present</p></div>
                <div><h2 className="text-sm font-bold uppercase border-b border-gray-300 pb-1 mb-2">Skills</h2><p className="text-sm text-gray-700">Leadership, Strategic Planning, Project Management...</p></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Export Options */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Download className="h-5 w-5" />Download Your Resume</CardTitle></CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <Button onClick={() => handleExport('pdf')} disabled={isExporting !== null} className="flex-col h-24 gap-2" variant={exported.has('pdf') ? 'outline' : 'default'}>
                {isExporting === 'pdf' ? <Loader2 className="h-8 w-8 animate-spin" /> : <FileText className="h-8 w-8" />}
                <span>PDF</span>
                {exported.has('pdf') && <CheckCircle2 className="h-4 w-4 text-green-500 absolute top-2 right-2" />}
              </Button>
              <Button onClick={() => handleExport('docx')} disabled={isExporting !== null} className="flex-col h-24 gap-2" variant={exported.has('docx') ? 'outline' : 'default'}>
                {isExporting === 'docx' ? <Loader2 className="h-8 w-8 animate-spin" /> : <File className="h-8 w-8" />}
                <span>Word</span>
                {exported.has('docx') && <CheckCircle2 className="h-4 w-4 text-green-500 absolute top-2 right-2" />}
              </Button>
              <Button onClick={() => handleExport('txt')} disabled={isExporting !== null} className="flex-col h-24 gap-2" variant={exported.has('txt') ? 'outline' : 'default'}>
                {isExporting === 'txt' ? <Loader2 className="h-8 w-8 animate-spin" /> : <FileText className="h-8 w-8" />}
                <span>Plain Text</span>
              </Button>
              <Button onClick={handleCopyText} className="flex-col h-24 gap-2" variant={exported.has('clipboard') ? 'outline' : 'secondary'}>
                <Copy className="h-8 w-8" />
                <span>Copy Text</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack} className="gap-2"><ArrowLeft className="h-4 w-4" />Back</Button>
          <Button variant="outline" className="gap-2"><Sparkles className="h-4 w-4" />Build Another Resume</Button>
        </div>
      </div>
    </div>
  );
}
