

import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Menu, Search, ShoppingBag, User2, X, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { BUSINESS } from "@/lib/constants";
import { fetchPublicSettings } from "@/lib/firestore";
import { useAuth } from "@/components/providers/auth-provider";
import { useCart } from "@/components/providers/cart-provider";
import { useWishlist } from "@/components/providers/wishlist-provider";
import { Badge } from "@/components/ui/badge";
import { CartDrawer } from "@/components/store/cart-drawer";
import { formatCurrency } from "@/lib/query";

const navItems = [
    { name: "HOME", href: "/" },
    { name: "SHOP", href: "/shop" },
    { name: "CONTACT", href: "/contact" },
];

type PublicHeaderSettings = {
    storeName: string;
    phone: string;
    announcementEnabled: boolean;
    announcementText: string;
    announcementSpeed: number;
};

export function Header() {
    const { user, profile, logout } = useAuth();
    const { count, subtotal } = useCart();
    const { count: wishlistCount } = useWishlist();
    const [query, setQuery] = useState("");
    const [searchOpen, setSearchOpen] = useState(false);
    const [publicSettings, setPublicSettings] = useState<PublicHeaderSettings>({
        storeName: BUSINESS.name,
        phone: BUSINESS.phone,
        announcementEnabled: false,
        announcementText: "",
        announcementSpeed: 22,
    });
    const navigate = useNavigate();
    const storeName = (publicSettings.storeName || BUSINESS.name).trim();
    const storeNameWords = storeName.split(/\s+/);
    const mobileLastWord = storeNameWords.length > 1 ? storeNameWords[storeNameWords.length - 1] : storeName;
    const mobileLeadingWords = storeNameWords.length > 1 ? storeNameWords.slice(0, -1).join(" ") : "";

    useEffect(() => {
        fetchPublicSettings().then((settings) => {
            setPublicSettings((prev) => ({ ...prev, ...settings }));
        }).catch(() => {
            // Keep defaults from constants if loading fails.
        });
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            navigate(`/shop?q=${encodeURIComponent(query)}`);
            setSearchOpen(false);
        }
    };

    return (
        <header className="sticky top-0 z-50 w-full transition-all">
            {/* ── Madonna Maroon Top utility bar ── */}
            <div className="bg-[#8B2030] text-white">
                <div className="container mx-auto flex h-10 items-center justify-center px-4 text-[11px] font-semibold tracking-wider md:justify-between">
                    <div className="flex w-full items-center justify-center md:w-auto md:justify-start">
                        <span className="uppercase text-white/90">
                            CALL US: <a href={`tel:${publicSettings.phone || BUSINESS.phone}`} className="font-bold text-white hover:underline">{publicSettings.phone || BUSINESS.phone}</a>
                        </span>
                    </div>
                    <div className="hidden items-center gap-6 uppercase md:flex">
                        <Link to="/track" className="hover:text-white/80 transition-colors">Track Order</Link>
                        <Link to="/about" className="hover:text-white/80 transition-colors">About</Link>
                        <Link to="/contact" className="hover:text-white/80 transition-colors">Contact</Link>
                    </div>
                </div>
            </div>

            {publicSettings.announcementEnabled && publicSettings.announcementText?.trim() ? (
                <div className="ticker-wrap bg-zinc-900 text-white">
                    <div
                        className="ticker-line"
                        style={
                            {
                                animationDuration: `${publicSettings.announcementSpeed || 22}s`,
                            } as React.CSSProperties
                        }
                    >
                        <span>{publicSettings.announcementText}</span>
                    </div>
                </div>
            ) : null}

            {/* ── Main White Header ── */}
            <div className="border-b bg-white shadow-sm">
                <div className="container relative mx-auto flex h-[64px] items-center justify-between px-4 sm:h-[72px] lg:h-[80px]">
                    {/* Mobile Left: Account + Cart */}
                    <div className="absolute left-4 flex items-center gap-1 md:hidden">
                        {user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="rounded-none hover:bg-zinc-100">
                                        <User2 className="h-5 w-5 text-zinc-800" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="rounded-none border-zinc-200 shadow-xl">
                                    <DropdownMenuItem asChild className="cursor-pointer text-xs font-semibold uppercase hover:bg-zinc-100"><Link to="/account">My Account</Link></DropdownMenuItem>
                                    <DropdownMenuItem className="cursor-pointer text-xs font-semibold uppercase hover:bg-zinc-100" onClick={() => logout()}>Logout</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Button asChild variant="ghost" size="icon" className="rounded-none hover:bg-zinc-100">
                                <Link to="/account" aria-label="Go to sign in">
                                    <User2 className="h-5 w-5 text-zinc-800" />
                                </Link>
                            </Button>
                        )}

                        <CartDrawer>
                            <Button variant="ghost" size="icon" className="relative rounded-none hover:bg-zinc-100">
                                <ShoppingBag className="h-5 w-5 text-zinc-800" />
                                {count > 0 && (
                                    <Badge className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#8B2030] px-1 text-[10px] font-bold leading-none text-white hover:bg-[#8B2030]">
                                        {count}
                                    </Badge>
                                )}
                            </Button>
                        </CartDrawer>
                    </div>

                    {/* Desktop Nav (Left) */}
                    <nav className="hidden items-center gap-6 lg:flex">
                        {navItems.map((item) => (
                            <Link
                                key={item.name}
                                to={item.href}
                                className="text-[12px] font-bold uppercase tracking-[0.1em] text-zinc-800 transition-colors hover:text-[#8B2030]"
                            >
                                {item.name}
                            </Link>
                        ))}
                    </nav>

                    {/* Center Logo */}
                    <div className="absolute left-1/2 flex max-w-[50vw] -translate-x-1/2 items-center justify-center xl:static xl:translate-x-0 xl:max-w-none">
                        <Link to="/" className="flex items-center justify-center gap-2 sm:gap-3">
                            <img
                                src="/logo.png"
                                alt="Logo"
                                className="h-8 w-auto flex-shrink-0 rounded-xl object-contain sm:h-10 lg:h-12"
                            />
                            <span className="block truncate text-center font-sans text-sm font-black uppercase leading-tight tracking-tight text-zinc-900 sm:text-2xl lg:text-3xl">
                                {mobileLeadingWords ? (
                                    <>
                                        <span className="sm:hidden">{mobileLeadingWords}</span>
                                        <span className="block sm:hidden">{mobileLastWord}</span>
                                        <span className="hidden sm:inline">{storeName}</span>
                                    </>
                                ) : (
                                    storeName
                                )}
                            </span>
                        </Link>
                    </div>

                    {/* Desktop/Tablet Right Icons */}
                    <div className="hidden items-center gap-2 md:flex lg:gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-none hover:bg-zinc-100"
                            onClick={() => setSearchOpen(!searchOpen)}
                        >
                            {searchOpen ? <X className="h-6 w-6 text-zinc-800" /> : <Search className="h-6 w-6 text-zinc-800" />}
                        </Button>

                        <Button asChild variant="ghost" size="icon" className="relative rounded-none hover:bg-zinc-100">
                            <Link to="/wishlist" aria-label="Wishlist">
                                <Heart className="h-6 w-6 text-zinc-800" />
                                {wishlistCount > 0 && (
                                    <Badge className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#8B2030] px-1 text-[10px] font-bold leading-none text-white hover:bg-[#8B2030]">
                                        {wishlistCount}
                                    </Badge>
                                )}
                            </Link>
                        </Button>

                        {user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="rounded-none hover:bg-zinc-100">
                                        <User2 className="h-6 w-6 text-zinc-800" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-none border-zinc-200 shadow-xl">
                                    <DropdownMenuItem asChild className="cursor-pointer text-xs font-semibold uppercase hover:bg-zinc-100"><Link to="/account">My Account</Link></DropdownMenuItem>
                                    <DropdownMenuItem className="cursor-pointer text-xs font-semibold uppercase hover:bg-zinc-100" onClick={() => logout()}>Logout</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Button asChild variant="ghost" size="icon" className="rounded-none hover:bg-zinc-100">
                                <Link to="/account" aria-label="Go to sign in">
                                    <User2 className="h-6 w-6 text-zinc-800" />
                                </Link>
                            </Button>
                        )}

                        <div className="ml-2 border-l border-zinc-200 py-2 pl-4">
                            <CartDrawer>
                                <Button variant="ghost" className="relative flex items-center justify-between gap-2 overflow-hidden rounded-none px-2 hover:bg-zinc-100">
                                    <div className="hidden flex-col items-end sm:flex md:hidden lg:flex">
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Shopping Cart</span>
                                        <span className="text-xs font-bold text-[#8B2030]">{formatCurrency(subtotal)}</span>
                                    </div>
                                    <div className="relative">
                                        <ShoppingBag className="h-7 w-7 text-zinc-800" />
                                        {count > 0 && (
                                            <Badge className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#8B2030] px-1 text-[10px] font-bold leading-none text-white hover:bg-[#8B2030]">
                                                {count}
                                            </Badge>
                                        )}
                                    </div>
                                </Button>
                            </CartDrawer>
                        </div>
                    </div>

                    {/* Mobile Right: Search + Hamburger */}
                    <div className="absolute right-4 flex items-center gap-1 md:hidden">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-none hover:bg-zinc-100"
                            onClick={() => setSearchOpen(!searchOpen)}
                        >
                            {searchOpen ? <X className="h-5 w-5 text-zinc-800" /> : <Search className="h-5 w-5 text-zinc-800" />}
                        </Button>

                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-none hover:bg-zinc-100">
                                    <Menu className="h-5 w-5 text-zinc-800" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-[85%] max-w-sm rounded-none border-none p-0">
                                <SheetTitle className="sr-only">Main navigation menu</SheetTitle>
                                <SheetDescription className="sr-only">
                                    Browse pages like Home, Shop, Products, and Contact.
                                </SheetDescription>
                                <div className="bg-[#8B2030] p-4 text-white">
                                    <span className="text-lg font-bold uppercase tracking-widest">Menu</span>
                                </div>
                                <nav className="flex flex-col p-4">
                                    {navItems.map((item) => (
                                        <Link
                                            key={item.name}
                                            to={item.href}
                                            className="border-b border-zinc-100 py-4 text-xs font-bold uppercase tracking-widest text-zinc-800 hover:text-[#8B2030]"
                                        >
                                            {item.name}
                                        </Link>
                                    ))}
                                </nav>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>

                {/* Search bar drop-down */}
                {searchOpen && (
                    <div className="absolute left-0 top-full z-40 w-full border-b bg-white p-4 shadow-lg">
                        <form onSubmit={handleSearch} className="container mx-auto flex max-w-3xl gap-0">
                            <Input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search..."
                                className="h-12 rounded-none border-zinc-300 text-sm focus-visible:ring-[#8B2030]"
                                autoFocus
                            />
                            <Button type="submit" className="h-12 rounded-none bg-[#8B2030] px-8 text-xs font-bold uppercase tracking-widest text-white hover:bg-[#721a27]">
                                Search
                            </Button>
                        </form>
                    </div>
                )}
            </div>
        </header>
    );
}
