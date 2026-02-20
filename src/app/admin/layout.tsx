"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/components/providers/auth-provider";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { loading, user, profile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/account");
  }, [loading, user, router]);

  if (loading) return <div className="container py-10">Loading...</div>;

  if (!user || profile?.role !== "admin") {
    return (
      <div className="container py-12">
        <Card className="mx-auto max-w-lg rounded-2xl">
          <CardContent className="p-6 text-center">
            <h1 className="text-2xl font-semibold">Admin Access Required</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This area is restricted to administrators only.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}
