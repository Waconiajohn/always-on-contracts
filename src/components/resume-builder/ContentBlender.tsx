import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { BlendedSectionOption } from '@/lib/edgeFunction/schemas';

interface ContentBlenderProps {
  sectionTitle: string;
  options: BlendedSectionOption[];
  onSelectOption: (selected: BlendedSectionOption) => void;
  onCancel?: () => void;
}

export const ContentBlender = ({
  sectionTitle,
  options,
  onSelectOption,
  onCancel
}: ContentBlenderProps) => {
  const [activeSource, setActiveSource] = useState<"benchmark" | "vault" | "blended">("blended");

  const current = options.find((o) => o.source === activeSource) || options[0];

  const handleSelect = () => {
    if (current) {
      onSelectOption(current);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{sectionTitle}</CardTitle>
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        <Tabs
          value={activeSource}
          onValueChange={(val) =>
            setActiveSource(val as "benchmark" | "vault" | "blended")
          }
        >
          <TabsList className="grid grid-cols-3 w-full mb-3">
            <TabsTrigger value="benchmark" className="text-xs">
              Benchmark
            </TabsTrigger>
            <TabsTrigger value="vault" className="text-xs">
              From your vault
            </TabsTrigger>
            <TabsTrigger value="blended" className="text-xs">
              Blended final
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeSource} className="space-y-3">
            <ul className="list-disc pl-5 space-y-2 text-sm">
              {current?.bullets.map((b, idx) => (
                <li key={idx}>{b}</li>
              ))}
            </ul>
            {current?.rationale && (
              <div className="bg-muted/50 rounded-md p-3 mt-3">
                <p className="text-xs text-muted-foreground">
                  <strong>Why this version:</strong> {current.rationale}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex flex-col gap-2 text-xs text-muted-foreground">
          <p>💡 <strong>Benchmark:</strong> Industry-standard language for this role</p>
          <p>🎯 <strong>From your vault:</strong> Based on your actual career history</p>
          <p>✨ <strong>Blended final:</strong> Recommended combination for this job</p>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          {onCancel && (
            <Button variant="outline" size="sm" onClick={onCancel}>
              Back
            </Button>
          )}
          <Button size="sm" onClick={handleSelect}>
            Use this version
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
