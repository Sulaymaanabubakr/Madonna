import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { formatCurrency } from "@/lib/query";
import { Package, Truck, CheckCircle2, ChevronRight, Clock } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { fetchOrderById } from "@/lib/firestore";
import type { Order, StatusEvent } from "@/types";

export function TrackOrderPage() {
  const [order, setOrder] = useState<Order | null>(null);
  const [events, setEvents] = useState<StatusEvent[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { orderId } = useParams();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/track", { replace: true });
      return;
    }

    const run = async () => {
      try {
        if (!orderId) {
          setError("Order ID missing");
          return;
        }

        const result = await fetchOrderById(orderId);
        if (!result) {
          setError("Order not found");
        } else {
          setOrder(result.order);
          setEvents(result.events);
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [authLoading, navigate, orderId, user]);

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center">Loading timeline...</div>;
  if (error || !order) return <div className="flex min-h-[50vh] items-center justify-center bg-[#F4F4F4]"><div className="border border-zinc-200 bg-white p-12 text-center text-red-600">Failed to load order: {error || "Not found"}</div></div>;

  return (
    <div className="bg-[#F4F4F4] pb-24">
      <div className="border-b border-zinc-200 bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center gap-2">
            <h1 className="text-4xl font-black uppercase tracking-widest text-zinc-900">TRACK ORDER</h1>
            <div className="flex items-center text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              <Link to="/account" className="hover:text-[#8B2030]">MY ACCOUNT</Link>
              <ChevronRight className="mx-2 h-3 w-3" />
              <span className="text-zinc-900">#{order.orderNumber}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="mb-8 border border-zinc-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
              <div><p className="text-[12px] font-bold uppercase tracking-widest text-zinc-500">Order Reference</p><p className="text-xl font-black text-zinc-900">{order.orderNumber}</p></div>
              <div className="flex gap-8"><div><p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Date</p><p className="text-[13px] font-bold text-zinc-900">{new Date(order.createdAt).toLocaleDateString()}</p></div><div><p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Total Amount</p><p className="text-[13px] font-bold text-[#8B2030]">{formatCurrency(order.total)}</p></div></div>
            </div>
          </div>

          <div className="border border-zinc-200 bg-white p-8 shadow-sm">
            <h3 className="mb-6 text-[15px] font-black uppercase tracking-widest text-zinc-900">Order Updates</h3>
            <div className="space-y-4">
              {events.map((event, idx) => (
                <div key={`${event.createdAt}-${idx}`} className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm">
                  <div className="flex items-center gap-2">
                    {event.status === "delivered" ? <CheckCircle2 className="h-4 w-4" /> : event.status === "shipped" ? <Truck className="h-4 w-4" /> : <Package className="h-4 w-4" />}
                    <p className="font-semibold uppercase">{event.status}</p>
                    <p className="ml-auto flex items-center gap-1 text-xs text-zinc-500"><Clock className="h-3 w-3" />{new Date(event.createdAt).toLocaleDateString()}</p>
                  </div>
                  {event.note ? <p className="text-zinc-600">{event.note}</p> : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
