import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { SlidersHorizontal } from "lucide-react";
import heroImg from "@/assets/nft-1.jpg";
import { NftCard, NftCardSkeleton } from "@/components/nft/nft-card";
import { CatalogFiltersPanel } from "@/components/catalog/catalog-filters";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatEth } from "@/lib/decimal";
import { featuredQuery, nftsQuery } from "@/services/client-api";
import type { CatalogFilters, SortKey } from "@/services/contracts";
import { cn } from "@/lib/utils";

export function CatalogPage({ search }: { search: CatalogFilters }) {
  const navigate = useNavigate();
  const { data, isLoading, isFetching } = useQuery({ ...nftsQuery(search), placeholderData: keepPreviousData });
  const featured = useQuery(featuredQuery());
  const set = (patch: Partial<CatalogFilters>) =>
    navigate({ to: "/", search: (prev: CatalogFilters) => ({ ...prev, page: undefined, ...patch }), resetScroll: false });

  const activeCount =
    (search.collections?.length ?? 0) + (search.rarities?.length ?? 0) + (search.minPrice != null || search.maxPrice != null ? 1 : 0);

  return (
    <>
      <section className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 md:grid-cols-2 md:py-16">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Marketplace · Edição limitada</p>
          <h1 className="mt-3 text-3xl font-bold uppercase leading-tight sm:text-4xl lg:text-5xl">
            Seja dono do futuro da arte digital
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            Colecione NFTs autênticos de criadores independentes. Cada edição é verificada on-chain e entregue direto na sua carteira.
          </p>
          <Button asChild className="mt-6 uppercase">
            <a href="#catalogo">Explorar</a>
          </Button>
        </div>
        <img src={heroImg} alt="Emerald Ape, NFT em destaque" width={816} height={816} className="mx-auto aspect-square w-full max-w-md rounded bg-sand object-cover shadow-glow" />
      </section>

      <div id="catalogo" className="mx-auto max-w-7xl scroll-mt-20 px-4 sm:px-6">
        <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
          <h2 className="truncate text-sm font-bold uppercase">
            <span className="text-primary">Todos os NFTs</span>
            <span className="ml-2 font-sans text-xs font-normal text-muted-foreground" aria-live="polite">
              {data ? `${data.total} resultados` : "carregando…"}
            </span>
          </h2>
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden">
                  <SlidersHorizontal /> Filtros{activeCount ? ` (${activeCount})` : ""}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 overflow-y-auto">
                <SheetTitle>Filtros</SheetTitle>
                <div className="mt-4"><CatalogFiltersPanel search={search} onChange={set} /></div>
              </SheetContent>
            </Sheet>
            <label htmlFor="sort" className="sr-only">Ordenar por</label>
            <Select value={search.sort ?? "recent"} onValueChange={(v) => set({ sort: v === "recent" ? undefined : (v as SortKey) })}>
              <SelectTrigger id="sort" className="h-9 w-[170px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Mais recentes</SelectItem>
                <SelectItem value="price-asc">Menor preço</SelectItem>
                <SelectItem value="price-desc">Maior preço</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside aria-label="Filtros" className="hidden h-fit rounded border border-border bg-card p-4 lg:block">
            <CatalogFiltersPanel search={search} onChange={set} />
          </aside>

          <section aria-label="Lista de NFTs" aria-busy={isFetching}>
            {isLoading ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6">
                {Array.from({ length: 9 }, (_, i) => <NftCardSkeleton key={i} />)}
              </div>
            ) : data && data.items.length ? (
              <ul className={cn("grid grid-cols-2 gap-4 transition-opacity sm:grid-cols-3 sm:gap-6", isFetching && "opacity-60")}>
                {data.items.map((n) => <li key={n.id}><NftCard nft={n} /></li>)}
              </ul>
            ) : (
              <div className="rounded border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                Nenhum NFT encontrado com esses filtros.
                <div><Button variant="link" onClick={() => navigate({ to: "/", search: {} })}>Limpar filtros</Button></div>
              </div>
            )}

            {data && data.totalPages > 1 && (
              <nav aria-label="Paginação" className="mt-10 flex justify-center gap-2">
                {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
                  <Link
                    key={p}
                    to="/"
                    search={(prev: CatalogFilters) => ({ ...prev, page: p === 1 ? undefined : p })}
                    hash="catalogo"
                    aria-label={`Página ${p}`}
                    aria-current={p === data.page ? "page" : undefined}
                    className={cn(
                      "grid size-9 place-items-center rounded border text-xs",
                      p === data.page ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary",
                    )}
                  >
                    {p}
                  </Link>
                ))}
              </nav>
            )}
          </section>
        </div>

        <section aria-labelledby="featured-title" className="mt-20">
          <p className="text-xs uppercase tracking-widest text-primary">NFT em destaque</p>
          <h2 id="featured-title" className="text-xl font-bold uppercase">Oferta limitada</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {featured.isLoading || !featured.data
              ? Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-40 w-full" />)
              : featured.data.map((n) => (
                  <Link key={n.id} to="/nft/$id" params={{ id: n.id }} className="flex gap-4 rounded border border-border bg-card p-3 transition-colors hover:border-primary">
                    <img src={n.image} alt="" loading="lazy" width={816} height={816} className="size-28 shrink-0 rounded bg-sand object-cover" />
                    <div className="min-w-0">
                      <h3 className="truncate font-sans text-sm font-bold">{n.name}</h3>
                      <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{n.description}</p>
                      <p className="mt-2 text-xs text-primary">{formatEth(n.price, 2)}</p>
                    </div>
                  </Link>
                ))}
          </div>
        </section>
      </div>
    </>
  );
}
