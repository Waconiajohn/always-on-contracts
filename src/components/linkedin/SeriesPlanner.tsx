import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Edit2, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSeriesManagement } from "@/hooks/useSeriesManagement";
import { validateInput, invokeEdgeFunction, GenerateSeriesOutlineSchema } from "@/lib/edgeFunction";
import { logger } from "@/lib/logger";

interface SeriesOutline {
  seriesTitle: string;
  parts: Array<{
    partNumber: number;
    title: string;
    focusStatement: string;
    category: string;
  }>;
}

export function SeriesPlanner({ onSeriesCreated }: { onSeriesCreated?: (seriesId: string) => void }) {
  const [seriesTopic, setSeriesTopic] = useState("");
  const [seriesLength, setSeriesLength] = useState<8 | 12 | 16>(12);
  const [userRole, setUserRole] = useState("");
  const [industry, setIndustry] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [outline, setOutline] = useState<SeriesOutline | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingPart, setEditingPart] = useState<number | null>(null);
  const [editedFocus, setEditedFocus] = useState("");
  const { toast } = useToast();
  const { createSeries } = useSeriesManagement();

  const handleGenerateOutline = async () => {
    if (!seriesTopic.trim()) {
      toast({ title: "Topic required", description: "Please enter a series topic", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    try {
      const validated = validateInput(GenerateSeriesOutlineSchema, {
        topic: seriesTopic,
        targetAudience,
        postCount: seriesLength
      });

      const { data, error } = await invokeEdgeFunction(
        supabase,
        'generate-series-outline',
        {
          ...validated,
          userRole,
          industry,
          experienceYears: experienceYears ? parseInt(experienceYears) : null
        },
        {
          showSuccessToast: true,
          successMessage: `${seriesLength}-part series ready for review`
        }
      );

      if (error || !data) {
        throw new Error(error?.message || 'Generation failed');
      }

      setOutline(data);
    } catch (error: any) {
      logger.error('Series outline generation failed', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditFocus = (partNumber: number, currentFocus: string) => {
    setEditingPart(partNumber);
    setEditedFocus(currentFocus);
  };

  const handleSaveFocus = () => {
    if (outline && editingPart !== null) {
      const updatedParts = outline.parts.map(part =>
        part.partNumber === editingPart
          ? { ...part, focusStatement: editedFocus }
          : part
      );
      setOutline({ ...outline, parts: updatedParts });
      setEditingPart(null);
      toast({ title: "Focus updated" });
    }
  };

  const handleCreateSeries = async () => {
    if (!outline) return;

    try {
      const series = await createSeries({
        series_topic: seriesTopic,
        series_title: outline.seriesTitle,
        series_length: seriesLength,
        target_audience: targetAudience || undefined,
        user_role: userRole || undefined,
        industry: industry || undefined,
        experience_years: experienceYears ? parseInt(experienceYears) : undefined,
        outline_data: outline.parts
      });

      toast({
        title: "Series created!",
        description: "You can now generate individual posts from this series"
      });

      if (onSeriesCreated && series) {
        onSeriesCreated(series.id);
      }

      // Reset form
      setOutline(null);
      setSeriesTopic("");
    } catch (error) {
      // Error handled in useSeriesManagement
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'foundation': return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      case 'implementation': return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'leadership': return 'bg-purple-500/10 text-purple-700 dark:text-purple-400';
      default: return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Plan Your Blog Series</CardTitle>
          <CardDescription>Create 8, 12, or 16-part LinkedIn series with AI-generated outlines</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="seriesTopic">Series Topic *</Label>
            <Input
              id="seriesTopic"
              placeholder="e.g., Combining Agile with Waterfall Project Management"
              value={seriesTopic}
              onChange={(e) => setSeriesTopic(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="seriesLength">Series Length</Label>
              <Select value={seriesLength.toString()} onValueChange={(v) => setSeriesLength(parseInt(v) as 8 | 12 | 16)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="8">8 Parts (2 weeks)</SelectItem>
                  <SelectItem value="12">12 Parts (3 weeks)</SelectItem>
                  <SelectItem value="16">16 Parts (4 weeks)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="experienceYears">Your Experience (years)</Label>
              <Input
                id="experienceYears"
                type="number"
                placeholder="e.g., 15"
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="userRole">Your Role</Label>
              <Input
                id="userRole"
                placeholder="e.g., Senior Project Manager"
                value={userRole}
                onChange={(e) => setUserRole(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                placeholder="e.g., Tech, Healthcare"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="targetAudience">Target Audience</Label>
            <Textarea
              id="targetAudience"
              placeholder="e.g., Mid-level managers transitioning to senior roles"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              rows={2}
            />
          </div>

          <Button onClick={handleGenerateOutline} disabled={isGenerating} className="w-full">
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Generate Series Outline
          </Button>
        </CardContent>
      </Card>

      {outline && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{outline.seriesTitle}</CardTitle>
                <CardDescription className="mt-2">
                  {outline.parts.length} parts • Review and edit focus statements below
                </CardDescription>
              </div>
              <Button onClick={handleCreateSeries}>
                <Save className="mr-2 h-4 w-4" />
                Create Series
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {outline.parts.map((part) => (
                <AccordionItem key={part.partNumber} value={`part-${part.partNumber}`}>
                  <AccordionTrigger>
                    <div className="flex items-center gap-3 text-left">
                      <Badge variant="outline">Part {part.partNumber}</Badge>
                      <span className="font-medium">{part.title}</span>
                      <Badge className={getCategoryColor(part.category)}>{part.category}</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Focus Statement ({part.focusStatement.split(' ').length} words)</Label>
                        {editingPart === part.partNumber ? (
                          <div className="flex gap-2 mt-1">
                            <Textarea
                              value={editedFocus}
                              onChange={(e) => setEditedFocus(e.target.value)}
                              rows={2}
                              className="text-sm"
                            />
                            <Button size="sm" onClick={handleSaveFocus}>
                              <Save className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-2 items-start mt-1">
                            <p className="text-sm flex-1">{part.focusStatement}</p>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditFocus(part.partNumber, part.focusStatement)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}
    </div>
  );
}