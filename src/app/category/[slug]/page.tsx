import { redirect } from "next/navigation";

export default function CategoryPage({ params }: { params: { slug: string } }) {
  redirect(`/shop?category=${encodeURIComponent(params.slug)}`);
}
