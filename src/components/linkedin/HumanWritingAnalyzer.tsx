import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface AnalysisResult {
  sentenceLengthIssues: { sentence: string; wordCount: number }[];
  conceptDensityIssues: string[];
  passiveVoiceCount: number;
  contractionCount: number;
  wordCount: number;
  forbiddenWords: string[];
  hasCTA: boolean;
}

export function HumanWritingAnalyzer({ content }: { content: string }) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    if (!content) {
      setAnalysis(null);
      return;
    }

    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = content.split(/\s+/);
    const wordCount = words.length;

    // Check sentence length
    const sentenceLengthIssues = sentences
      .map(s => ({ sentence: s.trim(), wordCount: s.trim().split(/\s+/).length }))
      .filter(s => s.wordCount > 18);

    // Check concept density (commas + conjunctions indicating multiple ideas)
    const conceptDensityIssues = sentences.filter(s => {
      const commaCount = (s.match(/,/g) || []).length;
      const conjunctions = (s.match(/\b(and|or|but|while|whereas|although)\b/gi) || []).length;
      return commaCount > 2 || (commaCount > 1 && conjunctions > 1);
    });

    // Check passive voice
    const passiveVoiceCount = (content.match(/\b(was|were|been|being)\s+\w+ed\b/gi) || []).length;

    // Check contractions
    const contractionCount = (content.match(/\b\w+[''](?:ll|re|s|t|ve|d|m)\b/gi) || []).length;

    // Check forbidden words
    const forbiddenTerms = [
      'utilize', 'leverage', 'synergy', 'holistic', 'implement', 'execute',
      'strategize', 'robust', 'comprehensive', 'paradigm', 'facilitate', 'optimize'
    ];
    const forbiddenWords = forbiddenTerms.filter(term =>
      content.toLowerCase().includes(term)
    );

    // Check for CTA (question at end)
    const hasCTA = /\?[^?]*$/.test(content.trim());

    setAnalysis({
      sentenceLengthIssues,
      conceptDensityIssues,
      passiveVoiceCount,
      contractionCount,
      wordCount,
      forbiddenWords,
      hasCTA
    });
  }, [content]);

  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Human Writing Analyzer</CardTitle>
          <CardDescription>Paste or write content to see live analysis</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const getWordCountStatus = () => {
    if (analysis.wordCount < 220) return { color: 'text-yellow-600', label: 'Too short', variant: 'warning' as const };
    if (analysis.wordCount > 280) return { color: 'text-yellow-600', label: 'Too long', variant: 'warning' as const };
    if (analysis.wordCount >= 240 && analysis.wordCount <= 260) {
      return { color: 'text-green-600', label: 'Perfect', variant: 'success' as const };
    }
    return { color: 'text-blue-600', label: 'Good', variant: 'info' as const };
  };

  const wordCountStatus = getWordCountStatus();
  const wordCountProgress = Math.min((analysis.wordCount / 260) * 100, 100);

  const CheckItem = ({ passed, label }: { passed: boolean; label: string }) => (
    <div className="flex items-center gap-2">
      {passed ? (
        <CheckCircle2 className="h-4 w-4 text-green-600" />
      ) : (
        <XCircle className="h-4 w-4 text-destructive" />
      )}
      <span className={passed ? 'text-green-600' : 'text-destructive'}>{label}</span>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Human Writing Analyzer</CardTitle>
        <CardDescription>Real-time authenticity checks</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Word Count */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Word Count</span>
            <span className={`text-sm font-medium ${wordCountStatus.color}`}>
              {analysis.wordCount} / 260 ({wordCountStatus.label})
            </span>
          </div>
          <Progress value={wordCountProgress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">Target: 240-260 words</p>
        </div>

        {/* Quality Checklist */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Quality Checks</h4>
          <CheckItem
            passed={analysis.sentenceLengthIssues.length === 0}
            label={`All sentences ≤18 words ${analysis.sentenceLengthIssues.length > 0 ? `(${analysis.sentenceLengthIssues.length} issues)` : ''}`}
          />
          <CheckItem
            passed={analysis.conceptDensityIssues.length === 0}
            label={`One concept per sentence ${analysis.conceptDensityIssues.length > 0 ? `(${analysis.conceptDensityIssues.length} dense)` : ''}`}
          />
          <CheckItem
            passed={analysis.passiveVoiceCount === 0}
            label={`No passive voice ${analysis.passiveVoiceCount > 0 ? `(${analysis.passiveVoiceCount} found)` : ''}`}
          />
          <CheckItem
            passed={analysis.contractionCount >= 3}
            label={`Contractions used (${analysis.contractionCount})`}
          />
          <CheckItem
            passed={analysis.forbiddenWords.length === 0}
            label={`No jargon ${analysis.forbiddenWords.length > 0 ? `(${analysis.forbiddenWords.length} found)` : ''}`}
          />
          <CheckItem
            passed={analysis.hasCTA}
            label="Ends with question (CTA)"
          />
        </div>

        {/* Issues Detail */}
        {analysis.sentenceLengthIssues.length > 0 && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">Long Sentences ({analysis.sentenceLengthIssues.length})</p>
                <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                  {analysis.sentenceLengthIssues.slice(0, 2).map((s, i) => (
                    <li key={i}>{s.wordCount} words: {s.sentence.substring(0, 60)}...</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {analysis.forbiddenWords.length > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-700 dark:text-yellow-600">Jargon Detected</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {analysis.forbiddenWords.map((word, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{word}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}