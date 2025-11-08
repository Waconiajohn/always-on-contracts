import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Copy, Check, BookOpen, Award, TrendingUp } from "lucide-react";

interface LinkedInPostComposerProps {
  vaultId: string;
}

export function LinkedInPostComposer({ vaultId }: LinkedInPostComposerProps) {
  const [postContent, setPostContent] = useState('');
  const [powerPhrases, setPowerPhrases] = useState<any[]>([]);
  const [leadershipPhilosophy, setLeadershipPhilosophy] = useState<any>(null);
  const [thoughtLeadership, setThoughtLeadership] = useState<any[]>([]);
  const [competitiveAdvantages, setCompetitiveAdvantages] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchVaultIntelligence = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch top achievements for post content
      const { data: phrasesData } = await supabase
        .from('vault_power_phrases')
        .select('*')
        .eq('vault_id', vaultId)
        .order('confidence_score', { ascending: false })
        .limit(5);

      if (phrasesData) setPowerPhrases(phrasesData);

      // Fetch leadership philosophy with LinkedIn angle
      const { data: leadershipData } = await supabase
        .from('vault_leadership_philosophy')
        .select('*')
        .eq('vault_id', vaultId)
        .limit(1)
        .single();

      if (leadershipData) setLeadershipPhilosophy(leadershipData);

      // Fetch thought leadership items
      const { data: thoughtData } = await supabase
        .from('vault_thought_leadership')
        .select('*')
        .eq('vault_id', vaultId)
        .order('date_published', { ascending: false });

      if (thoughtData) setThoughtLeadership(thoughtData);

      // Fetch competitive advantages for differentiation
      const { data: advantagesData } = await supabase
        .from('vault_competitive_advantages')
        .select('*')
        .eq('vault_id', vaultId)
        .order('differentiator_strength', { ascending: false });

      if (advantagesData) setCompetitiveAdvantages(advantagesData);
    };
    
    fetchVaultIntelligence();
  }, [vaultId]);

  const insertIntoPost = (text: string) => {
    setPostContent(prev => prev + (prev ? '\n\n' : '') + text);
    toast({
      title: "Added to post",
      description: "Content inserted successfully"
    });
  };

  const useLeadershipHook = () => {
    if (leadershipPhilosophy?.linkedin_angle) {
      insertIntoPost(`💡 ${leadershipPhilosophy.linkedin_angle}\n\nHere's why:`);
    }
  };

  const referenceThoughtLeadership = (item: any) => {
    const reference = `Recently ${item.content_type === 'speaking' ? 'spoke at' : 'published on'} ${item.platform} about "${item.title}". ${item.repurpose_potential || 'Key takeaways:'}`;
    insertIntoPost(reference);
  };

  const copyPost = () => {
    navigator.clipboard.writeText(postContent);
    setCopied(true);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Vault Intelligence Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Your Vault Intelligence
          </CardTitle>
          <CardDescription>
            Authentic stories from your career - click to use in post
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Top Achievements */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Award className="h-4 w-4" />
              Top Achievements
            </Label>
            <div className="space-y-2">
              {powerPhrases.map((phrase) => (
                <Button
                  key={phrase.id}
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-2"
                  onClick={() => insertIntoPost(phrase.power_phrase)}
                >
                  <div className="flex flex-col items-start gap-1 w-full">
                    <div className="flex items-center gap-2 w-full">
                      <Badge variant="secondary" className="text-xs">
                        {phrase.category || 'achievement'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {phrase.quality_tier === 'gold' && '🥇'}
                        {phrase.quality_tier === 'silver' && '🥈'}
                        {phrase.quality_tier === 'bronze' && '🥉'}
                      </span>
                    </div>
                    <span className="text-sm">{phrase.power_phrase}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Leadership Philosophy Hook */}
          {leadershipPhilosophy?.linkedin_angle && (
            <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
              <Label className="flex items-center gap-2 mb-2 text-purple-900 dark:text-purple-100">
                <TrendingUp className="h-4 w-4" />
                Leadership Hook
              </Label>
              <p className="text-sm italic text-purple-700 dark:text-purple-300 mb-2">
                "{leadershipPhilosophy.linkedin_angle}"
              </p>
              <Button size="sm" variant="ghost" onClick={useLeadershipHook}>
                Use This Hook
              </Button>
            </div>
          )}

          {/* Thought Leadership */}
          {thoughtLeadership.length > 0 && (
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <BookOpen className="h-4 w-4" />
                Your Thought Leadership
              </Label>
              <div className="space-y-2">
                {thoughtLeadership.map((item) => (
                  <Button
                    key={item.id}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-2"
                    onClick={() => referenceThoughtLeadership(item)}
                  >
                    <div className="flex flex-col items-start gap-1 w-full">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {item.content_type}
                        </Badge>
                        {item.linkedin_reference_value && (
                          <Badge variant="outline" className="text-xs">
                            {item.linkedin_reference_value}
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm font-medium">{item.title}</span>
                      {item.platform && (
                        <span className="text-xs text-muted-foreground">{item.platform}</span>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Competitive Advantages */}
          {competitiveAdvantages.length > 0 && (
            <div>
              <Label className="mb-2 block">💎 Your Unique Differentiators</Label>
              <div className="space-y-2">
                {competitiveAdvantages.slice(0, 3).map((advantage) => (
                  <Button
                    key={advantage.id}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-2"
                    onClick={() => insertIntoPost(advantage.advantage_statement)}
                  >
                    <div className="flex flex-col items-start gap-1 w-full">
                      <Badge variant="secondary" className="text-xs">
                        {advantage.advantage_category.replace('_', ' ')}
                      </Badge>
                      <span className="text-sm">{advantage.advantage_statement}</span>
                      {advantage.linkedin_hook_potential && (
                        <span className="text-xs text-muted-foreground italic">
                          💡 {advantage.linkedin_hook_potential}
                        </span>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Post Composer */}
      <Card>
        <CardHeader>
          <CardTitle>Compose Your Post</CardTitle>
          <CardDescription>
            Build authentic LinkedIn content using your verified achievements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="post-content">Post Content</Label>
            <Textarea
              id="post-content"
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="Start writing your LinkedIn post here, or click items from your vault intelligence to insert them..."
              rows={15}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {postContent.length} characters • LinkedIn ideal length: 1,300-2,000
            </p>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={copyPost} 
              disabled={!postContent}
              className="flex-1"
            >
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {copied ? "Copied!" : "Copy Post"}
            </Button>
            <Button 
              variant="outline"
              onClick={() => setPostContent('')}
              disabled={!postContent}
            >
              Clear
            </Button>
          </div>

          {/* Writing Tips */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs font-semibold mb-2">💡 LinkedIn Best Practices:</p>
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li>• Start with a hook (question, stat, or bold statement)</li>
              <li>• Use line breaks for readability (2-3 sentences per paragraph)</li>
              <li>• Include specific metrics from your achievements</li>
              <li>• End with a question to drive engagement</li>
              <li>• Add 3-5 relevant hashtags at the end</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}