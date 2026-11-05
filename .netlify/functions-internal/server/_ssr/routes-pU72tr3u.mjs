import { o as __toESM } from "../_runtime.mjs";
import { r as formatEth } from "./decimal-BK8KOg9S.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { b as useNavigate, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as CheckboxIndicator, p as require_jsx_runtime, t as Checkbox$1 } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
import { r as useQuery } from "../_libs/tanstack__react-query.mjs";
import { o as keepPreviousData } from "../_libs/tanstack__query-core.mjs";
import { a as cn, d as nftsQuery, n as Button, s as featuredQuery } from "./client-api-DIF2XgCD.mjs";
import { D as Check, l as SlidersHorizontal } from "../_libs/lucide-react.mjs";
import { t as Skeleton } from "./skeleton-B_MYF5Br.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-MlIvpcjb.mjs";
import { c as nft_1_default, o as RARITIES, t as COLLECTIONS } from "./fixtures-CAOBEri7.mjs";
import { n as NftCardSkeleton, t as NftCard } from "./nft-card-njyjRabG.mjs";
import { a as SheetTrigger, i as SheetTitle, n as Sheet, r as SheetContent, t as Route } from "./routes-DUdLeXSG.mjs";
import { i as SliderTrack, n as SliderRange, r as SliderThumb, t as Slider$1 } from "../_libs/radix-ui__react-slider.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-pU72tr3u.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Checkbox = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Checkbox$1, {
	ref,
	className: cn("grid place-content-center peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground", className),
	...props,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckboxIndicator, {
		className: cn("grid place-content-center text-current"),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" })
	})
}));
Checkbox.displayName = Checkbox$1.displayName;
var Slider = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Slider$1, {
	ref,
	className: cn("relative flex w-full touch-none select-none items-center", className),
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderTrack, {
		className: "relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderRange, { className: "absolute h-full bg-primary" })
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SliderThumb, { className: "block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" })]
}));
Slider.displayName = Slider$1.displayName;
var MAX = 3;
function CatalogFiltersPanel({ search, onChange }) {
	const [range, setRange] = (0, import_react.useState)([search.minPrice ?? 0, search.maxPrice ?? MAX]);
	(0, import_react.useEffect)(() => setRange([search.minPrice ?? 0, search.maxPrice ?? MAX]), [search.minPrice, search.maxPrice]);
	const toggle = (list, v) => {
		const next = list?.includes(v) ? list.filter((x) => x !== v) : [...list ?? [], v];
		return next.length ? next : void 0;
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6 text-xs",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
				className: "mb-3 font-bold uppercase tracking-wider",
				children: "Coleções"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-2.5",
				children: COLLECTIONS.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Checkbox, {
						id: `col-${c}`,
						checked: search.collections?.includes(c) ?? false,
						onCheckedChange: () => onChange({ collections: toggle(search.collections, c) })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						htmlFor: `col-${c}`,
						className: "cursor-pointer text-muted-foreground",
						children: c
					})]
				}, c))
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
					className: "mb-3 font-bold uppercase tracking-wider",
					children: "Faixa de preço"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slider, {
					min: 0,
					max: MAX,
					step: .05,
					value: range,
					onValueChange: (v) => setRange([v[0] ?? 0, v[1] ?? MAX]),
					"aria-label": "Faixa de preço em ETH"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 text-muted-foreground",
					"aria-live": "polite",
					children: [
						range[0].toFixed(2),
						" ETH – ",
						range[1].toFixed(2),
						" ETH"
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					className: "mt-2 h-7 text-[11px]",
					onClick: () => onChange({
						minPrice: range[0] > 0 ? range[0] : void 0,
						maxPrice: range[1] < MAX ? range[1] : void 0
					}),
					children: "Aplicar"
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
				className: "mb-3 font-bold uppercase tracking-wider",
				children: "Raridade"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-2.5",
				children: RARITIES.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Checkbox, {
						id: `rar-${r}`,
						checked: search.rarities?.includes(r) ?? false,
						onCheckedChange: () => onChange({ rarities: toggle(search.rarities, r) })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						htmlFor: `rar-${r}`,
						className: "cursor-pointer text-muted-foreground",
						children: r
					})]
				}, r))
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "outline",
				size: "sm",
				className: "w-full",
				onClick: () => onChange({
					collections: void 0,
					rarities: void 0,
					minPrice: void 0,
					maxPrice: void 0
				}),
				children: "Limpar filtros"
			})
		]
	});
}
function CatalogPage({ search }) {
	const navigate = useNavigate();
	const { data, isLoading, isFetching } = useQuery({
		...nftsQuery(search),
		placeholderData: keepPreviousData
	});
	const featured = useQuery(featuredQuery());
	const set = (patch) => navigate({
		to: "/",
		search: (prev) => ({
			...prev,
			page: void 0,
			...patch
		}),
		resetScroll: false
	});
	const activeCount = (search.collections?.length ?? 0) + (search.rarities?.length ?? 0) + (search.minPrice != null || search.maxPrice != null ? 1 : 0);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 md:grid-cols-2 md:py-16",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs uppercase tracking-widest text-muted-foreground",
				children: "Marketplace · Edição limitada"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-3 text-3xl font-bold uppercase leading-tight sm:text-4xl lg:text-5xl",
				children: "Seja dono do futuro da arte digital"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 max-w-md text-sm leading-relaxed text-muted-foreground",
				children: "Colecione NFTs autênticos de criadores independentes. Cada edição é verificada on-chain e entregue direto na sua carteira."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				asChild: true,
				className: "mt-6 uppercase",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: "#catalogo",
					children: "Explorar"
				})
			})
		] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src: nft_1_default,
			alt: "Emerald Ape, NFT em destaque",
			width: 816,
			height: 816,
			className: "mx-auto aspect-square w-full max-w-md rounded bg-sand object-cover shadow-glow"
		})]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		id: "catalogo",
		className: "mx-auto max-w-7xl scroll-mt-20 px-4 sm:px-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
					className: "truncate text-sm font-bold uppercase",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-primary",
						children: "Todos os NFTs"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "ml-2 font-sans text-xs font-normal text-muted-foreground",
						"aria-live": "polite",
						children: data ? `${data.total} resultados` : "carregando…"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Sheet, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTrigger, {
							asChild: true,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "outline",
								size: "sm",
								className: "lg:hidden",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlidersHorizontal, {}),
									" Filtros",
									activeCount ? ` (${activeCount})` : ""
								]
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
							side: "left",
							className: "w-80 overflow-y-auto",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTitle, { children: "Filtros" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-4",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CatalogFiltersPanel, {
									search,
									onChange: set
								})
							})]
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							htmlFor: "sort",
							className: "sr-only",
							children: "Ordenar por"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value: search.sort ?? "recent",
							onValueChange: (v) => set({ sort: v === "recent" ? void 0 : v }),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
								id: "sort",
								className: "h-9 w-[170px] text-xs",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: "recent",
									children: "Mais recentes"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: "price-asc",
									children: "Menor preço"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: "price-desc",
									children: "Maior preço"
								})
							] })]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
					"aria-label": "Filtros",
					className: "hidden h-fit rounded border border-border bg-card p-4 lg:block",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CatalogFiltersPanel, {
						search,
						onChange: set
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					"aria-label": "Lista de NFTs",
					"aria-busy": isFetching,
					children: [isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6",
						children: Array.from({ length: 9 }, (_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NftCardSkeleton, {}, i))
					}) : data && data.items.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: cn("grid grid-cols-2 gap-4 transition-opacity sm:grid-cols-3 sm:gap-6", isFetching && "opacity-60"),
						children: data.items.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NftCard, { nft: n }) }, n.id))
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded border border-dashed border-border p-10 text-center text-sm text-muted-foreground",
						children: ["Nenhum NFT encontrado com esses filtros.", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "link",
							onClick: () => navigate({
								to: "/",
								search: {}
							}),
							children: "Limpar filtros"
						}) })]
					}), data && data.totalPages > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
						"aria-label": "Paginação",
						className: "mt-10 flex justify-center gap-2",
						children: Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/",
							search: (prev) => ({
								...prev,
								page: p === 1 ? void 0 : p
							}),
							hash: "catalogo",
							"aria-label": `Página ${p}`,
							"aria-current": p === data.page ? "page" : void 0,
							className: cn("grid size-9 place-items-center rounded border text-xs", p === data.page ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"),
							children: p
						}, p))
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				"aria-labelledby": "featured-title",
				className: "mt-20",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs uppercase tracking-widest text-primary",
						children: "NFT em destaque"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						id: "featured-title",
						className: "text-xl font-bold uppercase",
						children: "Oferta limitada"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-6 grid gap-6 md:grid-cols-3",
						children: featured.isLoading || !featured.data ? Array.from({ length: 3 }, (_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-40 w-full" }, i)) : featured.data.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/nft/$id",
							params: { id: n.id },
							className: "flex gap-4 rounded border border-border bg-card p-3 transition-colors hover:border-primary",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: n.image,
								alt: "",
								loading: "lazy",
								width: 816,
								height: 816,
								className: "size-28 shrink-0 rounded bg-sand object-cover"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "truncate font-sans text-sm font-bold",
										children: n.name
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 line-clamp-3 text-xs text-muted-foreground",
										children: n.description
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-2 text-xs text-primary",
										children: formatEth(n.price, 2)
									})
								]
							})]
						}, n.id))
					})
				]
			})
		]
	})] });
}
function Index() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CatalogPage, { search: Route.useSearch() });
}
//#endregion
export { Index as component };
