import { Link } from "react-router-dom";

interface SectionTitleProps {
    title: string;
    subtitle?: string;
    viewAllHref?: string;
    align?: "left" | "center";
}

export function SectionTitle({ title, subtitle, viewAllHref, align = "center" }: SectionTitleProps) {
    return (
        <div className={`mb-8 flex flex-col ${align === "center" ? "items-center text-center" : "items-start text-left"}`}>
            {subtitle && (
                <span className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                    {subtitle}
                </span>
            )}
            <div className="flex w-full items-center justify-between">
                <h2 className="text-xl font-bold uppercase tracking-widest text-zinc-900 md:text-2xl lg:text-3xl">
                    {title}
                </h2>
                {viewAllHref && align === "left" && (
                    <Link
                        to={viewAllHref}
                        className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 transition-colors hover:text-[#8B2030]"
                    >
                        View All →
                    </Link>
                )}
            </div>

            {/* Brand signature short underline underneath the heading */}
            <div className="mt-4 h-[2px] w-[50px] bg-[#8B2030]" />

            {viewAllHref && align === "center" && (
                <Link
                    to={viewAllHref}
                    className="mt-4 text-[11px] font-bold uppercase tracking-widest text-[#8B2030] hover:underline"
                >
                    View All Products
                </Link>
            )}
        </div>
    );
}
