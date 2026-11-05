import { p as require_jsx_runtime } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
import { a as cn } from "./client-api-DIF2XgCD.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/skeleton-B_MYF5Br.js
var import_jsx_runtime = require_jsx_runtime();
function Skeleton({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		"aria-hidden": "true",
		className: cn("shimmer rounded-md", className),
		...props
	});
}
//#endregion
export { Skeleton as t };
