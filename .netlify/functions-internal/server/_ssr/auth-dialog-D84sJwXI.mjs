import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { p as require_jsx_runtime } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
import { _ as useAuthActions, a as cn, n as Button, r as actions, t as ApiError, v as useAuthModal } from "./client-api-DIF2XgCD.mjs";
import { n as Label, t as Input } from "./label-CGIEdmkt.mjs";
import { b as EyeOff, g as LoaderCircle, t as X, y as Eye } from "../_libs/lucide-react.mjs";
import { a as DialogOverlay$1, i as DialogDescription$1, n as DialogClose, o as DialogPortal$1, r as DialogContent$1, s as DialogTitle$1, t as Dialog$1 } from "../_libs/@radix-ui/react-dialog+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/auth-dialog-D84sJwXI.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Dialog = Dialog$1;
var DialogPortal = DialogPortal$1;
var DialogOverlay = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay$1, {
	ref,
	className: cn("fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className),
	...props
}));
DialogOverlay.displayName = DialogOverlay$1.displayName;
var DialogContent = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent$1, {
	ref,
	className: cn("fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg", className),
	...props,
	children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogClose, {
		className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "sr-only",
			children: "Close"
		})]
	})]
})] }));
DialogContent.displayName = DialogContent$1.displayName;
var DialogHeader = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col space-y-1.5 text-center sm:text-left", className),
	...props
});
DialogHeader.displayName = "DialogHeader";
var DialogFooter = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
	...props
});
DialogFooter.displayName = "DialogFooter";
var DialogTitle = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle$1, {
	ref,
	className: cn("text-lg font-semibold leading-none tracking-tight", className),
	...props
}));
DialogTitle.displayName = DialogTitle$1.displayName;
var DialogDescription = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription$1, {
	ref,
	className: cn("text-sm text-muted-foreground", className),
	...props
}));
DialogDescription.displayName = DialogDescription$1.displayName;
function AuthDialog() {
	const mode = useAuthModal();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open: mode !== null,
		onOpenChange: (o) => !o && actions.openAuth(null),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, {
			className: "max-w-sm",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthForm, {
				mode: mode === "register" ? "register" : "login",
				inDialog: true,
				onDone: () => actions.openAuth(null)
			}, mode ?? "x")
		})
	});
}
function AuthForm({ mode: initial, onDone, inDialog }) {
	const { login, register } = useAuthActions();
	const [mode, setMode] = (0, import_react.useState)(initial);
	const [show, setShow] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const [fields, setFields] = (0, import_react.useState)({});
	const pending = login.isPending || register.isPending;
	const isReg = mode === "register";
	const Title = inDialog ? DialogTitle : "h1";
	const Desc = inDialog ? DialogDescription : "p";
	const onSubmit = async (e) => {
		e.preventDefault();
		const f = new FormData(e.currentTarget);
		const email = String(f.get("email") ?? "").trim();
		const password = String(f.get("password") ?? "");
		const errs = {};
		if (!/^\S+@\S+\.\S+$/.test(email)) errs["email"] = "Informe um e-mail válido.";
		if (password.length < 8) errs["password"] = "A senha precisa ter ao menos 8 caracteres.";
		if (isReg && String(f.get("name") ?? "").trim().length < 2) errs["name"] = "Informe seu nome.";
		if (isReg && password !== f.get("confirm")) errs["confirm"] = "As senhas não coincidem.";
		setFields(errs);
		setError(null);
		if (Object.keys(errs).length) return;
		try {
			const s = isReg ? await register.mutateAsync({
				name: String(f.get("name")).trim(),
				email,
				password
			}) : await login.mutateAsync({
				email,
				password
			});
			toast.success(isReg ? "Conta criada com sucesso!" : `Bem-vindo, ${s.user.name}!`);
			onDone?.();
		} catch (err) {
			if (err instanceof ApiError) {
				setFields(err.fields);
				setError(err.message);
			} else setError("Não foi possível continuar.");
		}
	};
	const fieldError = (name) => fields[name] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		id: `auth-${name}-err`,
		className: "text-xs text-destructive",
		children: fields[name]
	}) : null;
	const aria = (name) => fields[name] ? {
		"aria-invalid": true,
		"aria-describedby": `auth-${name}-err`
	} : {};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-1.5 text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-xl font-bold tracking-widest text-primary",
						children: "KURIO"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Title, {
						className: "text-lg font-semibold",
						children: isReg ? "Criar perfil de colecionador" : "Entrar"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Desc, {
						className: "text-sm text-muted-foreground",
						children: isReg ? "Cadastre-se para comprar e guardar suas edições." : "Acesse sua conta para continuar. Demo: ana@kurio.art / kurio123"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				onSubmit,
				className: "space-y-4",
				noValidate: true,
				children: [
					isReg && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "auth-name",
								children: "Nome completo"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "auth-name",
								name: "name",
								autoComplete: "name",
								...aria("name")
							}),
							fieldError("name")
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "auth-email",
								children: "E-mail"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "auth-email",
								name: "email",
								type: "email",
								autoComplete: "email",
								...aria("email")
							}),
							fieldError("email")
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "auth-password",
								children: "Senha"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "auth-password",
									name: "password",
									type: show ? "text" : "password",
									autoComplete: isReg ? "new-password" : "current-password",
									className: "pr-10",
									...aria("password")
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setShow(!show),
									"aria-label": show ? "Ocultar senha" : "Mostrar senha",
									className: "absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground",
									children: show ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "size-4" })
								})]
							}),
							fieldError("password")
						]
					}),
					isReg && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "auth-confirm",
								children: "Confirmar senha"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "auth-confirm",
								name: "confirm",
								type: "password",
								autoComplete: "new-password",
								...aria("confirm")
							}),
							fieldError("confirm")
						]
					}),
					error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						role: "alert",
						className: "text-xs text-destructive",
						children: error
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						type: "submit",
						className: "w-full uppercase",
						disabled: pending,
						children: [pending && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "animate-spin" }), isReg ? "Criar conta" : "Entrar"]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-center text-xs text-muted-foreground",
				children: [isReg ? "Já tem conta? " : "Ainda não tem conta? ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "text-primary underline-offset-4 hover:underline",
					onClick: () => {
						setMode(isReg ? "login" : "register");
						setFields({});
						setError(null);
					},
					children: isReg ? "Entrar" : "Criar conta"
				})]
			})
		]
	});
}
//#endregion
export { DialogHeader as a, DialogContent as i, AuthForm as n, DialogTitle as o, Dialog as r, AuthDialog as t };
