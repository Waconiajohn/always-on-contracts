import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Package, TrendingUp, Award, Target } from "lucide-react";

interface VaultUsageStats {
  totalUsed: number;
  powerPhrasesUsed: number;
  skillsUsed: number;
  competenciesUsed: number;
  underutilizedItems: any[];
}

export function VaultContentTracker() {
  const [stats, setStats] = useState<VaultUsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVaultUsage();
  }, []);

  const fetchVaultUsage = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch vault usage
      const { data: usage } = await supabase
        .from('feature_vault_usage')
        .select('*')
        .eq('user_id', user.id);

      // Fetch ALL vault items (10 categories)
      const { data: vault } = await supabase
        .from('career_vault')
        .select(`
          vault_power_phrases(id, power_phrase, impact_metrics),
          vault_transferable_skills(id, stated_skill),
          vault_hidden_competencies(id, competency_area),
          vault_soft_skills(id, skill_category),
          vault_leadership_philosophy(id, philosophy_statement),
          vault_executive_presence(id, indicator_type),
          vault_personality_traits(id, trait_name),
          vault_work_style(id, style_category),
          vault_values_motivations(id, value_name),
          vault_behavioral_indicators(id, indicator_type)
        `)
        .eq('user_id', user.id)
        .single();

      if (!usage || !vault) return;

      // Calculate stats across ALL 10 vault tables
      const usedItemIds = new Set(usage.map(u => u.vault_item_id));
      
      const powerPhrasesUsed = vault.vault_power_phrases?.filter((p: any) => 
        usedItemIds.has(p.id)
      ).length || 0;

      const skillsUsed = vault.vault_transferable_skills?.filter((s: any) => 
        usedItemIds.has(s.id)
      ).length || 0;

      const competenciesUsed = vault.vault_hidden_competencies?.filter((c: any) => 
        usedItemIds.has(c.id)
      ).length || 0;

      // Track additional categories (used in totalUsed count)
      const otherCategoriesUsed = [
        vault.vault_soft_skills,
        vault.vault_leadership_philosophy,
        vault.vault_executive_presence,
        vault.vault_personality_traits,
        vault.vault_work_style,
        vault.vault_values_motivations,
        vault.vault_behavioral_indicators
      ].reduce((sum, category) => {
        const count = category?.filter((item: any) => usedItemIds.has(item.id)).length || 0;
        return sum + count;
      }, 0);

      const totalUsed = powerPhrasesUsed + skillsUsed + competenciesUsed + otherCategoriesUsed;

      // Find underutilized high-value items (prioritize power phrases with metrics)
      const underutilized = vault.vault_power_phrases?.filter((p: any) => 
        !usedItemIds.has(p.id) && p.impact_metrics
      ).slice(0, 5) || [];

      setStats({
        totalUsed,
        powerPhrasesUsed,
        skillsUsed,
        competenciesUsed,
        underutilizedItems: underutilized
      });
    } catch (error) {
      console.error('Error fetching vault usage:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;
  if (!stats) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Career Vault Usage
        </CardTitle>
        <CardDescription>
          Tracking which vault items power your content
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-primary/5 rounded-lg">
            <Award className="h-6 w-6 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{stats.powerPhrasesUsed}</p>
            <p className="text-xs text-muted-foreground">Power Phrases</p>
          </div>
          <div className="text-center p-3 bg-blue-500/5 rounded-lg">
            <Target className="h-6 w-6 mx-auto mb-1 text-blue-500" />
            <p className="text-2xl font-bold">{stats.skillsUsed}</p>
            <p className="text-xs text-muted-foreground">Skills</p>
          </div>
          <div className="text-center p-3 bg-green-500/5 rounded-lg">
            <TrendingUp className="h-6 w-6 mx-auto mb-1 text-green-500" />
            <p className="text-2xl font-bold">{stats.competenciesUsed}</p>
            <p className="text-xs text-muted-foreground">Competencies</p>
          </div>
        </div>

        {stats.underutilizedItems.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">💡 Underutilized Achievements</h4>
            <div className="space-y-2">
              {stats.underutilizedItems.map((item: any) => (
                <div key={item.id} className="p-2 bg-muted rounded-lg text-sm">
                  <p className="font-medium">{item.power_phrase}</p>
                  <Badge variant="outline" className="mt-1">{item.impact_metrics}</Badge>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Consider featuring these in your next post or profile update
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
