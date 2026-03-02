import { Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    Package,
    Tags,
    ShoppingCart,
    Users,
    Settings,
    Boxes
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
    { name: "Products", href: "/admin/products", icon: Package },
    { name: "Categories", href: "/admin/categories", icon: Tags },
    { name: "Inventory", href: "/admin/inventory", icon: Boxes },
    { name: "Customers", href: "/admin/users", icon: Users },
    { name: "Settings", href: "/admin/settings", icon: Settings },
];

interface AdminSidebarProps {
    className?: string;
    onNavigate?: () => void;
}

export function AdminSidebar({ className, onNavigate }: AdminSidebarProps) {
    const location = useLocation();

    return (
        <div className={cn("flex h-full flex-col bg-muted/40 border-r", className)}>
            <div className="flex h-16 items-center border-b px-6">
                <Link to="/admin" className="flex items-center gap-2 font-semibold">
                    <Package className="h-6 w-6" />
                    <span className="">CMS Panel</span>
                </Link>
            </div>
            <div className="flex-1 overflow-auto py-4">
                <nav className="grid gap-1 px-4 text-sm font-medium">
                    {NAV_ITEMS.map((item) => {
                        const isActive = location.pathname === item.href || (item.href !== "/admin" && location.pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                onClick={onNavigate}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                                    isActive && "bg-muted text-primary",
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}
