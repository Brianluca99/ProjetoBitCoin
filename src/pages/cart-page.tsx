import { Link, useNavigate } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { OrderSummary } from "@/components/common/order-summary";
import { QuantityStepper } from "@/components/common/quantity-stepper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { formatEth, mulEth } from "@/lib/decimal";
import { actions } from "@/lib/store";
import { ApiError } from "@/services/http";
import { useApplyCoupon, useCart, useRemoveCoupon, useRemoveItem, useScope, useSetQuantity } from "@/services/client-api";

const onFail = (e: unknown) => toast.error(e instanceof ApiError ? e.message : "Não foi possível atualizar o carrinho.");

export function CartPage() {
  const cart = useCart();
  const { authed } = useScope();
  const setQty = useSetQuantity();
  const remove = useRemoveItem();
  const apply = useApplyCoupon();
  const removeCoupon = useRemoveCoupon();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const data = cart.data;

  const onApply = (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    apply.mutate(code.trim(), { onSuccess: () => setCode(""), onError: (e) => setErr(e instanceof ApiError ? e.message : "Cupom inválido.") });
  };

  const checkout = () => (authed ? navigate({ to: "/checkout" }) : actions.openAuth("login"));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold uppercase">Carrinho</h1>
      {cart.isLoading || !data ? (
        cart.isError ? (
          <div role="alert" className="rounded border border-border p-8 text-center text-sm">
            Não foi possível carregar o carrinho. <Button variant="link" onClick={() => cart.refetch()}>Tentar novamente</Button>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]" aria-busy="true">
            <div className="space-y-4">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-28 w-full" />)}</div>
            <Skeleton className="h-64 w-full" />
          </div>
        )
      ) : data.items.length === 0 ? (
        <div className="rounded border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">Seu carrinho está vazio.</p>
          <Button asChild className="mt-4 uppercase"><Link to="/">Explorar NFTs</Link></Button>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <ul className="divide-y divide-border rounded border border-border bg-card">
            {data.items.map((c) => (
              <li key={c.nftId} className="flex flex-wrap items-center gap-4 p-4">
                <img src={c.image} alt="" className="size-20 rounded bg-sand object-cover" />
                <div className="min-w-0 flex-1">
                  <Link to="/nft/$id" params={{ id: c.nftId }} className="block truncate text-sm font-bold hover:text-primary">{c.name}</Link>
                  <p className="text-xs text-muted-foreground">{c.collection}</p>
                  <p className="mt-1 text-xs text-primary">{formatEth(c.unitPrice)}</p>
                  {c.unitPrice !== c.addedPrice && (
                    <p role="status" className="mt-1 text-[11px] text-warning">Preço mudou de {formatEth(c.addedPrice)} para {formatEth(c.unitPrice)}</p>
                  )}
                  {c.available < c.quantity && <p role="status" className="mt-1 text-[11px] text-destructive">Apenas {c.available} disponíveis</p>}
                </div>
                <QuantityStepper label={`Quantidade de ${c.name}`} value={c.quantity} max={Math.max(1, c.available)} onChange={(v) => setQty.mutate({ nftId: c.nftId, quantity: v }, { onError: onFail })} />
                <p className="w-28 text-right text-sm font-bold tabular-nums">{formatEth(mulEth(c.unitPrice, c.quantity))}</p>
                <Button variant="ghost" size="icon" aria-label={`Remover ${c.name}`} onClick={() => remove.mutate(c.nftId, { onError: onFail })}><Trash2 /></Button>
              </li>
            ))}
          </ul>
          <aside aria-label="Resumo do pedido" className="h-fit space-y-5 rounded border border-border bg-card p-5">
            <form onSubmit={onApply} className="space-y-2">
              <Label htmlFor="coupon" className="text-xs">Cupom de desconto</Label>
              <div className="flex gap-2">
                <Input id="coupon" value={code} onChange={(e) => setCode(e.target.value)} placeholder="KURIO10" aria-invalid={!!err} aria-describedby="coupon-msg" />
                <Button type="submit" variant="outline" disabled={!code.trim() || apply.isPending}>Aplicar</Button>
              </div>
              <p id="coupon-msg" role="status" className="text-xs">
                {err ? <span className="text-destructive">{err}</span> : data.coupon ? (
                  <span className="text-success">Cupom {data.coupon} aplicado. <button type="button" className="underline" onClick={() => removeCoupon.mutate(undefined)}>Remover</button></span>
                ) : null}
              </p>
            </form>
            <OrderSummary totals={data.summary} coupon={data.coupon} />
            <p className="text-[11px] text-muted-foreground">Valores finais confirmados pelo servidor no checkout.</p>
            <Button className="w-full uppercase" onClick={checkout}>{authed ? "Ir para o checkout" : "Entrar para continuar"}</Button>
          </aside>
        </div>
      )}
    </div>
  );
}
