import { createFileRoute } from "@tanstack/react-router";
import { NftDetailPage } from "@/pages/nft-detail-page";

export const Route = createFileRoute("/nft/$id")({
  head: () => ({
    meta: [
      { title: "Detalhes do NFT — Kurio" },
      { name: "description", content: "Veja raridade, edição, avaliações e compre este NFT na Kurio." },
      { property: "og:title", content: "Detalhes do NFT — Kurio" },
      { property: "og:description", content: "Raridade, edição e preço deste NFT." },
    ],
  }),
  component: () => <NftDetailPage id={Route.useParams().id} />,
});
