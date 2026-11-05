import { p as require_jsx_runtime } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
import { n as Button } from "./client-api-DIF2XgCD.mjs";
import { f as Plus, m as Minus } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/quantity-stepper-AgtFly30.js
var import_jsx_runtime = require_jsx_runtime();
function QuantityStepper({ value, min = 1, max, onChange, label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		role: "group",
		"aria-label": label,
		className: "inline-flex items-center rounded border border-input",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "button",
				variant: "ghost",
				size: "icon",
				className: "size-9",
				"aria-label": "Diminuir quantidade",
				disabled: value <= min,
				onClick: () => onChange(value - 1),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, {})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("output", {
				"aria-live": "polite",
				className: "w-8 text-center text-sm tabular-nums",
				children: value
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "button",
				variant: "ghost",
				size: "icon",
				className: "size-9",
				"aria-label": "Aumentar quantidade",
				disabled: value >= max,
				onClick: () => onChange(value + 1),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {})
			})
		]
	});
}
//#endregion
export { QuantityStepper as t };
