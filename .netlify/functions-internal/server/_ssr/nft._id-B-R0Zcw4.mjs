import { o as __toESM } from "../_runtime.mjs";
import { r as formatEth } from "./decimal-BK8KOg9S.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { p as require_jsx_runtime } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
import { r as useQuery } from "../_libs/tanstack__react-query.mjs";
import { A as useToggleFavorite, D as useScope, a as cn, h as useAddToCart, n as Button, p as relatedQuery, r as actions, t as ApiError, u as nftQuery, x as useFavorites } from "./client-api-DIF2XgCD.mjs";
import { s as Star, v as Heart } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Skeleton } from "./skeleton-B_MYF5Br.mjs";
import { t as QuantityStepper } from "./quantity-stepper-AgtFly30.mjs";
import { n as NftCardSkeleton, t as NftCard } from "./nft-card-njyjRabG.mjs";
import { t as Route } from "./nft._id-buMGSawd.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/nft._id-B-R0Zcw4.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function NftDetailPage({ id }) {
	const nftQueryResult = useQuery(nftQuery(id));
	const related = useQuery(relatedQuery(id));
	const { authed } = useScope();
	const favorites = useFavorites();
	const toggleFavorite = useToggleFavorite();
	const addToCart = useAddToCart();
	const nft = nftQueryResult.data;
	const fav = !!favorites.data?.includes(id);
	const [img, setImg] = (0, import_react.useState)(0);
	const [qty, setQty] = (0, import_react.useState)(1);
	if (nftQueryResult.isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-2",
		"aria-busy": "true",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "aspect-square w-full" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-4 w-1/3" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-8 w-3/4" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-6 w-1/4" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-24 w-full" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-10 w-40" })
			]
		})]
	});
	if (nftQueryResult.isError && !nft) {
		const notFound = nftQueryResult.error instanceof ApiError && nftQueryResult.error.status === 404;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-md px-4 py-20 text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-bold",
					children: notFound ? "NFT não encontrado" : "Não foi possível carregar o NFT"
				}),
				!notFound && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "link",
					className: "mt-3",
					onClick: () => void nftQueryResult.refetch(),
					children: "Tentar novamente"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						children: "Voltar ao catálogo"
					})
				})
			]
		});
	}
	if (!nft) return null;
	const add = () => {
		if (!authed) {
			actions.openAuth("login");
			return;
		}
		addToCart.mutate({
			nftId: nft.id,
			quantity: qty
		}, {
			onSuccess: () => toast.success(`${nft.name} adicionado ao carrinho`),
			onError: (error) => toast.error(error instanceof ApiError ? error.message : "Não foi possível adicionar ao carrinho.")
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-7xl px-4 py-8 sm:px-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
				"aria-label": "Trilha",
				className: "mb-6 text-xs text-muted-foreground",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "hover:text-foreground",
						children: "Início"
					}),
					" ",
					"/ ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: nft.collection }),
					" /",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						"aria-current": "page",
						className: "text-foreground",
						children: nft.name
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-8 md:grid-cols-2 lg:gap-14",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "aspect-square overflow-hidden rounded bg-sand",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: nft.gallery[img] ?? nft.image,
						alt: nft.name,
						width: 816,
						height: 816,
						className: "size-full object-cover"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					role: "group",
					"aria-label": "Galeria",
					className: "mt-3 grid grid-cols-4 gap-3",
					children: nft.gallery.map((galleryImage, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setImg(index),
						"aria-label": `Ver imagem ${index + 1}`,
						"aria-pressed": img === index,
						className: cn("aspect-square overflow-hidden rounded border-2 bg-sand", img === index ? "border-primary" : "border-transparent"),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: galleryImage,
							alt: "",
							loading: "lazy",
							className: "size-full object-cover"
						})
					}, index))
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs uppercase tracking-widest text-primary",
						children: nft.collection
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-2 text-2xl font-bold uppercase sm:text-3xl",
						children: nft.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex items-center gap-2 text-xs text-muted-foreground",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "flex",
								"aria-label": `Avaliação ${nft.rating} de 5`,
								children: Array.from({ length: 5 }, (_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, {
									"aria-hidden": true,
									className: cn("size-3.5", index < Math.round(nft.rating) ? "fill-primary text-primary" : "text-border")
								}, index))
							}),
							nft.rating.toFixed(1),
							" · ",
							nft.reviews,
							" avaliações"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-6 text-2xl font-bold text-primary",
						children: formatEth(nft.price, 2)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dl", {
						className: "mt-6 grid grid-cols-3 gap-3 text-xs",
						children: [
							["Raridade", nft.rarity],
							["Edição", `${nft.edition.current}/${nft.edition.total}`],
							["Disponíveis", String(nft.available)]
						].map(([label, value]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded border border-border bg-card p-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-muted-foreground",
								children: label
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
								className: "mt-1 font-bold",
								children: value
							})]
						}, label))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-6 text-sm leading-relaxed text-muted-foreground",
						children: nft.description
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-xs text-muted-foreground",
						children: ["Criador: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-foreground",
							children: nft.creator
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-8 flex flex-wrap items-center gap-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuantityStepper, {
								label: "Quantidade",
								value: qty,
								max: nft.available,
								onChange: setQty
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								onClick: add,
								disabled: !nft.available || addToCart.isPending,
								className: "uppercase",
								children: [addToCart.isPending && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "animate-spin",
									children: "◌"
								}), " Adicionar ao carrinho"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "outline",
								size: "icon",
								"aria-pressed": fav,
								"aria-label": fav ? "Remover dos favoritos" : "Favoritar",
								onClick: () => {
									if (!authed) return actions.openAuth("login");
									toggleFavorite.mutate({
										id: nft.id,
										fav
									}, { onError: () => toast.error("Não foi possível salvar o favorito.") });
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, { className: cn(fav && "fill-primary text-primary") })
							})
						]
					})
				] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				"aria-labelledby": "rel",
				className: "mt-16",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					id: "rel",
					className: "mb-6 text-sm font-bold uppercase",
					children: "Você também pode gostar"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5",
					children: related.isLoading || !related.data ? Array.from({ length: 5 }, (_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NftCardSkeleton, {}) }, index)) : related.data.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NftCard, { nft: item }) }, item.id))
				})]
			})
		]
	});
}
var SplitComponent = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NftDetailPage, { id: Route.useParams().id });
//#endregion
export { SplitComponent as component };
