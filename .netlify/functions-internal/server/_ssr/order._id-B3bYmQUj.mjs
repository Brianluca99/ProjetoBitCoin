import { y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { p as require_jsx_runtime } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
import { C as useOrder, D as useScope, m as shortAddress, n as Button, t as ApiError } from "./client-api-DIF2XgCD.mjs";
import { C as CircleCheck, S as CircleX, g as LoaderCircle } from "../_libs/lucide-react.mjs";
import { t as Skeleton } from "./skeleton-B_MYF5Br.mjs";
import { t as OrderSummary } from "./order-summary-hivJYmM2.mjs";
import { t as Route } from "./order._id-BIjd8gse.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/order._id-B3bYmQUj.js
var import_jsx_runtime = require_jsx_runtime();
function ConfirmationPage({ id }) {
	const { ready, authed } = useScope();
	const orderQuery = useOrder(id);
	const order = orderQuery.data;
	if (!ready || authed && orderQuery.isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mx-auto max-w-2xl px-4 py-10",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-80 w-full" })
	});
	const unavailableOrder = orderQuery.error instanceof ApiError && (orderQuery.error.status === 403 || orderQuery.error.status === 404);
	if (!authed || orderQuery.isError && unavailableOrder || !order && !orderQuery.isError) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-md px-4 py-20 text-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "text-xl font-bold",
			children: "Pedido não encontrado"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			asChild: true,
			className: "mt-6",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/",
				children: "Voltar ao catálogo"
			})
		})]
	});
	if (orderQuery.isError && !order) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-md px-4 py-20 text-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			role: "alert",
			className: "text-sm text-destructive",
			children: "Não foi possível consultar o pedido. O pedido pode continuar pendente."
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			className: "mt-6",
			disabled: orderQuery.isFetching,
			onClick: () => void orderQuery.refetch(),
			children: [orderQuery.isFetching && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "animate-spin" }), "Tentar novamente"]
		})]
	});
	if (!order) return null;
	const done = order.status === "confirmed";
	const declined = order.status === "declined";
	const statusLabel = done ? "Pagamento confirmado." : declined ? `Pagamento recusado${order.declineReason ? `: ${order.declineReason}` : "."}` : "Pedido pendente. O status será atualizado automaticamente.";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-2xl px-4 py-10 sm:px-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "text-center",
				children: [
					done ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, {
						className: "mx-auto size-12 text-success",
						"aria-hidden": true
					}) : declined ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, {
						className: "mx-auto size-12 text-destructive",
						"aria-hidden": true
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
						className: "mx-auto size-12 animate-spin text-primary",
						"aria-hidden": true
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-4 text-2xl font-bold uppercase",
						children: done ? "Compra confirmada!" : declined ? "Pagamento recusado" : "Pedido em processamento"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						role: "status",
						"aria-live": "polite",
						className: "mt-2 text-sm text-muted-foreground",
						children: statusLabel
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8 space-y-4 rounded border border-border bg-card p-5 text-xs",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
						className: "grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-muted-foreground",
								children: "Pedido"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: order.id }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-muted-foreground",
								children: "Rede"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: order.network }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-muted-foreground",
								children: "Carteira"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", { children: [
								order.wallet.label,
								" · ",
								shortAddress(order.wallet.address)
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-muted-foreground",
								children: "Tx hash"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
								className: "truncate font-mono",
								children: order.txHash
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "space-y-2 border-t border-border pt-4",
						children: order.quote.lines.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-center gap-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: item.image,
									alt: "",
									className: "size-10 rounded bg-sand object-cover"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "flex-1 truncate",
									children: item.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-muted-foreground",
									children: ["× ", item.quantity]
								})
							]
						}, item.nftId))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "border-t border-border pt-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrderSummary, {
							totals: order.quote,
							coupon: order.quote.coupon
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 flex justify-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					variant: "outline",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/account/profile",
						children: "Meus pedidos"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						children: "Continuar comprando"
					})
				})]
			})
		]
	});
}
var SplitComponent = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConfirmationPage, { id: Route.useParams().id });
//#endregion
export { SplitComponent as component };
