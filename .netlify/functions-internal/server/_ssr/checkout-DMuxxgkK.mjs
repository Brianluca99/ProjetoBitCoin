import { o as __toESM } from "../_runtime.mjs";
import { r as formatEth } from "./decimal-BK8KOg9S.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { b as useNavigate, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { p as require_jsx_runtime } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
import { o as useQueryClient, r as useQuery } from "../_libs/tanstack__react-query.mjs";
import { D as useScope, M as useWalletMutations, N as useWallets, O as useSession, a as cn, b as useCreateOrder, i as api, l as keys, m as shortAddress, n as Button, t as ApiError } from "./client-api-DIF2XgCD.mjs";
import { n as Label } from "./label-CGIEdmkt.mjs";
import { g as LoaderCircle, x as Circle } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as AuthForm } from "./auth-dialog-D84sJwXI.mjs";
import { t as Skeleton } from "./skeleton-B_MYF5Br.mjs";
import { t as OrderSummary } from "./order-summary-hivJYmM2.mjs";
import { n as RadioGroupIndicator, r as RadioGroupItem$1, t as RadioGroup$1 } from "../_libs/radix-ui__react-radio-group.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/checkout-DMuxxgkK.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var RadioGroup = import_react.forwardRef(({ className, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RadioGroup$1, {
		className: cn("grid gap-2", className),
		...props,
		ref
	});
});
RadioGroup.displayName = RadioGroup$1.displayName;
var RadioGroupItem = import_react.forwardRef(({ className, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RadioGroupItem$1, {
		ref,
		className: cn("aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50", className),
		...props,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RadioGroupIndicator, {
			className: "flex items-center justify-center",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Circle, { className: "h-3.5 w-3.5 fill-primary" })
		})
	});
});
RadioGroupItem.displayName = RadioGroupItem$1.displayName;
var NETWORKS = [
	"Ethereum",
	"Polygon",
	"Base"
];
var PENDING_ORDER_KEY = "kurio-pending-order-v1";
function pendingOrderStorageKey(userId) {
	return `${PENDING_ORDER_KEY}:${userId}`;
}
function readPendingOrder(userId) {
	const storageKey = pendingOrderStorageKey(userId);
	const raw = localStorage.getItem(storageKey);
	if (!raw) return null;
	try {
		const pending = JSON.parse(raw);
		if (typeof pending.userId === "string" && typeof pending.fingerprint === "string" && typeof pending.key === "string" && pending.body && typeof pending.body.quoteId === "string") return pending;
	} catch (error) {
		console.error("Could not read the pending order recovery data.", error);
	}
	localStorage.removeItem(storageKey);
	return null;
}
function clearPendingOrder(userId) {
	localStorage.removeItem(pendingOrderStorageKey(userId));
}
function CheckoutPage() {
	const { ready, authed, scope } = useScope();
	const { user, isLoading: sessionLoading } = useSession();
	const cartQuery = useQuery({
		queryKey: keys.cart(scope),
		queryFn: api.cart,
		enabled: ready
	});
	const walletsQuery = useWallets();
	const [network, setNetwork] = (0, import_react.useState)("Ethereum");
	const [walletId, setWalletId] = (0, import_react.useState)("");
	const createOrder = useCreateOrder();
	const createOrderMutation = createOrder.mutate;
	const walletMutations = useWalletMutations();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const recoveringKey = (0, import_react.useRef)(null);
	const [recoveringOrder, setRecoveringOrder] = (0, import_react.useState)(false);
	const [recoveryError, setRecoveryError] = (0, import_react.useState)(false);
	const [reconfirmationRequired, setReconfirmationRequired] = (0, import_react.useState)(false);
	const cart = cartQuery.data;
	const wallets = walletsQuery.data?.wallets ?? [];
	const wallet = wallets.find((item) => item.id === (walletId || walletsQuery.data?.connectedId || wallets[0]?.id));
	const quoteQuery = useQuery({
		queryKey: keys.quote(scope, network),
		queryFn: () => api.quote(network),
		enabled: ready && authed && !!cart?.items.length,
		retry: 1
	});
	(0, import_react.useEffect)(() => {
		if (!ready || !authed || sessionLoading || !user) return;
		const pending = readPendingOrder(user.id);
		if (!pending || recoveringKey.current === pending.key) return;
		recoveringKey.current = pending.key;
		setRecoveringOrder(true);
		createOrderMutation(pending, {
			onSuccess: (order) => {
				clearPendingOrder(pending.userId);
				setRecoveringOrder(false);
				navigate({
					to: "/order/$id",
					params: { id: order.id }
				});
			},
			onError: (error) => {
				setRecoveringOrder(false);
				setRecoveryError(true);
				recoveringKey.current = null;
				if (error instanceof ApiError && error.code === "PRICE_CHANGED") {
					if (error.quote) {
						queryClient.setQueryData(keys.quote(scope, error.quote.network), error.quote);
						setReconfirmationRequired(true);
					}
					clearPendingOrder(pending.userId);
				}
				toast.error(error instanceof ApiError ? error.message : "Não foi possível recuperar o pedido. Tente novamente.");
			}
		});
	}, [
		ready,
		authed,
		sessionLoading,
		user,
		createOrderMutation,
		navigate,
		queryClient,
		scope
	]);
	if (!ready || sessionLoading || authed && (cartQuery.isLoading || walletsQuery.isLoading)) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mx-auto max-w-5xl px-4 py-10",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-96 w-full" })
	});
	if (!authed || !user) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-sm px-4 py-12",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mb-4 text-sm text-muted-foreground",
			children: "Entre na sua conta para finalizar a compra."
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthForm, { mode: "login" })]
	});
	if (recoveringOrder) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		role: "status",
		className: "mx-auto max-w-md px-4 py-20 text-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mx-auto size-8 animate-spin text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-4 text-sm",
			children: "Recuperando sua tentativa de compra…"
		})]
	});
	if (recoveryError) {
		const pending = readPendingOrder(user.id);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-md px-4 py-20 text-center",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				role: "alert",
				className: "text-sm text-destructive",
				children: "Não foi possível confirmar se o pedido foi criado."
			}), pending?.userId === user.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				className: "mt-4",
				onClick: () => {
					recoveringKey.current = pending.key;
					setRecoveryError(false);
					setRecoveringOrder(true);
					createOrderMutation(pending, {
						onSuccess: (order) => {
							clearPendingOrder(pending.userId);
							setRecoveringOrder(false);
							navigate({
								to: "/order/$id",
								params: { id: order.id }
							});
						},
						onError: (error) => {
							setRecoveringOrder(false);
							setRecoveryError(true);
							recoveringKey.current = null;
							if (error instanceof ApiError && error.code === "PRICE_CHANGED") {
								if (error.quote) {
									queryClient.setQueryData(keys.quote(scope, error.quote.network), error.quote);
									setReconfirmationRequired(true);
								}
								clearPendingOrder(pending.userId);
							}
							toast.error(error instanceof ApiError ? error.message : "Falha ao recuperar o pedido.");
						}
					});
				},
				children: "Tentar recuperar pedido"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				className: "mt-4",
				onClick: () => setRecoveryError(false),
				children: "Continuar e revisar a cotação"
			})]
		});
	}
	if (cartQuery.isError) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		role: "alert",
		className: "mx-auto max-w-md px-4 py-16 text-center text-sm",
		children: [
			"Não foi possível carregar o carrinho.",
			" ",
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "link",
				onClick: () => void cartQuery.refetch(),
				children: "Tentar novamente"
			})
		]
	});
	if (!cart?.items.length) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-md px-4 py-20 text-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted-foreground",
			children: "Seu carrinho está vazio."
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			asChild: true,
			className: "mt-4",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/",
				children: "Explorar NFTs"
			})
		})]
	});
	const pay = async () => {
		const pending = readPendingOrder(user.id);
		if (pending) {
			createOrderMutation(pending, {
				onSuccess: (order) => {
					clearPendingOrder(pending.userId);
					navigate({
						to: "/order/$id",
						params: { id: order.id }
					});
				},
				onError: (error) => {
					if (error instanceof ApiError && error.code === "PRICE_CHANGED" && error.quote) {
						queryClient.setQueryData(keys.quote(scope, error.quote.network), error.quote);
						setReconfirmationRequired(true);
						clearPendingOrder(pending.userId);
					} else if (error instanceof ApiError && error.status >= 400 && error.status < 500 && error.status !== 401) clearPendingOrder(pending.userId);
					toast.error(error instanceof ApiError ? error.message : "Não foi possível recuperar o pedido.");
				}
			});
			return;
		}
		if (!wallet) {
			toast.error("Adicione uma carteira antes de pagar.");
			return;
		}
		if (!quoteQuery.data) {
			toast.error("A cotação ainda não está disponível. Tente novamente.");
			return;
		}
		const body = {
			quoteId: quoteQuery.data.id,
			total: quoteQuery.data.total,
			walletId: wallet.id,
			network,
			collector: {
				name: user.name,
				email: user.email,
				phone: user.phone
			}
		};
		if (walletsQuery.data?.connectedId !== wallet.id) try {
			await walletMutations.connect.mutateAsync(wallet.id);
		} catch (error) {
			toast.error(error instanceof ApiError ? error.message : "Não foi possível conectar a carteira.");
			return;
		}
		const fingerprint = JSON.stringify([
			user.id,
			quoteQuery.data.lines,
			quoteQuery.data.coupon,
			quoteQuery.data.subtotal,
			quoteQuery.data.discount,
			quoteQuery.data.networkFee,
			quoteQuery.data.total,
			wallet.id,
			network,
			body.collector
		]);
		const previous = readPendingOrder(user.id);
		const attempt = previous?.userId === user.id && previous.fingerprint === fingerprint ? previous : {
			userId: user.id,
			fingerprint,
			key: crypto.randomUUID(),
			body
		};
		try {
			localStorage.setItem(pendingOrderStorageKey(user.id), JSON.stringify(attempt));
		} catch (error) {
			console.error("Could not persist the idempotent order attempt.", error);
			toast.error("Não foi possível salvar a tentativa de compra para recuperação.");
			return;
		}
		createOrderMutation(attempt, {
			onSuccess: (order) => {
				clearPendingOrder(attempt.userId);
				navigate({
					to: "/order/$id",
					params: { id: order.id }
				});
			},
			onError: (error) => {
				if (error instanceof ApiError && error.code === "PRICE_CHANGED" && error.quote) {
					queryClient.setQueryData(keys.quote(scope, network), error.quote);
					setReconfirmationRequired(true);
					clearPendingOrder(attempt.userId);
				} else if (error instanceof ApiError && error.status >= 400 && error.status < 500 && error.status !== 401) clearPendingOrder(attempt.userId);
				toast.error(error instanceof ApiError ? error.message : "Não foi possível criar o pedido.");
			}
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-5xl px-4 py-8 sm:px-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "mb-6 text-2xl font-bold uppercase",
			children: "Checkout"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-8 md:grid-cols-[minmax(0,1fr)_320px]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
						className: "rounded border border-border bg-card p-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
							className: "px-1 text-sm font-bold uppercase",
							children: "Rede"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RadioGroup, {
							value: network,
							onValueChange: (value) => {
								const selected = NETWORKS.find((item) => item === value);
								if (selected) setNetwork(selected);
							},
							className: "mt-2 grid gap-2 sm:grid-cols-3",
							children: NETWORKS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
								htmlFor: `net-${item}`,
								className: "flex cursor-pointer items-center gap-2 rounded border border-border p-3 text-xs has-[[data-state=checked]]:border-primary",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RadioGroupItem, {
										id: `net-${item}`,
										value: item
									}),
									" ",
									item
								]
							}, item))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
						className: "rounded border border-border bg-card p-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
							className: "px-1 text-sm font-bold uppercase",
							children: "Carteira de pagamento"
						}), walletsQuery.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							role: "alert",
							className: "mt-2 text-xs text-destructive",
							children: "Não foi possível carregar suas carteiras."
						}) : wallets.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RadioGroup, {
							value: wallet?.id ?? "",
							onValueChange: setWalletId,
							className: "mt-2 space-y-2",
							children: wallets.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
								htmlFor: `w-${item.id}`,
								className: "flex cursor-pointer items-center gap-3 rounded border border-border p-3 text-xs has-[[data-state=checked]]:border-primary",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RadioGroupItem, {
										id: `w-${item.id}`,
										value: item.id
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "flex-1",
										children: [
											item.label,
											" ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "text-muted-foreground",
												children: ["· ", item.provider]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-mono text-muted-foreground",
										children: shortAddress(item.address)
									})
								]
							}, item.id))
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 text-xs text-muted-foreground",
							children: [
								"Nenhuma carteira.",
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/account/wallets",
									className: "text-primary underline",
									children: "Adicionar carteira"
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "rounded border border-border bg-card p-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-sm font-bold uppercase",
							children: "Itens"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-3 space-y-3",
							children: cart.items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-center gap-3 text-xs",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: item.image,
										alt: "",
										className: "size-12 rounded bg-sand object-cover"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "flex-1 truncate",
										children: item.name
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-muted-foreground",
										children: ["× ", item.quantity]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "tabular-nums",
										children: formatEth(item.unitPrice)
									})
								]
							}, item.nftId))
						})]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				"aria-label": "Resumo",
				className: "h-fit space-y-5 rounded border border-border bg-card p-5",
				children: [quoteQuery.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					role: "alert",
					className: "text-xs text-destructive",
					children: [
						"Não foi possível validar a compra.",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "link",
							className: "h-auto p-0",
							onClick: () => void quoteQuery.refetch(),
							children: "Tentar novamente"
						})
					]
				}) : quoteQuery.data ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrderSummary, {
					totals: quoteQuery.data,
					coupon: quoteQuery.data.coupon
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-2",
					"aria-busy": "true",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-4 w-full" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-8 w-full" })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					className: "w-full uppercase",
					onClick: pay,
					disabled: createOrder.isPending || walletMutations.connect.isPending || !quoteQuery.data || !wallet,
					children: [(createOrder.isPending || walletMutations.connect.isPending) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "animate-spin" }), reconfirmationRequired ? "Confirmar cotação atualizada" : "Confirmar pagamento"]
				})]
			})]
		})]
	});
}
var SplitComponent = CheckoutPage;
//#endregion
export { SplitComponent as component };
