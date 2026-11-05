import { createFileRoute } from "@tanstack/react-router";
import { WalletsPage } from "@/pages/wallets-page";

export const Route = createFileRoute("/account/wallets")({
  head: () => ({
    meta: [
      { title: "Minhas carteiras — Kurio" },
      { name: "description", content: "Adicione, edite e remova as carteiras usadas nas suas compras." },
      { property: "og:title", content: "Minhas carteiras — Kurio" },
      { property: "og:description", content: "Gerencie suas carteiras." },
    ],
  }),
  component: WalletsPage,
});
