import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Copy, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

export function GrantAdminAccess() {
  const [copied, setCopied] = useState(false);

  // Get current user ID
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const sqlCommand = user 
    ? `INSERT INTO user_roles (user_id, role) VALUES ('${user.id}', 'admin') ON CONFLICT DO NOTHING;`
    : 'Loading...';

  const handleCopy = async () => {
    if (!user) return;
    
    await navigator.clipboard.writeText(sqlCommand);
    setCopied(true);
    toast.success('SQL command copied to clipboard!');
    
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <Card className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <Shield className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-bold">Grant Admin Access</h2>
      </div>
      
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          To grant yourself admin privileges, you'll need to run this SQL command in your backend database:
        </p>

        <div className="relative">
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono">
            {sqlCommand}
          </pre>
          <Button
            size="sm"
            variant="ghost"
            className="absolute top-2 right-2"
            onClick={handleCopy}
            disabled={!user}
          >
            {copied ? (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold">Steps:</p>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Copy the SQL command above</li>
            <li>Open your backend database (click the "View Backend" button in the suggestions below)</li>
            <li>Navigate to the SQL Editor</li>
            <li>Paste and run the command</li>
            <li>Refresh this page to see the Admin dropdown in the navigation</li>
          </ol>
        </div>

        <p className="text-xs text-muted-foreground pt-2">
          Your User ID: <code className="bg-muted px-2 py-0.5 rounded">{user?.id || 'Loading...'}</code>
        </p>
      </div>
    </Card>
  );
}
