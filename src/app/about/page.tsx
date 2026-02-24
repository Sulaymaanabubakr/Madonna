import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function AboutPage() {
    return (
        <div className="bg-white">
            {/* ── Breadcrumb ── */}
            <div className="border-b border-zinc-100 bg-[#F4F4F4]">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex flex-col items-center justify-center gap-2">
                        <h1 className="text-4xl font-black uppercase tracking-widest text-zinc-900">
                            ABOUT US
                        </h1>
                        <div className="flex items-center text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                            <Link href="/" className="hover:text-[#8B2030]">HOME</Link>
                            <ChevronRight className="mx-2 h-3 w-3" />
                            <span className="text-zinc-900">ABOUT US</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-16">
                <div className="mx-auto max-w-4xl text-center">
                    <div className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                        OUR MISSION
                    </div>
                    <h2 className="mb-8 font-serif text-3xl font-bold uppercase tracking-wide text-zinc-900 md:text-4xl">
                        Providing Premium Quality at Accessible Prices
                    </h2>
                    <div className="mx-auto mt-4 mb-8 h-[2px] w-[50px] bg-[#8B2030]" />
                    <p className="text-sm leading-relaxed text-zinc-600 md:text-base md:leading-loose">
                        At Madonna Link Express Ventures, we believe that premium quality products should not be out of reach.
                        Located in the heart of Oshodi, Lagos, our mission is to deliver an exceptional shopping experience
                        spanning Fashion, Beauty, and Groceries. Every item in our catalog is meticulously sourced and curated
                        to ensure you get exactly what you desire, without compromise. With an unbreakable commitment to
                        customer satisfaction and a seamless digital experience powered by our high-performance eCommerce platform,
                        we strive to be your absolute first choice for daily essentials.
                    </p>
                </div>

                {/* ── Team Section (Mockup) ── */}
                <div className="mt-24">
                    <div className="mb-12 text-center">
                        <h2 className="text-2xl font-bold uppercase tracking-widest text-zinc-900">THE TEAM</h2>
                        <div className="mx-auto mt-4 h-[2px] w-[50px] bg-[#8B2030]" />
                    </div>
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                        <div className="text-center">
                            <div className="mx-auto aspect-square w-full max-w-xs bg-[#F4F4F4]"></div>
                            <h3 className="mt-6 text-lg font-bold uppercase text-zinc-900">John Doe</h3>
                            <p className="text-xs uppercase tracking-widest text-[#8B2030]">CEO & Founder</p>
                        </div>
                        <div className="text-center">
                            <div className="mx-auto aspect-square w-full max-w-xs bg-[#F4F4F4]"></div>
                            <h3 className="mt-6 text-lg font-bold uppercase text-zinc-900">Jane Smith</h3>
                            <p className="text-xs uppercase tracking-widest text-[#8B2030]">Operations Manager</p>
                        </div>
                        <div className="text-center">
                            <div className="mx-auto aspect-square w-full max-w-xs bg-[#F4F4F4]"></div>
                            <h3 className="mt-6 text-lg font-bold uppercase text-zinc-900">Bob Smith</h3>
                            <p className="text-xs uppercase tracking-widest text-[#8B2030]">Lead Logistics</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
