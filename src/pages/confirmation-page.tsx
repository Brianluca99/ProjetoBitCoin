import { Link } from "@tanstack/react-router";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { OrderSummary } from "@/components/common/order-summary";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { shortAddress } from "@/lib/store";
import { useOrder } from "@/services/client-api";
import type { Quote } from "@/services/contracts";

export function ConfirmationPage({ id }: { id: string }) {
  const { data: order, isLoading } = useOrder(id);
  const [status, setStatus] = useState<"pending" | "confirming" | "confirmed">("pending");

  useEffect(() => {
    if (order) {
      setStatus("pending");
      const t1 = setTimeout(() => setStatus("confirming"), 1500);
      const t2 = setTimeout(() => setStatus("confirmed"), 3500);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [order]);

  if (isLoading)
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Skeleton className="h-80 w-full" />
      </div>
    );
  if (!order) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-xl font-bold">Pedido não encontrado</h1>
        <Button asChild className="mt-6">
          <Link to="/">Voltar ao catálogo</Link>
        </Button>
      </div>
    );
  }

  const done = status === "confirmed";
  const quote = order.quote as Quote & { network_fee?: string | number };
  const safeTotals = {
    subtotal: String(quote.subtotal),
    discount: String(quote.discount),
    networkFee: String(quote.network_fee ?? quote.networkFee ?? "0"),
    total: String(quote.total),
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="text-center">
        {done ? (
          <CheckCircle2 className="mx-auto size-12 text-success" aria-hidden />
        ) : (
          <Loader2 className="mx-auto size-12 animate-spin text-primary" aria-hidden />
        )}
        <h1 className="mt-4 text-2xl font-bold uppercase">
          {done ? "Compra confirmada!" : "Processando compra"}
        </h1>
        <p role="status" aria-live="polite" className="mt-2 text-sm text-muted-foreground">
          {status === "confirmed" ? "Confirmada on-chain" : "Transação enviada"}
        </p>
      </div>
      <section className="mt-8 space-y-4 rounded border border-border bg-card p-5 text-xs">
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2">
          <dt className="text-muted-foreground">Pedido</dt>
          <dd>{order.id}</dd>
          <dt className="text-muted-foreground">Rede</dt>
          <dd>{order.network}</dd>
          <dt className="text-muted-foreground">Carteira</dt>
          <dd>
            {order.wallet?.label || "Carteira"} · {shortAddress(order.wallet?.address || "")}
          </dd>
          <dt className="text-muted-foreground">Tx hash</dt>
          <dd className="truncate font-mono">{order.txHash}</dd>
        </dl>
        <ul className="space-y-2 border-t border-border pt-4">
          {order.quote.lines.map((item) => (
            <li key={item.nftId} className="flex items-center gap-3">
              <img src={item.image} alt="" className="size-10 rounded bg-sand object-cover" />
              <span className="flex-1 truncate">{item.name}</span>
              <span className="text-muted-foreground">× {item.quantity}</span>
            </li>
          ))}
        </ul>
        <div className="border-t border-border pt-4">
          <OrderSummary totals={safeTotals} coupon={order.quote.coupon} />
        </div>
      </section>
      <div className="mt-6 flex justify-center gap-3">
        <Button asChild variant="outline">
          <Link to="/account/profile">Meus pedidos</Link>
        </Button>
        <Button asChild>
          <Link to="/">Continuar comprando</Link>
        </Button>
      </div>
    </div>
  );
}
