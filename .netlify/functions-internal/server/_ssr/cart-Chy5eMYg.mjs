import { o as __toESM } from "../_runtime.mjs";
import { i as mulEth, r as formatEth } from "./decimal-BK8KOg9S.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { b as useNavigate, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { p as require_jsx_runtime } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
import { D as useScope, E as useRemoveItem, T as useRemoveCoupon, g as useApplyCoupon, k as useSetQuantity, n as Button, r as actions, t as ApiError, y as useCart } from "./client-api-DIF2XgCD.mjs";
import { n as Label, t as Input } from "./label-CGIEdmkt.mjs";
import { o as Trash2 } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Skeleton } from "./skeleton-B_MYF5Br.mjs";
import { t as OrderSummary } from "./order-summary-hivJYmM2.mjs";
import { t as QuantityStepper } from "./quantity-stepper-AgtFly30.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/cart-Chy5eMYg.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var onFail = (e) => toast.error(e instanceof ApiError ? e.message : "Não foi possível atualizar o carrinho.");
function CartPage() {
	const cart = useCart();
	const { authed } = useScope();
	const setQty = useSetQuantity();
	const remove = useRemoveItem();
	const apply = useApplyCoupon();
	const removeCoupon = useRemoveCoupon();
	const navigate = useNavigate();
	const [code, setCode] = (0, import_react.useState)("");
	const [err, setErr] = (0, import_react.useState)(null);
	const data = cart.data;
	const onApply = (e) => {
		e.preventDefault();
		setErr(null);
		apply.mutate(code.trim(), {
			onSuccess: () => setCode(""),
			onError: (e) => setErr(e instanceof ApiError ? e.message : "Cupom inválido.")
		});
	};
	const checkout = () => authed ? navigate({ to: "/checkout" }) : actions.openAuth("login");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-7xl px-4 py-8 sm:px-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "mb-6 text-2xl font-bold uppercase",
			children: "Carrinho"
		}), cart.isLoading || !data ? cart.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			role: "alert",
			className: "rounded border border-border p-8 text-center text-sm",
			children: ["Não foi possível carregar o carrinho. ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "link",
				onClick: () => cart.refetch(),
				children: "Tentar novamente"
			})]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]",
			"aria-busy": "true",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-4",
				children: Array.from({ length: 3 }, (_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-28 w-full" }, i))
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-64 w-full" })]
		}) : data.items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "rounded border border-dashed border-border p-12 text-center",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground",
				children: "Seu carrinho está vazio."
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				asChild: true,
				className: "mt-4 uppercase",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/",
					children: "Explorar NFTs"
				})
			})]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "divide-y divide-border rounded border border-border bg-card",
				children: data.items.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex flex-wrap items-center gap-4 p-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: c.image,
							alt: "",
							className: "size-20 rounded bg-sand object-cover"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/nft/$id",
									params: { id: c.nftId },
									className: "block truncate text-sm font-bold hover:text-primary",
									children: c.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground",
									children: c.collection
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-xs text-primary",
									children: formatEth(c.unitPrice)
								}),
								c.unitPrice !== c.addedPrice && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									role: "status",
									className: "mt-1 text-[11px] text-warning",
									children: [
										"Preço mudou de ",
										formatEth(c.addedPrice),
										" para ",
										formatEth(c.unitPrice)
									]
								}),
								c.available < c.quantity && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									role: "status",
									className: "mt-1 text-[11px] text-destructive",
									children: [
										"Apenas ",
										c.available,
										" disponíveis"
									]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuantityStepper, {
							label: `Quantidade de ${c.name}`,
							value: c.quantity,
							max: Math.max(1, c.available),
							onChange: (v) => setQty.mutate({
								nftId: c.nftId,
								quantity: v
							}, { onError: onFail })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "w-28 text-right text-sm font-bold tabular-nums",
							children: formatEth(mulEth(c.unitPrice, c.quantity))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							size: "icon",
							"aria-label": `Remover ${c.name}`,
							onClick: () => remove.mutate(c.nftId, { onError: onFail }),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {})
						})
					]
				}, c.nftId))
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				"aria-label": "Resumo do pedido",
				className: "h-fit space-y-5 rounded border border-border bg-card p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: onApply,
						className: "space-y-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "coupon",
								className: "text-xs",
								children: "Cupom de desconto"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "coupon",
									value: code,
									onChange: (e) => setCode(e.target.value),
									placeholder: "KURIO10",
									"aria-invalid": !!err,
									"aria-describedby": "coupon-msg"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "submit",
									variant: "outline",
									disabled: !code.trim() || apply.isPending,
									children: "Aplicar"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								id: "coupon-msg",
								role: "status",
								className: "text-xs",
								children: err ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-destructive",
									children: err
								}) : data.coupon ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-success",
									children: [
										"Cupom ",
										data.coupon,
										" aplicado. ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: "underline",
											onClick: () => removeCoupon.mutate(void 0),
											children: "Remover"
										})
									]
								}) : null
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrderSummary, {
						totals: data.summary,
						coupon: data.coupon
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] text-muted-foreground",
						children: "Valores finais confirmados pelo servidor no checkout."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "w-full uppercase",
						onClick: checkout,
						children: authed ? "Ir para o checkout" : "Entrar para continuar"
					})
				]
			})]
		})]
	});
}
var SplitComponent = CartPage;
//#endregion
export { SplitComponent as component };
