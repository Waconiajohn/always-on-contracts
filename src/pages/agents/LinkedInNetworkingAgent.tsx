import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MessageSquare, Copy, Check, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { trackVaultTelemetry } from '@/lib/services/vaultTracking';

export default function LinkedInNetworkingAgent() {
  const [scenario, setScenario] = useState<string>('cold_connection');
  const [targetName, setTargetName] = useState('');
  const [targetTitle, setTargetTitle] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [sharedContext, setSharedContext] = useState('');
  const [jobContext, setJobContext] = useState({
    jobTitle: '',
    jobRef: '',
    jobSource: ''
  });
  const [messages, setMessages] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const scenarios = [
    { value: 'cold_connection', label: 'Cold Connection Request', description: 'First time reaching out' },
    { value: 'warm_intro', label: 'Warm Introduction', description: 'Via mutual connection' },
    { value: 'recruiter_outreach', label: 'Recruiter Outreach', description: 'Reaching out to recruiter' },
    { value: 'hiring_manager', label: 'Hiring Manager', description: 'About specific role' },
    { value: 'post_application_followup', label: 'Post-Application Follow-up', description: 'After applying' },
    { value: 'informational_interview', label: 'Informational Interview', description: 'Request for advice' },
    { value: 'thank_you', label: 'Thank You', description: 'After conversation' }
  ];

  const handleGenerate = async () => {
    if (!targetCompany || !scenario) {
      toast({
        title: "Missing information",
        description: "Please fill in at least target company and scenario",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setMessages([]);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) throw new Error("Not authenticated");

      // Get candidate profile from vault
      const { data: vault } = await supabase
        .from('career_vault')
        .select('id, initial_analysis')
        .eq('user_id', user.id)
        .single();

      if (!vault) throw new Error("Career Vault not found");

      const { data: phrases } = await supabase
        .from('vault_power_phrases')
        .select('power_phrase')
        .eq('vault_id', vault.id)
        .order('confidence_score', { ascending: false })
        .limit(3);

      const topAchievements = phrases?.map(p => p.power_phrase) || [];
      const analysis = vault?.initial_analysis as any;

      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error("No auth token");

      const { data, error } = await supabase.functions.invoke('linkedin-networking-messages', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: {
          scenario,
          targetProfile: {
            name: targetName || undefined,
            title: targetTitle || undefined,
            company: targetCompany,
            sharedContext: sharedContext || undefined
          },
          candidateProfile: {
            headline: `${analysis?.current_role || 'Professional'} with ${analysis?.years_of_experience || 5}+ years experience`,
            careerVaultSummary: analysis?.career_summary || 'Professional background',
            relevantAchievements: topAchievements
          },
          constraints: {
            maxWords: 150,
            tone: 'professional',
            avoid: ['synergy', 'paradigm', 'leverage', 'rockstar', 'guru']
          },
          jobContext: (scenario === 'hiring_manager' || scenario === 'post_application_followup') && jobContext.jobTitle ? jobContext : undefined
        }
      });

      if (error) throw error;

      setMessages(data.messages);
      
      // Track telemetry
      trackVaultTelemetry({
        featureName: 'linkedin_networking',
        action: 'networking_message_sent',
        metadata: { scenario, variantsGenerated: data.messages.length }
      });

      toast({
        title: "Messages generated!",
        description: `${data.messages.length} message variants created`
      });
    } catch (error: any) {
      toast({
        title: "Generation failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast({ title: "Copied!", description: "Message copied to clipboard" });
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">LinkedIn Networking Agent</h1>
        <p className="text-muted-foreground">
          Generate personalized connection requests and networking messages powered by your Career Vault
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Networking Scenario</CardTitle>
          <CardDescription>
            Tell us who you're reaching out to and why
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Scenario Type</Label>
            <Select value={scenario} onValueChange={setScenario}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {scenarios.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    <div>
                      <div className="font-medium">{s.label}</div>
                      <div className="text-xs text-muted-foreground">{s.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Target Person (optional)</Label>
              <Input
                placeholder="e.g., Sarah Johnson"
                value={targetName}
                onChange={(e) => setTargetName(e.target.value)}
              />
            </div>
            <div>
              <Label>Their Title (optional)</Label>
              <Input
                placeholder="e.g., VP of Engineering"
                value={targetTitle}
                onChange={(e) => setTargetTitle(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Company *</Label>
            <Input
              placeholder="e.g., Microsoft"
              value={targetCompany}
              onChange={(e) => setTargetCompany(e.target.value)}
              required
            />
          </div>

          <div>
            <Label>Shared Context / Connection (optional)</Label>
            <Textarea
              placeholder="e.g., We both attended AWS re:Invent 2024, or We have John Smith as a mutual connection"
              value={sharedContext}
              onChange={(e) => setSharedContext(e.target.value)}
              rows={2}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Mentioning shared context significantly increases response rates
            </p>
          </div>

          {(scenario === 'hiring_manager' || scenario === 'post_application_followup') && (
            <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="text-sm">Job Details (Optional)</CardTitle>
                <CardDescription>
                  Mentioning specific role details increases response rates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>Job Title</Label>
                  <Input
                    placeholder="e.g., Senior Product Manager"
                    value={jobContext.jobTitle}
                    onChange={(e) => setJobContext({...jobContext, jobTitle: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Job Reference/Link</Label>
                  <Input
                    placeholder="e.g., Req #12345 or LinkedIn post URL"
                    value={jobContext.jobRef}
                    onChange={(e) => setJobContext({...jobContext, jobRef: e.target.value})}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          <Button 
            onClick={handleGenerate}
            disabled={isGenerating || !targetCompany}
            className="w-full"
          >
            {isGenerating ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating messages...</>
            ) : (
              <><MessageSquare className="mr-2 h-4 w-4" /> Generate Messages</>
            )}
          </Button>
        </CardContent>
      </Card>

      {messages.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Generated Messages</h2>
            <Badge variant="secondary">{messages.length} variants</Badge>
          </div>

          <Tabs defaultValue="0" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              {messages.map((msg, idx) => (
                <TabsTrigger key={idx} value={idx.toString()} className="capitalize">
                  {msg.variant || `Variant ${idx + 1}`}
                </TabsTrigger>
              ))}
            </TabsList>

            {messages.map((msg, idx) => (
              <TabsContent key={idx} value={idx.toString()}>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg capitalize">
                        {msg.variant} Approach
                      </CardTitle>
                      <Badge variant="outline">{msg.channel}</Badge>
                    </div>
                    {msg.subject && (
                      <CardDescription className="font-medium mt-2">
                        Subject: {msg.subject}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="whitespace-pre-wrap text-sm">{msg.body}</p>
                    </div>

                    {msg.rationale && (
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          <strong>Why this works:</strong> {msg.rationale}
                        </AlertDescription>
                      </Alert>
                    )}

                    {msg.followUpSuggestion && (
                      <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                        <Info className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          <strong>Follow-up idea:</strong> {msg.followUpSuggestion}
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopy(msg.body, idx)}
                      >
                        {copiedIndex === idx ? (
                          <><Check className="h-3 w-3 mr-1" /> Copied</>
                        ) : (
                          <><Copy className="h-3 w-3 mr-1" /> Copy</>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                      >
                        <Star className="h-3 w-3 mr-1" /> Favorite
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      )}
    </div>
  );
}
