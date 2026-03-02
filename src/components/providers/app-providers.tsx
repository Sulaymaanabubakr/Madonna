

import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "./auth-provider";
import { CartProvider } from "./cart-provider";
import { ThemeProvider } from "./theme-provider";
import { WishlistProvider } from "./wishlist-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            {children}
            <Toaster position="top-right" richColors />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
