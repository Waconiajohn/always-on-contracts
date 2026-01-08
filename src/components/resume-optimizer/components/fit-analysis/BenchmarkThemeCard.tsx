import { Card, CardContent } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import { EvidenceTag } from './EvidenceTag';
import { BenchmarkThemeCardProps } from './types';

export function BenchmarkThemeCard({ theme, getEvidenceById }: BenchmarkThemeCardProps) {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <Sparkles className="h-4 w-4 text-primary mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium">{theme.theme}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {theme.evidenceIds.map((evidenceId) => (
                <EvidenceTag 
                  key={evidenceId}
                  evidenceId={evidenceId} 
                  getEvidenceById={getEvidenceById} 
                />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
