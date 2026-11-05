import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "@/pages/profile-page";

export const Route = createFileRoute("/account/profile")({
  head: () => ({
    meta: [
      { title: "Meu perfil — Kurio" },
      { name: "description", content: "Edite seus dados de colecionador e veja seu histórico de pedidos." },
      { property: "og:title", content: "Meu perfil — Kurio" },
      { property: "og:description", content: "Perfil do colecionador." },
    ],
  }),
  component: ProfilePage,
});
