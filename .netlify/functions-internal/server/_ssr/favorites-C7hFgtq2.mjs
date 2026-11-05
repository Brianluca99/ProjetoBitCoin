import { y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { p as require_jsx_runtime } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
import { i as useQueries } from "../_libs/tanstack__react-query.mjs";
import { O as useSession, n as Button, u as nftQuery, x as useFavorites } from "./client-api-DIF2XgCD.mjs";
import { n as AuthForm } from "./auth-dialog-D84sJwXI.mjs";
import { t as Skeleton } from "./skeleton-B_MYF5Br.mjs";
import { n as NftCardSkeleton, t as NftCard } from "./nft-card-njyjRabG.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/favorites-C7hFgtq2.js
var import_jsx_runtime = require_jsx_runtime();
function RequireAuth({ children, message }) {
	const { user, isLoading } = useSession();
	if (isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mx-auto max-w-5xl px-4 py-10",
		"aria-busy": "true",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-96 w-full" })
	});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-sm px-4 py-12",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mb-4 text-sm text-muted-foreground",
			children: message
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthForm, { mode: "login" })]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
function FavoritesPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RequireAuth, {
		message: "Entre para ver seus favoritos.",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FavoritesList, {})
	});
}
function FavoritesList() {
	const favs = useFavorites();
	const nfts = useQueries({ queries: (favs.data ?? []).map((id) => nftQuery(id)) });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-7xl px-4 py-8 sm:px-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "mb-6 text-2xl font-bold uppercase",
			children: "Favoritos"
		}), favs.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5",
			children: Array.from({ length: 5 }, (_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NftCardSkeleton, {}) }, i))
		}) : !favs.data?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "rounded border border-dashed border-border p-12 text-center",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground",
				children: "Você ainda não favoritou nenhum NFT."
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				asChild: true,
				className: "mt-4 uppercase",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/",
					children: "Explorar NFTs"
				})
			})]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5",
			children: nfts.map((q, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: q.data ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NftCard, { nft: q.data }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NftCardSkeleton, {}) }, favs.data[i]))
		})]
	});
}
var SplitComponent = FavoritesPage;
//#endregion
export { SplitComponent as component };
