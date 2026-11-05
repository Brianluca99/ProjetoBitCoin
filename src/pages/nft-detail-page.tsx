import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Heart, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { NftCard, NftCardSkeleton } from "@/components/nft/nft-card";
import { QuantityStepper } from "@/components/common/quantity-stepper";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatEth } from "@/lib/decimal";
import { actions } from "@/lib/store";
import { cn } from "@/lib/utils";
import { ApiError } from "@/services/http";
import {
  nftQuery,
  relatedQuery,
  useAddToCart,
  useFavorites,
  useScope,
  useToggleFavorite,
} from "@/services/client-api";

export function NftDetailPage({ id }: { id: string }) {
  const nftQueryResult = useQuery(nftQuery(id));
  const related = useQuery(relatedQuery(id));
  const { authed } = useScope();
  const favorites = useFavorites();
  const toggleFavorite = useToggleFavorite();
  const addToCart = useAddToCart();
  const nft = nftQueryResult.data;
  const fav = !!favorites.data?.includes(id);
  const [img, setImg] = useState(0);
  const [qty, setQty] = useState(1);

  if (nftQueryResult.isLoading) {
    return (
      <div
        className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-2"
        aria-busy="true"
      >
        <Skeleton className="aspect-square w-full" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-40" />
        </div>
      </div>
    );
  }
  if (nftQueryResult.isError && !nft) {
    const notFound =
      nftQueryResult.error instanceof ApiError && nftQueryResult.error.status === 404;
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-xl font-bold">
          {notFound ? "NFT não encontrado" : "Não foi possível carregar o NFT"}
        </h1>
        {!notFound && (
          <Button variant="link" className="mt-3" onClick={() => void nftQueryResult.refetch()}>
            Tentar novamente
          </Button>
        )}
        <Button asChild className="mt-6">
          <Link to="/">Voltar ao catálogo</Link>
        </Button>
      </div>
    );
  }
  if (!nft) return null;

  const add = () => {
    if (!authed) {
      actions.openAuth("login");
      return;
    }
    addToCart.mutate(
      { nftId: nft.id, quantity: qty },
      {
        onSuccess: () => toast.success(`${nft.name} adicionado ao carrinho`),
        onError: (error) =>
          toast.error(
            error instanceof ApiError ? error.message : "Não foi possível adicionar ao carrinho.",
          ),
      },
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <nav aria-label="Trilha" className="mb-6 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">
          Início
        </Link>{" "}
        / <span>{nft.collection}</span> /{" "}
        <span aria-current="page" className="text-foreground">
          {nft.name}
        </span>
      </nav>
      <div className="grid gap-8 md:grid-cols-2 lg:gap-14">
        <div>
          <div className="aspect-square overflow-hidden rounded bg-sand">
            <img
              src={nft.gallery[img] ?? nft.image}
              alt={nft.name}
              width={816}
              height={816}
              className="size-full object-cover"
            />
          </div>
          <div role="group" aria-label="Galeria" className="mt-3 grid grid-cols-4 gap-3">
            {nft.gallery.map((galleryImage, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setImg(index)}
                aria-label={`Ver imagem ${index + 1}`}
                aria-pressed={img === index}
                className={cn(
                  "aspect-square overflow-hidden rounded border-2 bg-sand",
                  img === index ? "border-primary" : "border-transparent",
                )}
              >
                <img src={galleryImage} alt="" loading="lazy" className="size-full object-cover" />
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-primary">{nft.collection}</p>
          <h1 className="mt-2 text-2xl font-bold uppercase sm:text-3xl">{nft.name}</h1>
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex" aria-label={`Avaliação ${nft.rating} de 5`}>
              {Array.from({ length: 5 }, (_, index) => (
                <Star
                  key={index}
                  aria-hidden
                  className={cn(
                    "size-3.5",
                    index < Math.round(nft.rating) ? "fill-primary text-primary" : "text-border",
                  )}
                />
              ))}
            </span>
            {nft.rating.toFixed(1)} · {nft.reviews} avaliações
          </div>
          <p className="mt-6 text-2xl font-bold text-primary">{formatEth(nft.price, 2)}</p>
          <dl className="mt-6 grid grid-cols-3 gap-3 text-xs">
            {[
              ["Raridade", nft.rarity],
              ["Edição", `${nft.edition.current}/${nft.edition.total}`],
              ["Disponíveis", String(nft.available)],
            ].map(([label, value]) => (
              <div key={label} className="rounded border border-border bg-card p-3">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="mt-1 font-bold">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">{nft.description}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Criador: <span className="text-foreground">{nft.creator}</span>
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <QuantityStepper label="Quantidade" value={qty} max={nft.available} onChange={setQty} />
            <Button
              onClick={add}
              disabled={!nft.available || addToCart.isPending}
              className="uppercase"
            >
              {addToCart.isPending && <span className="animate-spin">◌</span>} Adicionar ao carrinho
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-pressed={fav}
              aria-label={fav ? "Remover dos favoritos" : "Favoritar"}
              onClick={() => {
                if (!authed) return actions.openAuth("login");
                toggleFavorite.mutate(
                  { id: nft.id, fav },
                  { onError: () => toast.error("Não foi possível salvar o favorito.") },
                );
              }}
            >
              <Heart className={cn(fav && "fill-primary text-primary")} />
            </Button>
          </div>
        </div>
      </div>
      <section aria-labelledby="rel" className="mt-16">
        <h2 id="rel" className="mb-6 text-sm font-bold uppercase">
          Você também pode gostar
        </h2>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {related.isLoading || !related.data
            ? Array.from({ length: 5 }, (_, index) => (
                <li key={index}>
                  <NftCardSkeleton />
                </li>
              ))
            : related.data.map((item) => (
                <li key={item.id}>
                  <NftCard nft={item} />
                </li>
              ))}
        </ul>
      </section>
    </div>
  );
}
