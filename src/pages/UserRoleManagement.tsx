import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Search, UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface UserWithRoles {
  id: string;
  email: string;
  full_name: string | null;
  roles: string[];
}

export default function UserRoleManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  // Fetch all users with their roles
  const { data: users, isLoading } = useQuery({
    queryKey: ['users-with-roles'],
    queryFn: async () => {
      // Get all user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, email, full_name')
        .order('email');

      if (profilesError) throw profilesError;

      // Get all user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combine data
      const usersWithRoles: UserWithRoles[] = profiles.map((profile) => ({
        id: profile.user_id,
        email: profile.email || '',
        full_name: profile.full_name,
        roles: userRoles
          .filter((role) => role.user_id === profile.user_id)
          .map((role) => role.role),
      }));

      return usersWithRoles;
    },
  });

  // Grant admin role mutation
  const grantAdminMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'admin' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast.success('Admin role granted successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to grant admin role: ${error.message}`);
    },
  });

  // Revoke admin role mutation
  const revokeAdminMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'admin');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast.success('Admin role revoked successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to revoke admin role: ${error.message}`);
    },
  });

  const filteredUsers = users?.filter(
    (user) =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGrantAdmin = (userId: string) => {
    grantAdminMutation.mutate(userId);
  };

  const handleRevokeAdmin = (userId: string) => {
    revokeAdminMutation.mutate(userId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">User Role Management</h1>
        </div>
        <p className="text-muted-foreground">
          Grant or revoke admin privileges for users
        </p>
      </div>

      <Card className="p-6">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers && filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const isAdmin = user.roles.includes('admin');
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>{user.full_name || '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {user.roles.length > 0 ? (
                            user.roles.map((role) => (
                              <Badge key={role} variant="secondary">
                                {role}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              No roles
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {isAdmin ? (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRevokeAdmin(user.id)}
                            disabled={revokeAdminMutation.isPending}
                          >
                            {revokeAdminMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <UserMinus className="w-4 h-4 mr-2" />
                                Revoke Admin
                              </>
                            )}
                          </Button>
                        ) : (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleGrantAdmin(user.id)}
                            disabled={grantAdminMutation.isPending}
                          >
                            {grantAdminMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <UserPlus className="w-4 h-4 mr-2" />
                                Grant Admin
                              </>
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
