import { _ as createFileRoute, g as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/nft._id-buMGSawd.js
var $$splitComponentImporter = () => import("./nft._id-B-R0Zcw4.mjs");
var Route = createFileRoute("/nft/$id")({
	head: () => ({ meta: [
		{ title: "Detalhes do NFT — Kurio" },
		{
			name: "description",
			content: "Veja raridade, edição, avaliações e compre este NFT na Kurio."
		},
		{
			property: "og:title",
			content: "Detalhes do NFT — Kurio"
		},
		{
			property: "og:description",
			content: "Raridade, edição e preço deste NFT."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
