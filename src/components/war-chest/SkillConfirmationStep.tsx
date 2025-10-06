import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SkillCard } from './SkillCard';
import { Loader2, Search, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SkillConfirmationStepProps {
  onComplete: () => void;
}

export const SkillConfirmationStep = ({ onComplete }: SkillConfirmationStepProps) => {
  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState<any[]>([]);
  const [filteredSkills, setFilteredSkills] = useState<any[]>([]);
  const [confirmedCount, setConfirmedCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'resume' | 'inferred' | 'growth'>('all');
  
  const [isAddingCustomSkill, setIsAddingCustomSkill] = useState(false);
  const [customSkillName, setCustomSkillName] = useState('');
  const [customProficiency, setCustomProficiency] = useState('proficient');
  const [customCategory, setCustomCategory] = useState('technical');
  const [customNotes, setCustomNotes] = useState('');

  useEffect(() => {
    fetchSkills();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [skills, searchQuery, activeFilter]);

  const fetchSkills = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      const { data, error } = await supabase
        .from('war_chest_skill_taxonomy')
        .select('*')
        .eq('user_id', user.id)
        .order('source', { ascending: true })
        .order('confidence_score', { ascending: false });

      if (error) throw error;

      setSkills(data || []);
      
      // Get confirmed count
      const { count } = await supabase
        .from('war_chest_confirmed_skills')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setConfirmedCount(count || 0);
    } catch (error) {
      console.error('Error fetching skills:', error);
      toast.error('Failed to load skills');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = skills;

    if (activeFilter !== 'all') {
      filtered = filtered.filter((skill) => skill.source === activeFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((skill) =>
        skill.skill_name.toLowerCase().includes(query)
      );
    }

    setFilteredSkills(filtered);
  };

  const handleConfirmSkill = async (skillId: string, data: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      const skill = skills.find((s) => s.id === skillId);
      if (!skill) return;

      const { error } = await supabase.from('war_chest_confirmed_skills').insert({
        user_id: user.id,
        skill_name: skill.skill_name,
        source: skill.source,
        proficiency: data.proficiency,
        sub_attributes: data.selectedAttributes,
        want_to_develop: data.wantToDevelop,
      });

      if (error) throw error;

      setConfirmedCount((prev) => prev + 1);
      toast.success(`Confirmed: ${skill.skill_name}`);
    } catch (error) {
      console.error('Error confirming skill:', error);
      toast.error('Failed to confirm skill');
    }
  };

  const handleSkipSkill = (skillId: string) => {
    setSkills((prev) => prev.filter((s) => s.id !== skillId));
    toast.info('Skill skipped');
  };

  const handleAddCustomSkill = async () => {
    if (!customSkillName.trim()) {
      toast.error('Please enter a skill name');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      const { error } = await supabase.from('war_chest_confirmed_skills').insert({
        user_id: user.id,
        skill_name: customSkillName.trim(),
        source: 'custom',
        proficiency: customProficiency,
        sub_attributes: [],
        want_to_develop: false,
        custom_notes: customNotes.trim() || null,
      });

      if (error) throw error;

      setConfirmedCount((prev) => prev + 1);
      toast.success(`Added: ${customSkillName}`);
      
      // Reset form
      setCustomSkillName('');
      setCustomProficiency('proficient');
      setCustomCategory('technical');
      setCustomNotes('');
      setIsAddingCustomSkill(false);
    } catch (error) {
      console.error('Error adding custom skill:', error);
      toast.error('Failed to add custom skill');
    }
  };

  const handleContinue = () => {
    if (confirmedCount === 0) {
      toast.error('Please confirm at least one skill before continuing');
      return;
    }
    onComplete();
  };

  const progressPercentage = skills.length > 0 ? (confirmedCount / skills.length) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Confirm Your Skills</h2>
        <p className="text-muted-foreground">
          Review and confirm the skills we've identified. Add details to strengthen your profile.
        </p>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            {confirmedCount} of {skills.length} skills confirmed
          </span>
          <span className="text-muted-foreground">{Math.round(progressPercentage)}%</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as any)} className="flex-1">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="resume">Resume</TabsTrigger>
            <TabsTrigger value="inferred">Inferred</TabsTrigger>
            <TabsTrigger value="growth">Growth</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Dialog open={isAddingCustomSkill} onOpenChange={setIsAddingCustomSkill}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Custom
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Custom Skill</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="skill-name">Skill Name</Label>
                <Input
                  id="skill-name"
                  placeholder="e.g., Machine Learning"
                  value={customSkillName}
                  onChange={(e) => setCustomSkillName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Proficiency Level</Label>
                <RadioGroup value={customProficiency} onValueChange={setCustomProficiency}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="proficient" id="custom-proficient" />
                    <Label htmlFor="custom-proficient" className="cursor-pointer">
                      Proficient (3+ years)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="expert" id="custom-expert" />
                    <Label htmlFor="custom-expert" className="cursor-pointer">
                      Expert (led major initiatives)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={customCategory} onValueChange={setCustomCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="leadership">Leadership</SelectItem>
                    <SelectItem value="domain_expertise">Domain Expertise</SelectItem>
                    <SelectItem value="soft_skills">Soft Skills</SelectItem>
                    <SelectItem value="tools">Tools</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any specific details about this skill..."
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAddCustomSkill} className="flex-1">
                  Add Skill
                </Button>
                <Button variant="ghost" onClick={() => setIsAddingCustomSkill(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Skill Cards */}
      <div className="space-y-3">
        {filteredSkills.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {searchQuery ? 'No skills match your search' : 'No skills in this category'}
          </p>
        ) : (
          filteredSkills.map((skill) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              onConfirm={(data) => handleConfirmSkill(skill.id, data)}
              onSkip={() => handleSkipSkill(skill.id)}
            />
          ))
        )}
      </div>

      {/* Continue Button */}
      <div className="flex justify-center pt-6">
        <Button onClick={handleContinue} size="lg" className="px-8">
          Continue to Interview →
        </Button>
      </div>
    </div>
  );
};
