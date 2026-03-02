import { useEffect, useState } from "react";
import { Search, UserCog, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getDbClient } from "@/lib/firebase/client";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import type { UserProfile, Order } from "@/types";

interface CustomerWithStats extends UserProfile {
    totalOrders: number;
    totalSpent: number;
    lastOrderDate?: string;
}

export function AdminUsersPage() {
    const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        async function fetchCustomersAndStats() {
            try {
                const db = await getDbClient();
                if (!db) return;

                // Fetch Users
                const usersSnap = await getDocs(collection(db, "users"));
                const usersData = usersSnap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile));

                // Fetch Orders for stats
                const ordersQ = query(collection(db, "orders"), orderBy("createdAt", "desc"));
                const ordersSnap = await getDocs(ordersQ);
                const ordersData = ordersSnap.docs.map(d => d.data() as Order);

                // Map stats to users
                const mappedCustomers: CustomerWithStats[] = usersData.map(user => {
                    const userOrders = ordersData.filter(o => o.userId === user.uid || (user.email && o.customer?.email === user.email));
                    const totalOrders = userOrders.length;
                    const totalSpent = userOrders.reduce((sum, o) => sum + (o.total || 0), 0);
                    const lastOrderDate = userOrders.length > 0 ? userOrders[0].createdAt : undefined;

                    return {
                        ...user,
                        totalOrders,
                        totalSpent,
                        lastOrderDate
                    };
                });

                // Sort: Admins first, then by total spent descending
                mappedCustomers.sort((a, b) => {
                    if (a.role === 'admin' && b.role !== 'admin') return -1;
                    if (a.role !== 'admin' && b.role === 'admin') return 1;
                    return b.totalSpent - a.totalSpent;
                });

                setCustomers(mappedCustomers);
            } catch (err: any) {
                toast.error("Failed to load customers: " + err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchCustomersAndStats();
    }, []);

    const filteredCustomers = customers.filter(c =>
        c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 pt-4 pb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
                    <p className="text-muted-foreground mt-2">View user accounts and purchase history insights.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Customer Directory</CardTitle>
                    <CardDescription>Manage your registered users and view lifetime value.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-2 mb-4">
                        <div className="relative flex-1 w-full sm:max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search by name or email..."
                                className="pl-8 w-full"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="rounded-md border overflow-x-auto w-full">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b">
                                <tr className="text-left font-medium text-muted-foreground [&>th]:p-4 [&>th]:align-middle whitespace-nowrap">
                                    <th>Customer</th>
                                    <th>Role</th>
                                    <th>Joined</th>
                                    <th className="text-right">Orders</th>
                                    <th className="text-right">Total Spent</th>
                                </tr>
                            </thead>
                            <tbody className="[&>tr:last-child]:border-0 divide-y">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="p-4 text-center text-muted-foreground py-8">
                                            Loading customers...
                                        </td>
                                    </tr>
                                ) : filteredCustomers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-4 text-center text-muted-foreground py-8">
                                            No customers found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCustomers.map((customer) => (
                                        <tr key={customer.uid} className="transition-colors hover:bg-muted/50">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 shrink-0 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium">
                                                        {(customer.name || customer.email || "?").charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{customer.name || "Unknown"}</div>
                                                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                            <Mail className="h-3 w-3" /> {customer.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <Badge variant={customer.role === "admin" ? "default" : "secondary"} className="flex w-fit items-center gap-1">
                                                    {customer.role === "admin" && <UserCog className="h-3 w-3" />}
                                                    {customer.role}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-muted-foreground whitespace-nowrap">
                                                {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : "—"}
                                            </td>
                                            <td className="p-4 text-right font-medium">
                                                {customer.totalOrders}
                                                {customer.lastOrderDate && (
                                                    <div className="text-xs text-muted-foreground font-normal mt-0.5 whitespace-nowrap">
                                                        Last: {new Date(customer.lastOrderDate).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4 text-right font-mono font-bold">
                                                ₦{customer.totalSpent.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
