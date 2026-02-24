"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, Search, ShoppingBag, User2, X, Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { BUSINESS } from "@/lib/constants";
import { useAuth } from "@/components/providers/auth-provider";
import { useCart } from "@/components/providers/cart-provider";
import { Badge } from "@/components/ui/badge";
import { CartDrawer } from "@/components/store/cart-drawer";
import { formatCurrency } from "@/lib/query";

const navItems = [
    { name: "HOME", href: "/" },
    { name: "SHOP", href: "/shop" },
    { name: "PRODUCTS", href: "/shop" },
    { name: "CONTACT", href: "/contact" },
];

export function Header() {
    const { user, profile, logout } = useAuth();
    const { count, subtotal } = useCart();
    const [query, setQuery] = useState("");
    const [searchOpen, setSearchOpen] = useState(false);
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/shop?q=${encodeURIComponent(query)}`);
            setSearchOpen(false);
        }
    };

    if (!mounted) return <header className="h-[104px] border-b" />;

    return (
        <header className="sticky top-0 z-50 w-full transition-all">
            {/* ── Madonna Maroon Top utility bar ── */}
            <div className="bg-[#8B2030] text-white">
                <div className="container mx-auto flex h-10 items-center justify-between px-4 text-[11px] font-semibold tracking-wider">
                    <div className="flex items-center">
                        <span className="uppercase text-white/90">
                            CALL US: <a href={`tel:${BUSINESS.phone}`} className="font-bold text-white hover:underline">{BUSINESS.phone}</a>
                        </span>
                    </div>
                    <div className="hidden items-center gap-6 uppercase md:flex">
                        <Link href="/track" className="hover:text-white/80 transition-colors">Track Order</Link>
                        <Link href="/about" className="hover:text-white/80 transition-colors">About</Link>
                        <Link href="/contact" className="hover:text-white/80 transition-colors">Contact</Link>
                        <span className="text-white/40">|</span>
                        <span className="cursor-pointer hover:text-white/80 transition-colors">USD ▾</span>
                        <span className="cursor-pointer hover:text-white/80 transition-colors">ENG ▾</span>
                    </div>
                </div>
            </div>

            {/* ── Main White Header ── */}
            <div className="border-b bg-white shadow-sm">
                <div className="container mx-auto flex h-[80px] items-center justify-between px-4">

                    {/* Mobile menu trigger */}
                    <div className="flex items-center md:hidden">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-none hover:bg-zinc-100">
                                    <Menu className="h-6 w-6 text-zinc-800" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-[85%] max-w-sm rounded-none border-none p-0">
                                <div className="bg-[#8B2030] p-4 text-white">
                                    <span className="text-lg font-bold uppercase tracking-widest">Menu</span>
                                </div>
                                <nav className="flex flex-col p-4">
                                    {navItems.map((item) => (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className="border-b border-zinc-100 py-4 text-xs font-bold uppercase tracking-widest text-zinc-800 hover:text-[#8B2030]"
                                        >
                                            {item.name}
                                        </Link>
                                    ))}
                                </nav>
                            </SheetContent>
                        </Sheet>
                    </div>

                    {/* Desktop Nav (Left) */}
                    <nav className="hidden items-center gap-6 lg:flex">
                        {navItems.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className="text-[12px] font-bold uppercase tracking-[0.1em] text-zinc-800 transition-colors hover:text-[#8B2030]"
                            >
                                {item.name}
                            </Link>
                        ))}
                    </nav>

                    {/* Center Logo */}
                    <div className="absolute left-1/2 top-[60px] -translate-x-1/2 -translate-y-1/2 lg:top-[64px]">
                        <Link href="/" className="flex flex-col items-center">
                            <span className="font-sans text-3xl font-black uppercase tracking-tighter text-zinc-900">
                                MADONNA
                            </span>
                            <span className="text-[10px] font-medium tracking-[0.15em] text-zinc-500">
                                LINK EXPRESS
                            </span>
                        </Link>
                    </div>

                    {/* Right Icons */}
                    <div className="flex items-center gap-2 lg:gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-none hover:bg-zinc-100"
                            onClick={() => setSearchOpen(!searchOpen)}
                        >
                            {searchOpen ? <X className="h-6 w-6 text-zinc-800" /> : <Search className="h-6 w-6 text-zinc-800" />}
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-none hover:bg-zinc-100">
                                    <User2 className="h-6 w-6 text-zinc-800" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-none border-zinc-200 shadow-xl">
                                {user ? (
                                    <>
                                        <DropdownMenuItem asChild className="cursor-pointer text-xs font-semibold uppercase hover:bg-zinc-100"><Link href="/account">My Account</Link></DropdownMenuItem>
                                        {profile?.role === "admin" && <DropdownMenuItem asChild className="cursor-pointer text-xs font-semibold uppercase hover:bg-zinc-100"><Link href="/admin">Admin Dashboard</Link></DropdownMenuItem>}
                                        <DropdownMenuItem className="cursor-pointer text-xs font-semibold uppercase hover:bg-zinc-100" onClick={() => logout()}>Logout</DropdownMenuItem>
                                    </>
                                ) : (
                                    <DropdownMenuItem asChild className="cursor-pointer text-xs font-semibold uppercase hover:bg-zinc-100"><Link href="/account">Login / Register</Link></DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button variant="ghost" size="icon" className="hidden rounded-none hover:bg-zinc-100 sm:flex">
                            <Heart className="h-6 w-6 text-zinc-800" />
                        </Button>

                        <div className="ml-2 border-l border-zinc-200 py-2 pl-4">
                            <CartDrawer>
                                <Button variant="ghost" className="relative flex items-center justify-between gap-2 overflow-hidden rounded-none px-2 hover:bg-zinc-100">
                                    <div className="hidden flex-col items-end sm:flex md:hidden lg:flex">
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Shopping Cart</span>
                                        <span className="text-xs font-bold text-[#8B2030]">{formatCurrency(subtotal)}</span>
                                    </div>
                                    <div className="relative">
                                        <ShoppingBag className="h-7 w-7 text-zinc-800" />
                                        {count >= 0 && (
                                            <Badge className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#8B2030] px-1 text-[10px] font-bold leading-none text-white hover:bg-[#8B2030]">
                                                {count}
                                            </Badge>
                                        )}
                                    </div>
                                </Button>
                            </CartDrawer>
                        </div>
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
