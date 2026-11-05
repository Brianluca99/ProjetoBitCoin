import type { Eth } from "@/lib/decimal";
import type { Nft, Order, Quote, User, Wallet } from "@/services/contracts";
import { buildNfts, FIXTURE_USERS, FIXTURE_WALLETS } from "./fixtures";

export interface DbUser extends User {
  passwordHash: string;
}

export interface DbOrder extends Order {
  userId: string;
  idempotencyKey: string;
  bodyHash: string;
  settleAt: number;
  outcome: "confirmed" | "declined";
}

export interface DbCart {
  items: { nftId: string; quantity: number; addedPrice: Eth }[];
  coupon: string | null;
}

export interface Db {
  nfts: Nft[];
  users: DbUser[];
  sessions: Record<string, { userId: string; expiresAt: number }>;
  carts: Record<string, DbCart>;
  favorites: Record<string, string[]>;
  wallets: Record<string, Wallet[]>;
  connectedWallet: Record<string, string | null>;
  quotes: Record<string, Quote & { userId: string }>;
  orders: DbOrder[];
  seq: number;
  flags: Record<string, boolean>;
}

const KEY = "kurio-mock-db-v2";

export function hashPassword(password: string, salt: string): string {
  let h = 0xcbf29ce484222325n;
  for (const ch of `${salt}:${password}`) {
    h ^= BigInt(ch.codePointAt(0)!);
    h = (h * 0x100000001b3n) & 0xffffffffffffffffn;
  }
  return `fnv1a$${salt}$${h.toString(16)}`;
}

export const verifyPassword = (password: string, stored: string) => hashPassword(password, stored.split("$")[1] ?? "") === stored;

function seed(): Db {
  return {
    nfts: buildNfts(),
    users: FIXTURE_USERS.map(({ password, ...u }) => ({ ...u, passwordHash: hashPassword(password, u.id) })),
    sessions: {},
    carts: {},
    favorites: { "u-ana": ["nft-2"] },
    wallets: structuredClone(FIXTURE_WALLETS),
    connectedWallet: {},
    quotes: {},
    orders: [],
    seq: 1000,
    flags: {},
  };
}

let db: Db | null = null;

export function getDb(): Db {
  if (db) return db;
  try {
    const raw = localStorage.getItem(KEY);
    db = raw ? (JSON.parse(raw) as Db) : seed();
  } catch {
    db = seed();
  }
  return db;
}

export function saveDb() {
  if (db) localStorage.setItem(KEY, JSON.stringify(db));
}

export function resetDb() {
  db = seed();
  saveDb();
}

export function nextId(prefix: string) {
  const d = getDb();
  d.seq += 1;
  return `${prefix}-${d.seq}`;
}
