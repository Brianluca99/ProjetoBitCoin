import { Heart } from "lucide-react";
import { toast } from "sonner";
import { actions } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useFavorites, useScope, useToggleFavorite } from "@/services/client-api";

export function FavoriteButton({ id, name, className }: { id: string; name: string; className?: string }) {
  const { authed } = useScope();
  const favs = useFavorites();
  const toggle = useToggleFavorite();
  const fav = !!favs.data?.includes(id);
  const onClick = () => {
    if (!authed) return actions.openAuth("login");
    toggle.mutate({ id, fav }, { onError: () => toast.error("Não foi possível salvar o favorito. Alteração desfeita.") });
  };
  return (
    <button type="button" onClick={onClick} aria-pressed={fav} aria-label={fav ? `Remover ${name} dos favoritos` : `Favoritar ${name}`}
      className={cn("grid place-items-center text-foreground", className)}>
      <Heart className={cn("size-4", fav && "fill-primary text-primary")} />
    </button>
  );
}
