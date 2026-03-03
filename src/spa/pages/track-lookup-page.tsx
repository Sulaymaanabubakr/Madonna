import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Package, Truck, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/query";

type TrackResponse = {
  order: {
    id: string;
    orderNumber: string;
    status: string;
    createdAt: string;
    total: number;
    items?: Array<{ name: string; qty: number; price: number }>;
  };
  statusEvents: Array<{ status: string; note?: string; createdAt: string }>;
};

export function TrackLookupPage() {
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<TrackResponse | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const params = new URLSearchParams();
      params.set("orderId", orderId.trim());
      if (email.trim()) params.set("email", email.trim());
      if (phone.trim()) params.set("phone", phone.trim());

      const res = await fetch(`/api/orders/track?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to track order");
      setResult(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#F4F4F4] pb-24">
      <div className="border-b border-zinc-200 bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center gap-2">
            <h1 className="text-4xl font-black uppercase tracking-widest text-zinc-900">TRACK ORDER</h1>
            <div className="flex items-center text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              <Link to="/" className="hover:text-[#8B2030]">HOME</Link>
              <ChevronRight className="mx-2 h-3 w-3" />
              <span className="text-zinc-900">TRACK ORDER</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-2xl px-4 py-12">
        <form onSubmit={onSubmit} className="space-y-4 border border-zinc-200 bg-white p-8">
          <Input placeholder="Order ID or Order Number" value={orderId} onChange={(e) => setOrderId(e.target.value)} className="h-12 rounded-none border-zinc-300 text-[13px] focus-visible:ring-[#8B2030]" required />
          <Input placeholder="Email (or use phone)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-none border-zinc-300 text-[13px] focus-visible:ring-[#8B2030]" />
          <Input placeholder="Phone (optional if email provided)" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-12 rounded-none border-zinc-300 text-[13px] focus-visible:ring-[#8B2030]" />
          <Button className="h-12 w-full rounded-none bg-[#222222] text-xs font-bold uppercase tracking-widest text-white hover:bg-[#8B2030]" disabled={loading}>{loading ? "Checking..." : "Track Order"}</Button>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </form>

        {result ? (
          <div className="mt-8 space-y-6">
            {/* Order Summary Card */}
            <div className="border border-zinc-200 bg-white p-8 shadow-sm">
              <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
                <div>
                  <p className="text-[12px] font-bold uppercase tracking-widest text-zinc-500">Order Reference</p>
                  <p className="text-xl font-black text-zinc-900">{result.order.orderNumber}</p>
                </div>
                <div className="flex gap-8">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Date</p>
                    <p className="text-[13px] font-bold text-zinc-900">{new Date(result.order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Total</p>
                    <p className="text-[13px] font-bold text-[#8B2030]">{formatCurrency(result.order.total)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Status</p>
                    <p className="text-[13px] font-bold uppercase text-zinc-900">{result.order.status}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Items */}
            {result.order.items && result.order.items.length > 0 && (
              <div className="border border-zinc-200 bg-white p-8 shadow-sm">
                <h3 className="mb-4 text-[15px] font-black uppercase tracking-widest text-zinc-900">Items</h3>
                <div className="space-y-3">
                  {result.order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between border-b border-zinc-100 pb-3 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] text-zinc-600">{item.name}</span>
                        <span className="text-xs font-bold text-zinc-900">x {item.qty}</span>
                      </div>
                      <span className="text-[13px] font-semibold text-zinc-900">{formatCurrency(item.price * item.qty)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="border border-zinc-200 bg-white p-8 shadow-sm">
              <h3 className="mb-6 text-[15px] font-black uppercase tracking-widest text-zinc-900">Order Updates</h3>
              <div className="space-y-4">
                {result.statusEvents.map((event, idx) => (
                  <div key={`${event.createdAt}-${idx}`} className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm">
                    <div className="flex items-center gap-2">
                      {event.status === "delivered" ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : event.status === "shipped" ? <Truck className="h-4 w-4 text-blue-600" /> : <Package className="h-4 w-4 text-zinc-500" />}
                      <p className="font-semibold uppercase">{event.status}</p>
                      <p className="ml-auto flex items-center gap-1 text-xs text-zinc-500"><Clock className="h-3 w-3" />{new Date(event.createdAt).toLocaleDateString()}</p>
                    </div>
                    {event.note ? <p className="mt-1 text-zinc-600">{event.note}</p> : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
