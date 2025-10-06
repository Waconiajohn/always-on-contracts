import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Plus, Target, Building2 } from 'lucide-react';

interface CareerGoalsStepProps {
  resumeAnalysis: any;
  onComplete: (data: { target_roles: string[]; target_industries: string[] }) => void;
}

export const CareerGoalsStep = ({ resumeAnalysis, onComplete }: CareerGoalsStepProps) => {
  const [loading, setLoading] = useState(true);
  const [roleSuggestions, setRoleSuggestions] = useState<{
    current_level: string[];
    stretch: string[];
    safety: string[];
  }>({ current_level: [], stretch: [], safety: [] });

  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [customRole, setCustomRole] = useState('');
  
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [customIndustry, setCustomIndustry] = useState('');

  const industryOptions = [
    'FinTech',
    'Healthcare Technology',
    'Enterprise SaaS',
    'E-commerce',
    'Cybersecurity',
    'Cloud Computing',
    'Artificial Intelligence',
    'EdTech',
  ];

  useEffect(() => {
    fetchRoleSuggestions();
  }, []);

  const fetchRoleSuggestions = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const { data, error } = await supabase.functions.invoke('infer-target-roles', {
        body: { resume_analysis: resumeAnalysis },
      });

      if (error) throw error;

      if (data.success) {
        setRoleSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error('Error fetching role suggestions:', error);
      toast.error('Failed to load role suggestions');
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const addCustomRole = () => {
    if (customRole.trim() && !selectedRoles.includes(customRole.trim())) {
      setSelectedRoles([...selectedRoles, customRole.trim()]);
      setCustomRole('');
    }
  };

  const toggleIndustry = (industry: string) => {
    setSelectedIndustries((prev) =>
      prev.includes(industry) ? prev.filter((i) => i !== industry) : [...prev, industry]
    );
  };

  const addCustomIndustry = () => {
    if (customIndustry.trim() && !selectedIndustries.includes(customIndustry.trim())) {
      setSelectedIndustries([...selectedIndustries, customIndustry.trim()]);
      setCustomIndustry('');
    }
  };

  const handleContinue = async () => {
    if (selectedRoles.length === 0) {
      toast.error('Please select at least one target role');
      return;
    }

    if (selectedIndustries.length === 0) {
      toast.error('Please select at least one target industry');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      // Save to profiles table
      const { error } = await supabase
        .from('profiles')
        .update({
          target_roles: selectedRoles,
          target_industries: selectedIndustries,
        })
        .eq('id', user.id);

      if (error) throw error;

      onComplete({
        target_roles: selectedRoles,
        target_industries: selectedIndustries,
      });
    } catch (error) {
      console.error('Error saving career goals:', error);
      toast.error('Failed to save career goals');
    }
  };

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
        <h2 className="text-3xl font-bold">What are your career goals?</h2>
        <p className="text-muted-foreground">
          Help us tailor your War Chest by selecting your target roles and industries
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            What role(s) are you targeting?
          </CardTitle>
          <CardDescription>
            Select all that interest you, or add your own
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Level */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">At Your Level</Label>
            <div className="grid gap-3">
              {roleSuggestions.current_level.map((role) => (
                <div key={role} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent transition-colors">
                  <Checkbox
                    id={`role-current-${role}`}
                    checked={selectedRoles.includes(role)}
                    onCheckedChange={() => toggleRole(role)}
                  />
                  <label 
                    htmlFor={`role-current-${role}`}
                    className="flex-1 cursor-pointer select-none"
                  >
                    {role}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Stretch Roles */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Stretch Roles (One level up)</Label>
            <div className="grid gap-3">
              {roleSuggestions.stretch.map((role) => (
                <div key={role} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent transition-colors">
                  <Checkbox
                    id={`role-stretch-${role}`}
                    checked={selectedRoles.includes(role)}
                    onCheckedChange={() => toggleRole(role)}
                  />
                  <label 
                    htmlFor={`role-stretch-${role}`}
                    className="flex-1 cursor-pointer select-none"
                  >
                    {role}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Safety/Pivot Roles */}
          {roleSuggestions.safety.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Alternative Paths</Label>
              <div className="grid gap-3">
                {roleSuggestions.safety.map((role) => (
                  <div key={role} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent transition-colors">
                    <Checkbox
                      id={`role-safety-${role}`}
                      checked={selectedRoles.includes(role)}
                      onCheckedChange={() => toggleRole(role)}
                    />
                    <label 
                      htmlFor={`role-safety-${role}`}
                      className="flex-1 cursor-pointer select-none"
                    >
                      {role}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Role Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Add a custom role..."
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCustomRole()}
            />
            <Button onClick={addCustomRole} variant="outline" size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Which industries interest you?
          </CardTitle>
          <CardDescription>
            Select all that apply, or add your own
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {industryOptions.map((industry) => (
              <div key={industry} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent transition-colors">
                <Checkbox
                  id={`industry-${industry}`}
                  checked={selectedIndustries.includes(industry)}
                  onCheckedChange={() => toggleIndustry(industry)}
                />
                <label 
                  htmlFor={`industry-${industry}`}
                  className="flex-1 cursor-pointer select-none text-sm"
                >
                  {industry}
                </label>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Add a custom industry..."
              value={customIndustry}
              onChange={(e) => setCustomIndustry(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCustomIndustry()}
            />
            <Button onClick={addCustomIndustry} variant="outline" size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button onClick={handleContinue} size="lg" className="px-8">
          Continue to Analysis →
        </Button>
      </div>
    </div>
  );
};
