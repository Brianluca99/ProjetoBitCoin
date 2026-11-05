import { createFileRoute } from "@tanstack/react-router";
import { CheckoutPage } from "@/pages/checkout-page";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Kurio" },
      { name: "description", content: "Escolha a rede e a carteira para finalizar a compra dos seus NFTs." },
      { property: "og:title", content: "Checkout — Kurio" },
      { property: "og:description", content: "Finalize a compra dos seus NFTs." },
    ],
  }),
  component: CheckoutPage,
});
