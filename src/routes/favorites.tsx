import { createFileRoute } from "@tanstack/react-router";
import { FavoritesPage } from "@/pages/favorites-page";

export const Route = createFileRoute("/favorites")({
  head: () => ({
    meta: [
      { title: "Favoritos — Kurio" },
      { name: "description", content: "Os NFTs que você salvou como favoritos na Kurio." },
      { property: "og:title", content: "Favoritos — Kurio" },
      { property: "og:description", content: "Seus NFTs favoritos." },
    ],
  }),
  component: FavoritesPage,
});
