import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function Agencies() {
  return (
    <ProtectedRoute>
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Agencies (Under Maintenance)</CardTitle>
            <CardDescription>This feature is being updated</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
