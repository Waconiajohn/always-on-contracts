import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Key, Copy, Trash2, Plus, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface APIKey {
  id: string;
  key_name: string;
  api_key: string;
  created_at: string;
  last_used_at: string | null;
  is_active: boolean;
}

const APIKeysContent = () => {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [showNewKey, setShowNewKey] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    fetchAPIKeys();
  }, []);

  const fetchAPIKeys = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_api_keys')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (error: any) {
      console.error('Error fetching API keys:', error);
      toast({
        title: "Error",
        description: "Failed to load API keys",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createAPIKey = async () => {
    if (!newKeyName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for your API key",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreating(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Generate API key using database function
      const { data: keyData, error: keyError } = await supabase.rpc('generate_api_key');
      if (keyError) throw keyError;

      const apiKey = keyData;

      // Insert new API key
      const { error: insertError } = await supabase
        .from('user_api_keys')
        .insert({
          user_id: user.id,
          key_name: newKeyName,
          api_key: apiKey,
        });

      if (insertError) throw insertError;

      setShowNewKey(apiKey);
      setNewKeyName("");
      fetchAPIKeys();

      toast({
        title: "API key created",
        description: "Make sure to copy your API key - it won't be shown again",
      });
    } catch (error: any) {
      console.error('Error creating API key:', error);
      toast({
        title: "Creation failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const deleteAPIKey = async (id: string, keyName: string) => {
    if (!confirm(`Are you sure you want to delete "${keyName}"? This cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('user_api_keys')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "API key deleted",
        description: `"${keyName}" has been removed`,
      });

      fetchAPIKeys();
    } catch (error: any) {
      console.error('Error deleting API key:', error);
      toast({
        title: "Deletion failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "API key copied to clipboard",
    });
  };

  const toggleKeyVisibility = (keyId: string) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(keyId)) {
      newVisible.delete(keyId);
    } else {
      newVisible.add(keyId);
    }
    setVisibleKeys(newVisible);
  };

  const maskKey = (key: string) => {
    if (key.length <= 12) return '••••••••••••';
    return key.substring(0, 8) + '••••••••' + key.substring(key.length - 4);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">API Keys</h1>
          <p className="text-muted-foreground text-lg">
            Manage API keys for MCP (Model Context Protocol) access
          </p>
        </div>

        {showNewKey && (
          <Alert className="mb-6 border-primary">
            <Key className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold">Your new API key has been created!</p>
                <p className="text-sm">Make sure to copy it now - you won't be able to see it again.</p>
                <div className="flex items-center gap-2 mt-2">
                  <code className="flex-1 bg-muted p-2 rounded text-sm break-all">
                    {showNewKey}
                  </code>
                  <Button size="sm" onClick={() => copyToClipboard(showNewKey)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowNewKey(null)}
                  className="mt-2"
                >
                  I've saved my key
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create New API Key</CardTitle>
            <CardDescription>
              API keys allow AI assistants (like Claude Desktop) to access your opportunities data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="keyName">Key Name</Label>
                <Input
                  id="keyName"
                  placeholder="My Claude Desktop Key"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && createAPIKey()}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={createAPIKey} disabled={creating}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Key
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your API Keys</CardTitle>
            <CardDescription>
              {apiKeys.length} key{apiKeys.length !== 1 ? 's' : ''} created
            </CardDescription>
          </CardHeader>
          <CardContent>
            {apiKeys.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Key className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No API keys yet. Create one to get started!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {apiKeys.map((key) => (
                  <div
                    key={key.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">{key.key_name}</p>
                        {!key.is_active && (
                          <span className="text-xs bg-muted px-2 py-1 rounded">Inactive</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-sm text-muted-foreground font-mono">
                          {visibleKeys.has(key.id) ? key.api_key : maskKey(key.api_key)}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleKeyVisibility(key.id)}
                        >
                          {visibleKeys.has(key.id) ? (
                            <EyeOff className="w-3 h-3" />
                          ) : (
                            <Eye className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Created {new Date(key.created_at).toLocaleDateString()}
                        {key.last_used_at && ` • Last used ${new Date(key.last_used_at).toLocaleDateString()}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(key.api_key)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteAPIKey(key.id, key.key_name)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6 bg-muted">
          <CardHeader>
            <CardTitle>Using Your API Key</CardTitle>
            <CardDescription>How to connect with Claude Desktop (or other MCP clients)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-semibold mb-2">1. Add to Claude Desktop config:</p>
              <pre className="bg-background p-4 rounded text-sm overflow-x-auto">
{`{
  "mcpServers": {
    "careeriq": {
      "url": "${window.location.origin}/functions/v1/mcp-server",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY_HERE"
      }
    }
  }
}`}
              </pre>
            </div>
            <div>
              <p className="font-semibold mb-2">2. Available Resources:</p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li><code>opportunity://matches</code> - Your AI-matched opportunities</li>
                <li><code>opportunity://agencies</code> - Staffing agencies database</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-2">3. Available Tools:</p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li><code>search_opportunities</code> - Search by skills, location, rate</li>
                <li><code>get_match_details</code> - Get full details on a specific match</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const APIKeys = () => {
  return (
    <ProtectedRoute>
      <APIKeysContent />
    </ProtectedRoute>
  );
};

export default APIKeys;