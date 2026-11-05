import { o as __toESM } from "../_runtime.mjs";
import { r as formatEth } from "./decimal-BK8KOg9S.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { p as require_jsx_runtime } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
import { D as useScope, S as useMe, _ as useAuthActions, a as cn, j as useUpdateMe, n as Button, w as useOrders } from "./client-api-DIF2XgCD.mjs";
import { n as Label, t as Input } from "./label-CGIEdmkt.mjs";
import { g as LoaderCircle } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as AuthForm } from "./auth-dialog-D84sJwXI.mjs";
import { t as Skeleton } from "./skeleton-B_MYF5Br.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/account.profile-GwpJTWWk.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Textarea = import_react.forwardRef(({ className, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
		className: cn("flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm", className),
		ref,
		...props
	});
});
Textarea.displayName = "Textarea";
var profileForm = (user) => ({
	name: user.name,
	username: user.username,
	email: user.email,
	phone: user.phone,
	bio: user.bio
});
function ProfilePage() {
	const { ready, authed } = useScope();
	const me = useMe();
	const orders = useOrders();
	const update = useUpdateMe();
	const { logout } = useAuthActions();
	const [form, setForm] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (me.data) setForm(profileForm(me.data));
	}, [me.data]);
	if (!ready || authed && me.isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mx-auto max-w-3xl px-4 py-10",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-80 w-full" })
	});
	if (!authed || !me.data || !form) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-sm px-4 py-12",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mb-4 text-sm text-muted-foreground",
			children: "Entre para ver seu perfil."
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthForm, { mode: "login" })]
	});
	const set = (key) => (event) => setForm((current) => current ? {
		...current,
		[key]: event.target.value
	} : current);
	const submit = (event) => {
		event.preventDefault();
		if (!form.name.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) {
			toast.error("Preencha nome e um e-mail válido.");
			return;
		}
		update.mutate(form, {
			onSuccess: (user) => {
				setForm(profileForm(user));
				toast.success("Perfil atualizado");
			},
			onError: () => toast.error("Não foi possível atualizar o perfil.")
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto grid max-w-5xl gap-8 px-4 py-8 sm:px-6 md:grid-cols-[minmax(0,1fr)_320px]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			onSubmit: submit,
			className: "space-y-4 rounded border border-border bg-card p-5",
			"aria-labelledby": "ptitle",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					id: "ptitle",
					className: "text-xl font-bold uppercase",
					children: "Meu perfil"
				}),
				[
					[
						"name",
						"Nome",
						"text"
					],
					[
						"username",
						"Usuário",
						"text"
					],
					[
						"email",
						"E-mail",
						"email"
					],
					[
						"phone",
						"Telefone",
						"tel"
					]
				].map(([key, label, type]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: `p-${key}`,
						children: label
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: `p-${key}`,
						type,
						value: form[key],
						onChange: set(key),
						required: key !== "phone"
					})]
				}, key)),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "p-bio",
						children: "Bio"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
						id: "p-bio",
						value: form.bio,
						onChange: set("bio"),
						rows: 3
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						type: "submit",
						disabled: update.isPending,
						children: [update.isPending && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "animate-spin" }), " Salvar"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "outline",
						onClick: () => void logout(),
						children: "Sair"
					})]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			"aria-labelledby": "otitle",
			className: "h-fit rounded border border-border bg-card p-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					id: "otitle",
					className: "text-sm font-bold uppercase",
					children: "Pedidos"
				}),
				orders.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					role: "alert",
					className: "mt-3 text-xs text-destructive",
					children: "Não foi possível carregar seus pedidos."
				}) : orders.data?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-3 space-y-2 text-xs",
					children: orders.data.map((order) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/order/$id",
						params: { id: order.id },
						className: "flex justify-between rounded border border-border p-3 hover:border-primary",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: order.id }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-primary",
							children: formatEth(order.quote.total)
						})]
					}) }, order.id))
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-xs text-muted-foreground",
					children: "Nenhum pedido ainda."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					variant: "link",
					className: "mt-2 px-0",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/account/wallets",
						children: "Gerenciar carteiras"
					})
				})
			]
		})]
	});
}
var SplitComponent = ProfilePage;
//#endregion
export { SplitComponent as component };
