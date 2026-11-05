import nft1 from "@/assets/nft-1.jpg";
import nft2 from "@/assets/nft-2.jpg";
import nft3 from "@/assets/nft-3.jpg";
import nft4 from "@/assets/nft-4.jpg";
import type { Nft, Rarity, User, Wallet } from "@/services/contracts";

const images = [nft1, nft2, nft3, nft4];
export const COLLECTIONS = ["Emerald Apes", "Velvet Hoods", "Shadow Kings", "Golden Tunes"] as const;
export const RARITIES: Rarity[] = ["Comum", "Raro", "Épico", "Lendário"];
const names = ["Emerald Ape", "Velvet Hood", "Shadow King", "Golden Tune"];
const creators = ["@kurio.lab", "@hoodstudio", "@shadowdao", "@goldtunes"];

export function buildNfts(): Nft[] {
  return Array.from({ length: 28 }, (_, i) => {
    const k = i % 4;
    const num = 42 + i * 7;
    const cents = 35 + ((i * 37) % 23) * 10;
    const soldOut = i === 5;
    return {
      id: `nft-${i + 1}`,
      name: `${names[k]} #${String(num).padStart(4, "0")}`,
      collection: COLLECTIONS[k]!,
      creator: creators[k]!,
      price: `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}`,
      rarity: RARITIES[(i * 3) % 4]!,
      image: images[k]!,
      gallery: [0, 1, 2, 3].map((d) => images[(k + d) % 4]!),
      edition: { current: (i % 9) + 1, total: 10 + (i % 5) * 5 },
      available: soldOut ? 0 : 1 + (i % 6),
      rating: 4 + (i % 10) / 10,
      reviews: 12 + i * 3,
      description:
        "Peça digital de edição limitada com certificado on-chain. Cada edição é única e verificável, com royalties automáticos para o criador a cada revenda.",
      featured: i < 3,
      createdAt: new Date(Date.UTC(2026, 0, 1 + 28 - i)).toISOString(),
      version: 1,
    };
  });
}

export const DEMO_PASSWORD = "kurio123";

export const FIXTURE_USERS: (User & { password: string })[] = [
  { id: "u-ana", name: "Ana Ribeiro", username: "ana.coleciona", email: "ana@kurio.art", phone: "+55 11 98888-0001", bio: "Colecionadora de arte generativa.", avatar: null, password: DEMO_PASSWORD },
  { id: "u-bruno", name: "Bruno Lima", username: "bruno.nft", email: "bruno@kurio.art", phone: "+55 21 97777-0002", bio: "", avatar: null, password: DEMO_PASSWORD },
];

export const FIXTURE_WALLETS: Record<string, Wallet[]> = {
  "u-ana": [
    { id: "w-ana-1", label: "Carteira principal", provider: "MetaMask", address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F", role: "primary" },
    { id: "w-ana-2", label: "Cofre frio", provider: "Ledger", address: "0x2B5AD5c4795c026514f8317c7a215E218DcCD6cF", role: "secondary" },
  ],
  "u-bruno": [
    { id: "w-bruno-1", label: "Coinbase", provider: "Coinbase", address: "0x6813Eb9362372EEF6200f3b1dbC3f819671cBA69", role: "primary" },
  ],
};

export const COUPONS: Record<string, { basisPoints: number; expired: boolean }> = {
  KURIO10: { basisPoints: 1000, expired: false },
  APE20: { basisPoints: 2000, expired: false },
  VERAO15: { basisPoints: 1500, expired: true },
};

export const NETWORK_FEES = { Ethereum: "0.0042", Polygon: "0.0004", Base: "0.0009" } as const;
