import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function GrantAdminAccess() {
  const [isGranting, setIsGranting] = useState(false);
  const queryClient = useQueryClient();

  // Get current user ID
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const grantAdminMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('grant-initial-admin');
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success('Admin access granted! Refreshing...');
      queryClient.invalidateQueries({ queryKey: ['admin-check'] });
      setTimeout(() => window.location.reload(), 1500);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to grant admin access');
    }
  });

  const handleGrantAdmin = async () => {
    if (!user) return;
    setIsGranting(true);
    try {
      await grantAdminMutation.mutateAsync();
    } finally {
      setIsGranting(false);
    }
  };

  return (
    <Card className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <Shield className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-bold">Grant Admin Access</h2>
      </div>
      
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Click the button below to grant yourself admin privileges. This will only work if no other admins exist yet.
        </p>

        <Button
          onClick={handleGrantAdmin}
          disabled={!user || isGranting}
          className="w-full"
          size="lg"
        >
          {isGranting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Granting Admin Access...
            </>
          ) : (
            <>
              <Shield className="w-4 h-4 mr-2" />
              Grant Me Admin Access
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground pt-2">
          Your User ID: <code className="bg-muted px-2 py-0.5 rounded">{user?.id || 'Loading...'}</code>
        </p>
      </div>
    </Card>
  );
}
