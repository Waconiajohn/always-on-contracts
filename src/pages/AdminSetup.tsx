import { GrantAdminAccess } from '@/components/admin/GrantAdminAccess';

export default function AdminSetup() {
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2">Admin Setup</h1>
        <p className="text-muted-foreground">
          Grant yourself admin access to use the Admin Prompt Manager
        </p>
      </div>

      <GrantAdminAccess />
    </div>
  );
}
