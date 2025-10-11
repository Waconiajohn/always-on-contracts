import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save } from "lucide-react";
import { toast } from "sonner";

interface SearchProfile {
  id?: string;
  profile_name: string;
  is_active: boolean | null;
  target_positions: string[] | null;
  target_industries: string[] | null;
  required_skills: string[] | null;
  preferred_skills: string[] | null;
  excluded_keywords: string[] | null;
  excluded_companies: string[] | null;
  min_hourly_rate: number | null;
  max_hourly_rate: number | null;
  min_contract_months: number | null;
  max_contract_months: number | null;
  remote_only: boolean | null;
  hybrid_acceptable: boolean | null;
  onsite_acceptable: boolean | null;
  preferred_locations: string[] | null;
  company_size_preferences: string[] | null;
  minimum_match_score: number | null;
}

const COMPANY_SIZES = ['startup', 'midsize', 'enterprise'];

interface SearchProfileEditorProps {
  profile: Partial<SearchProfile>;
  onSave: (profile: Partial<SearchProfile>) => void;
  onCancel: () => void;
}

export function SearchProfileEditor({ profile, onSave, onCancel }: SearchProfileEditorProps) {
  const [editingProfile, setEditingProfile] = useState<Partial<SearchProfile>>(profile);
  const [newItemInput, setNewItemInput] = useState("");

  const addArrayItem = (field: keyof SearchProfile, value: string) => {
    if (!value.trim()) return;
    
    const currentArray = (editingProfile[field] as string[]) || [];
    if (currentArray.includes(value.trim())) {
      toast.error('Item already exists');
      return;
    }

    setEditingProfile({
      ...editingProfile,
      [field]: [...currentArray, value.trim()],
    });
    setNewItemInput("");
  };

  const removeArrayItem = (field: keyof SearchProfile, index: number) => {
    const currentArray = (editingProfile[field] as string[]) || [];
    setEditingProfile({
      ...editingProfile,
      [field]: currentArray.filter((_, i) => i !== index),
    });
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>
          <Input
            value={editingProfile.profile_name || ""}
            onChange={(e) => setEditingProfile({ ...editingProfile, profile_name: e.target.value })}
            className="text-2xl font-bold border-none p-0 h-auto"
            placeholder="Profile Name"
          />
        </CardTitle>
        <CardDescription>Configure your search criteria</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="positions" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="positions">Positions</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="rates">Rates & Duration</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
            <TabsTrigger value="exclusions">Exclusions</TabsTrigger>
          </TabsList>

          <TabsContent value="positions" className="space-y-4">
            <div>
              <Label>Target Positions</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newItemInput}
                  onChange={(e) => setNewItemInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addArrayItem('target_positions', newItemInput)}
                  placeholder="e.g., Software Engineer"
                />
                <Button onClick={() => addArrayItem('target_positions', newItemInput)}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {editingProfile.target_positions?.map((pos, idx) => (
                  <Badge key={idx} variant="secondary" className="gap-1">
                    {pos}
                    <button onClick={() => removeArrayItem('target_positions', idx)}>×</button>
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label>Target Industries</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newItemInput}
                  onChange={(e) => setNewItemInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addArrayItem('target_industries', newItemInput)}
                  placeholder="e.g., FinTech"
                />
                <Button onClick={() => addArrayItem('target_industries', newItemInput)}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {editingProfile.target_industries?.map((ind, idx) => (
                  <Badge key={idx} variant="secondary" className="gap-1">
                    {ind}
                    <button onClick={() => removeArrayItem('target_industries', idx)}>×</button>
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label>Company Size Preferences</Label>
              <div className="flex gap-2 mt-2">
                {COMPANY_SIZES.map((size) => (
                  <Button
                    key={size}
                    variant={editingProfile.company_size_preferences?.includes(size) ? "default" : "outline"}
                    onClick={() => {
                      const current = editingProfile.company_size_preferences || [];
                      setEditingProfile({
                        ...editingProfile,
                        company_size_preferences: current.includes(size)
                          ? current.filter(s => s !== size)
                          : [...current, size]
                      });
                    }}
                  >
                    {size}
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="skills" className="space-y-4">
            <div>
              <Label>Required Skills</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newItemInput}
                  onChange={(e) => setNewItemInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addArrayItem('required_skills', newItemInput)}
                  placeholder="e.g., React"
                />
                <Button onClick={() => addArrayItem('required_skills', newItemInput)}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {editingProfile.required_skills?.map((skill, idx) => (
                  <Badge key={idx} variant="default" className="gap-1">
                    {skill}
                    <button onClick={() => removeArrayItem('required_skills', idx)}>×</button>
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label>Preferred Skills</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newItemInput}
                  onChange={(e) => setNewItemInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addArrayItem('preferred_skills', newItemInput)}
                  placeholder="e.g., TypeScript"
                />
                <Button onClick={() => addArrayItem('preferred_skills', newItemInput)}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {editingProfile.preferred_skills?.map((skill, idx) => (
                  <Badge key={idx} variant="secondary" className="gap-1">
                    {skill}
                    <button onClick={() => removeArrayItem('preferred_skills', idx)}>×</button>
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label>Minimum Match Score: {editingProfile.minimum_match_score}%</Label>
              <Input
                type="range"
                min="0"
                max="100"
                value={editingProfile.minimum_match_score || 70}
                onChange={(e) => setEditingProfile({ ...editingProfile, minimum_match_score: parseInt(e.target.value) })}
                className="mt-2"
              />
            </div>
          </TabsContent>

          <TabsContent value="rates" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Minimum Hourly Rate ($)</Label>
                <Input
                  type="number"
                  value={editingProfile.min_hourly_rate || ""}
                  onChange={(e) => setEditingProfile({ ...editingProfile, min_hourly_rate: parseFloat(e.target.value) || null })}
                  placeholder="e.g., 75"
                />
              </div>
              <div>
                <Label>Maximum Hourly Rate ($)</Label>
                <Input
                  type="number"
                  value={editingProfile.max_hourly_rate || ""}
                  onChange={(e) => setEditingProfile({ ...editingProfile, max_hourly_rate: parseFloat(e.target.value) || null })}
                  placeholder="e.g., 150"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Minimum Contract Duration (months)</Label>
                <Input
                  type="number"
                  value={editingProfile.min_contract_months || ""}
                  onChange={(e) => setEditingProfile({ ...editingProfile, min_contract_months: parseInt(e.target.value) || null })}
                  placeholder="e.g., 3"
                />
              </div>
              <div>
                <Label>Maximum Contract Duration (months)</Label>
                <Input
                  type="number"
                  value={editingProfile.max_contract_months || ""}
                  onChange={(e) => setEditingProfile({ ...editingProfile, max_contract_months: parseInt(e.target.value) || null })}
                  placeholder="e.g., 12"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="location" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Remote Only</Label>
                <Switch
                  checked={editingProfile.remote_only || false}
                  onCheckedChange={(checked) => setEditingProfile({ ...editingProfile, remote_only: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Hybrid Acceptable</Label>
                <Switch
                  checked={editingProfile.hybrid_acceptable ?? true}
                  onCheckedChange={(checked) => setEditingProfile({ ...editingProfile, hybrid_acceptable: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>On-site Acceptable</Label>
                <Switch
                  checked={editingProfile.onsite_acceptable ?? true}
                  onCheckedChange={(checked) => setEditingProfile({ ...editingProfile, onsite_acceptable: checked })}
                />
              </div>
            </div>

            <div>
              <Label>Preferred Locations</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newItemInput}
                  onChange={(e) => setNewItemInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addArrayItem('preferred_locations', newItemInput)}
                  placeholder="e.g., San Francisco, CA"
                />
                <Button onClick={() => addArrayItem('preferred_locations', newItemInput)}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {editingProfile.preferred_locations?.map((loc, idx) => (
                  <Badge key={idx} variant="secondary" className="gap-1">
                    {loc}
                    <button onClick={() => removeArrayItem('preferred_locations', idx)}>×</button>
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="exclusions" className="space-y-4">
            <div>
              <Label>Excluded Keywords</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Jobs containing these keywords will be filtered out
              </p>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newItemInput}
                  onChange={(e) => setNewItemInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addArrayItem('excluded_keywords', newItemInput)}
                  placeholder="e.g., on-call"
                />
                <Button onClick={() => addArrayItem('excluded_keywords', newItemInput)}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {editingProfile.excluded_keywords?.map((keyword, idx) => (
                  <Badge key={idx} variant="destructive" className="gap-1">
                    {keyword}
                    <button onClick={() => removeArrayItem('excluded_keywords', idx)}>×</button>
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label>Excluded Companies</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newItemInput}
                  onChange={(e) => setNewItemInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addArrayItem('excluded_companies', newItemInput)}
                  placeholder="e.g., Company Name"
                />
                <Button onClick={() => addArrayItem('excluded_companies', newItemInput)}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {editingProfile.excluded_companies?.map((company, idx) => (
                  <Badge key={idx} variant="destructive" className="gap-1">
                    {company}
                    <button onClick={() => removeArrayItem('excluded_companies', idx)}>×</button>
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={() => onSave(editingProfile)} className="gap-2">
            <Save className="h-4 w-4" />
            Save Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
