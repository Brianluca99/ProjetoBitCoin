import { _ as createFileRoute, g as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/order._id-BIjd8gse.js
var $$splitComponentImporter = () => import("./order._id-B3bYmQUj.mjs");
var Route = createFileRoute("/order/$id")({
	head: () => ({ meta: [
		{ title: "Pedido confirmado — Kurio" },
		{
			name: "description",
			content: "Acompanhe a confirmação on-chain do seu pedido de NFTs."
		},
		{
			property: "og:title",
			content: "Pedido confirmado — Kurio"
		},
		{
			property: "og:description",
			content: "Status da sua compra de NFTs."
		},
		{
			name: "robots",
			content: "noindex"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
