import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Shield, Code, Database, History, TestTube, DollarSign } from 'lucide-react';
import PromptViewer from '@/components/admin/PromptViewer';
import PromptEditor from '@/components/admin/PromptEditor';
import CachedDataInspector from '@/components/admin/CachedDataInspector';
import PromptVersionHistory from '@/components/admin/PromptVersionHistory';
import PromptTestingSandbox from '@/components/admin/PromptTestingSandbox';
import PromptCostTracker from '@/components/admin/PromptCostTracker';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export default function AdminPromptManager() {
  const [activeTab, setActiveTab] = useState('viewer');

  // Check if user has admin role
  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ['admin-check'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });

      if (error) {
        console.error('Admin check error:', error);
        return false;
      }

      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 max-w-md text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-destructive" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">
            You need admin privileges to access this page.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Admin Prompt Manager</h1>
        </div>
        <p className="text-muted-foreground">
          View, edit, and manage all AI prompts, cached data, and system performance
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6">
          <TabsTrigger value="viewer" className="flex items-center gap-2">
            <Code className="w-4 h-4" />
            <span className="hidden sm:inline">Prompts</span>
          </TabsTrigger>
          <TabsTrigger value="editor" className="flex items-center gap-2">
            <Code className="w-4 h-4" />
            <span className="hidden sm:inline">Editor</span>
          </TabsTrigger>
          <TabsTrigger value="cache" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            <span className="hidden sm:inline">Cache</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">History</span>
          </TabsTrigger>
          <TabsTrigger value="testing" className="flex items-center gap-2">
            <TestTube className="w-4 h-4" />
            <span className="hidden sm:inline">Testing</span>
          </TabsTrigger>
          <TabsTrigger value="costs" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            <span className="hidden sm:inline">Costs</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="viewer" className="space-y-4">
          <PromptViewer />
        </TabsContent>

        <TabsContent value="editor" className="space-y-4">
          <PromptEditor />
        </TabsContent>

        <TabsContent value="cache" className="space-y-4">
          <CachedDataInspector />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <PromptVersionHistory />
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <PromptTestingSandbox />
        </TabsContent>

        <TabsContent value="costs" className="space-y-4">
          <PromptCostTracker />
        </TabsContent>
      </Tabs>
    </div>
  );
}
