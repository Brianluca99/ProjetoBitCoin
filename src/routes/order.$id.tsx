import { createFileRoute } from "@tanstack/react-router";
import { ConfirmationPage } from "@/pages/confirmation-page";

export const Route = createFileRoute("/order/$id")({
  head: () => ({
    meta: [
      { title: "Pedido confirmado — Kurio" },
      { name: "description", content: "Acompanhe a confirmação on-chain do seu pedido de NFTs." },
      { property: "og:title", content: "Pedido confirmado — Kurio" },
      { property: "og:description", content: "Status da sua compra de NFTs." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <ConfirmationPage id={Route.useParams().id} />,
});
