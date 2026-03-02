import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AdminTopbar } from "./admin-topbar";
import { AdminSidebar } from "./admin-sidebar";
import { Sheet, SheetContent, SheetTitle, SheetHeader, SheetDescription } from "@/components/ui/sheet";

export function AdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-[100dvh] w-full flex-col lg:flex-row overflow-hidden bg-background">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block lg:w-[280px] lg:shrink-0 border-r">
                <AdminSidebar />
            </div>

            {/* Mobile Sidebar */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetContent side="left" className="p-0 w-[280px]" aria-describedby={undefined}>
                    <SheetHeader className="sr-only">
                        <SheetTitle>Admin Navigation</SheetTitle>
                        <SheetDescription>Main navigation menu for management.</SheetDescription>
                    </SheetHeader>
                    <AdminSidebar onNavigate={() => setSidebarOpen(false)} />
                </SheetContent>
            </Sheet>

            <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
                <AdminTopbar onMenuClick={() => setSidebarOpen(true)} />
                <main className="flex-1 w-full min-w-0 overflow-y-auto overflow-x-hidden bg-muted/10 p-4 md:p-6 lg:p-8">
                    <div className="mx-auto w-full max-w-6xl">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
