export async function fetcher<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, cache: "no-store" });
  if (!res.ok) throw new Error((await res.json()).error || "Request failed");
  return res.json();
}
