//#region node_modules/.nitro/vite/services/ssr/assets/fixtures-CAOBEri7.js
var nft_1_default = "/assets/nft-1-DwoWeY6D.jpg";
var images = [
	nft_1_default,
	"/assets/nft-2-DNVwdAv7.jpg",
	"/assets/nft-3-BPjwYV_x.jpg",
	"/assets/nft-4-CNwlEtpK.jpg"
];
var COLLECTIONS = [
	"Emerald Apes",
	"Velvet Hoods",
	"Shadow Kings",
	"Golden Tunes"
];
var RARITIES = [
	"Comum",
	"Raro",
	"Épico",
	"Lendário"
];
var names = [
	"Emerald Ape",
	"Velvet Hood",
	"Shadow King",
	"Golden Tune"
];
var creators = [
	"@kurio.lab",
	"@hoodstudio",
	"@shadowdao",
	"@goldtunes"
];
function buildNfts() {
	return Array.from({ length: 28 }, (_, i) => {
		const k = i % 4;
		const num = 42 + i * 7;
		const cents = 35 + i * 37 % 23 * 10;
		const soldOut = i === 5;
		return {
			id: `nft-${i + 1}`,
			name: `${names[k]} #${String(num).padStart(4, "0")}`,
			collection: COLLECTIONS[k],
			creator: creators[k],
			price: `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}`,
			rarity: RARITIES[i * 3 % 4],
			image: images[k],
			gallery: [
				0,
				1,
				2,
				3
			].map((d) => images[(k + d) % 4]),
			edition: {
				current: i % 9 + 1,
				total: 10 + i % 5 * 5
			},
			available: soldOut ? 0 : 1 + i % 6,
			rating: 4 + i % 10 / 10,
			reviews: 12 + i * 3,
			description: "Peça digital de edição limitada com certificado on-chain. Cada edição é única e verificável, com royalties automáticos para o criador a cada revenda.",
			featured: i < 3,
			createdAt: new Date(Date.UTC(2026, 0, 29 - i)).toISOString(),
			version: 1
		};
	});
}
var DEMO_PASSWORD = "kurio123";
var FIXTURE_USERS = [{
	id: "u-ana",
	name: "Ana Ribeiro",
	username: "ana.coleciona",
	email: "ana@kurio.art",
	phone: "+55 11 98888-0001",
	bio: "Colecionadora de arte generativa.",
	avatar: null,
	password: DEMO_PASSWORD
}, {
	id: "u-bruno",
	name: "Bruno Lima",
	username: "bruno.nft",
	email: "bruno@kurio.art",
	phone: "+55 21 97777-0002",
	bio: "",
	avatar: null,
	password: DEMO_PASSWORD
}];
var FIXTURE_WALLETS = {
	"u-ana": [{
		id: "w-ana-1",
		label: "Carteira principal",
		provider: "MetaMask",
		address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
		role: "primary"
	}, {
		id: "w-ana-2",
		label: "Cofre frio",
		provider: "Ledger",
		address: "0x2B5AD5c4795c026514f8317c7a215E218DcCD6cF",
		role: "secondary"
	}],
	"u-bruno": [{
		id: "w-bruno-1",
		label: "Coinbase",
		provider: "Coinbase",
		address: "0x6813Eb9362372EEF6200f3b1dbC3f819671cBA69",
		role: "primary"
	}]
};
var COUPONS = {
	KURIO10: {
		basisPoints: 1e3,
		expired: false
	},
	APE20: {
		basisPoints: 2e3,
		expired: false
	},
	VERAO15: {
		basisPoints: 1500,
		expired: true
	}
};
var NETWORK_FEES = {
	Ethereum: "0.0042",
	Polygon: "0.0004",
	Base: "0.0009"
};
//#endregion
export { NETWORK_FEES as a, nft_1_default as c, FIXTURE_WALLETS as i, COUPONS as n, RARITIES as o, FIXTURE_USERS as r, buildNfts as s, COLLECTIONS as t };
