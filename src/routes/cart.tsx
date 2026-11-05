import { createFileRoute } from "@tanstack/react-router";
import { CartPage } from "@/pages/cart-page";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Carrinho — Kurio" },
      { name: "description", content: "Revise os NFTs no seu carrinho, aplique cupons e siga para o checkout." },
      { property: "og:title", content: "Carrinho — Kurio" },
      { property: "og:description", content: "Seu carrinho de NFTs." },
    ],
  }),
  component: CartPage,
});
