import { addEth, compareEth, mulEth, percentOf, subEth, type Eth } from "@/lib/decimal";
import type { ApiErrorCode, Network } from "@/services/contracts";
import { COUPONS, NETWORK_FEES } from "./fixtures";

export type CouponCheck = { ok: true; code: string; basisPoints: number } | { ok: false; code: ApiErrorCode; message: string };

export function checkCoupon(raw: string): CouponCheck {
  const code = raw.trim().toUpperCase();
  const c = COUPONS[code];
  if (!c) return { ok: false, code: "COUPON_INVALID", message: "Cupom inválido." };
  if (c.expired) return { ok: false, code: "COUPON_EXPIRED", message: "Este cupom expirou." };
  return { ok: true, code, basisPoints: c.basisPoints };
}

export function computeTotals(lines: { unitPrice: Eth; quantity: number }[], coupon: string | null, network: Network) {
  const subtotal = addEth("0", ...lines.map((l) => mulEth(l.unitPrice, l.quantity)));
  const check = coupon ? checkCoupon(coupon) : null;
  const discount = check?.ok ? percentOf(subtotal, check.basisPoints) : "0";
  const empty = compareEth(subtotal, "0") === 0;
  const networkFee = empty ? "0" : NETWORK_FEES[network];
  return { subtotal, discount, networkFee, total: addEth(subEth(subtotal, discount), networkFee) };
}
