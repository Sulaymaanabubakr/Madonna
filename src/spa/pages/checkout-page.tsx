import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useCart } from "@/components/providers/cart-provider";
import { useAuth } from "@/components/providers/auth-provider";
import { formatCurrency } from "@/lib/query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const checkoutSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  address: z.string().min(10, "Full address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  orderNotes: z.string().optional(),
});

type CheckoutValues = z.infer<typeof checkoutSchema>;
type CheckoutItemPayload = {
  productId: string;
  productSlug?: string;
  name: string;
  price: number;
  qty: number;
  imageUrl: string;
  stockQty: number;
};

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal, removeItem, setQty } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [serverTotal, setServerTotal] = useState<number | null>(null);
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
  });
  const { profile, getToken } = useAuth();

  const readJsonSafe = async (res: Response): Promise<Record<string, unknown>> => {
    const text = await res.text();
    if (!text) return {};
    try {
      return JSON.parse(text) as Record<string, unknown>;
    } catch {
      return {};
    }
  };

  // Pre-fill form from logged-in profile
  useEffect(() => {
    if (profile) {
      const nameParts = (profile.name || "").split(" ");
      setValue("firstName", nameParts[0] || "", { shouldValidate: false });
      setValue("lastName", nameParts.slice(1).join(" ") || "", { shouldValidate: false });
      setValue("email", profile.email || "", { shouldValidate: false });
      if (profile.phone) setValue("phone", profile.phone, { shouldValidate: false });
    }
  }, [profile, setValue]);

  useEffect(() => {
    if (items.length === 0 && !isProcessing) {
      navigate("/shop");
    }
  }, [items, navigate, isProcessing]);

  if (items.length === 0 && !isProcessing) return null;

  const onSubmit = async (data: CheckoutValues) => {
    setIsProcessing(true);
    try {
      if (items.length === 0) {
        throw new Error("Your cart is empty.");
      }

      const token = await getToken();
      let checkoutItems: CheckoutItemPayload[] = items.map((item) => ({
        productId: item.productId,
        productSlug: item.productSlug,
        name: item.name,
        price: Number(item.price || 0),
        qty: Math.max(1, Math.floor(Number(item.qty || 1))),
        imageUrl: item.imageUrl || "/placeholder.svg",
        stockQty: Math.max(0, Math.floor(Number(item.stockQty || 0))),
      }));

      const buildOrderPayload = (nextItems: CheckoutItemPayload[]) => {
        const computedSubtotal = nextItems.reduce((sum, item) => sum + item.price * item.qty, 0);
        return {
          customer: { name: `${data.firstName} ${data.lastName}`, email: data.email, phone: data.phone },
          shippingAddress: {
            fullName: `${data.firstName} ${data.lastName}`,
            phone: data.phone,
            addressLine1: data.address,
            city: data.city,
            state: data.state,
            notes: data.orderNotes,
          },
          items: nextItems,
          subtotal: computedSubtotal,
          deliveryFee: 0,
          total: computedSubtotal,
        };
      };

      const reconcileFromServer = (details: {
        missingProductIds?: string[];
        inactiveProductIds?: string[];
        insufficientStockItems?: Array<{ productId: string; availableQty: number }>;
      }) => {
        const removeSet = new Set<string>([
          ...(details.missingProductIds || []),
          ...(details.inactiveProductIds || []),
          ...((details.insufficientStockItems || []).filter((i) => i.availableQty <= 0).map((i) => i.productId)),
        ]);
        const qtyMap = new Map<string, number>(
          (details.insufficientStockItems || [])
            .filter((i) => i.availableQty > 0)
            .map((i) => [i.productId, i.availableQty]),
        );

        for (const id of removeSet) removeItem(id);
        for (const [id, qty] of qtyMap.entries()) setQty(id, qty);

        return checkoutItems
          .filter((item) => !removeSet.has(item.productId))
          .map((item) => (qtyMap.has(item.productId) ? { ...item, qty: Math.min(item.qty, qtyMap.get(item.productId) || item.qty) } : item))
          .filter((item) => item.qty > 0);
      };

      let orderData: Record<string, unknown> | null = null;
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const orderRes = await fetch("/api/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(buildOrderPayload(checkoutItems)),
        });
        const parsedOrderData = await readJsonSafe(orderRes);

        if (orderRes.ok && parsedOrderData.success) {
          orderData = parsedOrderData;
          break;
        }

        if (attempt === 0 && orderRes.status === 409 && parsedOrderData.code === "CART_OUTDATED") {
          const details = (parsedOrderData.details || {}) as {
            missingProductIds?: string[];
            inactiveProductIds?: string[];
            insufficientStockItems?: Array<{ productId: string; availableQty: number }>;
          };
          checkoutItems = reconcileFromServer(details);
          if (!checkoutItems.length) {
            throw new Error("All items in your cart are currently unavailable. Please update your cart and try again.");
          }
          toast.info("Cart updated with latest availability. Retrying checkout...");
          continue;
        }

        throw new Error(String(parsedOrderData.error || "Failed to create order"));
      }

      if (!orderData) throw new Error("Could not create order after cart reconciliation.");
      const orderId = String(orderData.orderId || "");
      const amount = Number(orderData.amount || 0);
      if (!orderId || amount <= 0) throw new Error("Invalid order response from server");

      const adjustments = (orderData.adjustments || {}) as {
        missingProductIds?: string[];
        inactiveProductIds?: string[];
        insufficientStockItems?: Array<{ productId: string; availableQty: number }>;
      };
      const hadAdjustments =
        (adjustments.missingProductIds?.length || 0) > 0 ||
        (adjustments.inactiveProductIds?.length || 0) > 0 ||
        (adjustments.insufficientStockItems?.length || 0) > 0;
      if (hadAdjustments) {
        for (const id of adjustments.missingProductIds || []) removeItem(id);
        for (const id of adjustments.inactiveProductIds || []) removeItem(id);
        for (const entry of adjustments.insufficientStockItems || []) {
          if (entry.availableQty > 0) setQty(entry.productId, entry.availableQty);
          else removeItem(entry.productId);
        }
        toast.info("Some cart items were adjusted to current availability.");
      }

      // Use the server-calculated total (includes delivery fee from store settings)
      setServerTotal(amount);

      const paystackRes = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          email: data.email,
          amount,
        }),
      });
      const paystackData = await readJsonSafe(paystackRes);
      if (!paystackRes.ok || !paystackData.success) {
        throw new Error(String(paystackData.error || "Failed to initialize payment"));
      }

      const authorizationUrl = String(paystackData.authorization_url || "");
      if (!authorizationUrl) throw new Error("Missing Paystack authorization URL");
      window.location.href = authorizationUrl;
    } catch (err) {
      toast.error((err as Error).message || "A checkout error occurred.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-[#F4F4F4] pb-24">
      <div className="border-b border-zinc-200 bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center gap-2">
            <h1 className="text-4xl font-black uppercase tracking-widest text-zinc-900">CHECKOUT</h1>
            <div className="flex items-center text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              <Link to="/" className="hover:text-[#8B2030]">HOME</Link>
              <ChevronRight className="mx-2 h-3 w-3" />
              <span className="text-zinc-900">CHECKOUT</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <h3 className="mb-4 text-xl font-bold uppercase tracking-widest text-zinc-900">Billing Details</h3>
            <div className="mb-8 h-[2px] w-[50px] bg-[#8B2030]" />

            <div className="space-y-6 border border-zinc-200 bg-white p-8 shadow-sm">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-zinc-700">First Name *</label>
                  <Input {...register("firstName")} className="h-12 rounded-none border-zinc-300 text-[13px] focus-visible:ring-[#8B2030]" />
                  {errors.firstName && <p className="text-xs text-red-500">{errors.firstName.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-zinc-700">Last Name *</label>
                  <Input {...register("lastName")} className="h-12 rounded-none border-zinc-300 text-[13px] focus-visible:ring-[#8B2030]" />
                  {errors.lastName && <p className="text-xs text-red-500">{errors.lastName.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[12px] font-bold text-zinc-700">Phone *</label>
                <Input {...register("phone")} className="h-12 rounded-none border-zinc-300 text-[13px] focus-visible:ring-[#8B2030]" />
                {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[12px] font-bold text-zinc-700">Email Address *</label>
                <Input {...register("email")} type="email" className="h-12 rounded-none border-zinc-300 text-[13px] focus-visible:ring-[#8B2030]" />
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[12px] font-bold text-zinc-700">Street Address *</label>
                <Input {...register("address")} className="h-12 rounded-none border-zinc-300 text-[13px] focus-visible:ring-[#8B2030]" />
                {errors.address && <p className="text-xs text-red-500">{errors.address.message}</p>}
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-zinc-700">Town / City *</label>
                  <Input {...register("city")} className="h-12 rounded-none border-zinc-300 text-[13px] focus-visible:ring-[#8B2030]" />
                  {errors.city && <p className="text-xs text-red-500">{errors.city.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-zinc-700">State *</label>
                  <Input {...register("state")} className="h-12 rounded-none border-zinc-300 text-[13px] focus-visible:ring-[#8B2030]" />
                  {errors.state && <p className="text-xs text-red-500">{errors.state.message}</p>}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="sticky top-24 border border-zinc-200 border-t-[3px] border-t-[#8B2030] bg-white p-8 shadow-sm">
              <h3 className="mb-6 text-xl font-bold uppercase tracking-widest text-zinc-900">Your Order</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-200 pb-2 text-[12px] font-bold uppercase tracking-widest text-zinc-900">
                  <span>Product</span><span>Total</span>
                </div>
                <div className="space-y-4 py-2">
                  {items.map((item) => (
                    <div key={item.productId} className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><span className="text-[13px] text-zinc-600">{item.name}</span><span className="text-xs font-bold text-zinc-900">x {item.qty}</span></div>
                      <span className="border-l border-zinc-100 pl-4 text-[14px] font-semibold text-zinc-900">{formatCurrency(item.price * item.qty)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between border-t border-zinc-200 py-4 text-[12px] font-bold uppercase tracking-widest text-zinc-900">
                  <span>Subtotal</span><span className="text-[15px]">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between py-4 text-xl font-bold uppercase tracking-widest text-zinc-900">
                  <span>Total</span><span className="text-[#8B2030]">{formatCurrency(serverTotal ?? subtotal)}</span>
                </div>
              </div>
              <Button type="submit" disabled={isProcessing} className="mt-6 h-14 w-full rounded-none bg-[#222222] text-[13px] font-bold uppercase tracking-[0.1em] text-white hover:bg-[#8B2030]">
                {isProcessing ? "Processing..." : "Place Order"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
