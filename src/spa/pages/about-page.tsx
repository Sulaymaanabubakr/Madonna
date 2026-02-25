import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export function AboutPage() {
  return (
    <div className="bg-white">
      <div className="border-b border-zinc-100 bg-[#F4F4F4]">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center gap-2">
            <h1 className="text-4xl font-black uppercase tracking-widest text-zinc-900">ABOUT US</h1>
            <div className="flex items-center text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              <Link to="/" className="hover:text-[#8B2030]">HOME</Link>
              <ChevronRight className="mx-2 h-3 w-3" />
              <span className="text-zinc-900">ABOUT US</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">OUR MISSION</div>
          <h2 className="mb-8 font-serif text-3xl font-bold uppercase tracking-wide text-zinc-900 md:text-4xl">
            Providing Premium Quality at Accessible Prices
          </h2>
          <div className="mx-auto mb-8 mt-4 h-[2px] w-[50px] bg-[#8B2030]" />
          <p className="text-sm leading-relaxed text-zinc-600 md:text-base md:leading-loose">
            At Madonna Shopping Arena, we believe that premium quality products should not be out of reach. Located in
            the heart of Oshodi, Lagos, our mission is to deliver an exceptional shopping experience spanning Fashion,
            Beauty, and Groceries. Every item in our catalog is meticulously sourced and curated to ensure you get
            exactly what you desire, without compromise.
          </p>
        </div>
      </div>
    </div>
  );
}
