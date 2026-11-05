import { formatEth, type Eth } from "@/lib/decimal";

export interface Totals {
  subtotal: Eth;
  discount: Eth;
  networkFee: Eth;
  total: Eth;
}

export function OrderSummary({ totals, coupon }: { totals: Totals; coupon?: string | null }) {
  const rows: [string, string][] = [
    ["Subtotal", formatEth(totals.subtotal)],
    ...(totals.discount !== "0" ? [[`Desconto${coupon ? ` (${coupon})` : ""}`, `− ${formatEth(totals.discount)}`] as [string, string]] : []),
    ["Taxa de rede", formatEth(totals.networkFee)],
  ];
  return (
    <dl className="space-y-2 text-xs">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between"><dt className="text-muted-foreground">{k}</dt><dd className="tabular-nums">{v}</dd></div>
      ))}
      <div className="flex justify-between border-t border-border pt-3 text-sm font-bold">
        <dt>Total</dt><dd className="tabular-nums text-primary">{formatEth(totals.total)}</dd>
      </div>
    </dl>
  );
}
