import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatEth } from "@/lib/decimal";
import { cn } from "@/lib/utils";
import type { Nft } from "@/services/contracts";
import { FavoriteButton } from "./favorite-button";

export function NftCard({ nft }: { nft: Nft }) {
  return (
    <article className="group relative">
      <Link to="/nft/$id" params={{ id: nft.id }} className="block rounded focus-visible:outline-2">
        <div className="aspect-square overflow-hidden rounded bg-sand">
          <img src={nft.image} alt={nft.name} loading="lazy" width={816} height={816} className="size-full object-cover transition-transform duration-300 group-hover:scale-105" />
        </div>
        <h3 className="mt-2 truncate font-sans text-xs font-medium">{nft.name}</h3>
        <p className="text-xs text-primary">{formatEth(nft.price, 4)}</p>
        <p className="text-[11px] text-muted-foreground">{nft.available ? `${nft.rarity} · ${nft.collection}` : "Esgotado"}</p>
      </Link>
      <FavoriteButton id={nft.id} name={nft.name} className="absolute right-2 top-2 size-8 rounded-full bg-background/80" />
    </article>
  );
}

export function HeartIcon({ on }: { on: boolean }) {
  return <Heart className={cn("size-4", on && "fill-primary text-primary")} />;
}

export function NftCardSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-square w-full rounded" />
      <Skeleton className="mt-2 h-3 w-3/4" />
      <Skeleton className="mt-1.5 h-3 w-1/3" />
    </div>
  );
}
