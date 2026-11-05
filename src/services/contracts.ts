import type { Eth } from "@/lib/decimal";

export type Rarity = "Comum" | "Raro" | "Épico" | "Lendário";

export interface Nft {
  id: string;
  name: string;
  collection: string;
  creator: string;
  price: Eth;
  rarity: Rarity;
  image: string;
  gallery: string[];
  edition: { current: number; total: number };
  available: number;
  rating: number;
  reviews: number;
  description: string;
  featured: boolean;
  createdAt: string;
  version: number;
}

export type SortKey = "recent" | "price-asc" | "price-desc";

export interface CatalogFilters {
  q?: string | undefined;
  collections?: string[] | undefined;
  rarities?: Rarity[] | undefined;
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
  sort?: SortKey | undefined;
  page?: number | undefined;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  totalPages: number;
  total: number;
}

export type Network = "Ethereum" | "Polygon" | "Base";
export type WalletProvider = "MetaMask" | "Coinbase" | "WalletConnect" | "Ledger";

export interface Wallet {
  id: string;
  label: string;
  provider: WalletProvider;
  address: string;
  role: "primary" | "secondary";
}

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  bio: string;
  avatar: string | null;
}

export interface Session {
  token: string;
  expiresAt: string;
  user: User;
}

export interface CartItem {
  nftId: string;
  name: string;
  collection: string;
  image: string;
  quantity: number;
  unitPrice: Eth;
  addedPrice: Eth;
  available: number;
}

export interface Cart {
  items: CartItem[];
  coupon: string | null;
}

export interface QuoteLine {
  nftId: string;
  name: string;
  image: string;
  quantity: number;
  unitPrice: Eth;
  lineTotal: Eth;
}

export interface Quote {
  id: string;
  network: Network;
  lines: QuoteLine[];
  coupon: string | null;
  subtotal: Eth;
  discount: Eth;
  networkFee: Eth;
  total: Eth;
  expiresAt: string;
}

export type OrderStatus = "pending" | "confirmed" | "declined";

export interface Collector {
  name: string;
  email: string;
  phone: string;
}

export interface Order {
  id: string;
  status: OrderStatus;
  createdAt: string;
  network: Network;
  wallet: Wallet;
  collector: Collector;
  quote: Quote;
  txHash: string;
  explorerUrl: string;
  declineReason: string | null;
  version: number;
}

export interface CreateOrderBody {
  quoteId: string;
  total: Eth;
  walletId: string;
  network: Network;
  collector: Collector;
}

export type ApiErrorCode =
  | "VALIDATION"
  | "UNAUTHORIZED"
  | "SESSION_EXPIRED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UNAVAILABLE"
  | "PRICE_CHANGED"
  | "COUPON_INVALID"
  | "COUPON_EXPIRED"
  | "IDEMPOTENCY_CONFLICT"
  | "WALLET_REJECTED"
  | "TRANSIENT";

export interface ApiErrorBody {
  code: ApiErrorCode;
  message: string;
  fields?: Partial<Record<string, string>>;
  quote?: Quote;
}

export interface RealtimeEvent<T> {
  eventId: string;
  resource: { type: "nft" | "order"; id: string };
  version: number;
  data: T;
}

export type NftUpdatedEvent = RealtimeEvent<Pick<Nft, "id" | "price" | "available" | "version">>;
export type OrderUpdatedEvent = RealtimeEvent<Pick<Order, "id" | "status" | "version" | "declineReason">>;
