import { useQueries } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { RequireAuth } from "@/components/auth/require-auth";
import { NftCard, NftCardSkeleton } from "@/components/nft/nft-card";
import { Button } from "@/components/ui/button";
import { nftQuery, useFavorites } from "@/services/client-api";

export function FavoritesPage() {
  return (
    <RequireAuth message="Entre para ver seus favoritos.">
      <FavoritesList />
    </RequireAuth>
  );
}

function FavoritesList() {
  const favs = useFavorites();
  const nfts = useQueries({ queries: (favs.data ?? []).map((id) => nftQuery(id)) });
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold uppercase">Favoritos</h1>
      {favs.isLoading ? (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">{Array.from({ length: 5 }, (_, i) => <li key={i}><NftCardSkeleton /></li>)}</ul>
      ) : !favs.data?.length ? (
        <div className="rounded border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">Você ainda não favoritou nenhum NFT.</p>
          <Button asChild className="mt-4 uppercase"><Link to="/">Explorar NFTs</Link></Button>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {nfts.map((q, i) => <li key={favs.data[i]}>{q.data ? <NftCard nft={q.data} /> : <NftCardSkeleton />}</li>)}
        </ul>
      )}
    </div>
  );
}
