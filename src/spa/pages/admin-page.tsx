import { Navigate } from "react-router-dom";
import { useAuth } from "@/components/providers/auth-provider";
import { Card, CardContent } from "@/components/ui/card";
import { AdminShell } from "@/components/admin/admin-shell";

export function AdminPage() {
  const { loading, user, profile } = useAuth();

  if (loading) return <div className="container py-10">Loading...</div>;
  if (!user) return <Navigate to="/account" replace />;
  if (profile?.role !== "admin") {
    return (
      <div className="container py-12">
        <Card className="mx-auto max-w-lg rounded-2xl">
          <CardContent className="p-6 text-center">
            <h1 className="text-2xl font-semibold">Admin Access Required</h1>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AdminShell>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">Use the left menu to manage store settings and data.</p>
      </div>
    </AdminShell>
  );
}
