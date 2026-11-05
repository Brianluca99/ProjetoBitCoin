import { o as __toESM } from "../_runtime.mjs";
import { r as formatEth } from "./decimal-BK8KOg9S.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { _ as createFileRoute, b as useNavigate, d as Scripts, f as HeadContent, g as lazyRouteComponent, h as Outlet, m as createRouter, v as createRootRouteWithContext, x as useRouter, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { p as require_jsx_runtime } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
import { a as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { O as useSession, _ as useAuthActions, a as cn, c as getToken, f as onSessionChange, l as keys, n as Button, o as ensureMocks, r as actions, y as useCart } from "./client-api-DIF2XgCD.mjs";
import { t as Input } from "./label-CGIEdmkt.mjs";
import { D as Check, O as Bell, T as ChevronRight, _ as House, c as Sparkles, d as ShieldCheck, h as Menu, i as User, n as Wallet, u as ShoppingBag, v as Heart, x as Circle } from "../_libs/lucide-react.mjs";
import { n as toast, t as Toaster } from "../_libs/sonner.mjs";
import { t as AuthDialog } from "./auth-dialog-D84sJwXI.mjs";
import { a as DropdownMenuItemIndicator, c as DropdownMenuRadioItem$1, d as DropdownMenuSubTrigger$1, f as DropdownMenuTrigger$1, i as DropdownMenuItem$1, l as DropdownMenuSeparator$1, n as DropdownMenuCheckboxItem$1, o as DropdownMenuLabel$1, r as DropdownMenuContent$1, s as DropdownMenuPortal, t as DropdownMenu$1, u as DropdownMenuSubContent$1 } from "../_libs/@radix-ui/react-dropdown-menu+[...].mjs";
import { t as Route$6 } from "./nft._id-buMGSawd.mjs";
import { t as Route$7 } from "./order._id-BIjd8gse.mjs";
import { a as SheetTrigger, i as SheetTitle, n as Sheet, r as SheetContent, t as Route$8 } from "./routes-DUdLeXSG.mjs";
import { t as lookup } from "../_libs/socket.io-client.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-BkOiiQVl.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var styles_default = "/assets/styles-CeQw2BQJ.css";
var ICONS = {
	shop: "data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M18.3333%206.80118L17.3897%2012.7776C17.2181%2013.9561%2016.2745%2014.7136%2015.0735%2014.7136H6.83825C5.72305%2014.7136%204.69364%2013.8719%204.52207%2012.7776L3.49266%205.79108L3.2353%203.85506C3.14952%203.35001%202.7206%203.01331%202.12011%203.01331H1.51962C1.17648%203.01331%200.833344%202.6766%200.833344%202.3399C0.833344%202.0032%201.17648%201.6665%201.51962%201.6665H2.12011C3.32109%201.6665%204.3505%202.50825%204.43628%203.68671L4.60785%205.03351H16.7892C17.2181%205.03351%2017.6471%205.20186%2017.9044%205.53856C18.2476%205.87526%2018.3333%206.38031%2018.3333%206.80118Z'%20fill='%23CFB28C'/%3e%3cpath%20d='M15.2451%2018.3332C15.7189%2018.3332%2016.103%2017.9563%2016.103%2017.4914C16.103%2017.0265%2015.7189%2016.6497%2015.2451%2016.6497C14.7713%2016.6497%2014.3873%2017.0265%2014.3873%2017.4914C14.3873%2017.9563%2014.7713%2018.3332%2015.2451%2018.3332Z'%20fill='%23CFB28C'/%3e%3cpath%20d='M6.66668%2018.3332C7.14045%2018.3332%207.52452%2017.9563%207.52452%2017.4914C7.52452%2017.0265%207.14045%2016.6497%206.66668%2016.6497C6.1929%2016.6497%205.80883%2017.0265%205.80883%2017.4914C5.80883%2017.9563%206.1929%2018.3332%206.66668%2018.3332Z'%20fill='%23CFB28C'/%3e%3c/svg%3e",
	user: "data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.0001%209.82977C12.2659%209.82977%2014.1026%208.00236%2014.1026%205.74814C14.1026%203.49391%2012.2659%201.6665%2010.0001%201.6665C7.73429%201.6665%205.89751%203.49391%205.89751%205.74814C5.89751%208.00236%207.73429%209.82977%2010.0001%209.82977Z'%20fill='%23CFB28C'/%3e%3cpath%20d='M12.1368%2011.5305H7.86332C5.38469%2011.5305%203.3334%2013.5713%203.3334%2016.0373C3.3334%2016.6326%203.58981%2017.1428%204.10264%2017.3979C4.87187%2017.823%206.58127%2018.3332%2010.0001%2018.3332C13.4189%2018.3332%2015.1283%2017.823%2015.8975%2017.3979C16.3249%2017.1428%2016.6667%2016.6326%2016.6667%2016.0373C16.6667%2013.4863%2014.6155%2011.5305%2012.1368%2011.5305Z'%20fill='%23CFB28C'/%3e%3c/svg%3e",
	search: "data:image/svg+xml,%3csvg%20width='22'%20height='22'%20viewBox='0%200%2022%2022'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M10.5299%203.24375C6.50501%203.24375%203.24358%206.50259%203.24358%2010.5209C3.24358%2014.5391%206.50501%2017.798%2010.5299%2017.798C12.5379%2017.798%2014.3549%2016.9877%2015.6735%2015.6752C16.998%2014.3567%2017.8162%2012.5348%2017.8162%2010.5209C17.8162%206.50259%2014.5548%203.24375%2010.5299%203.24375ZM1.83332%2010.5209C1.83332%205.72219%205.72768%201.8335%2010.5299%201.8335C15.3321%201.8335%2019.2265%205.72219%2019.2265%2010.5209C19.2265%2012.6708%2018.444%2014.6391%2017.1493%2016.1555L19.9598%2018.9628C20.2354%2019.238%2020.2356%2019.6845%2019.9604%2019.96C19.6852%2020.2355%2019.2387%2020.2358%2018.9632%2019.9606L16.15%2017.1506C14.6346%2018.4337%2012.6722%2019.2082%2010.5299%2019.2082C5.72768%2019.2082%201.83332%2015.3195%201.83332%2010.5209Z'%20fill-rule='evenodd'%20clip-rule='evenodd'%20fill='%23B39463'/%3e%3c/svg%3e",
	message: "data:image/svg+xml,%3csvg%20width='18'%20height='18'%20viewBox='0%200%2018%2018'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M9%204.09091C7.30168%204.09091%204.98846%204.2365%203.51951%204.34356C3.03167%204.37911%202.65385%204.76529%202.65385%205.23696V5.76996L8.53304%208.85802C8.82344%209.01056%209.17656%209.01056%209.46697%208.85802L15.3462%205.76996V5.23696C15.3462%204.76529%2014.9683%204.37911%2014.4805%204.34356C13.0115%204.2365%2010.6983%204.09091%209%204.09091ZM15.3462%207.01792L10.0273%209.81165C9.38843%2010.1472%208.61157%2010.1472%207.97268%209.81165L2.65385%207.01792V12.763C2.65385%2013.2347%203.03167%2013.6209%203.51951%2013.6564C4.98846%2013.7635%207.30168%2013.9091%209%2013.9091C10.6983%2013.9091%2013.0115%2013.7635%2014.4805%2013.6564C14.9683%2013.6209%2015.3462%2013.2347%2015.3462%2012.763V7.01792ZM3.43083%203.25588C4.90066%203.14876%207.25301%203%209%203C10.747%203%2013.0993%203.14876%2014.5692%203.25588C15.6676%203.33593%2016.5%204.20441%2016.5%205.23696V12.763C16.5%2013.7956%2015.6676%2014.6641%2014.5692%2014.7441C13.0993%2014.8512%2010.747%2015%209%2015C7.25301%2015%204.90066%2014.8512%203.43083%2014.7441C2.33237%2014.6641%201.5%2013.7956%201.5%2012.763V5.23696C1.5%204.20441%202.33237%203.33593%203.43083%203.25588Z'%20fill-rule='evenodd'%20clip-rule='evenodd'%20fill='%23F5F1EB'/%3e%3c/svg%3e",
	x: "data:image/svg+xml,%3csvg%20width='18'%20height='18'%20viewBox='0%200%2018%2018'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M3.17007%203.17007C3.39682%202.94331%203.76447%202.94331%203.99122%203.17007L9%208.17884L14.0088%203.17007C14.2355%202.94331%2014.6032%202.94331%2014.8299%203.17007C15.0567%203.39682%2015.0567%203.76447%2014.8299%203.99122L9.82116%209L14.8299%2014.0088C15.0567%2014.2355%2015.0567%2014.6032%2014.8299%2014.8299C14.6032%2015.0567%2014.2355%2015.0567%2014.0088%2014.8299L9%209.82116L3.99122%2014.8299C3.76447%2015.0567%203.39682%2015.0567%203.17007%2014.8299C2.94331%2014.6032%202.94331%2014.2355%203.17007%2014.0088L8.17884%209L3.17007%203.99122C2.94331%203.76447%202.94331%203.39682%203.17007%203.17007Z'%20fill-rule='evenodd'%20clip-rule='evenodd'%20fill='%23D28A4C'/%3e%3c/svg%3e",
	arrowDown: "data:image/svg+xml,%3csvg%20width='20'%20height='20'%20viewBox='0%200%2020%2020'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M15.4419%207.89155C15.686%208.13563%2015.686%208.53136%2015.4419%208.77544L10.4419%2013.7754C10.1979%2014.0195%209.80214%2014.0195%209.55806%2013.7754L4.55806%208.77544C4.31398%208.53136%204.31398%208.13563%204.55806%207.89155C4.80214%207.64748%205.19786%207.64748%205.44194%207.89155L10%2012.4496L14.5581%207.89155C14.8021%207.64748%2015.1979%207.64748%2015.4419%207.89155Z'%20fill-rule='evenodd'%20clip-rule='evenodd'%20fill='%23F5F1EB'/%3e%3c/svg%3e"
};
function BrandIcon({ name, className }) {
	const url = `url("${ICONS[name]}")`;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		"aria-hidden": "true",
		className: cn("icon-mask size-5 shrink-0", className),
		style: {
			maskImage: url,
			WebkitMaskImage: url
		}
	});
}
var DropdownMenu = DropdownMenu$1;
var DropdownMenuTrigger = DropdownMenuTrigger$1;
var DropdownMenuSubTrigger = import_react.forwardRef(({ className, inset, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuSubTrigger$1, {
	ref,
	className: cn("flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", inset && "pl-8", className),
	...props,
	children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "ml-auto" })]
}));
DropdownMenuSubTrigger.displayName = DropdownMenuSubTrigger$1.displayName;
var DropdownMenuSubContent = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuSubContent$1, {
	ref,
	className: cn("z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-dropdown-menu-content-transform-origin)", className),
	...props
}));
DropdownMenuSubContent.displayName = DropdownMenuSubContent$1.displayName;
var DropdownMenuContent = import_react.forwardRef(({ className, sideOffset = 4, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuPortal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuContent$1, {
	ref,
	sideOffset,
	className: cn("z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md", "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-dropdown-menu-content-transform-origin)", className),
	...props
}) }));
DropdownMenuContent.displayName = DropdownMenuContent$1.displayName;
var DropdownMenuItem = import_react.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem$1, {
	ref,
	className: cn("relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0", inset && "pl-8", className),
	...props
}));
DropdownMenuItem.displayName = DropdownMenuItem$1.displayName;
var DropdownMenuCheckboxItem = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuCheckboxItem$1, {
	ref,
	className: cn("relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className),
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItemIndicator, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" }) })
	}), children]
}));
DropdownMenuCheckboxItem.displayName = DropdownMenuCheckboxItem$1.displayName;
var DropdownMenuRadioItem = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuRadioItem$1, {
	ref,
	className: cn("relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className),
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItemIndicator, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Circle, { className: "h-2 w-2 fill-current" }) })
	}), children]
}));
DropdownMenuRadioItem.displayName = DropdownMenuRadioItem$1.displayName;
var DropdownMenuLabel = import_react.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuLabel$1, {
	ref,
	className: cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className),
	...props
}));
DropdownMenuLabel.displayName = DropdownMenuLabel$1.displayName;
var DropdownMenuSeparator = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuSeparator$1, {
	ref,
	className: cn("-mx-1 my-1 h-px bg-muted", className),
	...props
}));
DropdownMenuSeparator.displayName = DropdownMenuSeparator$1.displayName;
var DropdownMenuShortcut = ({ className, ...props }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("ml-auto text-xs tracking-widest opacity-60", className),
		...props
	});
};
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";
var NAV = [
	{
		to: "/",
		label: "Início"
	},
	{
		to: "/cart",
		label: "Carrinho"
	},
	{
		to: "/account/profile",
		label: "Perfil"
	},
	{
		to: "/account/wallets",
		label: "Carteiras"
	}
];
function SiteHeader() {
	const count = useCart().data?.items.reduce((n, c) => n + c.quantity, 0) ?? 0;
	const { user } = useSession();
	const { logout } = useAuthActions();
	const navigate = useNavigate();
	const [q, setQ] = (0, import_react.useState)("");
	const onSearch = (e) => {
		e.preventDefault();
		navigate({
			to: "/",
			search: { q: q || void 0 }
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
		className: "sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Sheet, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTrigger, {
					asChild: true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon",
						className: "md:hidden",
						"aria-label": "Abrir menu",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, {})
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
					side: "left",
					className: "w-72",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTitle, {
						className: "font-display text-primary",
						children: "KURIO"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
						"aria-label": "Menu principal",
						className: "mt-6 flex flex-col gap-1",
						children: NAV.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: n.to,
							className: "rounded px-3 py-2 text-sm hover:bg-secondary",
							activeProps: { className: "text-primary" },
							activeOptions: { exact: true },
							children: n.label
						}, n.to))
					})]
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/",
					className: "font-display text-lg font-bold tracking-widest text-foreground",
					children: "KURIO"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
					"aria-label": "Principal",
					className: "ml-6 hidden items-center gap-6 md:flex",
					children: NAV.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: n.to,
						className: "border-b-2 border-transparent py-1 text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground",
						activeProps: { className: "!border-primary !text-primary" },
						activeOptions: { exact: true },
						children: n.label
					}, n.to))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					role: "search",
					onSubmit: onSearch,
					className: "ml-auto hidden min-w-0 sm:block",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						htmlFor: "header-search",
						className: "sr-only",
						children: "Buscar NFTs"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 rounded border border-input bg-surface px-3 focus-within:ring-2 focus-within:ring-ring",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrandIcon, {
							name: "search",
							className: "size-4 text-muted-foreground"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							id: "header-search",
							value: q,
							onChange: (e) => setQ(e.target.value),
							placeholder: "Buscar NFTs, coleções…",
							className: "h-9 w-40 bg-transparent text-xs outline-none placeholder:text-muted-foreground lg:w-56"
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "ml-auto flex items-center gap-1 sm:ml-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon",
						asChild: true,
						className: "relative",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/cart",
							"aria-label": `Carrinho, ${count} itens`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrandIcon, {
								name: "shop",
								className: "text-sand"
							}), count > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground",
								children: count
							})]
						})
					}), user ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenu, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuTrigger, {
						asChild: true,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							size: "icon",
							"aria-label": "Menu da conta",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrandIcon, {
								name: "user",
								className: "text-primary"
							})
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuContent, {
						align: "end",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
								asChild: true,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/account/profile",
									children: "Meu perfil"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
								asChild: true,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/account/wallets",
									children: "Carteiras"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
								onSelect: () => {
									logout().then(() => navigate({ to: "/" }));
								},
								children: "Sair"
							})
						]
					})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						onClick: () => actions.openAuth("login"),
						className: "text-xs uppercase",
						children: "Entrar"
					})]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			role: "search",
			onSubmit: onSearch,
			className: "px-4 pb-3 sm:hidden",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
				htmlFor: "header-search-m",
				className: "sr-only",
				children: "Buscar NFTs"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2 rounded border border-input bg-surface px-3 focus-within:ring-2 focus-within:ring-ring",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrandIcon, {
					name: "search",
					className: "size-4 text-muted-foreground"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					id: "header-search-m",
					value: q,
					onChange: (e) => setQ(e.target.value),
					placeholder: "Buscar NFTs…",
					className: "h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
				})]
			})]
		})]
	});
}
var FEATURES = [
	{
		icon: ShieldCheck,
		title: "Segurança de carteira",
		text: "Transações assinadas localmente, sem custódia das suas chaves."
	},
	{
		icon: Sparkles,
		title: "Criadores em destaque",
		text: "Curadoria semanal com artistas digitais independentes."
	},
	{
		icon: Bell,
		title: "Alertas de lançamentos",
		text: "Seja avisado quando novas edições limitadas forem lançadas."
	}
];
function SiteFooter() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
		className: "mt-20 border-t border-border bg-surface",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-2 lg:grid-cols-4",
				children: [FEATURES.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "grid size-9 place-items-center rounded-full bg-primary text-primary-foreground",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(f.icon, {
							className: "size-4",
							"aria-hidden": "true"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "mt-3 text-sm font-bold",
						children: f.title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs leading-relaxed text-muted-foreground",
						children: f.text
					})
				] }, f.title)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit: (e) => {
						e.preventDefault();
						toast.success("Inscrição confirmada!");
						e.currentTarget.reset();
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-sm font-bold",
						children: "Cadastre-se nas próximas temporadas"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								htmlFor: "newsletter",
								className: "sr-only",
								children: "E-mail"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "newsletter",
								type: "email",
								required: true,
								placeholder: "seu@email.com"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "submit",
								children: "Assinar"
							})
						]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "bg-band",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 text-xs text-sand sm:flex-row sm:justify-between sm:px-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-display font-bold tracking-widest text-foreground",
							children: "KURIO"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "contato@kurio.art" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Seg–Sex · 9h às 18h" })
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 text-xs sm:px-6 md:grid-cols-4",
				children: [
					["Meu perfil", [
						["/account/profile", "Editar perfil"],
						["/account/wallets", "Carteiras"],
						["/cart", "Carrinho"]
					]],
					["Central de ajuda", [
						["/", "Como comprar"],
						["/", "Taxas de rede"],
						["/", "Suporte"]
					]],
					["Coleções", [
						["/", "Emerald Apes"],
						["/", "Velvet Hoods"],
						["/", "Golden Tunes"]
					]],
					["Redes sociais", [
						["/", "Discord"],
						["/", "X / Twitter"],
						["/", "Instagram"]
					]]
				].map(([title, links]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
					"aria-label": title,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "mb-2 font-bold text-foreground",
						children: title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "space-y-1.5 text-muted-foreground",
						children: links.map(([to, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to,
							className: "hover:text-primary",
							children: label
						}) }, label))
					})]
				}, title))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "border-t border-border py-4 text-center text-[11px] text-muted-foreground",
				children: "© 2026 Kurio. Marketplace de arte digital."
			})
		]
	});
}
var Toaster$1 = ({ ...props }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
		className: "toaster group",
		toastOptions: { classNames: {
			toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
			description: "group-[.toast]:text-muted-foreground",
			actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
			cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
		} },
		...props
	});
};
var nftListeners = /* @__PURE__ */ new Set();
function createRealtime(queryClient) {
	let socket = null;
	let disposed = false;
	const seen = /* @__PURE__ */ new Set();
	const versions = /* @__PURE__ */ new Map();
	const accept = (e) => {
		if (seen.has(e.eventId)) return false;
		seen.add(e.eventId);
		const k = `${e.resource.type}:${e.resource.id}`;
		if ((versions.get(k) ?? 0) >= e.version) return false;
		versions.set(k, e.version);
		return true;
	};
	const onNft = (e) => {
		const current = queryClient.getQueryData(keys.nft(e.data.id));
		if (current && current.version >= e.version) return;
		if (!accept(e)) return;
		const patch = (n) => n.id === e.data.id && n.version < e.version ? {
			...n,
			...e.data
		} : n;
		queryClient.setQueryData(keys.nft(e.data.id), (n) => n ? patch(n) : n);
		queryClient.setQueriesData({ queryKey: ["nfts", "list"] }, (p) => p ? {
			...p,
			items: p.items.map(patch)
		} : p);
		queryClient.setQueriesData({ queryKey: ["nfts", "featured"] }, (l) => l?.map(patch));
		const item = queryClient.getQueriesData({ queryKey: ["cart"] }).flatMap(([, c]) => c?.items ?? []).find((i) => i.nftId === e.data.id);
		if (item) {
			const changed = item.unitPrice !== e.data.price;
			toast.info(changed ? `O preço de ${item.name} mudou para ${formatEth(e.data.price)}.` : `A disponibilidade de ${item.name} mudou: ${e.data.available} restantes.`, { id: `nft-${e.data.id}` });
			queryClient.invalidateQueries({ queryKey: ["cart"] });
		}
		nftListeners.forEach((l) => l(e));
	};
	const onOrder = (e) => {
		if (!accept(e)) return;
		queryClient.setQueriesData({ queryKey: ["order"] }, (o) => o && o.id === e.data.id && o.version < e.version ? {
			...o,
			...e.data
		} : o);
		queryClient.invalidateQueries({ queryKey: ["order"] });
		queryClient.invalidateQueries({ queryKey: ["orders"] });
		if (e.data.status === "confirmed") queryClient.invalidateQueries({ queryKey: ["cart"] });
	};
	ensureMocks().then(() => {
		if (disposed) return;
		socket = lookup({
			"BASE_URL": "/",
			"DEV": false,
			"MODE": "production",
			"PROD": true,
			"SSR": true,
			"TSS_DEV_SERVER": "false",
			"TSS_DEV_SSR_STYLES_BASEPATH": "/",
			"TSS_DEV_SSR_STYLES_ENABLED": "true",
			"TSS_DISABLE_CSRF_MIDDLEWARE_WARNING": "false",
			"TSS_INLINE_CSS_ENABLED": "false",
			"TSS_ROUTER_BASEPATH": "",
			"TSS_SERVER_FN_BASE": "/_serverFn/",
			"VITE_ENABLE_MOCKS": "false",
			"VITE_SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mZ3ZlY2p0cnlxY3NkanN5bHZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM4MTE4MjAsImV4cCI6MjEwOTM4NzgyMH0.LRXk7tnl_tev2jQOfV9PwdfDZ8IhWPhMOTQYJL8ourk",
			"VITE_SUPABASE_URL": "https://nfgvecjtryqcsdjsylva.supabase.co"
		}["VITE_SOCKET_URL"] ?? window.location.origin, {
			transports: ["websocket"],
			reconnectionDelay: 500,
			reconnectionDelayMax: 2e3
		});
		let connectedOnce = false;
		socket.on("connect", () => {
			socket?.emit("session", getToken());
			if (connectedOnce) queryClient.invalidateQueries({ type: "active" });
			connectedOnce = true;
		});
		socket.on("nft.updated", onNft);
		socket.on("order.updated", onOrder);
	});
	return () => {
		disposed = true;
		socket?.removeAllListeners();
		socket?.disconnect();
		socket = null;
	};
}
var ITEMS = [
	{
		to: "/",
		label: "Início",
		icon: House
	},
	{
		to: "/favorites",
		label: "Favoritos",
		icon: Heart
	},
	{
		to: "/cart",
		label: "Carrinho",
		icon: ShoppingBag
	},
	{
		to: "/account/wallets",
		label: "Carteiras",
		icon: Wallet
	},
	{
		to: "/account/profile",
		label: "Perfil",
		icon: User
	}
];
function MobileNav() {
	const count = useCart().data?.items.reduce((n, c) => n + c.quantity, 0) ?? 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
		"aria-label": "Navegação inferior",
		className: "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "grid grid-cols-5",
			children: ITEMS.map(({ to, label, icon: Icon }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to,
				activeOptions: { exact: to === "/" },
				className: "relative flex flex-col items-center gap-1 py-2.5 text-[10px] uppercase text-muted-foreground",
				activeProps: {
					className: "!text-primary",
					"aria-current": "page"
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
						className: "size-5",
						"aria-hidden": true
					}),
					label,
					to === "/cart" && count > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "absolute right-[22%] top-1.5 grid size-4 place-items-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground",
						"aria-label": `${count} itens`,
						children: count
					})
				]
			}) }, to))
		})
	});
}
function NotFoundComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-[60vh] items-center justify-center px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-7xl font-bold text-primary",
					children: "404"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-4 text-xl font-semibold",
					children: "Página não encontrada"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Esta página não existe ou foi movida."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/",
					className: "mt-6 inline-flex rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground",
					children: "Voltar ao início"
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	console.error(error);
	const router = useRouter();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-[60vh] items-center justify-center px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold",
					children: "Esta página não carregou"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Algo deu errado. Tente novamente."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => {
						router.invalidate();
						reset();
					},
					className: "mt-6 rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground",
					children: "Tentar novamente"
				})
			]
		})
	});
}
var Route$5 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "Kurio — Marketplace de NFTs" },
			{
				name: "description",
				content: "Compre edições limitadas de arte digital na Kurio."
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			}
		],
		links: [
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Space+Mono:wght@400;700&display=swap"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "icon",
				href: "/favicon.svg",
				type: "image/svg+xml"
			}
		]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "pt-BR",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})] })]
	});
}
function RootComponent() {
	const { queryClient } = Route$5.useRouteContext();
	(0, import_react.useEffect)(() => createRealtime(queryClient), [queryClient]);
	(0, import_react.useEffect)(() => onSessionChange((reason) => {
		if (reason !== "expired") return;
		queryClient.clear();
		toast.warning("Sua sessão expirou. Entre novamente.");
		actions.openAuth("login");
	}), [queryClient]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(QueryClientProvider, {
		client: queryClient,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
				href: "#main",
				className: "sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground",
				children: "Pular para o conteúdo"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteHeader, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				id: "main",
				className: "min-h-[60vh] pb-20 md:pb-0",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteFooter, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MobileNav, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthDialog, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster$1, { position: "bottom-right" })
		]
	});
}
var $$splitComponentImporter$4 = () => import("./cart-Chy5eMYg.mjs");
var Route$4 = createFileRoute("/cart")({
	head: () => ({ meta: [
		{ title: "Carrinho — Kurio" },
		{
			name: "description",
			content: "Revise os NFTs no seu carrinho, aplique cupons e siga para o checkout."
		},
		{
			property: "og:title",
			content: "Carrinho — Kurio"
		},
		{
			property: "og:description",
			content: "Seu carrinho de NFTs."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
var $$splitComponentImporter$3 = () => import("./checkout-DMuxxgkK.mjs");
var Route$3 = createFileRoute("/checkout")({
	head: () => ({ meta: [
		{ title: "Checkout — Kurio" },
		{
			name: "description",
			content: "Escolha a rede e a carteira para finalizar a compra dos seus NFTs."
		},
		{
			property: "og:title",
			content: "Checkout — Kurio"
		},
		{
			property: "og:description",
			content: "Finalize a compra dos seus NFTs."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
var $$splitComponentImporter$2 = () => import("./favorites-C7hFgtq2.mjs");
var Route$2 = createFileRoute("/favorites")({
	head: () => ({ meta: [
		{ title: "Favoritos — Kurio" },
		{
			name: "description",
			content: "Os NFTs que você salvou como favoritos na Kurio."
		},
		{
			property: "og:title",
			content: "Favoritos — Kurio"
		},
		{
			property: "og:description",
			content: "Seus NFTs favoritos."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
var $$splitComponentImporter$1 = () => import("./account.profile-GwpJTWWk.mjs");
var Route$1 = createFileRoute("/account/profile")({
	head: () => ({ meta: [
		{ title: "Meu perfil — Kurio" },
		{
			name: "description",
			content: "Edite seus dados de colecionador e veja seu histórico de pedidos."
		},
		{
			property: "og:title",
			content: "Meu perfil — Kurio"
		},
		{
			property: "og:description",
			content: "Perfil do colecionador."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
var $$splitComponentImporter = () => import("./account.wallets-C3Zr2VrO.mjs");
var Route = createFileRoute("/account/wallets")({
	head: () => ({ meta: [
		{ title: "Minhas carteiras — Kurio" },
		{
			name: "description",
			content: "Adicione, edite e remova as carteiras usadas nas suas compras."
		},
		{
			property: "og:title",
			content: "Minhas carteiras — Kurio"
		},
		{
			property: "og:description",
			content: "Gerencie suas carteiras."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
var rootRouteChildren = {
	IndexRoute: Route$8.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$5
	}),
	CartRoute: Route$4.update({
		id: "/cart",
		path: "/cart",
		getParentRoute: () => Route$5
	}),
	CheckoutRoute: Route$3.update({
		id: "/checkout",
		path: "/checkout",
		getParentRoute: () => Route$5
	}),
	FavoritesRoute: Route$2.update({
		id: "/favorites",
		path: "/favorites",
		getParentRoute: () => Route$5
	}),
	AccountProfileRoute: Route$1.update({
		id: "/account/profile",
		path: "/account/profile",
		getParentRoute: () => Route$5
	}),
	AccountWalletsRoute: Route.update({
		id: "/account/wallets",
		path: "/account/wallets",
		getParentRoute: () => Route$5
	}),
	NftIdRoute: Route$6.update({
		id: "/nft/$id",
		path: "/nft/$id",
		getParentRoute: () => Route$5
	}),
	OrderIdRoute: Route$7.update({
		id: "/order/$id",
		path: "/order/$id",
		getParentRoute: () => Route$5
	})
};
var routeTree = Route$5._addFileChildren(rootRouteChildren)._addFileTypes();
var getRouter = () => {
	const queryClient = new QueryClient();
	return createRouter({
		routeTree,
		context: { queryClient },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { getRouter };
