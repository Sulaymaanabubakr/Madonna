export default function PoliciesPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-6 text-3xl font-black uppercase tracking-widest">Policies</h1>
      <div className="space-y-6 text-sm leading-7 text-zinc-700">
        <section>
          <h2 className="mb-2 text-lg font-bold text-zinc-900">Shipping Policy</h2>
          <p>Orders are processed after payment confirmation. Delivery windows may vary by location and demand.</p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-bold text-zinc-900">Returns & Refunds</h2>
          <p>Contact support within 7 days of delivery to request a return. Refunds are processed after item verification.</p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-bold text-zinc-900">Privacy</h2>
          <p>Customer data is used to process orders, delivery, and service communication.</p>
        </section>
      </div>
    </div>
  );
}
