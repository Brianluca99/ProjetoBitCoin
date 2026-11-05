import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { p as require_jsx_runtime } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
import { D as useScope, M as useWalletMutations, N as useWallets, m as shortAddress, n as Button, t as ApiError } from "./client-api-DIF2XgCD.mjs";
import { n as Label, t as Input } from "./label-CGIEdmkt.mjs";
import { a as Unplug, p as Pencil, r as WalletCards } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as DialogHeader, i as DialogContent, n as AuthForm, o as DialogTitle, r as Dialog } from "./auth-dialog-D84sJwXI.mjs";
import { t as Skeleton } from "./skeleton-B_MYF5Br.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-MlIvpcjb.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/account.wallets-C3Zr2VrO.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var PROVIDERS = [
	"MetaMask",
	"Coinbase",
	"WalletConnect",
	"Ledger"
];
var ROLES = ["primary", "secondary"];
var empty = {
	label: "",
	provider: "MetaMask",
	address: "",
	role: "secondary"
};
function WalletsPage() {
	const { ready, authed } = useScope();
	const walletsQuery = useWallets();
	const { save, connect, disconnect } = useWalletMutations();
	const [editing, setEditing] = (0, import_react.useState)(null);
	const [err, setErr] = (0, import_react.useState)(null);
	const wallets = walletsQuery.data?.wallets ?? [];
	const connectedId = walletsQuery.data?.connectedId ?? null;
	const submit = (event) => {
		event.preventDefault();
		if (!editing) return;
		if (!editing.label.trim()) {
			setErr("Informe um nome.");
			return;
		}
		if (!/^0x[a-fA-F0-9]{40}$/.test(editing.address)) {
			setErr("Endereço inválido (0x + 40 caracteres hexadecimais).");
			return;
		}
		save.mutate(editing, {
			onSuccess: () => {
				setEditing(null);
				toast.success("Carteira salva");
			},
			onError: (error) => setErr(error instanceof ApiError ? error.message : "Não foi possível salvar a carteira.")
		});
	};
	if (!ready || authed && walletsQuery.isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-3xl space-y-3 px-4 py-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-20 w-full" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-20 w-full" })]
	});
	if (!authed) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-sm px-4 py-12",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mb-4 text-sm text-muted-foreground",
			children: "Entre para gerenciar suas carteiras."
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthForm, { mode: "login" })]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-3xl px-4 py-8 sm:px-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-6 flex items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-2xl font-bold uppercase",
					children: "Carteiras"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: () => {
						setErr(null);
						setEditing({ ...empty });
					},
					children: "Adicionar"
				})]
			}),
			walletsQuery.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				role: "alert",
				className: "rounded border border-border p-8 text-center text-sm",
				children: [
					"Não foi possível carregar as carteiras.",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "link",
						onClick: () => void walletsQuery.refetch(),
						children: "Tentar novamente"
					})
				]
			}) : wallets.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "space-y-3",
				children: wallets.map((wallet) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex flex-wrap items-center gap-3 rounded border border-border bg-card p-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm font-bold",
								children: [wallet.label, wallet.role === "primary" ? " · Principal" : ""]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted-foreground",
								children: [
									wallet.provider,
									" ·",
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-mono",
										children: shortAddress(wallet.address)
									})
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							size: "icon",
							"aria-label": `Editar ${wallet.label}`,
							onClick: () => {
								setErr(null);
								setEditing(wallet);
							},
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, {})
						}),
						connectedId === wallet.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							size: "sm",
							disabled: disconnect.isPending,
							onClick: () => disconnect.mutate(wallet.id, { onError: () => toast.error("Não foi possível desconectar a carteira.") }),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Unplug, {}), " Desconectar"]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							size: "sm",
							disabled: connect.isPending,
							onClick: () => connect.mutate(wallet.id, { onError: () => toast.error("Não foi possível conectar a carteira.") }),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WalletCards, {}), " Conectar"]
						})
					]
				}, wallet.id))
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "rounded border border-dashed border-border p-10 text-center text-sm text-muted-foreground",
				children: "Nenhuma carteira cadastrada."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: !!editing,
				onOpenChange: (open) => !open && setEditing(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "max-w-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: editing?.id ? "Editar carteira" : "Nova carteira" }) }), editing && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: submit,
						className: "space-y-4",
						noValidate: true,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "w-label",
									children: "Nome"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "w-label",
									value: editing.label,
									onChange: (event) => setEditing({
										...editing,
										label: event.target.value
									}),
									required: true
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "w-prov",
									children: "Provedor"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: editing.provider,
									onValueChange: (value) => {
										const provider = PROVIDERS.find((item) => item === value);
										if (provider) setEditing({
											...editing,
											provider
										});
									},
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
										id: "w-prov",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: PROVIDERS.map((provider) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: provider,
										children: provider
									}, provider)) })]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "w-role",
									children: "Tipo"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: editing.role,
									onValueChange: (value) => {
										const role = ROLES.find((item) => item === value);
										if (role) setEditing({
											...editing,
											role
										});
									},
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
										id: "w-role",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "primary",
										children: "Principal"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "secondary",
										children: "Secundária"
									})] })]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "w-addr",
									children: "Endereço"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "w-addr",
									className: "font-mono",
									value: editing.address,
									onChange: (event) => setEditing({
										...editing,
										address: event.target.value.trim()
									}),
									placeholder: "0x…",
									"aria-invalid": !!err,
									"aria-describedby": "w-err",
									required: true
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								id: "w-err",
								role: "alert",
								className: "text-xs text-destructive",
								children: err
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "submit",
								className: "w-full",
								disabled: save.isPending,
								children: "Salvar"
							})
						]
					})]
				})
			})
		]
	});
}
var SplitComponent = WalletsPage;
//#endregion
export { SplitComponent as component };
