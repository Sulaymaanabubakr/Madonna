export function Footer() {
    return (
        <footer className="mt-12 bg-white">
            {/* ── Footer Top Grid ── */}
            <div className="container mx-auto grid max-w-[1240px] gap-8 px-4 py-16 sm:grid-cols-2 lg:grid-cols-3">

                {/* Column 4: Social & Payment */}
                <div>
                    <h4 className="mb-6 text-[13px] font-bold uppercase tracking-widest text-zinc-900">
                        SOCIAL MEDIA
                    </h4>
                    <div className="flex gap-2 text-zinc-600">
                        <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 transition-colors hover:bg-[#8B2030] hover:text-white">f</a>
                        <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 transition-colors hover:bg-[#8B2030] hover:text-white">𝕏</a>
                        <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 transition-colors hover:bg-[#8B2030] hover:text-white">in</a>
                    </div>

                    <h4 className="mb-4 mt-8 text-[13px] font-bold uppercase tracking-widest text-zinc-900">
                        PAYMENT METHODS
                    </h4>
                    <div className="flex items-center gap-1.5 opacity-70 grayscale">
                        {/* Simple rectangular text badges to mimic payment icons visually */}
                        <span className="rounded-[4px] bg-zinc-800 px-3 py-1 text-[11px] font-extrabold italic tracking-tighter text-white">VISA</span>
                        <span className="rounded-[4px] bg-zinc-800 px-3 py-1 text-[11px] font-black italic tracking-tighter text-white">PayPal</span>
                        <span className="rounded-[4px] bg-zinc-800 px-3 py-1 text-[11px] font-bold text-white">stripe</span>
                        <span className="rounded-[4px] bg-zinc-800 px-3 py-1 text-[11px] font-semibold italic text-white">VeriSign</span>
                    </div>
                </div>
            </div>

            {/* ── Footer Bottom Row ── */}
            <div className="border-t border-zinc-100">
                <div className="container mx-auto flex max-w-[1240px] items-center justify-center px-4 py-8">
                    <p className="text-[13px] text-zinc-500">
                        Madonna Link Express Ventures. © 2026. All Rights Reserved
                    </p>
                </div>
            </div>
        </footer>
    );
}
