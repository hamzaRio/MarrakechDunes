import axios from "axios";

const DEMO_KEY = "69f708868ddc45eaa1f9b9fad1ddeba5"; // Rezdy docs demo (GET only)

export type RezdySearchParams = { query: string; city?: string; limit?: number };

export async function searchRezdy({ query, city, limit = 20 }: RezdySearchParams) {
  const apiKey = process.env.REZDY_API_KEY || DEMO_KEY;
  const url = "https://api.rezdy.com/v1/products";

  const q = [query, city].filter(Boolean).join(" ").trim();
  try {
    const r = await axios.get(url, { params: { apiKey, search: q, page: 1, pageSize: limit }, timeout: 4000 });
    const list = Array.isArray(r.data?.products) ? r.data.products : [];

    return list.map((p: any) => {
      const title = p?.name ?? "";
      const loc = p?.location?.city || city || "Maroc";
      const price = Number(p?.fromPrice ?? 0); // Rezdy often in supplier currency; we'll MAD-convert upstream
      const durationText = (p?.duration || p?.durationMinutes && `${p.durationMinutes} minutes`) || "—";
      const url = p?.shortUrl || p?.url || undefined;

      return {
        title,
        city: loc,
        price,                // raw price; MAD conversion in aggregator
        currency: "USD",      // best-effort; replace if product contains currency
        durationText,
        rating: undefined,
        reviewsCount: undefined,
        provider: "Rezdy",
        providerUrl: url
      };
    });
  } catch {
    return [];
  }
}
