/**
 * GapAssessmentStep - Professional structured comparison
 * Based on the 5-section format: Matches, Partial, Missing, Overqualified, Irrelevant
 */

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckCircle2, AlertTriangle, XCircle, Star, Trash2 } from 'lucide-react';
import type { BenchmarkBuilderState } from '../types';

interface GapAssessmentStepProps {
  state: BenchmarkBuilderState;
  onNext: () => void;
  onUpdateState: (updates: Partial<BenchmarkBuilderState>) => void;
}

export function GapAssessmentStep({ state, onNext }: GapAssessmentStepProps) {
  const analysis = state.gapAnalysis;
  
  // Fallback if no structured analysis yet
  if (!analysis) {
    return (
      <div className="h-full overflow-auto bg-background">
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Gap analysis data not available.</p>
            <Button onClick={onNext} className="mt-4">Continue to Next Step</Button>
          </div>
        </div>
      </div>
    );
  }

  const totalMatches = analysis.fullMatches.length;
  const totalPartial = analysis.partialMatches.length;
  const totalMissing = analysis.missingRequirements.length;

  return (
    <div className="h-full overflow-auto bg-background">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        
        {/* Header */}
        <div className="border-b pb-4">
          <h1 className="text-2xl font-bold">Resume vs. Job Description Analysis</h1>
          <p className="text-muted-foreground mt-1">
            Comparing your resume against {state.detected.role || 'this role'}
            {state.detected.industry && ` in ${state.detected.industry}`}
          </p>
        </div>

        {/* Score Summary - Single Line */}
        <div className="flex items-center gap-6 p-4 border rounded-lg">
          <div className="text-center">
            <p className="text-4xl font-bold">{state.currentScore}</p>
            <p className="text-xs text-muted-foreground uppercase">Score</p>
          </div>
          <div className="h-12 w-px bg-border" />
          <div className="flex gap-6 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>{totalMatches} matched</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span>{totalPartial} partial</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span>{totalMissing} missing</span>
            </div>
          </div>
        </div>

        {/* Section 1: Full Matches */}
        {analysis.fullMatches.length > 0 && (
          <section>
            <SectionHeader 
              icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
              title="What You Have That Matches"
              count={analysis.fullMatches.length}
            />
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Requirement</th>
                    <th className="text-left p-3 font-medium">Your Evidence</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.fullMatches.map((match, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="p-3 align-top">{match.requirement}</td>
                      <td className="p-3 align-top text-muted-foreground">{match.evidence}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Section 2: Partial Matches */}
        {analysis.partialMatches.length > 0 && (
          <section>
            <SectionHeader 
              icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
              title="Partial Matches – Need Enhancement"
              count={analysis.partialMatches.length}
            />
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Requirement</th>
                    <th className="text-left p-3 font-medium">Current Status</th>
                    <th className="text-left p-3 font-medium">Recommendation</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.partialMatches.map((match, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="p-3 align-top font-medium">{match.requirement}</td>
                      <td className="p-3 align-top text-muted-foreground">{match.currentStatus}</td>
                      <td className="p-3 align-top text-primary">{match.recommendation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Section 3: Missing Requirements */}
        {analysis.missingRequirements.length > 0 && (
          <section>
            <SectionHeader 
              icon={<XCircle className="h-5 w-5 text-red-500" />}
              title="Missing or Underrepresented"
              count={analysis.missingRequirements.length}
            />
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Missing Requirement</th>
                    <th className="text-left p-3 font-medium">Workaround / Strategy</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.missingRequirements.map((item, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="p-3 align-top font-medium">{item.requirement}</td>
                      <td className="p-3 align-top text-muted-foreground">{item.workaround}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Section 4: Overqualifications */}
        {analysis.overqualifications.length > 0 && (
          <section>
            <SectionHeader 
              icon={<Star className="h-5 w-5 text-primary" />}
              title="High-Value Experience to Emphasize"
              count={analysis.overqualifications.length}
            />
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Your Experience</th>
                    <th className="text-left p-3 font-medium">How to Position</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.overqualifications.map((item, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="p-3 align-top">{item.experience}</td>
                      <td className="p-3 align-top text-muted-foreground">{item.recommendation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Section 5: Irrelevant Content */}
        {analysis.irrelevantContent.length > 0 && (
          <section>
            <SectionHeader 
              icon={<Trash2 className="h-5 w-5 text-muted-foreground" />}
              title="Content to Remove or Compress"
              count={analysis.irrelevantContent.length}
            />
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Content</th>
                    <th className="text-left p-3 font-medium">Recommendation</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.irrelevantContent.map((item, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="p-3 align-top">{item.content}</td>
                      <td className="p-3 align-top text-muted-foreground">{item.recommendation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Gap Summary */}
        {analysis.gapSummary.length > 0 && (
          <section className="border rounded-lg p-4">
            <h3 className="font-semibold mb-3">Summary of Key Gaps</h3>
            <ul className="space-y-2">
              {analysis.gapSummary.map((gap, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-muted-foreground">•</span>
                  <span>{gap}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* CTA */}
        <div className="flex justify-center pt-4 pb-8">
          <Button size="lg" onClick={onNext} className="gap-2">
            Build My Must-Interview Résumé
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ 
  icon, 
  title, 
  count 
}: { 
  icon: React.ReactNode; 
  title: string; 
  count: number;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {icon}
      <h2 className="font-semibold">{title}</h2>
      <Badge variant="secondary" className="text-xs">{count}</Badge>
    </div>
  );
}
