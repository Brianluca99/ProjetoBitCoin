import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { S as useHydrated } from "../_libs/@tanstack/react-router+[...].mjs";
import { p as require_jsx_runtime, u as Slot } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
import { n as queryOptions, o as useQueryClient, r as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { t as axios } from "../_libs/axios+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/client-api-DIF2XgCD.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", {
	variants: {
		variant: {
			default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
			destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
			outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
			secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
			ghost: "hover:bg-accent hover:text-accent-foreground",
			link: "text-primary underline-offset-4 hover:underline"
		},
		size: {
			default: "h-9 px-4 py-2",
			sm: "h-8 rounded-md px-3 text-xs",
			lg: "h-10 rounded-md px-8",
			icon: "h-9 w-9"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
var Button = import_react.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		ref,
		...props
	});
});
Button.displayName = "Button";
var authModal = null;
var listeners$1 = /* @__PURE__ */ new Set();
function useAuthModal() {
	return (0, import_react.useSyncExternalStore)((l) => {
		listeners$1.add(l);
		return () => listeners$1.delete(l);
	}, () => authModal, () => null);
}
var actions = { openAuth(mode) {
	authModal = mode;
	listeners$1.forEach((l) => l());
} };
var shortAddress = (a) => `${a.slice(0, 6)}…${a.slice(-4)}`;
var TOKEN_KEY = "kurio-session-token";
var GUEST_KEY = "kurio-guest-id";
var listeners = /* @__PURE__ */ new Set();
function getToken() {
	if (typeof window === "undefined") return null;
	return localStorage.getItem(TOKEN_KEY);
}
function setToken(token, reason) {
	if (token) localStorage.setItem(TOKEN_KEY, token);
	else localStorage.removeItem(TOKEN_KEY);
	listeners.forEach((l) => l(reason));
}
function getGuestId() {
	let id = localStorage.getItem(GUEST_KEY);
	if (!id) {
		id = crypto.randomUUID();
		localStorage.setItem(GUEST_KEY, id);
	}
	return id;
}
function onSessionChange(l) {
	listeners.add(l);
	return () => {
		listeners.delete(l);
	};
}
var ready = null;
function ensureMocks() {
	if (typeof window === "undefined") return Promise.resolve();
	if ({
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
	}["VITE_ENABLE_MOCKS"] === "false") return Promise.resolve();
	ready ??= import("./browser-BZG_nNBl.mjs").then((m) => m.startMocks());
	return ready;
}
var ApiError = class extends Error {
	status;
	code;
	fields;
	quote;
	constructor(status, code, message, fields = {}, quote) {
		super(message);
		this.status = status;
		this.code = code;
		this.fields = fields;
		this.quote = quote;
	}
};
var http = axios.create({
	baseURL: {
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
	}["VITE_API_URL"] ?? "/api",
	timeout: 5e3
});
http.interceptors.request.use(async (config) => {
	await ensureMocks();
	const token = getToken();
	if (token) config.headers.set("Authorization", `Bearer ${token}`);
	config.headers.set("X-Guest-Id", getGuestId());
	return config;
});
http.interceptors.response.use((r) => r, (error) => {
	if (axios.isCancel(error)) return Promise.reject(error);
	if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") return Promise.reject(new ApiError(0, "TRANSIENT", "A requisição demorou demais. Tentando de novo…"));
	const res = error.response;
	if (!res) return Promise.reject(new ApiError(0, "TRANSIENT", "Sem conexão com o servidor."));
	const b = res.data;
	if (res.status === 401 && getToken() && (b?.code === "SESSION_EXPIRED" || b?.code === "UNAUTHORIZED")) setToken(null, "expired");
	return Promise.reject(new ApiError(res.status, b?.code ?? "TRANSIENT", b?.message ?? "Erro inesperado.", b?.fields ?? {}, b?.quote));
});
var isTransient = (e) => e instanceof ApiError && (e.code === "TRANSIENT" || e.status >= 500);
var keys = {
	list: (f) => [
		"nfts",
		"list",
		f
	],
	featured: ["nfts", "featured"],
	nft: (id) => [
		"nfts",
		"detail",
		id
	],
	related: (id) => [
		"nfts",
		"related",
		id
	],
	session: (token) => ["session", token],
	cart: (scope) => ["cart", scope],
	favorites: (scope) => ["favorites", scope],
	wallets: (scope) => ["wallets", scope],
	me: (scope) => ["me", scope],
	orders: (scope) => ["orders", scope],
	order: (scope, id) => [
		"order",
		scope,
		id
	],
	quote: (scope, network) => [
		"quote",
		scope,
		network
	]
};
var api = {
	listNfts: (f, signal) => http.get("/nfts", {
		params: f,
		...signal ? { signal } : {},
		paramsSerializer: { indexes: null }
	}).then((r) => r.data),
	featured: (signal) => http.get("/nfts/featured", signal ? { signal } : {}).then((r) => r.data),
	nft: (id, signal) => http.get(`/nfts/${id}`, signal ? { signal } : {}).then((r) => r.data),
	related: (id, signal) => http.get(`/nfts/${id}/related`, signal ? { signal } : {}).then((r) => r.data),
	register: (b) => http.post("/auth/register", b).then((r) => r.data),
	login: (b) => http.post("/auth/login", b).then((r) => r.data),
	session: () => http.get("/auth/session").then((r) => r.data),
	logout: () => http.post("/auth/logout"),
	favorites: () => http.get("/favorites").then((r) => r.data),
	addFavorite: (id) => http.put(`/favorites/${id}`).then((r) => r.data),
	removeFavorite: (id) => http.delete(`/favorites/${id}`).then((r) => r.data),
	cart: () => http.get("/cart").then((r) => r.data),
	addToCart: (nftId, quantity) => http.post("/cart/items", {
		nftId,
		quantity
	}).then((r) => r.data),
	setQuantity: (nftId, quantity) => http.patch(`/cart/items/${nftId}`, { quantity }).then((r) => r.data),
	removeItem: (nftId) => http.delete(`/cart/items/${nftId}`).then((r) => r.data),
	applyCoupon: (code) => http.put("/cart/coupon", { code }).then((r) => r.data),
	removeCoupon: () => http.delete("/cart/coupon").then((r) => r.data),
	mergeCart: () => http.post("/cart/merge").then((r) => r.data),
	quote: (network) => http.post("/quote", { network }).then((r) => r.data),
	createOrder: (b, idempotencyKey) => http.post("/orders", b, { headers: { "Idempotency-Key": idempotencyKey } }).then((r) => r.data),
	orders: () => http.get("/orders").then((r) => r.data),
	order: (id) => http.get(`/orders/${id}`).then((r) => r.data),
	me: () => http.get("/me").then((r) => r.data),
	updateMe: (b) => http.put("/me", b).then((r) => r.data),
	updateAvatar: (dataUrl) => http.put("/me/avatar", { dataUrl }).then((r) => r.data),
	changePassword: (b) => http.put("/me/password", b),
	wallets: () => http.get("/wallets").then((r) => r.data),
	saveWallet: (w) => (w.id ? http.put(`/wallets/${w.id}`, w) : http.post("/wallets", w)).then((r) => r.data),
	connectWallet: (id) => http.post(`/wallets/${id}/connect`).then((r) => r.data),
	disconnectWallet: (id) => http.delete(`/wallets/${id}/connect`).then((r) => r.data)
};
var retry = (count, e) => isTransient(e) && count < 2;
var nftsQuery = (f) => queryOptions({
	queryKey: keys.list(f),
	queryFn: ({ signal }) => api.listNfts(f, signal),
	retry
});
var featuredQuery = () => queryOptions({
	queryKey: keys.featured,
	queryFn: ({ signal }) => api.featured(signal),
	retry
});
var nftQuery = (id) => queryOptions({
	queryKey: keys.nft(id),
	queryFn: ({ signal }) => api.nft(id, signal),
	retry: (c, e) => !(e instanceof ApiError && e.status === 404) && retry(c, e)
});
var relatedQuery = (id) => queryOptions({
	queryKey: keys.related(id),
	queryFn: ({ signal }) => api.related(id, signal),
	retry
});
function subscribeToken(cb) {
	return onSessionChange(cb);
}
function useToken() {
	return (0, import_react.useSyncExternalStore)(subscribeToken, getToken, () => null);
}
function useScope() {
	const token = useToken();
	const hydrated = useHydrated();
	return {
		scope: token ?? "guest",
		ready: hydrated,
		authed: !!token
	};
}
function useSession() {
	const token = useToken();
	const hydrated = useHydrated();
	const q = useQuery({
		queryKey: keys.session(token),
		queryFn: api.session,
		enabled: hydrated && !!token,
		staleTime: 6e4,
		retry
	});
	return {
		user: q.data?.user ?? null,
		isLoading: hydrated ? !!token && q.isLoading : true,
		token
	};
}
function useCart() {
	const { scope, ready } = useScope();
	return useQuery({
		queryKey: keys.cart(scope),
		queryFn: api.cart,
		enabled: ready,
		retry
	});
}
function useCartMutation(fn) {
	const qc = useQueryClient();
	const { scope } = useScope();
	return useMutation({
		mutationFn: fn,
		onSuccess: (data) => qc.setQueryData(keys.cart(scope), data)
	});
}
var useAddToCart = () => useCartMutation((v) => api.addToCart(v.nftId, v.quantity));
var useSetQuantity = () => useCartMutation((v) => api.setQuantity(v.nftId, v.quantity));
var useRemoveItem = () => useCartMutation((nftId) => api.removeItem(nftId));
var useApplyCoupon = () => useCartMutation((code) => api.applyCoupon(code));
var useRemoveCoupon = () => useCartMutation(() => api.removeCoupon());
function useFavorites() {
	const { scope, ready, authed } = useScope();
	return useQuery({
		queryKey: keys.favorites(scope),
		queryFn: api.favorites,
		enabled: ready && authed,
		retry
	});
}
function useToggleFavorite() {
	const qc = useQueryClient();
	const { scope } = useScope();
	const key = keys.favorites(scope);
	return useMutation({
		mutationFn: ({ id, fav }) => fav ? api.removeFavorite(id) : api.addFavorite(id),
		onMutate: async ({ id, fav }) => {
			await qc.cancelQueries({ queryKey: key });
			const prev = qc.getQueryData(key);
			qc.setQueryData(key, (l = []) => fav ? l.filter((x) => x !== id) : [...l, id]);
			return { prev };
		},
		onError: (_e, _v, ctx) => qc.setQueryData(key, ctx?.prev),
		onSettled: () => qc.invalidateQueries({ queryKey: key })
	});
}
function useAuthActions() {
	const qc = useQueryClient();
	const finish = async (s) => {
		await qc.cancelQueries();
		setToken(s.token, "login");
		qc.setQueryData(keys.session(s.token), s);
		const cart = await api.mergeCart().catch(() => null);
		if (cart) qc.setQueryData(keys.cart(s.token), cart);
		return s;
	};
	const login = useMutation({ mutationFn: (b) => api.login(b).then(finish) });
	const register = useMutation({ mutationFn: (b) => api.register(b).then(finish) });
	const logout = async () => {
		await qc.cancelQueries();
		await api.logout().catch(() => null);
		setToken(null, "logout");
		qc.clear();
	};
	return {
		login,
		register,
		logout
	};
}
function useMe() {
	const { scope, ready, authed } = useScope();
	return useQuery({
		queryKey: keys.me(scope),
		queryFn: api.me,
		enabled: ready && authed,
		retry
	});
}
function useUpdateMe() {
	const qc = useQueryClient();
	const { scope } = useScope();
	return useMutation({
		mutationFn: api.updateMe,
		onSuccess: (u) => {
			qc.setQueryData(keys.me(scope), u);
			qc.invalidateQueries({ queryKey: ["session"] });
		}
	});
}
function useWallets() {
	const { scope, ready, authed } = useScope();
	return useQuery({
		queryKey: keys.wallets(scope),
		queryFn: api.wallets,
		enabled: ready && authed,
		retry
	});
}
function useWalletMutations() {
	const qc = useQueryClient();
	const { scope } = useScope();
	const refresh = () => qc.invalidateQueries({ queryKey: keys.wallets(scope) });
	return {
		save: useMutation({
			mutationFn: api.saveWallet,
			onSuccess: refresh
		}),
		connect: useMutation({
			mutationFn: api.connectWallet,
			onSettled: refresh
		}),
		disconnect: useMutation({
			mutationFn: api.disconnectWallet,
			onSettled: refresh
		})
	};
}
function useOrders() {
	const { scope, ready, authed } = useScope();
	return useQuery({
		queryKey: keys.orders(scope),
		queryFn: api.orders,
		enabled: ready && authed,
		retry
	});
}
function useOrder(id) {
	const { scope, ready, authed } = useScope();
	return useQuery({
		queryKey: keys.order(scope, id),
		queryFn: () => api.order(id),
		enabled: ready && authed,
		retry: (c, e) => !(e instanceof ApiError && (e.status === 404 || e.status === 403)) && retry(c, e)
	});
}
function useCreateOrder() {
	const qc = useQueryClient();
	const { scope } = useScope();
	return useMutation({
		mutationFn: ({ body, key }) => api.createOrder(body, key),
		retry: (count, e) => isTransient(e) && count < 3,
		retryDelay: 400,
		onSuccess: (o) => {
			qc.setQueryData(keys.order(scope, o.id), o);
			qc.invalidateQueries({ queryKey: keys.orders(scope) });
		}
	});
}
//#endregion
export { useToggleFavorite as A, useOrder as C, useScope as D, useRemoveItem as E, useWalletMutations as M, useWallets as N, useSession as O, useMe as S, useRemoveCoupon as T, useAuthActions as _, cn as a, useCreateOrder as b, getToken as c, nftsQuery as d, onSessionChange as f, useApplyCoupon as g, useAddToCart as h, api as i, useUpdateMe as j, useSetQuantity as k, keys as l, shortAddress as m, Button as n, ensureMocks as o, relatedQuery as p, actions as r, featuredQuery as s, ApiError as t, nftQuery as u, useAuthModal as v, useOrders as w, useFavorites as x, useCart as y };
