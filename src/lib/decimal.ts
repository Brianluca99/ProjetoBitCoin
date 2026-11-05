const SCALE = 18n;
const ONE = 10n ** SCALE;

export type Eth = string;

export function toUnits(
  value: string | number | null | undefined,
  decimals = Number(SCALE),
): bigint {
  if (value === null || value === undefined) return 0n;
  const strValue = String(value).trim();
  if (strValue === "" || strValue === "NaN" || strValue === "undefined") return 0n;

  const negative = strValue.startsWith("-");
  const [integerPart = "0", fractionalPart = ""] = (negative ? strValue.slice(1) : strValue).split(
    ".",
  );
  const paddedFractional = fractionalPart.padEnd(decimals, "0").slice(0, decimals);
  const units =
    BigInt(integerPart || "0") * 10n ** BigInt(decimals) + BigInt(paddedFractional || "0");
  return negative ? -units : units;
}

export function fromUnits(units: bigint): Eth {
  const neg = units < 0n;
  const abs = neg ? -units : units;
  const int = abs / ONE;
  const frac = (abs % ONE).toString().padStart(18, "0").replace(/0+$/, "");
  return `${neg ? "-" : ""}${int}${frac ? `.${frac}` : ""}`;
}

export const addEth = (...values: Eth[]): Eth =>
  fromUnits(values.reduce((s, v) => s + toUnits(v), 0n));
export const subEth = (a: Eth, b: Eth): Eth => fromUnits(toUnits(a) - toUnits(b));
export const mulEth = (a: Eth, qty: number): Eth => fromUnits(toUnits(a) * BigInt(Math.trunc(qty)));
export const percentOf = (a: Eth, basisPoints: number): Eth =>
  fromUnits((toUnits(a) * BigInt(basisPoints)) / 10000n);
export const compareEth = (a: Eth, b: Eth): number => {
  const d = toUnits(a) - toUnits(b);
  return d === 0n ? 0 : d > 0n ? 1 : -1;
};

export function formatEth(value: Eth, maxDigits = 4): string {
  const units = toUnits(value);
  const neg = units < 0n;
  const abs = neg ? -units : units;
  const step = 10n ** (SCALE - BigInt(maxDigits));
  const rounded = ((abs + step / 2n) / step) * step;
  const [int = "0", frac = ""] = fromUnits(rounded).split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const f = frac.length < 2 ? frac.padEnd(2, "0") : frac;
  return `${neg ? "−" : ""}${grouped},${f} ETH`;
}
