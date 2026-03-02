

import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, ShoppingBag, Package, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();

  return (
    <div className="container grid gap-6 py-8 md:grid-cols-[220px_1fr]">
      <aside className="rounded-2xl border bg-card p-3">
        <nav className="grid gap-1">
          {items.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2 text-sm",
                pathname === item.href ? "bg-primary text-primary-foreground" : "hover:bg-accent",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <section>{children}</section>
    </div>
  );
}
