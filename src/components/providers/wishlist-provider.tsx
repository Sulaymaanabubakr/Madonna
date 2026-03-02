import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const WISHLIST_KEY = "madonna-wishlist-v1";

type WishlistContextType = {
    ids: string[];
    count: number;
    isInWishlist: (productId: string) => boolean;
    toggle: (productId: string) => void;
    clear: () => void;
};

const WishlistContext = createContext<WishlistContextType | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
    const [ids, setIds] = useState<string[]>([]);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(WISHLIST_KEY);
            if (raw) setIds(JSON.parse(raw) as string[]);
        } catch {
            localStorage.removeItem(WISHLIST_KEY);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem(WISHLIST_KEY, JSON.stringify(ids));
    }, [ids]);

    const isInWishlist = (productId: string) => ids.includes(productId);

    const toggle = (productId: string) => {
        setIds((prev) => {
            if (prev.includes(productId)) {
                toast.info("Removed from wishlist");
                return prev.filter((id) => id !== productId);
            }
            toast.success("Added to wishlist");
            return [...prev, productId];
        });
    };

    const clear = () => setIds([]);

    const value = useMemo(
        () => ({ ids, count: ids.length, isInWishlist, toggle, clear }),
        [ids],
    );

    return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
    const ctx = useContext(WishlistContext);
    if (!ctx) throw new Error("useWishlist must be used inside WishlistProvider");
    return ctx;
}
