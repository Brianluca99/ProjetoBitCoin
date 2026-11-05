import { createFileRoute } from "@tanstack/react-router";
import { CatalogPage } from "@/pages/catalog-page";
import type { CatalogFilters, Rarity, SortKey } from "@/services/contracts";

const arr = (v: unknown) => (Array.isArray(v) ? v.map(String) : typeof v === "string" ? [v] : undefined);
const num = (v: unknown) => (v === undefined || v === "" || isNaN(Number(v)) ? undefined : Number(v));

export const Route = createFileRoute("/")({
  validateSearch: (s: { q?: unknown; collections?: unknown; rarities?: unknown; minPrice?: unknown; maxPrice?: unknown; sort?: unknown; page?: unknown }): CatalogFilters => ({
    q: typeof s.q === "string" && s.q ? s.q : undefined,
    collections: arr(s.collections),
    rarities: arr(s.rarities) as Rarity[] | undefined,
    minPrice: num(s.minPrice),
    maxPrice: num(s.maxPrice),
    sort: ["recent", "price-asc", "price-desc"].includes(String(s.sort)) ? (s.sort as SortKey) : undefined,
    page: num(s.page),
  }),
  head: () => ({
    meta: [
      { title: "Kurio — Catálogo de NFTs de edição limitada" },
      { name: "description", content: "Explore, filtre e compre NFTs de edição limitada de criadores independentes." },
      { property: "og:title", content: "Kurio — Catálogo de NFTs" },
      { property: "og:description", content: "Explore e compre NFTs de edição limitada." },
    ],
  }),
  component: Index,
});

function Index() {
  return <CatalogPage search={Route.useSearch()} />;
}
