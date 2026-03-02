import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Copy, Package, Truck, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import { fetchMyOrders } from "@/lib/firestore";
import { formatCurrency } from "@/lib/query";
import type { Order } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AccountPage() {
  const { user, profile, loading, login, register, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isLoginView, setIsLoginView] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  useEffect(() => {
    if (user && profile?.role === "customer") {
      setIsLoadingOrders(true);
      fetchMyOrders(user.uid)
        .then((items) => setOrders(items))
        .finally(() => setIsLoadingOrders(false));
    }
  }, [user, profile]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    try {
      if (isLoginView) {
        await login(email, password);
        toast.success("Welcome back!");
      } else {
        await register(name, email, password);
        toast.success("Account created successfully");
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsAuthLoading(false);
    }
  };

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center">Loading...</div>;

  if (!user) {
    return (
      <div className="bg-[#F4F4F4] py-16">
        <div className="container mx-auto max-w-md px-4">
          <div className="border border-zinc-200 bg-white p-8 shadow-sm">
            <h2 className="mb-6 text-center text-2xl font-black uppercase tracking-widest text-zinc-900">{isLoginView ? "Sign In" : "Register"}</h2>
            <form onSubmit={handleAuth} className="space-y-4">
              {!isLoginView && <Input value={name} onChange={(e) => setName(e.target.value)} className="h-12 rounded-none border-zinc-300 text-[13px] focus-visible:ring-[#8B2030]" required={!isLoginView} placeholder="Full Name" />}
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-none border-zinc-300 text-[13px] focus-visible:ring-[#8B2030]" required placeholder="Email Address" />
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 rounded-none border-zinc-300 text-[13px] focus-visible:ring-[#8B2030]" required minLength={6} placeholder="Password" />
              <Button type="submit" disabled={isAuthLoading} className="mt-4 h-12 w-full rounded-none bg-[#222222] text-[12px] font-bold uppercase tracking-[0.1em] text-white hover:bg-[#8B2030]">{isAuthLoading ? "Processing..." : isLoginView ? "Log In" : "Create Account"}</Button>
            </form>
            <div className="mt-6 text-center text-[13px] text-zinc-500">{isLoginView ? "Don't have an account? " : "Already have an account? "}<button onClick={() => setIsLoginView(!isLoginView)} className="font-bold text-zinc-900 hover:text-[#8B2030]">{isLoginView ? "Register Now" : "Log In"}</button></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F4F4F4] pb-24">
      <div className="border-b border-zinc-200 bg-white"><div className="container mx-auto px-4 py-8"><div className="flex items-center justify-between"><h1 className="text-3xl font-black uppercase tracking-widest text-zinc-900">MY ACCOUNT</h1><Button onClick={logout} variant="outline" className="h-10 rounded-none border-zinc-300 text-xs font-bold uppercase tracking-widest">Log Out</Button></div></div></div>
      <div className="container mx-auto px-4 py-12">
        {isLoadingOrders ? <div className="h-32 animate-pulse border border-zinc-200 bg-white" /> : orders.length === 0 ? <div className="border border-zinc-200 bg-white p-12 text-center text-zinc-500">No orders found. <Link to="/shop" className="font-bold text-[#8B2030]">Start Shopping.</Link></div> : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="border border-zinc-200 bg-white p-6 transition-shadow hover:shadow-sm">
                <div className="mb-4 flex flex-col gap-4 border-b border-zinc-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div><p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Order Placed</p><p className="text-[13px] font-bold text-zinc-900">{new Date(order.createdAt).toLocaleDateString()}</p></div>
                  <div><p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Total</p><p className="text-[13px] font-bold text-zinc-900">{formatCurrency(order.total || 0)}</p></div>
                  <div><p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Order Number</p><div className="flex items-center gap-2"><span className="text-[13px] font-bold text-zinc-900">{order.orderNumber}</span><button onClick={() => { navigator.clipboard.writeText(order.orderNumber || order.id); toast.success("Copied!"); }} className="text-zinc-400 hover:text-[#8B2030]"><Copy className="h-3 w-3" /></button></div></div>
                </div>
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3">{order.status === "delivered" ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : order.status === "shipped" ? <Truck className="h-5 w-5 text-blue-600" /> : <Package className="h-5 w-5 text-zinc-500" />}<div className="flex flex-col"><span className="text-[13px] font-bold uppercase tracking-widest text-zinc-900">{order.status}</span><span className="text-[11px] text-zinc-500">{order.items?.length || 0} items</span></div></div>
                  <Button asChild variant="outline" className="h-10 rounded-none border-zinc-300 text-[11px] font-bold uppercase tracking-widest text-zinc-900 hover:bg-[#8B2030] hover:text-white"><Link to={`/track/${order.id}`}>Track / View Details</Link></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
