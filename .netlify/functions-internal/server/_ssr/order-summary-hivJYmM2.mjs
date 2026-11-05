import { r as formatEth } from "./decimal-BK8KOg9S.mjs";
import { p as require_jsx_runtime } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/order-summary-hivJYmM2.js
var import_jsx_runtime = require_jsx_runtime();
function OrderSummary({ totals, coupon }) {
	const rows = [
		["Subtotal", formatEth(totals.subtotal)],
		...totals.discount !== "0" ? [[`Desconto${coupon ? ` (${coupon})` : ""}`, `− ${formatEth(totals.discount)}`]] : [],
		["Taxa de rede", formatEth(totals.networkFee)]
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
		className: "space-y-2 text-xs",
		children: [rows.map(([k, v]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
				className: "text-muted-foreground",
				children: k
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
				className: "tabular-nums",
				children: v
			})]
		}, k)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex justify-between border-t border-border pt-3 text-sm font-bold",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Total" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
				className: "tabular-nums text-primary",
				children: formatEth(totals.total)
			})]
		})]
	});
}
//#endregion
export { OrderSummary as t };
