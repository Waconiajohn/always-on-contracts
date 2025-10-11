import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SkillCard } from './SkillCard';
import { Loader2, Search, Plus, Save, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { syncVaultSkillsToProfile } from '@/lib/services/profileSync';
import { useSessionResilience } from '@/hooks/useSessionResilience';
import { useNavigate } from 'react-router-dom';
import { logger } from '@/lib/logger';

interface SkillConfirmationStepProps {
  onComplete: () => void;
}

const SESSION_STORAGE_KEY = 'skillConfirmationProgress';

export const SkillConfirmationStep = ({ onComplete }: SkillConfirmationStepProps) => {
  const navigate = useNavigate();
  const { withSessionValidation, isRefreshing } = useSessionResilience({
    onSessionLost: () => navigate('/auth')
  });

  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState<any[]>([]);
  const [filteredSkills, setFilteredSkills] = useState<any[]>([]);
  const [confirmedCount, setConfirmedCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'resume' | 'inferred' | 'growth'>('all');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [isAddingCustomSkill, setIsAddingCustomSkill] = useState(false);
  const [customSkillName, setCustomSkillName] = useState('');
  const [customProficiency, setCustomProficiency] = useState('proficient');
  const [customCategory, setCustomCategory] = useState('technical');
  const [customNotes, setCustomNotes] = useState('');

  useEffect(() => {
    restoreProgress();
    fetchSkills();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [skills, searchQuery, activeFilter]);

  // Auto-save to session storage whenever confirmed count changes
  useEffect(() => {
    if (confirmedCount > 0) {
      saveProgressToSession();
    }
  }, [confirmedCount]);

  const saveProgressToSession = () => {
    try {
      const progress = {
        confirmedCount,
        timestamp: new Date().toISOString()
      };
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(progress));
      logger.debug('Progress saved to session storage:', { progress });
    } catch (error) {
      console.error('Error saving to session storage:', error);
    }
  };

  const restoreProgress = () => {
    try {
      const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        const progress = JSON.parse(saved);
        const savedTime = new Date(progress.timestamp);
        const now = new Date();
        const hoursSince = (now.getTime() - savedTime.getTime()) / (1000 * 60 * 60);
        
        // Only restore if saved within last 24 hours
        if (hoursSince < 24) {
          toast.info(`Restoring your progress from ${savedTime.toLocaleTimeString()}`, {
            duration: 3000
          });
        } else {
          // Clear old progress
          sessionStorage.removeItem(SESSION_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('Error restoring progress:', error);
    }
  };

  const clearProgress = () => {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  };

  const fetchSkills = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      // Get confirmed skill names
      const { data: confirmedSkills } = await supabase
        .from('vault_confirmed_skills')
        .select('skill_name')
        .eq('user_id', user.id);

      const confirmedNames = new Set((confirmedSkills || []).map(s => s.skill_name));

      // Get all taxonomy skills
      const { data, error } = await supabase
        .from('vault_skill_taxonomy')
        .select('*')
        .eq('user_id', user.id)
        .order('source', { ascending: true })
        .order('confidence_score', { ascending: false });

      if (error) throw error;

      // Filter out already confirmed skills
      const unconfirmedSkills = (data || []).filter(skill => !confirmedNames.has(skill.skill_name));
      setSkills(unconfirmedSkills);
      setConfirmedCount(confirmedNames.size);
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
    const result = await withSessionValidation(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      const skill = skills.find((s) => s.id === skillId);
      if (!skill) return;

      const { error } = await supabase.from('vault_confirmed_skills').insert({
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
      return true;
    }, 'confirm skill');

    if (!result) {
      toast.error('Failed to confirm skill. Please try again.');
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

    const result = await withSessionValidation(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      const { error } = await supabase.from('vault_confirmed_skills').insert({
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
      return true;
    }, 'add custom skill');

    if (!result) {
      toast.error('Failed to add custom skill. Please try again.');
    }
  };

  const handleSaveProgress = async () => {
    setIsSaving(true);
    
    const result = await withSessionValidation(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');
      
      // Sync confirmed skills to profile
      await syncVaultSkillsToProfile(user.id);
      setLastSaved(new Date());
      toast.success('Progress saved successfully');
      return true;
    }, 'save progress');

    setIsSaving(false);

    if (!result) {
      toast.error('Failed to save progress. Please try again.');
    }
  };

  const handleContinue = async () => {
    if (confirmedCount === 0) {
      toast.error('Please confirm at least one skill before continuing');
      return;
    }
    
    const result = await withSessionValidation(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');
      
      // Sync confirmed skills to profile
      await syncVaultSkillsToProfile(user.id);
      toast.success('Skills synced to your profile');
      
      // Clear session storage on successful completion
      clearProgress();
      
      onComplete();
      return true;
    }, 'continue to interview');

    if (!result) {
      toast.error('Failed to save and continue. Please try again.');
    }
  };

  // Calculate progress based on total original skills (confirmed + unconfirmed)
  const totalSkills = confirmedCount + skills.length;
  const progressPercentage = totalSkills > 0 ? (confirmedCount / totalSkills) * 100 : 0;

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
            {confirmedCount} of {totalSkills} skills confirmed ({skills.length} remaining)
          </span>
          <div className="flex items-center gap-3">
            {lastSaved && (
              <span className="text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
            <span className="text-muted-foreground">{Math.round(progressPercentage)}%</span>
          </div>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      {/* Save Progress Button */}
      <div className="flex justify-center">
        <Button 
          onClick={handleSaveProgress} 
          variant="outline" 
          disabled={isSaving || isRefreshing || confirmedCount === 0}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Progress
            </>
          )}
        </Button>
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
        <Button 
          onClick={handleContinue} 
          size="lg" 
          className="px-8"
          disabled={isRefreshing || confirmedCount === 0}
        >
          {isRefreshing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Validating session...
            </>
          ) : (
            'Continue to Interview →'
          )}
        </Button>
      </div>
    </div>
  );
};
