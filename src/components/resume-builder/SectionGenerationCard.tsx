import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Edit2, Save, X, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface SectionVersion {
  type: 'ideal' | 'personalized' | 'blend';
  title: string;
  content: string;
  atsScore: number;
  reasoning: string;
}

interface SectionGenerationCardProps {
  sectionType: string;
  idealVersion: {
    content: string;
    quality: any;
  };
  personalizedVersion: {
    content: string;
    quality: any;
    vaultItemsUsed: number;
  };
  blendVersion: {
    content: string;
    quality: any;
  };
  comparison: {
    recommendation: 'ideal' | 'personalized' | 'blend';
    recommendationReason: string;
    vaultStrength: number;
  };
  onSelectVersion: (content: string) => void;
  onCancel: () => void;
}

export const SectionGenerationCard = ({
  sectionType,
  idealVersion,
  personalizedVersion,
  blendVersion,
  comparison,
  onSelectVersion,
  onCancel
}: SectionGenerationCardProps) => {
  const [editingContent, setEditingContent] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState<Record<string, boolean>>({});
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);

  const versions: SectionVersion[] = [
    {
      type: 'ideal',
      title: '💎 Industry Standard',
      content: idealVersion.content,
      atsScore: idealVersion.quality?.atsMatchPercentage || 0,
      reasoning: 'Based on research of top-performing professionals. Includes all critical ATS keywords and follows industry best practices.'
    },
    {
      type: 'personalized',
      title: '⭐ Your Experience',
      content: personalizedVersion.content,
      atsScore: personalizedVersion.quality?.atsMatchPercentage || 0,
      reasoning: `Uses ${personalizedVersion.vaultItemsUsed} items from your Career Vault. Your actual achievements and metrics make this authentic and compelling.`
    },
    {
      type: 'blend',
      title: '🎯 AI Combined',
      content: blendVersion.content,
      atsScore: blendVersion.quality?.atsMatchPercentage || 0,
      reasoning: 'AI has intelligently combined both versions, using industry-standard structure with your actual achievements and metrics.'
    }
  ];

  const handleStartEdit = (type: string, content: string) => {
    setEditingContent({ ...editingContent, [type]: content });
    setIsEditing({ ...isEditing, [type]: true });
  };

  const handleSaveEdit = (type: string) => {
    setIsEditing({ ...isEditing, [type]: false });
    toast.success('Changes saved');
  };

  const handleCancelEdit = (type: string, originalContent: string) => {
    setEditingContent({ ...editingContent, [type]: originalContent });
    setIsEditing({ ...isEditing, [type]: false });
  };

  const handleSelectVersion = (version: SectionVersion) => {
    const contentToUse = editingContent[version.type] || version.content;
    onSelectVersion(contentToUse);
    setSelectedVersion(version.type);
    toast.success(`${version.title} applied to ${sectionType} section`);
  };

  // Determine which version to highlight as recommended
  const recommendedType = comparison.recommendation === 'blend' ? 'blend' : 
                          comparison.recommendation === 'personalized' ? 'personalized' : 
                          'ideal';

  return (
    <Card className="p-4 border-primary/50 bg-primary/5">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-foreground">AI Generated {sectionType} Section</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Vault Strength: {comparison.vaultStrength}% • {comparison.recommendationReason}
            </p>
          </div>
          <Button size="sm" variant="ghost" onClick={onCancel} className="h-7">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Warning for low vault strength */}
        {comparison.vaultStrength < 40 && (
          <div className="p-2 bg-warning/10 border border-warning/30 rounded text-xs">
            ⚠️ Limited vault data available. Industry Standard version recommended.
          </div>
        )}

        {/* Version Tabs */}
        <Tabs defaultValue={recommendedType} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger 
              value="ideal" 
              className="text-xs flex flex-col items-center py-2 px-1"
            >
              <span className="text-base mb-1">💎</span>
              <span className="font-medium">Industry Standard</span>
              <span className="text-[10px] text-muted-foreground">AI from best practices</span>
              {recommendedType === 'ideal' && (
                <Badge variant="default" className="text-[9px] px-1 py-0 mt-1">Recommended</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="personalized" 
              className="text-xs flex flex-col items-center py-2 px-1"
              disabled={comparison.vaultStrength < 30}
            >
              <span className="text-base mb-1">⭐</span>
              <span className="font-medium">Your Experience</span>
              <span className="text-[10px] text-muted-foreground">From your vault</span>
              {recommendedType === 'personalized' && (
                <Badge variant="default" className="text-[9px] px-1 py-0 mt-1">Recommended</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="blend" 
              className="text-xs flex flex-col items-center py-2 px-1"
            >
              <span className="text-base mb-1">🎯</span>
              <span className="font-medium">AI Combined</span>
              <span className="text-[10px] text-muted-foreground">Best of both</span>
              {recommendedType === 'blend' && (
                <Badge variant="default" className="text-[9px] px-1 py-0 mt-1">Recommended</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {versions.map((version) => (
            <TabsContent
              key={version.type}
              value={version.type}
              className="space-y-3 mt-3"
            >
              <div className="p-3 bg-card rounded border">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-sm font-semibold">{version.title}</h5>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {version.atsScore}% ATS Match
                    </Badge>
                    {!isEditing[version.type] && !selectedVersion && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStartEdit(version.type, version.content)}
                        className="h-7 px-2 gap-1"
                      >
                        <Edit2 className="h-3 w-3" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>

                {isEditing[version.type] ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editingContent[version.type] || version.content}
                      onChange={(e) => setEditingContent({
                        ...editingContent,
                        [version.type]: e.target.value
                      })}
                      className="min-h-[150px] text-sm font-mono"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleSaveEdit(version.type)}
                        className="flex-1 gap-1"
                      >
                        <Save className="h-3 w-3" />
                        Save Changes
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancelEdit(version.type, version.content)}
                        className="flex-1 gap-1"
                      >
                        <X className="h-3 w-3" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {sectionType === 'skills' || sectionType === 'skills_list' ? (
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {(editingContent[version.type] || version.content)
                          .split(',')
                          .map((skill: string, idx: number) => (
                            <div key={idx} className="text-xs px-2 py-1 bg-primary/10 rounded text-foreground">
                              {skill.trim()}
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-sm mb-3 whitespace-pre-line font-mono text-foreground">
                        {editingContent[version.type] || version.content}
                      </div>
                    )}
                  </>
                )}

                {!isEditing[version.type] && (
                  <>
                    <div className="text-xs text-muted-foreground mb-3 p-2 bg-muted/50 rounded">
                      <span className="font-medium">Why this works: </span>
                      {version.reasoning}
                    </div>

                    {selectedVersion === version.type ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled
                        className="w-full gap-2"
                      >
                        <CheckCircle2 className="h-3 w-3 text-success" />
                        Applied to Resume
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleSelectVersion(version)}
                        className="w-full"
                        disabled={!!selectedVersion || (version.type === 'personalized' && comparison.vaultStrength < 30)}
                      >
                        {version.type === 'personalized' && comparison.vaultStrength < 30
                          ? 'Complete Vault First'
                          : 'Use This Version'}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </Card>
  );
};
