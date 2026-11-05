import { r as formatEth } from "./decimal-BK8KOg9S.mjs";
import { y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { p as require_jsx_runtime } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
import { A as useToggleFavorite, D as useScope, a as cn, r as actions, x as useFavorites } from "./client-api-DIF2XgCD.mjs";
import { v as Heart } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Skeleton } from "./skeleton-B_MYF5Br.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/nft-card-njyjRabG.js
var import_jsx_runtime = require_jsx_runtime();
function FavoriteButton({ id, name, className }) {
	const { authed } = useScope();
	const favs = useFavorites();
	const toggle = useToggleFavorite();
	const fav = !!favs.data?.includes(id);
	const onClick = () => {
		if (!authed) return actions.openAuth("login");
		toggle.mutate({
			id,
			fav
		}, { onError: () => toast.error("Não foi possível salvar o favorito. Alteração desfeita.") });
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick,
		"aria-pressed": fav,
		"aria-label": fav ? `Remover ${name} dos favoritos` : `Favoritar ${name}`,
		className: cn("grid place-items-center text-foreground", className),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, { className: cn("size-4", fav && "fill-primary text-primary") })
	});
}
function NftCard({ nft }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "group relative",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
			to: "/nft/$id",
			params: { id: nft.id },
			className: "block rounded focus-visible:outline-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "aspect-square overflow-hidden rounded bg-sand",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: nft.image,
						alt: nft.name,
						loading: "lazy",
						width: 816,
						height: 816,
						className: "size-full object-cover transition-transform duration-300 group-hover:scale-105"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "mt-2 truncate font-sans text-xs font-medium",
					children: nft.name
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-primary",
					children: formatEth(nft.price, 4)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] text-muted-foreground",
					children: nft.available ? `${nft.rarity} · ${nft.collection}` : "Esgotado"
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FavoriteButton, {
			id: nft.id,
			name: nft.name,
			className: "absolute right-2 top-2 size-8 rounded-full bg-background/80"
		})]
	});
}
function NftCardSkeleton() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "aspect-square w-full rounded" }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "mt-2 h-3 w-3/4" }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "mt-1.5 h-3 w-1/3" })
	] });
}
//#endregion
export { NftCardSkeleton as n, NftCard as t };
