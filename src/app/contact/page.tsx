"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ChevronRight } from "lucide-react";
import { BUSINESS } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ContactPage() {
    const [form, setForm] = useState({
        name: "",
        email: "",
        subject: "",
        message: "",
    });
    const [submitting, setSubmitting] = useState(false);

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error || "Failed to send message");
            setForm({ name: "", email: "", subject: "", message: "" });
            toast.success("Message sent. We will get back to you soon.");
        } catch (err) {
            toast.error((err as Error).message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-white">
            {/* ── Breadcrumb ── */}
            <div className="border-b border-zinc-100 bg-[#F4F4F4]">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex flex-col items-center justify-center gap-2">
                        <h1 className="text-4xl font-black uppercase tracking-widest text-zinc-900">
                            CONTACT US
                        </h1>
                        <div className="flex items-center text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                            <Link href="/" className="hover:text-[#8B2030]">HOME</Link>
                            <ChevronRight className="mx-2 h-3 w-3" />
                            <span className="text-zinc-900">CONTACT US</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-16">
                {/* ── Contact Info Cards (Porto Style) ── */}
                <div className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <div className="border border-zinc-200 bg-white p-8 text-center transition-shadow hover:shadow-md">
                        <h3 className="text-[13px] font-bold uppercase tracking-widest text-zinc-900">Address</h3>
                        <div className="mx-auto mt-4 mb-4 h-[2px] w-[30px] bg-[#8B2030]" />
                        <p className="text-sm text-zinc-500">{BUSINESS.address}</p>
                    </div>
                    <div className="border border-zinc-200 bg-white p-8 text-center transition-shadow hover:shadow-md">
                        <h3 className="text-[13px] font-bold uppercase tracking-widest text-zinc-900">Phone Number</h3>
                        <div className="mx-auto mt-4 mb-4 h-[2px] w-[30px] bg-[#8B2030]" />
                        <p className="text-sm text-zinc-500">
                            <a href={`tel:${BUSINESS.phone}`} className="hover:text-[#8B2030]">{BUSINESS.phone}</a>
                        </p>
                    </div>
                    <div className="border border-zinc-200 bg-white p-8 text-center transition-shadow hover:shadow-md">
                        <h3 className="text-[13px] font-bold uppercase tracking-widest text-zinc-900">E-mail Address</h3>
                        <div className="mx-auto mt-4 mb-4 h-[2px] w-[30px] bg-[#8B2030]" />
                        <p className="text-sm text-zinc-500">
                            <a href={`mailto:${BUSINESS.email}`} className="hover:text-[#8B2030]">{BUSINESS.email}</a>
                        </p>
                    </div>
                    <div className="border border-zinc-200 bg-white p-8 text-center transition-shadow hover:shadow-md">
                        <h3 className="text-[13px] font-bold uppercase tracking-widest text-zinc-900">Working Days/Hours</h3>
                        <div className="mx-auto mt-4 mb-4 h-[2px] w-[30px] bg-[#8B2030]" />
                        <p className="text-sm text-zinc-500">Mon - Sat / 9:00AM - 8:00PM</p>
                    </div>
                </div>

                <div className="grid gap-16 lg:grid-cols-2">
                    {/* ── Contact Form ── */}
                    <div>
                        <h2 className="mb-2 font-serif text-2xl font-bold uppercase text-zinc-900">Send Us a Message</h2>
                        <div className="mb-6 h-[2px] w-[50px] bg-[#8B2030]" />
                        <form className="space-y-4" onSubmit={submit}>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Input
                                    placeholder="Your Name *"
                                    className="h-12 rounded-none border-zinc-200 bg-[#F4F4F4] text-xs focus-visible:ring-[#8B2030]"
                                    value={form.name}
                                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                                    required
                                />
                                <Input
                                    placeholder="Your Email *"
                                    type="email"
                                    className="h-12 rounded-none border-zinc-200 bg-[#F4F4F4] text-xs focus-visible:ring-[#8B2030]"
                                    value={form.email}
                                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                                    required
                                />
                            </div>
                            <Input
                                placeholder="Subject"
                                className="h-12 rounded-none border-zinc-200 bg-[#F4F4F4] text-xs focus-visible:ring-[#8B2030]"
                                value={form.subject}
                                onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
                            />
                            <Textarea
                                placeholder="Message *"
                                className="min-h-[150px] rounded-none border-zinc-200 bg-[#F4F4F4] text-xs focus-visible:ring-[#8B2030]"
                                value={form.message}
                                onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
                                required
                            />
                            <Button
                                className="h-12 rounded-none bg-[#222222] px-8 text-xs font-bold uppercase tracking-widest text-white hover:bg-[#8B2030]"
                                disabled={submitting}
                            >
                                {submitting ? "Sending..." : "Send Message"}
                            </Button>
                        </form>
                    </div>

                    {/* ── FAQs ── */}
                    <div>
                        <h2 className="mb-2 font-serif text-2xl font-bold uppercase text-zinc-900">Frequently Asked Questions</h2>
                        <div className="mb-6 h-[2px] w-[50px] bg-[#8B2030]" />
                        <div className="space-y-4">
                            {[
                                { q: "Why is my order delayed?", a: "Shipping delays can occur due to high volume or weather. Check your tracking link for the most current updates." },
                                { q: "How do I cancel an order?", a: "Orders can only be cancelled within 1 hour of placement before they are processed by our warehouse." },
                                { q: "How do I track an order?", a: "A tracking link is provided via email once the order ships. You can also view it in 'Orders History' on your account page." },
                                { q: "How do I get a refund?", a: "Please refer to our return policy. Contact support within 7 days of receiving the item to initiate a return process." }
                            ].map((faq, i) => (
                                <div key={i} className="border border-zinc-200">
                                    <div className="bg-[#F4F4F4] px-4 py-3 text-sm font-bold text-zinc-900">
                                        {faq.q}
                                    </div>
                                    <div className="px-4 py-4 text-[13px] leading-relaxed text-zinc-600">
                                        {faq.a}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
