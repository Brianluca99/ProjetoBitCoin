import { a as percentOf, i as mulEth, n as compareEth, o as subEth, t as addEth } from "./decimal-BK8KOg9S.mjs";
import { t as toSocketIo } from "../_libs/@mswjs/socket.io-binding+[...].mjs";
import { a as NETWORK_FEES, i as FIXTURE_WALLETS, n as COUPONS, r as FIXTURE_USERS, s as buildNfts } from "./fixtures-CAOBEri7.mjs";
import { a as HttpResponse, i as setupWorker, n as ws, r as http, t as delay } from "../_libs/msw+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/browser-BZG_nNBl.js
var KEY$1 = "kurio-mock-db-v2";
function hashPassword(password, salt) {
	let h = 14695981039346656037n;
	for (const ch of `${salt}:${password}`) {
		h ^= BigInt(ch.codePointAt(0));
		h = h * 1099511628211n & 18446744073709551615n;
	}
	return `fnv1a$${salt}$${h.toString(16)}`;
}
var verifyPassword = (password, stored) => hashPassword(password, stored.split("$")[1] ?? "") === stored;
function seed() {
	return {
		nfts: buildNfts(),
		users: FIXTURE_USERS.map(({ password, ...u }) => ({
			...u,
			passwordHash: hashPassword(password, u.id)
		})),
		sessions: {},
		carts: {},
		favorites: { "u-ana": ["nft-2"] },
		wallets: structuredClone(FIXTURE_WALLETS),
		connectedWallet: {},
		quotes: {},
		orders: [],
		seq: 1e3,
		flags: {}
	};
}
var db = null;
function getDb() {
	if (db) return db;
	try {
		const raw = localStorage.getItem(KEY$1);
		db = raw ? JSON.parse(raw) : seed();
	} catch {
		db = seed();
	}
	return db;
}
function saveDb() {
	if (db) localStorage.setItem(KEY$1, JSON.stringify(db));
}
function resetDb() {
	db = seed();
	saveDb();
}
function nextId(prefix) {
	const d = getDb();
	d.seq += 1;
	return `${prefix}-${d.seq}`;
}
function checkCoupon(raw) {
	const code = raw.trim().toUpperCase();
	const c = COUPONS[code];
	if (!c) return {
		ok: false,
		code: "COUPON_INVALID",
		message: "Cupom inválido."
	};
	if (c.expired) return {
		ok: false,
		code: "COUPON_EXPIRED",
		message: "Este cupom expirou."
	};
	return {
		ok: true,
		code,
		basisPoints: c.basisPoints
	};
}
function computeTotals(lines, coupon, network) {
	const subtotal = addEth("0", ...lines.map((l) => mulEth(l.unitPrice, l.quantity)));
	const check = coupon ? checkCoupon(coupon) : null;
	const discount = check?.ok ? percentOf(subtotal, check.basisPoints) : "0";
	const networkFee = compareEth(subtotal, "0") === 0 ? "0" : NETWORK_FEES[network];
	return {
		subtotal,
		discount,
		networkFee,
		total: addEth(subEth(subtotal, discount), networkFee)
	};
}
var SCENARIOS = {
	default: "Sucesso com latência normal",
	empty: "Catálogo vazio",
	slow: "Rede lenta (2,5 s por requisição)",
	"variable-latency": "Latência variável e respostas fora de ordem",
	offline: "Sem conexão (falha de rede)",
	"server-error": "Erro 500 nas consultas do catálogo",
	"session-expired": "Sessão expira 20 s após o login",
	"favorites-fail": "Falha ao salvar favoritos (rollback)",
	"price-change": "Preço muda com o carrinho aberto",
	"sold-out": "Edição esgota durante a compra",
	"order-timeout": "Timeout após criar o pedido (idempotência)",
	"payment-declined": "Pagamento recusado",
	"wallet-reject": "Carteira recusa a conexão",
	"duplicate-events": "Eventos Socket.IO duplicados e antigos"
};
var KEY = "kurio-mock-scenario";
function getScenario() {
	if (typeof window === "undefined") return "default";
	const v = localStorage.getItem(KEY);
	return v && v in SCENARIOS ? v : "default";
}
function setScenario(name) {
	localStorage.setItem(KEY, name);
}
function readScenarioFromUrl() {
	const v = new URL(window.location.href).searchParams.get("scenario");
	if (v && v in SCENARIOS) setScenario(v);
}
function seededRandom(seed) {
	let a = seed >>> 0;
	return () => {
		a = a + 1831565813 >>> 0;
		let t = a;
		t = Math.imul(t ^ t >>> 15, t | 1);
		t ^= t + Math.imul(t ^ t >>> 7, t | 61);
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
}
var rand = seededRandom(42);
var resetRandom = () => {
	rand = seededRandom(42);
};
function latencyFor(path, scenario) {
	if (scenario === "slow") return 2500;
	if (scenario === "variable-latency") return Number(new URLSearchParams(path.split("?")[1] ?? "").get("page") ?? "1") % 2 === 1 ? 1800 : 150 + Math.floor(rand() * 200);
	return 250 + Math.floor(rand() * 250);
}
var peers = /* @__PURE__ */ new Set();
var eventSeq = 0;
var socketHandlers = [ws.link(/\/socket\.io\//).addEventListener("connection", (connection) => {
	const io = toSocketIo(connection);
	const peer = {
		io,
		close: () => connection.client.close(),
		userId: null
	};
	peers.add(peer);
	io.client.on("session", (_event, token) => {
		const s = typeof token === "string" ? getDb().sessions[token] : void 0;
		peer.userId = s && s.expiresAt > Date.now() ? s.userId : null;
		io.client.emit("session.ready", { authenticated: !!peer.userId });
	});
	connection.client.addEventListener("close", () => peers.delete(peer));
})];
function send(event, payload, userId) {
	const dup = getScenario() === "duplicate-events";
	for (const p of peers) {
		if (userId && p.userId !== userId) continue;
		p.io.client.emit(event, payload);
		if (dup) p.io.client.emit(event, payload);
	}
}
function emitNftUpdated(nft) {
	const payload = {
		eventId: `evt-${++eventSeq}-${Date.now()}`,
		resource: {
			type: "nft",
			id: nft.id
		},
		version: nft.version,
		data: {
			id: nft.id,
			price: nft.price,
			available: nft.available,
			version: nft.version
		}
	};
	send("nft.updated", payload);
	if (getScenario() === "duplicate-events" && nft.version > 1) send("nft.updated", {
		...payload,
		eventId: `evt-old-${eventSeq}`,
		version: nft.version - 1,
		data: {
			...payload.data,
			price: "0.01",
			version: nft.version - 1
		}
	});
}
function emitOrderUpdated(order) {
	send("order.updated", {
		eventId: `evt-${++eventSeq}-${Date.now()}`,
		resource: {
			type: "order",
			id: order.id
		},
		version: order.version,
		data: {
			id: order.id,
			status: order.status,
			version: order.version,
			declineReason: order.declineReason
		}
	}, order.userId);
}
function dropAllSockets() {
	for (const p of [...peers]) p.close();
	peers.clear();
}
var PAGE_SIZE = 9;
var NETWORKS = [
	"Ethereum",
	"Polygon",
	"Base"
];
var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
var ADDRESS = /^0x[a-fA-F0-9]{40}$/;
var fail = (status, code, message, extra = {}) => HttpResponse.json({
	code,
	message,
	...extra
}, { status });
async function gate(request, opts = {}) {
	const scenario = getScenario();
	const url = new URL(request.url);
	if (!url.pathname.startsWith("/api/__mock")) await delay(latencyFor(url.pathname + url.search, scenario));
	if (scenario === "offline" && !url.pathname.startsWith("/api/__mock")) return HttpResponse.error();
	if (scenario === "server-error" && opts.catalog) return fail(500, "TRANSIENT", "Serviço temporariamente indisponível.");
	settleDueOrders();
	return null;
}
function sessionOf(request) {
	const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
	if (!token) return null;
	const s = getDb().sessions[token];
	if (!s) return "expired";
	if (s.expiresAt < Date.now()) {
		delete getDb().sessions[token];
		saveDb();
		return "expired";
	}
	return {
		userId: s.userId,
		token
	};
}
function requireUser(request) {
	const s = sessionOf(request);
	if (s === "expired") return fail(401, "SESSION_EXPIRED", "Sua sessão expirou. Entre novamente.");
	if (!s) return fail(401, "UNAUTHORIZED", "Entre na sua conta para continuar.");
	return s;
}
var publicUser = (id) => {
	const { passwordHash: _p, ...u } = getDb().users.find((x) => x.id === id);
	return u;
};
function createSession(userId) {
	const token = `tok_${crypto.randomUUID()}`;
	const ttl = getScenario() === "session-expired" ? 2e4 : 6048e5;
	const expiresAt = Date.now() + ttl;
	getDb().sessions[token] = {
		userId,
		expiresAt
	};
	saveDb();
	return {
		token,
		expiresAt: new Date(expiresAt).toISOString(),
		user: publicUser(userId)
	};
}
function ownerKey(request) {
	const s = sessionOf(request);
	if (s === "expired") return fail(401, "SESSION_EXPIRED", "Sua sessão expirou. Entre novamente.");
	if (s) return `u:${s.userId}`;
	const guest = request.headers.get("x-guest-id");
	return guest ? `g:${guest}` : fail(400, "VALIDATION", "Identificador de visitante ausente.");
}
function cartView(key) {
	const d = getDb();
	const c = d.carts[key] ?? {
		items: [],
		coupon: null
	};
	const items = c.items.map((i) => {
		const n = d.nfts.find((x) => x.id === i.nftId);
		if (!n) return null;
		return {
			nftId: n.id,
			name: n.name,
			collection: n.collection,
			image: n.image,
			quantity: i.quantity,
			unitPrice: n.price,
			addedPrice: i.addedPrice,
			available: n.available
		};
	}).filter((x) => x !== null);
	return {
		items,
		coupon: c.coupon,
		summary: computeTotals(items, c.coupon, "Ethereum")
	};
}
function bumpNft(nft, patch) {
	Object.assign(nft, patch);
	nft.version += 1;
	saveDb();
	emitNftUpdated(nft);
}
function buildQuote(userId, network) {
	const view = cartView(`u:${userId}`);
	if (!view.items.length) return fail(422, "VALIDATION", "Seu carrinho está vazio.");
	const short = view.items.find((i) => i.quantity > i.available);
	if (short) return fail(409, "UNAVAILABLE", short.available === 0 ? `${short.name} esgotou.` : `Só restam ${short.available} unidades de ${short.name}.`);
	const lines = view.items.map((i) => ({
		nftId: i.nftId,
		name: i.name,
		image: i.image,
		quantity: i.quantity,
		unitPrice: i.unitPrice,
		lineTotal: computeTotals([i], null, network).subtotal
	}));
	const totals = computeTotals(lines, view.coupon, network);
	const quote = {
		id: nextId("q"),
		network,
		lines,
		coupon: view.coupon,
		...totals,
		expiresAt: new Date(Date.now() + 3e5).toISOString()
	};
	getDb().quotes[quote.id] = {
		...quote,
		userId
	};
	saveDb();
	return quote;
}
function settleDueOrders() {
	const d = getDb();
	const now = Date.now();
	for (const o of d.orders) {
		if (o.status !== "pending" || o.settleAt > now) continue;
		if (o.outcome === "confirmed") {
			const short = o.quote.lines.find((l) => (d.nfts.find((n) => n.id === l.nftId)?.available ?? 0) < l.quantity);
			if (short) {
				o.status = "declined";
				o.declineReason = `${short.name} esgotou antes da confirmação.`;
			} else {
				o.status = "confirmed";
				const cart = d.carts[`u:${o.userId}`];
				for (const l of o.quote.lines) {
					const n = d.nfts.find((x) => x.id === l.nftId);
					n.available -= l.quantity;
					n.version += 1;
					emitNftUpdated(n);
					if (cart) cart.items = cart.items.map((i) => i.nftId === l.nftId ? {
						...i,
						quantity: i.quantity - l.quantity
					} : i).filter((i) => i.quantity > 0);
				}
				if (cart && o.quote.coupon === cart.coupon) cart.coupon = null;
			}
		} else {
			o.status = "declined";
			o.declineReason = "A carteira recusou o pagamento.";
		}
		o.version += 1;
		saveDb();
		emitOrderUpdated(o);
	}
}
if (typeof window !== "undefined") setInterval(settleDueOrders, 500);
var publicOrder = ({ userId: _u, idempotencyKey: _k, bodyHash: _b, settleAt: _s, outcome: _o, ...o }) => o;
async function body(request) {
	try {
		return await request.json();
	} catch {
		return {};
	}
}
var priceChangeArmed = true;
var soldOutArmed = true;
var timedOutKeys = /* @__PURE__ */ new Set();
var handlers = [
	http.post("/api/__mock/reset", () => {
		resetDb();
		resetRandom();
		priceChangeArmed = true;
		soldOutArmed = true;
		timedOutKeys.clear();
		return HttpResponse.json({ ok: true });
	}),
	http.get("/api/__mock/scenario", () => HttpResponse.json({
		scenario: getScenario(),
		scenarios: SCENARIOS
	})),
	http.put("/api/__mock/scenario", async ({ request }) => {
		const { scenario } = await body(request);
		if (!(scenario in SCENARIOS)) return fail(422, "VALIDATION", "Cenário desconhecido.");
		setScenario(scenario);
		priceChangeArmed = true;
		soldOutArmed = true;
		return HttpResponse.json({ scenario });
	}),
	http.post("/api/__mock/nfts/:id", async ({ params, request }) => {
		const n = getDb().nfts.find((x) => x.id === params["id"]);
		if (!n) return fail(404, "NOT_FOUND", "NFT não encontrado.");
		bumpNft(n, await body(request));
		return HttpResponse.json(n);
	}),
	http.post("/api/__mock/socket/drop", () => {
		dropAllSockets();
		return HttpResponse.json({ ok: true });
	}),
	http.post("/api/__mock/session/expire", () => {
		getDb().sessions = {};
		saveDb();
		return HttpResponse.json({ ok: true });
	}),
	http.post("/api/auth/register", async ({ request }) => {
		const g = await gate(request);
		if (g) return g;
		const b = await body(request);
		const fields = {};
		if (!b.name?.trim()) fields.name = "Informe seu nome.";
		if (!b.email || !EMAIL.test(b.email)) fields.email = "E-mail inválido.";
		if (!b.password || b.password.length < 8) fields.password = "A senha precisa ter ao menos 8 caracteres.";
		if (Object.keys(fields).length) return fail(422, "VALIDATION", "Revise os campos.", { fields });
		const d = getDb();
		if (d.users.some((u) => u.email.toLowerCase() === b.email.toLowerCase())) return fail(409, "CONFLICT", "Este e-mail já está cadastrado.", { fields: { email: "Este e-mail já está cadastrado." } });
		const id = nextId("u");
		d.users.push({
			id,
			name: b.name.trim(),
			username: b.email.split("@")[0],
			email: b.email,
			phone: "",
			bio: "",
			avatar: null,
			passwordHash: hashPassword(b.password, id)
		});
		d.wallets[id] = [];
		return HttpResponse.json(createSession(id), { status: 201 });
	}),
	http.post("/api/auth/login", async ({ request }) => {
		const g = await gate(request);
		if (g) return g;
		const b = await body(request);
		const u = getDb().users.find((x) => x.email.toLowerCase() === (b.email ?? "").toLowerCase());
		if (!u || !verifyPassword(b.password ?? "", u.passwordHash)) return fail(401, "UNAUTHORIZED", "E-mail ou senha incorretos.");
		return HttpResponse.json(createSession(u.id));
	}),
	http.get("/api/auth/session", async ({ request }) => {
		const g = await gate(request);
		if (g) return g;
		const s = requireUser(request);
		if (s instanceof Response) return s;
		const exp = getDb().sessions[s.token].expiresAt;
		return HttpResponse.json({
			token: s.token,
			expiresAt: new Date(exp).toISOString(),
			user: publicUser(s.userId)
		});
	}),
	http.post("/api/auth/logout", async ({ request }) => {
		const s = sessionOf(request);
		if (s && s !== "expired") {
			delete getDb().sessions[s.token];
			saveDb();
		}
		return new HttpResponse(null, { status: 204 });
	}),
	http.get("/api/nfts", async ({ request }) => {
		const g = await gate(request, { catalog: true });
		if (g) return g;
		const sp = new URL(request.url).searchParams;
		const q = sp.get("q")?.toLowerCase();
		const collections = sp.getAll("collections");
		const rarities = sp.getAll("rarities");
		const min = sp.get("minPrice");
		const max = sp.get("maxPrice");
		const sort = sp.get("sort");
		let list = getScenario() === "empty" ? [] : getDb().nfts.filter((n) => {
			if (q && !`${n.name} ${n.collection} ${n.creator}`.toLowerCase().includes(q)) return false;
			if (collections.length && !collections.includes(n.collection)) return false;
			if (rarities.length && !rarities.includes(n.rarity)) return false;
			if (min && compareEth(n.price, min) < 0) return false;
			if (max && compareEth(n.price, max) > 0) return false;
			return true;
		});
		list = [...list].sort((a, b) => sort === "price-asc" ? compareEth(a.price, b.price) : sort === "price-desc" ? compareEth(b.price, a.price) : b.createdAt.localeCompare(a.createdAt));
		const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
		const page = Math.min(Math.max(1, Number(sp.get("page") ?? 1) || 1), totalPages);
		return HttpResponse.json({
			items: list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
			page,
			totalPages,
			total: list.length
		});
	}),
	http.get("/api/nfts/featured", async ({ request }) => {
		const g = await gate(request, { catalog: true });
		if (g) return g;
		return HttpResponse.json(getScenario() === "empty" ? [] : getDb().nfts.filter((n) => n.featured));
	}),
	http.get("/api/nfts/:id", async ({ request, params }) => {
		const g = await gate(request, { catalog: true });
		if (g) return g;
		const n = getDb().nfts.find((x) => x.id === params["id"]);
		return n ? HttpResponse.json(n) : fail(404, "NOT_FOUND", "NFT não encontrado.");
	}),
	http.get("/api/nfts/:id/related", async ({ request, params }) => {
		const g = await gate(request, { catalog: true });
		if (g) return g;
		const d = getDb();
		const base = d.nfts.find((n) => n.id === params["id"]);
		if (!base) return fail(404, "NOT_FOUND", "NFT não encontrado.");
		return HttpResponse.json(d.nfts.filter((n) => n.id !== base.id && n.collection !== base.collection).slice(0, 5));
	}),
	http.get("/api/favorites", async ({ request }) => {
		const g = await gate(request);
		if (g) return g;
		const s = requireUser(request);
		if (s instanceof Response) return s;
		return HttpResponse.json(getDb().favorites[s.userId] ?? []);
	}),
	http.put("/api/favorites/:id", async ({ request, params }) => {
		const g = await gate(request);
		if (g) return g;
		const s = requireUser(request);
		if (s instanceof Response) return s;
		if (getScenario() === "favorites-fail") return fail(503, "TRANSIENT", "Não foi possível salvar o favorito.");
		const id = String(params["id"]);
		if (!getDb().nfts.some((n) => n.id === id)) return fail(404, "NOT_FOUND", "NFT não encontrado.");
		const list = new Set(getDb().favorites[s.userId] ?? []);
		list.add(id);
		getDb().favorites[s.userId] = [...list];
		saveDb();
		return HttpResponse.json([...list]);
	}),
	http.delete("/api/favorites/:id", async ({ request, params }) => {
		const g = await gate(request);
		if (g) return g;
		const s = requireUser(request);
		if (s instanceof Response) return s;
		if (getScenario() === "favorites-fail") return fail(503, "TRANSIENT", "Não foi possível remover o favorito.");
		getDb().favorites[s.userId] = (getDb().favorites[s.userId] ?? []).filter((f) => f !== params["id"]);
		saveDb();
		return HttpResponse.json(getDb().favorites[s.userId]);
	}),
	http.get("/api/cart", async ({ request }) => {
		const g = await gate(request);
		if (g) return g;
		const key = ownerKey(request);
		if (key instanceof Response) return key;
		const view = cartView(key);
		if (getScenario() === "price-change" && priceChangeArmed && view.items.length) {
			priceChangeArmed = false;
			const target = getDb().nfts.find((n) => n.id === view.items[0].nftId);
			setTimeout(() => bumpNft(target, { price: addEth(target.price, "0.05") }), 4e3);
		}
		return HttpResponse.json(view);
	}),
	http.post("/api/cart/items", async ({ request }) => {
		const g = await gate(request);
		if (g) return g;
		const key = ownerKey(request);
		if (key instanceof Response) return key;
		const b = await body(request);
		const d = getDb();
		const n = d.nfts.find((x) => x.id === b.nftId);
		if (!n) return fail(404, "NOT_FOUND", "NFT não encontrado.");
		const qty = Math.trunc(Number(b.quantity));
		if (!Number.isInteger(qty) || qty < 1) return fail(422, "VALIDATION", "Quantidade inválida.");
		const cart = d.carts[key] ??= {
			items: [],
			coupon: null
		};
		const existing = cart.items.find((i) => i.nftId === n.id);
		const total = (existing?.quantity ?? 0) + qty;
		if (total > n.available) return fail(409, "UNAVAILABLE", n.available === 0 ? "Edição esgotada." : `Só restam ${n.available} unidades.`);
		if (existing) existing.quantity = total;
		else cart.items.push({
			nftId: n.id,
			quantity: qty,
			addedPrice: n.price
		});
		saveDb();
		return HttpResponse.json(cartView(key));
	}),
	http.patch("/api/cart/items/:nftId", async ({ request, params }) => {
		const g = await gate(request);
		if (g) return g;
		const key = ownerKey(request);
		if (key instanceof Response) return key;
		const { quantity } = await body(request);
		const d = getDb();
		const item = d.carts[key]?.items.find((i) => i.nftId === params["nftId"]);
		const n = d.nfts.find((x) => x.id === params["nftId"]);
		if (!item || !n) return fail(404, "NOT_FOUND", "Item não está no carrinho.");
		const qty = Number(quantity);
		if (!Number.isInteger(qty) || qty < 1) return fail(422, "VALIDATION", "Quantidade inválida.");
		if (qty > n.available) return fail(409, "UNAVAILABLE", `Só restam ${n.available} unidades.`);
		item.quantity = qty;
		saveDb();
		return HttpResponse.json(cartView(key));
	}),
	http.delete("/api/cart/items/:nftId", async ({ request, params }) => {
		const g = await gate(request);
		if (g) return g;
		const key = ownerKey(request);
		if (key instanceof Response) return key;
		const cart = getDb().carts[key];
		if (cart) cart.items = cart.items.filter((i) => i.nftId !== params["nftId"]);
		saveDb();
		return HttpResponse.json(cartView(key));
	}),
	http.put("/api/cart/coupon", async ({ request }) => {
		const g = await gate(request);
		if (g) return g;
		const key = ownerKey(request);
		if (key instanceof Response) return key;
		const { code } = await body(request);
		const check = checkCoupon(code ?? "");
		if (!check.ok) return fail(422, check.code, check.message, { fields: { code: check.message } });
		const cart = getDb().carts[key] ??= {
			items: [],
			coupon: null
		};
		cart.coupon = check.code;
		saveDb();
		return HttpResponse.json(cartView(key));
	}),
	http.delete("/api/cart/coupon", async ({ request }) => {
		const g = await gate(request);
		if (g) return g;
		const key = ownerKey(request);
		if (key instanceof Response) return key;
		const cart = getDb().carts[key];
		if (cart) cart.coupon = null;
		saveDb();
		return HttpResponse.json(cartView(key));
	}),
	http.post("/api/cart/merge", async ({ request }) => {
		const g = await gate(request);
		if (g) return g;
		const s = requireUser(request);
		if (s instanceof Response) return s;
		const guest = request.headers.get("x-guest-id");
		const d = getDb();
		const from = guest ? d.carts[`g:${guest}`] : void 0;
		const to = d.carts[`u:${s.userId}`] ??= {
			items: [],
			coupon: null
		};
		if (from) {
			for (const i of from.items) {
				const n = d.nfts.find((x) => x.id === i.nftId);
				if (!n) continue;
				const existing = to.items.find((x) => x.nftId === i.nftId);
				if (existing) existing.quantity = Math.min(n.available, Math.max(existing.quantity, i.quantity));
				else to.items.push({
					...i,
					quantity: Math.min(n.available, i.quantity)
				});
			}
			to.items = to.items.filter((i) => i.quantity > 0);
			to.coupon = to.coupon ?? from.coupon;
			delete d.carts[`g:${guest}`];
		}
		saveDb();
		return HttpResponse.json(cartView(`u:${s.userId}`));
	}),
	http.post("/api/quote", async ({ request }) => {
		const g = await gate(request);
		if (g) return g;
		const s = requireUser(request);
		if (s instanceof Response) return s;
		const { network } = await body(request);
		if (!network || !NETWORKS.includes(network)) return fail(422, "VALIDATION", "Rede inválida.");
		const q = buildQuote(s.userId, network);
		return q instanceof Response ? q : HttpResponse.json(q);
	}),
	http.post("/api/orders", async ({ request }) => {
		const g = await gate(request);
		if (g) return g;
		const s = requireUser(request);
		if (s instanceof Response) return s;
		const key = request.headers.get("idempotency-key");
		if (!key) return fail(400, "VALIDATION", "Cabeçalho Idempotency-Key obrigatório.");
		const b = await body(request);
		const bodyHash = JSON.stringify([
			b.quoteId,
			b.total,
			b.walletId,
			b.network,
			b.collector
		]);
		const d = getDb();
		const existing = d.orders.find((o) => o.userId === s.userId && o.idempotencyKey === key);
		if (existing) {
			if (existing.bodyHash !== bodyHash) return fail(409, "IDEMPOTENCY_CONFLICT", "Esta chave já foi usada com outro conteúdo.");
			return HttpResponse.json(publicOrder(existing), { status: 200 });
		}
		const fields = {};
		if (!b.collector?.name?.trim()) fields.name = "Informe o nome.";
		if (!b.collector?.email || !EMAIL.test(b.collector.email)) fields.email = "E-mail inválido.";
		if (!b.collector?.phone || b.collector.phone.replace(/\D/g, "").length < 10) fields.phone = "Telefone inválido.";
		if (Object.keys(fields).length) return fail(422, "VALIDATION", "Revise os dados do colecionador.", { fields });
		const wallet = d.wallets[s.userId]?.find((w) => w.id === b.walletId);
		if (!wallet) return fail(422, "VALIDATION", "Selecione uma carteira cadastrada.");
		if (d.connectedWallet[s.userId] !== wallet.id) return fail(409, "WALLET_REJECTED", "Conecte a carteira antes de pagar.");
		if (getScenario() === "sold-out" && soldOutArmed) {
			soldOutArmed = false;
			const first = cartView(`u:${s.userId}`).items[0];
			const n = first && d.nfts.find((x) => x.id === first.nftId);
			if (n) bumpNft(n, { available: 0 });
		}
		const fresh = buildQuote(s.userId, b.network);
		if (fresh instanceof Response) return fresh;
		const prev = d.quotes[b.quoteId];
		if (!(prev && prev.userId === s.userId && new Date(prev.expiresAt).getTime() > Date.now() && fresh.total === b.total && prev.total === b.total && JSON.stringify(prev.lines) === JSON.stringify(fresh.lines))) return fail(409, "PRICE_CHANGED", "Os valores mudaram. Revise e confirme novamente.", { quote: fresh });
		const order = {
			id: `KR-${nextId("o").split("-")[1]}`,
			status: "pending",
			createdAt: (/* @__PURE__ */ new Date()).toISOString(),
			network: b.network,
			wallet,
			collector: b.collector,
			quote: prev,
			txHash: `0x${[...crypto.getRandomValues(/* @__PURE__ */ new Uint8Array(32))].map((x) => x.toString(16).padStart(2, "0")).join("")}`,
			explorerUrl: "",
			declineReason: null,
			version: 1,
			userId: s.userId,
			idempotencyKey: key,
			bodyHash,
			settleAt: Date.now() + 3e3,
			outcome: getScenario() === "payment-declined" ? "declined" : "confirmed"
		};
		order.quote = {
			id: prev.id,
			network: prev.network,
			lines: prev.lines,
			coupon: prev.coupon,
			subtotal: prev.subtotal,
			discount: prev.discount,
			networkFee: prev.networkFee,
			total: prev.total,
			expiresAt: prev.expiresAt
		};
		order.explorerUrl = `https://sepolia.etherscan.io/tx/${order.txHash}`;
		d.orders.unshift(order);
		saveDb();
		if (getScenario() === "order-timeout" && !timedOutKeys.has(key)) {
			timedOutKeys.add(key);
			await delay(7e3);
		}
		return HttpResponse.json(publicOrder(order), { status: 201 });
	}),
	http.get("/api/orders", async ({ request }) => {
		const g = await gate(request);
		if (g) return g;
		const s = requireUser(request);
		if (s instanceof Response) return s;
		return HttpResponse.json(getDb().orders.filter((o) => o.userId === s.userId).map(publicOrder));
	}),
	http.get("/api/orders/:id", async ({ request, params }) => {
		const g = await gate(request);
		if (g) return g;
		const s = requireUser(request);
		if (s instanceof Response) return s;
		const o = getDb().orders.find((x) => x.id === params["id"]);
		if (!o) return fail(404, "NOT_FOUND", "Pedido não encontrado.");
		if (o.userId !== s.userId) return fail(403, "FORBIDDEN", "Este pedido pertence a outra conta.");
		return HttpResponse.json(publicOrder(o));
	}),
	http.get("/api/me", async ({ request }) => {
		const g = await gate(request);
		if (g) return g;
		const s = requireUser(request);
		if (s instanceof Response) return s;
		return HttpResponse.json(publicUser(s.userId));
	}),
	http.put("/api/me", async ({ request }) => {
		const g = await gate(request);
		if (g) return g;
		const s = requireUser(request);
		if (s instanceof Response) return s;
		const b = await body(request);
		const fields = {};
		if (!b.name?.trim()) fields.name = "Informe seu nome.";
		if (!b.username || !/^[a-z0-9._]{3,24}$/.test(b.username)) fields.username = "Use 3 a 24 letras minúsculas, números, ponto ou _.";
		if (!b.email || !EMAIL.test(b.email)) fields.email = "E-mail inválido.";
		if (b.phone && b.phone.replace(/\D/g, "").length < 10) fields.phone = "Telefone inválido.";
		const d = getDb();
		if (!fields.email && d.users.some((u) => u.id !== s.userId && u.email.toLowerCase() === b.email.toLowerCase())) fields.email = "E-mail já usado por outra conta.";
		if (Object.keys(fields).length) return fail(422, "VALIDATION", "Revise os campos.", { fields });
		const u = d.users.find((x) => x.id === s.userId);
		Object.assign(u, {
			name: b.name.trim(),
			username: b.username,
			email: b.email,
			phone: b.phone ?? "",
			bio: (b.bio ?? "").slice(0, 280)
		});
		saveDb();
		return HttpResponse.json(publicUser(s.userId));
	}),
	http.put("/api/me/avatar", async ({ request }) => {
		const g = await gate(request);
		if (g) return g;
		const s = requireUser(request);
		if (s instanceof Response) return s;
		const { dataUrl } = await body(request);
		if (dataUrl && !/^data:image\/(png|jpeg|webp);base64,/.test(dataUrl)) return fail(422, "VALIDATION", "Envie uma imagem PNG, JPG ou WEBP.", { fields: { avatar: "Formato inválido." } });
		if (dataUrl && dataUrl.length > 7e5) return fail(422, "VALIDATION", "A imagem deve ter até 500 KB.", { fields: { avatar: "Imagem muito grande." } });
		getDb().users.find((x) => x.id === s.userId).avatar = dataUrl ?? null;
		saveDb();
		return HttpResponse.json(publicUser(s.userId));
	}),
	http.put("/api/me/password", async ({ request }) => {
		const g = await gate(request);
		if (g) return g;
		const s = requireUser(request);
		if (s instanceof Response) return s;
		const b = await body(request);
		const u = getDb().users.find((x) => x.id === s.userId);
		if (!verifyPassword(b.current ?? "", u.passwordHash)) return fail(422, "VALIDATION", "Senha atual incorreta.", { fields: { current: "Senha atual incorreta." } });
		if (!b.next || b.next.length < 8) return fail(422, "VALIDATION", "A nova senha precisa ter ao menos 8 caracteres.", { fields: { next: "Mínimo de 8 caracteres." } });
		u.passwordHash = hashPassword(b.next, u.id);
		saveDb();
		return new HttpResponse(null, { status: 204 });
	}),
	http.get("/api/wallets", async ({ request }) => {
		const g = await gate(request);
		if (g) return g;
		const s = requireUser(request);
		if (s instanceof Response) return s;
		return HttpResponse.json({
			wallets: getDb().wallets[s.userId] ?? [],
			connectedId: getDb().connectedWallet[s.userId] ?? null
		});
	}),
	http.post("/api/wallets", async ({ request }) => saveWallet(request, null)),
	http.put("/api/wallets/:id", async ({ request, params }) => saveWallet(request, String(params["id"]))),
	http.post("/api/wallets/:id/connect", async ({ request, params }) => {
		const g = await gate(request);
		if (g) return g;
		const s = requireUser(request);
		if (s instanceof Response) return s;
		if (!getDb().wallets[s.userId]?.some((w) => w.id === params["id"])) return fail(404, "NOT_FOUND", "Carteira não encontrada.");
		await delay(600);
		if (getScenario() === "wallet-reject") return fail(403, "WALLET_REJECTED", "A conexão foi recusada na carteira.");
		getDb().connectedWallet[s.userId] = String(params["id"]);
		saveDb();
		return HttpResponse.json({ connectedId: params["id"] });
	}),
	http.delete("/api/wallets/:id/connect", async ({ request }) => {
		const g = await gate(request);
		if (g) return g;
		const s = requireUser(request);
		if (s instanceof Response) return s;
		getDb().connectedWallet[s.userId] = null;
		saveDb();
		return HttpResponse.json({ connectedId: null });
	})
];
async function saveWallet(request, id) {
	const g = await gate(request);
	if (g) return g;
	const s = requireUser(request);
	if (s instanceof Response) return s;
	const b = await body(request);
	const fields = {};
	if (!b.label?.trim()) fields.label = "Informe um nome.";
	if (!b.address || !ADDRESS.test(b.address)) fields.address = "Endereço inválido (0x + 40 caracteres hexadecimais).";
	if (!b.provider) fields.provider = "Selecione o provedor.";
	if (b.role !== "primary" && b.role !== "secondary") fields.role = "Selecione o tipo.";
	if (Object.keys(fields).length) return fail(422, "VALIDATION", "Revise os campos.", { fields });
	const list = getDb().wallets[s.userId] ??= [];
	if (list.some((w) => w.id !== id && w.address.toLowerCase() === b.address.toLowerCase())) return fail(409, "CONFLICT", "Esta carteira já está cadastrada.", { fields: { address: "Endereço já cadastrado." } });
	if (list.some((w) => w.id !== id && w.role === b.role)) {
		const other = list.find((w) => w.id !== id && w.role === b.role);
		other.role = b.role === "primary" ? "secondary" : "primary";
		if (list.some((w) => w !== other && w.id !== id && w.role === other.role)) return fail(409, "CONFLICT", "Já existem carteiras principal e secundária.", { fields: { role: "Limite de carteiras atingido." } });
	}
	if (!id && list.length >= 2) return fail(409, "CONFLICT", "Você já tem carteiras principal e secundária. Edite uma delas.");
	const wallet = {
		id: id ?? nextId("w"),
		label: b.label.trim(),
		provider: b.provider,
		address: b.address,
		role: b.role
	};
	const idx = list.findIndex((w) => w.id === id);
	if (id && idx < 0) return fail(404, "NOT_FOUND", "Carteira não encontrada.");
	if (idx >= 0) list[idx] = wallet;
	else list.push(wallet);
	saveDb();
	return HttpResponse.json(wallet, { status: id ? 200 : 201 });
}
async function startMocks() {
	readScenarioFromUrl();
	const worker = setupWorker(...handlers, ...socketHandlers);
	await worker.start({
		onUnhandledRequest: "bypass",
		quiet: true,
		serviceWorker: { url: "/mockServiceWorker.js" }
	});
	return worker;
}
//#endregion
export { startMocks };
