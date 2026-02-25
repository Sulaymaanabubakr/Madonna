import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type TrackResponse = {
  order: {
    id: string;
    orderNumber: string;
    status: string;
    createdAt: string;
    total: number;
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
          <Input placeholder="Order ID" value={orderId} onChange={(e) => setOrderId(e.target.value)} required />
          <Input placeholder="Email (or use phone)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input placeholder="Phone (optional if email provided)" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Button className="w-full rounded-none bg-[#222222] text-white hover:bg-[#8B2030]" disabled={loading}>{loading ? "Checking..." : "Track Order"}</Button>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </form>

        {result ? (
          <div className="mt-6 space-y-3 border border-zinc-200 bg-white p-8">
            <p className="text-sm"><span className="font-bold">Order Number:</span> {result.order.orderNumber}</p>
            <p className="text-sm"><span className="font-bold">Status:</span> {result.order.status}</p>
            <p className="text-sm"><span className="font-bold">Placed:</span> {new Date(result.order.createdAt).toLocaleString()}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
