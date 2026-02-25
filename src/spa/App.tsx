import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const HomePage = lazy(() => import("@/spa/pages/home-page").then((m) => ({ default: m.HomePage })));
const ShopPage = lazy(() => import("@/spa/pages/shop-page").then((m) => ({ default: m.ShopPage })));
const ProductPage = lazy(() => import("@/spa/pages/product-page").then((m) => ({ default: m.ProductPage })));
const AccountPage = lazy(() => import("@/spa/pages/account-page").then((m) => ({ default: m.AccountPage })));
const ContactPage = lazy(() => import("@/spa/pages/contact-page").then((m) => ({ default: m.ContactPage })));
const AboutPage = lazy(() => import("@/spa/pages/about-page").then((m) => ({ default: m.AboutPage })));
const CheckoutPage = lazy(() => import("@/spa/pages/checkout-page").then((m) => ({ default: m.CheckoutPage })));
const CheckoutVerifyPage = lazy(() =>
  import("@/spa/pages/checkout-verify-page").then((m) => ({ default: m.CheckoutVerifyPage })),
);
const TrackLookupPage = lazy(() =>
  import("@/spa/pages/track-lookup-page").then((m) => ({ default: m.TrackLookupPage })),
);
const TrackOrderPage = lazy(() =>
  import("@/spa/pages/track-order-page").then((m) => ({ default: m.TrackOrderPage })),
);
const CategoryPage = lazy(() => import("@/spa/pages/category-page").then((m) => ({ default: m.CategoryPage })));
const AdminPage = lazy(() => import("@/spa/pages/admin-page").then((m) => ({ default: m.AdminPage })));
const AdminSettingsPage = lazy(() =>
  import("@/spa/pages/admin-settings-page").then((m) => ({ default: m.AdminSettingsPage })),
);

function NotFound() {
  return <div className="container mx-auto px-4 py-20 text-center text-zinc-500">Page not found.</div>;
}

export function App() {
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans antialiased">
      <Header />
      <main className="flex-1">
        <Suspense fallback={<div className="container mx-auto px-4 py-20 text-center text-zinc-500">Loading...</div>}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/product/:slug" element={<ProductPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/checkout/verify" element={<CheckoutVerifyPage />} />
            <Route path="/track" element={<TrackLookupPage />} />
            <Route path="/track/:orderId" element={<TrackOrderPage />} />
            <Route path="/category/:slug" element={<CategoryPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/settings" element={<AdminSettingsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
