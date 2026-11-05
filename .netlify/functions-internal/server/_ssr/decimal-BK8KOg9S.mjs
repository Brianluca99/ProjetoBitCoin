//#region node_modules/.nitro/vite/services/ssr/assets/decimal-BK8KOg9S.js
var SCALE = 18n;
var ONE = 10n ** SCALE;
function toUnits(value) {
	const s = value.trim();
	const neg = s.startsWith("-");
	const [int = "0", frac = ""] = (neg ? s.slice(1) : s).split(".");
	const units = BigInt(int || "0") * ONE + BigInt((frac + "0".repeat(18)).slice(0, 18) || "0");
	return neg ? -units : units;
}
function fromUnits(units) {
	const neg = units < 0n;
	const abs = neg ? -units : units;
	const int = abs / ONE;
	const frac = (abs % ONE).toString().padStart(18, "0").replace(/0+$/, "");
	return `${neg ? "-" : ""}${int}${frac ? `.${frac}` : ""}`;
}
var addEth = (...values) => fromUnits(values.reduce((s, v) => s + toUnits(v), 0n));
var subEth = (a, b) => fromUnits(toUnits(a) - toUnits(b));
var mulEth = (a, qty) => fromUnits(toUnits(a) * BigInt(Math.trunc(qty)));
var percentOf = (a, basisPoints) => fromUnits(toUnits(a) * BigInt(basisPoints) / 10000n);
var compareEth = (a, b) => {
	const d = toUnits(a) - toUnits(b);
	return d === 0n ? 0 : d > 0n ? 1 : -1;
};
function formatEth(value, maxDigits = 4) {
	const units = toUnits(value);
	const neg = units < 0n;
	const abs = neg ? -units : units;
	const step = 10n ** (SCALE - BigInt(maxDigits));
	const [int = "0", frac = ""] = fromUnits((abs + step / 2n) / step * step).split(".");
	const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
	const f = frac.length < 2 ? frac.padEnd(2, "0") : frac;
	return `${neg ? "−" : ""}${grouped},${f} ETH`;
}
//#endregion
export { percentOf as a, mulEth as i, compareEth as n, subEth as o, formatEth as r, addEth as t };
