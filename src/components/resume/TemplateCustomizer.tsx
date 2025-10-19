import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Palette, Type, Layout, Sparkles, RotateCcw } from "lucide-react";
import { useState } from "react";

interface TemplateCustomization {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  sectionSpacing: number;
  headerStyle: 'modern' | 'classic' | 'minimal';
  borderStyle: 'none' | 'subtle' | 'bold';
}

interface TemplateCustomizerProps {
  customization: TemplateCustomization;
  onChange: (customization: TemplateCustomization) => void;
  onReset: () => void;
  onApplyPreset: (preset: string) => void;
}

const defaultPresets = {
  professional: {
    primaryColor: '#2563eb',
    secondaryColor: '#64748b',
    accentColor: '#0ea5e9',
    fontFamily: 'Inter',
    fontSize: 11,
    lineHeight: 1.5,
    sectionSpacing: 16,
    headerStyle: 'modern' as const,
    borderStyle: 'subtle' as const,
  },
  executive: {
    primaryColor: '#1e293b',
    secondaryColor: '#475569',
    accentColor: '#0f172a',
    fontFamily: 'Georgia',
    fontSize: 12,
    lineHeight: 1.6,
    sectionSpacing: 20,
    headerStyle: 'classic' as const,
    borderStyle: 'bold' as const,
  },
  creative: {
    primaryColor: '#8b5cf6',
    secondaryColor: '#ec4899',
    accentColor: '#06b6d4',
    fontFamily: 'Poppins',
    fontSize: 11,
    lineHeight: 1.4,
    sectionSpacing: 14,
    headerStyle: 'minimal' as const,
    borderStyle: 'none' as const,
  },
  tech: {
    primaryColor: '#10b981',
    secondaryColor: '#6366f1',
    accentColor: '#f59e0b',
    fontFamily: 'Roboto',
    fontSize: 10,
    lineHeight: 1.5,
    sectionSpacing: 12,
    headerStyle: 'modern' as const,
    borderStyle: 'subtle' as const,
  },
};

export function TemplateCustomizer({
  customization,
  onChange,
  onReset,
  onApplyPreset
}: TemplateCustomizerProps) {
  const [activeTab, setActiveTab] = useState('colors');

  const updateField = (field: keyof TemplateCustomization, value: any) => {
    onChange({ ...customization, [field]: value });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>Template Customization</CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={onReset} className="gap-2">
            <RotateCcw className="h-3 w-3" />
            Reset
          </Button>
        </div>
        <CardDescription>Customize your resume's appearance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Presets */}
        <div>
          <Label className="mb-3 block">Quick Presets</Label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(defaultPresets).map(([name, preset]) => (
              <Button
                key={name}
                variant="outline"
                size="sm"
                onClick={() => onApplyPreset(name)}
                className="justify-start gap-2"
              >
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: preset.primaryColor }}
                />
                <span className="capitalize">{name}</span>
              </Button>
            ))}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="colors" className="gap-2">
              <Palette className="h-4 w-4" />
              Colors
            </TabsTrigger>
            <TabsTrigger value="typography" className="gap-2">
              <Type className="h-4 w-4" />
              Typography
            </TabsTrigger>
            <TabsTrigger value="layout" className="gap-2">
              <Layout className="h-4 w-4" />
              Layout
            </TabsTrigger>
          </TabsList>

          <TabsContent value="colors" className="space-y-4 mt-4">
            <div>
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="primaryColor"
                  type="color"
                  value={customization.primaryColor}
                  onChange={(e) => updateField('primaryColor', e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={customization.primaryColor}
                  onChange={(e) => updateField('primaryColor', e.target.value)}
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Used for headers and emphasis
              </p>
            </div>

            <div>
              <Label htmlFor="secondaryColor">Secondary Color</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="secondaryColor"
                  type="color"
                  value={customization.secondaryColor}
                  onChange={(e) => updateField('secondaryColor', e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={customization.secondaryColor}
                  onChange={(e) => updateField('secondaryColor', e.target.value)}
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Used for subheadings and secondary text
              </p>
            </div>

            <div>
              <Label htmlFor="accentColor">Accent Color</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="accentColor"
                  type="color"
                  value={customization.accentColor}
                  onChange={(e) => updateField('accentColor', e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={customization.accentColor}
                  onChange={(e) => updateField('accentColor', e.target.value)}
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Used for highlights and links
              </p>
            </div>
          </TabsContent>

          <TabsContent value="typography" className="space-y-4 mt-4">
            <div>
              <Label htmlFor="fontFamily">Font Family</Label>
              <Select
                value={customization.fontFamily}
                onValueChange={(value) => updateField('fontFamily', value)}
              >
                <SelectTrigger id="fontFamily" className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inter">Inter (Modern Sans-serif)</SelectItem>
                  <SelectItem value="Georgia">Georgia (Classic Serif)</SelectItem>
                  <SelectItem value="Roboto">Roboto (Clean Sans-serif)</SelectItem>
                  <SelectItem value="Poppins">Poppins (Friendly Sans-serif)</SelectItem>
                  <SelectItem value="Merriweather">Merriweather (Elegant Serif)</SelectItem>
                  <SelectItem value="Arial">Arial (Universal Sans-serif)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="fontSize">
                Font Size: {customization.fontSize}pt
              </Label>
              <Slider
                id="fontSize"
                min={9}
                max={14}
                step={0.5}
                value={[customization.fontSize]}
                onValueChange={([value]) => updateField('fontSize', value)}
                className="mt-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Small (9pt)</span>
                <span>Large (14pt)</span>
              </div>
            </div>

            <div>
              <Label htmlFor="lineHeight">
                Line Height: {customization.lineHeight}
              </Label>
              <Slider
                id="lineHeight"
                min={1.2}
                max={2}
                step={0.1}
                value={[customization.lineHeight]}
                onValueChange={([value]) => updateField('lineHeight', value)}
                className="mt-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Tight (1.2)</span>
                <span>Loose (2.0)</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="layout" className="space-y-4 mt-4">
            <div>
              <Label htmlFor="sectionSpacing">
                Section Spacing: {customization.sectionSpacing}px
              </Label>
              <Slider
                id="sectionSpacing"
                min={8}
                max={32}
                step={2}
                value={[customization.sectionSpacing]}
                onValueChange={([value]) => updateField('sectionSpacing', value)}
                className="mt-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Compact (8px)</span>
                <span>Spacious (32px)</span>
              </div>
            </div>

            <div>
              <Label htmlFor="headerStyle">Header Style</Label>
              <Select
                value={customization.headerStyle}
                onValueChange={(value) => updateField('headerStyle', value)}
              >
                <SelectTrigger id="headerStyle" className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="modern">Modern (Bold & Clean)</SelectItem>
                  <SelectItem value="classic">Classic (Traditional)</SelectItem>
                  <SelectItem value="minimal">Minimal (Understated)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="borderStyle">Border Style</Label>
              <Select
                value={customization.borderStyle}
                onValueChange={(value) => updateField('borderStyle', value)}
              >
                <SelectTrigger id="borderStyle" className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="subtle">Subtle Lines</SelectItem>
                  <SelectItem value="bold">Bold Separators</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
        </Tabs>

        {/* Preview Badge */}
        <div className="p-3 bg-muted rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Current Style</span>
            <Badge variant="secondary">{customization.fontFamily}</Badge>
          </div>
          <div className="flex gap-2">
            <div
              className="w-8 h-8 rounded border"
              style={{ backgroundColor: customization.primaryColor }}
              title="Primary"
            />
            <div
              className="w-8 h-8 rounded border"
              style={{ backgroundColor: customization.secondaryColor }}
              title="Secondary"
            />
            <div
              className="w-8 h-8 rounded border"
              style={{ backgroundColor: customization.accentColor }}
              title="Accent"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export { defaultPresets };
export type { TemplateCustomization };
