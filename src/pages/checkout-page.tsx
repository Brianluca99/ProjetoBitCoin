import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AuthForm } from "@/components/auth/auth-dialog";
import { OrderSummary } from "@/components/common/order-summary";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { formatEth } from "@/lib/decimal";
import { shortAddress } from "@/lib/store";
import { ApiError } from "@/services/http";
import {
  api,
  keys,
  useCart,
  useCreateOrder,
  useScope,
  useSession,
  useWalletMutations,
  useWallets,
} from "@/services/client-api";
import type { CreateOrderBody, Network } from "@/services/contracts";

const NETWORKS: Network[] = ["Ethereum", "Polygon", "Base"];
const PENDING_ORDER_KEY = "kurio-pending-order-v1";

interface PendingOrder {
  userId: string;
  fingerprint: string;
  key: string;
  body: CreateOrderBody;
}

function pendingOrderStorageKey(userId: string) {
  return `${PENDING_ORDER_KEY}:${userId}`;
}

function readPendingOrder(userId: string): PendingOrder | null {
  const storageKey = pendingOrderStorageKey(userId);
  const raw = localStorage.getItem(storageKey);
  if (!raw) return null;
  try {
    const pending = JSON.parse(raw) as PendingOrder;
    if (
      typeof pending.userId === "string" &&
      typeof pending.fingerprint === "string" &&
      typeof pending.key === "string" &&
      pending.body &&
      typeof pending.body.quoteId === "string"
    ) {
      return pending;
    }
  } catch (error) {
    console.error("Could not read the pending order recovery data.", error);
  }
  localStorage.removeItem(storageKey);
  return null;
}

function clearPendingOrder(userId: string) {
  localStorage.removeItem(pendingOrderStorageKey(userId));
}

export function CheckoutPage() {
  const { ready, authed, scope } = useScope();
  const { user, isLoading: sessionLoading } = useSession();
  const cartQuery = useCart();
  const cartData = cartQuery.data;
  const cart = cartData?.items ?? [];
  const coupon = cartData?.coupon ?? null;
  const walletsQuery = useWallets();
  const walletsData = walletsQuery.data;
  const wallets = walletsData?.wallets ?? [];
  const [network, setNetwork] = useState<Network>("Ethereum");
  const [walletId, setWalletId] = useState("");
  const create = useCreateOrder();
  const createOrderMutation = create.mutate;
  const walletMutations = useWalletMutations();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const recoveringKey = useRef<string | null>(null);
  const [recoveringOrder, setRecoveringOrder] = useState(false);
  const [recoveryError, setRecoveryError] = useState(false);
  const [reconfirmationRequired, setReconfirmationRequired] = useState(false);
  const wallet = wallets.find(
    (item) => item.id === (walletId || walletsData?.connectedId || wallets[0]?.id),
  );
  const quoteQuery = useQuery({
    queryKey: keys.quote(scope, network),
    queryFn: () => api.quote(network),
    enabled: ready && authed && !!cart.length,
    retry: 1,
  });

  useEffect(() => {
    if (!ready || !authed || sessionLoading || !user) return;
    const pending = readPendingOrder(user.id);
    if (!pending || recoveringKey.current === pending.key) return;
    recoveringKey.current = pending.key;
    setRecoveringOrder(true);
    createOrderMutation(pending, {
      onSuccess: (order) => {
        clearPendingOrder(pending.userId);
        setRecoveringOrder(false);
        void navigate({ to: "/order/$id", params: { id: order.id } });
      },
      onError: (error) => {
        setRecoveringOrder(false);
        setRecoveryError(true);
        recoveringKey.current = null;
        if (error instanceof ApiError && error.code === "PRICE_CHANGED") {
          if (error.quote) {
            queryClient.setQueryData(keys.quote(scope, error.quote.network), error.quote);
            setReconfirmationRequired(true);
          }
          clearPendingOrder(pending.userId);
        }
        toast.error(
          error instanceof ApiError
            ? error.message
            : "Não foi possível recuperar o pedido. Tente novamente.",
        );
      },
    });
  }, [ready, authed, sessionLoading, user, createOrderMutation, navigate, queryClient, scope]);

  if (!ready || sessionLoading || (authed && (cartQuery.isLoading || walletsQuery.isLoading))) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }
  if (!authed || !user) {
    return (
      <div className="mx-auto max-w-sm px-4 py-12">
        <p className="mb-4 text-sm text-muted-foreground">
          Entre na sua conta para finalizar a compra.
        </p>
        <AuthForm mode="login" />
      </div>
    );
  }
  if (recoveringOrder) {
    return (
      <div role="status" className="mx-auto max-w-md px-4 py-20 text-center">
        <Loader2 className="mx-auto size-8 animate-spin text-primary" />
        <p className="mt-4 text-sm">Recuperando sua tentativa de compra…</p>
      </div>
    );
  }
  if (recoveryError) {
    const pending = readPendingOrder(user.id);
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p role="alert" className="text-sm text-destructive">
          Não foi possível confirmar se o pedido foi criado.
        </p>
        {pending && pending.userId === user.id ? (
          <Button
            className="mt-4"
            onClick={() => {
              recoveringKey.current = pending.key;
              setRecoveryError(false);
              setRecoveringOrder(true);
              createOrderMutation(pending, {
                onSuccess: (order) => {
                  clearPendingOrder(pending.userId);
                  setRecoveringOrder(false);
                  void navigate({ to: "/order/$id", params: { id: order.id } });
                },
                onError: (error) => {
                  setRecoveringOrder(false);
                  setRecoveryError(true);
                  recoveringKey.current = null;
                  if (error instanceof ApiError && error.code === "PRICE_CHANGED") {
                    if (error.quote) {
                      queryClient.setQueryData(keys.quote(scope, error.quote.network), error.quote);
                      setReconfirmationRequired(true);
                    }
                    clearPendingOrder(pending.userId);
                  }
                  toast.error(
                    error instanceof ApiError ? error.message : "Falha ao recuperar o pedido.",
                  );
                },
              });
            }}
          >
            Tentar recuperar pedido
          </Button>
        ) : (
          <Button className="mt-4" onClick={() => setRecoveryError(false)}>
            Continuar e revisar a cotação
          </Button>
        )}
      </div>
    );
  }
  if (cartQuery.isError) {
    return (
      <div role="alert" className="mx-auto max-w-md px-4 py-16 text-center text-sm">
        Não foi possível carregar o carrinho.{" "}
        <Button variant="link" onClick={() => void cartQuery.refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }
  if (!cart.length) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-sm text-muted-foreground">Seu carrinho está vazio.</p>
        <Button asChild className="mt-4">
          <Link to="/">Explorar NFTs</Link>
        </Button>
      </div>
    );
  }

  const pay = async () => {
    const pending = readPendingOrder(user.id);
    if (pending) {
      createOrderMutation(pending, {
        onSuccess: (order) => {
          clearPendingOrder(pending.userId);
          void navigate({ to: "/order/$id", params: { id: order.id } });
        },
        onError: (error) => {
          if (error instanceof ApiError && error.code === "PRICE_CHANGED" && error.quote) {
            queryClient.setQueryData(keys.quote(scope, error.quote.network), error.quote);
            setReconfirmationRequired(true);
            clearPendingOrder(pending.userId);
          } else if (
            error instanceof ApiError &&
            error.status >= 400 &&
            error.status < 500 &&
            error.status !== 401
          ) {
            clearPendingOrder(pending.userId);
          }
          toast.error(
            error instanceof ApiError ? error.message : "Não foi possível recuperar o pedido.",
          );
        },
      });
      return;
    }
    if (!wallet) {
      toast.error("Adicione uma carteira antes de pagar.");
      return;
    }
    if (!quoteQuery.data) {
      toast.error("A cotação ainda não está disponível. Tente novamente.");
      return;
    }
    const body: CreateOrderBody = {
      quoteId: quoteQuery.data.id,
      total: quoteQuery.data.total,
      walletId: wallet.id,
      network,
      collector: { name: user.name, email: user.email, phone: user.phone },
    };
    if (walletsData?.connectedId !== wallet.id) {
      try {
        await walletMutations.connect.mutateAsync(wallet.id);
      } catch (error) {
        toast.error(
          error instanceof ApiError ? error.message : "Não foi possível conectar a carteira.",
        );
        return;
      }
    }
    const fingerprint = JSON.stringify([
      user.id,
      quoteQuery.data.lines,
      quoteQuery.data.coupon ?? coupon,
      quoteQuery.data.subtotal,
      quoteQuery.data.discount,
      quoteQuery.data.networkFee,
      quoteQuery.data.total,
      wallet.id,
      network,
      body.collector,
    ]);
    const previous = readPendingOrder(user.id);
    let attempt: PendingOrder;
    if (previous && previous.userId === user.id && previous.fingerprint === fingerprint) {
      attempt = previous;
    } else {
      attempt = { userId: user.id, fingerprint, key: crypto.randomUUID(), body };
    }
    try {
      localStorage.setItem(pendingOrderStorageKey(user.id), JSON.stringify(attempt));
    } catch (error) {
      console.error("Could not persist the idempotent order attempt.", error);
      toast.error("Não foi possível salvar a tentativa de compra para recuperação.");
      return;
    }
    createOrderMutation(attempt, {
      onSuccess: (order) => {
        clearPendingOrder(attempt.userId);
        void navigate({ to: "/order/$id", params: { id: order.id } });
      },
      onError: (error) => {
        if (error instanceof ApiError && error.code === "PRICE_CHANGED" && error.quote) {
          queryClient.setQueryData(keys.quote(scope, network), error.quote);
          setReconfirmationRequired(true);
          clearPendingOrder(attempt.userId);
        } else if (
          error instanceof ApiError &&
          error.status >= 400 &&
          error.status < 500 &&
          error.status !== 401
        ) {
          clearPendingOrder(attempt.userId);
        }
        toast.error(error instanceof ApiError ? error.message : "Não foi possível criar o pedido.");
      },
    });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold uppercase">Checkout</h1>
      <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-8">
          <fieldset className="rounded border border-border bg-card p-5">
            <legend className="px-1 text-sm font-bold uppercase">Rede</legend>
            <RadioGroup
              value={network}
              onValueChange={(value) => {
                const selected = NETWORKS.find((item) => item === value);
                if (selected) setNetwork(selected);
              }}
              className="mt-2 grid gap-2 sm:grid-cols-3"
            >
              {NETWORKS.map((item) => (
                <Label
                  key={item}
                  htmlFor={`net-${item}`}
                  className="flex cursor-pointer items-center gap-2 rounded border border-border p-3 text-xs has-[[data-state=checked]]:border-primary"
                >
                  <RadioGroupItem id={`net-${item}`} value={item} /> {item}
                </Label>
              ))}
            </RadioGroup>
          </fieldset>
          <fieldset className="rounded border border-border bg-card p-5">
            <legend className="px-1 text-sm font-bold uppercase">Carteira de pagamento</legend>
            {walletsQuery.isError ? (
              <p role="alert" className="mt-2 text-xs text-destructive">
                Não foi possível carregar suas carteiras.
              </p>
            ) : wallets.length ? (
              <RadioGroup
                value={wallet?.id ?? ""}
                onValueChange={setWalletId}
                className="mt-2 space-y-2"
              >
                {wallets.map((item) => (
                  <Label
                    key={item.id}
                    htmlFor={`w-${item.id}`}
                    className="flex cursor-pointer items-center gap-3 rounded border border-border p-3 text-xs has-[[data-state=checked]]:border-primary"
                  >
                    <RadioGroupItem id={`w-${item.id}`} value={item.id} />
                    <span className="flex-1">
                      {item.label} <span className="text-muted-foreground">· {item.provider}</span>
                    </span>
                    <span className="font-mono text-muted-foreground">
                      {shortAddress(item.address)}
                    </span>
                  </Label>
                ))}
              </RadioGroup>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">
                Nenhuma carteira.{" "}
                <Link to="/account/wallets" className="text-primary underline">
                  Adicionar carteira
                </Link>
              </p>
            )}
          </fieldset>
          <section className="rounded border border-border bg-card p-5">
            <h2 className="text-sm font-bold uppercase">Itens</h2>
            <ul className="mt-3 space-y-3">
              {cart.map((item) => (
                <li key={item.nftId} className="flex items-center gap-3 text-xs">
                  <img src={item.image} alt="" className="size-12 rounded bg-sand object-cover" />
                  <span className="flex-1 truncate">{item.name}</span>
                  <span className="text-muted-foreground">× {item.quantity}</span>
                  <span className="tabular-nums">{formatEth(item.unitPrice)}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
        <aside
          aria-label="Resumo"
          className="h-fit space-y-5 rounded border border-border bg-card p-5"
        >
          {quoteQuery.isError ? (
            <div role="alert" className="text-xs text-destructive">
              Não foi possível validar a compra.{" "}
              <Button
                variant="link"
                className="h-auto p-0"
                onClick={() => void quoteQuery.refetch()}
              >
                Tentar novamente
              </Button>
            </div>
          ) : quoteQuery.data ? (
            <OrderSummary totals={quoteQuery.data} coupon={quoteQuery.data.coupon} />
          ) : (
            <div className="space-y-2" aria-busy="true">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          )}
          <Button
            className="w-full uppercase"
            onClick={pay}
            disabled={
              create.isPending || walletMutations.connect.isPending || !quoteQuery.data || !wallet
            }
          >
            {(create.isPending || walletMutations.connect.isPending) && (
              <Loader2 className="animate-spin" />
            )}
            {reconfirmationRequired ? "Confirmar cotação atualizada" : "Confirmar pagamento"}
          </Button>
        </aside>
      </div>
    </div>
  );
}
