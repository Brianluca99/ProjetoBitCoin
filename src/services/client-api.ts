import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useHydrated } from "@tanstack/react-router";
import { useSyncExternalStore } from "react";
import { computeTotals } from "@/lib/pricing";
import { supabase } from "@/lib/supabase";
import { ApiError, http, isTransient } from "./http";
import { getToken, onSessionChange, setToken } from "./session";
import type {
  Cart,
  CartItem,
  CatalogFilters,
  Collector,
  CreateOrderBody,
  Network,
  Nft,
  Order,
  Paginated,
  Quote,
  Session,
  User,
  Wallet,
} from "./contracts";

export type CartView = Cart & {
  summary: { subtotal: string; discount: string; networkFee: string; total: string };
};
export type WalletsView = { wallets: Wallet[]; connectedId: string | null };

type CartItemRow = {
  quantity: number;
  added_price: string | number;
  nfts: {
    id: string;
    name: string;
    collection: string;
    image: string;
    price: string | number;
    available: number;
  } | null;
};

export const keys = {
  list: (f: CatalogFilters) => ["nfts", "list", f] as const,
  featured: ["nfts", "featured"] as const,
  nft: (id: string) => ["nfts", "detail", id] as const,
  related: (id: string) => ["nfts", "related", id] as const,
  session: (token: string | null) => ["session", token] as const,
  cart: (scope: string) => ["cart", scope] as const,
  favorites: (scope: string) => ["favorites", scope] as const,
  wallets: (scope: string) => ["wallets", scope] as const,
  me: (scope: string) => ["me", scope] as const,
  orders: (scope: string) => ["orders", scope] as const,
  order: (scope: string, id: string) => ["order", scope, id] as const,
  quote: (scope: string, network: Network) => ["quote", scope, network] as const,
};

type NftRow = Omit<Nft, "edition" | "createdAt" | "price"> & {
  edition_current: number;
  edition_total: number;
  created_at: string;
  price: string | number;
};

const mapNft = (row: NftRow): Nft => ({
  ...row,
  price: String(row.price),
  edition: { current: row.edition_current, total: row.edition_total },
  createdAt: row.created_at,
});

export const api = {
  listNfts: async (f: CatalogFilters, _signal?: AbortSignal): Promise<Paginated<Nft>> => {
    let q = supabase.from("nfts").select("*", { count: "exact" });
    if (f.q) q = q.ilike("name", `%${f.q}%`);
    if (f.collections?.length) q = q.in("collection", f.collections);
    if (f.rarities?.length) q = q.in("rarity", f.rarities);
    if (f.minPrice !== undefined) q = q.gte("price", f.minPrice);
    if (f.maxPrice !== undefined) q = q.lte("price", f.maxPrice);

    if (f.sort === "price-asc") q = q.order("price", { ascending: true });
    else if (f.sort === "price-desc") q = q.order("price", { ascending: false });
    else q = q.order("created_at", { ascending: false });

    const page = f.page || 1;
    const pageSize = 9;
    q = q.range((page - 1) * pageSize, page * pageSize - 1);
    const { data, count, error } = await q;
    if (error) throw error;
    const total = count ?? 0;
    return {
      items: (data ?? []).map((row) => mapNft(row as NftRow)),
      page,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      total,
    };
  },
  featured: async (_signal?: AbortSignal): Promise<Nft[]> => {
    const { data, error } = await supabase.from("nfts").select("*").eq("featured", true);
    if (error) throw error;
    return (data ?? []).map((row) => mapNft(row as NftRow));
  },
  nft: async (id: string, _signal?: AbortSignal): Promise<Nft> => {
    const { data, error } = await supabase.from("nfts").select("*").eq("id", id).single();
    if (error) throw error;
    return mapNft(data as NftRow);
  },
  related: async (id: string, _signal?: AbortSignal) => {
    const { data: base, error: baseError } = await supabase
      .from("nfts")
      .select("collection")
      .eq("id", id)
      .single();
    if (baseError) throw baseError;
    if (!base) return [];
    const { data, error } = await supabase
      .from("nfts")
      .select("*")
      .neq("id", id)
      .neq("collection", base.collection)
      .limit(5);
    if (error) throw error;
    return (data ?? []).map((row) => mapNft(row as NftRow));
  },
  register: async (b: { name: string; email: string; password: string }) => {
    const { data, error } = await supabase.auth.signUp({
      email: b.email,
      password: b.password,
      options: { data: { full_name: b.name } },
    });
    if (error) throw new ApiError(400, "VALIDATION", error.message);
    if (!data.session) return null;
    return api.session();
  },
  login: async (b: { email: string; password: string }) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: b.email,
      password: b.password,
    });
    if (error) throw new ApiError(401, "UNAUTHORIZED", error.message);
    return api.session();
  },
  session: async () => {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session) throw new ApiError(401, "UNAUTHORIZED", "Não autorizado");

    const { data: existingProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id, name, username, phone, bio")
      .eq("id", session.user.id)
      .maybeSingle();
    if (profileError) throw profileError;

    let profile = existingProfile;
    if (!profile) {
      const newProfile = {
        id: session.user.id,
        name:
          session.user.user_metadata["full_name"] ||
          session.user.user_metadata["name"] ||
          "Colecionador",
        username: `user_${session.user.id.replaceAll("-", "").slice(0, 12)}`,
        phone: "",
        bio: "",
      };
      const { data: insertedProfile, error: insertError } = await supabase
        .from("profiles")
        .insert(newProfile)
        .select()
        .single();
      if (insertError) throw insertError;
      profile = insertedProfile;
    }
    if (!profile) throw new Error("Não foi possível carregar ou criar o perfil do usuário.");

    return {
      token: session.access_token,
      expiresAt: new Date(
        (session.expires_at ?? Date.now() / 1000 + session.expires_in) * 1000,
      ).toISOString(),
      user: {
        id: profile.id,
        name: profile.name,
        username: profile.username,
        email: session.user.email ?? "",
        phone: profile.phone || "",
        bio: profile.bio || "",
        avatar:
          session.user.user_metadata["avatar_url"] || session.user.user_metadata["picture"] || null,
      },
    };
  },
  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
  favorites: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return [];
    const { data, error } = await supabase
      .from("favorites")
      .select("nft_id")
      .eq("user_id", session.user.id);
    if (error) throw error;
    return data?.map((f) => f.nft_id) ?? [];
  },
  addFavorite: async (id: string) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new ApiError(401, "UNAUTHORIZED", "Não autorizado");

    const { error } = await supabase
      .from("favorites")
      .insert({ user_id: session.user.id, nft_id: id });
    if (error) throw error;

    const { data } = await supabase
      .from("favorites")
      .select("nft_id")
      .eq("user_id", session.user.id);
    return data?.map((f) => f.nft_id) ?? [];
  },
  removeFavorite: async (id: string) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new ApiError(401, "UNAUTHORIZED", "Não autorizado");

    const { error } = await supabase
      .from("favorites")
      .delete()
      .match({ user_id: session.user.id, nft_id: id });
    if (error) throw error;

    const { data } = await supabase
      .from("favorites")
      .select("nft_id")
      .eq("user_id", session.user.id);
    return data?.map((f) => f.nft_id) ?? [];
  },
  cart: async (): Promise<CartView> => {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session) {
      return {
        items: [],
        coupon: null,
        summary: { subtotal: "0", discount: "0", networkFee: "0", total: "0" },
      };
    }

    const { data: cart, error: cartError } = await supabase
      .from("carts")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();
    if (cartError) throw cartError;
    const { data: itemsData, error: itemsError } = await supabase
      .from("cart_items")
      .select("quantity, added_price, nfts(id, name, collection, image, price, available)")
      .eq("cart_id", session.user.id);
    if (itemsError) throw itemsError;

    const items = ((itemsData ?? []) as CartItemRow[]).map((row): CartItem => {
      if (!row.nfts) throw new Error("O item do carrinho referencia um NFT inexistente.");
      return {
        nftId: row.nfts.id,
        name: row.nfts.name,
        collection: row.nfts.collection,
        image: row.nfts.image,
        quantity: row.quantity,
        unitPrice: String(row.nfts.price),
        addedPrice: String(row.added_price),
        available: row.nfts.available,
      };
    });

    const coupon = cart?.coupon ?? null;
    const summary = computeTotals(items, coupon, "Ethereum");
    return { items, coupon, summary };
  },
  addToCart: async (nftId: string, quantity: number) => {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session)
      throw new ApiError(401, "UNAUTHORIZED", "Inicie sessão para adicionar ao carrinho.");

    const { data: nft, error: nftError } = await supabase
      .from("nfts")
      .select("price, available")
      .eq("id", nftId)
      .maybeSingle();
    if (nftError) throw nftError;
    if (!nft) throw new ApiError(404, "NOT_FOUND", "NFT não encontrado.");

    const { data: cart, error: cartError } = await supabase
      .from("carts")
      .select("user_id")
      .eq("user_id", session.user.id)
      .maybeSingle();
    if (cartError) throw cartError;
    if (!cart) {
      const { error } = await supabase.from("carts").insert({ user_id: session.user.id });
      if (error) throw error;
    }

    const { data: existing, error: existingError } = await supabase
      .from("cart_items")
      .select("*")
      .eq("cart_id", session.user.id)
      .eq("nft_id", nftId)
      .maybeSingle();
    if (existingError) throw existingError;

    if (existing) {
      const newQty = existing.quantity + quantity;
      if (newQty > nft.available)
        throw new ApiError(409, "UNAVAILABLE", `Apenas ${nft.available} disponíveis.`);
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity: newQty })
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      if (quantity > nft.available)
        throw new ApiError(409, "UNAVAILABLE", `Apenas ${nft.available} disponíveis.`);
      const { error } = await supabase.from("cart_items").insert({
        cart_id: session.user.id,
        nft_id: nftId,
        quantity,
        added_price: nft.price,
      });
      if (error) throw error;
    }

    return api.cart();
  },
  setQuantity: async (nftId: string, quantity: number) => {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session) throw new ApiError(401, "UNAUTHORIZED", "Não autorizado");
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity })
      .match({ cart_id: session.user.id, nft_id: nftId });
    if (error) throw error;
    return api.cart();
  },
  removeItem: async (nftId: string) => {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session) throw new ApiError(401, "UNAUTHORIZED", "Não autorizado");
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .match({ cart_id: session.user.id, nft_id: nftId });
    if (error) throw error;
    return api.cart();
  },
  applyCoupon: async (code: string) => {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session) throw new ApiError(401, "UNAUTHORIZED", "Não autorizado");
    const { error } = await supabase
      .from("carts")
      .update({ coupon: code })
      .eq("user_id", session.user.id);
    if (error) throw error;
    return api.cart();
  },
  removeCoupon: async () => {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session) throw new ApiError(401, "UNAUTHORIZED", "Não autorizado");
    const { error } = await supabase
      .from("carts")
      .update({ coupon: null })
      .eq("user_id", session.user.id);
    if (error) throw error;
    return api.cart();
  },
  mergeCart: async () => api.cart(),
  quote: async (network: Network) => {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session) throw new ApiError(401, "UNAUTHORIZED", "Não autorizado");

    const { data: cart, error: cartError } = await supabase
      .from("carts")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();
    if (cartError) throw cartError;
    const { data: itemsData, error: itemsError } = await supabase
      .from("cart_items")
      .select("quantity, nfts(id, name, image, price)")
      .eq("cart_id", session.user.id);
    if (itemsError) throw itemsError;
    if (!itemsData?.length) throw new ApiError(422, "VALIDATION", "O seu carrinho está vazio.");

    const lines = (
      itemsData as {
        quantity: number;
        nfts: {
          id: string;
          name: string;
          image: string;
          price: string | number;
        } | null;
      }[]
    ).map((row) => {
      if (!row.nfts) throw new Error("O item do carrinho referencia um NFT inexistente.");
      const unitPrice = String(row.nfts.price);
      const quantity = row.quantity;
      const lineTotals = computeTotals([{ unitPrice, quantity }], null, network);
      return {
        nftId: row.nfts.id,
        name: row.nfts.name,
        image: row.nfts.image,
        quantity,
        unitPrice,
        lineTotal: lineTotals.subtotal,
      };
    });

    const totals = computeTotals(lines, cart?.coupon ?? null, network);
    const quote: Quote = {
      id: `q-${Date.now()}`,
      network,
      lines,
      coupon: cart?.coupon ?? null,
      ...totals,
      expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
    };

    const { error } = await supabase.from("quotes").insert({
      id: quote.id,
      user_id: session.user.id,
      network: quote.network,
      lines: quote.lines,
      coupon: quote.coupon,
      subtotal: quote.subtotal,
      discount: quote.discount,
      network_fee: quote.networkFee,
      total: quote.total,
      expires_at: quote.expiresAt,
    });
    if (error) throw error;
    return quote;
  },
  createOrder: async (b: CreateOrderBody, idempotencyKey: string) => {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session) throw new ApiError(401, "UNAUTHORIZED", "Não autorizado");

    const { data: quoteRecord, error: quoteError } = await supabase
      .from("quotes")
      .select("*")
      .eq("id", b.quoteId)
      .eq("user_id", session.user.id)
      .maybeSingle();
    if (quoteError) throw quoteError;
    if (!quoteRecord) throw new ApiError(404, "NOT_FOUND", "Cotação não encontrada.");
    if (new Date(quoteRecord.expires_at).getTime() < Date.now())
      throw new ApiError(409, "PRICE_CHANGED", "A cotação expirou. Atualize a página.");

    const txHash = `0x${[...crypto.getRandomValues(new Uint8Array(32))]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("")}`;
    const orderId = `KR-${Math.floor(Math.random() * 100000)}`;
    const orderPayload = {
      id: orderId,
      user_id: session.user.id,
      status: "confirmed",
      network: b.network,
      wallet_id: b.walletId,
      collector: b.collector,
      quote: quoteRecord,
      tx_hash: txHash,
      explorer_url: `https://sepolia.etherscan.io/tx/${txHash}`,
      decline_reason: null,
      idempotency_key: idempotencyKey,
      body_hash: JSON.stringify([b.quoteId, b.total, b.walletId, b.network, b.collector]),
    };

    const { data: newOrder, error: orderError } = await supabase
      .from("orders")
      .insert(orderPayload)
      .select("*, wallets(*)")
      .single();
    if (orderError) {
      if (orderError.code === "23505") {
        const { data: existing, error: existingError } = await supabase
          .from("orders")
          .select("*, wallets(*)")
          .eq("idempotency_key", idempotencyKey)
          .eq("user_id", session.user.id)
          .maybeSingle();
        if (existingError) throw existingError;
        if (existing) {
          if (!existing.wallets) throw new Error("A encomenda não tem uma carteira associada.");
          return {
            id: existing.id,
            status: existing.status,
            createdAt: existing.created_at,
            network: existing.network,
            wallet: existing.wallets as Wallet,
            collector: existing.collector,
            quote: existing.quote,
            txHash: existing.tx_hash,
            explorerUrl: existing.explorer_url,
            declineReason: existing.decline_reason,
            version: existing.version,
          } as Order;
        }
      }
      throw orderError;
    }
    if (!newOrder.wallets) throw new Error("A encomenda não tem uma carteira associada.");

    const { error: clearCartError } = await supabase
      .from("cart_items")
      .delete()
      .eq("cart_id", session.user.id);
    if (clearCartError) throw clearCartError;

    // Atualiza o inventário de cada NFT comprado silenciosamente, sem bloquear a compra
    for (const line of quoteRecord.lines as Quote["lines"]) {
      const { data: nft } = await supabase
        .from("nfts")
        .select("available")
        .eq("id", line.nftId)
        .single();
      if (nft) {
        await supabase
          .from("nfts")
          .update({ available: Math.max(0, nft.available - line.quantity) })
          .eq("id", line.nftId);
      }
    }

    return {
      id: newOrder.id,
      status: newOrder.status,
      createdAt: newOrder.created_at,
      network: newOrder.network,
      wallet: newOrder.wallets as Wallet,
      collector: newOrder.collector,
      quote: newOrder.quote,
      txHash: newOrder.tx_hash,
      explorerUrl: newOrder.explorer_url,
      declineReason: newOrder.decline_reason,
      version: newOrder.version,
    } as Order;
  },
  orders: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return [];
    const { data, error } = await supabase
      .from("orders")
      .select("*, wallets(*)")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((o) => {
      if (!o.wallets) throw new Error(`A encomenda ${o.id} não tem uma carteira associada.`);
      return {
        id: o.id,
        status: o.status,
        createdAt: o.created_at,
        network: o.network,
        wallet: o.wallets as Wallet,
        collector: o.collector,
        quote: o.quote,
        txHash: o.tx_hash,
        explorerUrl: o.explorer_url,
        declineReason: o.decline_reason,
        version: o.version,
      } as Order;
    });
  },

  order: async (id: string) => {
    const { data, error } = await supabase
      .from("orders")
      .select("*, wallets(*)")
      .eq("id", id)
      .single();
    if (error) throw error;
    if (!data.wallets) throw new Error(`A encomenda ${data.id} não tem uma carteira associada.`);
    return {
      id: data.id,
      status: data.status,
      createdAt: data.created_at,
      network: data.network,
      wallet: data.wallets as Wallet,
      collector: data.collector,
      quote: data.quote,
      txHash: data.tx_hash,
      explorerUrl: data.explorer_url,
      declineReason: data.decline_reason,
      version: data.version,
    } as Order;
  },

  me: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new ApiError(401, "UNAUTHORIZED", "Não autorizado");
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();
    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      username: data.username,
      email: session.user.email!,
      phone: data.phone || "",
      bio: data.bio || "",
      avatar: data.avatar || null,
    };
  },

  updateMe: async (b: Omit<User, "id" | "avatar">) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new ApiError(401, "UNAUTHORIZED", "Não autorizado");
    const { data, error } = await supabase
      .from("profiles")
      .update({ name: b.name, username: b.username, phone: b.phone, bio: b.bio })
      .eq("id", session.user.id)
      .select()
      .single();
    if (error) throw error;
    return { ...data, email: session.user.email! } as User;
  },

  updateAvatar: async (dataUrl: string | null) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new ApiError(401, "UNAUTHORIZED", "Não autorizado");
    const { data, error } = await supabase
      .from("profiles")
      .update({ avatar: dataUrl })
      .eq("id", session.user.id)
      .select()
      .single();
    if (error) throw error;
    return { ...data, email: session.user.email! } as User;
  },

  changePassword: async (_b: { current: string; next: string }) => {
    throw new ApiError(
      400,
      "VALIDATION",
      "O login via Google não permite alterar a palavra-passe.",
    );
  },

  wallets: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new ApiError(401, "UNAUTHORIZED", "Não autorizado");
    const { data, error } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", session.user.id);
    if (error) throw error;
    return { wallets: data ?? [], connectedId: null };
  },

  saveWallet: async (w: Omit<Wallet, "id"> & { id?: string }) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new ApiError(401, "UNAUTHORIZED", "Não autorizado");
    const payload = {
      user_id: session.user.id,
      label: w.label,
      provider: w.provider,
      address: w.address,
      role: w.role,
    };
    const req = w.id
      ? supabase.from("wallets").update(payload).eq("id", w.id).select().single()
      : supabase
          .from("wallets")
          .insert({ ...payload, id: `w-${Date.now()}` })
          .select()
          .single();
    const { data, error } = await req;
    if (error) throw error;
    return data as Wallet;
  },

  connectWallet: async (id: string) => ({ connectedId: id }),
  disconnectWallet: async () => ({ connectedId: "" }),
};

const retry = (count: number, e: unknown) => isTransient(e) && count < 2;

export const nftsQuery = (f: CatalogFilters) =>
  queryOptions({ queryKey: keys.list(f), queryFn: ({ signal }) => api.listNfts(f, signal), retry });
export const featuredQuery = () =>
  queryOptions({ queryKey: keys.featured, queryFn: ({ signal }) => api.featured(signal), retry });
export const nftQuery = (id: string) =>
  queryOptions({
    queryKey: keys.nft(id),
    queryFn: ({ signal }) => api.nft(id, signal),
    retry: (c, e) => !(e instanceof ApiError && e.status === 404) && retry(c, e),
  });
export const relatedQuery = (id: string) =>
  queryOptions({
    queryKey: keys.related(id),
    queryFn: ({ signal }) => api.related(id, signal),
    retry,
  });

function subscribeToken(cb: () => void) {
  return onSessionChange(cb);
}

export function useToken() {
  return useSyncExternalStore(subscribeToken, getToken, () => null);
}

export function useScope() {
  const token = useToken();
  const hydrated = useHydrated();
  return { scope: token ?? "guest", ready: hydrated, authed: !!token };
}

export function useSession() {
  const token = useToken();
  const hydrated = useHydrated();
  const q = useQuery({
    queryKey: keys.session(token),
    queryFn: api.session,
    enabled: hydrated && !!token,
    staleTime: 60_000,
    retry,
  });
  return { user: q.data?.user ?? null, isLoading: hydrated ? !!token && q.isLoading : true, token };
}

export function useCart() {
  const { scope, ready } = useScope();
  return useQuery({ queryKey: keys.cart(scope), queryFn: api.cart, enabled: ready, retry });
}

function useCartMutation<V>(fn: (v: V) => Promise<CartView>) {
  const qc = useQueryClient();
  const { scope } = useScope();
  return useMutation({
    mutationFn: fn,
    onSuccess: (data) => qc.setQueryData(keys.cart(scope), data),
  });
}

export const useAddToCart = () =>
  useCartMutation((v: { nftId: string; quantity: number }) => api.addToCart(v.nftId, v.quantity));
export const useSetQuantity = () =>
  useCartMutation((v: { nftId: string; quantity: number }) => api.setQuantity(v.nftId, v.quantity));
export const useRemoveItem = () => useCartMutation((nftId: string) => api.removeItem(nftId));
export const useApplyCoupon = () => useCartMutation((code: string) => api.applyCoupon(code));
export const useRemoveCoupon = () => useCartMutation(() => api.removeCoupon());

export function useFavorites() {
  const { scope, ready, authed } = useScope();
  return useQuery({
    queryKey: keys.favorites(scope),
    queryFn: api.favorites,
    enabled: ready && authed,
    retry,
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  const { scope } = useScope();
  const key = keys.favorites(scope);
  return useMutation({
    mutationFn: ({ id, fav }: { id: string; fav: boolean }) =>
      fav ? api.removeFavorite(id) : api.addFavorite(id),
    onMutate: async ({ id, fav }) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<string[]>(key);
      qc.setQueryData<string[]>(key, (l = []) => (fav ? l.filter((x) => x !== id) : [...l, id]));
      return { prev };
    },
    onError: (_e, _v, ctx) => qc.setQueryData(key, ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}

export function useAuthActions() {
  const qc = useQueryClient();
  const finish = async (s: Session) => {
    await qc.cancelQueries();
    setToken(s.token, "login");
    qc.setQueryData(keys.session(s.token), s);
    const cart = await api.mergeCart().catch(() => null);
    if (cart) qc.setQueryData(keys.cart(s.token), cart);
    return s;
  };
  const login = useMutation({
    mutationFn: (b: { email: string; password: string }) => api.login(b).then(finish),
  });
  const register = useMutation({
    mutationFn: async (b: { name: string; email: string; password: string }) => {
      const session = await api.register(b);
      return session ? finish(session) : null;
    },
  });
  const logout = async () => {
    await qc.cancelQueries();
    await api.logout();
    setToken(null, "logout");
    qc.clear();
  };
  return { login, register, logout };
}

export function useMe() {
  const { scope, ready, authed } = useScope();
  return useQuery({ queryKey: keys.me(scope), queryFn: api.me, enabled: ready && authed, retry });
}

export function useUpdateMe() {
  const qc = useQueryClient();
  const { scope } = useScope();
  return useMutation({
    mutationFn: api.updateMe,
    onSuccess: (u) => {
      qc.setQueryData(keys.me(scope), u);
      void qc.invalidateQueries({ queryKey: ["session"] });
    },
  });
}

export function useUpdateAvatar() {
  const qc = useQueryClient();
  const { scope } = useScope();
  return useMutation({
    mutationFn: api.updateAvatar,
    onSuccess: (u) => {
      qc.setQueryData(keys.me(scope), u);
      void qc.invalidateQueries({ queryKey: ["session"] });
    },
  });
}

export const useChangePassword = () => useMutation({ mutationFn: api.changePassword });

export function useWallets() {
  const { scope, ready, authed } = useScope();
  return useQuery({
    queryKey: keys.wallets(scope),
    queryFn: api.wallets,
    enabled: ready && authed,
    retry,
  });
}

export function useWalletMutations() {
  const qc = useQueryClient();
  const { scope } = useScope();
  const refresh = () => qc.invalidateQueries({ queryKey: keys.wallets(scope) });
  return {
    save: useMutation({ mutationFn: api.saveWallet, onSuccess: refresh }),
    connect: useMutation({ mutationFn: api.connectWallet, onSettled: refresh }),
    disconnect: useMutation({ mutationFn: api.disconnectWallet, onSettled: refresh }),
  };
}

export function useOrders() {
  const { scope, ready, authed } = useScope();
  return useQuery({
    queryKey: keys.orders(scope),
    queryFn: api.orders,
    enabled: ready && authed,
    retry,
  });
}

export function useOrder(id: string) {
  const { scope, ready, authed } = useScope();
  return useQuery({
    queryKey: keys.order(scope, id),
    queryFn: () => api.order(id),
    enabled: ready && authed,
    retry: (c, e) =>
      !(e instanceof ApiError && (e.status === 404 || e.status === 403)) && retry(c, e),
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  const { scope } = useScope();
  return useMutation({
    mutationFn: ({ body, key }: { body: CreateOrderBody; key: string }) =>
      api.createOrder(body, key),
    retry: (count, e) => isTransient(e) && count < 3,
    retryDelay: 400,
    onSuccess: (o) => {
      qc.setQueryData(keys.order(scope, o.id), o);
      void qc.invalidateQueries({ queryKey: keys.orders(scope) });
    },
  });
}

export type { Collector };
