export function Footer() {
    return (
        <footer className="mt-12 bg-[#8B2030] text-white">
            {/* ── Footer Top Grid ── */}
            <div className="container mx-auto grid max-w-[1240px] gap-8 px-4 py-16 text-center sm:text-left lg:grid-cols-4">
                {/* Column 1: Logo & About */}
                <div className="flex flex-col items-center sm:items-start">
                    <a href="/" className="mb-6 flex items-center gap-3">
                        <img src="/logo.png" alt="Madonna" className="h-12 w-auto flex-shrink-0 rounded-xl object-contain" />
                        <span className="text-xl font-black uppercase tracking-tight text-white">Madonna</span>
                    </a>
                    <p className="text-sm leading-relaxed text-zinc-300">
                        Your premium destination for exclusive retail. Curated collections for the modern lifestyle.
                    </p>
                </div>

                {/* Column 4: Social & Payment */}
                <div className="flex flex-col items-center sm:items-start">
                    <h4 className="mb-6 text-[13px] font-bold uppercase tracking-widest text-zinc-100">
                        SOCIAL MEDIA
                    </h4>
                    <div className="flex justify-center gap-2 text-zinc-200 sm:justify-start">
                        <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-[#8B2030] hover:text-white">f</a>
                        <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-[#8B2030] hover:text-white">𝕏</a>
                        <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-[#8B2030] hover:text-white">in</a>
                    </div>

                    <h4 className="mb-4 mt-8 text-[13px] font-bold uppercase tracking-widest text-zinc-100">
                        PAYMENT METHODS
                    </h4>
                    <div className="flex flex-wrap items-center justify-center gap-1.5 opacity-70 grayscale sm:justify-start">
                        {/* Simple rectangular text badges to mimic payment icons visually */}
                        <span className="rounded-[4px] bg-zinc-800 px-3 py-1 text-[11px] font-extrabold italic tracking-tighter text-white">VISA</span>
                        <span className="rounded-[4px] bg-zinc-800 px-3 py-1 text-[11px] font-black italic tracking-tighter text-white">PayPal</span>
                        <span className="rounded-[4px] bg-zinc-800 px-3 py-1 text-[11px] font-bold text-white">stripe</span>
                        <span className="rounded-[4px] bg-zinc-800 px-3 py-1 text-[11px] font-semibold italic text-white">VeriSign</span>
                    </div>
                </div>
            </div>

            {/* ── Footer Bottom Row ── */}
            <div className="border-t border-white/20">
                <div className="container mx-auto flex max-w-[1240px] items-center justify-center px-4 py-8">
                    <p className="text-[13px] text-zinc-300">
                        Madonna Shopping Arena. © 2026. All Rights Reserved
                    </p>
                </div>
            </div>
        </footer>
    );
}
