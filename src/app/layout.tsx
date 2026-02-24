import type { Metadata, Viewport } from "next";
import { Manrope, Playfair_Display } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BUSINESS } from "@/lib/constants";

const manrope = Manrope({
    subsets: ["latin"],
    variable: "--font-manrope",
    display: "swap",
});

const playfair = Playfair_Display({
    subsets: ["latin"],
    variable: "--font-playfair",
    display: "swap",
});

export const metadata: Metadata = {
    title: {
        default: `${BUSINESS.name} | Premium Shopping Arena`,
        template: `%s | ${BUSINESS.name}`,
    },
    description: "Shop Fashion, Beauty, and Groceries at Madonna Link Express Ventures, Oshodi Lagos.",
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
};

export const viewport: Viewport = {
    themeColor: "#8B2030", // Porto maroon
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${manrope.variable} ${playfair.variable} flex min-h-screen flex-col font-sans antialiased bg-background`}>
                <AppProviders>
                    <Header />
                    <main className="flex-1">{children}</main>
                    <Footer />
                </AppProviders>
            </body>
        </html>
    );
}
