import { a as createRequestId$1, c as format$1, i as FetchResponse$1, l as invariant$1, n as resolveWebSocketUrl$1, o as Emitter$2, r as BatchInterceptor, s as isNodeProcess$1, t as getCleanUrl } from "./@mswjs/interceptors+[...].mjs";
import { t as Headers$1 } from "./headers-polyfill+[...].mjs";
import { t as DeferredPromise$1 } from "./open-draft__deferred-promise.mjs";
//#region node_modules/rettime/build/lens-list.mjs
var LensList$1 = class {
	#list;
	#lens;
	constructor() {
		this.#list = [];
		this.#lens = /* @__PURE__ */ new Map();
	}
	get [Symbol.iterator]() {
		return this.#list[Symbol.iterator].bind(this.#list);
	}
	entries() {
		return this.#lens.entries();
	}
	/**
	* Return an order-sensitive list of values by the given key.
	*/
	get(key) {
		return this.#lens.get(key) || [];
	}
	/**
	* Return an order-sensitive list of all values.
	*/
	getAll() {
		return this.#list.map(([, value]) => value);
	}
	/**
	* Append a new value to the given key.
	*/
	append(key, value) {
		this.#list.push([key, value]);
		this.#openLens(key, (list) => list.push(value));
	}
	/**
	* Prepend a new value to the given key.
	*/
	prepend(key, value) {
		this.#list.unshift([key, value]);
		this.#openLens(key, (list) => list.unshift(value));
	}
	/**
	* Delete the value belonging to the given key.
	* Returns `true` if the value was present and removed, `false` otherwise.
	*/
	delete(key, value) {
		if (this.size === 0) return false;
		const values = this.#lens.get(key);
		if (!values) return false;
		const index = values.indexOf(value);
		if (index === -1) return false;
		values.splice(index, 1);
		this.#list.splice(this.#list.findIndex((item) => item[0] === key && item[1] === value), 1);
		return true;
	}
	/**
	* Delete all values belogning to the given key.
	*/
	deleteAll(key) {
		if (this.size === 0) return;
		this.#list = this.#list.filter((item) => item[0] !== key);
		this.#lens.delete(key);
	}
	get size() {
		return this.#list.length;
	}
	clear() {
		if (this.size === 0) return;
		this.#list.length = 0;
		this.#lens.clear();
	}
	#openLens(key, setter) {
		setter(this.#lens.get(key) || this.#lens.set(key, []).get(key));
	}
};
//#endregion
//#region node_modules/rettime/build/index.mjs
var kDefaultPrevented$1 = Symbol("kDefaultPrevented");
var kPropagationStopped$1 = Symbol("kPropagationStopped");
var kImmediatePropagationStopped$1 = Symbol("kImmediatePropagationStopped");
var TypedEvent$1 = class extends MessageEvent {
	/**
	* @note Keep a placeholder property with the return type
	* because the type must be set somewhere in order to be
	* correctly associated and inferred from the event.
	*/
	#returnType;
	[kDefaultPrevented$1];
	[kPropagationStopped$1];
	[kImmediatePropagationStopped$1];
	constructor(...args) {
		/**
		* @note Always provide an event initializer. Some runtimes
		* (e.g. Cloudflare Workers) throw when constructing a `MessageEvent`
		* with an `undefined` initializer, unlike Node.js and browsers.
		*/
		super(args[0], args[1] ?? {});
		this[kDefaultPrevented$1] = false;
	}
	get defaultPrevented() {
		return this[kDefaultPrevented$1];
	}
	preventDefault() {
		super.preventDefault();
		this[kDefaultPrevented$1] = true;
	}
	stopImmediatePropagation() {
		/**
		* @note Despite `.stopPropagation()` and `.stopImmediatePropagation()` being defined
		* in Node.js, they do nothing. It is safe to re-define them.
		*/
		super.stopImmediatePropagation();
		this[kImmediatePropagationStopped$1] = true;
	}
};
var Emitter$1 = class {
	#listeners;
	#listenerOptions;
	#listenerAbortCleanups;
	#typelessListeners;
	#hookListeners;
	#hookListenerOptions;
	#hookListenerAbortCleanups;
	hooks;
	constructor() {
		this.#listeners = new LensList$1();
		this.#listenerOptions = /* @__PURE__ */ new WeakMap();
		this.#listenerAbortCleanups = /* @__PURE__ */ new WeakMap();
		this.#typelessListeners = /* @__PURE__ */ new WeakSet();
		this.#hookListeners = new LensList$1();
		this.#hookListenerOptions = /* @__PURE__ */ new WeakMap();
		this.#hookListenerAbortCleanups = /* @__PURE__ */ new WeakMap();
		this.hooks = {
			on: (hook, callback, options) => {
				/**
				* @note An already-aborted signal would never fire its 'abort' event,
				* leaving the hook registered indefinitely. Skip registration entirely.
				*/
				if (options?.signal?.aborted) return;
				if (options?.once) {
					const original = callback;
					const wrapper = ((...args) => {
						this.#deleteHookListener(hook, wrapper);
						return original(...args);
					});
					callback = wrapper;
				}
				this.#hookListeners.append(hook, callback);
				if (options) this.#hookListenerOptions.set(callback, options);
				if (options?.signal) {
					const { signal } = options;
					const onAbort = () => {
						this.#deleteHookListener(hook, callback);
					};
					signal.addEventListener("abort", onAbort, { once: true });
					this.#hookListenerAbortCleanups.set(callback, () => {
						signal.removeEventListener("abort", onAbort);
					});
				}
			},
			removeListener: (hook, callback) => {
				this.#deleteHookListener(hook, callback);
			}
		};
	}
	#deleteHookListener(hook, callback) {
		this.#hookListeners.delete(hook, callback);
		const cleanup = this.#hookListenerAbortCleanups.get(callback);
		if (cleanup) {
			cleanup();
			this.#hookListenerAbortCleanups.delete(callback);
		}
	}
	#deleteListener(type, listener) {
		const removed = this.#listeners.delete(type, listener);
		const cleanup = this.#listenerAbortCleanups.get(listener);
		if (cleanup) {
			cleanup();
			this.#listenerAbortCleanups.delete(listener);
		}
		return removed;
	}
	/**
	* Adds a listener for the given event type.
	*/
	on(type, listener, options) {
		this.#addListener(type, listener, options);
		return this;
	}
	/**
	* Adds a one-time listener for the given event type.
	*/
	once(type, listener, options) {
		return this.on(type, listener, {
			...options || {},
			once: true
		});
	}
	/**
	* Prepends a listener for the given event type.
	*/
	earlyOn(type, listener, options) {
		this.#addListener(type, listener, options, "prepend");
		return this;
	}
	/**
	* Prepends a one-time listener for the given event type.
	*/
	earlyOnce(type, listener, options) {
		return this.earlyOn(type, listener, {
			...options || {},
			once: true
		});
	}
	/**
	* Emits the given typed event.
	*
	* @returns {boolean} Returns `true` if the event had any listeners, `false` otherwise.
	*/
	emit(event) {
		if (this.#listeners.size === 0) return false;
		/**
		* @note Calculate matching listeners before calling them
		* since one-time listeners will self-destruct.
		*/
		const hasListeners = this.listenerCount(event.type) > 0;
		const proxiedEvent = this.#proxyEvent(event);
		for (const listener of this.#matchListeners(event.type)) {
			if (proxiedEvent.event[kPropagationStopped$1] != null && proxiedEvent.event[kPropagationStopped$1] !== this) {
				proxiedEvent.revoke();
				return false;
			}
			if (proxiedEvent.event[kImmediatePropagationStopped$1]) break;
			this.#callListener(proxiedEvent.event, listener);
		}
		proxiedEvent.revoke();
		return hasListeners;
	}
	/**
	* Emits the given typed event and returns a promise that resolves
	* when all the listeners for that event have settled.
	*
	* @returns {Promise<Array<Emitter.ListenerReturnType>>} A promise that resolves
	* with the return values of all listeners.
	*/
	async emitAsPromise(event) {
		if (this.#listeners.size === 0) return [];
		const pendingListeners = [];
		const proxiedEvent = this.#proxyEvent(event);
		for (const listener of this.#matchListeners(event.type)) {
			if (proxiedEvent.event[kPropagationStopped$1] != null && proxiedEvent.event[kPropagationStopped$1] !== this) {
				proxiedEvent.revoke();
				return [];
			}
			if (proxiedEvent.event[kImmediatePropagationStopped$1]) break;
			const returnValue = await Promise.resolve(this.#callListener(proxiedEvent.event, listener));
			if (!this.#isTypelessListener(listener)) pendingListeners.push(returnValue);
		}
		proxiedEvent.revoke();
		return Promise.allSettled(pendingListeners).then((results) => {
			return results.map((result) => result.status === "fulfilled" ? result.value : result.reason);
		});
	}
	/**
	* Emits the given event and returns a generator that yields
	* the result of each listener in the order of their registration.
	* This way, you stop exhausting the listeners once you get the expected value.
	*/
	*emitAsGenerator(event) {
		if (this.#listeners.size === 0) return;
		const proxiedEvent = this.#proxyEvent(event);
		for (const listener of this.#matchListeners(event.type)) {
			if (proxiedEvent.event[kPropagationStopped$1] != null && proxiedEvent.event[kPropagationStopped$1] !== this) {
				proxiedEvent.revoke();
				return;
			}
			if (proxiedEvent.event[kImmediatePropagationStopped$1]) break;
			const returnValue = this.#callListener(proxiedEvent.event, listener);
			if (!this.#isTypelessListener(listener)) yield returnValue;
		}
		proxiedEvent.revoke();
	}
	/**
	* Removes a listener for the given event type.
	*/
	removeListener(type, listener) {
		const options = this.#listenerOptions.get(listener);
		if (!this.#deleteListener(type, listener)) return;
		/**
		* @note Snapshot the hook list before iterating so a hook that removes
		* another `removeListener` hook can't shift the live array mid-iteration.
		*/
		for (const hook of this.#hookListeners.get("removeListener").slice()) hook(type, listener, options);
	}
	/**
	* Removes all listeners for the given event type.
	* If no event type is provided, removes all existing listeners.
	*/
	removeAllListeners(type) {
		if (type == null) {
			for (const [listenerType, listeners$1] of this.#listeners.entries()) while (listeners$1.length > 0) this.removeListener(listenerType, listeners$1[0]);
			for (const [hookType, hookListener] of [...this.#hookListeners]) if (!this.#hookListenerOptions.get(hookListener)?.persist) this.#deleteHookListener(hookType, hookListener);
			return;
		}
		const listeners = this.listeners(type);
		while (listeners.length > 0) this.removeListener(type, listeners[0]);
	}
	/**
	* Returns the list of listeners for the given event type.
	* If no even type is provided, returns all listeners.
	*/
	listeners(type) {
		if (type == null) return this.#listeners.getAll();
		return this.#listeners.get(type);
	}
	/**
	* Returns the number of listeners for the given event type.
	* If no even type is provided, returns the total number of listeners.
	*/
	listenerCount(type) {
		if (type == null) return this.#listeners.size;
		return this.listeners(type).length;
	}
	#addListener(type, listener, options, insertMode = "append") {
		/**
		* @note An already-aborted signal would never fire its 'abort' event,
		* leaving the listener registered indefinitely. Skip registration entirely.
		*/
		if (options?.signal?.aborted) return;
		for (const hook of this.#hookListeners.get("newListener").slice()) hook(type, listener, options);
		if (type === "*") this.#typelessListeners.add(listener);
		if (insertMode === "prepend") this.#listeners.prepend(type, listener);
		else this.#listeners.append(type, listener);
		if (options) {
			this.#listenerOptions.set(listener, options);
			if (options.signal) {
				const { signal } = options;
				const onAbort = () => {
					this.removeListener(type, listener);
				};
				signal.addEventListener("abort", onAbort, { once: true });
				this.#listenerAbortCleanups.set(listener, () => {
					signal.removeEventListener("abort", onAbort);
				});
			}
		}
	}
	#proxyEvent(event) {
		const { stopPropagation } = event;
		event.stopPropagation = () => {
			event[kPropagationStopped$1] = this;
			stopPropagation.call(event);
		};
		return {
			event,
			revoke() {
				event.stopPropagation = stopPropagation;
			}
		};
	}
	#callListener(event, listener) {
		for (const hook of this.#hookListeners.get("beforeEmit").slice()) if (hook(event) === false) return;
		const returnValue = listener.call(this, event);
		const options = this.#listenerOptions.get(listener);
		if (options?.once) {
			const type = this.#isTypelessListener(listener) ? "*" : event.type;
			if (this.#deleteListener(type, listener)) for (const hook of this.#hookListeners.get("removeListener").slice()) hook(type, listener, options);
		}
		return returnValue;
	}
	/**
	* Return a list of all event listeners relevant for the given event type.
	* This includes the explicit event listeners and also typeless event listeners.
	*
	* @note Snapshot the matching listeners before yielding. Listeners can add or
	* remove other listeners during emission (e.g. `earlyOn` unshifts `#list`),
	* which would otherwise shift the live iterator and re-yield prior entries.
	*/
	*#matchListeners(type) {
		const snapshot = [];
		for (const [key, listener] of this.#listeners) if (key === "*" || key === type) snapshot.push(listener);
		yield* snapshot;
	}
	#isTypelessListener(listener) {
		return this.#typelessListeners.has(listener);
	}
};
//#endregion
//#region node_modules/msw/lib/core/experimental/frames/network-frame.mjs
var NetworkFrame = class {
	constructor(protocol, data) {
		this.protocol = protocol;
		this.data = data;
		this.events = new Emitter$1();
	}
	protocol;
	data;
	events;
};
//#endregion
//#region node_modules/msw/lib/core/experimental/sources/network-source.mjs
var NetworkFrameEvent = class extends TypedEvent$1 {
	frame;
	constructor(type, frame) {
		super(...[type, {}]);
		this.frame = frame;
	}
};
var NetworkSource = class {
	emitter;
	constructor() {
		this.emitter = new Emitter$1();
	}
	async queue(frame) {
		await this.emitter.emitAsPromise(new NetworkFrameEvent("frame", frame));
	}
	on(type, listener, options) {
		this.emitter.on(type, listener, options);
	}
	disable() {
		this.emitter.removeAllListeners();
	}
};
//#endregion
//#region node_modules/msw/lib/core/isCommonAssetRequest.mjs
function isCommonAssetRequest(request) {
	const url = new URL(request.url);
	if (url.protocol === "file:") return true;
	if (/(fonts\.googleapis\.com)/.test(url.hostname)) return true;
	if (/node_modules/.test(url.pathname)) return true;
	if (url.pathname.includes("@vite")) return true;
	return /\.(s?css|less|m?jsx?|m?tsx?|html|ttf|otf|woff|woff2|eot|gif|jpe?g|png|avif|webp|svg|mp4|webm|ogg|mov|mp3|wav|ogg|flac|aac|pdf|txt|csv|json|xml|md|zip|tar|gz|rar|7z)$/i.test(url.pathname);
}
//#endregion
//#region node_modules/msw/lib/core/utils/internal/devUtils.mjs
var LIBRARY_PREFIX = "[MSW]";
function formatMessage(message, ...positionals) {
	return `${LIBRARY_PREFIX} ${format$1(message, ...positionals)}`;
}
function warn$1(message, ...positionals) {
	console.warn(formatMessage(message, ...positionals));
}
function error$1(message, ...positionals) {
	console.error(formatMessage(message, ...positionals));
}
var devUtils = {
	formatMessage,
	warn: warn$1,
	error: error$1
};
var InternalError = class extends Error {
	constructor(message) {
		super(message);
		this.name = "InternalError";
	}
};
//#endregion
//#region node_modules/until-async/lib/index.js
/**
* Gracefully handles a callback that returns a promise.
*
* @example
* await until(() => Promise.resolve(123))
* // [null, 123]
*
* await until(() => Promise.reject(new Error('Oops!')))
* // [new Error('Oops!'), null]
*/
async function until$1(callback) {
	try {
		return [null, await callback().catch((error) => {
			throw error;
		})];
	} catch (error) {
		return [error, null];
	}
}
//#endregion
//#region node_modules/msw/lib/core/utils/request/toPublicUrl.mjs
function toPublicUrl(url) {
	const urlInstance = url instanceof URL ? url : new URL(url);
	if (typeof location !== "undefined" && urlInstance.origin === location.origin) return urlInstance.pathname;
	return urlInstance.origin + urlInstance.pathname;
}
//#endregion
//#region node_modules/msw/lib/core/utils/internal/getCallFrame.mjs
var SOURCE_FRAME = /[/\\]msw[/\\]src[/\\](.+)/;
var BUILD_FRAME = /(node_modules)?[/\\]lib[/\\](core|browser|node|native|iife)[/\\]|^[^/\\]*$/;
function getCallFrame(error) {
	const stack = error.stack;
	if (!stack) return;
	const declarationFrame = stack.split("\n").slice(1).find((frame) => {
		return !(SOURCE_FRAME.test(frame) || BUILD_FRAME.test(frame));
	});
	if (!declarationFrame) return;
	return declarationFrame.replace(/\s*at [^()]*\(([^)]+)\)/, "$1").replace(/^@/, "");
}
//#endregion
//#region node_modules/msw/lib/core/utils/internal/isIterable.mjs
function isIterable(fn) {
	if (!fn) return false;
	return Reflect.has(fn, Symbol.iterator) || Reflect.has(fn, Symbol.asyncIterator);
}
//#endregion
//#region node_modules/msw/lib/shims/statuses.mjs
var __create$1 = Object.create;
var __defProp$2 = Object.defineProperty;
var __getOwnPropDesc$1 = Object.getOwnPropertyDescriptor;
var __getOwnPropNames$1 = Object.getOwnPropertyNames;
var __getProtoOf$1 = Object.getPrototypeOf;
var __hasOwnProp$1 = Object.prototype.hasOwnProperty;
var __commonJS$1 = (cb, mod) => function __require() {
	return mod || (0, cb[__getOwnPropNames$1(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps$1 = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") {
		for (let key of __getOwnPropNames$1(from)) if (!__hasOwnProp$1.call(to, key) && key !== except) __defProp$2(to, key, {
			get: () => from[key],
			enumerable: !(desc = __getOwnPropDesc$1(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM$1 = (mod, isNodeMode, target) => (target = mod != null ? __create$1(__getProtoOf$1(mod)) : {}, __copyProps$1(isNodeMode || !mod || !mod.__esModule ? __defProp$2(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
var require_codes = __commonJS$1({ "node_modules/.pnpm/statuses@2.0.2/node_modules/statuses/codes.json"(exports, module) {
	module.exports = {
		"100": "Continue",
		"101": "Switching Protocols",
		"102": "Processing",
		"103": "Early Hints",
		"200": "OK",
		"201": "Created",
		"202": "Accepted",
		"203": "Non-Authoritative Information",
		"204": "No Content",
		"205": "Reset Content",
		"206": "Partial Content",
		"207": "Multi-Status",
		"208": "Already Reported",
		"226": "IM Used",
		"300": "Multiple Choices",
		"301": "Moved Permanently",
		"302": "Found",
		"303": "See Other",
		"304": "Not Modified",
		"305": "Use Proxy",
		"307": "Temporary Redirect",
		"308": "Permanent Redirect",
		"400": "Bad Request",
		"401": "Unauthorized",
		"402": "Payment Required",
		"403": "Forbidden",
		"404": "Not Found",
		"405": "Method Not Allowed",
		"406": "Not Acceptable",
		"407": "Proxy Authentication Required",
		"408": "Request Timeout",
		"409": "Conflict",
		"410": "Gone",
		"411": "Length Required",
		"412": "Precondition Failed",
		"413": "Payload Too Large",
		"414": "URI Too Long",
		"415": "Unsupported Media Type",
		"416": "Range Not Satisfiable",
		"417": "Expectation Failed",
		"418": "I'm a Teapot",
		"421": "Misdirected Request",
		"422": "Unprocessable Entity",
		"423": "Locked",
		"424": "Failed Dependency",
		"425": "Too Early",
		"426": "Upgrade Required",
		"428": "Precondition Required",
		"429": "Too Many Requests",
		"431": "Request Header Fields Too Large",
		"451": "Unavailable For Legal Reasons",
		"500": "Internal Server Error",
		"501": "Not Implemented",
		"502": "Bad Gateway",
		"503": "Service Unavailable",
		"504": "Gateway Timeout",
		"505": "HTTP Version Not Supported",
		"506": "Variant Also Negotiates",
		"507": "Insufficient Storage",
		"508": "Loop Detected",
		"509": "Bandwidth Limit Exceeded",
		"510": "Not Extended",
		"511": "Network Authentication Required"
	};
} });
var allStatuses = __toESM$1(__commonJS$1({ "node_modules/.pnpm/statuses@2.0.2/node_modules/statuses/index.js"(exports, module) {
	"use strict";
	var codes = require_codes();
	module.exports = status;
	status.message = codes;
	status.code = createMessageToStatusCodeMap(codes);
	status.codes = createStatusCodeList(codes);
	status.redirect = {
		300: true,
		301: true,
		302: true,
		303: true,
		305: true,
		307: true,
		308: true
	};
	status.empty = {
		204: true,
		205: true,
		304: true
	};
	status.retry = {
		502: true,
		503: true,
		504: true
	};
	function createMessageToStatusCodeMap(codes2) {
		var map = {};
		Object.keys(codes2).forEach(function forEachCode(code) {
			var message2 = codes2[code];
			var status2 = Number(code);
			map[message2.toLowerCase()] = status2;
		});
		return map;
	}
	function createStatusCodeList(codes2) {
		return Object.keys(codes2).map(function mapCode(code) {
			return Number(code);
		});
	}
	function getStatusCode(message2) {
		var msg = message2.toLowerCase();
		if (!Object.prototype.hasOwnProperty.call(status.code, msg)) throw new Error("invalid status message: \"" + message2 + "\"");
		return status.code[msg];
	}
	function getStatusMessage(code) {
		if (!Object.prototype.hasOwnProperty.call(status.message, code)) throw new Error("invalid status code: " + code);
		return status.message[code];
	}
	function status(code) {
		if (typeof code === "number") return getStatusMessage(code);
		if (typeof code !== "string") throw new TypeError("code must be a number or string");
		var n = parseInt(code, 10);
		if (!isNaN(n)) return getStatusMessage(n);
		return getStatusCode(code);
	}
} })(), 1);
var statuses = allStatuses.default || allStatuses;
statuses.message;
var statuses_default = statuses;
/*! Bundled license information:

statuses/index.js:
(*!
* statuses
* Copyright(c) 2014 Jonathan Ong
* Copyright(c) 2016 Douglas Christopher Wilson
* MIT Licensed
*)
*/
//#endregion
//#region node_modules/msw/lib/core/utils/HttpResponse/decorators.mjs
var { message: message$1 } = statuses_default;
var kSetCookie = /* @__PURE__ */ Symbol("kSetCookie");
function normalizeResponseInit(init = {}) {
	const status = init?.status || 200;
	const statusText = init?.statusText || message$1[status] || "";
	const headers = new Headers(init?.headers);
	return {
		...init,
		headers,
		status,
		statusText
	};
}
function decorateResponse(response, init) {
	if (init.type) Object.defineProperty(response, "type", {
		value: init.type,
		enumerable: true,
		writable: false
	});
	const responseCookies = init.headers.get("set-cookie");
	if (responseCookies) Object.defineProperty(response, kSetCookie, {
		value: responseCookies,
		enumerable: false,
		writable: false
	});
	return response;
}
function getRawSetCookie(response) {
	return Reflect.get(response, kSetCookie);
}
function copyResponseOwnProperties(source, target) {
	for (const propertyName of Reflect.ownKeys(source)) {
		const descriptor = Object.getOwnPropertyDescriptor(source, propertyName);
		const existingDescriptor = Object.getOwnPropertyDescriptor(target, propertyName);
		if (descriptor && existingDescriptor == null) Object.defineProperty(target, propertyName, descriptor);
	}
}
//#endregion
//#region node_modules/msw/lib/core/HttpResponse.mjs
var bodyType = /* @__PURE__ */ Symbol("bodyType");
var kDefaultContentType = /* @__PURE__ */ Symbol.for("kDefaultContentType");
var HttpResponse = class HttpResponse extends FetchResponse$1 {
	[bodyType] = null;
	constructor(body, init) {
		const responseInit = normalizeResponseInit(init);
		super(body, responseInit);
		decorateResponse(this, responseInit);
	}
	static error() {
		return super.error();
	}
	/**
	* Create a `Response` with a `Content-Type: "text/plain"` body.
	* @example
	* HttpResponse.text('hello world')
	* HttpResponse.text('Error', { status: 500 })
	*/
	static text(body, init) {
		const responseInit = normalizeResponseInit(init);
		const hasExplicitContentType = responseInit.headers.has("Content-Type");
		if (!hasExplicitContentType) responseInit.headers.set("Content-Type", "text/plain");
		if (!responseInit.headers.has("Content-Length")) responseInit.headers.set("Content-Length", body ? new Blob([body]).size.toString() : "0");
		const response = new HttpResponse(body, responseInit);
		if (!hasExplicitContentType) Object.defineProperty(response, kDefaultContentType, {
			value: true,
			enumerable: false
		});
		return response;
	}
	/**
	* Create a `Response` with a `Content-Type: "application/json"` body.
	* @example
	* HttpResponse.json({ firstName: 'John' })
	* HttpResponse.json({ error: 'Not Authorized' }, { status: 401 })
	*/
	static json(body, init) {
		const responseInit = normalizeResponseInit(init);
		const hasExplicitContentType = responseInit.headers.has("Content-Type");
		if (!hasExplicitContentType) responseInit.headers.set("Content-Type", "application/json");
		const responseText = JSON.stringify(body);
		if (!responseInit.headers.has("Content-Length")) responseInit.headers.set("Content-Length", responseText ? new Blob([responseText]).size.toString() : "0");
		const response = new HttpResponse(responseText, responseInit);
		if (!hasExplicitContentType) Object.defineProperty(response, kDefaultContentType, {
			value: true,
			enumerable: false
		});
		return response;
	}
	/**
	* Create a `Response` with a `Content-Type: "application/xml"` body.
	* @example
	* HttpResponse.xml(`<user name="John" />`)
	* HttpResponse.xml(`<article id="abc-123" />`, { status: 201 })
	*/
	static xml(body, init) {
		const responseInit = normalizeResponseInit(init);
		const hasExplicitContentType = responseInit.headers.has("Content-Type");
		if (!hasExplicitContentType) responseInit.headers.set("Content-Type", "text/xml");
		const response = new HttpResponse(body, responseInit);
		if (!hasExplicitContentType) Object.defineProperty(response, kDefaultContentType, {
			value: true,
			enumerable: false
		});
		return response;
	}
	/**
	* Create a `Response` with a `Content-Type: "text/html"` body.
	* @example
	* HttpResponse.html(`<p class="author">Jane Doe</p>`)
	* HttpResponse.html(`<main id="abc-123">Main text</main>`, { status: 201 })
	*/
	static html(body, init) {
		const responseInit = normalizeResponseInit(init);
		const hasExplicitContentType = responseInit.headers.has("Content-Type");
		if (!hasExplicitContentType) responseInit.headers.set("Content-Type", "text/html");
		const response = new HttpResponse(body, responseInit);
		if (!hasExplicitContentType) Object.defineProperty(response, kDefaultContentType, {
			value: true,
			enumerable: false
		});
		return response;
	}
	/**
	* Create a `Response` with an `ArrayBuffer` body.
	* @example
	* const buffer = new ArrayBuffer(3)
	* const view = new Uint8Array(buffer)
	* view.set([1, 2, 3])
	*
	* HttpResponse.arrayBuffer(buffer)
	*/
	static arrayBuffer(body, init) {
		const responseInit = normalizeResponseInit(init);
		const hasExplicitContentType = responseInit.headers.has("Content-Type");
		if (!hasExplicitContentType) responseInit.headers.set("Content-Type", "application/octet-stream");
		if (body && !responseInit.headers.has("Content-Length")) responseInit.headers.set("Content-Length", body.byteLength.toString());
		const response = new HttpResponse(body, responseInit);
		if (!hasExplicitContentType) Object.defineProperty(response, kDefaultContentType, {
			value: true,
			enumerable: false
		});
		return response;
	}
	/**
	* Create a `Response` with a `FormData` body.
	* @example
	* const data = new FormData()
	* data.set('name', 'Alice')
	*
	* HttpResponse.formData(data)
	*/
	static formData(body, init) {
		return new HttpResponse(body, normalizeResponseInit(init));
	}
};
//#endregion
//#region node_modules/msw/lib/core/utils/internal/observe-response-body-stream.mjs
function observeResponseBodyStream(response) {
	if (response.body == null || response.bodyUsed || response.body.locked) return null;
	const settled = new DeferredPromise$1();
	const reader = response.body.getReader();
	const observedStream = new ReadableStream({
		async pull(controller) {
			try {
				const readResult = await reader.read();
				if (readResult.done) {
					settled.resolve();
					controller.close();
					return;
				}
				controller.enqueue(readResult.value);
			} catch (error) {
				settled.resolve();
				throw error;
			}
		},
		async cancel(reason) {
			settled.resolve();
			await reader.cancel(reason);
		}
	});
	const observedResponse = new FetchResponse$1(observedStream, {
		status: response.status,
		statusText: response.statusText,
		headers: response.headers
	});
	copyResponseOwnProperties(response, observedResponse);
	return {
		response: observedResponse,
		settled
	};
}
//#endregion
//#region node_modules/msw/lib/core/handlers/RequestHandler.mjs
var RequestHandler = class RequestHandler {
	static cache = /* @__PURE__ */ new WeakMap();
	kind = "request";
	resolver;
	resolverIterator;
	resolverIteratorResult;
	resolverIteratorCleanups;
	options;
	scheduledCleanups;
	info;
	/**
	* Indicates whether this request handler has been used
	* (its resolver has successfully executed).
	*/
	isUsed;
	constructor(args) {
		this.resolver = args.resolver;
		this.options = args.options;
		this.scheduledCleanups = /* @__PURE__ */ new Map();
		const callFrame = getCallFrame(/* @__PURE__ */ new Error());
		this.info = {
			...args.info,
			callFrame
		};
		this.isUsed = false;
	}
	/**
	* Reset the runtime state accumulated during response resolution,
	* such as generator iterator progress. Called when this handler is
	* removed from the active handlers list so re-adding it later starts
	* from a clean state.
	*/
	reset() {
		this.scheduledCleanups.clear();
		const iterator = this.resolverIterator;
		this.resolverIterator = void 0;
		this.resolverIteratorResult = void 0;
		this.resolverIteratorCleanups = void 0;
		if (typeof iterator?.return === "function") Promise.resolve(iterator.return());
	}
	/**
	* Restore this handler so it can match requests again after being
	* exhausted (e.g. via `{ once: true }`). Also clears any accumulated
	* resolution state.
	*/
	restore() {
		if (this.options?.once) {
			this.reset();
			this.isUsed = false;
		}
	}
	/**
	* Parse the intercepted request to extract additional information from it.
	* Parsed result is then exposed to other methods of this request handler.
	*/
	async parse(_args) {
		return {};
	}
	/**
	* Test if this handler matches the given request.
	*
	* This method is not used internally but is exposed
	* as a convenience method for consumers writing custom
	* handlers.
	*/
	async test(args) {
		const parsedResult = await this.parse({
			request: args.request,
			resolutionContext: args.resolutionContext
		});
		return this.predicate({
			request: args.request,
			parsedResult,
			resolutionContext: args.resolutionContext
		});
	}
	extendResolverArgs(_args) {
		return {};
	}
	cloneRequestOrGetFromCache(request) {
		const existingClone = RequestHandler.cache.get(request);
		if (typeof existingClone !== "undefined") return existingClone;
		const clonedRequest = request.clone();
		RequestHandler.cache.set(request, clonedRequest);
		return clonedRequest;
	}
	/**
	* Execute this request handler and produce a mocked response
	* using the given resolver function.
	*/
	async run(args) {
		if (this.isUsed && this.options?.once) return null;
		const requestClone = this.cloneRequestOrGetFromCache(args.request);
		const parsedResult = await this.parse({
			request: args.request,
			resolutionContext: args.resolutionContext
		});
		if (!await this.predicate({
			request: args.request,
			parsedResult,
			resolutionContext: args.resolutionContext
		})) return null;
		if (this.isUsed && this.options?.once) return null;
		this.isUsed = true;
		const executeResolver = this.wrapResolver(this.resolver);
		const resolverExtras = this.extendResolverArgs({
			request: args.request,
			parsedResult
		});
		const listenerController = new AbortController();
		let finalizeFunction;
		const getFinalize = () => {
			if (finalizeFunction == null) {
				if (!args.request.signal.aborted) args.request.signal.addEventListener("abort", () => this.runScheduledCleanups(args.requestId), {
					once: true,
					signal: listenerController.signal
				});
				finalizeFunction = (callback) => {
					this.scheduleCleanup(args.requestId, callback);
					if (args.request.signal.aborted) this.runScheduledCleanups(args.requestId);
				};
			}
			return finalizeFunction;
		};
		const mockedResponse = await executeResolver({
			...resolverExtras,
			get finalize() {
				return getFinalize();
			},
			requestId: args.requestId,
			request: args.request
		}).catch((errorOrResponse) => {
			if (errorOrResponse instanceof Response) return errorOrResponse;
			throw errorOrResponse;
		}).finally(() => {
			listenerController.abort();
		});
		if (mockedResponse) forwardResponseCookies(mockedResponse);
		return this.createExecutionResult({
			request: requestClone,
			requestId: args.requestId,
			response: mockedResponse,
			parsedResult
		});
	}
	wrapResolver(resolver) {
		return async (info) => {
			if (!this.resolverIterator) {
				let result;
				try {
					result = await resolver(info);
				} catch (error) {
					await this.runScheduledCleanups(info.requestId);
					throw error;
				}
				if (!isIterable(result)) return this.complete({
					request: info.request,
					requestId: info.requestId,
					response: result
				});
				const existingCleanups = this.scheduledCleanups.get(info.requestId);
				if (existingCleanups != null && existingCleanups.length > 0) {
					this.resolverIteratorCleanups = existingCleanups;
					this.scheduledCleanups.delete(info.requestId);
				}
				this.resolverIterator = Symbol.iterator in result ? result[Symbol.iterator]() : result[Symbol.asyncIterator]();
			}
			this.isUsed = false;
			const { done, value } = await this.resolverIterator.next();
			const nextResponse = await value;
			if (nextResponse) this.resolverIteratorResult = nextResponse.clone();
			if (done) {
				this.isUsed = true;
				return this.complete({
					request: info.request,
					requestId: info.requestId,
					response: this.resolverIteratorResult?.clone()
				});
			}
			return nextResponse;
		};
	}
	createExecutionResult(args) {
		return {
			handler: this,
			request: args.request,
			requestId: args.requestId,
			response: args.response,
			parsedResult: args.parsedResult
		};
	}
	scheduleCleanup(requestId, callback) {
		if (this.resolverIterator) {
			(this.resolverIteratorCleanups ||= []).unshift(callback);
			return;
		}
		const cleanups = this.scheduledCleanups.get(requestId) || [];
		cleanups.unshift(callback);
		this.scheduledCleanups.set(requestId, cleanups);
	}
	async exhaustCleanups(cleanups) {
		const errors = [];
		for (const cleanup of cleanups) try {
			await cleanup();
		} catch (error) {
			if (error instanceof Error) errors.push(error);
		}
		if (errors.length > 0) devUtils.error("Failed to execute cleanup for request handler \"%s\"", this.info.header, new AggregateError(errors, `Failed to execute cleanup for request handler "${this.info.header}"`));
	}
	/**
	* Remove and return the cleanups scheduled for the given request
	* (or the pending iterator cleanups for generator resolvers).
	*/
	takeScheduledCleanups(requestId) {
		if (this.resolverIterator && this.resolverIteratorCleanups != null && this.resolverIteratorCleanups.length > 0) {
			const cleanups2 = this.resolverIteratorCleanups;
			this.resolverIteratorCleanups = void 0;
			return cleanups2;
		}
		const cleanups = this.scheduledCleanups.get(requestId);
		if (!cleanups || cleanups.length === 0) return;
		this.scheduledCleanups.delete(requestId);
		return cleanups;
	}
	async runScheduledCleanups(requestId) {
		const cleanups = this.takeScheduledCleanups(requestId);
		if (cleanups) await this.exhaustCleanups(cleanups);
	}
	/**
	* Conclude the response resolution for the given request.
	* Runs the scheduled cleanups immediately for responses without a
	* `ReadableStream` body. For streamed responses, returns an observed
	* copy of the response and defers the cleanups until its body settles
	* (is read to completion, errored, or canceled) or the request is
	* aborted, whichever comes first.
	*/
	async complete(args) {
		const cleanups = this.takeScheduledCleanups(args.requestId);
		if (!cleanups) return args.response;
		const observedResponse = args.response ? observeResponseBodyStream(args.response) : null;
		if (!observedResponse) {
			await this.exhaustCleanups(cleanups);
			return args.response;
		}
		const listenerController = new AbortController();
		const runCleanupsOnce = () => {
			if (listenerController.signal.aborted) return;
			listenerController.abort();
			this.exhaustCleanups(cleanups);
		};
		observedResponse.settled.then(runCleanupsOnce);
		if (args.request.signal.aborted) runCleanupsOnce();
		else args.request.signal.addEventListener("abort", runCleanupsOnce, {
			once: true,
			signal: listenerController.signal
		});
		return observedResponse.response;
	}
};
function forwardResponseCookies(response) {
	if (typeof document === "undefined") return;
	const responseCookies = getRawSetCookie(response);
	if (!responseCookies) return;
	const allResponseCookies = Headers$1.prototype.getSetCookie.call(new Headers([["set-cookie", responseCookies]]));
	for (const cookieString of allResponseCookies) document.cookie = cookieString;
}
//#endregion
//#region node_modules/msw/lib/core/utils/executeHandlers.mjs
var executeHandlers = async ({ request, requestId, handlers, resolutionContext }) => {
	let matchingHandler = null;
	let result = null;
	for (const handler of handlers) {
		result = await handler.run({
			request,
			requestId,
			resolutionContext
		});
		if (result !== null) matchingHandler = handler;
		if (result?.response) break;
	}
	if (matchingHandler) return {
		handler: matchingHandler,
		parsedResult: result?.parsedResult,
		response: result?.response
	};
	return null;
};
//#endregion
//#region node_modules/tldts-core/dist/es6/src/domain.js
/**
* Check if `vhost` is a valid suffix of `hostname` (top-domain)
*
* It means that `vhost` needs to be a suffix of `hostname` and we then need to
* make sure that: either they are equal, or the character preceding `vhost` in
* `hostname` is a '.' (it should not be a partial label).
*
* * hostname = 'not.evil.com' and vhost = 'vil.com'      => not ok
* * hostname = 'not.evil.com' and vhost = 'evil.com'     => ok
* * hostname = 'not.evil.com' and vhost = 'not.evil.com' => ok
*/
function shareSameDomainSuffix(hostname, vhost) {
	if (hostname.endsWith(vhost)) return hostname.length === vhost.length || hostname[hostname.length - vhost.length - 1] === ".";
	return false;
}
/**
* Given a hostname and its public suffix, extract the general domain.
*/
function extractDomainWithSuffix(hostname, publicSuffix) {
	const publicSuffixIndex = hostname.length - publicSuffix.length - 2;
	const lastDotBeforeSuffixIndex = hostname.lastIndexOf(".", publicSuffixIndex);
	if (lastDotBeforeSuffixIndex === -1) return hostname;
	return hostname.slice(lastDotBeforeSuffixIndex + 1);
}
/**
* Detects the domain based on rules and upon and a host string
*/
function getDomain$1(suffix, hostname, options) {
	if (options.validHosts !== null) {
		const validHosts = options.validHosts;
		for (const vhost of validHosts) if (shareSameDomainSuffix(hostname, vhost)) return vhost;
	}
	let numberOfLeadingDots = 0;
	if (hostname.startsWith(".")) while (numberOfLeadingDots < hostname.length && hostname[numberOfLeadingDots] === ".") numberOfLeadingDots += 1;
	if (suffix.length === hostname.length - numberOfLeadingDots) return null;
	return extractDomainWithSuffix(hostname, suffix);
}
//#endregion
//#region node_modules/tldts-core/dist/es6/src/domain-without-suffix.js
/**
* Return the part of domain without suffix.
*
* Example: for domain 'foo.com', the result would be 'foo'.
*/
function getDomainWithoutSuffix(domain, suffix) {
	return domain.slice(0, -suffix.length - 1);
}
//#endregion
//#region node_modules/tldts-core/dist/es6/src/extract-hostname.js
/**
* Matches an ASCII tab (U+0009) or newline (U+000A / U+000D). The WHATWG URL
* parser strips these before parsing; we only allocate a cleaned copy (and
* re-parse) on the rare input that actually contains one.
*/
var CONTROL_CHARS$1 = /[\t\n\r]/g;
var extractedHostnameValidated = false;
/**
* True if char `code` is a valid hostname character. This is the per-char half
* of `is-valid.ts`'s `isValidAscii` (a-z, 0-9, > U+007F) PLUS three additions:
* A-Z (the host is lowercased before validation, so uppercase ≡ a valid
* lowercase letter) and '-' / '_' (valid inside a label). KEEP IN SYNC with
* `is-valid.ts`: these rules are deliberately duplicated to validate during
* extraction, so any change to the accepted character set there must be
* mirrored here (and vice-versa).
*/
function isValidHostnameChar(code) {
	return code >= 97 && code <= 122 || code >= 48 && code <= 57 || code > 127 || code >= 65 && code <= 90 || code === 45 || code === 95;
}
/**
* Classify scheme `url.slice(schemeStart, colonIndex)` as a WHATWG special
* scheme without allocating a substring (case-insensitive via `| 32`).
* Special schemes: ftp, file, http, https, ws, wss
* (https://url.spec.whatwg.org/#special-scheme).
*
* @returns 0 = not special, 1 = special, 2 = file (its host sits only between
*          "//" and the next slash).
*/
function getSpecialScheme(url, schemeStart, colonIndex) {
	const length = colonIndex - schemeStart;
	const c0 = url.charCodeAt(schemeStart) | 32;
	if (length === 2) return c0 === 119 && (url.charCodeAt(schemeStart + 1) | 32) === 115 ? 1 : 0;
	else if (length === 3) {
		const c1 = url.charCodeAt(schemeStart + 1) | 32;
		const c2 = url.charCodeAt(schemeStart + 2) | 32;
		if (c0 === 119 && c1 === 115 && c2 === 115) return 1;
		if (c0 === 102 && c1 === 116 && c2 === 112) return 1;
		return 0;
	} else if (length === 4) {
		const c1 = url.charCodeAt(schemeStart + 1) | 32;
		const c2 = url.charCodeAt(schemeStart + 2) | 32;
		const c3 = url.charCodeAt(schemeStart + 3) | 32;
		if (c0 === 104 && c1 === 116 && c2 === 116 && c3 === 112) return 1;
		if (c0 === 102 && c1 === 105 && c2 === 108 && c3 === 101) return 2;
		return 0;
	} else if (length === 5) return c0 === 104 && (url.charCodeAt(schemeStart + 1) | 32) === 116 && (url.charCodeAt(schemeStart + 2) | 32) === 116 && (url.charCodeAt(schemeStart + 3) | 32) === 112 && (url.charCodeAt(schemeStart + 4) | 32) === 115 ? 1 : 0;
	return 0;
}
/**
* Extract a hostname from `url`, matching a WHATWG URL parser's host-boundary
* behaviour (https://url.spec.whatwg.org/#concept-basic-url-parser) for tldts'
* scope. It deliberately does NOT normalise the host (no IDNA/punycode or IPv4
* canonicalisation; IPv6 brackets are stripped, not compressed), strips trailing
* dots, and stays lenient where a strict parser rejects (bare host:port,
* out-of-range port, user@host) — all documented deviations.
*
* @param urlIsValidHostname - when true, `url` is already a valid hostname and is
*   returned by the same reference (factory.ts skips re-validation on that
*   identity), keeping the common path allocation-free.
* @param validate - when true, validate the host inline during the authority
*   scan and publish the verdict via `extractedHostnameValidated` so `parseImpl`
*   can skip the redundant `isValidHostname` pass for simple authorities.
*/
function extractHostname(url, urlIsValidHostname, validate = false) {
	let start = 0;
	let end = url.length;
	let hasUpper = false;
	let isSpecial = false;
	extractedHostnameValidated = false;
	if (!urlIsValidHostname) {
		if (url.startsWith("data:")) return null;
		while (start < url.length && url.charCodeAt(start) <= 32) start += 1;
		while (end > start + 1 && url.charCodeAt(end - 1) <= 32) end -= 1;
		if (url.charCodeAt(start) === 47 && url.charCodeAt(start + 1) === 47) start += 2;
		else {
			const indexOfProtocol = url.indexOf(":/", start);
			if (indexOfProtocol !== -1) {
				const special = getSpecialScheme(url, start, indexOfProtocol);
				if (special === 1) {
					isSpecial = true;
					start = indexOfProtocol + 2;
					while (url.charCodeAt(start) === 47 || url.charCodeAt(start) === 92) start += 1;
				} else if (special === 2) {
					isSpecial = true;
					start = indexOfProtocol + 1;
					let slashes = 0;
					while ((url.charCodeAt(start) === 47 || url.charCodeAt(start) === 92) && slashes < 2) {
						start += 1;
						slashes += 1;
					}
					if (slashes < 2) return null;
				} else {
					for (let i = start; i < indexOfProtocol; i += 1) {
						const code = url.charCodeAt(i) | 32;
						if (!(code >= 97 && code <= 122 || code >= 48 && code <= 57 || code === 46 || code === 45 || code === 43)) {
							const raw = url.charCodeAt(i);
							if (raw === 9 || raw === 10 || raw === 13) return extractHostname(url.replace(CONTROL_CHARS$1, ""), urlIsValidHostname, validate);
							return null;
						}
					}
					if (url.charCodeAt(indexOfProtocol + 2) === 47) start = indexOfProtocol + 3;
					else return null;
				}
			} else if (url.charCodeAt(start) !== 91) {
				let indexOfColon = -1;
				for (let i = start; i < end; i += 1) {
					const code = url.charCodeAt(i);
					if (code === 9 || code === 10 || code === 13) return extractHostname(url.replace(CONTROL_CHARS$1, ""), urlIsValidHostname, validate);
					if (code === 58) {
						indexOfColon = i;
						break;
					}
					if (code === 47 || code === 92 || code === 63 || code === 35) break;
				}
				if (indexOfColon !== -1) {
					let hasIdentifier = false;
					for (let i = indexOfColon + 1; i < end; i += 1) {
						const code = url.charCodeAt(i);
						if (code === 47 || code === 92 || code === 63 || code === 35) break;
						if (code === 64) {
							hasIdentifier = true;
							break;
						}
					}
					if (!hasIdentifier) {
						let allDigits = true;
						let i = indexOfColon + 1;
						for (; i < end; i += 1) {
							const code = url.charCodeAt(i);
							if (code === 47 || code === 92 || code === 63 || code === 35) break;
							if (code < 48 || code > 57) {
								allDigits = false;
								break;
							}
						}
						if (i === indexOfColon + 1) allDigits = false;
						if (!allDigits) {
							const special = getSpecialScheme(url, start, indexOfColon);
							if (special === 0) {
								let isBareIpv6 = false;
								for (let j = indexOfColon + 1; j < end; j += 1) {
									const code = url.charCodeAt(j);
									if (code === 47 || code === 92 || code === 63 || code === 35) break;
									if (code === 58) {
										isBareIpv6 = true;
										break;
									}
								}
								if (!isBareIpv6) return null;
							} else {
								isSpecial = true;
								start = indexOfColon + 1;
								if (special === 2) {
									let slashes = 0;
									while ((url.charCodeAt(start) === 47 || url.charCodeAt(start) === 92) && slashes < 2) {
										start += 1;
										slashes += 1;
									}
									if (slashes < 2) return null;
								} else while (url.charCodeAt(start) === 47 || url.charCodeAt(start) === 92) start += 1;
							}
						}
					}
				}
			}
		}
		let indexOfIdentifier = -1;
		let indexOfClosingBracket = -1;
		let indexOfPort = -1;
		let indexOfFirstColon = -1;
		let hasControl = false;
		let vValid = validate;
		let vLastDot = start - 1;
		let vLastCode = -1;
		if (validate && start < end) {
			const c0 = url.charCodeAt(start);
			if (!(isValidHostnameChar(c0) || c0 === 46 || c0 === 95) || c0 === 45) vValid = false;
		}
		for (let i = start; i < end; i += 1) {
			const code = url.charCodeAt(i);
			if (code < 64) {
				if (code === 47 || code === 35 || code === 63) {
					end = i;
					break;
				} else if (code === 58) {
					if (indexOfFirstColon === -1) indexOfFirstColon = i;
					indexOfPort = i;
				} else if (code === 9 || code === 10 || code === 13) hasControl = true;
				else if (validate) {
					if (code === 46) {
						if (i - vLastDot > 64 || vLastCode === 46 || vLastCode === 45) vValid = false;
						vLastDot = i;
					} else if (code < 48 || code > 57) {
						if (code !== 45 || vLastCode === 46) vValid = false;
					}
				}
			} else if (isSpecial && code === 92) {
				end = i;
				break;
			} else if (code === 64) {
				indexOfIdentifier = i;
				indexOfFirstColon = -1;
			} else if (code === 93) indexOfClosingBracket = i;
			else if (code >= 65 && code <= 90) hasUpper = true;
			else if (validate && !isValidHostnameChar(code)) vValid = false;
			if (validate) vLastCode = code;
		}
		if (hasControl) return extractHostname(url.replace(CONTROL_CHARS$1, ""), urlIsValidHostname, validate);
		if (indexOfIdentifier !== -1 && indexOfIdentifier >= start && indexOfIdentifier < end) start = indexOfIdentifier + 1;
		if (url.charCodeAt(start) === 91) {
			if (indexOfClosingBracket !== -1) return url.slice(start + 1, indexOfClosingBracket).toLowerCase();
			return null;
		} else if (indexOfPort !== -1 && indexOfPort > start && indexOfPort < end && indexOfFirstColon === indexOfPort) end = indexOfPort;
		if (start >= end) return null;
		if (validate && vValid && indexOfIdentifier === -1 && indexOfPort === -1 && indexOfClosingBracket === -1 && url.charCodeAt(end - 1) !== 46 && end - start <= 255 && end - vLastDot - 1 <= 63 && vLastCode !== 45) extractedHostnameValidated = true;
	}
	while (end > start + 1 && url.charCodeAt(end - 1) === 46) end -= 1;
	const hostname = start !== 0 || end !== url.length ? url.slice(start, end) : url;
	if (hasUpper) return hostname.toLowerCase();
	return hostname;
}
//#endregion
//#region node_modules/tldts-core/dist/es6/src/is-ip.js
/**
* Check if a hostname is an IP. You should be aware that this only works
* because `hostname` is already garanteed to be a valid hostname!
*/
function isProbablyIpv4(hostname) {
	if (hostname.length < 7) return false;
	if (hostname.length > 15) return false;
	let numberOfDots = 0;
	for (let i = 0; i < hostname.length; i += 1) {
		const code = hostname.charCodeAt(i);
		if (code === 46) numberOfDots += 1;
		else if (code < 48 || code > 57) return false;
	}
	return numberOfDots === 3 && hostname.charCodeAt(0) !== 46 && hostname.charCodeAt(hostname.length - 1) !== 46;
}
/**
* Similar to isProbablyIpv4.
*/
function isProbablyIpv6(hostname) {
	if (hostname.length < 3) return hostname === "::";
	let start = hostname.startsWith("[") ? 1 : 0;
	let end = hostname.length;
	if (hostname[end - 1] === "]") end -= 1;
	if (end - start > 39) return false;
	let hasColon = false;
	for (; start < end; start += 1) {
		const code = hostname.charCodeAt(start);
		if (code === 58) hasColon = true;
		else if (!(code >= 48 && code <= 57 || code >= 97 && code <= 102 || code >= 65 && code <= 70)) return false;
	}
	return hasColon;
}
/**
* Check if `hostname` is *probably* a valid ip addr (either ipv6 or ipv4).
* This *will not* work on any string. We need `hostname` to be a valid
* hostname.
*/
function isIp(hostname) {
	return isProbablyIpv6(hostname) || isProbablyIpv4(hostname);
}
//#endregion
//#region node_modules/tldts-core/dist/es6/src/is-special-use.js
/**
* Special-use domain names from the IANA "Special-Use Domain Names" registry:
* the authoritative list, created by RFC 6761 and maintained as new RFCs add to
* it: https://www.iana.org/assignments/special-use-domain-names/
* Snapshot: 2026-05-24. (RFC 6761 is not obsoleted; draft-hoffman-rfc6761bis
* proposes to retire its prose but keep this registry, so the registry is the
* source of truth; re-sync this list against it.)
*
* These names never correspond to a public registration, yet neither
* `isIcann` nor `isPrivate` marks one as special-use: most are absent from the
* Public Suffix List (so `a.test` looks like a registrable domain), and the
* few that are listed (`onion`, `home.arpa`) appear there as ordinary ICANN
* suffixes. `isSpecialUse` is the single signal that covers them all.
*
* Per the registry and RFC 6761 ("and any names falling within these domains"),
* the designation covers each listed name AND all of its sub-domains. DNS labels
* are case-insensitive (RFC 4343); `hostname` is expected to be already
* lower-cased and trailing-dot-stripped, as produced by `extractHostname`, the
* same normalization the Public-Suffix-List lookup relies on.
*
* Two groups of registry entries are intentionally excluded: the numeric
* reverse-DNS delegation zones (`10.in-addr.arpa`, the `*.ip6.arpa` ranges, …),
* which are reverse-DNS PTR zones rather than hostnames and whose parents
* (`in-addr.arpa`/`ip6.arpa`) are already in the Public Suffix List; and the
* deprecated `eap-noob.arpa` entry.
*/
var SPECIAL_USE_DOMAINS$1 = [
	"test",
	"localhost",
	"invalid",
	"example",
	"example.com",
	"example.net",
	"example.org",
	"local",
	"onion",
	"alt",
	"home.arpa",
	"ipv4only.arpa",
	"resolver.arpa",
	"service.arpa",
	"6tisch.arpa",
	"eap.arpa"
];
/**
* Return `true` if `hostname` is, or is a sub-domain of, a special-use domain
* (see the registry note above). Expects an already-normalized `hostname`.
*/
function isSpecialUse(hostname) {
	for (const name of SPECIAL_USE_DOMAINS$1) if (hostname.endsWith(name) && (hostname.length === name.length || hostname.charCodeAt(hostname.length - name.length - 1) === 46)) return true;
	return false;
}
//#endregion
//#region node_modules/tldts-core/dist/es6/src/is-valid.js
/**
* Implements fast shallow verification of hostnames. This does not perform a
* struct check on the content of labels (classes of Unicode characters, etc.)
* but instead check that the structure is valid (number of labels, length of
* labels, etc.).
*
* If you need stricter validation, consider using an external library.
*/
function isValidAscii(code) {
	return code >= 97 && code <= 122 || code >= 48 && code <= 57 || code > 127;
}
/**
* Check if a hostname string is valid. It's usually a preliminary check before
* trying to use getDomain or anything else.
*
* Beware: it does not check if the TLD exists.
*/
function is_valid_default(hostname) {
	if (hostname.length > 255) return false;
	if (hostname.length === 0) return false;
	if (!isValidAscii(hostname.charCodeAt(0)) && hostname.charCodeAt(0) !== 46 && hostname.charCodeAt(0) !== 95) return false;
	let lastDotIndex = -1;
	let lastCharCode = -1;
	const len = hostname.length;
	for (let i = 0; i < len; i += 1) {
		const code = hostname.charCodeAt(i);
		if (code === 46) {
			if (i - lastDotIndex > 64 || lastCharCode === 46 || lastCharCode === 45) return false;
			lastDotIndex = i;
		} else if (!(isValidAscii(code) || code === 45 || code === 95) || code === 45 && lastCharCode === 46) return false;
		lastCharCode = code;
	}
	return len - lastDotIndex - 1 <= 63 && lastCharCode !== 45;
}
//#endregion
//#region node_modules/tldts-core/dist/es6/src/options.js
function setDefaultsImpl({ allowIcannDomains = true, allowPrivateDomains = false, detectIp = true, detectSpecialUse = false, extractHostname = true, mixedInputs = true, validHosts = null, validateHostname = true }) {
	return {
		allowIcannDomains,
		allowPrivateDomains,
		detectIp,
		detectSpecialUse,
		extractHostname,
		mixedInputs,
		validHosts,
		validateHostname
	};
}
var DEFAULT_OPTIONS = setDefaultsImpl({});
function setDefaults(options) {
	if (options === void 0) return DEFAULT_OPTIONS;
	return setDefaultsImpl(options);
}
//#endregion
//#region node_modules/tldts-core/dist/es6/src/subdomain.js
/**
* Returns the subdomain of a hostname string
*/
function getSubdomain(hostname, domain) {
	if (domain.length === hostname.length) return "";
	return hostname.slice(0, -domain.length - 1);
}
//#endregion
//#region node_modules/tldts-core/dist/es6/src/factory.js
/**
* Implement a factory allowing to plug different implementations of suffix
* lookup (e.g.: using a trie or the packed hashes datastructures). This is used
* and exposed in `tldts.ts` and `tldts-experimental.ts` bundle entrypoints.
*/
function getEmptyResult() {
	return {
		domain: null,
		domainWithoutSuffix: null,
		hostname: null,
		isIcann: null,
		isIp: null,
		isPrivate: null,
		isSpecialUse: null,
		publicSuffix: null,
		subdomain: null
	};
}
function resetResult(result) {
	result.domain = null;
	result.domainWithoutSuffix = null;
	result.hostname = null;
	result.isIcann = null;
	result.isIp = null;
	result.isPrivate = null;
	result.isSpecialUse = null;
	result.publicSuffix = null;
	result.subdomain = null;
}
function parseImpl(url, step, suffixLookup, partialOptions, result) {
	const options = setDefaults(partialOptions);
	if (typeof url !== "string") return result;
	let urlIsValid = false;
	if (!options.extractHostname) result.hostname = url;
	else if (options.mixedInputs) {
		urlIsValid = is_valid_default(url);
		result.hostname = extractHostname(url, urlIsValid, options.validateHostname);
	} else result.hostname = extractHostname(url, false, options.validateHostname);
	if (options.detectIp && result.hostname !== null) {
		result.isIp = isIp(result.hostname);
		if (result.isIp) return result;
	}
	if (options.validateHostname && options.extractHostname && result.hostname !== null && !(urlIsValid && result.hostname === url) && !extractedHostnameValidated && !is_valid_default(result.hostname)) {
		result.hostname = null;
		return result;
	}
	if (step === 0 || result.hostname === null) return result;
	if (step === 5 && options.detectSpecialUse) result.isSpecialUse = isSpecialUse(result.hostname);
	suffixLookup(result.hostname, options, result);
	if (step === 2 || result.publicSuffix === null) return result;
	result.domain = getDomain$1(result.publicSuffix, result.hostname, options);
	if (step === 3 || result.domain === null) return result;
	result.subdomain = getSubdomain(result.hostname, result.domain);
	if (step === 4) return result;
	result.domainWithoutSuffix = getDomainWithoutSuffix(result.domain, result.publicSuffix);
	return result;
}
//#endregion
//#region node_modules/tldts-core/dist/es6/src/lookup/fast-path.js
function fast_path_default(hostname, options, out) {
	if (!options.allowPrivateDomains && hostname.length > 3) {
		const last = hostname.length - 1;
		const c3 = hostname.charCodeAt(last);
		const c2 = hostname.charCodeAt(last - 1);
		const c1 = hostname.charCodeAt(last - 2);
		const c0 = hostname.charCodeAt(last - 3);
		if (c3 === 109 && c2 === 111 && c1 === 99 && c0 === 46) {
			out.isIcann = true;
			out.isPrivate = false;
			out.publicSuffix = "com";
			return true;
		} else if (c3 === 103 && c2 === 114 && c1 === 111 && c0 === 46) {
			out.isIcann = true;
			out.isPrivate = false;
			out.publicSuffix = "org";
			return true;
		} else if (c3 === 117 && c2 === 100 && c1 === 101 && c0 === 46) {
			out.isIcann = true;
			out.isPrivate = false;
			out.publicSuffix = "edu";
			return true;
		} else if (c3 === 118 && c2 === 111 && c1 === 103 && c0 === 46) {
			out.isIcann = true;
			out.isPrivate = false;
			out.publicSuffix = "gov";
			return true;
		} else if (c3 === 116 && c2 === 101 && c1 === 110 && c0 === 46) {
			out.isIcann = true;
			out.isPrivate = false;
			out.publicSuffix = "net";
			return true;
		} else if (c3 === 101 && c2 === 100 && c1 === 46) {
			out.isIcann = true;
			out.isPrivate = false;
			out.publicSuffix = "de";
			return true;
		}
	}
	return false;
}
//#endregion
//#region node_modules/tldts/dist/es6/src/data/trie.js
var nodeFlags = /*#__PURE__*/ new Uint8Array([
	1,
	2,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	0,
	2,
	2,
	2,
	0,
	2,
	2,
	0,
	2,
	0,
	0,
	1,
	0,
	0,
	2,
	1,
	1,
	1,
	1,
	1,
	1,
	0,
	0,
	0,
	1,
	0,
	1,
	1,
	1,
	1,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	0,
	1,
	1,
	1,
	1,
	1,
	0,
	0,
	2,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	0,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	0,
	1,
	0,
	1,
	1,
	0,
	1,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	1,
	0,
	2,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	2,
	0,
	2,
	2,
	0,
	0,
	2,
	2,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	1,
	1,
	0,
	2,
	1,
	1,
	2,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	2,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	2,
	2,
	2,
	0,
	0,
	0,
	0,
	0,
	2,
	0,
	0,
	0,
	2,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	2,
	0,
	0,
	0,
	0,
	0,
	0,
	2,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	2,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	2,
	0,
	0,
	0,
	0,
	2,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	0,
	1,
	1,
	0,
	0,
	0,
	0,
	1,
	0,
	2,
	2,
	0,
	0,
	0,
	2,
	0,
	1,
	1,
	0,
	2,
	0,
	2,
	0,
	0,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	0,
	1,
	1,
	1,
	0,
	1,
	1,
	1,
	1,
	0,
	0,
	0,
	0,
	1,
	0,
	1,
	1,
	1,
	0,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	2,
	0,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	0,
	0,
	0,
	0,
	2,
	2,
	0,
	2,
	2,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	0,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	0,
	0,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	0,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	0,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	0,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	0,
	1,
	1,
	0,
	2,
	2,
	0,
	2,
	2,
	2,
	2,
	0,
	0,
	0,
	0,
	2,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	2,
	2,
	0,
	0,
	0,
	2,
	2,
	1,
	1,
	1,
	1,
	1,
	2,
	1,
	1,
	1,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	0,
	0,
	0,
	2,
	2,
	0,
	0,
	2,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	2,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	0,
	2,
	2,
	1,
	2,
	1,
	1,
	1,
	2,
	1,
	1,
	1,
	1,
	1,
	0,
	1,
	1,
	1,
	1,
	2,
	1,
	1,
	1,
	1,
	2,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	0,
	1,
	0,
	1,
	1,
	1,
	1,
	1,
	2,
	1,
	1,
	1,
	1,
	2,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	0,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	0,
	0,
	0,
	0,
	0
]);
var edgeStart = /*#__PURE__*/ new Uint16Array([
	0,
	0,
	0,
	10,
	11,
	18,
	106,
	111,
	117,
	124,
	130,
	136,
	145,
	146,
	147,
	148,
	149,
	150,
	151,
	153,
	154,
	155,
	157,
	159,
	228,
	241,
	243,
	244,
	245,
	260,
	267,
	268,
	271,
	272,
	273,
	276,
	278,
	297,
	298,
	300,
	309,
	314,
	331,
	332,
	335,
	336,
	338,
	340,
	376,
	377,
	379,
	382,
	383,
	387,
	389,
	393,
	396,
	428,
	431,
	444,
	445,
	453,
	454,
	456,
	466,
	480,
	481,
	482,
	483,
	492,
	493,
	530,
	535,
	551,
	571,
	577,
	619,
	620,
	647,
	674,
	675,
	823,
	829,
	832,
	833,
	834,
	839,
	844,
	853,
	875,
	876,
	877,
	878,
	879,
	880,
	881,
	899,
	901,
	902,
	905,
	907,
	908,
	910,
	912,
	927,
	942,
	947,
	948,
	950,
	951,
	952,
	953,
	954,
	956,
	959,
	964,
	965,
	966,
	968,
	969,
	972,
	975,
	976,
	977,
	990,
	992,
	1004,
	1015,
	1023,
	1025,
	1065,
	1068,
	1072,
	1073,
	1075,
	1078,
	1089,
	1091,
	1101,
	1103,
	1109,
	1111,
	1112,
	1114,
	1117,
	1118,
	1119,
	1172,
	1174,
	1176,
	1196,
	1197,
	1198,
	1199,
	1201,
	1212,
	1243,
	1254,
	1255,
	1268,
	1278,
	1287,
	1295,
	1296,
	1301,
	1315,
	1326,
	1338,
	1350,
	1364,
	1365,
	1376,
	1410,
	1411,
	1412,
	1428,
	1444,
	1456,
	1529,
	1530,
	1532,
	1533,
	1569,
	1588,
	1589,
	1590,
	1591,
	1592,
	1595,
	1599,
	1602,
	1604,
	1638,
	1639,
	1647,
	1648,
	1649,
	1650,
	1651,
	1652,
	1654,
	1656,
	1658,
	1659,
	1663,
	1664,
	1665,
	1667,
	1669,
	1670,
	1672,
	1673,
	1674,
	1685,
	1687,
	1688,
	1692,
	1693,
	1696,
	1703,
	1704,
	1709,
	1713,
	1714,
	1716,
	1717,
	1718,
	1719,
	1720,
	1721,
	1722,
	1723,
	1724,
	1725,
	1726,
	1727,
	1728,
	1729,
	1731,
	1732,
	1733,
	2193,
	2196,
	2197,
	2199,
	2206,
	2213,
	2223,
	2227,
	2238,
	2239,
	2240,
	2252,
	2253,
	2255,
	2257,
	2258,
	2265,
	2266,
	2268,
	2269,
	2271,
	2272,
	2273,
	2274,
	2275,
	2349,
	2351,
	2372,
	2373,
	2374,
	2376,
	2378,
	2379,
	2430,
	2431,
	2433,
	2440,
	2446,
	2456,
	2466,
	2519,
	2520,
	2521,
	2531,
	2545,
	2546,
	2549,
	2556,
	2557,
	2565,
	2567,
	2568,
	2569,
	2570,
	2581,
	2582,
	2583,
	2585,
	2586,
	2587,
	2596,
	2608,
	2614,
	2646,
	2650,
	2652,
	2653,
	2655,
	2656,
	2667,
	2668,
	2670,
	2678,
	2685,
	2691,
	2696,
	2697,
	2703,
	2706,
	2712,
	2719,
	2720,
	2727,
	2735,
	2736,
	2737,
	2775,
	2781,
	2796,
	2797,
	2802,
	2820,
	2851,
	2869,
	2871,
	2874,
	2882,
	2884,
	2891,
	2943,
	2967,
	2968,
	2969,
	2970,
	2971,
	2972,
	2973,
	2980,
	2981,
	2982,
	2983,
	2984,
	2985,
	2987,
	2988,
	2992,
	3072,
	3085,
	3086,
	3523,
	3527,
	3541,
	3593,
	3621,
	3643,
	3701,
	3723,
	3738,
	3801,
	3852,
	3890,
	3926,
	3951,
	4093,
	4139,
	4190,
	4209,
	4243,
	4258,
	4278,
	4308,
	4339,
	4362,
	4393,
	4423,
	4455,
	4482,
	4557,
	4579,
	4617,
	4627,
	4661,
	4680,
	4706,
	4748,
	4798,
	4824,
	4893,
	4894,
	4896,
	4919,
	4942,
	4978,
	5009,
	5026,
	5083,
	5096,
	5120,
	5149,
	5151,
	5185,
	5201,
	5229,
	5534,
	5543,
	5552,
	5559,
	5576,
	5580,
	5586,
	5625,
	5627,
	5634,
	5641,
	5650,
	5657,
	5658,
	5659,
	5671,
	5674,
	5689,
	5690,
	5699,
	5700,
	5709,
	5718,
	5724,
	5726,
	5727,
	5728,
	5765,
	5766,
	5768,
	5776,
	5783,
	5796,
	5800,
	5802,
	5803,
	5809,
	5816,
	5830,
	5840,
	5845,
	5853,
	5861,
	5867,
	5868,
	5872,
	5874,
	5875,
	5887,
	5959,
	5960,
	5961,
	5962,
	5964,
	5965,
	5968,
	5970,
	5973,
	5977,
	5978,
	5979,
	5985,
	5986,
	5987,
	5989,
	5991,
	5993,
	5994,
	5995,
	5998,
	6e3,
	6003,
	6004,
	6006,
	6204,
	6211,
	6212,
	6213,
	6223,
	6228,
	6245,
	6259,
	6268,
	6269,
	6270,
	6274,
	6275,
	6277,
	6279,
	6285,
	6286,
	6289,
	6290,
	6292,
	6293,
	6294,
	7194,
	7197,
	7201,
	7219,
	7228,
	7231,
	7238,
	7239,
	7241,
	7242,
	7243,
	7245,
	7297,
	7298,
	7301,
	7302,
	7419,
	7420,
	7431,
	7442,
	7449,
	7452,
	7461,
	7462,
	7463,
	7478,
	7533,
	7725,
	7727,
	7728,
	7730,
	7735,
	7748,
	7763,
	7770,
	7779,
	7782,
	7785,
	7792,
	7800,
	7804,
	7805,
	7806,
	7820,
	7824,
	7833,
	7834,
	7835,
	7839,
	7874,
	7875,
	7893,
	7900,
	7908,
	7909,
	7914,
	7922,
	7966,
	7967,
	7973,
	7976,
	7988,
	7993,
	7994,
	7996,
	7998,
	8033,
	8034,
	8040,
	8047,
	8048,
	8057,
	8066,
	8081,
	8085,
	8086,
	8138,
	8139,
	8144,
	8145,
	8148,
	8150,
	8151,
	8152,
	8161,
	8175,
	8183,
	8197,
	8209,
	8210,
	8212,
	8214,
	8236,
	8247,
	8253,
	8254,
	8266,
	8278,
	8365,
	8377,
	8385,
	8388,
	8394,
	8419,
	8422,
	8423,
	8424,
	8425,
	8427,
	8430,
	8433,
	8444,
	8446,
	8448,
	8476,
	8551,
	8558,
	8562,
	8563,
	8572,
	8594,
	8595,
	8600,
	8601,
	8680,
	8682,
	8684,
	8693,
	8697,
	8703,
	8709,
	8715,
	8725,
	8730,
	8731,
	8749,
	8760,
	8765,
	8770,
	8780,
	8786,
	8790,
	8796,
	8802,
	10410,
	10411,
	10412,
	10419,
	10421
]);
var edgeLength = /*#__PURE__*/ new Uint8Array([
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	5,
	8,
	8,
	2,
	2,
	3,
	3,
	3,
	3,
	3,
	8,
	5,
	5,
	5,
	5,
	5,
	3,
	3,
	5,
	5,
	9,
	12,
	19,
	8,
	19,
	8,
	11,
	9,
	9,
	8,
	7,
	7,
	6,
	8,
	9,
	16,
	10,
	7,
	7,
	11,
	8,
	6,
	6,
	9,
	7,
	11,
	7,
	14,
	4,
	4,
	4,
	4,
	4,
	4,
	10,
	7,
	6,
	6,
	6,
	6,
	10,
	10,
	6,
	10,
	10,
	22,
	11,
	9,
	10,
	10,
	10,
	9,
	10,
	8,
	7,
	7,
	7,
	8,
	21,
	13,
	11,
	11,
	9,
	10,
	9,
	13,
	10,
	8,
	8,
	9,
	12,
	9,
	7,
	10,
	7,
	7,
	13,
	7,
	3,
	3,
	3,
	3,
	3,
	2,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	8,
	6,
	3,
	3,
	3,
	3,
	3,
	3,
	2,
	5,
	3,
	3,
	3,
	7,
	2,
	2,
	2,
	2,
	2,
	2,
	3,
	3,
	3,
	1,
	1,
	7,
	8,
	5,
	2,
	2,
	7,
	2,
	2,
	1,
	4,
	1,
	11,
	9,
	9,
	5,
	5,
	8,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	3,
	3,
	3,
	3,
	3,
	5,
	11,
	9,
	9,
	13,
	7,
	14,
	7,
	6,
	6,
	6,
	7,
	6,
	6,
	6,
	6,
	6,
	6,
	10,
	7,
	11,
	9,
	4,
	4,
	4,
	4,
	4,
	6,
	6,
	6,
	6,
	13,
	6,
	8,
	7,
	10,
	9,
	9,
	7,
	9,
	8,
	9,
	8,
	7,
	10,
	6,
	9,
	8,
	10,
	10,
	7,
	8,
	1,
	9,
	10,
	12,
	12,
	12,
	10,
	9,
	9,
	10,
	10,
	9,
	9,
	1,
	1,
	5,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	6,
	6,
	6,
	4,
	3,
	3,
	3,
	7,
	4,
	4,
	4,
	3,
	3,
	6,
	7,
	3,
	4,
	1,
	2,
	2,
	2,
	6,
	1,
	2,
	2,
	2,
	2,
	2,
	12,
	5,
	3,
	8,
	9,
	13,
	4,
	4,
	13,
	9,
	9,
	11,
	7,
	3,
	12,
	9,
	2,
	2,
	2,
	3,
	3,
	3,
	3,
	3,
	8,
	2,
	2,
	3,
	3,
	3,
	2,
	2,
	2,
	2,
	2,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	4,
	3,
	7,
	10,
	15,
	15,
	7,
	15,
	20,
	15,
	9,
	10,
	10,
	12,
	14,
	14,
	14,
	12,
	12,
	12,
	12,
	12,
	14,
	14,
	10,
	10,
	10,
	10,
	14,
	9,
	9,
	9,
	9,
	10,
	14,
	14,
	14,
	13,
	13,
	14,
	9,
	9,
	9,
	9,
	9,
	9,
	7,
	8,
	6,
	8,
	8,
	6,
	8,
	13,
	8,
	8,
	6,
	13,
	8,
	11,
	13,
	8,
	6,
	13,
	8,
	6,
	9,
	10,
	10,
	12,
	14,
	14,
	14,
	12,
	12,
	12,
	12,
	14,
	14,
	10,
	10,
	10,
	10,
	9,
	9,
	9,
	10,
	14,
	14,
	11,
	13,
	13,
	9,
	9,
	9,
	9,
	9,
	9,
	2,
	6,
	9,
	2,
	2,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	4,
	4,
	4,
	2,
	3,
	3,
	3,
	3,
	3,
	3,
	7,
	7,
	2,
	3,
	2,
	2,
	5,
	3,
	3,
	3,
	3,
	3,
	3,
	4,
	2,
	2,
	2,
	2,
	2,
	2,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	4,
	5,
	7,
	4,
	2,
	2,
	12,
	8,
	10,
	8,
	10,
	7,
	18,
	4,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	5,
	2,
	2,
	3,
	3,
	3,
	5,
	5,
	3,
	8,
	8,
	6,
	8,
	6,
	6,
	4,
	6,
	7,
	7,
	7,
	10,
	11,
	2,
	5,
	5,
	3,
	3,
	3,
	3,
	3,
	3,
	5,
	5,
	6,
	11,
	10,
	7,
	7,
	7,
	4,
	4,
	4,
	2,
	3,
	3,
	3,
	3,
	3,
	2,
	2,
	7,
	5,
	5,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	7,
	7,
	7,
	11,
	7,
	6,
	9,
	6,
	6,
	8,
	10,
	8,
	6,
	8,
	13,
	4,
	4,
	4,
	4,
	4,
	10,
	8,
	11,
	8,
	8,
	8,
	10,
	10,
	7,
	10,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	1,
	1,
	2,
	2,
	2,
	2,
	2,
	2,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	7,
	10,
	13,
	7,
	8,
	7,
	11,
	8,
	8,
	6,
	9,
	8,
	8,
	6,
	6,
	6,
	8,
	8,
	6,
	6,
	6,
	6,
	6,
	9,
	7,
	6,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	6,
	6,
	6,
	9,
	7,
	8,
	10,
	8,
	8,
	2,
	3,
	3,
	3,
	3,
	3,
	2,
	8,
	9,
	9,
	2,
	2,
	2,
	3,
	3,
	3,
	2,
	3,
	3,
	3,
	9,
	2,
	2,
	3,
	3,
	3,
	3,
	3,
	3,
	5,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	12,
	5,
	5,
	3,
	5,
	4,
	2,
	3,
	2,
	4,
	3,
	9,
	2,
	2,
	2,
	2,
	2,
	5,
	5,
	3,
	8,
	8,
	13,
	6,
	10,
	9,
	4,
	7,
	9,
	11,
	2,
	3,
	7,
	3,
	3,
	4,
	1,
	3,
	4,
	2,
	9,
	3,
	3,
	12,
	5,
	3,
	7,
	10,
	10,
	7,
	4,
	4,
	6,
	14,
	7,
	9,
	7,
	13,
	2,
	2,
	2,
	2,
	2,
	2,
	3,
	3,
	3,
	3,
	3,
	8,
	15,
	4,
	4,
	2,
	3,
	3,
	3,
	7,
	4,
	9,
	9,
	2,
	3,
	3,
	3,
	5,
	3,
	2,
	2,
	7,
	2,
	7,
	6,
	6,
	7,
	2,
	4,
	2,
	2,
	2,
	2,
	2,
	2,
	8,
	8,
	8,
	9,
	5,
	2,
	3,
	3,
	3,
	3,
	3,
	3,
	10,
	7,
	4,
	4,
	4,
	4,
	3,
	4,
	2,
	3,
	3,
	3,
	3,
	3,
	10,
	7,
	4,
	4,
	4,
	4,
	2,
	3,
	3,
	3,
	3,
	10,
	7,
	4,
	4,
	4,
	4,
	3,
	9,
	6,
	6,
	6,
	9,
	13,
	9,
	2,
	2,
	2,
	8,
	7,
	9,
	5,
	3,
	3,
	3,
	5,
	5,
	13,
	12,
	9,
	10,
	7,
	8,
	7,
	6,
	8,
	6,
	11,
	12,
	7,
	10,
	4,
	4,
	7,
	8,
	11,
	6,
	7,
	9,
	8,
	7,
	10,
	8,
	9,
	15,
	7,
	8,
	5,
	4,
	7,
	2,
	3,
	3,
	3,
	2,
	14,
	10,
	2,
	14,
	10,
	2,
	14,
	3,
	9,
	13,
	13,
	10,
	14,
	16,
	17,
	11,
	2,
	14,
	2,
	14,
	3,
	9,
	13,
	10,
	14,
	16,
	17,
	11,
	14,
	10,
	14,
	2,
	7,
	3,
	10,
	7,
	14,
	10,
	2,
	14,
	10,
	9,
	9,
	17,
	6,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	3,
	3,
	3,
	3,
	3,
	3,
	10,
	10,
	10,
	12,
	9,
	4,
	10,
	10,
	11,
	8,
	8,
	8,
	7,
	9,
	5,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	5,
	8,
	4,
	4,
	4,
	4,
	4,
	4,
	6,
	16,
	3,
	3,
	14,
	3,
	14,
	2,
	14,
	9,
	13,
	10,
	10,
	14,
	16,
	17,
	11,
	6,
	9,
	10,
	10,
	12,
	14,
	14,
	14,
	12,
	12,
	12,
	12,
	14,
	14,
	10,
	10,
	10,
	10,
	14,
	9,
	9,
	9,
	10,
	14,
	14,
	14,
	9,
	9,
	9,
	9,
	9,
	9,
	2,
	14,
	9,
	13,
	10,
	10,
	14,
	16,
	17,
	11,
	6,
	14,
	2,
	14,
	9,
	17,
	13,
	10,
	10,
	14,
	17,
	16,
	17,
	11,
	6,
	2,
	14,
	9,
	13,
	10,
	14,
	17,
	16,
	17,
	11,
	2,
	14,
	9,
	13,
	10,
	14,
	16,
	17,
	11,
	2,
	14,
	9,
	13,
	10,
	17,
	16,
	11,
	17,
	2,
	14,
	10,
	19,
	7,
	2,
	14,
	9,
	13,
	10,
	19,
	10,
	7,
	14,
	17,
	16,
	17,
	11,
	6,
	2,
	14,
	9,
	13,
	10,
	19,
	7,
	14,
	16,
	17,
	11,
	2,
	14,
	9,
	13,
	10,
	10,
	14,
	17,
	16,
	17,
	11,
	6,
	2,
	14,
	9,
	13,
	10,
	10,
	14,
	17,
	16,
	17,
	11,
	6,
	2,
	14,
	9,
	13,
	17,
	13,
	10,
	10,
	14,
	17,
	16,
	17,
	11,
	6,
	3,
	2,
	14,
	9,
	13,
	10,
	10,
	14,
	16,
	17,
	11,
	6,
	9,
	10,
	12,
	14,
	14,
	14,
	12,
	12,
	12,
	12,
	12,
	14,
	14,
	14,
	10,
	10,
	10,
	14,
	9,
	9,
	9,
	9,
	14,
	14,
	14,
	13,
	13,
	14,
	9,
	9,
	9,
	9,
	9,
	9,
	4,
	11,
	2,
	14,
	9,
	13,
	17,
	13,
	10,
	19,
	10,
	7,
	14,
	17,
	16,
	17,
	11,
	6,
	2,
	14,
	9,
	13,
	17,
	13,
	10,
	19,
	10,
	7,
	14,
	17,
	16,
	17,
	11,
	6,
	2,
	14,
	9,
	13,
	10,
	19,
	7,
	14,
	17,
	16,
	17,
	11,
	2,
	9,
	10,
	10,
	7,
	17,
	3,
	3,
	12,
	12,
	16,
	15,
	15,
	12,
	14,
	14,
	14,
	20,
	20,
	13,
	12,
	12,
	12,
	12,
	12,
	12,
	20,
	25,
	14,
	14,
	12,
	12,
	10,
	10,
	10,
	10,
	14,
	9,
	9,
	9,
	25,
	4,
	9,
	17,
	10,
	7,
	14,
	16,
	21,
	13,
	13,
	14,
	20,
	14,
	13,
	17,
	24,
	9,
	12,
	13,
	25,
	13,
	21,
	20,
	17,
	9,
	9,
	9,
	9,
	9,
	9,
	12,
	17,
	4,
	4,
	9,
	9,
	9,
	10,
	10,
	12,
	14,
	14,
	14,
	12,
	12,
	12,
	12,
	12,
	14,
	14,
	10,
	10,
	10,
	10,
	14,
	9,
	9,
	9,
	9,
	10,
	14,
	14,
	14,
	13,
	13,
	14,
	9,
	9,
	9,
	9,
	9,
	9,
	9,
	10,
	14,
	12,
	12,
	14,
	14,
	10,
	9,
	9,
	9,
	10,
	14,
	14,
	14,
	9,
	9,
	9,
	9,
	2,
	1,
	5,
	8,
	7,
	11,
	11,
	1,
	3,
	3,
	3,
	5,
	3,
	3,
	4,
	8,
	9,
	10,
	10,
	12,
	14,
	14,
	14,
	12,
	12,
	12,
	12,
	14,
	14,
	10,
	10,
	10,
	10,
	14,
	9,
	9,
	9,
	10,
	14,
	14,
	14,
	13,
	13,
	14,
	9,
	9,
	9,
	9,
	9,
	9,
	7,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	10,
	2,
	2,
	6,
	7,
	6,
	2,
	3,
	2,
	3,
	6,
	2,
	7,
	6,
	10,
	7,
	4,
	9,
	12,
	6,
	14,
	4,
	12,
	7,
	2,
	2,
	1,
	2,
	7,
	6,
	4,
	4,
	4,
	6,
	8,
	8,
	7,
	2,
	2,
	13,
	2,
	2,
	2,
	2,
	6,
	2,
	8,
	12,
	2,
	7,
	7,
	6,
	8,
	10,
	12,
	2,
	2,
	2,
	3,
	3,
	13,
	2,
	2,
	3,
	3,
	6,
	7,
	6,
	4,
	5,
	6,
	3,
	3,
	3,
	3,
	4,
	16,
	8,
	5,
	4,
	3,
	3,
	3,
	5,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	11,
	12,
	7,
	7,
	13,
	9,
	10,
	17,
	12,
	8,
	9,
	7,
	17,
	17,
	8,
	5,
	12,
	10,
	13,
	14,
	5,
	5,
	5,
	13,
	5,
	5,
	5,
	3,
	3,
	3,
	5,
	16,
	5,
	5,
	5,
	5,
	7,
	12,
	14,
	8,
	12,
	8,
	10,
	12,
	9,
	11,
	7,
	9,
	7,
	10,
	7,
	13,
	9,
	7,
	12,
	8,
	17,
	7,
	7,
	16,
	10,
	13,
	13,
	8,
	10,
	10,
	14,
	17,
	7,
	16,
	16,
	15,
	8,
	10,
	10,
	12,
	17,
	17,
	7,
	17,
	14,
	7,
	10,
	17,
	8,
	7,
	7,
	7,
	8,
	15,
	15,
	7,
	14,
	10,
	10,
	10,
	11,
	11,
	7,
	7,
	13,
	8,
	10,
	7,
	16,
	7,
	8,
	7,
	14,
	17,
	12,
	10,
	11,
	21,
	8,
	9,
	7,
	13,
	9,
	8,
	6,
	13,
	6,
	12,
	7,
	6,
	13,
	10,
	10,
	10,
	8,
	18,
	9,
	17,
	13,
	10,
	12,
	6,
	13,
	6,
	11,
	8,
	13,
	10,
	13,
	18,
	13,
	11,
	13,
	8,
	16,
	7,
	10,
	8,
	16,
	12,
	10,
	8,
	8,
	14,
	11,
	8,
	15,
	8,
	8,
	7,
	7,
	12,
	7,
	8,
	9,
	14,
	15,
	8,
	9,
	10,
	9,
	15,
	7,
	8,
	8,
	12,
	13,
	9,
	10,
	15,
	13,
	7,
	10,
	10,
	20,
	7,
	6,
	9,
	6,
	6,
	14,
	11,
	14,
	11,
	12,
	9,
	10,
	16,
	16,
	12,
	7,
	11,
	28,
	8,
	11,
	10,
	7,
	21,
	8,
	7,
	9,
	4,
	4,
	4,
	17,
	7,
	8,
	6,
	9,
	6,
	6,
	13,
	6,
	6,
	6,
	6,
	18,
	20,
	14,
	8,
	11,
	12,
	9,
	10,
	13,
	15,
	15,
	19,
	8,
	9,
	12,
	7,
	10,
	16,
	12,
	9,
	9,
	9,
	14,
	12,
	11,
	10,
	9,
	12,
	11,
	18,
	9,
	9,
	9,
	10,
	7,
	7,
	16,
	8,
	9,
	7,
	13,
	12,
	10,
	14,
	18,
	7,
	8,
	11,
	7,
	7,
	8,
	8,
	13,
	7,
	7,
	7,
	11,
	15,
	13,
	11,
	7,
	8,
	15,
	11,
	7,
	8,
	18,
	14,
	13,
	18,
	15,
	10,
	12,
	12,
	9,
	7,
	11,
	11,
	8,
	7,
	10,
	8,
	14,
	12,
	10,
	18,
	7,
	10,
	9,
	7,
	8,
	13,
	10,
	14,
	10,
	8,
	8,
	23,
	7,
	7,
	11,
	12,
	12,
	17,
	7,
	7,
	11,
	11,
	17,
	16,
	16,
	7,
	8,
	11,
	14,
	14,
	8,
	10,
	7,
	7,
	16,
	16,
	13,
	9,
	11,
	9,
	15,
	15,
	11,
	11,
	7,
	7,
	14,
	7,
	9,
	7,
	7,
	16,
	10,
	13,
	10,
	11,
	14,
	7,
	11,
	10,
	11,
	7,
	11,
	10,
	11,
	15,
	11,
	15,
	10,
	12,
	10,
	14,
	13,
	11,
	11,
	12,
	13,
	10,
	7,
	13,
	10,
	16,
	12,
	21,
	15,
	9,
	10,
	10,
	7,
	11,
	14,
	17,
	7,
	7,
	8,
	11,
	13,
	12,
	8,
	15,
	14,
	14,
	8,
	17,
	12,
	10,
	10,
	7,
	9,
	11,
	7,
	10,
	7,
	11,
	18,
	7,
	11,
	7,
	12,
	11,
	8,
	8,
	14,
	12,
	7,
	8,
	15,
	3,
	7,
	7,
	5,
	2,
	9,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	2,
	5,
	3,
	3,
	3,
	3,
	3,
	3,
	4,
	4,
	3,
	3,
	3,
	3,
	3,
	3,
	5,
	11,
	6,
	4,
	7,
	10,
	7,
	7,
	11,
	1,
	10,
	2,
	2,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	5,
	7,
	3,
	5,
	6,
	3,
	3,
	5,
	2,
	2,
	5,
	3,
	4,
	13,
	11,
	3,
	3,
	6,
	3,
	5,
	14,
	2,
	2,
	3,
	8,
	2,
	2,
	12,
	5,
	18,
	5,
	3,
	3,
	3,
	16,
	5,
	5,
	5,
	10,
	7,
	13,
	12,
	13,
	9,
	12,
	14,
	19,
	9,
	9,
	21,
	9,
	9,
	10,
	6,
	9,
	6,
	15,
	10,
	6,
	12,
	8,
	6,
	10,
	15,
	4,
	4,
	6,
	6,
	9,
	9,
	12,
	16,
	14,
	23,
	7,
	7,
	7,
	14,
	9,
	7,
	7,
	11,
	14,
	10,
	7,
	10,
	10,
	10,
	12,
	6,
	11,
	10,
	13,
	11,
	15,
	11,
	7,
	12,
	10,
	3,
	7,
	1,
	1,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	3,
	4,
	3,
	7,
	1,
	5,
	2,
	2,
	2,
	5,
	5,
	5,
	5,
	3,
	3,
	3,
	3,
	3,
	5,
	5,
	10,
	9,
	11,
	8,
	7,
	12,
	8,
	9,
	7,
	6,
	13,
	11,
	6,
	13,
	7,
	9,
	9,
	4,
	4,
	4,
	4,
	4,
	6,
	10,
	7,
	8,
	13,
	8,
	8,
	9,
	14,
	7,
	8,
	10,
	7,
	7,
	7,
	9,
	6,
	9,
	7,
	2,
	12,
	5,
	3,
	3,
	13,
	4,
	2,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	2,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	4,
	5,
	5,
	5,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	8,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	9,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	4,
	2,
	2,
	2,
	5,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	4,
	4,
	1,
	7,
	6,
	4,
	12,
	3,
	3,
	3,
	3,
	3,
	8,
	7,
	3,
	3,
	3,
	3,
	3,
	3,
	4,
	4,
	11,
	15,
	14,
	2,
	8,
	3,
	5,
	5,
	8,
	10,
	8,
	6,
	4,
	7,
	17,
	7,
	4,
	5,
	2,
	6,
	3,
	2,
	2,
	12,
	5,
	5,
	3,
	15,
	13,
	8,
	11,
	2,
	2,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	4,
	4,
	5,
	3,
	3,
	3,
	3,
	4,
	18,
	2,
	12,
	5,
	3,
	3,
	3,
	3,
	3,
	5,
	16,
	8,
	8,
	9,
	6,
	6,
	4,
	4,
	4,
	4,
	31,
	6,
	6,
	10,
	11,
	21,
	10,
	9,
	7,
	10,
	7,
	7,
	2,
	4,
	4,
	4,
	4,
	6,
	5,
	3,
	3,
	4,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	6,
	6,
	6,
	2,
	2,
	2,
	5,
	3,
	3,
	3,
	7,
	7,
	4,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	2,
	3,
	3,
	3,
	3,
	8,
	2,
	3,
	3,
	3,
	3,
	3,
	5,
	9,
	11,
	3,
	3,
	3,
	3,
	4,
	4,
	3,
	3,
	3,
	3,
	3,
	5,
	10,
	9,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	4,
	4,
	2,
	3,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	11,
	10,
	10,
	10,
	10,
	10,
	11,
	10,
	11,
	10,
	11,
	10,
	9,
	9,
	11,
	3,
	3,
	3,
	3,
	3,
	3,
	5,
	3,
	7,
	8,
	8,
	7,
	6,
	6,
	11,
	4,
	4,
	4,
	7,
	8,
	9,
	9,
	2,
	3,
	7,
	4,
	4,
	2,
	5,
	5,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	4,
	4,
	4,
	4,
	4,
	4,
	2,
	2,
	5,
	5,
	5,
	5,
	5,
	3,
	3,
	5,
	5,
	5,
	7,
	7,
	6,
	6,
	6,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	6,
	6,
	8,
	8,
	1,
	2,
	2,
	2,
	2,
	2,
	2,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	4,
	4,
	6,
	9,
	12,
	3,
	7,
	10,
	7,
	2,
	2,
	3,
	3,
	3,
	3,
	3,
	4,
	3,
	3,
	2,
	2,
	2,
	2,
	3,
	3,
	3,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	5,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	5,
	5,
	8,
	8,
	6,
	6,
	8,
	6,
	7,
	4,
	4,
	4,
	4,
	4,
	4,
	6,
	7,
	5,
	5,
	20,
	19,
	8,
	10,
	9,
	7,
	10,
	6,
	8,
	11,
	6,
	6,
	6,
	6,
	13,
	12,
	8,
	6,
	7,
	14,
	11,
	9,
	2,
	5,
	3,
	6,
	2,
	3,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	5,
	4,
	3,
	7,
	6,
	4,
	7,
	4,
	3,
	6,
	4,
	7,
	2,
	7,
	7,
	7,
	5,
	5,
	5,
	5,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	5,
	9,
	10,
	10,
	11,
	7,
	8,
	20,
	7,
	8,
	9,
	8,
	12,
	6,
	6,
	6,
	8,
	9,
	8,
	12,
	6,
	6,
	8,
	13,
	10,
	12,
	6,
	6,
	7,
	7,
	9,
	6,
	4,
	4,
	4,
	4,
	4,
	4,
	10,
	6,
	6,
	6,
	7,
	14,
	11,
	10,
	7,
	8,
	10,
	8,
	11,
	14,
	11,
	11,
	9,
	7,
	9,
	8,
	11,
	9,
	17,
	10,
	9,
	2,
	2,
	2,
	9,
	3,
	3,
	3,
	3,
	15,
	14,
	9,
	5,
	5,
	2,
	8,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	15,
	12,
	22,
	19,
	17,
	18,
	18,
	19,
	21,
	7,
	16,
	16,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	7,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	9,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	5,
	7,
	16,
	11,
	11,
	7,
	7,
	7,
	7,
	17,
	7,
	8,
	12,
	15,
	9,
	19,
	7,
	19,
	8,
	21,
	11,
	12,
	19,
	14,
	22,
	7,
	7,
	7,
	7,
	7,
	7,
	7,
	7,
	7,
	7,
	7,
	16,
	16,
	19,
	24,
	12,
	7,
	14,
	7,
	12,
	7,
	8,
	10,
	10,
	13,
	7,
	12,
	12,
	7,
	7,
	10,
	18,
	15,
	12,
	16,
	7,
	14,
	12,
	17,
	10,
	16,
	17,
	12,
	17,
	25,
	7,
	7,
	7,
	13,
	6,
	9,
	6,
	9,
	18,
	6,
	6,
	11,
	20,
	10,
	6,
	6,
	6,
	6,
	6,
	6,
	17,
	6,
	6,
	6,
	15,
	6,
	6,
	6,
	6,
	6,
	8,
	14,
	11,
	12,
	11,
	15,
	13,
	19,
	17,
	21,
	7,
	18,
	8,
	13,
	13,
	8,
	12,
	8,
	6,
	6,
	13,
	6,
	15,
	15,
	16,
	6,
	6,
	16,
	6,
	6,
	6,
	14,
	6,
	18,
	6,
	6,
	6,
	17,
	18,
	9,
	13,
	15,
	8,
	19,
	8,
	15,
	15,
	18,
	14,
	16,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	6,
	11,
	10,
	11,
	6,
	21,
	23,
	12,
	17,
	12,
	11,
	14,
	13,
	22,
	15,
	15,
	11,
	12,
	14,
	12,
	7,
	12,
	8,
	12,
	14,
	12,
	18,
	10,
	8,
	16,
	19,
	17,
	12,
	14,
	15,
	8,
	19,
	17,
	12,
	13,
	13,
	15,
	18,
	13,
	23,
	24,
	23,
	21,
	17,
	24,
	8,
	21,
	8,
	14,
	14,
	16,
	20,
	14,
	8,
	8,
	15,
	20,
	8,
	19,
	21,
	9,
	8,
	13,
	12,
	13,
	15,
	11,
	8,
	11,
	9,
	9,
	8,
	11,
	8,
	21,
	14,
	21,
	15,
	15,
	13,
	7,
	19,
	7,
	7,
	7,
	7,
	7,
	7,
	16,
	12,
	17,
	18,
	7,
	7,
	11,
	11,
	7,
	9,
	9,
	2,
	2,
	3,
	3,
	2,
	2,
	2,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	4,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	3,
	3,
	10,
	10,
	7,
	9,
	7,
	7,
	7,
	6,
	8,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	7,
	6,
	8,
	6,
	6,
	9,
	7,
	7,
	7,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	8,
	9,
	8,
	7,
	8,
	7,
	8,
	10,
	7,
	5,
	5,
	5,
	5,
	5,
	5,
	3,
	9,
	7,
	7,
	8,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	9,
	6,
	6,
	9,
	11,
	13,
	7,
	8,
	9,
	9,
	5,
	5,
	5,
	7,
	8,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	7,
	8,
	9,
	7,
	10,
	9,
	10,
	7,
	8,
	5,
	5,
	5,
	5,
	5,
	5,
	7,
	7,
	9,
	8,
	7,
	7,
	6,
	6,
	6,
	6,
	6,
	6,
	10,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	9,
	10,
	4,
	4,
	4,
	4,
	8,
	7,
	7,
	10,
	10,
	9,
	8,
	8,
	15,
	9,
	8,
	8,
	8,
	8,
	8,
	9,
	10,
	9,
	10,
	7,
	8,
	13,
	5,
	5,
	5,
	5,
	5,
	3,
	3,
	7,
	7,
	8,
	6,
	6,
	6,
	4,
	4,
	11,
	9,
	7,
	8,
	9,
	10,
	7,
	5,
	5,
	5,
	5,
	5,
	3,
	3,
	7,
	6,
	6,
	13,
	7,
	9,
	8,
	7,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	3,
	3,
	3,
	3,
	7,
	8,
	7,
	8,
	13,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	8,
	8,
	6,
	6,
	6,
	6,
	7,
	6,
	7,
	6,
	6,
	9,
	7,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	7,
	8,
	7,
	8,
	9,
	8,
	8,
	8,
	7,
	10,
	7,
	8,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	3,
	7,
	7,
	7,
	7,
	9,
	7,
	10,
	9,
	6,
	6,
	6,
	6,
	6,
	8,
	8,
	6,
	6,
	6,
	7,
	6,
	6,
	6,
	9,
	9,
	4,
	4,
	13,
	7,
	10,
	9,
	9,
	12,
	7,
	8,
	8,
	10,
	8,
	8,
	8,
	8,
	8,
	8,
	5,
	5,
	5,
	5,
	3,
	7,
	7,
	11,
	7,
	9,
	8,
	8,
	6,
	6,
	10,
	6,
	8,
	8,
	8,
	6,
	7,
	6,
	6,
	12,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	9,
	8,
	8,
	16,
	8,
	9,
	8,
	7,
	5,
	5,
	5,
	5,
	5,
	3,
	3,
	7,
	7,
	7,
	10,
	15,
	8,
	9,
	8,
	9,
	9,
	6,
	6,
	6,
	6,
	6,
	6,
	7,
	4,
	8,
	7,
	8,
	8,
	7,
	8,
	11,
	8,
	5,
	5,
	5,
	5,
	5,
	3,
	7,
	7,
	6,
	11,
	16,
	7,
	6,
	4,
	4,
	4,
	4,
	9,
	9,
	8,
	8,
	8,
	13,
	12,
	8,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	11,
	7,
	8,
	8,
	9,
	13,
	7,
	7,
	7,
	9,
	8,
	8,
	9,
	12,
	7,
	12,
	7,
	12,
	8,
	7,
	10,
	12,
	9,
	9,
	6,
	6,
	8,
	8,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	9,
	8,
	9,
	11,
	8,
	6,
	6,
	6,
	6,
	6,
	12,
	7,
	6,
	6,
	6,
	9,
	7,
	7,
	6,
	6,
	6,
	6,
	6,
	11,
	9,
	6,
	6,
	6,
	6,
	6,
	7,
	9,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	9,
	9,
	9,
	9,
	7,
	7,
	7,
	7,
	7,
	11,
	7,
	7,
	8,
	8,
	8,
	8,
	8,
	8,
	9,
	8,
	9,
	9,
	7,
	7,
	11,
	11,
	7,
	12,
	8,
	8,
	8,
	8,
	8,
	7,
	8,
	8,
	8,
	8,
	8,
	13,
	12,
	8,
	8,
	8,
	8,
	7,
	7,
	7,
	9,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	3,
	3,
	7,
	7,
	11,
	7,
	8,
	8,
	8,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	10,
	11,
	6,
	7,
	9,
	4,
	4,
	4,
	4,
	4,
	4,
	9,
	9,
	8,
	9,
	8,
	8,
	8,
	7,
	7,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	3,
	3,
	11,
	7,
	7,
	7,
	9,
	6,
	6,
	11,
	8,
	10,
	6,
	6,
	6,
	12,
	8,
	8,
	7,
	6,
	6,
	8,
	7,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	9,
	10,
	9,
	9,
	8,
	10,
	9,
	11,
	8,
	5,
	5,
	5,
	7,
	6,
	6,
	8,
	7,
	4,
	4,
	4,
	4,
	8,
	7,
	7,
	8,
	7,
	8,
	8,
	5,
	5,
	5,
	5,
	7,
	7,
	8,
	8,
	8,
	6,
	6,
	6,
	6,
	6,
	10,
	8,
	9,
	13,
	6,
	7,
	6,
	6,
	8,
	7,
	8,
	4,
	4,
	4,
	4,
	11,
	8,
	8,
	8,
	10,
	5,
	5,
	8,
	7,
	8,
	13,
	8,
	7,
	6,
	8,
	6,
	9,
	7,
	8,
	7,
	5,
	5,
	5,
	5,
	5,
	5,
	3,
	3,
	7,
	8,
	9,
	6,
	4,
	8,
	10,
	10,
	8,
	12,
	9,
	13,
	2,
	7,
	5,
	5,
	5,
	5,
	5,
	7,
	7,
	10,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	8,
	4,
	4,
	9,
	8,
	8,
	8,
	14,
	8,
	8,
	8,
	9,
	8,
	5,
	5,
	5,
	5,
	5,
	3,
	3,
	9,
	6,
	6,
	6,
	6,
	10,
	12,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	4,
	4,
	4,
	4,
	11,
	8,
	7,
	8,
	8,
	8,
	5,
	5,
	3,
	3,
	3,
	3,
	7,
	7,
	6,
	8,
	6,
	8,
	11,
	7,
	6,
	6,
	6,
	7,
	4,
	8,
	11,
	9,
	10,
	5,
	5,
	5,
	3,
	3,
	3,
	7,
	7,
	8,
	9,
	8,
	15,
	9,
	6,
	6,
	6,
	6,
	6,
	6,
	11,
	11,
	4,
	4,
	4,
	4,
	4,
	7,
	9,
	9,
	10,
	8,
	7,
	5,
	5,
	5,
	5,
	5,
	5,
	3,
	3,
	8,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	9,
	7,
	4,
	4,
	4,
	4,
	4,
	9,
	9,
	8,
	8,
	10,
	13,
	5,
	5,
	5,
	3,
	17,
	7,
	7,
	7,
	7,
	7,
	8,
	6,
	8,
	13,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	4,
	4,
	4,
	9,
	10,
	8,
	8,
	8,
	5,
	5,
	5,
	5,
	3,
	7,
	7,
	7,
	8,
	8,
	6,
	6,
	6,
	8,
	8,
	8,
	9,
	10,
	8,
	4,
	8,
	10,
	9,
	8,
	8,
	8,
	9,
	13,
	10,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	3,
	3,
	7,
	8,
	9,
	9,
	7,
	7,
	7,
	10,
	9,
	9,
	8,
	9,
	8,
	8,
	8,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	8,
	12,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	12,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	11,
	8,
	8,
	9,
	9,
	10,
	8,
	9,
	7,
	7,
	5,
	5,
	5,
	5,
	5,
	5,
	3,
	7,
	8,
	7,
	6,
	6,
	8,
	6,
	6,
	10,
	4,
	7,
	8,
	9,
	12,
	8,
	7,
	7,
	5,
	5,
	5,
	5,
	5,
	5,
	3,
	3,
	7,
	14,
	7,
	9,
	8,
	8,
	6,
	6,
	8,
	12,
	12,
	6,
	6,
	7,
	7,
	10,
	4,
	4,
	4,
	4,
	4,
	9,
	9,
	14,
	9,
	13,
	8,
	7,
	5,
	5,
	5,
	6,
	6,
	6,
	7,
	4,
	8,
	7,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	3,
	3,
	7,
	7,
	7,
	8,
	6,
	6,
	6,
	6,
	6,
	6,
	12,
	6,
	6,
	6,
	6,
	4,
	4,
	9,
	9,
	8,
	8,
	11,
	7,
	7,
	7,
	5,
	5,
	5,
	3,
	9,
	8,
	6,
	6,
	7,
	4,
	4,
	4,
	4,
	4,
	4,
	8,
	8,
	11,
	5,
	5,
	5,
	7,
	7,
	7,
	9,
	6,
	6,
	6,
	6,
	6,
	6,
	9,
	8,
	4,
	4,
	4,
	4,
	7,
	12,
	9,
	8,
	8,
	8,
	7,
	10,
	10,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	3,
	11,
	14,
	8,
	7,
	8,
	8,
	6,
	6,
	6,
	6,
	6,
	8,
	7,
	6,
	6,
	6,
	7,
	6,
	8,
	9,
	4,
	4,
	4,
	7,
	8,
	9,
	7,
	9,
	7,
	7,
	9,
	8,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	11,
	3,
	9,
	7,
	7,
	12,
	14,
	8,
	6,
	6,
	12,
	11,
	8,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	15,
	7,
	4,
	4,
	4,
	16,
	9,
	9,
	9,
	8,
	9,
	9,
	9,
	9,
	9,
	8,
	8,
	8,
	13,
	11,
	8,
	5,
	5,
	5,
	5,
	3,
	7,
	6,
	6,
	8,
	8,
	8,
	6,
	6,
	7,
	10,
	7,
	4,
	4,
	4,
	4,
	9,
	7,
	8,
	7,
	7,
	7,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	3,
	7,
	7,
	7,
	9,
	6,
	6,
	6,
	6,
	6,
	8,
	8,
	7,
	7,
	9,
	6,
	6,
	6,
	7,
	6,
	6,
	6,
	6,
	6,
	15,
	4,
	4,
	4,
	4,
	4,
	8,
	8,
	7,
	8,
	12,
	9,
	8,
	8,
	8,
	8,
	8,
	9,
	8,
	8,
	10,
	8,
	8,
	8,
	8,
	16,
	9,
	10,
	2,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	9,
	7,
	6,
	8,
	9,
	4,
	4,
	4,
	4,
	4,
	7,
	8,
	8,
	8,
	9,
	8,
	11,
	10,
	5,
	5,
	5,
	5,
	3,
	7,
	8,
	6,
	6,
	6,
	6,
	6,
	8,
	6,
	6,
	6,
	6,
	4,
	12,
	10,
	12,
	7,
	7,
	7,
	7,
	7,
	7,
	7,
	5,
	5,
	5,
	5,
	3,
	3,
	7,
	7,
	10,
	8,
	9,
	7,
	6,
	10,
	7,
	6,
	6,
	4,
	4,
	8,
	9,
	7,
	9,
	9,
	9,
	9,
	8,
	8,
	8,
	8,
	10,
	5,
	5,
	5,
	5,
	5,
	5,
	8,
	7,
	6,
	6,
	6,
	10,
	6,
	7,
	10,
	7,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	12,
	9,
	10,
	7,
	7,
	10,
	8,
	10,
	5,
	12,
	9,
	6,
	6,
	6,
	6,
	6,
	7,
	6,
	4,
	4,
	4,
	10,
	9,
	9,
	8,
	7,
	7,
	5,
	5,
	5,
	5,
	5,
	5,
	3,
	3,
	13,
	7,
	7,
	9,
	7,
	7,
	7,
	8,
	9,
	9,
	7,
	8,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	7,
	13,
	9,
	15,
	15,
	4,
	4,
	4,
	4,
	4,
	10,
	10,
	9,
	8,
	9,
	8,
	8,
	9,
	7,
	8,
	7,
	8,
	5,
	5,
	7,
	6,
	6,
	6,
	4,
	4,
	4,
	7,
	8,
	11,
	8,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	7,
	6,
	6,
	6,
	6,
	6,
	6,
	9,
	11,
	10,
	7,
	4,
	4,
	4,
	9,
	8,
	8,
	5,
	5,
	5,
	5,
	5,
	9,
	9,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	9,
	9,
	4,
	4,
	4,
	4,
	8,
	8,
	8,
	9,
	9,
	8,
	8,
	8,
	13,
	2,
	4,
	2,
	7,
	5,
	5,
	5,
	5,
	5,
	5,
	9,
	9,
	6,
	6,
	6,
	6,
	10,
	8,
	8,
	8,
	6,
	6,
	6,
	4,
	4,
	9,
	8,
	10,
	8,
	9,
	8,
	8,
	8,
	9,
	8,
	8,
	5,
	3,
	3,
	3,
	11,
	6,
	6,
	6,
	7,
	6,
	6,
	6,
	4,
	4,
	9,
	8,
	5,
	5,
	5,
	5,
	5,
	3,
	11,
	8,
	6,
	6,
	6,
	6,
	6,
	9,
	7,
	4,
	4,
	14,
	10,
	9,
	8,
	12,
	8,
	8,
	8,
	11,
	15,
	8,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	11,
	11,
	11,
	10,
	10,
	7,
	7,
	3,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	3,
	3,
	3,
	7,
	11,
	7,
	7,
	11,
	11,
	7,
	8,
	9,
	10,
	7,
	7,
	9,
	9,
	9,
	9,
	7,
	7,
	10,
	8,
	13,
	8,
	8,
	8,
	8,
	11,
	10,
	6,
	6,
	8,
	10,
	11,
	14,
	14,
	6,
	6,
	6,
	6,
	6,
	6,
	9,
	11,
	7,
	7,
	6,
	8,
	12,
	11,
	11,
	6,
	6,
	10,
	6,
	6,
	6,
	6,
	6,
	10,
	7,
	7,
	6,
	6,
	11,
	6,
	6,
	6,
	11,
	8,
	9,
	7,
	6,
	10,
	11,
	9,
	10,
	11,
	7,
	11,
	8,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	8,
	6,
	6,
	8,
	9,
	10,
	9,
	6,
	6,
	6,
	10,
	6,
	6,
	6,
	6,
	11,
	10,
	11,
	10,
	9,
	8,
	7,
	7,
	7,
	7,
	11,
	14,
	8,
	10,
	9,
	9,
	8,
	8,
	7,
	11,
	8,
	8,
	8,
	11,
	11,
	10,
	10,
	9,
	10,
	8,
	11,
	10,
	8,
	11,
	9,
	12,
	8,
	10,
	8,
	11,
	8,
	9,
	9,
	11,
	11,
	10,
	11,
	13,
	8,
	7,
	8,
	8,
	9,
	7,
	8,
	8,
	8,
	8,
	7,
	8,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	4,
	4,
	2,
	2,
	2,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	4,
	2,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	8,
	6,
	4,
	4,
	4,
	11,
	7,
	11,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	5,
	5,
	5,
	5,
	3,
	3,
	3,
	3,
	8,
	7,
	7,
	8,
	8,
	4,
	8,
	7,
	7,
	7,
	9,
	7,
	8,
	9,
	8,
	2,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	6,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	4,
	2,
	2,
	3,
	3,
	3,
	3,
	3,
	3,
	4,
	5,
	5,
	3,
	3,
	8,
	8,
	6,
	9,
	4,
	4,
	10,
	7,
	3,
	3,
	3,
	2,
	5,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	4,
	3,
	2,
	2,
	2,
	3,
	3,
	3,
	3,
	3,
	4,
	10,
	2,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	4,
	2,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	2,
	2,
	3,
	3,
	3,
	5,
	2,
	4,
	2,
	6,
	2,
	2,
	9,
	5,
	5,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	5,
	5,
	5,
	9,
	8,
	7,
	9,
	6,
	6,
	11,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	6,
	6,
	7,
	7,
	11,
	8,
	8,
	6,
	5,
	11,
	2,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	4,
	2,
	2,
	3,
	3,
	3,
	3,
	3,
	3,
	6,
	4,
	4,
	4,
	4,
	3,
	3,
	3,
	3,
	5,
	7,
	2,
	3,
	3,
	3,
	3,
	3,
	8,
	2,
	2,
	2,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	6,
	4,
	4,
	4,
	4,
	2,
	2,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	4,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	4,
	2,
	2,
	3,
	3,
	3,
	3,
	3,
	3,
	2,
	3,
	3,
	3,
	3,
	3,
	6,
	3,
	3,
	8,
	10,
	3,
	4,
	4,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	8,
	9,
	10,
	7,
	7,
	1,
	14,
	18,
	13,
	18,
	13,
	10,
	10,
	16,
	13,
	18,
	16,
	13,
	16,
	18,
	13,
	22,
	16,
	16,
	16,
	14,
	21,
	16,
	9,
	14,
	16,
	9,
	9,
	14,
	10,
	10,
	14,
	12,
	14,
	19,
	12,
	11,
	18,
	13,
	17,
	15,
	15,
	15,
	15,
	16,
	14,
	13,
	19,
	18,
	15,
	19,
	18,
	12,
	18,
	12,
	11,
	20,
	14,
	15,
	10,
	17,
	17,
	16,
	19,
	20,
	21,
	15,
	13,
	16,
	15,
	15,
	15,
	1,
	1,
	3,
	8,
	7,
	7,
	8,
	8,
	8,
	1,
	6,
	1,
	1,
	6,
	3,
	3,
	4,
	7,
	3,
	3,
	5,
	5,
	4,
	4,
	4,
	4,
	4,
	2,
	7,
	7,
	8,
	12,
	3,
	4,
	5,
	1,
	3,
	4,
	4,
	10,
	4,
	3,
	3,
	3,
	8,
	7,
	7,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	12,
	9,
	20,
	7,
	5,
	5,
	5,
	9,
	13,
	5,
	5,
	5,
	5,
	5,
	3,
	3,
	3,
	16,
	5,
	5,
	5,
	13,
	7,
	8,
	8,
	11,
	8,
	7,
	9,
	7,
	11,
	12,
	9,
	9,
	8,
	8,
	11,
	10,
	14,
	7,
	12,
	10,
	11,
	13,
	7,
	9,
	11,
	17,
	17,
	14,
	13,
	7,
	8,
	7,
	10,
	10,
	7,
	16,
	13,
	7,
	8,
	17,
	12,
	9,
	8,
	6,
	7,
	10,
	6,
	6,
	12,
	6,
	8,
	10,
	8,
	8,
	8,
	6,
	8,
	6,
	14,
	6,
	6,
	6,
	13,
	6,
	10,
	6,
	6,
	7,
	14,
	8,
	6,
	6,
	10,
	11,
	10,
	9,
	9,
	7,
	7,
	6,
	6,
	6,
	9,
	9,
	7,
	9,
	10,
	9,
	13,
	12,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	6,
	6,
	6,
	8,
	8,
	6,
	8,
	9,
	10,
	9,
	7,
	10,
	10,
	8,
	7,
	8,
	7,
	10,
	12,
	9,
	8,
	15,
	8,
	7,
	8,
	8,
	7,
	7,
	15,
	13,
	7,
	10,
	9,
	14,
	18,
	16,
	7,
	24,
	7,
	8,
	10,
	11,
	16,
	8,
	14,
	7,
	9,
	9,
	9,
	13,
	19,
	14,
	15,
	14,
	11,
	7,
	13,
	9,
	10,
	7,
	13,
	9,
	10,
	11,
	12,
	8,
	9,
	2,
	3,
	5,
	8,
	7,
	4,
	4,
	15,
	10,
	5,
	3,
	3,
	3,
	3,
	3,
	5,
	4,
	4,
	4,
	2,
	2,
	2,
	2,
	2,
	1,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	4,
	4,
	4,
	2,
	2,
	2,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	4,
	2,
	12,
	5,
	3,
	8,
	10,
	15,
	6,
	7,
	2,
	3,
	2,
	5,
	5,
	12,
	2,
	5,
	5,
	5,
	5,
	2,
	2,
	5,
	5,
	12,
	9,
	5,
	2,
	2,
	9,
	5,
	5,
	12,
	12,
	5,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	9,
	12,
	5,
	8,
	8,
	9,
	5,
	5,
	5,
	8,
	19,
	7,
	16,
	15,
	14,
	9,
	9,
	9,
	9,
	7,
	11,
	11,
	11,
	7,
	14,
	10,
	10,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	15,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	9,
	9,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	14,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	15,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	12,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	9,
	9,
	12,
	9,
	9,
	12,
	12,
	12,
	15,
	7,
	11,
	7,
	14,
	11,
	18,
	13,
	8,
	18,
	15,
	18,
	12,
	14,
	12,
	8,
	8,
	8,
	8,
	9,
	9,
	9,
	12,
	7,
	10,
	10,
	8,
	8,
	12,
	12,
	12,
	7,
	12,
	12,
	9,
	7,
	7,
	7,
	7,
	7,
	8,
	15,
	12,
	9,
	10,
	10,
	7,
	10,
	10,
	13,
	11,
	10,
	9,
	22,
	11,
	9,
	8,
	8,
	8,
	8,
	8,
	13,
	18,
	13,
	9,
	15,
	19,
	9,
	7,
	7,
	10,
	7,
	7,
	7,
	11,
	8,
	13,
	17,
	7,
	7,
	10,
	10,
	10,
	7,
	20,
	16,
	7,
	7,
	7,
	7,
	7,
	7,
	11,
	21,
	12,
	12,
	13,
	11,
	14,
	16,
	8,
	8,
	13,
	11,
	7,
	7,
	13,
	7,
	7,
	14,
	15,
	15,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	13,
	10,
	18,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	11,
	8,
	8,
	12,
	12,
	11,
	11,
	8,
	12,
	9,
	9,
	9,
	13,
	13,
	9,
	9,
	9,
	9,
	9,
	9,
	6,
	10,
	12,
	6,
	6,
	6,
	6,
	17,
	11,
	7,
	7,
	7,
	7,
	14,
	14,
	12,
	6,
	7,
	7,
	6,
	6,
	15,
	10,
	13,
	10,
	6,
	8,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	7,
	13,
	9,
	9,
	15,
	13,
	6,
	12,
	12,
	6,
	19,
	11,
	10,
	7,
	7,
	16,
	8,
	19,
	17,
	9,
	9,
	9,
	9,
	9,
	6,
	6,
	6,
	10,
	8,
	16,
	8,
	6,
	6,
	9,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	8,
	8,
	8,
	6,
	7,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	14,
	6,
	6,
	6,
	6,
	20,
	6,
	9,
	6,
	14,
	9,
	9,
	9,
	6,
	9,
	8,
	8,
	12,
	9,
	8,
	8,
	8,
	8,
	7,
	8,
	12,
	7,
	8,
	8,
	8,
	6,
	8,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	9,
	8,
	8,
	6,
	6,
	13,
	9,
	12,
	13,
	12,
	14,
	13,
	12,
	11,
	11,
	6,
	8,
	8,
	8,
	6,
	13,
	12,
	11,
	11,
	12,
	6,
	11,
	12,
	11,
	13,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	15,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	13,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	8,
	8,
	8,
	8,
	6,
	18,
	6,
	12,
	13,
	13,
	13,
	9,
	10,
	15,
	9,
	12,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	9,
	15,
	10,
	9,
	10,
	13,
	9,
	19,
	8,
	18,
	17,
	10,
	10,
	8,
	8,
	6,
	6,
	6,
	6,
	6,
	6,
	10,
	14,
	8,
	16,
	16,
	9,
	8,
	15,
	8,
	8,
	10,
	12,
	14,
	7,
	7,
	8,
	8,
	7,
	7,
	7,
	7,
	8,
	13,
	13,
	11,
	9,
	9,
	9,
	12,
	10,
	17,
	8,
	11,
	9,
	7,
	7,
	14,
	8,
	14,
	14,
	7,
	7,
	7,
	7,
	7,
	7,
	14,
	7,
	7,
	7,
	7,
	7,
	10,
	10,
	8,
	14,
	7,
	7,
	7,
	7,
	8,
	8,
	8,
	8,
	8,
	17,
	9,
	7,
	15,
	7,
	8,
	12,
	7,
	9,
	14,
	7,
	7,
	7,
	9,
	13,
	8,
	14,
	7,
	16,
	18,
	13,
	15,
	14,
	12,
	13,
	10,
	15,
	9,
	7,
	7,
	7,
	10,
	13,
	15,
	15,
	9,
	9,
	9,
	9,
	19,
	11,
	7,
	11,
	11,
	13,
	8,
	8,
	8,
	8,
	7,
	12,
	19,
	17,
	9,
	9,
	13,
	7,
	7,
	7,
	9,
	7,
	7,
	7,
	12,
	13,
	15,
	10,
	8,
	8,
	14,
	15,
	12,
	13,
	13,
	8,
	12,
	14,
	7,
	11,
	7,
	14,
	15,
	13,
	12,
	8,
	8,
	8,
	8,
	11,
	13,
	15,
	15,
	8,
	13,
	12,
	8,
	8,
	8,
	13,
	10,
	16,
	14,
	11,
	8,
	8,
	12,
	12,
	9,
	15,
	15,
	12,
	12,
	13,
	8,
	8,
	9,
	12,
	13,
	9,
	8,
	8,
	8,
	8,
	8,
	8,
	8,
	8,
	8,
	8,
	8,
	11,
	12,
	11,
	7,
	14,
	7,
	13,
	13,
	13,
	12,
	18,
	16,
	7,
	12,
	11,
	10,
	10,
	15,
	9,
	9,
	9,
	21,
	7,
	7,
	7,
	11,
	16,
	8,
	8,
	11,
	11,
	7,
	7,
	7,
	7,
	7,
	19,
	7,
	7,
	7,
	7,
	7,
	7,
	7,
	7,
	7,
	12,
	8,
	9,
	12,
	14,
	11,
	9,
	9,
	9,
	22,
	12,
	3,
	3,
	4,
	8,
	8,
	15,
	4,
	2,
	2,
	5,
	5,
	3,
	3,
	3,
	3,
	3,
	3,
	6,
	6,
	4,
	4,
	4,
	12,
	7,
	10,
	2,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	6,
	7,
	3,
	7,
	5,
	14,
	4,
	4,
	7,
	8,
	10,
	4,
	1,
	3,
	3,
	6,
	2,
	4,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	3,
	3,
	3,
	4,
	2,
	2,
	5,
	3,
	4,
	2,
	2,
	2,
	2,
	2,
	2,
	11,
	5,
	5,
	5,
	11,
	5,
	5,
	3,
	5,
	5,
	5,
	5,
	11,
	14,
	13,
	9,
	11,
	9,
	12,
	8,
	11,
	11,
	8,
	11,
	16,
	9,
	9,
	7,
	10,
	9,
	12,
	8,
	15,
	6,
	7,
	6,
	6,
	13,
	10,
	8,
	11,
	8,
	6,
	6,
	6,
	12,
	16,
	6,
	11,
	7,
	8,
	9,
	18,
	6,
	6,
	9,
	4,
	4,
	6,
	13,
	6,
	6,
	6,
	6,
	8,
	8,
	9,
	16,
	7,
	7,
	14,
	7,
	8,
	8,
	8,
	7,
	7,
	7,
	7,
	7,
	7,
	15,
	13,
	7,
	10,
	7,
	7,
	10,
	12,
	16,
	15,
	7,
	9,
	9,
	14,
	11,
	11,
	10,
	9,
	10,
	8,
	12,
	7,
	8,
	7,
	7,
	10,
	12,
	7,
	12,
	8,
	7,
	2,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	5,
	3,
	3,
	5,
	5,
	5,
	10,
	4,
	8,
	7,
	10,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	1,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	7,
	4,
	5,
	2,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	5,
	5,
	5,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	5,
	6,
	6,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	9,
	8,
	2,
	2,
	2,
	8,
	12,
	7,
	7,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	8,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	5,
	5,
	5,
	7,
	11,
	9,
	8,
	8,
	8,
	7,
	8,
	9,
	7,
	7,
	9,
	7,
	7,
	7,
	10,
	7,
	7,
	10,
	9,
	10,
	6,
	6,
	6,
	6,
	6,
	6,
	15,
	7,
	8,
	9,
	9,
	8,
	6,
	6,
	10,
	9,
	6,
	8,
	13,
	9,
	7,
	6,
	6,
	6,
	6,
	6,
	6,
	12,
	6,
	6,
	7,
	6,
	7,
	6,
	6,
	6,
	10,
	10,
	7,
	6,
	6,
	6,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	6,
	14,
	6,
	6,
	7,
	7,
	9,
	6,
	6,
	6,
	6,
	9,
	9,
	8,
	9,
	10,
	9,
	8,
	9,
	12,
	7,
	7,
	7,
	8,
	7,
	10,
	12,
	11,
	9,
	10,
	7,
	7,
	7,
	9,
	10,
	10,
	8,
	12,
	9,
	7,
	7,
	9,
	8,
	8,
	8,
	10,
	7,
	7,
	8,
	9,
	9,
	7,
	7,
	7,
	8,
	2,
	4,
	6,
	3,
	4,
	2,
	3,
	3,
	3,
	3,
	2,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	4,
	4,
	4,
	4,
	5,
	5,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	5,
	8,
	6,
	4,
	7,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	12,
	3,
	3,
	3,
	3,
	3,
	3,
	4,
	4,
	2,
	3,
	5,
	3,
	4,
	7,
	3,
	3,
	3,
	3,
	3,
	3,
	4,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	4,
	3,
	3,
	6,
	4,
	3,
	4,
	2,
	2,
	2,
	5,
	3,
	3,
	3,
	3,
	3,
	5,
	4,
	4,
	4,
	4,
	7,
	6,
	8,
	9,
	2,
	2,
	2,
	2,
	3,
	3,
	3,
	5,
	7,
	2,
	3,
	3,
	8,
	7,
	7,
	2,
	2,
	8,
	5,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	5,
	5,
	8,
	8,
	7,
	7,
	6,
	10,
	6,
	9,
	7,
	11,
	4,
	6,
	8,
	8,
	7,
	8,
	4,
	5,
	5,
	5,
	5,
	3,
	3,
	11,
	8,
	9,
	6,
	6,
	8,
	7,
	4,
	4,
	7,
	8,
	7,
	2,
	2,
	3,
	3,
	3,
	3,
	4,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	7,
	2,
	2,
	5,
	3,
	3,
	2,
	3,
	3,
	3,
	3,
	3,
	3,
	4,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	2,
	2,
	2,
	2,
	2,
	12,
	5,
	5,
	3,
	3,
	3,
	5,
	10,
	12,
	6,
	15,
	4,
	6,
	6,
	7,
	14,
	9,
	3,
	3,
	3,
	3,
	3,
	8,
	2,
	2,
	3,
	5,
	5,
	3,
	3,
	3,
	3,
	3,
	3,
	8,
	8,
	8,
	7,
	5,
	8,
	4,
	6,
	11,
	2,
	2,
	7,
	3,
	3,
	2,
	9,
	8,
	5,
	5,
	3,
	3,
	3,
	5,
	5,
	7,
	7,
	6,
	6,
	10,
	6,
	8,
	6,
	8,
	9,
	7,
	4,
	4,
	4,
	4,
	7,
	6,
	6,
	7,
	7,
	10,
	9,
	8,
	11,
	8,
	3,
	3,
	3,
	3,
	3,
	4,
	4,
	2,
	3,
	3,
	3,
	3,
	3,
	7,
	6,
	2,
	5,
	6,
	7,
	6,
	4,
	8,
	9,
	11,
	2,
	2,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	2,
	2,
	5,
	3,
	3,
	3,
	3,
	3,
	9,
	9,
	6,
	4,
	8,
	7,
	7,
	5,
	9,
	8,
	6,
	2,
	8,
	7,
	8,
	5,
	5,
	5,
	5,
	5,
	3,
	3,
	3,
	16,
	8,
	7,
	7,
	7,
	8,
	7,
	7,
	7,
	7,
	9,
	6,
	9,
	6,
	10,
	7,
	7,
	7,
	6,
	10,
	8,
	9,
	11,
	11,
	8,
	4,
	4,
	10,
	8,
	8,
	6,
	9,
	6,
	11,
	8,
	8,
	8,
	15,
	7,
	8,
	9,
	5,
	3,
	3,
	3,
	3,
	3,
	5,
	2,
	2,
	3,
	8,
	9,
	10,
	3,
	2,
	2,
	2,
	2,
	2,
	2,
	3,
	6,
	4,
	2,
	2,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	4,
	4,
	2,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	11,
	5,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	6,
	7,
	4,
	4,
	2,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	12,
	7,
	4,
	12,
	4,
	6,
	5,
	4,
	2,
	2,
	2,
	2,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	4,
	4,
	2,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	4,
	4,
	11,
	10,
	6,
	4,
	6,
	10,
	8,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	5,
	4,
	4,
	4,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	5,
	3,
	4,
	4,
	1,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	10,
	5,
	5,
	5,
	5,
	5,
	5,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	7,
	8,
	8,
	7,
	13,
	12,
	10,
	10,
	8,
	8,
	7,
	7,
	9,
	12,
	11,
	6,
	6,
	8,
	8,
	9,
	7,
	7,
	7,
	10,
	15,
	10,
	4,
	4,
	4,
	4,
	4,
	11,
	8,
	8,
	9,
	7,
	9,
	14,
	14,
	12,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	3,
	3,
	3,
	3,
	3,
	12,
	5,
	5,
	5,
	11,
	10,
	7,
	9,
	3,
	8,
	7,
	3,
	15,
	13,
	11,
	4,
	4,
	2,
	2,
	2,
	19,
	7,
	5,
	5,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	5,
	22,
	18,
	6,
	14,
	17,
	4,
	4,
	19,
	16,
	18,
	2,
	3,
	3,
	7,
	2,
	3,
	2,
	3,
	3,
	6,
	4,
	2,
	3,
	3,
	2,
	5,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	9,
	9,
	2,
	3,
	2,
	2,
	2,
	3,
	3,
	3,
	5,
	7,
	14,
	7,
	7,
	12,
	9,
	13,
	6,
	11,
	6,
	10,
	9,
	7,
	7,
	8,
	12,
	12,
	8,
	8,
	8,
	10,
	7,
	7,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	3,
	3,
	3,
	3,
	3,
	5,
	8,
	10,
	7,
	8,
	11,
	8,
	12,
	9,
	4,
	14,
	7,
	7,
	9,
	13,
	2,
	3,
	3,
	3,
	3,
	3,
	3,
	2,
	3,
	3,
	3,
	1,
	2,
	2,
	3,
	3,
	3,
	3,
	3,
	3,
	5,
	2,
	2,
	5,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	8,
	4,
	4,
	4,
	3,
	2,
	3,
	3,
	3,
	3,
	5,
	2,
	2,
	2,
	2,
	5,
	5,
	5,
	5,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	7,
	7,
	7,
	7,
	7,
	8,
	8,
	8,
	8,
	8,
	12,
	9,
	8,
	8,
	9,
	8,
	6,
	17,
	6,
	6,
	6,
	8,
	8,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	7,
	4,
	4,
	8,
	8,
	9,
	9,
	9,
	7,
	7,
	7,
	7,
	7,
	7,
	7,
	9,
	9,
	9,
	7,
	8,
	8,
	8,
	10,
	7,
	13,
	10,
	8,
	9,
	3,
	3,
	5,
	13,
	3,
	3,
	3,
	3,
	3,
	7,
	7,
	6,
	6,
	10,
	13,
	11,
	11,
	8,
	8,
	9,
	8,
	9,
	9,
	10,
	10,
	10,
	11,
	10,
	10,
	13,
	13,
	16,
	15,
	11,
	12,
	9,
	9,
	10,
	9,
	11,
	10,
	9,
	9,
	14,
	7,
	8,
	3,
	10,
	7,
	7,
	3,
	2,
	2,
	2,
	5,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	6,
	7,
	2,
	2,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	4,
	11,
	6,
	7,
	4,
	6,
	2,
	2,
	3,
	3,
	3,
	1,
	3,
	3,
	3,
	3,
	3,
	3,
	6,
	4,
	4,
	2,
	2,
	2,
	3,
	3,
	3,
	3,
	4,
	4,
	6,
	6,
	6,
	6,
	5,
	4,
	4,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	2,
	9,
	11,
	6,
	10,
	9,
	12,
	7,
	7,
	11,
	14,
	9,
	7,
	12,
	3,
	3,
	7,
	12,
	11,
	12,
	7,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	9,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	3,
	3,
	3,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	11,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	11,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	3,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	3,
	3,
	3,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	3,
	3,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	6,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	5,
	3,
	10,
	3,
	3,
	3,
	11,
	3,
	5,
	9,
	11,
	8,
	12,
	14,
	9,
	7,
	8,
	7,
	7,
	11,
	11,
	7,
	7,
	10,
	9,
	8,
	10,
	9,
	7,
	7,
	7,
	7,
	7,
	7,
	8,
	8,
	7,
	11,
	8,
	8,
	8,
	7,
	7,
	10,
	8,
	7,
	13,
	12,
	7,
	17,
	10,
	8,
	8,
	11,
	7,
	11,
	11,
	14,
	7,
	11,
	7,
	8,
	6,
	9,
	20,
	8,
	7,
	9,
	16,
	7,
	10,
	6,
	11,
	10,
	8,
	9,
	7,
	16,
	11,
	11,
	9,
	8,
	9,
	8,
	8,
	8,
	11,
	8,
	15,
	8,
	8,
	9,
	7,
	8,
	8,
	11,
	10,
	7,
	5,
	7,
	10,
	10,
	15,
	7,
	7,
	7,
	8,
	7,
	8,
	8,
	10,
	11,
	10,
	10,
	10,
	11,
	11,
	7,
	8,
	6,
	8,
	8,
	8,
	10,
	6,
	8,
	6,
	6,
	7,
	8,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	16,
	6,
	15,
	6,
	7,
	11,
	11,
	7,
	9,
	10,
	11,
	13,
	10,
	6,
	16,
	8,
	10,
	12,
	11,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	10,
	6,
	10,
	7,
	7,
	7,
	11,
	7,
	11,
	6,
	6,
	6,
	6,
	6,
	6,
	17,
	7,
	7,
	6,
	6,
	12,
	22,
	6,
	6,
	6,
	6,
	6,
	8,
	6,
	6,
	6,
	6,
	7,
	6,
	6,
	5,
	6,
	6,
	8,
	11,
	6,
	9,
	14,
	11,
	9,
	11,
	7,
	7,
	8,
	6,
	6,
	6,
	8,
	10,
	9,
	6,
	6,
	6,
	6,
	9,
	7,
	6,
	6,
	6,
	6,
	6,
	15,
	6,
	4,
	4,
	4,
	6,
	4,
	17,
	8,
	11,
	6,
	6,
	9,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	7,
	6,
	6,
	6,
	6,
	10,
	6,
	10,
	6,
	6,
	6,
	6,
	12,
	8,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	9,
	6,
	6,
	6,
	6,
	18,
	6,
	6,
	6,
	8,
	9,
	10,
	7,
	8,
	9,
	10,
	11,
	7,
	13,
	6,
	8,
	8,
	6,
	6,
	14,
	7,
	7,
	7,
	7,
	10,
	7,
	14,
	9,
	6,
	6,
	9,
	15,
	9,
	7,
	14,
	6,
	11,
	14,
	13,
	7,
	12,
	8,
	7,
	7,
	7,
	7,
	7,
	12,
	7,
	10,
	9,
	16,
	6,
	8,
	6,
	5,
	17,
	6,
	8,
	10,
	4,
	6,
	4,
	10,
	15,
	17,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	4,
	8,
	4,
	4,
	11,
	7,
	4,
	4,
	7,
	7,
	7,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	6,
	19,
	17,
	6,
	10,
	11,
	6,
	6,
	6,
	6,
	18,
	6,
	6,
	11,
	4,
	4,
	4,
	5,
	6,
	6,
	6,
	9,
	5,
	6,
	4,
	6,
	6,
	4,
	6,
	6,
	6,
	6,
	10,
	6,
	6,
	4,
	6,
	6,
	10,
	6,
	10,
	6,
	6,
	6,
	6,
	11,
	6,
	6,
	10,
	6,
	6,
	8,
	6,
	6,
	6,
	8,
	6,
	11,
	4,
	11,
	9,
	10,
	9,
	11,
	4,
	8,
	4,
	11,
	12,
	7,
	9,
	8,
	6,
	7,
	7,
	8,
	12,
	12,
	11,
	13,
	10,
	11,
	7,
	7,
	7,
	9,
	7,
	11,
	10,
	7,
	7,
	7,
	16,
	11,
	10,
	11,
	17,
	9,
	9,
	8,
	8,
	7,
	7,
	7,
	9,
	7,
	7,
	7,
	14,
	7,
	13,
	9,
	11,
	10,
	14,
	10,
	10,
	12,
	11,
	10,
	7,
	10,
	5,
	14,
	8,
	8,
	8,
	9,
	7,
	8,
	7,
	7,
	9,
	8,
	7,
	8,
	7,
	7,
	7,
	7,
	7,
	7,
	7,
	11,
	8,
	10,
	8,
	7,
	8,
	14,
	11,
	8,
	9,
	9,
	9,
	8,
	24,
	10,
	10,
	12,
	7,
	7,
	15,
	11,
	8,
	8,
	12,
	11,
	8,
	9,
	9,
	7,
	8,
	9,
	10,
	11,
	10,
	11,
	7,
	12,
	7,
	7,
	11,
	9,
	8,
	14,
	13,
	12,
	8,
	11,
	10,
	8,
	8,
	7,
	7,
	14,
	9,
	10,
	8,
	9,
	11,
	7,
	14,
	8,
	8,
	13,
	8,
	8,
	12,
	7,
	10,
	14,
	14,
	11,
	9,
	10,
	9,
	9,
	7,
	7,
	11,
	11,
	13,
	9,
	13,
	5,
	5,
	5,
	7,
	9,
	5,
	11,
	12,
	14,
	8,
	7,
	7,
	11,
	10,
	9,
	7,
	8,
	8,
	7,
	10,
	11,
	11,
	5,
	5,
	7,
	5,
	5,
	5,
	7,
	7,
	15,
	7,
	7,
	8,
	7,
	15,
	12,
	12,
	10,
	7,
	8,
	7,
	11,
	7,
	7,
	7,
	23,
	11,
	8,
	8,
	11,
	10,
	7,
	8,
	11,
	7,
	19,
	7,
	7,
	6,
	9,
	9,
	9,
	11,
	3,
	4,
	7,
	8,
	6,
	6,
	4,
	10,
	8,
	2,
	2
]);
var edgeChild = /*#__PURE__*/ new Uint16Array([
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	1,
	1,
	1,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	1,
	1,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	12,
	1,
	1,
	1,
	1,
	1,
	17,
	1,
	1,
	1,
	12,
	1,
	12,
	1,
	12,
	13,
	1,
	1,
	1,
	1,
	12,
	1,
	12,
	1,
	1,
	1,
	1,
	1,
	14,
	21,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	19,
	12,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	20,
	1,
	1,
	1,
	16,
	18,
	1,
	1,
	15,
	1,
	1,
	1,
	1,
	12,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	22,
	1,
	1,
	1,
	1,
	12,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	1,
	24,
	25,
	26,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	1,
	0,
	1,
	1,
	12,
	12,
	12,
	12,
	1,
	32,
	0,
	0,
	0,
	1,
	1,
	1,
	1,
	35,
	34,
	1,
	1,
	1,
	1,
	1,
	33,
	1,
	1,
	1,
	1,
	37,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	38,
	0,
	0,
	0,
	0,
	39,
	40,
	0,
	0,
	0,
	0,
	12,
	1,
	1,
	1,
	12,
	1,
	1,
	1,
	43,
	45,
	45,
	45,
	43,
	45,
	43,
	43,
	44,
	45,
	43,
	45,
	43,
	43,
	43,
	43,
	43,
	43,
	45,
	43,
	43,
	44,
	43,
	43,
	43,
	43,
	45,
	46,
	46,
	44,
	45,
	43,
	43,
	43,
	43,
	43,
	12,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	49,
	51,
	49,
	49,
	49,
	51,
	49,
	50,
	49,
	52,
	49,
	50,
	50,
	49,
	49,
	49,
	50,
	52,
	50,
	52,
	49,
	50,
	50,
	12,
	54,
	54,
	53,
	55,
	50,
	52,
	49,
	49,
	47,
	48,
	56,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	59,
	1,
	1,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	1,
	0,
	1,
	1,
	66,
	67,
	12,
	1,
	1,
	65,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	78,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	76,
	79,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	77,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	1,
	1,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	12,
	1,
	1,
	1,
	1,
	89,
	1,
	91,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	94,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	0,
	1,
	97,
	97,
	1,
	1,
	12,
	1,
	100,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	98,
	1,
	99,
	1,
	101,
	1,
	1,
	1,
	1,
	1,
	102,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	110,
	111,
	1,
	1,
	1,
	1,
	1,
	1,
	113,
	113,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	121,
	122,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	122,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	122,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	126,
	123,
	125,
	120,
	1,
	124,
	1,
	1,
	114,
	1,
	1,
	1,
	1,
	117,
	1,
	127,
	1,
	1,
	1,
	1,
	1,
	1,
	119,
	1,
	108,
	1,
	109,
	1,
	12,
	128,
	106,
	112,
	1,
	1,
	1,
	1,
	1,
	107,
	115,
	1,
	12,
	12,
	12,
	118,
	116,
	1,
	1,
	1,
	1,
	1,
	1,
	0,
	0,
	0,
	0,
	1,
	12,
	12,
	1,
	1,
	1,
	1,
	1,
	12,
	134,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	12,
	136,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	137,
	138,
	12,
	12,
	135,
	133,
	45,
	45,
	140,
	49,
	49,
	139,
	142,
	141,
	1,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	145,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	143,
	0,
	0,
	0,
	0,
	1,
	0,
	144,
	132,
	1,
	0,
	1,
	1,
	12,
	12,
	1,
	1,
	1,
	1,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	148,
	147,
	20,
	1,
	1,
	12,
	12,
	1,
	20,
	12,
	12,
	1,
	1,
	1,
	1,
	1,
	134,
	1,
	1,
	152,
	1,
	1,
	1,
	1,
	153,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	1,
	1,
	136,
	1,
	1,
	152,
	1,
	1,
	1,
	1,
	153,
	1,
	1,
	1,
	134,
	1,
	1,
	1,
	152,
	1,
	157,
	1,
	1,
	1,
	153,
	1,
	1,
	134,
	1,
	1,
	1,
	157,
	1,
	1,
	1,
	1,
	1,
	134,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	134,
	1,
	1,
	157,
	1,
	1,
	157,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	163,
	1,
	1,
	1,
	152,
	1,
	1,
	157,
	1,
	1,
	1,
	153,
	1,
	1,
	163,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	136,
	1,
	1,
	152,
	1,
	157,
	1,
	1,
	1,
	153,
	1,
	1,
	134,
	1,
	1,
	152,
	1,
	157,
	1,
	1,
	1,
	153,
	1,
	1,
	134,
	1,
	1,
	1,
	1,
	152,
	1,
	157,
	1,
	1,
	1,
	153,
	1,
	1,
	1,
	134,
	1,
	1,
	152,
	1,
	1,
	1,
	1,
	169,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	1,
	172,
	1,
	1,
	163,
	1,
	1,
	1,
	1,
	1,
	152,
	1,
	1,
	157,
	1,
	1,
	1,
	153,
	1,
	1,
	163,
	1,
	1,
	1,
	1,
	1,
	152,
	1,
	1,
	157,
	1,
	1,
	1,
	153,
	1,
	1,
	163,
	1,
	1,
	1,
	1,
	1,
	157,
	1,
	1,
	1,
	1,
	167,
	159,
	159,
	12,
	1,
	12,
	171,
	1,
	1,
	1,
	1,
	1,
	160,
	160,
	160,
	154,
	1,
	1,
	1,
	158,
	160,
	164,
	170,
	1,
	1,
	1,
	1,
	158,
	158,
	1,
	1,
	156,
	154,
	167,
	158,
	162,
	175,
	166,
	175,
	1,
	1,
	173,
	1,
	166,
	155,
	158,
	1,
	1,
	1,
	1,
	158,
	1,
	161,
	1,
	1,
	1,
	12,
	1,
	176,
	1,
	165,
	1,
	1,
	1,
	165,
	164,
	168,
	174,
	156,
	167,
	1,
	1,
	1,
	1,
	1,
	1,
	178,
	178,
	178,
	178,
	178,
	178,
	178,
	178,
	178,
	178,
	178,
	178,
	178,
	178,
	178,
	178,
	178,
	178,
	178,
	179,
	178,
	178,
	179,
	178,
	178,
	178,
	178,
	180,
	180,
	178,
	178,
	179,
	178,
	179,
	178,
	178,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	182,
	12,
	1,
	12,
	12,
	12,
	12,
	1,
	12,
	12,
	12,
	12,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	195,
	1,
	197,
	198,
	196,
	195,
	195,
	1,
	1,
	201,
	1,
	202,
	200,
	1,
	12,
	1,
	1,
	1,
	1,
	1,
	1,
	12,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	213,
	195,
	195,
	195,
	195,
	213,
	1,
	1,
	1,
	1,
	216,
	217,
	215,
	1,
	1,
	1,
	1,
	1,
	1,
	219,
	219,
	1,
	1,
	1,
	219,
	219,
	221,
	222,
	220,
	1,
	224,
	1,
	1,
	1,
	1,
	12,
	230,
	231,
	232,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	12,
	1,
	1,
	1,
	1,
	199,
	203,
	1,
	1,
	1,
	1,
	151,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	227,
	1,
	1,
	1,
	194,
	1,
	1,
	1,
	1,
	238,
	1,
	1,
	235,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	12,
	1,
	1,
	1,
	1,
	1,
	12,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	185,
	210,
	1,
	1,
	1,
	206,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	192,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	211,
	1,
	1,
	1,
	1,
	226,
	1,
	1,
	1,
	1,
	177,
	1,
	214,
	1,
	209,
	1,
	1,
	1,
	212,
	1,
	1,
	1,
	12,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	190,
	1,
	12,
	1,
	1,
	12,
	1,
	1,
	1,
	1,
	193,
	1,
	1,
	1,
	208,
	1,
	12,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	12,
	1,
	1,
	239,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	225,
	1,
	1,
	1,
	1,
	1,
	12,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	184,
	12,
	1,
	1,
	1,
	187,
	12,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	229,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	186,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	234,
	1,
	1,
	1,
	191,
	1,
	1,
	1,
	207,
	1,
	12,
	1,
	223,
	204,
	12,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	211,
	1,
	1,
	1,
	1,
	189,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	181,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	205,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	236,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	12,
	1,
	237,
	1,
	1,
	12,
	1,
	1,
	1,
	1,
	188,
	1,
	1,
	1,
	205,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	12,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	12,
	1,
	1,
	1,
	228,
	1,
	1,
	1,
	1,
	183,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	218,
	1,
	1,
	1,
	12,
	12,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	233,
	1,
	1,
	12,
	1,
	1,
	1,
	12,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	249,
	0,
	0,
	0,
	0,
	0,
	250,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	12,
	1,
	1,
	1,
	254,
	1,
	1,
	1,
	0,
	255,
	252,
	253,
	1,
	1,
	1,
	1,
	1,
	1,
	260,
	1,
	262,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	258,
	1,
	1,
	1,
	1,
	1,
	264,
	1,
	1,
	12,
	1,
	12,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	263,
	1,
	1,
	1,
	12,
	1,
	1,
	1,
	1,
	259,
	1,
	1,
	1,
	257,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	261,
	1,
	1,
	1,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	12,
	1,
	12,
	1,
	1,
	1,
	12,
	1,
	1,
	270,
	13,
	1,
	1,
	1,
	12,
	12,
	267,
	268,
	1,
	1,
	1,
	1,
	269,
	1,
	1,
	12,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	271,
	1,
	1,
	12,
	16,
	1,
	1,
	1,
	1,
	1,
	1,
	272,
	1,
	1,
	1,
	12,
	12,
	1,
	1,
	1,
	1,
	1,
	1,
	272,
	12,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	281,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	285,
	285,
	1,
	0,
	0,
	0,
	0,
	0,
	1,
	12,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	178,
	1,
	290,
	291,
	1,
	12,
	1,
	1,
	1,
	1,
	12,
	293,
	1,
	1,
	292,
	1,
	1,
	295,
	1,
	1,
	1,
	1,
	1,
	1,
	0,
	1,
	1,
	1,
	299,
	1,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	12,
	1,
	0,
	1,
	0,
	0,
	0,
	0,
	1,
	0,
	1,
	0,
	1,
	1,
	1,
	1,
	1,
	0,
	1,
	0,
	1,
	1,
	0,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	12,
	0,
	310,
	0,
	0,
	311,
	1,
	1,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	12,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	0,
	0,
	59,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	1,
	0,
	1,
	1,
	1,
	0,
	335,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	337,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	0,
	1,
	1,
	1,
	1,
	12,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	12,
	1,
	1,
	1,
	1,
	1,
	353,
	353,
	354,
	353,
	0,
	205,
	1,
	1,
	13,
	349,
	1,
	347,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	350,
	1,
	1,
	355,
	1,
	235,
	1,
	1,
	1,
	1,
	348,
	1,
	345,
	1,
	351,
	1,
	343,
	1,
	352,
	1,
	344,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	12,
	1,
	1,
	1,
	1,
	12,
	346,
	346,
	1,
	1,
	1,
	194,
	1,
	1,
	12,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	12,
	1,
	1,
	1,
	1,
	12,
	1,
	1,
	1,
	1,
	342,
	1,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	1,
	0,
	0,
	0,
	358,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	1,
	1,
	1,
	1,
	295,
	1,
	1,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	398,
	398,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	390,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	1,
	1,
	1,
	1,
	0,
	1,
	366,
	377,
	1,
	1,
	365,
	400,
	1,
	371,
	1,
	1,
	363,
	395,
	1,
	1,
	381,
	362,
	367,
	1,
	1,
	1,
	374,
	405,
	383,
	1,
	1,
	1,
	1,
	1,
	1,
	384,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	0,
	0,
	0,
	1,
	0,
	393,
	397,
	0,
	0,
	79,
	1,
	1,
	0,
	391,
	368,
	404,
	369,
	372,
	379,
	1,
	394,
	0,
	1,
	0,
	79,
	388,
	386,
	1,
	0,
	0,
	1,
	1,
	1,
	0,
	0,
	0,
	0,
	407,
	1,
	1,
	378,
	1,
	79,
	1,
	0,
	1,
	1,
	1,
	410,
	1,
	0,
	0,
	79,
	385,
	0,
	1,
	364,
	1,
	1,
	1,
	0,
	1,
	1,
	387,
	1,
	0,
	1,
	1,
	1,
	0,
	1,
	412,
	375,
	1,
	1,
	0,
	1,
	0,
	0,
	403,
	0,
	1,
	1,
	1,
	79,
	396,
	1,
	1,
	392,
	389,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	370,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	402,
	0,
	79,
	1,
	1,
	1,
	1,
	0,
	1,
	1,
	1,
	1,
	1,
	1,
	0,
	0,
	1,
	1,
	406,
	1,
	1,
	1,
	0,
	0,
	409,
	0,
	0,
	0,
	1,
	382,
	1,
	0,
	79,
	408,
	1,
	0,
	0,
	0,
	0,
	411,
	1,
	1,
	0,
	0,
	1,
	0,
	1,
	0,
	380,
	0,
	376,
	0,
	1,
	1,
	1,
	0,
	1,
	1,
	0,
	399,
	373,
	401,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	1,
	1,
	0,
	0,
	0,
	1,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	12,
	1,
	1,
	1,
	12,
	427,
	427,
	1,
	1,
	12,
	12,
	1,
	427,
	1,
	1,
	12,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	0,
	0,
	1,
	1,
	1,
	1,
	1,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	439,
	1,
	1,
	0,
	1,
	1,
	1,
	1,
	235,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	1,
	1,
	1,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	457,
	457,
	1,
	1,
	0,
	0,
	343,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	12,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	470,
	1,
	469,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	474,
	1,
	12,
	12,
	1,
	1,
	1,
	1,
	1,
	12,
	1,
	1,
	1,
	1,
	482,
	1,
	1,
	1,
	484,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	481,
	1,
	476,
	1,
	1,
	1,
	1,
	463,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	477,
	12,
	1,
	1,
	1,
	1,
	483,
	1,
	1,
	1,
	478,
	472,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	343,
	1,
	460,
	1,
	1,
	12,
	480,
	1,
	1,
	343,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	465,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	483,
	1,
	1,
	1,
	1,
	343,
	1,
	479,
	1,
	1,
	1,
	473,
	467,
	1,
	1,
	1,
	1,
	1,
	468,
	1,
	485,
	471,
	1,
	1,
	1,
	1,
	1,
	466,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	461,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	475,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	464,
	1,
	1,
	1,
	1,
	1,
	462,
	1,
	249,
	486,
	1,
	1,
	1,
	1,
	1,
	12,
	1,
	1,
	1,
	1,
	12,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	1,
	1,
	1,
	0,
	1,
	0,
	0,
	1,
	0,
	1,
	0,
	1,
	1,
	0,
	0,
	0,
	492,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	1,
	1,
	12,
	1,
	67,
	1,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	496,
	0,
	496,
	496,
	496,
	496,
	496,
	496,
	496,
	0,
	496,
	496,
	496,
	496,
	496,
	1,
	496,
	496,
	496,
	0,
	496,
	496,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	501,
	500,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	505,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	498,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	499,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	507,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	496,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	504,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	497,
	0,
	0,
	508,
	503,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	502,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	496,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	497,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	496,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	506,
	0,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	12,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	518,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	229,
	229,
	1,
	522,
	1,
	1,
	1,
	521,
	1,
	1,
	1,
	1,
	517,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	519,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	523,
	1,
	1,
	520,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	398,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	524,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	1,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	535,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	1,
	1,
	0,
	0,
	0,
	1,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	1,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	1,
	0,
	1,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	1,
	0,
	0,
	1,
	0,
	0,
	1,
	1,
	1,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	1,
	0,
	0,
	12,
	1,
	537,
	1,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	12,
	12,
	1,
	0,
	1,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	0,
	1,
	1,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	1,
	0,
	1,
	1,
	1,
	1,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	1,
	59,
	1,
	1,
	12,
	12,
	12,
	12,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	556,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	557,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	555,
	1,
	1,
	12,
	1,
	1,
	559,
	268,
	1,
	1,
	12,
	12,
	1,
	1,
	12,
	1,
	12,
	1,
	1,
	1,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	1,
	1,
	1,
	563,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	1,
	0,
	0,
	1,
	1,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	1,
	1,
	1,
	1,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	1,
	569,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	132,
	1,
	12,
	574,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	107,
	1,
	1,
	12,
	1,
	1,
	1,
	12,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	579,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	12,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	0,
	0,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	1,
	1,
	1,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	144,
	1,
	1,
	1,
	257,
	1,
	1,
	12,
	30,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	0,
	0,
	1,
	604,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	1,
	1,
	1,
	249,
	1,
	354,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	0,
	0,
	609,
	1,
	1,
	1,
	1,
	0,
	611,
	0,
	79,
	0,
	610,
	0,
	1,
	1,
	1,
	0,
	1,
	1,
	1,
	1,
	1,
	1,
	12,
	0,
	0,
	0,
	1,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	618,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	0,
	0,
	1,
	0,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	613,
	613,
	0,
	617,
	615,
	613,
	613,
	613,
	613,
	613,
	619,
	613,
	613,
	623,
	613,
	613,
	613,
	613,
	613,
	613,
	613,
	613,
	613,
	613,
	620,
	617,
	613,
	613,
	617,
	613,
	613,
	613,
	613,
	613,
	613,
	613,
	613,
	613,
	613,
	613,
	613,
	613,
	615,
	613,
	613,
	613,
	613,
	613,
	621,
	613,
	613,
	613,
	613,
	613,
	613,
	0,
	0,
	0,
	1,
	622,
	1,
	1,
	1,
	1,
	616,
	1,
	1,
	1,
	1,
	1,
	614,
	1,
	1,
	1,
	1,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	12,
	627,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	1,
	1,
	0,
	0,
	0,
	0,
	0,
	1,
	12,
	1,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	12,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	12,
	1,
	1,
	12,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	96,
	64,
	307,
	333,
	438,
	565,
	0,
	4,
	68,
	265,
	283,
	309,
	334,
	360,
	414,
	440,
	0,
	529,
	549,
	566,
	629,
	9,
	0,
	60,
	88,
	424,
	436,
	456,
	607,
	0,
	527,
	548,
	562,
	644,
	0,
	30,
	6,
	0,
	491,
	530,
	634,
	592,
	70,
	0,
	7,
	312,
	284,
	415,
	493,
	443,
	568,
	79,
	630,
	0,
	608,
	336,
	445,
	495,
	9,
	105,
	315,
	536,
	6,
	30,
	0,
	338,
	79,
	417,
	79,
	513,
	10,
	6,
	131,
	277,
	302,
	0,
	645,
	539,
	0,
	595,
	0,
	63,
	6,
	6,
	280,
	95,
	2,
	459,
	425,
	437,
	628,
	0,
	6,
	0,
	6,
	313,
	103,
	6,
	593,
	531,
	570,
	0,
	494,
	416,
	300,
	314,
	8,
	71,
	104,
	631,
	573,
	418,
	339,
	327,
	446,
	146,
	74,
	317,
	577,
	540,
	633,
	596,
	361,
	356,
	509,
	6,
	75,
	149,
	11,
	0,
	278,
	552,
	578,
	597,
	544,
	582,
	602,
	643,
	36,
	6,
	289,
	322,
	359,
	331,
	247,
	30,
	558,
	585,
	247,
	41,
	245,
	294,
	323,
	332,
	433,
	450,
	511,
	301,
	0,
	73,
	594,
	0,
	430,
	444,
	326,
	79,
	276,
	79,
	0,
	612,
	576,
	534,
	319,
	448,
	79,
	419,
	413,
	0,
	0,
	0,
	9,
	587,
	603,
	246,
	0,
	451,
	434,
	561,
	546,
	605,
	647,
	85,
	247,
	42,
	324,
	422,
	452,
	601,
	0,
	541,
	320,
	303,
	79,
	244,
	80,
	28,
	416,
	30,
	6,
	420,
	357,
	330,
	636,
	624,
	554,
	581,
	543,
	0,
	287,
	81,
	30,
	432,
	449,
	0,
	30,
	453,
	0,
	248,
	625,
	547,
	9,
	435,
	454,
	247,
	277,
	86,
	251,
	626,
	606,
	589,
	512,
	455,
	423,
	279,
	256,
	87,
	58,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	652,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	441,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	82,
	0,
	129,
	0,
	0,
	84,
	580,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	27,
	0,
	583,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	441,
	0,
	0,
	0,
	0,
	533,
	0,
	286,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	321,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	649,
	0,
	0,
	0,
	0,
	0,
	648,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	421,
	0,
	0,
	0,
	514,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	69,
	0,
	0,
	0,
	0,
	0,
	0,
	525,
	0,
	0,
	0,
	0,
	0,
	0,
	431,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	240,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	545,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	526,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	298,
	308,
	0,
	0,
	0,
	0,
	0,
	560,
	304,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	542,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	487,
	0,
	0,
	0,
	341,
	0,
	0,
	0,
	0,
	0,
	0,
	282,
	0,
	0,
	0,
	0,
	0,
	0,
	23,
	0,
	0,
	0,
	0,
	600,
	0,
	0,
	0,
	0,
	632,
	551,
	0,
	0,
	0,
	0,
	273,
	0,
	0,
	0,
	0,
	0,
	0,
	489,
	0,
	0,
	510,
	0,
	0,
	0,
	0,
	0,
	61,
	0,
	0,
	0,
	296,
	57,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	275,
	0,
	0,
	0,
	0,
	0,
	306,
	642,
	0,
	72,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	651,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	150,
	0,
	305,
	0,
	0,
	0,
	0,
	0,
	0,
	599,
	0,
	0,
	0,
	0,
	0,
	0,
	553,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	598,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	62,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	242,
	0,
	0,
	0,
	0,
	0,
	3,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	84,
	0,
	532,
	0,
	0,
	0,
	0,
	0,
	586,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	84,
	83,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	516,
	0,
	515,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	288,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	488,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	316,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	567,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	325,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	69,
	266,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	84,
	0,
	638,
	0,
	0,
	584,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	274,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	641,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	550,
	0,
	0,
	0,
	84,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	528,
	0,
	646,
	0,
	0,
	458,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	429,
	0,
	0,
	0,
	575,
	0,
	93,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	31,
	0,
	0,
	0,
	0,
	0,
	0,
	29,
	92,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	318,
	0,
	0,
	0,
	243,
	0,
	0,
	0,
	0,
	0,
	0,
	590,
	0,
	0,
	0,
	0,
	130,
	0,
	0,
	0,
	0,
	0,
	591,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	441,
	447,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	426,
	0,
	340,
	0,
	0,
	0,
	0,
	0,
	5,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	328,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	564,
	0,
	0,
	0,
	442,
	0,
	0,
	428,
	0,
	0,
	0,
	0,
	0,
	0,
	635,
	0,
	0,
	0,
	571,
	0,
	0,
	90,
	0,
	572,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	538,
	490,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	297,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	441,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	640,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	639,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	650,
	0,
	0,
	0,
	0,
	0,
	588,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	329,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	637,
	0,
	0,
	241,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	655,
	655,
	655,
	655,
	655,
	655,
	655,
	654,
	656
]);
var labelText = "orgmilcomschnetedugovdrrformsfeedbackofficialaccoorgmilschnetgovmagazinemediaunioncargopilotgroupcaarespressworksaerodromeworkinggroupair-traffic-controlaircraftaccident-preventioneducatormarketplaceambulanceinsurancecateringairportrepbodyenginesoftwaremodellingair-surveillanceconsultingchartertrainermaintenanceservicesdesignflightskydivingfreightassociationstudentgroundhandlingdgcafuelclubtaxicrewshowballooningexpresstraderbrokerauthoragentsairtrafficjournalistsafetyconsultantmicrolightaccident-investigationparachutingequipmentproductionfederationrecreationscientistnavigationengineertradingglidingleasingresearchpassenger-associationentertainmentparaglidinghangglidingaerobaticrotorcraftemergencycertificationgovernmentaeroclubexchangelogisticschampionshiphomebuiltcouncilconferencecontrolairlinecivilaviationjournalorgcomnetedugovcoorgcomnomnetobjofforgcomnetuwukiloappsframerorgmilcomnetedugovcoradioorgcomnetcommuneedogpbcoitgvorgedugov*spreviewfrontendrelayononstagingupid*mtls*privatelinktypedreamdeveloperbravemochawindsurfaivenmirenupsunwnextbegetngrokclerkwale2bwebcsbrunputerflutterflowspawnbaseshiptodaymagicpatternsnetlifyondigitaloceanrailwayhostedclaudehasurabotdashretoolvercelgithubluyanigadgetreplitcloudflaretelebitedgecomputeevervaultexponyatnoopencrpplxzeaburwasmerframerzeropsrocketpreviewconvexmedusajsspritesonherculeseasypanelstreamlitglideossnowflakemesserliloginlinehackclubcodepennorthflankbase44corespeedleapcellngrok-freeclerkstagelovableon-fleek*us-west-3ap-south-2us-central-2us-central-1eu-central-1ap-south-1us-west-2us-east-2eu-north-1ap-north-1us-west-1us-east-1*rcloudintsegorgmilcomgobbetnetintedugovturmusicasenasamutualcoopip6uriurnin-addre164homeirisgovdixdaemoncloudnssthwien*inexexkunden4accogvormymyspreadshop4lima2ixortsinfofuturecmsfuturehosting12hpprivfuturemailinglima-cityfunkfeuer123webseitednshomemelmyspreadshopcloudletswasantqldvicactnswtascatholicwasaqldvictasidwasantozqldorgcomvicasnactnetedugovnswtasconfcomairflowlambda-urltransfer-webapptransfer-webappairflowtransfer-webapptransfer-webapp-fipstransfer-webappeu-west-3ap-south-2eu-south-2eu-central-2ap-southeast-3ap-southeast-4ap-northeast-3eu-central-1mx-central-1me-central-1ca-central-1il-central-1ap-northeast-1ap-southeast-1me-south-1af-south-1eu-south-1ap-south-1ap-southeast-7us-west-2eu-west-2ap-east-2us-east-2eu-north-1ap-southeast-2ap-northeast-2ap-southeast-5us-gov-west-1us-gov-east-1ap-southeast-6ca-west-1us-west-1eu-west-1us-east-1ap-east-1sa-east-1privatenotebookstudiolabelingnotebookstudionotebooknotebook-fipslabelingnotebookstudionotebook-fipsnotebookstudio-fipsnotebook-fipsnotebookstudionotebook-fipsnotebookstudioeu-west-3ap-south-2eu-south-2eu-central-2ap-southeast-3ap-southeast-4ap-northeast-3eu-central-1me-central-1ca-central-1il-central-1ap-northeast-1ap-southeast-1me-south-1af-south-1eu-south-1ap-south-1us-west-2eu-west-2us-east-2eu-north-1ap-southeast-2ap-northeast-2experimentsus-gov-west-1us-gov-east-1ca-west-1us-west-1eu-west-1us-east-1ap-east-1sa-east-1onrepostsagemakercopporgmilcompronetintedugovbiznameinfoshoprsorgmilcomnetedugovbrendlyresolvenzauscotvstoreorgcomnetedugovbizinfoidacaicoittvorgmilcomschnetedugovinfocloudezproxysiteacmymyspreadshopkuleuvenwebhostingtransurl123websitecloudnsinterhostsolutionsddns5476103298edgfacbmlonihkjutwvqpsryxzbarsycoororgcomedumyftpno-iporxcloud-ipfor-somemmafanfor-morewebhopselfipjozidyndnscloudnsdscloudfor-thefor-betteractivetrailcoeconorestooteorgcomeconeteduassurmoneyafricaarchitectesrestaurantloisirstourismavocatsinfoagrounivcoorgcomnetedugoviatvdeportesaludtksatorgmilcomwebgobnetinteducienciaboliviarevistacooperativaempresanombreindustriamusicapatriamedicinademocraciapoliticapuebloindigenaplurinacionalarteblogwikiinfoagrotransportenoticiasprofesionalacademiaeconomiaecologiamovimientotecnologianaturalsimplesitecepesebamapadfmgalampbacscpirngorotomtrjspaprrprrsesmscepesebamapadfmgalampbacscpirngorotomtrjspaprrprrsesms*biaamfmtcmptvfeirasampajampanatalbelemananiradiog12medindfndbmdtrdthepoaggfjdfdefinfenflegsegongengcngorgzlgslglogppgmillelqslcimcomnomadmjabimbbibbsbabcrectecsjcetcpscpvhudieticriapipsiecnbiorioecogeoteoodoproatoartfstmatvetdetbetnetcntnotfotgrueduajuespappreptmpemparqsrvadvdevgovntrturagrjorfarjusmusdesvixxyzcozfozslzbhzmaringasantamariacampinagrandegoianiasorocabafloripasaobernardocuritibaboavistarecifeaparecidasaogoncasalvadorcuiabamorenamacapalondrinacontagemsocialfortalmaceioleilaoosascoriobranconiteroi9guacutcheblogflogvlogwikitaxicoopmanauspalmascaxiasjoinvillebaruericampinassantoandreribeiraoriopretoweorgcomnetedugovv0windsurfshiptodaycloudsitecoaccoorgnetgovofmilcomgovmediatechzacoorgcomnetedugsjgovmydnspenfnlabnbmbgcbcqconcontnuyksknsmyspreadshopno-ipawdevboxbarsyonidatemfuinabusavinstanceseceuguukussryzespawncsxcloud-ipmyphotosfantasyleaguetwmailcleverappsscrappingccwucloudnsftpaccessgame-serverccgovobjectsrmalpgcust*svcalp1aeappenginermalpgmyspreadshop4lima2ixsquare7cloudscale123websitefirenet12hpflowgotdnslinkyard-cloudcloudnslima-citydnskingobjectstorageedaccogoorusorgcomnetinteduaéroportxn--aroport-byaassogouvcomilgobgovcloudnses-1eu-west-1us-east-1euvipit1eurarubait1s3lbwebsites3websiteru-spbru-mskelasticcsrunstnukukcaukusnl-ams-1fr-par-1fr-par-2functionsnodess3ddlwhmrdbfnck8sifrs3-websitecockpitscblmgdbdtwhkafkpubprivs3ddlwhmrdbk8sifrs3-websitecockpitscblmgdbdtwhkafks3ddlrdbk8sifrs3-websitecockpitscblmgdbdtwhkafkk8sscalebookpl-wawfr-parnl-amsbaremetalsmartlabelinginstancesdechk2kuleuvenlaravelvoorloperurownoxazapscwhstgrvaporonline-serverobservablehqelementorantagonistreclaimjoteluluencowaydiademjelasticmatlabmagentositetrendhostingaxarnetjenv-arubajelejoteravendbemergenttrafficplexconvexkeliwebserveboltbegetcdnstaticson-rancherprimetelonstackitunison-servicesdnshomelinkyardbarsyjelecloudnscocomnetgovmycn-northwest-1cn-north-1s3s3-accesspoints3-websites3s3-accesspointrdsdualstacks3-deprecatedemrappui-prods3-websiteemrstudio-prods3-object-lambdaemrnotebooks-prodexecute-apis3s3-accesspoints3s3-accesspointrdsdualstackemrappui-prods3-websiteemrstudio-prods3-object-lambdaemrnotebooks-prodexecute-apicn-northwest-1cn-north-1cn-northwest-1ebcomputeelbcn-north-1airflowcn-northwest-1cn-north-1oncn-northwest-1cn-north-1amazonawssagemakeramazonwebservicesdirectasgdsdhehahljlnmhbacscahqhshhihnlnynsnmofjbjzjxjtjhkcqtwgsjssxnxjxgxxzgz網絡网络公司orgmilcomnetedugovxn--55qx5dcanva-appsxn--io0a7iquickconnectcanvasitekhsjxn--od0algcanva-codemyqnapcloudsrvrlessclustersrealtimestorageleadpagescarrdcrdorgmilcomnomnetedugovhidnssupabaserdpareplmypiumsoxmitotaplpagesfirewalledreplitowodevwebview-assetsvfswebview-assetss3s3-accesspointdualstackemrappui-prods3-websiteaws-cloud9emrstudio-prods3-object-lambdaemrnotebooks-prodexecute-apicloud9eu-west-3ap-south-2eu-south-2eu-central-2ap-southeast-3ap-southeast-4ap-northeast-3eu-central-1me-central-1ca-central-1il-central-1ap-northeast-1ap-southeast-1me-south-1af-south-1eu-south-1ap-south-1ap-southeast-7us-west-2eu-west-2us-east-2eu-north-1ap-southeast-2ap-northeast-2ap-southeast-5ca-west-1us-west-1eu-west-1us-east-1ap-east-1sa-east-1s3s3-accesspointdualstackemrappui-prods3-websiteaws-cloud9emrstudio-prods3-object-lambdaemrnotebooks-prodexecute-apicloud9consent-portals3s3-accesspointdualstackanalytics-gatewayemrappui-prods3-websiteaws-cloud9emrstudio-prodbedrock-agentcores3-object-lambdaemrnotebooks-prodexecute-apicloud9s3s3-accesspointdualstackemrappui-prods3-websiteemrstudio-prodbedrock-agentcores3-object-lambdaemrnotebooks-prodexecute-apis3s3-accesspointdualstackemrappui-prods3-websiteemrstudio-prods3-object-lambdaemrnotebooks-prodexecute-apis3s3-accesspointdualstacks3-deprecateds3-websitebedrock-agentcores3-object-lambdaexecute-apibedrock-agentcores3s3-accesspoints3-websites3-accesspoint-fipss3-fipss3s3-accesspointdualstackemrappui-prods3-websites3-accesspoint-fipsaws-cloud9s3-fipsemrstudio-prodbedrock-agentcores3-object-lambdaemrnotebooks-prodexecute-apicloud9s3s3-accesspointdualstackemrappui-prods3-websites3-accesspoint-fipss3-fipsemrstudio-prods3-object-lambdaemrnotebooks-prodexecute-apis3s3-accesspointdualstackemrappui-prods3-websiteaws-cloud9emrstudio-prodbedrock-agentcores3-object-lambdaemrnotebooks-prodexecute-apicloud9s3s3-accesspointdualstackemrappui-prods3-websiteaws-cloud9emrstudio-prodbedrock-agentcores3-object-lambdaemrnotebooks-prodexecute-apicloud9s3s3-accesspointdualstacks3-deprecatedanalytics-gatewayemrappui-prods3-websiteaws-cloud9emrstudio-prodbedrock-agentcores3-object-lambdaemrnotebooks-prodexecute-apicloud9vfss3s3-accesspointdualstackemrappui-prods3-websiteaws-cloud9emrstudio-prods3-object-lambdaemrnotebooks-prodexecute-apicloud9eu-west-3ap-south-2eu-central-2ap-southeast-3ap-southeast-4ap-northeast-3eu-central-1mx-central-1me-central-1ca-central-1il-central-1ap-northeast-1us-northeast-1ap-southeast-1me-south-1af-south-1ap-south-1ap-southeast-7us-west-2eu-west-2ap-east-2us-east-2ap-southeast-2ap-northeast-2ap-southeast-5us-gov-west-1us-gov-east-1ap-southeast-6ca-west-1us-west-1eu-west-1us-east-1ap-east-1sa-east-1mrapaccesspoints3s3-accesspointdualstacks3-deprecatedanalytics-gatewayemrappui-prods3-websites3-accesspoint-fipsaws-cloud9s3-fipsemrstudio-prodbedrock-agentcores3-object-lambdaemrnotebooks-prodexecute-apicloud9s3s3-accesspointdualstacks3-deprecatedanalytics-gatewayemrappui-prods3-websites3-accesspoint-fipsaws-cloud9s3-fipsemrstudio-prodbedrock-agentcores3-object-lambdaemrnotebooks-prodexecute-apicloud9s3s3-accesspointdualstackemrappui-prods3-websites3-accesspoint-fipss3-fipsemrstudio-prodbedrock-agentcores3-object-lambdaemrnotebooks-prodexecute-apis3eu-west-3ap-south-2eu-south-2computes3-ap-northeast-2elbrdss3-ap-east-1s3-sa-east-1s3-us-gov-west-1s3-eu-central-1s3-ca-central-1eu-central-2ap-southeast-3ap-southeast-4ap-northeast-3s3-website-us-west-2s3-website-eu-west-1s3-external-1eu-central-1me-central-1ca-central-1il-central-1s3-us-west-1s3-eu-west-1s3-website-sa-east-1s3-website-ap-southeast-2ap-northeast-1ap-southeast-1s3-us-west-2s3-eu-west-2me-south-1af-south-1eu-south-1ap-south-1ap-southeast-7us-west-2eu-west-2us-east-2s3-website-ap-southeast-1s3-1s3-globals3-ap-northeast-3eu-north-1airflowap-southeast-2s3-us-gov-east-1s3-fips-us-gov-east-1s3-me-south-1s3-ap-south-1ap-northeast-2s3-website-us-west-1ap-southeast-5s3-eu-north-1s3-ap-southeast-1s3-website-us-gov-west-1compute-1s3-eu-west-3us-gov-west-1s3-website-ap-northeast-1us-gov-east-1s3-fips-us-gov-west-1s3-website-us-east-1s3-ap-southeast-2ca-west-1us-west-1eu-west-1us-east-1ap-east-1sa-east-1s3-us-east-2s3-ap-northeast-1authauthauth-fipsauth-fipseu-west-3ap-south-2eu-south-2eu-central-2ap-southeast-3ap-southeast-4ap-northeast-3eu-central-1mx-central-1me-central-1ca-central-1il-central-1ap-northeast-1ap-southeast-1me-south-1af-south-1eu-south-1ap-south-1ap-southeast-7us-west-2eu-west-2ap-east-2us-east-2eu-north-1ap-southeast-2ap-northeast-2ap-southeast-5us-gov-west-1us-gov-east-1ap-southeast-6ca-west-1us-west-1eu-west-1us-east-1ap-east-1sa-east-1eu-west-3eu-south-2ap-southeast-3eu-central-1ca-central-1ap-northeast-1ap-southeast-1ap-south-1us-west-2eu-west-2us-east-2eu-north-1ap-southeast-2ap-northeast-2ap-southeast-5eu-west-1us-east-1ap-east-1sa-east-1csrframeservicesbuilderstg-builderdev-builder*ociocpocsazuregcpawsdemoinstanceeu-west-3ap-south-2eu-south-2eu-central-2ap-southeast-3ap-southeast-4ap-northeast-3eu-central-1me-central-1ca-central-1il-central-1ap-northeast-1ap-southeast-1me-south-1af-south-1eu-south-1ap-south-1ap-southeast-7us-west-2eu-west-2us-east-2eu-north-1ap-southeast-2ap-northeast-2ap-southeast-5us-gov-west-1us-gov-east-1ap-southeast-6ca-west-1us-west-1eu-west-1us-east-1ap-east-1sa-east-1previeweu-4us-4us-1eu-1us-2eu-2us-3eu-3appss3-websitekrkrobjectprivateobjectkrkrskrkrsobjectkrprivateobjectkr-privatecomputepaasrag-cloudrag-cloud-chjcloudjcloud-ver-jpcdemonodebalancermembersipeuxvsoncillaocelotonzayalilynxsphinxfentigercustomercaracalsgkrobjectstoragedesgkrusobjectkrkr-naverkr-naver-devkrprivatewebsiteobjectkr-naverkr-privatekr-naver-devjpjpkrjp4jp5s3-website-jpjpkrjp4jp5objectprivateobjecto365cloudstaticxendevapp001testcode-builder-stgplatformmediasiteprojedrydpagesjsx0desazacncoitrueu4uhkukgrbrushatenadiarymyspreadshopfrom-flfrom-wvwebspace-hosttheworkpchatenablogcursorusercontentservesarcasmapplinzisakuratanwixsitefin-ncloudstoragegov-ncloudstorageappchizigiizeis-into-carsdnsiskinkyadobeaemcloudis-a-therapistpgfogmyvncdojinis-an-actress1kappfldrvkozowqa2jpnmexprgmrfirewall-gatewaydynnscafjsfbsbxooguyfrom-gawoltlab-demois-a-anarchistwiardwebteaches-yogadattowebtb-hostinglive-websiteservegamegotpantheonfrom-nhsubsc-payfrom-ohvipsinaappfrom-cadyndns-officehomelinuxfrom-mahercules-appservebbsstreakusercontentfrom-okfrom-wyfastly-terrariumis-a-llamaqualyhqportalserveexchangeon-vaporvivenushopciscofreakgrayjayleaguesmetaaiusercontentfrom-iais-a-libertariansaves-the-whalestaveusercontentyolasiteoperaunitepoint2thisis-a-catererclaudeusercontentlinodeusercontentfrom-vagithubusercontentsells-for-lesshosteurcanva-appsplaystation-cloudddnsfreefrom-pafrom-prfrom-waddnskingoutsystemscloudhotelwithflightmydattois-a-nascarfanmydbserverminiserverdamnserverservehumouris-a-playerfrom-nvfrom-nmemergentagentgentappsamplifyappfrom-kyis-an-accountantnfshostserveircfrom-akpythonanywherestackhero-networkpostman-echolikescandydyndns-mailobservableusercontentserveftpfreeboxosfrom-utcdn77-storageamazonawsneat-urlnclouddyndns-serverlinodeis-a-teacherfrom-vtgleezemythic-beastsus1-pleniteu1-plenitla1-plenitpaywhirlservecounterstrikejdevcloudhealth-carereformis-into-animegoogleapisis-a-painterafricaisa-hockeynutatmetais-an-actora2hostedis-a-democratdatadetectest-le-patrondigitaloceanspacesis-a-designeris-a-hunterlinodeobjectstemp-dnsissmarterthanyoufrom-arsimplesiteevennodetownnews-stagingis-a-liberalgooglecodejelasticservemp3qualyhqpartnerdyndns-free1cooldnsest-a-la-masiondrayddnsdynuddnsfrom-orfrom-miis-a-bloggerfrom-himydobisscanvacodeis-an-engineerest-a-la-maisonupsunappdevinappswafflecellmyasustorwpenginepoweredfrom-ctservep2psame-appmyshopblocksthingdustdatalikes-piediscordsezis-with-thebandlpusercontentis-leetshopitsite3utilitiesis-a-personaltrainersinaappladeskis-a-cheflogoipselfipbase44-sandboxnospamproxyalibabacloudcsmesswithdnsauthgearappsiamallamawithgooglelutrausercontentmochausercontentframercanvasmytabitdyndns-homew-credentialless-staticblitzcpserverdiscordsaysis-a-nurseappspotatlassian-isolated-3premotewdfrom-mtwixstudiocode0emm180rmyactivedirectoryawsappsmytuleapdnsabrpolyspaceqbuserrenderbuiltwithdarkboutirgotdnsabrdnsdopaascanva-hosted-embedawsglobalacceleratorhomesecuritypcmyiphostditchyouripclever-clouddyndns-ipon-aptibleis-a-musicianhosted-by-filessecuritytacticsappspaceusercontenthomeunixstrapiappsame-previewcf-ipfsmycloudnaselasticbeanstalkis-certifieddontexistkasserverik-serverdrive-platformatlassian-3pfirebaseappncpstorageherokuappawsapprunnerbarsycenteris-a-cubicle-slaveservehttpmyshopifyis-a-guruquicksytessiiitesorsitesmagicpatternsappis-a-cpameteorappfrom-wiis-a-rockstarbumbleshrimpdattolocaldatabricksappsreadthedocs-hostedfrom-rifamilydsdyndns-picsplesknsbplaceddnsaliasdynaliasdyndns-remotedoomdnsip-ddnsblogdnsis-a-doctorroutingthecloudamazoncognitobarsyonlinedsmynasddnsgurucloudflare-ipfsdeus-canvasfrom-idsmushcdnpagespeedmobilizerdyndns-at-homeunusualpersonhosted-by-previderis-a-republicandyn-o-saurstreamlitappworkisboringonthewificprapidqualifioappis-uberleetis-slickgetmyipwpdevcloudtypeformdyndns-at-workgentlentapismynascloudw-corp-staticblitzfrom-ingeekgalaxyservebeerfrom-mdonrenderspace-to-rentaivencloudappspacehostedwafaicloudcodespotblogspotatlassian-3p-us-gov-modfrom-ndfrom-msis-a-techieis-a-studentcustomer-ociis-a-photographerdurumisfrom-ksmassivegriddyndns-wikiis-an-entertaineris-a-hard-workermysecuritycamerafrom-mnrackmazedyndns-blogis-a-bulls-fanwritesthisblogfreemyipsimple-urlfrom-sdreservdauthgear-stagingest-mon-blogueuris-into-gamesrice-labsxtooldevicesakurawebis-an-anarchistoraclecloudappsdyndns-worksells-for-urhcloudfrom-dcfastvps-serverwpmucdnis-a-geekscrysecfrom-txis-into-cartoonsmodelscapetrycloudflarelocaltonetstreak-linkbalena-devicesfrom-njforgeblocksfreebox-oswebadorsitefrom-ncdoesntexisthobby-sitestreaklinkshomesecuritymacownprovidertuleap-partnersdattorelaywphostedmailservequakeis-a-socialistservehalflifepivohostingdynuhostingquipelementsw-staticblitzdyndns-webfrom-deproject-studyaliases121is-not-certifiedhercules-devis-a-financialadvisoramazonlightsailservepicsis-a-greenloseyouripfrom-ilwithyoutubemwcloudnonprodwiredbladehostingdnsdojofrom-tnpixolinomyqnapcloudncloudstorageis-an-artisthostedpiis-a-landscaperauiusercontentoaiusercontenton-forgeis-a-conservativedreamhostersnet-freaksapps-1and1is-goneencoreapifastly-edgefrom-nesalesforcefrom-scdeployagentoraclegovcloudappsfrom-alis-a-lawyercechirevultrobjectsstufftoreadisa-geekddnsgeeklovableprojecttry-snowplowfrom-moblogsyteis-a-bookkeepernogmyforumravendbmyboxdeelementoredsaacficogoorinforgcomgobnatneteduidstoreorgcomnetintedudevnomepublorgcomneteduathgovtestscalculatorspaynowinfoquizzesresearchedcloudnsfunnelsassessmentsjscaleforcetmacltdorgmilcompronetgovbizpresseklogesrsccloudcustomfltusrcloude4corealmgovmunicontentproxy9metacentrumdyndyndyndnsdynpagespages-researchitionoccustomercomymyspreadshopipv64diskussionsbereich4limacomrub2ixfirewall-gatewayddnssspdnsbarsykeymachinesquare7myhome-serverspeedpartnercommunity-proschuldockxenonconnectgünstigliefernbwcloud-os-instancedyndnssecmy-routerxn--gnstigliefern-wobin-butterl-o-g-i-nisteingeekin-dslin-berlinin-brbfuettertdasnetzleitungsenin-vpnlcube-serverdyn-ip24logoipdyn-berlinruhr-uni-bochum12hpgoipsrvdnsfruskygit-repossvn-reposinternet-dnsgünstigbestellenhome-webserverxn--gnstigbestellen-zvbbplacedheimdnscosidnswebspaceconfiglima-citydyndns1istmeinvirtualuserschulplattformmy-gatewayddnsseclebtimnetztest-iservmein-iservvirtual-userhome64iservschuletaifun-dnstraeumtgeradeschulserverdynamisches-dns123webseitednshomehs-heilbronndnsupdaterbssgraphicdwadpdwdaepeweaawapaafpfwfabwbpbacwcpcciwebuserapiobjects*teamst3r2lpbravepanelngrokiservstglclcrmerpflypagesbarsyvivenushoplocalcertlocalplayerbearbloggatewaydeno-stagingis-not-ais-a-goodbotdashvercelmocha-sandboxplatter-appreplitgithubpreviewworkersinbrowserevervaultis-ahrsndenoxmitmodxmyaddrstorageapipayloadgrebedocruncontainersstgstagelclstageloginlineis-a-fullstackcodepenleapcellngrok-freeis-coolstoragewebharemediatechlibp2pdiscourseimaginecomyspreadshopstoreregbiz123hjemmesidefirmcoorgcomnetedugovsldorgmilcomwebgobartnetedugovtmorgpolcomsocartnetedugovassoagrondiscoodontk12medcuegyecpaabgengorgmilgalsaltulcomadmesmgobpubdocmonfindgnriouioproartlatvetnetfotedulojgovntrturibrbarxxxofficialbasechefprofmktgpsictechinfoarqtcontdentrrpppsiqgit-pagesritmedfieorgcomlibprieduaipgovriikmeactvsportorgmilcomscieunnetedugovnameinfopintouchtawktotawkmyspreadshoporgcomnomgobedu123miwebcomputeorgcomnetedugovbiznameinfocognito-idptransfer-webappeusc-de-east-1onjelasticnxaspdnsbarsydirectwpdeuxfleurstransurldogadoprvwcloudnsamazonwebservicesdnshomeuserpartycokoobinmkmfidymyspreadshopalandkapsiikixn--hkkinen-5wacloudplatformhäkkinen123kotisivuidacorgmilcompronetedugovbiznameinforadioorgcomneteduuserexperts-comptablestmmyspreadshopgretaprdcomnomynhccifbxoshuissier-justicenotairesaeroportfreeboxoson-webavocatassoportgouvkdnschirurgiens-dentistes-en-franceavouesfbx-os123sitewebveterinairechirurgiens-dentistespharmacienchambagrimedecinfreebox-osdediboxgoupilemszicpyicpvicppleysheezypagesedugovcnpyorgcomcybllcpvtnetedugovtnxonlineschooldaemond6atcopanelorgnetplybotdashstackitkaasorgmilcomnetedugovbizmodltdorgcomedugovcoorgcomneteduappwriteacorgcomnetedugovcloudtranslateusercontentorgcomnetedumobiassoorgcomnetedugovbarsysimplesitediscourseindorgmilcomgobneteduorgcomwebnetedugovguaminfonxhra教育敎育網絡网絡组織組織网络網络组织組织公司政府個人个人箇人ltdorgcomincneteduidvgovxn--uc0ay4axn--55qx5dxn--mk0axixn--io0a7ixn--uc0atvxn--zf0avxxn--lcvr32dxn--od0algxn--wcvs22dxn--gmqw5axn--od0aq3bxn--mxtq1mxn--ciqpnxn--tn0agxn--gmq050iorgmilcomgobneteduiservwp2tempurlmircloudfreesitewpmudevmyfastgadgetcloudaccessjelehalfboltfastvpsemergenteasypanelopencraftizcombrendlynamefromrtpersoadultmedorgpolrelcomproartnetedufirminfoassoshopcoopgouvtmcomediahotelforumvideosportorgsexagrargameslakaseroticaerotikatozsdereklamcasino2000filmsuliinfoboltshopprivnewsszexcityutazasjogaszkonyveloingatlaneacaicogoormyᬩᬮᬶmilwebschnetkopbizzonedesaponpesxn--9tfkymyspreadshopgovmytabittabitorderravpageaccok12idforgnetgovmuniltdplcaccotttvorgcomnetmeca6g5gpgamubacaicniocoukuptverdruscsdelhiindorgmilcomwebnicfingenpronetintedugovresbizbiharbarsyinternetbusinessschooltravelsupabasealumnigujaratfirminfoaeropostbankcoopindevscloudnsno-ipbarsybarrell-of-knowledgebarrel-of-knowledgensupdategroks-thisdnsupdatefor-ourknowsitalldvrcammittwalddynamic-dnsv-infowebhopselfipdyndnshere-for-moreilovecollegemayfirstforumzcloudnsmittwaldservertypo3servergroks-theeusekd1cdndyndnsidrawsainaueuapjpusstagemocksysdevicesclientcustreservdcustdevdisrecprodtestingcobeebyteutwenteboxfusebravepstmndedynngrokorgmilcomnomnetedugovqcxqzzbarsythingdustmo-siemensrb-hostingfh-muenstergitbookbluebitecloudbeesusercontentnodeartkiloappsforgerockdarklangresinstagingapigeebubbleb-datascryptedhypernodedappnodepantheonsitegitlabgithubkeeneticvirtualservercleverappshostyhostingon-rioedugitticketstelebitwixstudioon-k3sicp0icp12038jeleqotolairbubbleappsmyaddrstolosmyrdbxwebflowdrive-platformbeagleboardhasura-applolipopdefinimavaporcloudmusicianwebflowtestazurecontainerresindevicereadthedocsloginlineeditorxmoonscalesandcatsbasicserverwebthingsbrowsersafetymarkbeebyteappbitbucketidaccovistablogorgschnetgovxn--mgba3a4f16axn--mgba3a4fraarvanedgeايرانایرانjclaspeziapdudcefegelemeperetevebacanatavaparasabgagfgogrgpgalclblimfmrmcbmbvbfclcmcvcrcpcchlimifibicivipirisimncnbnanenrnpntnnolomobocoaogorosopotoptvtatctbtmtltotpusulunutpspapaqsvpvvvtvavvrtrsrprgrfrcrbrarorkrvstsssbscsmsispzczbzbozen-suedtirolmyspreadshopxn--bulsan-sdtirol-nsbxn--valledaoste-ebbtrentinoaltoadigetrentin-sued-tirolxn--forlcesena-c8axn--forl-cesena-fcbxn--bozen-sdtirol-2obtriestetrentinsuedtiroltrentino-s-tirollecceudineaostesienaparmaluccapaviagenoapaduaaostamonzaabruzzoternirietiturinmilanbozenlaziofermoleccocuneonuoropratola-speziavdataaligfvgpugmolcalcamlomumbsicpmnvenvaoedugovabrsarmaremrbastoslazibxosfirenzetrentinosüdtirolval-d-aostavalle-aostamessinacremonaravennatoscanatrentin-suedtirolbolognacalabriaurbinopesarofriuli-v-giuliaogliastraxn--valle-aoste-ebblaquilaandriatranibarlettasyncloudxn--valle-d-aoste-ehbaostavalleyvalled-aostatrentino-alto-adigevallee-d-aostexn--balsan-sdtirol-nsbpistoiasicilialucaniacataniaiserniaperugiabresciaveneziagorizialiguriaimperiabulsan-suedtirolbalsan-suedtirolbarlettatraniandriaxn--trentino-sdtirol-szbforlì-cesenatuscanyvallée-d-aostemantovavallée-aostecasertapiemontevalleaostaval-daostafriulivgiuliatrevisoforli-cesenavalléedaosteferrarapescaravald-aostatrentino-altoadigefriuli-vegiuliavallee-aostecarboniaiglesiastarantomediocampidanovalleedaostetrentinosud-tirolcampobassotrentinsüd-tiroltrentinosüd-tirolmonzabrianzatrentino-südtirolxn--trentino-sd-tirol-c3bpotenzacosenzavicenzaemiliaromagnavenicefrosinonemarchepordenonetrentinosued-tirolvaresemolisevalléeaostefriuli-veneziagiuliabasilicatalatinaanconasavonaveronamodenabiellabolzano-altoadigepugliafoggiaumbriatrentino-stirolgenovapadovamateranovararagusapiacenzatrentinostirolvalleeaostetempio-olbiasudsardegnatrentinsudtirolmassa-carrarafriuliveneziagiuliatrentinosuedtirolandria-barletta-tranitrapanixn--cesenaforl-i8amaceratacaltanissettaascoli-picenobrindisicarraramassacagliaririmininapolivibo-valentiachietibulsan-sudtirolbalsan-sudtiroltrentino-a-adigebulsanbalsaniglesiascarboniamilanotorinoteramodell-ogliastraarezzotrentinoalto-adigerovigotrentovenetoiglesias-carboniatrentino-sud-tirolaltoadigereggio-emiliareggio-calabriasardegnatranibarlettaandriapiedmontxn--sdtirol-n2amedio-campidanotrentino-süd-tirolfriuli-vgiuliafriuli-ve-giuliaromeennaromapisa32-b16-b64-blodiastibarineencomonaplesforlicesenailiadboxosalessandriasicilytrani-barletta-andriaxn--trentin-sdtirol-7vbpesarourbinotrentinsued-tirolcesena-forliforlìcesenaemilia-romagnamonzaebrianzaxn--trentinsdtirol-nsbtrentinos-tiroltrentinsüdtirolvalledaostaolbia-tempiocampidanomediovibovalentiasassarivalle-daostalombardysud-sardegnafriulivegiuliareggioemiliamonzaedellabrianzaalto-adigevercellitrentin-sudtiroltraniandriabarlettatrentino-sudtirolascolipicenobozen-südtirolfriulive-giuliaflorencexn--cesena-forl-mcbcarbonia-iglesiasaosta-valleycarrara-massadellogliastratrentinoa-adigexn--valleaoste-e7apesaro-urbinoxn--trentinosdtirol-7vbxn--trentin-sd-tirol-rzbxn--trentinsd-tirol-6vbtrani-andria-barlettatrentin-süd-tirolxn--trentinosd-tirol-rzbgrossetomonza-e-della-brianzasüdtirolreggiocalabriatrentinoaadigetrentin-südtirolverbano-cusio-ossolafriuliv-giuliaverbaniacampaniatrentino-aadigefriulivenezia-giuliasardiniaandriabarlettatranibarletta-trani-andriacatanzarooristanourbino-pesarocesena-forlìvalle-d-aostacampidano-medio123homepagesiracusatempioolbiasuedtirollombardiaavellinocesenaforlìtrentinofriuli-venezia-giuliabozen-sudtirolandria-trani-barlettabulsan-südtirolbalsan-südtirolmonza-brianzabolzanotrentino-sued-tirolbellunosalernolivornocrotonesondriodnshometrentinsud-tirolmassacarraratrentin-sud-tiroltrentino-suedtirolviterbobergamocesenaforliolbiatempiopalermobeneventoagrigentoofcoorgnetfmaitvphdengorgmilcomschnetedugovperagrikanieasukehandachitatokaiaisaikonanoharuamaobuhigashiuraowariasahiinuyamatobishimaiwakurashitarainazawatoyonegamagorimihamatoyotataharakariyayatomioguchikomakimiyoshinishiotokonamekiyosuchiryutoyohashiokazakiisshikikasugaikotakiratoeianjotogofusosetohazutsushimashinshirotakahamanisshinshikatsuhekinantoyokawaichinomiyatoyoakeodateogataakitaikawakyowahonjoogayurihonjonoshirokamiokakatagamimitanegojomeyokotekosakadaisenkazunonikahohonjyomoriyoshimisatohappoukamikoanihachirogatahigashinarusesembokufujisatokitaakitaitayanagiowanitakkomutsutsurutahirosakigonoheoirasetowadamisawanohejiaomorishingohiranairokunohehashikamitsugarushichinohehachinohenakadomarisannohekuroishisakaeisumiasahiotakiinzaiabikomatsudoyachiyomutsuzawakujukuriomigawakashiwatoganemihamanaritasakuranagaramobarahanamigawachoshishiroichoseikozakishisuikatorimidorichonankyonanfuttsuonjukufunabashinagareyamanodasosatakochuotohnoshourayasukimitsuyokaichibayotsukaidosodegauratateyamakamagayayokoshibahikariyachimatakatsuuratomisatokisarazukamogawaichikawanarashinoichinomiyashimofusaminamibososhirakoichiharaoamishirasatoikatahonaiainansaijoseiyoiyoozuuwajimaniihamanamikatamasakiuchikokihokutobetoonshikokuchuomatsuyamaimabarikamijimakumakogenyawatahamamatsunosabaeikedaobamasakaifukuiohionotsurugamihamawakasaminamiechizeneiheijikatsuyamatakahamaechizensoedaukihaomutaokawanishiogoribuzenonojosueumiokiotochikugosasagurisaigawamizumakishinyoshitomikurumekurateyamadakasuganakamamiyamanogatatakatahakataiizukakawaratagawakasuyaashiyainatsukimunakataminamitsuikishonaikurogifukuchikeisenhigashimiyakoshinguyukuhashiokagakiyamekogaongausuikahotohochuotoyotsumiyawakadazaifuhisayamatachiaraiyanagawanakagawahirokawachikujochikushinochikuhochikuzennamieotamaokumashowateneiiwakikoorinangoononishigoshimogoomotegomishimafukushimaasakawakagamiishishirakawaiitatefutabahiratayugawahanawakitakatakawamatakunimiyabukibandaihigashihironoyamatomiharuyamatsuriaizubangedatesomaaizuwakamatsuyanaizuaizumisatonishiaizuizumizakikitashiobarataishinkaneyamakoriyamainawashirotanagurafurudonosamegawasukagawaishikawatamakawaikedaogakitaruiginanenahashimahichisonakatsugawaibigawashirakawamizunamiminokamomitakekawauesekigaharatomikasakahogikitagatayamagatatajimianpachimotosuyaotsukakamigaharahidakanisekitokigujominogodoyorogifukasamatsutakayamawanouchihigashishirakawakasaharashimonitatsumagoichiyodakannakanrashowameiwakiryuotaoratomiokafujiokaitakuranaganoharahigashiagatsumatakasakishibukawaminakamikatashinatsukiyonokawabanumataannakaoizumimidorishintoisesakiuenoyoshiokakusatsutakayamanakanojonanmokutamamuratatebayashimaebashiotakekaitadaiwahongofuchukuietajimashobaramiharahatsukaichihigashihiroshimamiyoshikumanokurenakasakaseraseranishiasaminamifukuyamashinichionomichiosakikamijimajinsekikogentakeharaotobenanaeikedatohmaozoraobiraabirakyowaeniwataikibibaisharirebunerimohiroooketootarupippunishiokoppechitosefurubirahakodateshiranukakitahiroshimakushiroobihironanporoiwamizawaniikappukunneppufukushimanakasatsunaitoyourakuromatsunaiakabirakamisunagawashibechaurakawakamifuranonakatombetsuasahikawashimokawakayabeokoppebiratoriabashirisaromaatsumanumatahidakabifukamukawamikasahorokanaitoyotomisarufutsuhigashikawaishikarikitamiyoichiesashiiwanaitomariminamifuranoakkeshifuranotoyakoyakumootoineppushikaoishiraoinemuronayorohaboroashorobihororishirifujiutashinaihokutotakasuebetsuurausuassabukikonaishimamakinaiedatetoyabieinikiesanuryuoumuteshikagarikubetsuashibetsukimobetsuaibetsutobetsusobetsuembetsushimizuchippubetsurishirihokuryuhoronobeshintokutsubetsushibetsuhonbetsumombetsutsukigatakuriyamakoshimizushiriuchikutchanmurorannoboribetsukamishihorowassamushinshinotsukembuchiwakkanaikamoenaikiyosatotakinoueshikabesunagawafukagawanakagawatakikawakamikawahigashikagurahamatonbetsumatsumaemoseushirankoshishakotanimakanemashikeotofuketomakomaisandatambaitamiawajikasaiasagoshisoonoakoyashirotoyookaminamiawajiinagawafukusakitakasagokamigorikasugaharimayokawaashiyahimejiakashitaishiaogakisannantakinosumototakarazukanishinomiyashingugoshikinishiwakiyokatakaaioimikisayoyabukawanishiamagasakisasayamashinonsenkakogawaichikawakamikawatatsunotsukubaiwamaogawaasahisakaitokaioaraiitakobandodaigosuifuinaamikasumigaurakashimaomitamayachiyoshimodatetomobetoridehitachinakainashikisakuragawakasamayawaramoriyahitachiomiyanamegatayamagatahitachikamisuushikutakahagiibarakitonekoganakasowayukimihojosomitoryugasakishimotsumafujishirotsuchiurachikuseihitachiotashirosatotamatsukuriuchiharashikahakuinanaotsubatawajimakahokukawakitatsurugikaganominotosuzuuchinadakomatsuanamizunakanotohakusannonoichikanazawaiwateshiwafudaikawaimoriokaofunatohanamakikuzumakikitakamininohekunoheyamadayahabasumitaichinosekitanohatahiraizumirikuzentakatajobojiotsuchihironomiyakoiwaizumikarumaiichinohenodakujitonooshushizukuishifujisawamizusawakamaishikanegasakimannoutazukotohiraayagawazentsujihigashikagawauchinomikanonjisanukimarugamemitoyotakamatsutadotsunaoshimatonoshoakuneamamiizumihiokiyusuikinkoisasookouyamanakatanekagoshimakanoyaisenkawanabeminamitanemakurazakitarumizunishinoomotematsumotosatsumasendaioimatsudaayaseebinamiurazushinakaiodawaraiseharasagamiharahakoneaikawakaiseiatsugitsukuihadanoyamatoyamakitazamaoisochigasakininomiyayokosukakamakuraminamiashigarafujisawasamukawakiyokawahiratsukayugawaraokawaumajikochitsunootoyoakiinonishitosayasudahidakamiharasakawaniyodogawahigashitsunokagamigeiseisusakiotsukinaharisukumomurototosakamiochitoyotosashimizumotoyamanankokunakamurakitagawayusuharaogunichoyoukiasoutoozugyokutoamakusamifunetakamoriyamagaminamataminamiogunikikuchisumotoyamatonagasumashikiaraokumamotokamiamakusanishiharayatsushiroayabeseikasakyoideineujinakagyokameokakyotangokyotanabekyotambaminamiyamashiroyamashinatanabeyawatawazukaminaminantanmiyazuhigashiyamafukuchiyamakitamukokamojoyokizumaizuruujitawaraoyamazakinagaokakyokumiyamakawagoeinabeshimameiwaasahitaikiudonoisetsukisosakikuwanamihamamiyamasuzukatamakimisuginabarikumanokomonominamiisewataraitobakiwatakikihotadomatsusakayokkaichikameyamaureshinoishinomakishichikashukuohirataiwaosakizaohigashimatsushimashikamaiwanumashibataogawaraonagawakawasakiseminemarumoriminamisanrikukakudamuratawakuyatomiyanatoriwataritagajomisatotomekamirifushiroishimatsushimayamamotoshiogamafurukawahyugaebinotsunosaitoayakushimanobeokakitauramiyazakitakazakigokaseshiibamimatashintomikunitomikitakatakobayashikawaminamitakaharukijotakanabemiyakonojonishimeranichinankitagawakadogawamorotsukakisofukushimaminamimakisakaeobuseikedaogawamiasaokayaasahiotakiotarichinoinaomichikumakomaganechikuhokukaruizawayasuokaooshikaikusakaminamiaikitogakushimatsukawakawakamitateshinatakamorikitaaikishiojirimiyadahakubaiizunaiijimaiiyamamiyotasuzakayasakatoguraookuwanagawaminowahirayayamagataminamiminowafujimiomachisakakitakaginaganonakanosakuhokomoronagisoshinanomachiwadauedaiidaharasuwatomiachiaokianankisosakunozawaonsenagematsutakayamashimosuwamatsumotoyamanouchinakagawamochizukiazuminotatsunoobamaomuraseihiunzenosetofutsuikichijiwanagasakiisahayahasamisaikaikawatanasasebohiradokuchinotsugototogitsutsushimashimabarashinkamigotomatsuurayamazoekashibaikomakawaitenrioyodosangokoryoudaojiikarugayamatokoriyamatenkawakatsuragikurotakikawakamimiyakemitsuetakatorikamikitayamayamatotakadahegurishinjokanmakisakuraitawaramotogoseoudanarasoniandokawanishishimoichihigashiyoshinokashiharashimokitayamanosegawayoshinomintsivorytopazsakuragehirnsumomoaseinetopalmail-boxmokurenyoitamuikaojiyagosensanjoaganomyokoseiroagaomishibataniigatanagaokamurakamiuonumayuzawakariwatagamitainaitsunanminamiuonumatochioyahikojoetsuseiroukamosadoizumozakitokamachiitoigawasekikawakashiwazakitsubamemitsukekokonoesaikiusukibeppuusahimeshimakunisakihasamataketatsukumihitaoitahijikusuyufukujukamitsuebungoonobungotakadaibaraniimibizentsuyamaokayamakasaokahayashimayakagemaniwaakaiwamisakishinjotamanotakahashikibichuowakesojanagishookumenannishiawakurakurashikiasakuchisetouchikagaminosatoshotomigusukunakagusukuyaeseizenaurumaiheyaaguniogiminanjokinminamidaitokitanakagusukuyonaguniokinawaishigakikunigamiurasoekadenataramahiraraginozataketomishimojizamamitonakiitomanhigashimotobuyonabarugushikamionnanahanagohaebarukumejimakitadaitonakijinnishiharayomitanginowantokashikiishikawaikedasuitaminohizuminishisakaikananabenodaitoosakasayamayaokishiwadatadaokakaizukatondabayashichihayaakasakakumatorikadomasayamahigashiosakashijonawatehirakatataishimisakitajirihannansennankatanotoyonominatosettsuhigashiyodogawaibarakinosekitachuohigashisumiyoshifujiiderakashiwaraizumiotsutoyonakamatsubaramoriguchiizumisanoshimamototakatsukineyagawahabikinotakaishikawachinaganoyoshinogarikamiminearitaouchiimarihizenogikashimaariakekiyamafukudomikitagatakitahataomachigenkaikanzakinishiaritakyuragisagataratosutakushiroishikaratsuhamatamakouhokukawagoeyoshidasatteogoseirumaasakaurawaogawaniizaomiyayoriiotakishikihonjooganohannohanyuinasaitamaokegawaarakawayoshikawayokozehasudasayamahidakafukayachichibuiwatsukiryokamiyoshimikamiizumifujimiwarabiranzanmiyoshiminanoyashiosakadosugitomisatohigashichichibutodasokakukiyonokazoshiraokakasukabekounosukawajimatsurugashimamiyashirokitamotohatoyamamoroyamahatogayakumagayakawaguchinagatorokamisatomatsubushinamegawatokigawakamikawafujiminohigashimatsuyamakoshigayatokorozawas3isk01isk02ryuohkoseikonanaishorittotakashimamaibarahikonetorahimenishiazaikokagamokotoyasuotsukusatsunagahamamoriyamatoyosatotakatsukinotogawaomihachimanhigashiomiakagiunnanizumogotsuamayatsukakakinokimatsuehamadamasudahikawahikimiokuizumoyasugiyakumomisatotamayuohdahigashiizumookinoshimanishinoshimatsuwanoshimaneshimadafujiedayoshidashimodagotembaiwataatamikosaiyaizuitoizumishimahaibaramakinoharaomaezakikawanehonkannamisusonohigashiizufukuroinumazukawazufujiaraishizuokahamamatsushimizuizunokunimatsuzakimorimachiminamiizunishiizukikugawakakegawafujikawafujinomiyaujiietsugaoyamayaitaohiranikkoashikagakuroisokanumasakurashioyakarasuyamamotegiichikaikaminokawatochigihagamokanogisanobatonasumibunasushiobaranishikatautsunomiyaiwafunemashikoshimotsukeohtawaratakanezawaitanokomatsushimatokushimaichibaminamiaizumiwajikikainanmiyoshinarutomimamugiananmatsushigesanagochishishikuinakagawamachidachiyodakomaefussainagitaitochofufuchuomeotahigashiyamatotoshimaokutamaaogashimakodairaedogawaarakawahachiojishinagawatachikawashibuyasuginamihinodekiyosesumidaoshimanerimamitakahamuraadachinakanomizuhobunkyomegurominatokoganeihigashikurumekokubunjihigashimurayamamusashimurayamatamakitahinochuokotokatsushikakouzushimaogasawaraakishimakunitachishinjukusetagayamusashinohachijoitabashiakirunohinoharachizunanbukotouramisasawakasayonagokogehinoyazutottorinichinansakaiminatokawaharaoyabetairainamiasahinantoimizufuchutakaokakurobeyamadajohanatoyamatonaminyuzenfunahashinakaniikawanamerikawaunazukitogahimiuozufukumitsutateyamakamiichiiwadearidayuasainamitaijikatsuragiaridagawatanabemihamahidakakainankiminomisatoshingushirahamakamitondayurakozakoyagobokitayamawakayamakudoyamahashimotokushimotokozagawahirogawakinokawanachikatsuurarsuseroeoishidasagaeoguniasahinagaitendonanyoobanazawanishikawasakataohkuratozawamikawamamurogawayamagatafunagatatakahatashonaishinjokahokuiideyuzakawanishitsuruokakaminoyamayamanobeshiratakamurayamanakayamakaneyamahigashineyonezawasakegawamitouubeyuuabushimonosekitabuseoshimatoyotaiwakunihikarishunannagatohagihofukudamatsutokuyamashowadoshitsurunanbukoshukaiminami-alpsnirasakikosugeotsukioshinohokutominobuyamanashifuefukichuokofuichikawamisatoyamanakakonakamichitabayamanishikatsuranarusawafujikawahayakawafujiyoshidafujikawaguchikouenohara長野京都岐阜大阪三重群馬千葉滋賀佐賀奈良adednelgaccogogror秋田愛知高知埼玉沖縄栃木熊本岩手青森山梨新潟島根鳥取長崎香川宮城石川大分宮崎茨城山口兵庫山形徳島広島福島福岡岡山富山静岡愛媛福井東京xn--4it168dhatenadiaryxn--vgu402ckawaiishophatenablogcocottenamaste北海道penneehimeiwateversestabachibashigagonnagunmapermahaccaakitaosakauh-ohblushkochiaichifukuikuroncapooitigohyogotokyokyotopunyuthickcheap0t00g00j0mie2-ddaapyawjg0amfemsubxiiboomoobutchueekpgwrgrherskrboyrdyupperunderflierchipsmydnsheavyangryhippygirlyrulez神奈川鹿児島和歌山bambinaxn--nit225kokayamasaitamaxn--k7yn95exn--1lqs03nsapporoparasitelolipopmcxn--efvn9sniigatafukuokatokushimafukushimahiroshimakagoshimafakefurokinawaxn--8pvr4ucoolblogxn--0trq7p7nnkawasakinagasakimiyazakichilloutxn--8ltr62kxn--klty5xpeeweezombiecutegirlxn--rny31hxn--uuwu58axn--ntso0iqx3axn--djrs72d6uytoyamanikitanyantakagawamimozanagoyaboyfriendxn--2m4a15egreaterchowderegoismyamagatafashionstorexn--elqq16hxn--pssu33lsendaimiyagixn--rht27zpecoriaomorisaloonwatsonvivianxn--djty4knobushipigboatnaganopinokoxn--f6qx53asadistvelvetsecretxn--5js045dchicappayamanashiibarakidigickgirlfriendxn--1lqs71dmongolianxn--c3s14mxn--qqqt11mtochigixn--5rtq34kparallelo0o0mondkobesagabonadecaoitanarafoolkilldecimainhiholomosblokilociaoundopupugifutankcrapflopnooroopsmodsholyjeezstripperpepperbittershizuokaxn--rht3dkitakyushureadymadeicurusversusmatrixxn--rht61ehungryfloppygloomycrankyhandcraftedlittlestarxn--klt787dxn--kltx9awhitesnowsunnydaytottorilovepoptheshopbuyshopxn--5rtp49cxn--d5qv7z876cwebaccelxn--kbrq7oxn--4pvxsxn--1ctwolovesickkumamotocatfoodxn--tor131oyokohamawakayamatonkotsuxn--ehqz56nxn--uist22hxn--6btw5axn--kltp7dyamaguchifrenchkisspussycatxn--4it797kxn--uisz3gbabybluexn--zbx025dnetgamersxn--7t0a264ckanagawaxn--6orx2rishikawaxn--ntsq17ghalfmoonschoolbusjellybeanxn--mkru45iusercontentlolitapunkxn--32vp30hsakurastoragehokkaidoshimanecandypopbabymilksupersaleweblikeraindropbackdropwebsozaikikirarahateblodaynightmeneacsccogoormobiinfoaeusxxorgmilcomnetedugovorgcomnetedugovbizinfotmprdorgmilcomnomedugovassnotairespresseassocoopgouvveterinairemedecinpharmaciensorgnetedugovtraorgcomedurepgovmeneperekgacscaiiocogoitoresmshsseoulbusanulsandaeguc01milvkimmvchungnamjeonnamjeonbukeliv-dnsgyeonggijejueliv-cdnincheondaejeongangwongyeongbukgwangjuchungbukgyeongnameliv-apicoeduindorgcomembnetedugovorgmilcomnetedugovjcloudorgcomnetintedugovperbnrinfocooyorgcomnetedugovethipfscanvamypepethw3sstorachakeeneticjoinmcinbrowserdwebcyonnftstoragemyfritzaemewphlxachotelltdorgcomwebsocschngonetintedugrpgovassnomgacsccoorgnetedugovbizinfo123websiteidorgmilcomasnnetedugovconfidmedorgcomplcschnetedugovaccoorgnetgovpresstmassoirseproxaccosoundcasthoptocraftvp4c66orgnetedugovitsmcdirmyboxbarsyedgestacksynologylogintoopencloudnohostwebhopdiskstationi234tcp4hoocgroknoipprivmydsddnsdnsforlohmustransipdscloudfilegear-sgbrasiliafilegearframerbarsybarsyonlinecoprdorgmilcomnomedugovinforgcomnetedugovnameacprorgcomartnetedugovpresseinfoassoinstgouvorgnycedugovbarsydscloudjuorgcomnetedugovminisiteaccoororgcomnetgovorgmilcompronetintedugovbizmuseumnameinfoaerocoopaccoorgcomnetintedugovbizcooporgcomgobneteduorgmilcomnetedugovbiznameaccoorgmilneteduadvgovcoorgcomnetaltgovforgotherhiskeeneticispmanagernomassoprod5476132eastasiacentraluswesteuropewestus2eastus2pnortheurope-01newzealandnorth-01southindia-01southcentralus2-01norwaywest-01eastus2-01westus2-01australiaeast-01italynorth-01israelnorthwest-01swedencentral-01westeurope-01centraluseuap-01taiwannorthwest-01uaecentral-01northcentralusstage-01israelcentral-01mexicocentral-01canadacentral-01austriaeast-01germanywestcentral-01francecentral-01ukwest-01denmarkeast-01polandcentral-01eastus-01westus-01swedensouth-01eastus3-01westus3-01brazilsouth-01centralus-01francesouth-01australiacentral-01westindia-01uaenorth-01jioindiacentral-01canadaeast-01belgiumcentral-01spaincentral-01koreacentral-01chilecentral-01qatarcentral-01westcentralus-01eastus2euap-01norwayeast-01southafricanorth-01brazilsoutheast-01germanynorth-01switzerlandnorth-01switzerlandwest-01japanwest-01southafricawest-01japaneast-01eastasia-01indiasouthcentral-01taiwannorth-01centralindia-01uksouth-01southcentralus-01northcentralus-01eastasiastage-01indonesiacentral-01australiacentral2-01australiasoutheast-01malaysiawest-01koreasouth-01southeastasia-01southeastus5-01northeastus5-01jioindiawest-01rucdnwest1-usfra1-desandboxjls-sto1jls-sto3jls-sto2aglobalabglobalsslmapprodfreetlsmapvpslon-1lon-2ny-1fr-1sg-1ny-2paassnwebpaashostingjelasticnordeste-idcsocuserpagescwebfileblobservicebuscoreatlricnjsjelasticwebsitestoragesezagbinruhuukjptsmyspreadshopmynetnameakamaiorigin-stagingfrom-coipv64dynv6cdn77serveblogadobeaemcloudhicamsprytdnsupno-ipownipde5ovhicpfirewall-gatewaysytesmypsxbarsyusgovcloudapimyamazemyradwebakamaihdsaveincloudfastlylbfrom-lasubsc-paysquare7in-the-bandblackbaudcdnhomelinuxoninfernoctfcloudservebbsdns-dynamiccloudfrontakamai-stagingipifonyham-radio-opsenseeringclickrisingcommunity-profrom-nylocalcertgrafana-devedgesuite-stagingcloudflareanycasteating-organicatlassian-devmydattofeste-iplocaltotorprojectknx-serveredgekeycloudflareglobalcloudyclustercasacamserveftpakamaized-stagingakamaiorigindns-cloudmyeffectboomlabotdashbuyshousestwmailhetemlazure-mobilein-dslthruhereredirectmedynuddnsbouncemesupabaseluyanicloudappakamaicloudfunctionsdebiannhlfanpgafanstatic-accessin-vpnmysynologymafeloappudohomeftptrafficmanagersiteleafseidatmemsetcloudflarecloudaccesskeyword-onazure-apiis-a-chefdoes-itgets-itwebhopselfiphomeipkicks-assedgesuitewindowsserver-ontunnelmolemydissentscrapper-sitecloudflarecnuni5srcfggffiobbzabchrsndenodynuopikddnsvpndnsakadnselastxkinghostvps-hostfastlyhomeunixazureedgeshopselectdontexistmyfritzcloudjiffyalwaysdatasells-itsquaresbroke-itazurefddattolocalat-band-campmeinforumfamilydsazurestaticappsdefinimabplaceddnsaliasdynaliasnow-dnsblogdnsroutingthecloudendofinternetdsmynasakamaiedgemymediapcadobeio-staticakamaiedge-stagingakamaihd-stagingddns-ipprivatizehealthinsurancelive-onkrellianschokokeksmassivegridmysecuritycamerarackmazeserveminecraftfrom-azis-a-geekakamaizedmoonscaleoffice-on-theusgovtrafficmanageradobeioruntimeedgekey-stagingreserve-onlinechannelsdvrdnsdojousgovcloudappcdn77-sslapps-1and1podzoneazurewebsitesdynathomescaleforceyandexcloudvusercontentisa-geekcdn-edgescoaemalcesappwriteazimuthtlonarvobuiltwithrocketnoticeablestorecomwebrecnetperotherfirminfoartslgdloncogoiltdorgmilcolcomplcschgenngonetedugovbiznamefirmmobiacincoorgmilcomnomwebgobnetintedubizinfocomyspreadshopdemongovtransurl123websitehosting-clusterkhplaycistrongsnesosvalervålerxn--vler-qoaossandeheroysandeherøybøboheroyherøyxn--hery-iraxn--b-5gavalerbøboxn--b-5gasandesandexn--hery-iraxn--vler-qoavålerhåreålaahavaofsfvfhlolnlalrlhmfmtmahcostntbuåstrmreigersundmyspreadshopgálsáeidsvolltingvollgildeskalflorøvadsøvardøvanylvenxn--bhccavuotna-k7astrandaxn--kvnangen-k0axn--sknland-fxaxn--mosjen-eyarakkestadhyllestadnannestadvevelstadvaapstenordre-landsondre-landsøndre-landtjieltexn--vrggt-xqadsør-aurdalsor-aurdalheradstordmoldefordeførdeseljefedjeryggehemnexn--krehamn-dxasognegranesøgnebrynetjomevallebykletokkegiskedovretjømehobølvoldasaudatolgasømnaviknadønnasomnadonnatranafrananesnaraumasmolatrænafrænalesjasmølaørstaorstahitrafloraaukraloppafrøyarissasnasahalsagalsaromsaraisaráisafroyasnåsagronghobolfjelltydalårdalardalaskimharamkraanghkekråanghkesorumbarumhurumbærumsørummodumsálátbálátfrognbjugnvåganvagangulenskienløtenlotenstrynvefsnxn--merker-kuaskaunsveiobømlobomloskjåkvardoflorovadsosalatbalatsálatklæbuklabuselbubarduulvikskjakklepprisørxn--nttery-byaeflåeidflahofmilgolholsellomskifetvikdepvgsfhsaskerrisorhamarasnesåsnesrørosrorosxn--slat-5namasoynaroyvaroyluroydyroyaskoyradoyandoyrodoymeloyradøyandøyrødøymeløyaskøylurøydyrøymåsøyværøynærøyhoylandethøylandetdivtasvuodnalørenskoglorenskognesoddtangenxn--tjme-hraxn--smla-hraxn--stjrdal-s1aunjargalillehammerunjárgaxn--hamary-fyadavvenjargaxn--bearalvhki-y4a123hjemmesidegjerdrumxn--brnnysund-m8acxn--tnsberg-q1axn--mlatvuopmi-s4axn--snsa-roaxn--skierv-utaxn--brum-voatysfjordkvafjordeidfjordkvæfjordsongdalenmjondalenmjøndalenxn--gls-elackragerogáŋgaviikagangaviikasørreisasorreisasør-varangersor-varangerxn--risr-iraskiervaxn--frna-woaxn--trna-woakvinesdalleksvikleirvikrøyrvikroyrviksvelvikvenneslaevje-og-hornnessandnessjøenmarnardalvindafjordsandefjordenebakksnillfjordullensvangxn--trany-yuabrønnøysundnamsskoganaustevollxn--stjrdalshalsen-sqbnord-aurdalnord-frontrøgstadtrogstadgrimstadflakstadgjerstadxn--sandy-yuaxn--leagaviika-52bnore-og-uvdalvegarsheixn--rlingen-mxaxn--ggaviika-8ya47hvegårsheikarlsoykvitsoymasfjordenhamaroyinderoyosteroydavvenjárgasauheradguovdageaidnuxn--vre-eiker-k8abronnoysiellakkrødsheradkrodsheradkvinnheradbrønnøyxn--mtta-vrjjat-k7afxn--lrenskog-54akvitsøyvárggátkarlsøyosterøyinderøyhamarøybronnoysundxn--aurskog-hland-jnbbahccavuotnabáhccavuotnagiehtavuoatnastor-elvdalmidtre-gauldalxn--gildeskl-g0akarasjokevenassixn--bievt-0qaxn--yer-znalebesbynessebyxn--hbmer-xqamalselvmålselvxn--unjrga-rtamøre-og-romsdalmore-og-romsdalhareidmelandørlandorlandstrandålgårdsolundalgardafjordåfjorddielddanuorrikautokeinoxn--stre-toten-zcbskodjeaejriestangeliernebamblestokkefauskesnåasesnaasekongsvingerlangevagberlevagxn--flor-jrahattfjelldalostre-totenøstre-totenvestfoldxn--mely-iraálaheadjualaheadjunordreisaxn--troms-zuaxn--lgrd-poacporsangerflatangerstavangerleikangerbremangersamnangergieldakarasjohkaxn--rdy-0nabfrostautsirasnoasatromsaxn--sr-aurdal-l8aflekkefjordjølsterjolsteraremarkhedmarknååmesjevuemienaamesjevuemiexn--vard-jrarollagmeråkermerakerorskogørskogxn--bdddj-mrabdákŋoluoktaxn--osyro-wuaaknoluoktatrysilskjervøymandaljondalbindalrindalmeldalsuldalorkdalsigdalalvdallærdalhurdalsirdalverdallerdallardaloppdalåseralaseralhadselkragerødivttasvuotnaoverhallasteinkjerxn--hnefoss-q1askedsmokorsettromsøxn--dyry-iravestre-totenmuseumxn--sandnessjen-ogbrahkkeravjufylkesbiblbájddarbajddarxn--laheadju-7yarennesøyxn--koluokta-7ya57hxn--hgebostad-g3aleirfjordstorfjordbalsfjordbåtsfjordbatsfjordmuosátbievátloabátkárášjohkanøtterøyxn--mjndalen-64anordkappláhppilahppialstahaugsiljanverranrøykenroykenhaldenlyngenbergenhortenhønefosshonefosstroandinbeiarnvarggatosoyroosøyrotromsoidrettmuosatbievatruovatloabatvoagattynsetnessetxn--indery-fyaskánitskanitraholtråholtxn--ystre-slidre-ujbandebusarpsborgbearduxn--karlsy-fyahordalandjorpelandjørpelanddeatnuringsakersør-odalsor-odalxn--slt-elabringerikeaudnedalnittedalnissedalhemsedalslattumsurnadalxn--blt-elabelverumstjørdalnaustdalhjartdalgjøvikfyresdalhasviknarviklarvikgjovikmalvikgamviklenvikporsgrunnstjordalengerdaldrobakdrøbakxn--msy-ula0hvestvagoyxn--vgan-qoaxn--ryken-vuaxn--lten-graxn--stfold-9xaxn--hpmir-xqaxn--lury-iramálatvuopmimalatvuopmitysværkirkenesbirkenesmoskenesbáidárxn--fjord-lraxn--rdal-poabahcavuotnabáhcavuotnaxn--frde-gralindåsbearalvahkixn--hobl-iraráhkkerávjuxn--loabt-0qavågåáltábodøsundlundraderådeetnetimeholeauregrueoddavagavegaranatanaarnasolasulaaltalekafusavangbergkvamåmliamlibokntinnroangranosenoslobodorøstroststatåmotamotivguprivøyeroyerliermossvossxn--nvuotna-hwalusterlunnermarkerhábmerhabmerhvalerfjalerxn--rholt-mratysvarbaidarfitjargaularhápmirhapmirmelhusfosnesøksnesoksnestysneshemnesevenesflesbergeidsbergtonsbergtønsberglindasxn--sndre-land-0cbnamsosxn--srum-graøystre-slidreoystre-slidrevestre-slidretrondheimbalestrandxn--langevg-jxaaustrheimxn--skjk-soavagsoyaveroysandoykarmoyfinnoytranoyvestbytranbysykkylvenxn--hyanger-q1aspjelkavikandasuoloxn--fl-ziaxn--drbak-wuastathellexn--sr-varanger-ggbtelemarkxn--bhcavuotna-s4axn--porsgu-sta26fčáhcesuolocahcesuoloakrehamnåkrehamnsandøykarmøyfinnøytranøyvågsøyaverøynamdalseidxn--lesund-huabadaddjaxn--vegrshei-c0axn--btsfjord-9zagildeskålporsanguxn--trgstad-r1anávuotnanavuotnahammerfestxn--sgne-graxn--brnny-wuacibestadharstadnarviikaevenáššivestnesgjemnessandnesagdenesrennesoyxn--avery-yuaxn--tysvr-vrabearalváhkikongsbergspydebergrandabergxn--andy-iradavvesiidaxn--krdsherad-m8aporsáŋgufredrikstadbjerkreimringeburennebuaurskog-holandnotteroyxn--vgsy-qoa0jxn--rmskog-byaskierváivelandbyglandfrolandaurlandforsandxn--bjddar-ptamidsundålesundalesundfetsundfarsundovre-eikerøvre-eikerakershusxn--moreke-juasørfoldøstfoldostfoldsorfoldhøyangerhoyangerlevangerorkangertanangerxn--vestvgy-ixa6olillesandulsteinxn--rennesy-v1agranvinskjervoyxn--klbu-woalavagisxn--h-2faxn--ryrvik-byakafjordkåfjordseljordfolkebiblxn--gjvik-wuajevnakerxn--kfjord-iuabudejjuxn--kranghke-b0axn--davvenjrga-y4axn--rland-uuaxn--ldingen-q1axn--mlselv-iuaxn--rady-iraxn--linds-prabrumunddalxn--ygarden-p1amo-i-ranaeidskogrømskogromskoghjelmelandxn--finny-yuaxn--sr-odal-q1axn--skjervy-v1aballangenkvanangenkvænangengratangenxn--hmmrfeasta-s4acvossevangensuohkanxn--rde-ulaxn--mli-tlaxn--ksnes-uuanordlandskanlandskånlandsortlandfuoiskuxn--rros-graxn--hcesuolo-7ya35bxn--eveni-0qa01gagaivuotnagáivuotnaxn--seral-lradrammenmodalenmosjoenjan-mayentorskensteigengloppenxn--snes-poamatta-varjjatxn--sr-fron-q1aomasvuotnajessheimbådåddjåxn--krager-gyaxn--kvfjord-nxaxn--asky-iraxn--snase-nraxn--bidr-5nacholtålenxn--vads-jraxn--jlster-byamosjøenxn--rst-0nastavernxn--ostery-fyaxn--oppegrd-ixaxn--sknit-yqaxn--risa-5naoppegårdskiptvetrendalenholtalenxn--mot-tlaxn--lhppi-xqaxn--holtlen-hxaxn--srreisa-q1akopervikxn--muost-0qaxn--bmlo-grahokksundkvalsundegersundxn--karmy-yuaullensakerxn--hylandet-54axn--kvitsy-fyaxn--bod-2nalangevågberlevågkristiansandxn--rsta-frahornindalstjørdalshalsenstjordalshalsensandnessjoenhámmárfeastaxn--lrdal-srasør-fronsor-fronnord-odalkristiansundmátta-várjjatvestvågøynesoddennotoddenbuskerudøygardenoygardensalangenlavangenralingenrælingenlodingenlødingenleaŋgaviikalaakesvuemieleangaviikauenorgexn--srfold-byaaskvollxn--rskog-uuaxn--nry-yla5gxn--vry-yla5ghammarfeastaxn--rhkkervju-01afxn--givuotna-8yakommunekrokstadelvanedre-eikerhagebostadhægebostadxn--berlevg-jxakviteseidxn--s-1faxn--l-1faxn--nmesjevuemie-tcbafuosskomoårekemoarekexn--lt-liacxn--jrpeland-54asvalbardoppegardholmestrandtvedestrandsogndalsokndalarendalsunndalfolldalxn--krjohka-hwab49jlyngdaletnedalnorddalsaltdalgausdalskedsmovaksdalgjesdalstordalxn--frya-hraaarbortedrangedalxn--smna-graaurskog-hølandxn--vg-yiabtjeldsundhaugesundlindesnesxn--mre-og-romsdal-qqbxn--dnna-gradyntmpheremerseineshacknetenterprisecloudmineaccomaorimāoriorgmilcriiwigennetschoolhealthkiwigovtgeekxn--mori-qsacloudnsparliamentcomedorgcompronetedugovmuseumwebsitekinservicebarsywebsitebuildereerobookheimdnsleapcelleero-stagetechcrscsslorigingohomecdbedeeeiemesecabgngilnlalplchfisiincnnoroptatitmtltruauhulumkdkukskjplvtrgrfrkrhrusesismycynzcznetinteduassoososcloudstgbetaaezaeuhkusjshatenadiarycdn77hoptozaptois-a-knightmyftpno-ipjpnddnssdpdnsspdnsbarsysweetpepperis-a-bruinsfanis-very-sweetservegameis-a-soxfanhomelinuxcdn77-secureservebbsmisconfusedwebredirectblogsitefreedesktopcouchpotatofriestoolforgeaccesscamis-lostreadmyblogsmall-webfedorapeopleserveftpis-a-celticsfanmywirepotagertwmailin-dslsellsyourhomeread-booksfreeddnscable-modemis-savednflfanufcfanmlbfanstuff-4-saleendoftheinternetin-vpnmy-firewallhomeftpis-localis-a-chefboldlygoingnowherewebhopselfipkicks-assroxatunkcamdvrfedoraprojectgotdnsdvrdnsdyndnspubtlspimientahomeunixdontexistfedorainfracloudwmflabsfspagesbmoattachmentsteckidsfamilydsdnsaliasdynaliasnow-dnscloudnsdoomdnsduckdnsblogdnshomednsroutingthecloudendofinternetdsmynasip-dynamicpoivronhttpbinmyfirewallis-very-evilmysecuritycamerais-a-linux-userwmcloudis-a-geektuxfamilyis-a-candidatedoesntexistis-very-badhobby-sitegame-hostaltervistais-foundis-a-patsfandnsdojohepforgepodzonedynservcollegefanis-very-goodfrom-meis-very-niceisa-geeknerdpolacmedsldingorgcomnomgobabonetedupleskaemhlxmyboxrockyprvcydeuxfleurspdnscodebergheyflowstatichostorgmilcomnomgobneteduorgcomeduiorgmilcomngonetedugovcloudns1337ngrokacorggogfamcomwebgobnetedugokgopgkpgovgosbizpasaugumicsopozpapuwmwsrprusiskwpspkppspkmpspokeoiawsawifoumsdnskokwpmuppuppsppiwwiwoowuzswkzoschrzpisdnwzmiuwwitdpssewsseumigugimoirmpinbwinbwiihupporzgwgriwupowwskrwioswuozstarostwokonsulattmpccopruszkowmyspreadshopostrodakartuzyopolegminamediaustkazgorajgoraolawailawalomzawloclradombytomjaworznotargilubinkoninzagantorunkutnokepnonakloczestsopotsanokturekplockslasksklepzarowlukowmedaidgdaorgmilrelcomnomatmgsmartneteduelkgovwawsossexbiztgorysejnytychypomorzeboleslawiechomesklepsdscloudunicloudzakopanelegnicarawa-mazbydgoszczswidnikkrasnikwloclawekbielawamragowograjeworealestatebeskidykaszubymalopolskaprzeworskswiebodzinlecznadfirmaszkolawarmiagdyniamiastakazimierz-dolnymalborkswidnicadlugolekaostrolekapodlasieelblagtravelsimplesitezachpomormielecszczecinnieruchomosciwalbrzychlezajsklublinbedzinpoznanwielunmielnooleckostarachowicedkontopowiatwroclawrybniksuwalkileborkslupskgdanskostrowwlkptarnobrzegtourismwegrowkrakowglogowyou2pilanysamailwrocinfoagroautobeepshoppriviqhslapypiszlodzcfolksecommerce-shopmazurypulawyskoczowrzeszowpomorskiezgierzkaliszolkuszlowiczostrowiecsosnowiecmazowszewodzislawbialowiezazgorzeleckatowicepabianicejelenia-gorawolominkarpaczsieradznowarudaczeladzkonskowolaskierniewiceswinoujscieturystykabieszczadycieszynketrzynolsztynbialystokbabia-goraprochowicewarszawastalowa-wolapolkowicegorlicegliwiceponiatowalimanowalubartowaugustowkobierzyceopocznognieznoszczytnokolobrzegshoparenapodhalebielskoklodzkostargardatwithplayitownnamecoorgnetedugovacorgcomproestnetedugovbiznameislaprofinforechtngrokmedaaaacacpaenglawjurbarbarsykeeneticavocatacctcloudnsorgcomsecplonetedugov123paginaweborgcomnetintedugovnomepublidkinbarsygovx443cloudnsorgmilcomnetedugovcooporgmilcomschnetedugovnamecomcannetlibassoaemclantmcontstoreorgcomnomrecwwwbarsyfirminfoshopartsstackitmyddnswebspacelima-cityacincooxorgedugovbarsybrendlyhbvpsvpsspectrumlandinghostingacppmordoviamcprecbgorgmilcomspbnetintedumsknovgovbirrasmcdirmytismircloudvladimirnalchikadygeyamarinepyatigorskmyjinobashkiriaeurodirvladikavkazna4ugroznykustanaikalmykiacldmaildagestaniranbuildcloudcanvaliaravalwixdevelopmentappwritemigrationneedleverceldatabasestackitcodereplravendbonporterlovableaccoorgmilnetgovcoopmedorgcompubschnetedugovservicemecomygovorggovtvmedorgcomnetedugovinfoedgfacbmlonihkutwpsryxzbdtmacfhppmyspreadshopbrandpartiorgcomfhvpress123minsidaitcouldbeworlanbibkommunalforbundfhskiopsyskomvuxkomforbnaturbruksgymnloginlineorgcomnetedugovenscaledeuusentsurgebotdaorgmilcomnetgovnowteleporthashbangplatformlovablebarsyshopwarebasehoplixbarsyonlinemsf5gitpagewawamscofigma-govcaffeinefigmacanvasoltstscwputerbarsysupportchatgptsquareomniweopensocialcpanelplaycodenotionnovecorewpsquaredpreviewjelecyonbyensrhtfastvpspieboxconvexjouwwebheyflowplatformshloginlinemadethissourcecraftclouderaorgorgcomartedugouvunivmeorgcomnetedugovsurveysstatichfheiyuxs4allprojectmyfastubervibehostapp-ionosdeployagentmecoorgcomschnetedugovbizcncostoreorgmilcomneteduembaixadaconsuladokiraranohoprincipesaotomeheliohobarsystorebaseshopwaresellfyaiabkhaziavologdamordoviapenzalenugsochinavoiexnetspbmsknovnorth-kazakhstanashgabadkareliaarmeniageorgiavladimirnalchikivanovobukharaadygeyakhakassiakalugakrasnodarjambylaktyubinsktroitskbryanskobninskkurganazerbaijanpokrovskbashkiriatselinogradvladikavkazmurmansktulatuvamangyshlaktashkentchimkentgroznykaragandatermezarkhangelskkustanaikalmykiabalashoveast-kazakhstankaracoldagestantogliattibarsyredorgcomgobedumirenaccoorgjelasticdiscoursecleverappsschacmiincogoornetonlineshopcogoorgmilcomwebnicnetintedugovbiznametestcoorgmilcomnomnetedugovorangecloudpersoindorgcomfinnatnetgovensmincomtourismintlinfox0611oyaorgmilcomnetedugovquickconnectvpnplusnettprequalifymeaddrmyaddrntdllwadlnctvavdrk12orgmilpolbeltelcomwebgennetedutskkepgovbbsbiznameinfocoorgmilcompronetedugovbiznameinfobetter-thanworse-thansakurafromdyndnson-the-webmymailerorgmilurlcomneteduidvgovmydnsgameclubebizmeneacsccogotvorhotelmilmobiinfovodteiflgplkmsmsbcckhincndnvncoztltmkckppzpdprvcvkvlvcrkrkscxuzchernovtsyrivneyaltaodesavolynrovnolutskltdinforgcomnetedugovbizvinnicazhitomirternopilpoltavakropyvnytskyizaporizhzhiasevastopolsebastopoluzhgoroduzhhorodkharkovkharkivvinnytsiakhmelnytskyizaporizhzhecrimeaodessazhytomyrnikolaevcherkassydonetskluganskluhanskkirovogradivano-frankivskchernivtsikrymkievkyivlvivsumyzakarpattiamykolaivcherkasychernigovkhersonchernihivdnipropetrovskdnepropetrovskkhmelnitskiyneacsccogoorusorgmilcomedugovmyspreadshopadimono-ipbarsybarsyonlinelayershiftnh-servretrosnubapicampaignservicelugaffinitylotteryweeklylotteryraffleentrygluglugsmeaccoindependent-inquestnimsitecopropymntltdorgplcschnetgovnhsbarsyindependent-commissionindependent-reviewpolicepublic-inquiryindependent-panelconnhospindependent-inquiryroyal-commissionoraclegovcloudappscck12libaws-govccphxcclibpvtparochchtrcck12libcceatonk12coglibtecgendstmusann-arborwashtenawcck12glghcck12sealibforksolympiabainbridge-islkeyporthoquiamyarrow-pointcentraliaport-townsendsequimport-ludlowrentonsilverdalebremertonredmondsheltonbellevueport-orchardport-angeleskingstonchehalisaberdeengig-harborseattlepoulsboidmdndsddemenegacalamaiavawapailalflnmdcncscohnhmihiviwiriinmntnmocoutvtctmtgunjokakwvnvprarorasmskstxwynykyazisadninsnngosrvis-bymircloudservernamepointtoenscaledland-4-salefreeddnsstuff-4-saleazure-apinoipdatabricksappscloudnsgolffanheliohostazurewebsitesgvorgmilcomgubneteducoorgcomnetd0egvorgmilcomnetedugovmydnsiacostoree12orgmilcomnomwebgobbibrectecnetintedugovraremprendefirminfoartseducok12orgcomnethidnsidacaiiosonlahanamhanoicamauhueorgcompronetintedugovbizbacninhtayninhhoabinhnamdinhtravinhhaiphongvinhlonghaiduongquangnamquangtrithuathienhuequangninhbacgianghaugiangquangbinhsoctrangbentrethanhphohochiminhdanangkontumhatinhkhanhhoathanhhoahealthgialailaocaiyenbaibackanngheanlonganphuyenphuthocanthodaklakdongnainameinfovinhphucdongthapkiengiangtiengiangquangngailaichaulangsonlamdongdaknonghagiangangiangcaobangbinhduongninhthuanbinhthuanbaclieuthaibinhninhbinhbinhdinhtuyenquanghungyenbaria-vungtauthainguyendienbienbinhphuocschbizputerimagine-proxyorgcomnetedugovcloud66advisormypetsdyndnsxn--8dbq2axn--4dbgdty6cxn--5dbhl8dxn--hebda8bxn--80auxn--d1atxn--c1avgxn--o1acxn--o1achxn--90azhxn--55qx5dxn--uc0atvxn--od0algxn--wcvs22dxn--gmqw5axn--mxtq1mxn--12c1fe0brxn--h3cuzk1dixn--12co0c3b4evaxn--12cfi8ixb8lxn--o3cyx2axn--m3ch0j3axn--j1adpxn--90amcxn--90a1afxn--h1ahnxn--j1ael8bxn--h1alizxn--c1avgxn--j1aefxn--80aaa0cvacxn--41acaffeineexeopentunnelbotdashtelebitorgtmaccoagricorgmilnomwebnicngonetaltedugovlawnisschoolgrondaraccoorgmilcomschnetedugovbizinfoprg1-zeropstritonstackitlimazeropsaccoorgmilgovяспборгкоммскбизмирсамаракрымсочиакодпроргобрупрצהלממשלישובאקדמיהองค์กรธุรกิจรัฐบาลศึกษาทหารเน็ต教育網絡組織公司政府個人닷넷한국澳门新闻澳門联通家電嘉里招聘通販닷컴삼성コムგეбгрфеюadcdbdgdidmdsdtdaebedeeegeiejekemenepereseveyegabacalamanauavapaqasazacfbfafgfnfpfwftfbgcgagggegkgngmgsgpgvgtgugilmlnlalclglplsltlhmimjmkmmmomambmcmdmfmgmzmpmsmtmgbbblbsbecccacnclcmcvctcscmhkhghchbhthphshlinikifigiaibicivisikninhnmncnbngnsnpnvntnjoionomobocoaofodorosotoptstttytatbtetgtithtmtltrusuvuaucueuguhulumunufjdjbjtjsjlkmkhkfkdkcktkukskpkgpmpnpkpjpgqaqmqiqsvtvcvbvmvlvrwpwtwzwbwcwawgwkwmwtrsrprgrfrercrbrarnrmrlrkrirhrwsusrssspsgsesbsaslsmsissxmxaxcxuypysylymykygybycyuztzsznzmzkzdzczbzazελευ世界台灣购物公益点看臺灣网络書籍在线网站手机机构大拿游戏信息台湾谷歌慈善商标香港中国餐厅网址中國商城食品微博政务移动集团公司八卦商店健康网店政府时尚佛山中信娱乐广东企业homedepotengineeringاماراتrepublicankuokgroupversicherungchannelcitadelxn--pgbs0dhxn--b4w605ferdstatebankwebsitexn--mgb9awbf亚马逊淡马锡alibabaxn--ngbc5azdxn--mgbbh1axn--45br5cyltoshibabuildworldcloudtradeguideplacespacedancemoviephoneprimesmilebiblestyleappleazurestoreskypegripexn--l1accdrivelottehorsehouseleasechasereisestadahondaomegaaetnaamicaninjanokiamediadeltavodkaedekaosakapizzaslingemailgmailtirolshelltmallfinallegaltotalhotelamfamforumrehabmusicciticricohcoachwatchboschearthfaithirishmiamiarchidubaiguccipraxiみんなストアセールcanonsalononionnikonepsonkoelngreensevencrownikanoradioaudioweiboglobopromogalloyahoociscorodeovideomangobingotokyovolvolottokyotophotosmartsportquesttrusthyattjetztadultcymrubaidutushuxn--kprw13dubankclickblackmerckgroupsharpcheapnowtvxn--h2brj9cקוםհայоргсрбмонкомбелмкдқазрусукрمصرقطرعربكومdadcfdmedwedredphdthdbidpidkrdmsdltdiceonewmeglemoerwecfageacbanbambaaaammakianraspacpaaxawtfbcgaegongingaigvigorgdogdhlmilrilonlaolloluoljllcalgalnflafltelsrlfrllplkimibmcamcombommomifmabbjcbscbwebcabnabtabmlbpubabcbbcnecincpncllcstcwtcpwcnyckfhbzhovhmoiskiobisbitcifyituipinvinwinxincbnbcnmanfangdnmenrenkpnmtnyunrunfununobiojioriohbogmofooboooooacoecoceongoproartistottnttbbtcateatlatvetpetbetnethktmitfitintjothotgotdotbotprueduicujnjyouinknhktdkappsapgapmapdnptopgopllpjmpzipvipripesqtrvdtvitvdevmovgovhivnrwlawsewnewbmwwownowhowdvrftrmtrsfrbarcartvscrseusawsupsubssbsadsddsldssasbmsmlsxxxboxfoxgmxtjxsextaxbuyflydiysoyjoyskypaydaygayxyzanzbizwebersenerpokerlameractortatarsolarລາວคอมไทยtourslocusnexuslexusgiftsbeatsboatspartspressglassswissकॉमनेटtiresgivescodeshomesgamestunesshoescardswalesloansvegastoolsdealsautosparisファッションworkssucksrocksxeroxforexfedexpartylillymoneystudyrugbytoraytoday中文网xn--unup4y天主教飞利浦新加坡enterprises我爱你嘉里大酒店christmasxn--fct429kholdingsxn--8y0a063axn--mgbx4cd0ablifestyleabogadoallstatenetbankكاثوليكxn--s9brj9cxn--gk3at1ebestbuycharityxn--55qx5dmicrosoftpropertybasketballhomegoodscorsicajewelrygallerygrocerysurgerycountrybrusselsverisignferreroxn--czr694bhdfcbankcommbanksoftbankپاكستانپاکستانnextdirectالسعوديهالعليانxn--h2brj9c8cxn--80adxhksshikshaxn--mgbai9azgqp6jcuisinellabarclayscatholicxn--kpry57dcompanyxn--xhq521bblackfridayxn--mgba3a3ejtsandvikxn--d1acj3bacademydownloadمليسياxn--j1amhxn--w4r85el8fhu5dnraipirangaathletaxn--fhbeixn--mgbqly7cvafrzuerichxn--c2br7gஇலங்கைcontractorsxn--io0a7igraphicsinsurancetemasekxn--xkc2al3hye2amotorcyclesphotographydirectoryplumbingxn--vhquvclothingtrainingcleaningwilliamhilllightingxn--mgba3a4f16ashoppingcateringeducationokinawapicturesventuresproductionsxn--9et52uwalmartഭാരതംsupportrealestatecapitalonexn--nqv7fs00emaauspostfloristdentistxn--qxamgodaddybradescobargainsmitsubishikerryhotelsxn--9dbq2axn--3pxu8kimmobilienxn--fjq720axn--mgbtx2bholidaymckinseymadridbusinessbuildershelsinkixn--4gbrimмоскваالسعودیةcoffeedegreelacaixapartnersalsaceofficeabbvievoyageorangegeorgeonlinechromemobilekindlegoogleoraclecircleschulesecureinsurexn--mgba7c0bbn0aestatexn--mgbc0a9azcgcruisehangoutxn--vuq861bxn--42c2d9arexrothfirestoneuniversityxn--nnx388alifeinsuranceextraspaceонлайнvermögensberatersoftwarexn--fiqs8sxn--mgbab2bdxn--w4rs40ltiendaभारतम्africatoyotaotsukasakuracameracreditcardnagoyaconsultingnetworktheatermonsterprogressivepioneerxn--55qw42gracingdatingvotingvikinglivinggivingxn--bck1b9a5dre4cbrotherweatherjoburgفلسطينlplfinancialxn--clchc0ea0b2g2a9gcdfutbolschoolsocialglobaldentalwoodsidechanelairtelmatteltravelrealtorwebcamstreamభారత్unicomalstomxn--nodexn--6frz82gmuseumfurniturexn--rvc1e0am3exn--mix891faccenturexn--11b4c3dismailineustardiscountquebeccomsecclinicservicesxn--y9a3aqxn--c1avgswatchchurchsearchالاردنmarketingcontacthealthmonashshoujisanofitaipeiamericanexpresssuzukiアマゾンクラウドポイントbhartiグーグルxn--mgberp4a5d4armemorialxn--1qqw23alondonmormoninstitutevisionbostonnortoncouponmaisonamazonvirginberlindesigndurbanolayannissananquanxihuanhitachikaufengardenreisenbayerntechnologydatsunxn--90a3aclatinocasinostudiophysioxn--ngbe9e0apharmacytattootaobaoaramcoexpertreportabbottdirectselectimamatfairwindspictettargetmarketintuittravelersinsurancecreditdupontryukyusuppliesxn--tckwebnpparibasschmidtmerckmsdyodobashirestaurantbridgestonecricketxn--fpcrj9c3dbostikbroadwayattorneylefrakemerckxn--fiq228c5hscareersfarmerswinnersflowersxn--wgbh1cguitarsxn--54b7fta0ccxn--p1acfmakeupgalluplandroverxn--kcrx77d1x4agoldpointbauhausxn--mgbayh7gpahiphopplaystationxn--mgba3a4fraxn--eckvdtc9dhyundaixn--gckr3f0fistanbulticketsmarketsflightschintaireviewsxn--3e0b707ewindowsxn--fiqz9sfinancialxn--fzys8d69uvgmابوظبيdiscoverreviewবাংলাxn--5su34j936bgsgmoscowobserverapartmentsдетиارامكوсайтeurovisionxn--i1b6b1a6a2exn--xkc2dl3a5ee0hتونسموقعبارتڀارتشبكةعمانبيتكعراقreadkredbondlandbandfundfoodprodgoldfordtubecafesafelifeggeeieeefreefagepagegugezonewinememenamegamesaleablebikenikelikecarecbreherefiresaveloveliveblueartedatesitevotecaseluxebofamodaltdaasdatiaayogasinavanashiaasiajavabbvatevavivadatazaraarpacasavisasncfprofmaifsurfgolfdvagsongbingpingwangkpmggoogblogpohlfailcooldellcalldeallidlsarlfilmteamroomfarmimdbarabclubhdfcicbchsbcgmbhrichtechfishdishcashminiernikddiaudiwikimobitaxicitikiwidesiqponskinloanakdnwienopenporncerntownimmolimoolloinfonicofidolegosaxozeroaerovivoautovotomotofastbestresthostpostnextlgbtchatseatgiftmeetdietreitmintrentgentspotscotguruitausohumenucyoubanklinkpinkdclktalksilkbookseekworkrsvpaarpjeepshopcoophelpcamppccwshowbeerstarruhrflirweirhaircarsparsjprshausplusnewstipstoysjobskidsfanspicsdocsxboxamexsexynavycitysonyarmyallybabyplaydeliverybuzzgbizlamborghiniphilipsලංකාಭಾರತfitnessexpresslanxesspfizercenterwalterlawyersoccercareerkosherbrokerlockerdealerdoctorauthorxn--mgbqly7c0a67fbcvermögensberatungjaguarxn--pssy2uxn--hxt814eflickrrepairrogersairbusxn--mgbai9a5eva00beventsyachtsxn--t60b56aভাৰতভারতभारतभारोतviajeshermeshughesxn--j1aefसंगठनvillasଭାରତclaimshotelsભારતzapposphotosjuegoscondostatamotorsgratistennisਭਾਰਤtkmaxxtjmaxxschaeffleryandexxn--80aswgrealtysafetybeautyluxuryxn--3ds443gsupplyfamilyxn--o3cw4hhockeysydneyxn--90aenissayalipayenergycomputeragencyxn--rovu88b電訊盈科xn--gecrj9cstatefarmaccountantaquarelleolayangroup香格里拉xn--p1ai组织机构xn--1ck2e1bxn--mgbt3dhdschwarzموريتانياabudhabinowruzkomatsufujitsuhospitalxn--80asehdbxn--mgbtf8flxn--j6w193gxn--yfro4i67oprudentialxn--flw351ecruisescoursesrecipesxn--e1a4cferrarixn--ses554gxn--wgbl6awatchesstaplessinglesxn--mgbcpq6gpa1axn--otu796dpropertiescreditunionxn--mgbah1a3hjkrdstockholmhisamitsuالسعوديةstcgroupdomainsoriginscouponsbloombergclubmedfroganslimitedxn--80aqecdr1aexposedinternationalequipmentbarclaycardxn--q7ce6axn--mgbi4ecexpprotectionassociatesconstructionxn--cck2b3bxn--45q11candroidfoundationישראלxn--mgbca7dzdocliniqueboutiqueengineerxn--qxa6asystemsfirmdalefashionauctionxn--nqv7finfinitirentalsreliancetradingweddingfishinghostinggentingbookingcookingxn--3hcrj9cgraingerxn--czrs0tdemocratsamsungyokohamaxn--h2breg3evexn--nyqy26alundbeckmelbournevacationssolutionsfrontierxn--vermgensberatung-pwbmanagementxn--cg4bkixn--mgb2ddeslincolnhamburgsandvikcoromantblockbusterairforcebarefootxn--4dbrk0ceinvestmentsfeedbackcommunityxn--ngbrxالبحرينdiamondsamsterdamhealthcareredumbrellaxn--mxtq1mxn--2scrj9cagakhanxn--mgbpl2fhкатоликcaravanசிங்கப்பூர்richardlimortgageamericanfamilyxn--fzc2c9e2cscholarshipssaarlandxn--imr513nvlaanderensamsclubgoodyearkitchenஇந்தியாweatherchannelallfinanzxn--kput3iالسعودیۃxn--90aisxn--efvy88hالجزائرxn--mgbaam7a8hexchangejpmorganxn--tiq49xqyjfidelitysecurityxn--mk1bu44cwanggouxn--fiq64bxn--6qq986b3xlxn--mgbbh1a71exn--80ao21amarshallsxn--5tzm5gtravelerspanasoniclatrobeyoutubeaccountantsxn--rhqv96gxn--cckwcxetdanalyticsxn--ygbi2ammxبازاربھارتسوريةorganicfreseniusسورياxn--9krt00axn--qcka1pmcxn--jlq480n2rgdeloittesciencefinancexn--jvr189mxn--30rr7yhomesensehotmailbaseballfootballleclercboehringerxn--q9jyb4cxn--mix082fاليمنهمراهpolitieسودانايرانایرانnetflixyamaxunxn--lgbbat1ad8jcollegestoragecapetowncolognekerrypropertiesxn--mgbgu82axn--ogbpf8flxn--czru2dwhoswhociprianilasallexn--g2xx48cforsalebanamexaudiblexn--vermgensberater-ctbxn--zfr164bericssonvanguardxn--45brj9cindustriestheatremarriottxn--3bst00mcomparexn--mgberp4a5d4a87gcapitaldigitalالمغربbarcelonashangrilaxn--d1alfcalvinkleinwwwcitysapporokawasakinagoyasendaikobekitakyushuyokohamackjp";
//#endregion
//#region node_modules/tldts/dist/es6/src/suffix-trie.js
var numberOfNodes = nodeFlags.length;
var numberOfEdges = edgeLength.length;
var edgeOffset = new Uint32Array(numberOfEdges);
var edgeHash = new Uint32Array(numberOfEdges);
var wildcardEdge = new Int32Array(numberOfNodes).fill(-1);
for (let node = 0, offset = 0; node < numberOfNodes; node += 1) for (let edge = edgeStart[node]; edge < edgeStart[node + 1]; edge += 1) {
	edgeOffset[edge] = offset;
	const end = offset + edgeLength[edge];
	let hash = 5381;
	for (let i = end - 1; i >= offset; i -= 1) hash = hash * 33 ^ labelText.charCodeAt(i);
	edgeHash[edge] = hash >>> 0;
	if (edgeLength[edge] === 1 && "orgmilcomschnetedugovdrrformsfeedbackofficialaccoorgmilschnetgovmagazinemediaunioncargopilotgroupcaarespressworksaerodromeworkinggroupair-traffic-controlaircraftaccident-preventioneducatormarketplaceambulanceinsurancecateringairportrepbodyenginesoftwaremodellingair-surveillanceconsultingchartertrainermaintenanceservicesdesignflightskydivingfreightassociationstudentgroundhandlingdgcafuelclubtaxicrewshowballooningexpresstraderbrokerauthoragentsairtrafficjournalistsafetyconsultantmicrolightaccident-investigationparachutingequipmentproductionfederationrecreationscientistnavigationengineertradingglidingleasingresearchpassenger-associationentertainmentparaglidinghangglidingaerobaticrotorcraftemergencycertificationgovernmentaeroclubexchangelogisticschampionshiphomebuiltcouncilconferencecontrolairlinecivilaviationjournalorgcomnetedugovcoorgcomnomnetobjofforgcomnetuwukiloappsframerorgmilcomnetedugovcoradioorgcomnetcommuneedogpbcoitgvorgedugov*spreviewfrontendrelayononstagingupid*mtls*privatelinktypedreamdeveloperbravemochawindsurfaivenmirenupsunwnextbegetngrokclerkwale2bwebcsbrunputerflutterflowspawnbaseshiptodaymagicpatternsnetlifyondigitaloceanrailwayhostedclaudehasurabotdashretoolvercelgithubluyanigadgetreplitcloudflaretelebitedgecomputeevervaultexponyatnoopencrpplxzeaburwasmerframerzeropsrocketpreviewconvexmedusajsspritesonherculeseasypanelstreamlitglideossnowflakemesserliloginlinehackclubcodepennorthflankbase44corespeedleapcellngrok-freeclerkstagelovableon-fleek*us-west-3ap-south-2us-central-2us-central-1eu-central-1ap-south-1us-west-2us-east-2eu-north-1ap-north-1us-west-1us-east-1*rcloudintsegorgmilcomgobbetnetintedugovturmusicasenasamutualcoopip6uriurnin-addre164homeirisgovdixdaemoncloudnssthwien*inexexkunden4accogvormymyspreadshop4lima2ixortsinfofuturecmsfuturehosting12hpprivfuturemailinglima-cityfunkfeuer123webseitednshomemelmyspreadshopcloudletswasantqldvicactnswtascatholicwasaqldvictasidwasantozqldorgcomvicasnactnetedugovnswtasconfcomairflowlambda-urltransfer-webapptransfer-webappairflowtransfer-webapptransfer-webapp-fipstransfer-webappeu-west-3ap-south-2eu-south-2eu-central-2ap-southeast-3ap-southeast-4ap-northeast-3eu-central-1mx-central-1me-central-1ca-central-1il-central-1ap-northeast-1ap-southeast-1me-south-1af-south-1eu-south-1ap-south-1ap-southeast-7us-west-2eu-west-2ap-east-2us-east-2eu-north-1ap-southeast-2ap-northeast-2ap-southeast-5us-gov-west-1us-gov-east-1ap-southeast-6ca-west-1us-west-1eu-west-1us-east-1ap-east-1sa-east-1privatenotebookstudiolabelingnotebookstudionotebooknotebook-fipslabelingnotebookstudionotebook-fipsnotebookstudio-fipsnotebook-fipsnotebookstudionotebook-fipsnotebookstudioeu-west-3ap-south-2eu-south-2eu-central-2ap-southeast-3ap-southeast-4ap-northeast-3eu-central-1me-central-1ca-central-1il-central-1ap-northeast-1ap-southeast-1me-south-1af-south-1eu-south-1ap-south-1us-west-2eu-west-2us-east-2eu-north-1ap-southeast-2ap-northeast-2experimentsus-gov-west-1us-gov-east-1ca-west-1us-west-1eu-west-1us-east-1ap-east-1sa-east-1onrepostsagemakercopporgmilcompronetintedugovbiznameinfoshoprsorgmilcomnetedugovbrendlyresolvenzauscotvstoreorgcomnetedugovbizinfoidacaicoittvorgmilcomschnetedugovinfocloudezproxysiteacmymyspreadshopkuleuvenwebhostingtransurl123websitecloudnsinterhostsolutionsddns5476103298edgfacbmlonihkjutwvqpsryxzbarsycoororgcomedumyftpno-iporxcloud-ipfor-somemmafanfor-morewebhopselfipjozidyndnscloudnsdscloudfor-thefor-betteractivetrailcoeconorestooteorgcomeconeteduassurmoneyafricaarchitectesrestaurantloisirstourismavocatsinfoagrounivcoorgcomnetedugoviatvdeportesaludtksatorgmilcomwebgobnetinteducienciaboliviarevistacooperativaempresanombreindustriamusicapatriamedicinademocraciapoliticapuebloindigenaplurinacionalarteblogwikiinfoagrotransportenoticiasprofesionalacademiaeconomiaecologiamovimientotecnologianaturalsimplesitecepesebamapadfmgalampbacscpirngorotomtrjspaprrprrsesmscepesebamapadfmgalampbacscpirngorotomtrjspaprrprrsesms*biaamfmtcmptvfeirasampajampanatalbelemananiradiog12medindfndbmdtrdthepoaggfjdfdefinfenflegsegongengcngorgzlgslglogppgmillelqslcimcomnomadmjabimbbibbsbabcrectecsjcetcpscpvhudieticriapipsiecnbiorioecogeoteoodoproatoartfstmatvetdetbetnetcntnotfotgrueduajuespappreptmpemparqsrvadvdevgovntrturagrjorfarjusmusdesvixxyzcozfozslzbhzmaringasantamariacampinagrandegoianiasorocabafloripasaobernardocuritibaboavistarecifeaparecidasaogoncasalvadorcuiabamorenamacapalondrinacontagemsocialfortalmaceioleilaoosascoriobranconiteroi9guacutcheblogflogvlogwikitaxicoopmanauspalmascaxiasjoinvillebaruericampinassantoandreribeiraoriopretoweorgcomnetedugovv0windsurfshiptodaycloudsitecoaccoorgnetgovofmilcomgovmediatechzacoorgcomnetedugsjgovmydnspenfnlabnbmbgcbcqconcontnuyksknsmyspreadshopno-ipawdevboxbarsyonidatemfuinabusavinstanceseceuguukussryzespawncsxcloud-ipmyphotosfantasyleaguetwmailcleverappsscrappingccwucloudnsftpaccessgame-serverccgovobjectsrmalpgcust*svcalp1aeappenginermalpgmyspreadshop4lima2ixsquare7cloudscale123websitefirenet12hpflowgotdnslinkyard-cloudcloudnslima-citydnskingobjectstorageedaccogoorusorgcomnetinteduaéroportxn--aroport-byaassogouvcomilgobgovcloudnses-1eu-west-1us-east-1euvipit1eurarubait1s3lbwebsites3websiteru-spbru-mskelasticcsrunstnukukcaukusnl-ams-1fr-par-1fr-par-2functionsnodess3ddlwhmrdbfnck8sifrs3-websitecockpitscblmgdbdtwhkafkpubprivs3ddlwhmrdbk8sifrs3-websitecockpitscblmgdbdtwhkafks3ddlrdbk8sifrs3-websitecockpitscblmgdbdtwhkafkk8sscalebookpl-wawfr-parnl-amsbaremetalsmartlabelinginstancesdechk2kuleuvenlaravelvoorloperurownoxazapscwhstgrvaporonline-serverobservablehqelementorantagonistreclaimjoteluluencowaydiademjelasticmatlabmagentositetrendhostingaxarnetjenv-arubajelejoteravendbemergenttrafficplexconvexkeliwebserveboltbegetcdnstaticson-rancherprimetelonstackitunison-servicesdnshomelinkyardbarsyjelecloudnscocomnetgovmycn-northwest-1cn-north-1s3s3-accesspoints3-websites3s3-accesspointrdsdualstacks3-deprecatedemrappui-prods3-websiteemrstudio-prods3-object-lambdaemrnotebooks-prodexecute-apis3s3-accesspoints3s3-accesspointrdsdualstackemrappui-prods3-websiteemrstudio-prods3-object-lambdaemrnotebooks-prodexecute-apicn-northwest-1cn-north-1cn-northwest-1ebcomputeelbcn-north-1airflowcn-northwest-1cn-north-1oncn-northwest-1cn-north-1amazonawssagemakeramazonwebservicesdirectasgdsdhehahljlnmhbacscahqhshhihnlnynsnmofjbjzjxjtjhkcqtwgsjssxnxjxgxxzgz網絡网络公司orgmilcomnetedugovxn--55qx5dcanva-appsxn--io0a7iquickconnectcanvasitekhsjxn--od0algcanva-codemyqnapcloudsrvrlessclustersrealtimestorageleadpagescarrdcrdorgmilcomnomnetedugovhidnssupabaserdpareplmypiumsoxmitotaplpagesfirewalledreplitowodevwebview-assetsvfswebview-assetss3s3-accesspointdualstackemrappui-prods3-websiteaws-cloud9emrstudio-prods3-object-lambdaemrnotebooks-prodexecute-apicloud9eu-west-3ap-south-2eu-south-2eu-central-2ap-southeast-3ap-southeast-4ap-northeast-3eu-central-1me-central-1ca-central-1il-central-1ap-northeast-1ap-southeast-1me-south-1af-south-1eu-south-1ap-south-1ap-southeast-7us-west-2eu-west-2us-east-2eu-north-1ap-southeast-2ap-northeast-2ap-southeast-5ca-west-1us-west-1eu-west-1us-east-1ap-east-1sa-east-1s3s3-accesspointdualstackemrappui-prods3-websiteaws-cloud9emrstudio-prods3-object-lambdaemrnotebooks-prodexecute-apicloud9consent-portals3s3-accesspointdualstackanalytics-gatewayemrappui-prods3-websiteaws-cloud9emrstudio-prodbedrock-agentcores3-object-lambdaemrnotebooks-prodexecute-apicloud9s3s3-accesspointdualstackemrappui-prods3-websiteemrstudio-prodbedrock-agentcores3-object-lambdaemrnotebooks-prodexecute-apis3s3-accesspointdualstackemrappui-prods3-websiteemrstudio-prods3-object-lambdaemrnotebooks-prodexecute-apis3s3-accesspointdualstacks3-deprecateds3-websitebedrock-agentcores3-object-lambdaexecute-apibedrock-agentcores3s3-accesspoints3-websites3-accesspoint-fipss3-fipss3s3-accesspointdualstackemrappui-prods3-websites3-accesspoint-fipsaws-cloud9s3-fipsemrstudio-prodbedrock-agentcores3-object-lambdaemrnotebooks-prodexecute-apicloud9s3s3-accesspointdualstackemrappui-prods3-websites3-accesspoint-fipss3-fipsemrstudio-prods3-object-lambdaemrnotebooks-prodexecute-apis3s3-accesspointdualstackemrappui-prods3-websiteaws-cloud9emrstudio-prodbedrock-agentcores3-object-lambdaemrnotebooks-prodexecute-apicloud9s3s3-accesspointdualstackemrappui-prods3-websiteaws-cloud9emrstudio-prodbedrock-agentcores3-object-lambdaemrnotebooks-prodexecute-apicloud9s3s3-accesspointdualstacks3-deprecatedanalytics-gatewayemrappui-prods3-websiteaws-cloud9emrstudio-prodbedrock-agentcores3-object-lambdaemrnotebooks-prodexecute-apicloud9vfss3s3-accesspointdualstackemrappui-prods3-websiteaws-cloud9emrstudio-prods3-object-lambdaemrnotebooks-prodexecute-apicloud9eu-west-3ap-south-2eu-central-2ap-southeast-3ap-southeast-4ap-northeast-3eu-central-1mx-central-1me-central-1ca-central-1il-central-1ap-northeast-1us-northeast-1ap-southeast-1me-south-1af-south-1ap-south-1ap-southeast-7us-west-2eu-west-2ap-east-2us-east-2ap-southeast-2ap-northeast-2ap-southeast-5us-gov-west-1us-gov-east-1ap-southeast-6ca-west-1us-west-1eu-west-1us-east-1ap-east-1sa-east-1mrapaccesspoints3s3-accesspointdualstacks3-deprecatedanalytics-gatewayemrappui-prods3-websites3-accesspoint-fipsaws-cloud9s3-fipsemrstudio-prodbedrock-agentcores3-object-lambdaemrnotebooks-prodexecute-apicloud9s3s3-accesspointdualstacks3-deprecatedanalytics-gatewayemrappui-prods3-websites3-accesspoint-fipsaws-cloud9s3-fipsemrstudio-prodbedrock-agentcores3-object-lambdaemrnotebooks-prodexecute-apicloud9s3s3-accesspointdualstackemrappui-prods3-websites3-accesspoint-fipss3-fipsemrstudio-prodbedrock-agentcores3-object-lambdaemrnotebooks-prodexecute-apis3eu-west-3ap-south-2eu-south-2computes3-ap-northeast-2elbrdss3-ap-east-1s3-sa-east-1s3-us-gov-west-1s3-eu-central-1s3-ca-central-1eu-central-2ap-southeast-3ap-southeast-4ap-northeast-3s3-website-us-west-2s3-website-eu-west-1s3-external-1eu-central-1me-central-1ca-central-1il-central-1s3-us-west-1s3-eu-west-1s3-website-sa-east-1s3-website-ap-southeast-2ap-northeast-1ap-southeast-1s3-us-west-2s3-eu-west-2me-south-1af-south-1eu-south-1ap-south-1ap-southeast-7us-west-2eu-west-2us-east-2s3-website-ap-southeast-1s3-1s3-globals3-ap-northeast-3eu-north-1airflowap-southeast-2s3-us-gov-east-1s3-fips-us-gov-east-1s3-me-south-1s3-ap-south-1ap-northeast-2s3-website-us-west-1ap-southeast-5s3-eu-north-1s3-ap-southeast-1s3-website-us-gov-west-1compute-1s3-eu-west-3us-gov-west-1s3-website-ap-northeast-1us-gov-east-1s3-fips-us-gov-west-1s3-website-us-east-1s3-ap-southeast-2ca-west-1us-west-1eu-west-1us-east-1ap-east-1sa-east-1s3-us-east-2s3-ap-northeast-1authauthauth-fipsauth-fipseu-west-3ap-south-2eu-south-2eu-central-2ap-southeast-3ap-southeast-4ap-northeast-3eu-central-1mx-central-1me-central-1ca-central-1il-central-1ap-northeast-1ap-southeast-1me-south-1af-south-1eu-south-1ap-south-1ap-southeast-7us-west-2eu-west-2ap-east-2us-east-2eu-north-1ap-southeast-2ap-northeast-2ap-southeast-5us-gov-west-1us-gov-east-1ap-southeast-6ca-west-1us-west-1eu-west-1us-east-1ap-east-1sa-east-1eu-west-3eu-south-2ap-southeast-3eu-central-1ca-central-1ap-northeast-1ap-southeast-1ap-south-1us-west-2eu-west-2us-east-2eu-north-1ap-southeast-2ap-northeast-2ap-southeast-5eu-west-1us-east-1ap-east-1sa-east-1csrframeservicesbuilderstg-builderdev-builder*ociocpocsazuregcpawsdemoinstanceeu-west-3ap-south-2eu-south-2eu-central-2ap-southeast-3ap-southeast-4ap-northeast-3eu-central-1me-central-1ca-central-1il-central-1ap-northeast-1ap-southeast-1me-south-1af-south-1eu-south-1ap-south-1ap-southeast-7us-west-2eu-west-2us-east-2eu-north-1ap-southeast-2ap-northeast-2ap-southeast-5us-gov-west-1us-gov-east-1ap-southeast-6ca-west-1us-west-1eu-west-1us-east-1ap-east-1sa-east-1previeweu-4us-4us-1eu-1us-2eu-2us-3eu-3appss3-websitekrkrobjectprivateobjectkrkrskrkrsobjectkrprivateobjectkr-privatecomputepaasrag-cloudrag-cloud-chjcloudjcloud-ver-jpcdemonodebalancermembersipeuxvsoncillaocelotonzayalilynxsphinxfentigercustomercaracalsgkrobjectstoragedesgkrusobjectkrkr-naverkr-naver-devkrprivatewebsiteobjectkr-naverkr-privatekr-naver-devjpjpkrjp4jp5s3-website-jpjpkrjp4jp5objectprivateobjecto365cloudstaticxendevapp001testcode-builder-stgplatformmediasiteprojedrydpagesjsx0desazacncoitrueu4uhkukgrbrushatenadiarymyspreadshopfrom-flfrom-wvwebspace-hosttheworkpchatenablogcursorusercontentservesarcasmapplinzisakuratanwixsitefin-ncloudstoragegov-ncloudstorageappchizigiizeis-into-carsdnsiskinkyadobeaemcloudis-a-therapistpgfogmyvncdojinis-an-actress1kappfldrvkozowqa2jpnmexprgmrfirewall-gatewaydynnscafjsfbsbxooguyfrom-gawoltlab-demois-a-anarchistwiardwebteaches-yogadattowebtb-hostinglive-websiteservegamegotpantheonfrom-nhsubsc-payfrom-ohvipsinaappfrom-cadyndns-officehomelinuxfrom-mahercules-appservebbsstreakusercontentfrom-okfrom-wyfastly-terrariumis-a-llamaqualyhqportalserveexchangeon-vaporvivenushopciscofreakgrayjayleaguesmetaaiusercontentfrom-iais-a-libertariansaves-the-whalestaveusercontentyolasiteoperaunitepoint2thisis-a-catererclaudeusercontentlinodeusercontentfrom-vagithubusercontentsells-for-lesshosteurcanva-appsplaystation-cloudddnsfreefrom-pafrom-prfrom-waddnskingoutsystemscloudhotelwithflightmydattois-a-nascarfanmydbserverminiserverdamnserverservehumouris-a-playerfrom-nvfrom-nmemergentagentgentappsamplifyappfrom-kyis-an-accountantnfshostserveircfrom-akpythonanywherestackhero-networkpostman-echolikescandydyndns-mailobservableusercontentserveftpfreeboxosfrom-utcdn77-storageamazonawsneat-urlnclouddyndns-serverlinodeis-a-teacherfrom-vtgleezemythic-beastsus1-pleniteu1-plenitla1-plenitpaywhirlservecounterstrikejdevcloudhealth-carereformis-into-animegoogleapisis-a-painterafricaisa-hockeynutatmetais-an-actora2hostedis-a-democratdatadetectest-le-patrondigitaloceanspacesis-a-designeris-a-hunterlinodeobjectstemp-dnsissmarterthanyoufrom-arsimplesiteevennodetownnews-stagingis-a-liberalgooglecodejelasticservemp3qualyhqpartnerdyndns-free1cooldnsest-a-la-masiondrayddnsdynuddnsfrom-orfrom-miis-a-bloggerfrom-himydobisscanvacodeis-an-engineerest-a-la-maisonupsunappdevinappswafflecellmyasustorwpenginepoweredfrom-ctservep2psame-appmyshopblocksthingdustdatalikes-piediscordsezis-with-thebandlpusercontentis-leetshopitsite3utilitiesis-a-personaltrainersinaappladeskis-a-cheflogoipselfipbase44-sandboxnospamproxyalibabacloudcsmesswithdnsauthgearappsiamallamawithgooglelutrausercontentmochausercontentframercanvasmytabitdyndns-homew-credentialless-staticblitzcpserverdiscordsaysis-a-nurseappspotatlassian-isolated-3premotewdfrom-mtwixstudiocode0emm180rmyactivedirectoryawsappsmytuleapdnsabrpolyspaceqbuserrenderbuiltwithdarkboutirgotdnsabrdnsdopaascanva-hosted-embedawsglobalacceleratorhomesecuritypcmyiphostditchyouripclever-clouddyndns-ipon-aptibleis-a-musicianhosted-by-filessecuritytacticsappspaceusercontenthomeunixstrapiappsame-previewcf-ipfsmycloudnaselasticbeanstalkis-certifieddontexistkasserverik-serverdrive-platformatlassian-3pfirebaseappncpstorageherokuappawsapprunnerbarsycenteris-a-cubicle-slaveservehttpmyshopifyis-a-guruquicksytessiiitesorsitesmagicpatternsappis-a-cpameteorappfrom-wiis-a-rockstarbumbleshrimpdattolocaldatabricksappsreadthedocs-hostedfrom-rifamilydsdyndns-picsplesknsbplaceddnsaliasdynaliasdyndns-remotedoomdnsip-ddnsblogdnsis-a-doctorroutingthecloudamazoncognitobarsyonlinedsmynasddnsgurucloudflare-ipfsdeus-canvasfrom-idsmushcdnpagespeedmobilizerdyndns-at-homeunusualpersonhosted-by-previderis-a-republicandyn-o-saurstreamlitappworkisboringonthewificprapidqualifioappis-uberleetis-slickgetmyipwpdevcloudtypeformdyndns-at-workgentlentapismynascloudw-corp-staticblitzfrom-ingeekgalaxyservebeerfrom-mdonrenderspace-to-rentaivencloudappspacehostedwafaicloudcodespotblogspotatlassian-3p-us-gov-modfrom-ndfrom-msis-a-techieis-a-studentcustomer-ociis-a-photographerdurumisfrom-ksmassivegriddyndns-wikiis-an-entertaineris-a-hard-workermysecuritycamerafrom-mnrackmazedyndns-blogis-a-bulls-fanwritesthisblogfreemyipsimple-urlfrom-sdreservdauthgear-stagingest-mon-blogueuris-into-gamesrice-labsxtooldevicesakurawebis-an-anarchistoraclecloudappsdyndns-worksells-for-urhcloudfrom-dcfastvps-serverwpmucdnis-a-geekscrysecfrom-txis-into-cartoonsmodelscapetrycloudflarelocaltonetstreak-linkbalena-devicesfrom-njforgeblocksfreebox-oswebadorsitefrom-ncdoesntexisthobby-sitestreaklinkshomesecuritymacownprovidertuleap-partnersdattorelaywphostedmailservequakeis-a-socialistservehalflifepivohostingdynuhostingquipelementsw-staticblitzdyndns-webfrom-deproject-studyaliases121is-not-certifiedhercules-devis-a-financialadvisoramazonlightsailservepicsis-a-greenloseyouripfrom-ilwithyoutubemwcloudnonprodwiredbladehostingdnsdojofrom-tnpixolinomyqnapcloudncloudstorageis-an-artisthostedpiis-a-landscaperauiusercontentoaiusercontenton-forgeis-a-conservativedreamhostersnet-freaksapps-1and1is-goneencoreapifastly-edgefrom-nesalesforcefrom-scdeployagentoraclegovcloudappsfrom-alis-a-lawyercechirevultrobjectsstufftoreadisa-geekddnsgeeklovableprojecttry-snowplowfrom-moblogsyteis-a-bookkeepernogmyforumravendbmyboxdeelementoredsaacficogoorinforgcomgobnatneteduidstoreorgcomnetintedudevnomepublorgcomneteduathgovtestscalculatorspaynowinfoquizzesresearchedcloudnsfunnelsassessmentsjscaleforcetmacltdorgmilcompronetgovbizpresseklogesrsccloudcustomfltusrcloude4corealmgovmunicontentproxy9metacentrumdyndyndyndnsdynpagespages-researchitionoccustomercomymyspreadshopipv64diskussionsbereich4limacomrub2ixfirewall-gatewayddnssspdnsbarsykeymachinesquare7myhome-serverspeedpartnercommunity-proschuldockxenonconnectgünstigliefernbwcloud-os-instancedyndnssecmy-routerxn--gnstigliefern-wobin-butterl-o-g-i-nisteingeekin-dslin-berlinin-brbfuettertdasnetzleitungsenin-vpnlcube-serverdyn-ip24logoipdyn-berlinruhr-uni-bochum12hpgoipsrvdnsfruskygit-repossvn-reposinternet-dnsgünstigbestellenhome-webserverxn--gnstigbestellen-zvbbplacedheimdnscosidnswebspaceconfiglima-citydyndns1istmeinvirtualuserschulplattformmy-gatewayddnsseclebtimnetztest-iservmein-iservvirtual-userhome64iservschuletaifun-dnstraeumtgeradeschulserverdynamisches-dns123webseitednshomehs-heilbronndnsupdaterbssgraphicdwadpdwdaepeweaawapaafpfwfabwbpbacwcpcciwebuserapiobjects*teamst3r2lpbravepanelngrokiservstglclcrmerpflypagesbarsyvivenushoplocalcertlocalplayerbearbloggatewaydeno-stagingis-not-ais-a-goodbotdashvercelmocha-sandboxplatter-appreplitgithubpreviewworkersinbrowserevervaultis-ahrsndenoxmitmodxmyaddrstorageapipayloadgrebedocruncontainersstgstagelclstageloginlineis-a-fullstackcodepenleapcellngrok-freeis-coolstoragewebharemediatechlibp2pdiscourseimaginecomyspreadshopstoreregbiz123hjemmesidefirmcoorgcomnetedugovsldorgmilcomwebgobartnetedugovtmorgpolcomsocartnetedugovassoagrondiscoodontk12medcuegyecpaabgengorgmilgalsaltulcomadmesmgobpubdocmonfindgnriouioproartlatvetnetfotedulojgovntrturibrbarxxxofficialbasechefprofmktgpsictechinfoarqtcontdentrrpppsiqgit-pagesritmedfieorgcomlibprieduaipgovriikmeactvsportorgmilcomscieunnetedugovnameinfopintouchtawktotawkmyspreadshoporgcomnomgobedu123miwebcomputeorgcomnetedugovbiznameinfocognito-idptransfer-webappeusc-de-east-1onjelasticnxaspdnsbarsydirectwpdeuxfleurstransurldogadoprvwcloudnsamazonwebservicesdnshomeuserpartycokoobinmkmfidymyspreadshopalandkapsiikixn--hkkinen-5wacloudplatformhäkkinen123kotisivuidacorgmilcompronetedugovbiznameinforadioorgcomneteduuserexperts-comptablestmmyspreadshopgretaprdcomnomynhccifbxoshuissier-justicenotairesaeroportfreeboxoson-webavocatassoportgouvkdnschirurgiens-dentistes-en-franceavouesfbx-os123sitewebveterinairechirurgiens-dentistespharmacienchambagrimedecinfreebox-osdediboxgoupilemszicpyicpvicppleysheezypagesedugovcnpyorgcomcybllcpvtnetedugovtnxonlineschooldaemond6atcopanelorgnetplybotdashstackitkaasorgmilcomnetedugovbizmodltdorgcomedugovcoorgcomneteduappwriteacorgcomnetedugovcloudtranslateusercontentorgcomnetedumobiassoorgcomnetedugovbarsysimplesitediscourseindorgmilcomgobneteduorgcomwebnetedugovguaminfonxhra教育敎育網絡网絡组織組織网络網络组织組织公司政府個人个人箇人ltdorgcomincneteduidvgovxn--uc0ay4axn--55qx5dxn--mk0axixn--io0a7ixn--uc0atvxn--zf0avxxn--lcvr32dxn--od0algxn--wcvs22dxn--gmqw5axn--od0aq3bxn--mxtq1mxn--ciqpnxn--tn0agxn--gmq050iorgmilcomgobneteduiservwp2tempurlmircloudfreesitewpmudevmyfastgadgetcloudaccessjelehalfboltfastvpsemergenteasypanelopencraftizcombrendlynamefromrtpersoadultmedorgpolrelcomproartnetedufirminfoassoshopcoopgouvtmcomediahotelforumvideosportorgsexagrargameslakaseroticaerotikatozsdereklamcasino2000filmsuliinfoboltshopprivnewsszexcityutazasjogaszkonyveloingatlaneacaicogoormyᬩᬮᬶmilwebschnetkopbizzonedesaponpesxn--9tfkymyspreadshopgovmytabittabitorderravpageaccok12idforgnetgovmuniltdplcaccotttvorgcomnetmeca6g5gpgamubacaicniocoukuptverdruscsdelhiindorgmilcomwebnicfingenpronetintedugovresbizbiharbarsyinternetbusinessschooltravelsupabasealumnigujaratfirminfoaeropostbankcoopindevscloudnsno-ipbarsybarrell-of-knowledgebarrel-of-knowledgensupdategroks-thisdnsupdatefor-ourknowsitalldvrcammittwalddynamic-dnsv-infowebhopselfipdyndnshere-for-moreilovecollegemayfirstforumzcloudnsmittwaldservertypo3servergroks-theeusekd1cdndyndnsidrawsainaueuapjpusstagemocksysdevicesclientcustreservdcustdevdisrecprodtestingcobeebyteutwenteboxfusebravepstmndedynngrokorgmilcomnomnetedugovqcxqzzbarsythingdustmo-siemensrb-hostingfh-muenstergitbookbluebitecloudbeesusercontentnodeartkiloappsforgerockdarklangresinstagingapigeebubbleb-datascryptedhypernodedappnodepantheonsitegitlabgithubkeeneticvirtualservercleverappshostyhostingon-rioedugitticketstelebitwixstudioon-k3sicp0icp12038jeleqotolairbubbleappsmyaddrstolosmyrdbxwebflowdrive-platformbeagleboardhasura-applolipopdefinimavaporcloudmusicianwebflowtestazurecontainerresindevicereadthedocsloginlineeditorxmoonscalesandcatsbasicserverwebthingsbrowsersafetymarkbeebyteappbitbucketidaccovistablogorgschnetgovxn--mgba3a4f16axn--mgba3a4fraarvanedgeايرانایرانjclaspeziapdudcefegelemeperetevebacanatavaparasabgagfgogrgpgalclblimfmrmcbmbvbfclcmcvcrcpcchlimifibicivipirisimncnbnanenrnpntnnolomobocoaogorosopotoptvtatctbtmtltotpusulunutpspapaqsvpvvvtvavvrtrsrprgrfrcrbrarorkrvstsssbscsmsispzczbzbozen-suedtirolmyspreadshopxn--bulsan-sdtirol-nsbxn--valledaoste-ebbtrentinoaltoadigetrentin-sued-tirolxn--forlcesena-c8axn--forl-cesena-fcbxn--bozen-sdtirol-2obtriestetrentinsuedtiroltrentino-s-tirollecceudineaostesienaparmaluccapaviagenoapaduaaostamonzaabruzzoternirietiturinmilanbozenlaziofermoleccocuneonuoropratola-speziavdataaligfvgpugmolcalcamlomumbsicpmnvenvaoedugovabrsarmaremrbastoslazibxosfirenzetrentinosüdtirolval-d-aostavalle-aostamessinacremonaravennatoscanatrentin-suedtirolbolognacalabriaurbinopesarofriuli-v-giuliaogliastraxn--valle-aoste-ebblaquilaandriatranibarlettasyncloudxn--valle-d-aoste-ehbaostavalleyvalled-aostatrentino-alto-adigevallee-d-aostexn--balsan-sdtirol-nsbpistoiasicilialucaniacataniaiserniaperugiabresciaveneziagorizialiguriaimperiabulsan-suedtirolbalsan-suedtirolbarlettatraniandriaxn--trentino-sdtirol-szbforlì-cesenatuscanyvallée-d-aostemantovavallée-aostecasertapiemontevalleaostaval-daostafriulivgiuliatrevisoforli-cesenavalléedaosteferrarapescaravald-aostatrentino-altoadigefriuli-vegiuliavallee-aostecarboniaiglesiastarantomediocampidanovalleedaostetrentinosud-tirolcampobassotrentinsüd-tiroltrentinosüd-tirolmonzabrianzatrentino-südtirolxn--trentino-sd-tirol-c3bpotenzacosenzavicenzaemiliaromagnavenicefrosinonemarchepordenonetrentinosued-tirolvaresemolisevalléeaostefriuli-veneziagiuliabasilicatalatinaanconasavonaveronamodenabiellabolzano-altoadigepugliafoggiaumbriatrentino-stirolgenovapadovamateranovararagusapiacenzatrentinostirolvalleeaostetempio-olbiasudsardegnatrentinsudtirolmassa-carrarafriuliveneziagiuliatrentinosuedtirolandria-barletta-tranitrapanixn--cesenaforl-i8amaceratacaltanissettaascoli-picenobrindisicarraramassacagliaririmininapolivibo-valentiachietibulsan-sudtirolbalsan-sudtiroltrentino-a-adigebulsanbalsaniglesiascarboniamilanotorinoteramodell-ogliastraarezzotrentinoalto-adigerovigotrentovenetoiglesias-carboniatrentino-sud-tirolaltoadigereggio-emiliareggio-calabriasardegnatranibarlettaandriapiedmontxn--sdtirol-n2amedio-campidanotrentino-süd-tirolfriuli-vgiuliafriuli-ve-giuliaromeennaromapisa32-b16-b64-blodiastibarineencomonaplesforlicesenailiadboxosalessandriasicilytrani-barletta-andriaxn--trentin-sdtirol-7vbpesarourbinotrentinsued-tirolcesena-forliforlìcesenaemilia-romagnamonzaebrianzaxn--trentinsdtirol-nsbtrentinos-tiroltrentinsüdtirolvalledaostaolbia-tempiocampidanomediovibovalentiasassarivalle-daostalombardysud-sardegnafriulivegiuliareggioemiliamonzaedellabrianzaalto-adigevercellitrentin-sudtiroltraniandriabarlettatrentino-sudtirolascolipicenobozen-südtirolfriulive-giuliaflorencexn--cesena-forl-mcbcarbonia-iglesiasaosta-valleycarrara-massadellogliastratrentinoa-adigexn--valleaoste-e7apesaro-urbinoxn--trentinosdtirol-7vbxn--trentin-sd-tirol-rzbxn--trentinsd-tirol-6vbtrani-andria-barlettatrentin-süd-tirolxn--trentinosd-tirol-rzbgrossetomonza-e-della-brianzasüdtirolreggiocalabriatrentinoaadigetrentin-südtirolverbano-cusio-ossolafriuliv-giuliaverbaniacampaniatrentino-aadigefriulivenezia-giuliasardiniaandriabarlettatranibarletta-trani-andriacatanzarooristanourbino-pesarocesena-forlìvalle-d-aostacampidano-medio123homepagesiracusatempioolbiasuedtirollombardiaavellinocesenaforlìtrentinofriuli-venezia-giuliabozen-sudtirolandria-trani-barlettabulsan-südtirolbalsan-südtirolmonza-brianzabolzanotrentino-sued-tirolbellunosalernolivornocrotonesondriodnshometrentinsud-tirolmassacarraratrentin-sud-tiroltrentino-suedtirolviterbobergamocesenaforliolbiatempiopalermobeneventoagrigentoofcoorgnetfmaitvphdengorgmilcomschnetedugovperagrikanieasukehandachitatokaiaisaikonanoharuamaobuhigashiuraowariasahiinuyamatobishimaiwakurashitarainazawatoyonegamagorimihamatoyotataharakariyayatomioguchikomakimiyoshinishiotokonamekiyosuchiryutoyohashiokazakiisshikikasugaikotakiratoeianjotogofusosetohazutsushimashinshirotakahamanisshinshikatsuhekinantoyokawaichinomiyatoyoakeodateogataakitaikawakyowahonjoogayurihonjonoshirokamiokakatagamimitanegojomeyokotekosakadaisenkazunonikahohonjyomoriyoshimisatohappoukamikoanihachirogatahigashinarusesembokufujisatokitaakitaitayanagiowanitakkomutsutsurutahirosakigonoheoirasetowadamisawanohejiaomorishingohiranairokunohehashikamitsugarushichinohehachinohenakadomarisannohekuroishisakaeisumiasahiotakiinzaiabikomatsudoyachiyomutsuzawakujukuriomigawakashiwatoganemihamanaritasakuranagaramobarahanamigawachoshishiroichoseikozakishisuikatorimidorichonankyonanfuttsuonjukufunabashinagareyamanodasosatakochuotohnoshourayasukimitsuyokaichibayotsukaidosodegauratateyamakamagayayokoshibahikariyachimatakatsuuratomisatokisarazukamogawaichikawanarashinoichinomiyashimofusaminamibososhirakoichiharaoamishirasatoikatahonaiainansaijoseiyoiyoozuuwajimaniihamanamikatamasakiuchikokihokutobetoonshikokuchuomatsuyamaimabarikamijimakumakogenyawatahamamatsunosabaeikedaobamasakaifukuiohionotsurugamihamawakasaminamiechizeneiheijikatsuyamatakahamaechizensoedaukihaomutaokawanishiogoribuzenonojosueumiokiotochikugosasagurisaigawamizumakishinyoshitomikurumekurateyamadakasuganakamamiyamanogatatakatahakataiizukakawaratagawakasuyaashiyainatsukimunakataminamitsuikishonaikurogifukuchikeisenhigashimiyakoshinguyukuhashiokagakiyamekogaongausuikahotohochuotoyotsumiyawakadazaifuhisayamatachiaraiyanagawanakagawahirokawachikujochikushinochikuhochikuzennamieotamaokumashowateneiiwakikoorinangoononishigoshimogoomotegomishimafukushimaasakawakagamiishishirakawaiitatefutabahiratayugawahanawakitakatakawamatakunimiyabukibandaihigashihironoyamatomiharuyamatsuriaizubangedatesomaaizuwakamatsuyanaizuaizumisatonishiaizuizumizakikitashiobarataishinkaneyamakoriyamainawashirotanagurafurudonosamegawasukagawaishikawatamakawaikedaogakitaruiginanenahashimahichisonakatsugawaibigawashirakawamizunamiminokamomitakekawauesekigaharatomikasakahogikitagatayamagatatajimianpachimotosuyaotsukakamigaharahidakanisekitokigujominogodoyorogifukasamatsutakayamawanouchihigashishirakawakasaharashimonitatsumagoichiyodakannakanrashowameiwakiryuotaoratomiokafujiokaitakuranaganoharahigashiagatsumatakasakishibukawaminakamikatashinatsukiyonokawabanumataannakaoizumimidorishintoisesakiuenoyoshiokakusatsutakayamanakanojonanmokutamamuratatebayashimaebashiotakekaitadaiwahongofuchukuietajimashobaramiharahatsukaichihigashihiroshimamiyoshikumanokurenakasakaseraseranishiasaminamifukuyamashinichionomichiosakikamijimajinsekikogentakeharaotobenanaeikedatohmaozoraobiraabirakyowaeniwataikibibaisharirebunerimohiroooketootarupippunishiokoppechitosefurubirahakodateshiranukakitahiroshimakushiroobihironanporoiwamizawaniikappukunneppufukushimanakasatsunaitoyourakuromatsunaiakabirakamisunagawashibechaurakawakamifuranonakatombetsuasahikawashimokawakayabeokoppebiratoriabashirisaromaatsumanumatahidakabifukamukawamikasahorokanaitoyotomisarufutsuhigashikawaishikarikitamiyoichiesashiiwanaitomariminamifuranoakkeshifuranotoyakoyakumootoineppushikaoishiraoinemuronayorohaboroashorobihororishirifujiutashinaihokutotakasuebetsuurausuassabukikonaishimamakinaiedatetoyabieinikiesanuryuoumuteshikagarikubetsuashibetsukimobetsuaibetsutobetsusobetsuembetsushimizuchippubetsurishirihokuryuhoronobeshintokutsubetsushibetsuhonbetsumombetsutsukigatakuriyamakoshimizushiriuchikutchanmurorannoboribetsukamishihorowassamushinshinotsukembuchiwakkanaikamoenaikiyosatotakinoueshikabesunagawafukagawanakagawatakikawakamikawahigashikagurahamatonbetsumatsumaemoseushirankoshishakotanimakanemashikeotofuketomakomaisandatambaitamiawajikasaiasagoshisoonoakoyashirotoyookaminamiawajiinagawafukusakitakasagokamigorikasugaharimayokawaashiyahimejiakashitaishiaogakisannantakinosumototakarazukanishinomiyashingugoshikinishiwakiyokatakaaioimikisayoyabukawanishiamagasakisasayamashinonsenkakogawaichikawakamikawatatsunotsukubaiwamaogawaasahisakaitokaioaraiitakobandodaigosuifuinaamikasumigaurakashimaomitamayachiyoshimodatetomobetoridehitachinakainashikisakuragawakasamayawaramoriyahitachiomiyanamegatayamagatahitachikamisuushikutakahagiibarakitonekoganakasowayukimihojosomitoryugasakishimotsumafujishirotsuchiurachikuseihitachiotashirosatotamatsukuriuchiharashikahakuinanaotsubatawajimakahokukawakitatsurugikaganominotosuzuuchinadakomatsuanamizunakanotohakusannonoichikanazawaiwateshiwafudaikawaimoriokaofunatohanamakikuzumakikitakamininohekunoheyamadayahabasumitaichinosekitanohatahiraizumirikuzentakatajobojiotsuchihironomiyakoiwaizumikarumaiichinohenodakujitonooshushizukuishifujisawamizusawakamaishikanegasakimannoutazukotohiraayagawazentsujihigashikagawauchinomikanonjisanukimarugamemitoyotakamatsutadotsunaoshimatonoshoakuneamamiizumihiokiyusuikinkoisasookouyamanakatanekagoshimakanoyaisenkawanabeminamitanemakurazakitarumizunishinoomotematsumotosatsumasendaioimatsudaayaseebinamiurazushinakaiodawaraiseharasagamiharahakoneaikawakaiseiatsugitsukuihadanoyamatoyamakitazamaoisochigasakininomiyayokosukakamakuraminamiashigarafujisawasamukawakiyokawahiratsukayugawaraokawaumajikochitsunootoyoakiinonishitosayasudahidakamiharasakawaniyodogawahigashitsunokagamigeiseisusakiotsukinaharisukumomurototosakamiochitoyotosashimizumotoyamanankokunakamurakitagawayusuharaogunichoyoukiasoutoozugyokutoamakusamifunetakamoriyamagaminamataminamiogunikikuchisumotoyamatonagasumashikiaraokumamotokamiamakusanishiharayatsushiroayabeseikasakyoideineujinakagyokameokakyotangokyotanabekyotambaminamiyamashiroyamashinatanabeyawatawazukaminaminantanmiyazuhigashiyamafukuchiyamakitamukokamojoyokizumaizuruujitawaraoyamazakinagaokakyokumiyamakawagoeinabeshimameiwaasahitaikiudonoisetsukisosakikuwanamihamamiyamasuzukatamakimisuginabarikumanokomonominamiisewataraitobakiwatakikihotadomatsusakayokkaichikameyamaureshinoishinomakishichikashukuohirataiwaosakizaohigashimatsushimashikamaiwanumashibataogawaraonagawakawasakiseminemarumoriminamisanrikukakudamuratawakuyatomiyanatoriwataritagajomisatotomekamirifushiroishimatsushimayamamotoshiogamafurukawahyugaebinotsunosaitoayakushimanobeokakitauramiyazakitakazakigokaseshiibamimatashintomikunitomikitakatakobayashikawaminamitakaharukijotakanabemiyakonojonishimeranichinankitagawakadogawamorotsukakisofukushimaminamimakisakaeobuseikedaogawamiasaokayaasahiotakiotarichinoinaomichikumakomaganechikuhokukaruizawayasuokaooshikaikusakaminamiaikitogakushimatsukawakawakamitateshinatakamorikitaaikishiojirimiyadahakubaiizunaiijimaiiyamamiyotasuzakayasakatoguraookuwanagawaminowahirayayamagataminamiminowafujimiomachisakakitakaginaganonakanosakuhokomoronagisoshinanomachiwadauedaiidaharasuwatomiachiaokianankisosakunozawaonsenagematsutakayamashimosuwamatsumotoyamanouchinakagawamochizukiazuminotatsunoobamaomuraseihiunzenosetofutsuikichijiwanagasakiisahayahasamisaikaikawatanasasebohiradokuchinotsugototogitsutsushimashimabarashinkamigotomatsuurayamazoekashibaikomakawaitenrioyodosangokoryoudaojiikarugayamatokoriyamatenkawakatsuragikurotakikawakamimiyakemitsuetakatorikamikitayamayamatotakadahegurishinjokanmakisakuraitawaramotogoseoudanarasoniandokawanishishimoichihigashiyoshinokashiharashimokitayamanosegawayoshinomintsivorytopazsakuragehirnsumomoaseinetopalmail-boxmokurenyoitamuikaojiyagosensanjoaganomyokoseiroagaomishibataniigatanagaokamurakamiuonumayuzawakariwatagamitainaitsunanminamiuonumatochioyahikojoetsuseiroukamosadoizumozakitokamachiitoigawasekikawakashiwazakitsubamemitsukekokonoesaikiusukibeppuusahimeshimakunisakihasamataketatsukumihitaoitahijikusuyufukujukamitsuebungoonobungotakadaibaraniimibizentsuyamaokayamakasaokahayashimayakagemaniwaakaiwamisakishinjotamanotakahashikibichuowakesojanagishookumenannishiawakurakurashikiasakuchisetouchikagaminosatoshotomigusukunakagusukuyaeseizenaurumaiheyaaguniogiminanjokinminamidaitokitanakagusukuyonaguniokinawaishigakikunigamiurasoekadenataramahiraraginozataketomishimojizamamitonakiitomanhigashimotobuyonabarugushikamionnanahanagohaebarukumejimakitadaitonakijinnishiharayomitanginowantokashikiishikawaikedasuitaminohizuminishisakaikananabenodaitoosakasayamayaokishiwadatadaokakaizukatondabayashichihayaakasakakumatorikadomasayamahigashiosakashijonawatehirakatataishimisakitajirihannansennankatanotoyonominatosettsuhigashiyodogawaibarakinosekitachuohigashisumiyoshifujiiderakashiwaraizumiotsutoyonakamatsubaramoriguchiizumisanoshimamototakatsukineyagawahabikinotakaishikawachinaganoyoshinogarikamiminearitaouchiimarihizenogikashimaariakekiyamafukudomikitagatakitahataomachigenkaikanzakinishiaritakyuragisagataratosutakushiroishikaratsuhamatamakouhokukawagoeyoshidasatteogoseirumaasakaurawaogawaniizaomiyayoriiotakishikihonjooganohannohanyuinasaitamaokegawaarakawayoshikawayokozehasudasayamahidakafukayachichibuiwatsukiryokamiyoshimikamiizumifujimiwarabiranzanmiyoshiminanoyashiosakadosugitomisatohigashichichibutodasokakukiyonokazoshiraokakasukabekounosukawajimatsurugashimamiyashirokitamotohatoyamamoroyamahatogayakumagayakawaguchinagatorokamisatomatsubushinamegawatokigawakamikawafujiminohigashimatsuyamakoshigayatokorozawas3isk01isk02ryuohkoseikonanaishorittotakashimamaibarahikonetorahimenishiazaikokagamokotoyasuotsukusatsunagahamamoriyamatoyosatotakatsukinotogawaomihachimanhigashiomiakagiunnanizumogotsuamayatsukakakinokimatsuehamadamasudahikawahikimiokuizumoyasugiyakumomisatotamayuohdahigashiizumookinoshimanishinoshimatsuwanoshimaneshimadafujiedayoshidashimodagotembaiwataatamikosaiyaizuitoizumishimahaibaramakinoharaomaezakikawanehonkannamisusonohigashiizufukuroinumazukawazufujiaraishizuokahamamatsushimizuizunokunimatsuzakimorimachiminamiizunishiizukikugawakakegawafujikawafujinomiyaujiietsugaoyamayaitaohiranikkoashikagakuroisokanumasakurashioyakarasuyamamotegiichikaikaminokawatochigihagamokanogisanobatonasumibunasushiobaranishikatautsunomiyaiwafunemashikoshimotsukeohtawaratakanezawaitanokomatsushimatokushimaichibaminamiaizumiwajikikainanmiyoshinarutomimamugiananmatsushigesanagochishishikuinakagawamachidachiyodakomaefussainagitaitochofufuchuomeotahigashiyamatotoshimaokutamaaogashimakodairaedogawaarakawahachiojishinagawatachikawashibuyasuginamihinodekiyosesumidaoshimanerimamitakahamuraadachinakanomizuhobunkyomegurominatokoganeihigashikurumekokubunjihigashimurayamamusashimurayamatamakitahinochuokotokatsushikakouzushimaogasawaraakishimakunitachishinjukusetagayamusashinohachijoitabashiakirunohinoharachizunanbukotouramisasawakasayonagokogehinoyazutottorinichinansakaiminatokawaharaoyabetairainamiasahinantoimizufuchutakaokakurobeyamadajohanatoyamatonaminyuzenfunahashinakaniikawanamerikawaunazukitogahimiuozufukumitsutateyamakamiichiiwadearidayuasainamitaijikatsuragiaridagawatanabemihamahidakakainankiminomisatoshingushirahamakamitondayurakozakoyagobokitayamawakayamakudoyamahashimotokushimotokozagawahirogawakinokawanachikatsuurarsuseroeoishidasagaeoguniasahinagaitendonanyoobanazawanishikawasakataohkuratozawamikawamamurogawayamagatafunagatatakahatashonaishinjokahokuiideyuzakawanishitsuruokakaminoyamayamanobeshiratakamurayamanakayamakaneyamahigashineyonezawasakegawamitouubeyuuabushimonosekitabuseoshimatoyotaiwakunihikarishunannagatohagihofukudamatsutokuyamashowadoshitsurunanbukoshukaiminami-alpsnirasakikosugeotsukioshinohokutominobuyamanashifuefukichuokofuichikawamisatoyamanakakonakamichitabayamanishikatsuranarusawafujikawahayakawafujiyoshidafujikawaguchikouenohara長野京都岐阜大阪三重群馬千葉滋賀佐賀奈良adednelgaccogogror秋田愛知高知埼玉沖縄栃木熊本岩手青森山梨新潟島根鳥取長崎香川宮城石川大分宮崎茨城山口兵庫山形徳島広島福島福岡岡山富山静岡愛媛福井東京xn--4it168dhatenadiaryxn--vgu402ckawaiishophatenablogcocottenamaste北海道penneehimeiwateversestabachibashigagonnagunmapermahaccaakitaosakauh-ohblushkochiaichifukuikuroncapooitigohyogotokyokyotopunyuthickcheap0t00g00j0mie2-ddaapyawjg0amfemsubxiiboomoobutchueekpgwrgrherskrboyrdyupperunderflierchipsmydnsheavyangryhippygirlyrulez神奈川鹿児島和歌山bambinaxn--nit225kokayamasaitamaxn--k7yn95exn--1lqs03nsapporoparasitelolipopmcxn--efvn9sniigatafukuokatokushimafukushimahiroshimakagoshimafakefurokinawaxn--8pvr4ucoolblogxn--0trq7p7nnkawasakinagasakimiyazakichilloutxn--8ltr62kxn--klty5xpeeweezombiecutegirlxn--rny31hxn--uuwu58axn--ntso0iqx3axn--djrs72d6uytoyamanikitanyantakagawamimozanagoyaboyfriendxn--2m4a15egreaterchowderegoismyamagatafashionstorexn--elqq16hxn--pssu33lsendaimiyagixn--rht27zpecoriaomorisaloonwatsonvivianxn--djty4knobushipigboatnaganopinokoxn--f6qx53asadistvelvetsecretxn--5js045dchicappayamanashiibarakidigickgirlfriendxn--1lqs71dmongolianxn--c3s14mxn--qqqt11mtochigixn--5rtq34kparallelo0o0mondkobesagabonadecaoitanarafoolkilldecimainhiholomosblokilociaoundopupugifutankcrapflopnooroopsmodsholyjeezstripperpepperbittershizuokaxn--rht3dkitakyushureadymadeicurusversusmatrixxn--rht61ehungryfloppygloomycrankyhandcraftedlittlestarxn--klt787dxn--kltx9awhitesnowsunnydaytottorilovepoptheshopbuyshopxn--5rtp49cxn--d5qv7z876cwebaccelxn--kbrq7oxn--4pvxsxn--1ctwolovesickkumamotocatfoodxn--tor131oyokohamawakayamatonkotsuxn--ehqz56nxn--uist22hxn--6btw5axn--kltp7dyamaguchifrenchkisspussycatxn--4it797kxn--uisz3gbabybluexn--zbx025dnetgamersxn--7t0a264ckanagawaxn--6orx2rishikawaxn--ntsq17ghalfmoonschoolbusjellybeanxn--mkru45iusercontentlolitapunkxn--32vp30hsakurastoragehokkaidoshimanecandypopbabymilksupersaleweblikeraindropbackdropwebsozaikikirarahateblodaynightmeneacsccogoormobiinfoaeusxxorgmilcomnetedugovorgcomnetedugovbizinfotmprdorgmilcomnomedugovassnotairespresseassocoopgouvveterinairemedecinpharmaciensorgnetedugovtraorgcomedurepgovmeneperekgacscaiiocogoitoresmshsseoulbusanulsandaeguc01milvkimmvchungnamjeonnamjeonbukeliv-dnsgyeonggijejueliv-cdnincheondaejeongangwongyeongbukgwangjuchungbukgyeongnameliv-apicoeduindorgcomembnetedugovorgmilcomnetedugovjcloudorgcomnetintedugovperbnrinfocooyorgcomnetedugovethipfscanvamypepethw3sstorachakeeneticjoinmcinbrowserdwebcyonnftstoragemyfritzaemewphlxachotelltdorgcomwebsocschngonetintedugrpgovassnomgacsccoorgnetedugovbizinfo123websiteidorgmilcomasnnetedugovconfidmedorgcomplcschnetedugovaccoorgnetgovpresstmassoirseproxaccosoundcasthoptocraftvp4c66orgnetedugovitsmcdirmyboxbarsyedgestacksynologylogintoopencloudnohostwebhopdiskstationi234tcp4hoocgroknoipprivmydsddnsdnsforlohmustransipdscloudfilegear-sgbrasiliafilegearframerbarsybarsyonlinecoprdorgmilcomnomedugovinforgcomnetedugovnameacprorgcomartnetedugovpresseinfoassoinstgouvorgnycedugovbarsydscloudjuorgcomnetedugovminisiteaccoororgcomnetgovorgmilcompronetintedugovbizmuseumnameinfoaerocoopaccoorgcomnetintedugovbizcooporgcomgobneteduorgmilcomnetedugovbiznameaccoorgmilneteduadvgovcoorgcomnetaltgovforgotherhiskeeneticispmanagernomassoprod5476132eastasiacentraluswesteuropewestus2eastus2pnortheurope-01newzealandnorth-01southindia-01southcentralus2-01norwaywest-01eastus2-01westus2-01australiaeast-01italynorth-01israelnorthwest-01swedencentral-01westeurope-01centraluseuap-01taiwannorthwest-01uaecentral-01northcentralusstage-01israelcentral-01mexicocentral-01canadacentral-01austriaeast-01germanywestcentral-01francecentral-01ukwest-01denmarkeast-01polandcentral-01eastus-01westus-01swedensouth-01eastus3-01westus3-01brazilsouth-01centralus-01francesouth-01australiacentral-01westindia-01uaenorth-01jioindiacentral-01canadaeast-01belgiumcentral-01spaincentral-01koreacentral-01chilecentral-01qatarcentral-01westcentralus-01eastus2euap-01norwayeast-01southafricanorth-01brazilsoutheast-01germanynorth-01switzerlandnorth-01switzerlandwest-01japanwest-01southafricawest-01japaneast-01eastasia-01indiasouthcentral-01taiwannorth-01centralindia-01uksouth-01southcentralus-01northcentralus-01eastasiastage-01indonesiacentral-01australiacentral2-01australiasoutheast-01malaysiawest-01koreasouth-01southeastasia-01southeastus5-01northeastus5-01jioindiawest-01rucdnwest1-usfra1-desandboxjls-sto1jls-sto3jls-sto2aglobalabglobalsslmapprodfreetlsmapvpslon-1lon-2ny-1fr-1sg-1ny-2paassnwebpaashostingjelasticnordeste-idcsocuserpagescwebfileblobservicebuscoreatlricnjsjelasticwebsitestoragesezagbinruhuukjptsmyspreadshopmynetnameakamaiorigin-stagingfrom-coipv64dynv6cdn77serveblogadobeaemcloudhicamsprytdnsupno-ipownipde5ovhicpfirewall-gatewaysytesmypsxbarsyusgovcloudapimyamazemyradwebakamaihdsaveincloudfastlylbfrom-lasubsc-paysquare7in-the-bandblackbaudcdnhomelinuxoninfernoctfcloudservebbsdns-dynamiccloudfrontakamai-stagingipifonyham-radio-opsenseeringclickrisingcommunity-profrom-nylocalcertgrafana-devedgesuite-stagingcloudflareanycasteating-organicatlassian-devmydattofeste-iplocaltotorprojectknx-serveredgekeycloudflareglobalcloudyclustercasacamserveftpakamaized-stagingakamaiorigindns-cloudmyeffectboomlabotdashbuyshousestwmailhetemlazure-mobilein-dslthruhereredirectmedynuddnsbouncemesupabaseluyanicloudappakamaicloudfunctionsdebiannhlfanpgafanstatic-accessin-vpnmysynologymafeloappudohomeftptrafficmanagersiteleafseidatmemsetcloudflarecloudaccesskeyword-onazure-apiis-a-chefdoes-itgets-itwebhopselfiphomeipkicks-assedgesuitewindowsserver-ontunnelmolemydissentscrapper-sitecloudflarecnuni5srcfggffiobbzabchrsndenodynuopikddnsvpndnsakadnselastxkinghostvps-hostfastlyhomeunixazureedgeshopselectdontexistmyfritzcloudjiffyalwaysdatasells-itsquaresbroke-itazurefddattolocalat-band-campmeinforumfamilydsazurestaticappsdefinimabplaceddnsaliasdynaliasnow-dnsblogdnsroutingthecloudendofinternetdsmynasakamaiedgemymediapcadobeio-staticakamaiedge-stagingakamaihd-stagingddns-ipprivatizehealthinsurancelive-onkrellianschokokeksmassivegridmysecuritycamerarackmazeserveminecraftfrom-azis-a-geekakamaizedmoonscaleoffice-on-theusgovtrafficmanageradobeioruntimeedgekey-stagingreserve-onlinechannelsdvrdnsdojousgovcloudappcdn77-sslapps-1and1podzoneazurewebsitesdynathomescaleforceyandexcloudvusercontentisa-geekcdn-edgescoaemalcesappwriteazimuthtlonarvobuiltwithrocketnoticeablestorecomwebrecnetperotherfirminfoartslgdloncogoiltdorgmilcolcomplcschgenngonetedugovbiznamefirmmobiacincoorgmilcomnomwebgobnetintedubizinfocomyspreadshopdemongovtransurl123websitehosting-clusterkhplaycistrongsnesosvalervålerxn--vler-qoaossandeheroysandeherøybøboheroyherøyxn--hery-iraxn--b-5gavalerbøboxn--b-5gasandesandexn--hery-iraxn--vler-qoavålerhåreålaahavaofsfvfhlolnlalrlhmfmtmahcostntbuåstrmreigersundmyspreadshopgálsáeidsvolltingvollgildeskalflorøvadsøvardøvanylvenxn--bhccavuotna-k7astrandaxn--kvnangen-k0axn--sknland-fxaxn--mosjen-eyarakkestadhyllestadnannestadvevelstadvaapstenordre-landsondre-landsøndre-landtjieltexn--vrggt-xqadsør-aurdalsor-aurdalheradstordmoldefordeførdeseljefedjeryggehemnexn--krehamn-dxasognegranesøgnebrynetjomevallebykletokkegiskedovretjømehobølvoldasaudatolgasømnaviknadønnasomnadonnatranafrananesnaraumasmolatrænafrænalesjasmølaørstaorstahitrafloraaukraloppafrøyarissasnasahalsagalsaromsaraisaráisafroyasnåsagronghobolfjelltydalårdalardalaskimharamkraanghkekråanghkesorumbarumhurumbærumsørummodumsálátbálátfrognbjugnvåganvagangulenskienløtenlotenstrynvefsnxn--merker-kuaskaunsveiobømlobomloskjåkvardoflorovadsosalatbalatsálatklæbuklabuselbubarduulvikskjakklepprisørxn--nttery-byaeflåeidflahofmilgolholsellomskifetvikdepvgsfhsaskerrisorhamarasnesåsnesrørosrorosxn--slat-5namasoynaroyvaroyluroydyroyaskoyradoyandoyrodoymeloyradøyandøyrødøymeløyaskøylurøydyrøymåsøyværøynærøyhoylandethøylandetdivtasvuodnalørenskoglorenskognesoddtangenxn--tjme-hraxn--smla-hraxn--stjrdal-s1aunjargalillehammerunjárgaxn--hamary-fyadavvenjargaxn--bearalvhki-y4a123hjemmesidegjerdrumxn--brnnysund-m8acxn--tnsberg-q1axn--mlatvuopmi-s4axn--snsa-roaxn--skierv-utaxn--brum-voatysfjordkvafjordeidfjordkvæfjordsongdalenmjondalenmjøndalenxn--gls-elackragerogáŋgaviikagangaviikasørreisasorreisasør-varangersor-varangerxn--risr-iraskiervaxn--frna-woaxn--trna-woakvinesdalleksvikleirvikrøyrvikroyrviksvelvikvenneslaevje-og-hornnessandnessjøenmarnardalvindafjordsandefjordenebakksnillfjordullensvangxn--trany-yuabrønnøysundnamsskoganaustevollxn--stjrdalshalsen-sqbnord-aurdalnord-frontrøgstadtrogstadgrimstadflakstadgjerstadxn--sandy-yuaxn--leagaviika-52bnore-og-uvdalvegarsheixn--rlingen-mxaxn--ggaviika-8ya47hvegårsheikarlsoykvitsoymasfjordenhamaroyinderoyosteroydavvenjárgasauheradguovdageaidnuxn--vre-eiker-k8abronnoysiellakkrødsheradkrodsheradkvinnheradbrønnøyxn--mtta-vrjjat-k7afxn--lrenskog-54akvitsøyvárggátkarlsøyosterøyinderøyhamarøybronnoysundxn--aurskog-hland-jnbbahccavuotnabáhccavuotnagiehtavuoatnastor-elvdalmidtre-gauldalxn--gildeskl-g0akarasjokevenassixn--bievt-0qaxn--yer-znalebesbynessebyxn--hbmer-xqamalselvmålselvxn--unjrga-rtamøre-og-romsdalmore-og-romsdalhareidmelandørlandorlandstrandålgårdsolundalgardafjordåfjorddielddanuorrikautokeinoxn--stre-toten-zcbskodjeaejriestangeliernebamblestokkefauskesnåasesnaasekongsvingerlangevagberlevagxn--flor-jrahattfjelldalostre-totenøstre-totenvestfoldxn--mely-iraálaheadjualaheadjunordreisaxn--troms-zuaxn--lgrd-poacporsangerflatangerstavangerleikangerbremangersamnangergieldakarasjohkaxn--rdy-0nabfrostautsirasnoasatromsaxn--sr-aurdal-l8aflekkefjordjølsterjolsteraremarkhedmarknååmesjevuemienaamesjevuemiexn--vard-jrarollagmeråkermerakerorskogørskogxn--bdddj-mrabdákŋoluoktaxn--osyro-wuaaknoluoktatrysilskjervøymandaljondalbindalrindalmeldalsuldalorkdalsigdalalvdallærdalhurdalsirdalverdallerdallardaloppdalåseralaseralhadselkragerødivttasvuotnaoverhallasteinkjerxn--hnefoss-q1askedsmokorsettromsøxn--dyry-iravestre-totenmuseumxn--sandnessjen-ogbrahkkeravjufylkesbiblbájddarbajddarxn--laheadju-7yarennesøyxn--koluokta-7ya57hxn--hgebostad-g3aleirfjordstorfjordbalsfjordbåtsfjordbatsfjordmuosátbievátloabátkárášjohkanøtterøyxn--mjndalen-64anordkappláhppilahppialstahaugsiljanverranrøykenroykenhaldenlyngenbergenhortenhønefosshonefosstroandinbeiarnvarggatosoyroosøyrotromsoidrettmuosatbievatruovatloabatvoagattynsetnessetxn--indery-fyaskánitskanitraholtråholtxn--ystre-slidre-ujbandebusarpsborgbearduxn--karlsy-fyahordalandjorpelandjørpelanddeatnuringsakersør-odalsor-odalxn--slt-elabringerikeaudnedalnittedalnissedalhemsedalslattumsurnadalxn--blt-elabelverumstjørdalnaustdalhjartdalgjøvikfyresdalhasviknarviklarvikgjovikmalvikgamviklenvikporsgrunnstjordalengerdaldrobakdrøbakxn--msy-ula0hvestvagoyxn--vgan-qoaxn--ryken-vuaxn--lten-graxn--stfold-9xaxn--hpmir-xqaxn--lury-iramálatvuopmimalatvuopmitysværkirkenesbirkenesmoskenesbáidárxn--fjord-lraxn--rdal-poabahcavuotnabáhcavuotnaxn--frde-gralindåsbearalvahkixn--hobl-iraráhkkerávjuxn--loabt-0qavågåáltábodøsundlundraderådeetnetimeholeauregrueoddavagavegaranatanaarnasolasulaaltalekafusavangbergkvamåmliamlibokntinnroangranosenoslobodorøstroststatåmotamotivguprivøyeroyerliermossvossxn--nvuotna-hwalusterlunnermarkerhábmerhabmerhvalerfjalerxn--rholt-mratysvarbaidarfitjargaularhápmirhapmirmelhusfosnesøksnesoksnestysneshemnesevenesflesbergeidsbergtonsbergtønsberglindasxn--sndre-land-0cbnamsosxn--srum-graøystre-slidreoystre-slidrevestre-slidretrondheimbalestrandxn--langevg-jxaaustrheimxn--skjk-soavagsoyaveroysandoykarmoyfinnoytranoyvestbytranbysykkylvenxn--hyanger-q1aspjelkavikandasuoloxn--fl-ziaxn--drbak-wuastathellexn--sr-varanger-ggbtelemarkxn--bhcavuotna-s4axn--porsgu-sta26fčáhcesuolocahcesuoloakrehamnåkrehamnsandøykarmøyfinnøytranøyvågsøyaverøynamdalseidxn--lesund-huabadaddjaxn--vegrshei-c0axn--btsfjord-9zagildeskålporsanguxn--trgstad-r1anávuotnanavuotnahammerfestxn--sgne-graxn--brnny-wuacibestadharstadnarviikaevenáššivestnesgjemnessandnesagdenesrennesoyxn--avery-yuaxn--tysvr-vrabearalváhkikongsbergspydebergrandabergxn--andy-iradavvesiidaxn--krdsherad-m8aporsáŋgufredrikstadbjerkreimringeburennebuaurskog-holandnotteroyxn--vgsy-qoa0jxn--rmskog-byaskierváivelandbyglandfrolandaurlandforsandxn--bjddar-ptamidsundålesundalesundfetsundfarsundovre-eikerøvre-eikerakershusxn--moreke-juasørfoldøstfoldostfoldsorfoldhøyangerhoyangerlevangerorkangertanangerxn--vestvgy-ixa6olillesandulsteinxn--rennesy-v1agranvinskjervoyxn--klbu-woalavagisxn--h-2faxn--ryrvik-byakafjordkåfjordseljordfolkebiblxn--gjvik-wuajevnakerxn--kfjord-iuabudejjuxn--kranghke-b0axn--davvenjrga-y4axn--rland-uuaxn--ldingen-q1axn--mlselv-iuaxn--rady-iraxn--linds-prabrumunddalxn--ygarden-p1amo-i-ranaeidskogrømskogromskoghjelmelandxn--finny-yuaxn--sr-odal-q1axn--skjervy-v1aballangenkvanangenkvænangengratangenxn--hmmrfeasta-s4acvossevangensuohkanxn--rde-ulaxn--mli-tlaxn--ksnes-uuanordlandskanlandskånlandsortlandfuoiskuxn--rros-graxn--hcesuolo-7ya35bxn--eveni-0qa01gagaivuotnagáivuotnaxn--seral-lradrammenmodalenmosjoenjan-mayentorskensteigengloppenxn--snes-poamatta-varjjatxn--sr-fron-q1aomasvuotnajessheimbådåddjåxn--krager-gyaxn--kvfjord-nxaxn--asky-iraxn--snase-nraxn--bidr-5nacholtålenxn--vads-jraxn--jlster-byamosjøenxn--rst-0nastavernxn--ostery-fyaxn--oppegrd-ixaxn--sknit-yqaxn--risa-5naoppegårdskiptvetrendalenholtalenxn--mot-tlaxn--lhppi-xqaxn--holtlen-hxaxn--srreisa-q1akopervikxn--muost-0qaxn--bmlo-grahokksundkvalsundegersundxn--karmy-yuaullensakerxn--hylandet-54axn--kvitsy-fyaxn--bod-2nalangevågberlevågkristiansandxn--rsta-frahornindalstjørdalshalsenstjordalshalsensandnessjoenhámmárfeastaxn--lrdal-srasør-fronsor-fronnord-odalkristiansundmátta-várjjatvestvågøynesoddennotoddenbuskerudøygardenoygardensalangenlavangenralingenrælingenlodingenlødingenleaŋgaviikalaakesvuemieleangaviikauenorgexn--srfold-byaaskvollxn--rskog-uuaxn--nry-yla5gxn--vry-yla5ghammarfeastaxn--rhkkervju-01afxn--givuotna-8yakommunekrokstadelvanedre-eikerhagebostadhægebostadxn--berlevg-jxakviteseidxn--s-1faxn--l-1faxn--nmesjevuemie-tcbafuosskomoårekemoarekexn--lt-liacxn--jrpeland-54asvalbardoppegardholmestrandtvedestrandsogndalsokndalarendalsunndalfolldalxn--krjohka-hwab49jlyngdaletnedalnorddalsaltdalgausdalskedsmovaksdalgjesdalstordalxn--frya-hraaarbortedrangedalxn--smna-graaurskog-hølandxn--vg-yiabtjeldsundhaugesundlindesnesxn--mre-og-romsdal-qqbxn--dnna-gradyntmpheremerseineshacknetenterprisecloudmineaccomaorimāoriorgmilcriiwigennetschoolhealthkiwigovtgeekxn--mori-qsacloudnsparliamentcomedorgcompronetedugovmuseumwebsitekinservicebarsywebsitebuildereerobookheimdnsleapcelleero-stagetechcrscsslorigingohomecdbedeeeiemesecabgngilnlalplchfisiincnnoroptatitmtltruauhulumkdkukskjplvtrgrfrkrhrusesismycynzcznetinteduassoososcloudstgbetaaezaeuhkusjshatenadiarycdn77hoptozaptois-a-knightmyftpno-ipjpnddnssdpdnsspdnsbarsysweetpepperis-a-bruinsfanis-very-sweetservegameis-a-soxfanhomelinuxcdn77-secureservebbsmisconfusedwebredirectblogsitefreedesktopcouchpotatofriestoolforgeaccesscamis-lostreadmyblogsmall-webfedorapeopleserveftpis-a-celticsfanmywirepotagertwmailin-dslsellsyourhomeread-booksfreeddnscable-modemis-savednflfanufcfanmlbfanstuff-4-saleendoftheinternetin-vpnmy-firewallhomeftpis-localis-a-chefboldlygoingnowherewebhopselfipkicks-assroxatunkcamdvrfedoraprojectgotdnsdvrdnsdyndnspubtlspimientahomeunixdontexistfedorainfracloudwmflabsfspagesbmoattachmentsteckidsfamilydsdnsaliasdynaliasnow-dnscloudnsdoomdnsduckdnsblogdnshomednsroutingthecloudendofinternetdsmynasip-dynamicpoivronhttpbinmyfirewallis-very-evilmysecuritycamerais-a-linux-userwmcloudis-a-geektuxfamilyis-a-candidatedoesntexistis-very-badhobby-sitegame-hostaltervistais-foundis-a-patsfandnsdojohepforgepodzonedynservcollegefanis-very-goodfrom-meis-very-niceisa-geeknerdpolacmedsldingorgcomnomgobabonetedupleskaemhlxmyboxrockyprvcydeuxfleurspdnscodebergheyflowstatichostorgmilcomnomgobneteduorgcomeduiorgmilcomngonetedugovcloudns1337ngrokacorggogfamcomwebgobnetedugokgopgkpgovgosbizpasaugumicsopozpapuwmwsrprusiskwpspkppspkmpspokeoiawsawifoumsdnskokwpmuppuppsppiwwiwoowuzswkzoschrzpisdnwzmiuwwitdpssewsseumigugimoirmpinbwinbwiihupporzgwgriwupowwskrwioswuozstarostwokonsulattmpccopruszkowmyspreadshopostrodakartuzyopolegminamediaustkazgorajgoraolawailawalomzawloclradombytomjaworznotargilubinkoninzagantorunkutnokepnonakloczestsopotsanokturekplockslasksklepzarowlukowmedaidgdaorgmilrelcomnomatmgsmartneteduelkgovwawsossexbiztgorysejnytychypomorzeboleslawiechomesklepsdscloudunicloudzakopanelegnicarawa-mazbydgoszczswidnikkrasnikwloclawekbielawamragowograjeworealestatebeskidykaszubymalopolskaprzeworskswiebodzinlecznadfirmaszkolawarmiagdyniamiastakazimierz-dolnymalborkswidnicadlugolekaostrolekapodlasieelblagtravelsimplesitezachpomormielecszczecinnieruchomosciwalbrzychlezajsklublinbedzinpoznanwielunmielnooleckostarachowicedkontopowiatwroclawrybniksuwalkileborkslupskgdanskostrowwlkptarnobrzegtourismwegrowkrakowglogowyou2pilanysamailwrocinfoagroautobeepshoppriviqhslapypiszlodzcfolksecommerce-shopmazurypulawyskoczowrzeszowpomorskiezgierzkaliszolkuszlowiczostrowiecsosnowiecmazowszewodzislawbialowiezazgorzeleckatowicepabianicejelenia-gorawolominkarpaczsieradznowarudaczeladzkonskowolaskierniewiceswinoujscieturystykabieszczadycieszynketrzynolsztynbialystokbabia-goraprochowicewarszawastalowa-wolapolkowicegorlicegliwiceponiatowalimanowalubartowaugustowkobierzyceopocznognieznoszczytnokolobrzegshoparenapodhalebielskoklodzkostargardatwithplayitownnamecoorgnetedugovacorgcomproestnetedugovbiznameislaprofinforechtngrokmedaaaacacpaenglawjurbarbarsykeeneticavocatacctcloudnsorgcomsecplonetedugov123paginaweborgcomnetintedugovnomepublidkinbarsygovx443cloudnsorgmilcomnetedugovcooporgmilcomschnetedugovnamecomcannetlibassoaemclantmcontstoreorgcomnomrecwwwbarsyfirminfoshopartsstackitmyddnswebspacelima-cityacincooxorgedugovbarsybrendlyhbvpsvpsspectrumlandinghostingacppmordoviamcprecbgorgmilcomspbnetintedumsknovgovbirrasmcdirmytismircloudvladimirnalchikadygeyamarinepyatigorskmyjinobashkiriaeurodirvladikavkazna4ugroznykustanaikalmykiacldmaildagestaniranbuildcloudcanvaliaravalwixdevelopmentappwritemigrationneedleverceldatabasestackitcodereplravendbonporterlovableaccoorgmilnetgovcoopmedorgcompubschnetedugovservicemecomygovorggovtvmedorgcomnetedugovinfoedgfacbmlonihkutwpsryxzbdtmacfhppmyspreadshopbrandpartiorgcomfhvpress123minsidaitcouldbeworlanbibkommunalforbundfhskiopsyskomvuxkomforbnaturbruksgymnloginlineorgcomnetedugovenscaledeuusentsurgebotdaorgmilcomnetgovnowteleporthashbangplatformlovablebarsyshopwarebasehoplixbarsyonlinemsf5gitpagewawamscofigma-govcaffeinefigmacanvasoltstscwputerbarsysupportchatgptsquareomniweopensocialcpanelplaycodenotionnovecorewpsquaredpreviewjelecyonbyensrhtfastvpspieboxconvexjouwwebheyflowplatformshloginlinemadethissourcecraftclouderaorgorgcomartedugouvunivmeorgcomnetedugovsurveysstatichfheiyuxs4allprojectmyfastubervibehostapp-ionosdeployagentmecoorgcomschnetedugovbizcncostoreorgmilcomneteduembaixadaconsuladokiraranohoprincipesaotomeheliohobarsystorebaseshopwaresellfyaiabkhaziavologdamordoviapenzalenugsochinavoiexnetspbmsknovnorth-kazakhstanashgabadkareliaarmeniageorgiavladimirnalchikivanovobukharaadygeyakhakassiakalugakrasnodarjambylaktyubinsktroitskbryanskobninskkurganazerbaijanpokrovskbashkiriatselinogradvladikavkazmurmansktulatuvamangyshlaktashkentchimkentgroznykaragandatermezarkhangelskkustanaikalmykiabalashoveast-kazakhstankaracoldagestantogliattibarsyredorgcomgobedumirenaccoorgjelasticdiscoursecleverappsschacmiincogoornetonlineshopcogoorgmilcomwebnicnetintedugovbiznametestcoorgmilcomnomnetedugovorangecloudpersoindorgcomfinnatnetgovensmincomtourismintlinfox0611oyaorgmilcomnetedugovquickconnectvpnplusnettprequalifymeaddrmyaddrntdllwadlnctvavdrk12orgmilpolbeltelcomwebgennetedutskkepgovbbsbiznameinfocoorgmilcompronetedugovbiznameinfobetter-thanworse-thansakurafromdyndnson-the-webmymailerorgmilurlcomneteduidvgovmydnsgameclubebizmeneacsccogotvorhotelmilmobiinfovodteiflgplkmsmsbcckhincndnvncoztltmkckppzpdprvcvkvlvcrkrkscxuzchernovtsyrivneyaltaodesavolynrovnolutskltdinforgcomnetedugovbizvinnicazhitomirternopilpoltavakropyvnytskyizaporizhzhiasevastopolsebastopoluzhgoroduzhhorodkharkovkharkivvinnytsiakhmelnytskyizaporizhzhecrimeaodessazhytomyrnikolaevcherkassydonetskluganskluhanskkirovogradivano-frankivskchernivtsikrymkievkyivlvivsumyzakarpattiamykolaivcherkasychernigovkhersonchernihivdnipropetrovskdnepropetrovskkhmelnitskiyneacsccogoorusorgmilcomedugovmyspreadshopadimono-ipbarsybarsyonlinelayershiftnh-servretrosnubapicampaignservicelugaffinitylotteryweeklylotteryraffleentrygluglugsmeaccoindependent-inquestnimsitecopropymntltdorgplcschnetgovnhsbarsyindependent-commissionindependent-reviewpolicepublic-inquiryindependent-panelconnhospindependent-inquiryroyal-commissionoraclegovcloudappscck12libaws-govccphxcclibpvtparochchtrcck12libcceatonk12coglibtecgendstmusann-arborwashtenawcck12glghcck12sealibforksolympiabainbridge-islkeyporthoquiamyarrow-pointcentraliaport-townsendsequimport-ludlowrentonsilverdalebremertonredmondsheltonbellevueport-orchardport-angeleskingstonchehalisaberdeengig-harborseattlepoulsboidmdndsddemenegacalamaiavawapailalflnmdcncscohnhmihiviwiriinmntnmocoutvtctmtgunjokakwvnvprarorasmskstxwynykyazisadninsnngosrvis-bymircloudservernamepointtoenscaledland-4-salefreeddnsstuff-4-saleazure-apinoipdatabricksappscloudnsgolffanheliohostazurewebsitesgvorgmilcomgubneteducoorgcomnetd0egvorgmilcomnetedugovmydnsiacostoree12orgmilcomnomwebgobbibrectecnetintedugovraremprendefirminfoartseducok12orgcomnethidnsidacaiiosonlahanamhanoicamauhueorgcompronetintedugovbizbacninhtayninhhoabinhnamdinhtravinhhaiphongvinhlonghaiduongquangnamquangtrithuathienhuequangninhbacgianghaugiangquangbinhsoctrangbentrethanhphohochiminhdanangkontumhatinhkhanhhoathanhhoahealthgialailaocaiyenbaibackanngheanlonganphuyenphuthocanthodaklakdongnainameinfovinhphucdongthapkiengiangtiengiangquangngailaichaulangsonlamdongdaknonghagiangangiangcaobangbinhduongninhthuanbinhthuanbaclieuthaibinhninhbinhbinhdinhtuyenquanghungyenbaria-vungtauthainguyendienbienbinhphuocschbizputerimagine-proxyorgcomnetedugovcloud66advisormypetsdyndnsxn--8dbq2axn--4dbgdty6cxn--5dbhl8dxn--hebda8bxn--80auxn--d1atxn--c1avgxn--o1acxn--o1achxn--90azhxn--55qx5dxn--uc0atvxn--od0algxn--wcvs22dxn--gmqw5axn--mxtq1mxn--12c1fe0brxn--h3cuzk1dixn--12co0c3b4evaxn--12cfi8ixb8lxn--o3cyx2axn--m3ch0j3axn--j1adpxn--90amcxn--90a1afxn--h1ahnxn--j1ael8bxn--h1alizxn--c1avgxn--j1aefxn--80aaa0cvacxn--41acaffeineexeopentunnelbotdashtelebitorgtmaccoagricorgmilnomwebnicngonetaltedugovlawnisschoolgrondaraccoorgmilcomschnetedugovbizinfoprg1-zeropstritonstackitlimazeropsaccoorgmilgovяспборгкоммскбизмирсамаракрымсочиакодпроргобрупрצהלממשלישובאקדמיהองค์กรธุรกิจรัฐบาลศึกษาทหารเน็ต教育網絡組織公司政府個人닷넷한국澳门新闻澳門联通家電嘉里招聘通販닷컴삼성コムგეбгрфеюadcdbdgdidmdsdtdaebedeeegeiejekemenepereseveyegabacalamanauavapaqasazacfbfafgfnfpfwftfbgcgagggegkgngmgsgpgvgtgugilmlnlalclglplsltlhmimjmkmmmomambmcmdmfmgmzmpmsmtmgbbblbsbecccacnclcmcvctcscmhkhghchbhthphshlinikifigiaibicivisikninhnmncnbngnsnpnvntnjoionomobocoaofodorosotoptstttytatbtetgtithtmtltrusuvuaucueuguhulumunufjdjbjtjsjlkmkhkfkdkcktkukskpkgpmpnpkpjpgqaqmqiqsvtvcvbvmvlvrwpwtwzwbwcwawgwkwmwtrsrprgrfrercrbrarnrmrlrkrirhrwsusrssspsgsesbsaslsmsissxmxaxcxuypysylymykygybycyuztzsznzmzkzdzczbzazελευ世界台灣购物公益点看臺灣网络書籍在线网站手机机构大拿游戏信息台湾谷歌慈善商标香港中国餐厅网址中國商城食品微博政务移动集团公司八卦商店健康网店政府时尚佛山中信娱乐广东企业homedepotengineeringاماراتrepublicankuokgroupversicherungchannelcitadelxn--pgbs0dhxn--b4w605ferdstatebankwebsitexn--mgb9awbf亚马逊淡马锡alibabaxn--ngbc5azdxn--mgbbh1axn--45br5cyltoshibabuildworldcloudtradeguideplacespacedancemoviephoneprimesmilebiblestyleappleazurestoreskypegripexn--l1accdrivelottehorsehouseleasechasereisestadahondaomegaaetnaamicaninjanokiamediadeltavodkaedekaosakapizzaslingemailgmailtirolshelltmallfinallegaltotalhotelamfamforumrehabmusicciticricohcoachwatchboschearthfaithirishmiamiarchidubaiguccipraxiみんなストアセールcanonsalononionnikonepsonkoelngreensevencrownikanoradioaudioweiboglobopromogalloyahoociscorodeovideomangobingotokyovolvolottokyotophotosmartsportquesttrusthyattjetztadultcymrubaidutushuxn--kprw13dubankclickblackmerckgroupsharpcheapnowtvxn--h2brj9cקוםհայоргсрбмонкомбелмкдқазрусукрمصرقطرعربكومdadcfdmedwedredphdthdbidpidkrdmsdltdiceonewmeglemoerwecfageacbanbambaaaammakianraspacpaaxawtfbcgaegongingaigvigorgdogdhlmilrilonlaolloluoljllcalgalnflafltelsrlfrllplkimibmcamcombommomifmabbjcbscbwebcabnabtabmlbpubabcbbcnecincpncllcstcwtcpwcnyckfhbzhovhmoiskiobisbitcifyituipinvinwinxincbnbcnmanfangdnmenrenkpnmtnyunrunfununobiojioriohbogmofooboooooacoecoceongoproartistottnttbbtcateatlatvetpetbetnethktmitfitintjothotgotdotbotprueduicujnjyouinknhktdkappsapgapmapdnptopgopllpjmpzipvipripesqtrvdtvitvdevmovgovhivnrwlawsewnewbmwwownowhowdvrftrmtrsfrbarcartvscrseusawsupsubssbsadsddsldssasbmsmlsxxxboxfoxgmxtjxsextaxbuyflydiysoyjoyskypaydaygayxyzanzbizwebersenerpokerlameractortatarsolarລາວคอมไทยtourslocusnexuslexusgiftsbeatsboatspartspressglassswissकॉमनेटtiresgivescodeshomesgamestunesshoescardswalesloansvegastoolsdealsautosparisファッションworkssucksrocksxeroxforexfedexpartylillymoneystudyrugbytoraytoday中文网xn--unup4y天主教飞利浦新加坡enterprises我爱你嘉里大酒店christmasxn--fct429kholdingsxn--8y0a063axn--mgbx4cd0ablifestyleabogadoallstatenetbankكاثوليكxn--s9brj9cxn--gk3at1ebestbuycharityxn--55qx5dmicrosoftpropertybasketballhomegoodscorsicajewelrygallerygrocerysurgerycountrybrusselsverisignferreroxn--czr694bhdfcbankcommbanksoftbankپاكستانپاکستانnextdirectالسعوديهالعليانxn--h2brj9c8cxn--80adxhksshikshaxn--mgbai9azgqp6jcuisinellabarclayscatholicxn--kpry57dcompanyxn--xhq521bblackfridayxn--mgba3a3ejtsandvikxn--d1acj3bacademydownloadمليسياxn--j1amhxn--w4r85el8fhu5dnraipirangaathletaxn--fhbeixn--mgbqly7cvafrzuerichxn--c2br7gஇலங்கைcontractorsxn--io0a7igraphicsinsurancetemasekxn--xkc2al3hye2amotorcyclesphotographydirectoryplumbingxn--vhquvclothingtrainingcleaningwilliamhilllightingxn--mgba3a4f16ashoppingcateringeducationokinawapicturesventuresproductionsxn--9et52uwalmartഭാരതംsupportrealestatecapitalonexn--nqv7fs00emaauspostfloristdentistxn--qxamgodaddybradescobargainsmitsubishikerryhotelsxn--9dbq2axn--3pxu8kimmobilienxn--fjq720axn--mgbtx2bholidaymckinseymadridbusinessbuildershelsinkixn--4gbrimмоскваالسعودیةcoffeedegreelacaixapartnersalsaceofficeabbvievoyageorangegeorgeonlinechromemobilekindlegoogleoraclecircleschulesecureinsurexn--mgba7c0bbn0aestatexn--mgbc0a9azcgcruisehangoutxn--vuq861bxn--42c2d9arexrothfirestoneuniversityxn--nnx388alifeinsuranceextraspaceонлайнvermögensberatersoftwarexn--fiqs8sxn--mgbab2bdxn--w4rs40ltiendaभारतम्africatoyotaotsukasakuracameracreditcardnagoyaconsultingnetworktheatermonsterprogressivepioneerxn--55qw42gracingdatingvotingvikinglivinggivingxn--bck1b9a5dre4cbrotherweatherjoburgفلسطينlplfinancialxn--clchc0ea0b2g2a9gcdfutbolschoolsocialglobaldentalwoodsidechanelairtelmatteltravelrealtorwebcamstreamభారత్unicomalstomxn--nodexn--6frz82gmuseumfurniturexn--rvc1e0am3exn--mix891faccenturexn--11b4c3dismailineustardiscountquebeccomsecclinicservicesxn--y9a3aqxn--c1avgswatchchurchsearchالاردنmarketingcontacthealthmonashshoujisanofitaipeiamericanexpresssuzukiアマゾンクラウドポイントbhartiグーグルxn--mgberp4a5d4armemorialxn--1qqw23alondonmormoninstitutevisionbostonnortoncouponmaisonamazonvirginberlindesigndurbanolayannissananquanxihuanhitachikaufengardenreisenbayerntechnologydatsunxn--90a3aclatinocasinostudiophysioxn--ngbe9e0apharmacytattootaobaoaramcoexpertreportabbottdirectselectimamatfairwindspictettargetmarketintuittravelersinsurancecreditdupontryukyusuppliesxn--tckwebnpparibasschmidtmerckmsdyodobashirestaurantbridgestonecricketxn--fpcrj9c3dbostikbroadwayattorneylefrakemerckxn--fiq228c5hscareersfarmerswinnersflowersxn--wgbh1cguitarsxn--54b7fta0ccxn--p1acfmakeupgalluplandroverxn--kcrx77d1x4agoldpointbauhausxn--mgbayh7gpahiphopplaystationxn--mgba3a4fraxn--eckvdtc9dhyundaixn--gckr3f0fistanbulticketsmarketsflightschintaireviewsxn--3e0b707ewindowsxn--fiqz9sfinancialxn--fzys8d69uvgmابوظبيdiscoverreviewবাংলাxn--5su34j936bgsgmoscowobserverapartmentsдетиارامكوсайтeurovisionxn--i1b6b1a6a2exn--xkc2dl3a5ee0hتونسموقعبارتڀارتشبكةعمانبيتكعراقreadkredbondlandbandfundfoodprodgoldfordtubecafesafelifeggeeieeefreefagepagegugezonewinememenamegamesaleablebikenikelikecarecbreherefiresaveloveliveblueartedatesitevotecaseluxebofamodaltdaasdatiaayogasinavanashiaasiajavabbvatevavivadatazaraarpacasavisasncfprofmaifsurfgolfdvagsongbingpingwangkpmggoogblogpohlfailcooldellcalldeallidlsarlfilmteamroomfarmimdbarabclubhdfcicbchsbcgmbhrichtechfishdishcashminiernikddiaudiwikimobitaxicitikiwidesiqponskinloanakdnwienopenporncerntownimmolimoolloinfonicofidolegosaxozeroaerovivoautovotomotofastbestresthostpostnextlgbtchatseatgiftmeetdietreitmintrentgentspotscotguruitausohumenucyoubanklinkpinkdclktalksilkbookseekworkrsvpaarpjeepshopcoophelpcamppccwshowbeerstarruhrflirweirhaircarsparsjprshausplusnewstipstoysjobskidsfanspicsdocsxboxamexsexynavycitysonyarmyallybabyplaydeliverybuzzgbizlamborghiniphilipsලංකාಭಾರತfitnessexpresslanxesspfizercenterwalterlawyersoccercareerkosherbrokerlockerdealerdoctorauthorxn--mgbqly7c0a67fbcvermögensberatungjaguarxn--pssy2uxn--hxt814eflickrrepairrogersairbusxn--mgbai9a5eva00beventsyachtsxn--t60b56aভাৰতভারতभारतभारोतviajeshermeshughesxn--j1aefसंगठनvillasଭାରତclaimshotelsભારતzapposphotosjuegoscondostatamotorsgratistennisਭਾਰਤtkmaxxtjmaxxschaeffleryandexxn--80aswgrealtysafetybeautyluxuryxn--3ds443gsupplyfamilyxn--o3cw4hhockeysydneyxn--90aenissayalipayenergycomputeragencyxn--rovu88b電訊盈科xn--gecrj9cstatefarmaccountantaquarelleolayangroup香格里拉xn--p1ai组织机构xn--1ck2e1bxn--mgbt3dhdschwarzموريتانياabudhabinowruzkomatsufujitsuhospitalxn--80asehdbxn--mgbtf8flxn--j6w193gxn--yfro4i67oprudentialxn--flw351ecruisescoursesrecipesxn--e1a4cferrarixn--ses554gxn--wgbl6awatchesstaplessinglesxn--mgbcpq6gpa1axn--otu796dpropertiescreditunionxn--mgbah1a3hjkrdstockholmhisamitsuالسعوديةstcgroupdomainsoriginscouponsbloombergclubmedfroganslimitedxn--80aqecdr1aexposedinternationalequipmentbarclaycardxn--q7ce6axn--mgbi4ecexpprotectionassociatesconstructionxn--cck2b3bxn--45q11candroidfoundationישראלxn--mgbca7dzdocliniqueboutiqueengineerxn--qxa6asystemsfirmdalefashionauctionxn--nqv7finfinitirentalsreliancetradingweddingfishinghostinggentingbookingcookingxn--3hcrj9cgraingerxn--czrs0tdemocratsamsungyokohamaxn--h2breg3evexn--nyqy26alundbeckmelbournevacationssolutionsfrontierxn--vermgensberatung-pwbmanagementxn--cg4bkixn--mgb2ddeslincolnhamburgsandvikcoromantblockbusterairforcebarefootxn--4dbrk0ceinvestmentsfeedbackcommunityxn--ngbrxالبحرينdiamondsamsterdamhealthcareredumbrellaxn--mxtq1mxn--2scrj9cagakhanxn--mgbpl2fhкатоликcaravanசிங்கப்பூர்richardlimortgageamericanfamilyxn--fzc2c9e2cscholarshipssaarlandxn--imr513nvlaanderensamsclubgoodyearkitchenஇந்தியாweatherchannelallfinanzxn--kput3iالسعودیۃxn--90aisxn--efvy88hالجزائرxn--mgbaam7a8hexchangejpmorganxn--tiq49xqyjfidelitysecurityxn--mk1bu44cwanggouxn--fiq64bxn--6qq986b3xlxn--mgbbh1a71exn--80ao21amarshallsxn--5tzm5gtravelerspanasoniclatrobeyoutubeaccountantsxn--rhqv96gxn--cckwcxetdanalyticsxn--ygbi2ammxبازاربھارتسوريةorganicfreseniusسورياxn--9krt00axn--qcka1pmcxn--jlq480n2rgdeloittesciencefinancexn--jvr189mxn--30rr7yhomesensehotmailbaseballfootballleclercboehringerxn--q9jyb4cxn--mix082fاليمنهمراهpolitieسودانايرانایرانnetflixyamaxunxn--lgbbat1ad8jcollegestoragecapetowncolognekerrypropertiesxn--mgbgu82axn--ogbpf8flxn--czru2dwhoswhociprianilasallexn--g2xx48cforsalebanamexaudiblexn--vermgensberater-ctbxn--zfr164bericssonvanguardxn--45brj9cindustriestheatremarriottxn--3bst00mcomparexn--mgberp4a5d4a87gcapitaldigitalالمغربbarcelonashangrilaxn--d1alfcalvinkleinwwwcitysapporokawasakinagoyasendaikobekitakyushuyokohamackjp".charCodeAt(offset) === 42) wildcardEdge[node] = edge;
	offset = end;
}
var matchNode = -1;
var matchStart = 0;
var matchEnd = 0;
/**
* True if edge `edge`'s label equals `hostname[start, start + length)`.
*/
function labelEquals(edge, hostname, start, length) {
	if (edgeLength[edge] !== length) return false;
	const offset = edgeOffset[edge];
	for (let i = 0; i < length; i += 1) if ("orgmilcomschnetedugovdrrformsfeedbackofficialaccoorgmilschnetgovmagazinemediaunioncargopilotgroupcaarespressworksaerodromeworkinggroupair-traffic-controlaircraftaccident-preventioneducatormarketplaceambulanceinsurancecateringairportrepbodyenginesoftwaremodellingair-surveillanceconsultingchartertrainermaintenanceservicesdesignflightskydivingfreightassociationstudentgroundhandlingdgcafuelclubtaxicrewshowballooningexpresstraderbrokerauthoragentsairtrafficjournalistsafetyconsultantmicrolightaccident-investigationparachutingequipmentproductionfederationrecreationscientistnavigationengineertradingglidingleasingresearchpassenger-associationentertainmentparaglidinghangglidingaerobaticrotorcraftemergencycertificationgovernmentaeroclubexchangelogisticschampionshiphomebuiltcouncilconferencecontrolairlinecivilaviationjournalorgcomnetedugovcoorgcomnomnetobjofforgcomnetuwukiloappsframerorgmilcomnetedugovcoradioorgcomnetcommuneedogpbcoitgvorgedugov*spreviewfrontendrelayononstagingupid*mtls*privatelinktypedreamdeveloperbravemochawindsurfaivenmirenupsunwnextbegetngrokclerkwale2bwebcsbrunputerflutterflowspawnbaseshiptodaymagicpatternsnetlifyondigitaloceanrailwayhostedclaudehasurabotdashretoolvercelgithubluyanigadgetreplitcloudflaretelebitedgecomputeevervaultexponyatnoopencrpplxzeaburwasmerframerzeropsrocketpreviewconvexmedusajsspritesonherculeseasypanelstreamlitglideossnowflakemesserliloginlinehackclubcodepennorthflankbase44corespeedleapcellngrok-freeclerkstagelovableon-fleek*us-west-3ap-south-2us-central-2us-central-1eu-central-1ap-south-1us-west-2us-east-2eu-north-1ap-north-1us-west-1us-east-1*rcloudintsegorgmilcomgobbetnetintedugovturmusicasenasamutualcoopip6uriurnin-addre164homeirisgovdixdaemoncloudnssthwien*inexexkunden4accogvormymyspreadshop4lima2ixortsinfofuturecmsfuturehosting12hpprivfuturemailinglima-cityfunkfeuer123webseitednshomemelmyspreadshopcloudletswasantqldvicactnswtascatholicwasaqldvictasidwasantozqldorgcomvicasnactnetedugovnswtasconfcomairflowlambda-urltransfer-webapptransfer-webappairflowtransfer-webapptransfer-webapp-fipstransfer-webappeu-west-3ap-south-2eu-south-2eu-central-2ap-southeast-3ap-southeast-4ap-northeast-3eu-central-1mx-central-1me-central-1ca-central-1il-central-1ap-northeast-1ap-southeast-1me-south-1af-south-1eu-south-1ap-south-1ap-southeast-7us-west-2eu-west-2ap-east-2us-east-2eu-north-1ap-southeast-2ap-northeast-2ap-southeast-5us-gov-west-1us-gov-east-1ap-southeast-6ca-west-1us-west-1eu-west-1us-east-1ap-east-1sa-east-1privatenotebookstudiolabelingnotebookstudionotebooknotebook-fipslabelingnotebookstudionotebook-fipsnotebookstudio-fipsnotebook-fipsnotebookstudionotebook-fipsnotebookstudioeu-west-3ap-south-2eu-south-2eu-central-2ap-southeast-3ap-southeast-4ap-northeast-3eu-central-1me-central-1ca-central-1il-central-1ap-northeast-1ap-southeast-1me-south-1af-south-1eu-south-1ap-south-1us-west-2eu-west-2us-east-2eu-north-1ap-southeast-2ap-northeast-2experimentsus-gov-west-1us-gov-east-1ca-west-1us-west-1eu-west-1us-east-1ap-east-1sa-east-1onrepostsagemakercopporgmilcompronetintedugovbiznameinfoshoprsorgmilcomnetedugovbrendlyresolvenzauscotvstoreorgcomnetedugovbizinfoidacaicoittvorgmilcomschnetedugovinfocloudezproxysiteacmymyspreadshopkuleuvenwebhostingtransurl123websitecloudnsinterhostsolutionsddns5476103298edgfacbmlonihkjutwvqpsryxzbarsycoororgcomedumyftpno-iporxcloud-ipfor-somemmafanfor-morewebhopselfipjozidyndnscloudnsdscloudfor-thefor-betteractivetrailcoeconorestooteorgcomeconeteduassurmoneyafricaarchitectesrestaurantloisirstourismavocatsinfoagrounivcoorgcomnetedugoviatvdeportesaludtksatorgmilcomwebgobnetinteducienciaboliviarevistacooperativaempresanombreindustriamusicapatriamedicinademocraciapoliticapuebloindigenaplurinacionalarteblogwikiinfoagrotransportenoticiasprofesionalacademiaeconomiaecologiamovimientotecnologianaturalsimplesitecepesebamapadfmgalampbacscpirngorotomtrjspaprrprrsesmscepesebamapadfmgalampbacscpirngorotomtrjspaprrprrsesms*biaamfmtcmptvfeirasampajampanatalbelemananiradiog12medindfndbmdtrdthepoaggfjdfdefinfenflegsegongengcngorgzlgslglogppgmillelqslcimcomnomadmjabimbbibbsbabcrectecsjcetcpscpvhudieticriapipsiecnbiorioecogeoteoodoproatoartfstmatvetdetbetnetcntnotfotgrueduajuespappreptmpemparqsrvadvdevgovntrturagrjorfarjusmusdesvixxyzcozfozslzbhzmaringasantamariacampinagrandegoianiasorocabafloripasaobernardocuritibaboavistarecifeaparecidasaogoncasalvadorcuiabamorenamacapalondrinacontagemsocialfortalmaceioleilaoosascoriobranconiteroi9guacutcheblogflogvlogwikitaxicoopmanauspalmascaxiasjoinvillebaruericampinassantoandreribeiraoriopretoweorgcomnetedugovv0windsurfshiptodaycloudsitecoaccoorgnetgovofmilcomgovmediatechzacoorgcomnetedugsjgovmydnspenfnlabnbmbgcbcqconcontnuyksknsmyspreadshopno-ipawdevboxbarsyonidatemfuinabusavinstanceseceuguukussryzespawncsxcloud-ipmyphotosfantasyleaguetwmailcleverappsscrappingccwucloudnsftpaccessgame-serverccgovobjectsrmalpgcust*svcalp1aeappenginermalpgmyspreadshop4lima2ixsquare7cloudscale123websitefirenet12hpflowgotdnslinkyard-cloudcloudnslima-citydnskingobjectstorageedaccogoorusorgcomnetinteduaéroportxn--aroport-byaassogouvcomilgobgovcloudnses-1eu-west-1us-east-1euvipit1eurarubait1s3lbwebsites3websiteru-spbru-mskelasticcsrunstnukukcaukusnl-ams-1fr-par-1fr-par-2functionsnodess3ddlwhmrdbfnck8sifrs3-websitecockpitscblmgdbdtwhkafkpubprivs3ddlwhmrdbk8sifrs3-websitecockpitscblmgdbdtwhkafks3ddlrdbk8sifrs3-websitecockpitscblmgdbdtwhkafkk8sscalebookpl-wawfr-parnl-amsbaremetalsmartlabelinginstancesdechk2kuleuvenlaravelvoorloperurownoxazapscwhstgrvaporonline-serverobservablehqelementorantagonistreclaimjoteluluencowaydiademjelasticmatlabmagentositetrendhostingaxarnetjenv-arubajelejoteravendbemergenttrafficplexconvexkeliwebserveboltbegetcdnstaticson-rancherprimetelonstackitunison-servicesdnshomelinkyardbarsyjelecloudnscocomnetgovmycn-northwest-1cn-north-1s3s3-accesspoints3-websites3s3-accesspointrdsdualstacks3-deprecatedemrappui-prods3-websiteemrstudio-prods3-object-lambdaemrnotebooks-prodexecute-apis3s3-accesspoints3s3-accesspointrdsdualstackemrappui-prods3-websiteemrstudio-prods3-object-lambdaemrnotebooks-prodexecute-apicn-northwest-1cn-north-1cn-northwest-1ebcomputeelbcn-north-1airflowcn-northwest-1cn-north-1oncn-northwest-1cn-north-1amazonawssagemakeramazonwebservicesdirectasgdsdhehahljlnmhbacscahqhshhihnlnynsnmofjbjzjxjtjhkcqtwgsjssxnxjxgxxzgz網絡网络公司orgmilcomnetedugovxn--55qx5dcanva-appsxn--io0a7iquickconnectcanvasitekhsjxn--od0algcanva-codemyqnapcloudsrvrlessclustersrealtimestorageleadpagescarrdcrdorgmilcomnomnetedugovhidnssupabaserdpareplmypiumsoxmitotaplpagesfirewalledreplitowodevwebview-assetsvfswebview-assetss3s3-accesspointdualstackemrappui-prods3-websiteaws-cloud9emrstudio-prods3-object-lambdaemrnotebooks-prodexecute-apicloud9eu-west-3ap-south-2eu-south-2eu-central-2ap-southeast-3ap-southeast-4ap-northeast-3eu-central-1me-central-1ca-central-1il-central-1ap-northeast-1ap-southeast-1me-south-1af-south-1eu-south-1ap-south-1ap-southeast-7us-west-2eu-west-2us-east-2eu-north-1ap-southeast-2ap-northeast-2ap-southeast-5ca-west-1us-west-1eu-west-1us-east-1ap-east-1sa-east-1s3s3-accesspointdualstackemrappui-prods3-websiteaws-cloud9emrstudio-prods3-object-lambdaemrnotebooks-prodexecute-apicloud9consent-portals3s3-accesspointdualstackanalytics-gatewayemrappui-prods3-websiteaws-cloud9emrstudio-prodbedrock-agentcores3-object-lambdaemrnotebooks-prodexecute-apicloud9s3s3-accesspointdualstackemrappui-prods3-websiteemrstudio-prodbedrock-agentcores3-object-lambdaemrnotebooks-prodexecute-apis3s3-accesspointdualstackemrappui-prods3-websiteemrstudio-prods3-object-lambdaemrnotebooks-prodexecute-apis3s3-accesspointdualstacks3-deprecateds3-websitebedrock-agentcores3-object-lambdaexecute-apibedrock-agentcores3s3-accesspoints3-websites3-accesspoint-fipss3-fipss3s3-accesspointdualstackemrappui-prods3-websites3-accesspoint-fipsaws-cloud9s3-fipsemrstudio-prodbedrock-agentcores3-object-lambdaemrnotebooks-prodexecute-apicloud9s3s3-accesspointdualstackemrappui-prods3-websites3-accesspoint-fipss3-fipsemrstudio-prods3-object-lambdaemrnotebooks-prodexecute-apis3s3-accesspointdualstackemrappui-prods3-websiteaws-cloud9emrstudio-prodbedrock-agentcores3-object-lambdaemrnotebooks-prodexecute-apicloud9s3s3-accesspointdualstackemrappui-prods3-websiteaws-cloud9emrstudio-prodbedrock-agentcores3-object-lambdaemrnotebooks-prodexecute-apicloud9s3s3-accesspointdualstacks3-deprecatedanalytics-gatewayemrappui-prods3-websiteaws-cloud9emrstudio-prodbedrock-agentcores3-object-lambdaemrnotebooks-prodexecute-apicloud9vfss3s3-accesspointdualstackemrappui-prods3-websiteaws-cloud9emrstudio-prods3-object-lambdaemrnotebooks-prodexecute-apicloud9eu-west-3ap-south-2eu-central-2ap-southeast-3ap-southeast-4ap-northeast-3eu-central-1mx-central-1me-central-1ca-central-1il-central-1ap-northeast-1us-northeast-1ap-southeast-1me-south-1af-south-1ap-south-1ap-southeast-7us-west-2eu-west-2ap-east-2us-east-2ap-southeast-2ap-northeast-2ap-southeast-5us-gov-west-1us-gov-east-1ap-southeast-6ca-west-1us-west-1eu-west-1us-east-1ap-east-1sa-east-1mrapaccesspoints3s3-accesspointdualstacks3-deprecatedanalytics-gatewayemrappui-prods3-websites3-accesspoint-fipsaws-cloud9s3-fipsemrstudio-prodbedrock-agentcores3-object-lambdaemrnotebooks-prodexecute-apicloud9s3s3-accesspointdualstacks3-deprecatedanalytics-gatewayemrappui-prods3-websites3-accesspoint-fipsaws-cloud9s3-fipsemrstudio-prodbedrock-agentcores3-object-lambdaemrnotebooks-prodexecute-apicloud9s3s3-accesspointdualstackemrappui-prods3-websites3-accesspoint-fipss3-fipsemrstudio-prodbedrock-agentcores3-object-lambdaemrnotebooks-prodexecute-apis3eu-west-3ap-south-2eu-south-2computes3-ap-northeast-2elbrdss3-ap-east-1s3-sa-east-1s3-us-gov-west-1s3-eu-central-1s3-ca-central-1eu-central-2ap-southeast-3ap-southeast-4ap-northeast-3s3-website-us-west-2s3-website-eu-west-1s3-external-1eu-central-1me-central-1ca-central-1il-central-1s3-us-west-1s3-eu-west-1s3-website-sa-east-1s3-website-ap-southeast-2ap-northeast-1ap-southeast-1s3-us-west-2s3-eu-west-2me-south-1af-south-1eu-south-1ap-south-1ap-southeast-7us-west-2eu-west-2us-east-2s3-website-ap-southeast-1s3-1s3-globals3-ap-northeast-3eu-north-1airflowap-southeast-2s3-us-gov-east-1s3-fips-us-gov-east-1s3-me-south-1s3-ap-south-1ap-northeast-2s3-website-us-west-1ap-southeast-5s3-eu-north-1s3-ap-southeast-1s3-website-us-gov-west-1compute-1s3-eu-west-3us-gov-west-1s3-website-ap-northeast-1us-gov-east-1s3-fips-us-gov-west-1s3-website-us-east-1s3-ap-southeast-2ca-west-1us-west-1eu-west-1us-east-1ap-east-1sa-east-1s3-us-east-2s3-ap-northeast-1authauthauth-fipsauth-fipseu-west-3ap-south-2eu-south-2eu-central-2ap-southeast-3ap-southeast-4ap-northeast-3eu-central-1mx-central-1me-central-1ca-central-1il-central-1ap-northeast-1ap-southeast-1me-south-1af-south-1eu-south-1ap-south-1ap-southeast-7us-west-2eu-west-2ap-east-2us-east-2eu-north-1ap-southeast-2ap-northeast-2ap-southeast-5us-gov-west-1us-gov-east-1ap-southeast-6ca-west-1us-west-1eu-west-1us-east-1ap-east-1sa-east-1eu-west-3eu-south-2ap-southeast-3eu-central-1ca-central-1ap-northeast-1ap-southeast-1ap-south-1us-west-2eu-west-2us-east-2eu-north-1ap-southeast-2ap-northeast-2ap-southeast-5eu-west-1us-east-1ap-east-1sa-east-1csrframeservicesbuilderstg-builderdev-builder*ociocpocsazuregcpawsdemoinstanceeu-west-3ap-south-2eu-south-2eu-central-2ap-southeast-3ap-southeast-4ap-northeast-3eu-central-1me-central-1ca-central-1il-central-1ap-northeast-1ap-southeast-1me-south-1af-south-1eu-south-1ap-south-1ap-southeast-7us-west-2eu-west-2us-east-2eu-north-1ap-southeast-2ap-northeast-2ap-southeast-5us-gov-west-1us-gov-east-1ap-southeast-6ca-west-1us-west-1eu-west-1us-east-1ap-east-1sa-east-1previeweu-4us-4us-1eu-1us-2eu-2us-3eu-3appss3-websitekrkrobjectprivateobjectkrkrskrkrsobjectkrprivateobjectkr-privatecomputepaasrag-cloudrag-cloud-chjcloudjcloud-ver-jpcdemonodebalancermembersipeuxvsoncillaocelotonzayalilynxsphinxfentigercustomercaracalsgkrobjectstoragedesgkrusobjectkrkr-naverkr-naver-devkrprivatewebsiteobjectkr-naverkr-privatekr-naver-devjpjpkrjp4jp5s3-website-jpjpkrjp4jp5objectprivateobjecto365cloudstaticxendevapp001testcode-builder-stgplatformmediasiteprojedrydpagesjsx0desazacncoitrueu4uhkukgrbrushatenadiarymyspreadshopfrom-flfrom-wvwebspace-hosttheworkpchatenablogcursorusercontentservesarcasmapplinzisakuratanwixsitefin-ncloudstoragegov-ncloudstorageappchizigiizeis-into-carsdnsiskinkyadobeaemcloudis-a-therapistpgfogmyvncdojinis-an-actress1kappfldrvkozowqa2jpnmexprgmrfirewall-gatewaydynnscafjsfbsbxooguyfrom-gawoltlab-demois-a-anarchistwiardwebteaches-yogadattowebtb-hostinglive-websiteservegamegotpantheonfrom-nhsubsc-payfrom-ohvipsinaappfrom-cadyndns-officehomelinuxfrom-mahercules-appservebbsstreakusercontentfrom-okfrom-wyfastly-terrariumis-a-llamaqualyhqportalserveexchangeon-vaporvivenushopciscofreakgrayjayleaguesmetaaiusercontentfrom-iais-a-libertariansaves-the-whalestaveusercontentyolasiteoperaunitepoint2thisis-a-catererclaudeusercontentlinodeusercontentfrom-vagithubusercontentsells-for-lesshosteurcanva-appsplaystation-cloudddnsfreefrom-pafrom-prfrom-waddnskingoutsystemscloudhotelwithflightmydattois-a-nascarfanmydbserverminiserverdamnserverservehumouris-a-playerfrom-nvfrom-nmemergentagentgentappsamplifyappfrom-kyis-an-accountantnfshostserveircfrom-akpythonanywherestackhero-networkpostman-echolikescandydyndns-mailobservableusercontentserveftpfreeboxosfrom-utcdn77-storageamazonawsneat-urlnclouddyndns-serverlinodeis-a-teacherfrom-vtgleezemythic-beastsus1-pleniteu1-plenitla1-plenitpaywhirlservecounterstrikejdevcloudhealth-carereformis-into-animegoogleapisis-a-painterafricaisa-hockeynutatmetais-an-actora2hostedis-a-democratdatadetectest-le-patrondigitaloceanspacesis-a-designeris-a-hunterlinodeobjectstemp-dnsissmarterthanyoufrom-arsimplesiteevennodetownnews-stagingis-a-liberalgooglecodejelasticservemp3qualyhqpartnerdyndns-free1cooldnsest-a-la-masiondrayddnsdynuddnsfrom-orfrom-miis-a-bloggerfrom-himydobisscanvacodeis-an-engineerest-a-la-maisonupsunappdevinappswafflecellmyasustorwpenginepoweredfrom-ctservep2psame-appmyshopblocksthingdustdatalikes-piediscordsezis-with-thebandlpusercontentis-leetshopitsite3utilitiesis-a-personaltrainersinaappladeskis-a-cheflogoipselfipbase44-sandboxnospamproxyalibabacloudcsmesswithdnsauthgearappsiamallamawithgooglelutrausercontentmochausercontentframercanvasmytabitdyndns-homew-credentialless-staticblitzcpserverdiscordsaysis-a-nurseappspotatlassian-isolated-3premotewdfrom-mtwixstudiocode0emm180rmyactivedirectoryawsappsmytuleapdnsabrpolyspaceqbuserrenderbuiltwithdarkboutirgotdnsabrdnsdopaascanva-hosted-embedawsglobalacceleratorhomesecuritypcmyiphostditchyouripclever-clouddyndns-ipon-aptibleis-a-musicianhosted-by-filessecuritytacticsappspaceusercontenthomeunixstrapiappsame-previewcf-ipfsmycloudnaselasticbeanstalkis-certifieddontexistkasserverik-serverdrive-platformatlassian-3pfirebaseappncpstorageherokuappawsapprunnerbarsycenteris-a-cubicle-slaveservehttpmyshopifyis-a-guruquicksytessiiitesorsitesmagicpatternsappis-a-cpameteorappfrom-wiis-a-rockstarbumbleshrimpdattolocaldatabricksappsreadthedocs-hostedfrom-rifamilydsdyndns-picsplesknsbplaceddnsaliasdynaliasdyndns-remotedoomdnsip-ddnsblogdnsis-a-doctorroutingthecloudamazoncognitobarsyonlinedsmynasddnsgurucloudflare-ipfsdeus-canvasfrom-idsmushcdnpagespeedmobilizerdyndns-at-homeunusualpersonhosted-by-previderis-a-republicandyn-o-saurstreamlitappworkisboringonthewificprapidqualifioappis-uberleetis-slickgetmyipwpdevcloudtypeformdyndns-at-workgentlentapismynascloudw-corp-staticblitzfrom-ingeekgalaxyservebeerfrom-mdonrenderspace-to-rentaivencloudappspacehostedwafaicloudcodespotblogspotatlassian-3p-us-gov-modfrom-ndfrom-msis-a-techieis-a-studentcustomer-ociis-a-photographerdurumisfrom-ksmassivegriddyndns-wikiis-an-entertaineris-a-hard-workermysecuritycamerafrom-mnrackmazedyndns-blogis-a-bulls-fanwritesthisblogfreemyipsimple-urlfrom-sdreservdauthgear-stagingest-mon-blogueuris-into-gamesrice-labsxtooldevicesakurawebis-an-anarchistoraclecloudappsdyndns-worksells-for-urhcloudfrom-dcfastvps-serverwpmucdnis-a-geekscrysecfrom-txis-into-cartoonsmodelscapetrycloudflarelocaltonetstreak-linkbalena-devicesfrom-njforgeblocksfreebox-oswebadorsitefrom-ncdoesntexisthobby-sitestreaklinkshomesecuritymacownprovidertuleap-partnersdattorelaywphostedmailservequakeis-a-socialistservehalflifepivohostingdynuhostingquipelementsw-staticblitzdyndns-webfrom-deproject-studyaliases121is-not-certifiedhercules-devis-a-financialadvisoramazonlightsailservepicsis-a-greenloseyouripfrom-ilwithyoutubemwcloudnonprodwiredbladehostingdnsdojofrom-tnpixolinomyqnapcloudncloudstorageis-an-artisthostedpiis-a-landscaperauiusercontentoaiusercontenton-forgeis-a-conservativedreamhostersnet-freaksapps-1and1is-goneencoreapifastly-edgefrom-nesalesforcefrom-scdeployagentoraclegovcloudappsfrom-alis-a-lawyercechirevultrobjectsstufftoreadisa-geekddnsgeeklovableprojecttry-snowplowfrom-moblogsyteis-a-bookkeepernogmyforumravendbmyboxdeelementoredsaacficogoorinforgcomgobnatneteduidstoreorgcomnetintedudevnomepublorgcomneteduathgovtestscalculatorspaynowinfoquizzesresearchedcloudnsfunnelsassessmentsjscaleforcetmacltdorgmilcompronetgovbizpresseklogesrsccloudcustomfltusrcloude4corealmgovmunicontentproxy9metacentrumdyndyndyndnsdynpagespages-researchitionoccustomercomymyspreadshopipv64diskussionsbereich4limacomrub2ixfirewall-gatewayddnssspdnsbarsykeymachinesquare7myhome-serverspeedpartnercommunity-proschuldockxenonconnectgünstigliefernbwcloud-os-instancedyndnssecmy-routerxn--gnstigliefern-wobin-butterl-o-g-i-nisteingeekin-dslin-berlinin-brbfuettertdasnetzleitungsenin-vpnlcube-serverdyn-ip24logoipdyn-berlinruhr-uni-bochum12hpgoipsrvdnsfruskygit-repossvn-reposinternet-dnsgünstigbestellenhome-webserverxn--gnstigbestellen-zvbbplacedheimdnscosidnswebspaceconfiglima-citydyndns1istmeinvirtualuserschulplattformmy-gatewayddnsseclebtimnetztest-iservmein-iservvirtual-userhome64iservschuletaifun-dnstraeumtgeradeschulserverdynamisches-dns123webseitednshomehs-heilbronndnsupdaterbssgraphicdwadpdwdaepeweaawapaafpfwfabwbpbacwcpcciwebuserapiobjects*teamst3r2lpbravepanelngrokiservstglclcrmerpflypagesbarsyvivenushoplocalcertlocalplayerbearbloggatewaydeno-stagingis-not-ais-a-goodbotdashvercelmocha-sandboxplatter-appreplitgithubpreviewworkersinbrowserevervaultis-ahrsndenoxmitmodxmyaddrstorageapipayloadgrebedocruncontainersstgstagelclstageloginlineis-a-fullstackcodepenleapcellngrok-freeis-coolstoragewebharemediatechlibp2pdiscourseimaginecomyspreadshopstoreregbiz123hjemmesidefirmcoorgcomnetedugovsldorgmilcomwebgobartnetedugovtmorgpolcomsocartnetedugovassoagrondiscoodontk12medcuegyecpaabgengorgmilgalsaltulcomadmesmgobpubdocmonfindgnriouioproartlatvetnetfotedulojgovntrturibrbarxxxofficialbasechefprofmktgpsictechinfoarqtcontdentrrpppsiqgit-pagesritmedfieorgcomlibprieduaipgovriikmeactvsportorgmilcomscieunnetedugovnameinfopintouchtawktotawkmyspreadshoporgcomnomgobedu123miwebcomputeorgcomnetedugovbiznameinfocognito-idptransfer-webappeusc-de-east-1onjelasticnxaspdnsbarsydirectwpdeuxfleurstransurldogadoprvwcloudnsamazonwebservicesdnshomeuserpartycokoobinmkmfidymyspreadshopalandkapsiikixn--hkkinen-5wacloudplatformhäkkinen123kotisivuidacorgmilcompronetedugovbiznameinforadioorgcomneteduuserexperts-comptablestmmyspreadshopgretaprdcomnomynhccifbxoshuissier-justicenotairesaeroportfreeboxoson-webavocatassoportgouvkdnschirurgiens-dentistes-en-franceavouesfbx-os123sitewebveterinairechirurgiens-dentistespharmacienchambagrimedecinfreebox-osdediboxgoupilemszicpyicpvicppleysheezypagesedugovcnpyorgcomcybllcpvtnetedugovtnxonlineschooldaemond6atcopanelorgnetplybotdashstackitkaasorgmilcomnetedugovbizmodltdorgcomedugovcoorgcomneteduappwriteacorgcomnetedugovcloudtranslateusercontentorgcomnetedumobiassoorgcomnetedugovbarsysimplesitediscourseindorgmilcomgobneteduorgcomwebnetedugovguaminfonxhra教育敎育網絡网絡组織組織网络網络组织組织公司政府個人个人箇人ltdorgcomincneteduidvgovxn--uc0ay4axn--55qx5dxn--mk0axixn--io0a7ixn--uc0atvxn--zf0avxxn--lcvr32dxn--od0algxn--wcvs22dxn--gmqw5axn--od0aq3bxn--mxtq1mxn--ciqpnxn--tn0agxn--gmq050iorgmilcomgobneteduiservwp2tempurlmircloudfreesitewpmudevmyfastgadgetcloudaccessjelehalfboltfastvpsemergenteasypanelopencraftizcombrendlynamefromrtpersoadultmedorgpolrelcomproartnetedufirminfoassoshopcoopgouvtmcomediahotelforumvideosportorgsexagrargameslakaseroticaerotikatozsdereklamcasino2000filmsuliinfoboltshopprivnewsszexcityutazasjogaszkonyveloingatlaneacaicogoormyᬩᬮᬶmilwebschnetkopbizzonedesaponpesxn--9tfkymyspreadshopgovmytabittabitorderravpageaccok12idforgnetgovmuniltdplcaccotttvorgcomnetmeca6g5gpgamubacaicniocoukuptverdruscsdelhiindorgmilcomwebnicfingenpronetintedugovresbizbiharbarsyinternetbusinessschooltravelsupabasealumnigujaratfirminfoaeropostbankcoopindevscloudnsno-ipbarsybarrell-of-knowledgebarrel-of-knowledgensupdategroks-thisdnsupdatefor-ourknowsitalldvrcammittwalddynamic-dnsv-infowebhopselfipdyndnshere-for-moreilovecollegemayfirstforumzcloudnsmittwaldservertypo3servergroks-theeusekd1cdndyndnsidrawsainaueuapjpusstagemocksysdevicesclientcustreservdcustdevdisrecprodtestingcobeebyteutwenteboxfusebravepstmndedynngrokorgmilcomnomnetedugovqcxqzzbarsythingdustmo-siemensrb-hostingfh-muenstergitbookbluebitecloudbeesusercontentnodeartkiloappsforgerockdarklangresinstagingapigeebubbleb-datascryptedhypernodedappnodepantheonsitegitlabgithubkeeneticvirtualservercleverappshostyhostingon-rioedugitticketstelebitwixstudioon-k3sicp0icp12038jeleqotolairbubbleappsmyaddrstolosmyrdbxwebflowdrive-platformbeagleboardhasura-applolipopdefinimavaporcloudmusicianwebflowtestazurecontainerresindevicereadthedocsloginlineeditorxmoonscalesandcatsbasicserverwebthingsbrowsersafetymarkbeebyteappbitbucketidaccovistablogorgschnetgovxn--mgba3a4f16axn--mgba3a4fraarvanedgeايرانایرانjclaspeziapdudcefegelemeperetevebacanatavaparasabgagfgogrgpgalclblimfmrmcbmbvbfclcmcvcrcpcchlimifibicivipirisimncnbnanenrnpntnnolomobocoaogorosopotoptvtatctbtmtltotpusulunutpspapaqsvpvvvtvavvrtrsrprgrfrcrbrarorkrvstsssbscsmsispzczbzbozen-suedtirolmyspreadshopxn--bulsan-sdtirol-nsbxn--valledaoste-ebbtrentinoaltoadigetrentin-sued-tirolxn--forlcesena-c8axn--forl-cesena-fcbxn--bozen-sdtirol-2obtriestetrentinsuedtiroltrentino-s-tirollecceudineaostesienaparmaluccapaviagenoapaduaaostamonzaabruzzoternirietiturinmilanbozenlaziofermoleccocuneonuoropratola-speziavdataaligfvgpugmolcalcamlomumbsicpmnvenvaoedugovabrsarmaremrbastoslazibxosfirenzetrentinosüdtirolval-d-aostavalle-aostamessinacremonaravennatoscanatrentin-suedtirolbolognacalabriaurbinopesarofriuli-v-giuliaogliastraxn--valle-aoste-ebblaquilaandriatranibarlettasyncloudxn--valle-d-aoste-ehbaostavalleyvalled-aostatrentino-alto-adigevallee-d-aostexn--balsan-sdtirol-nsbpistoiasicilialucaniacataniaiserniaperugiabresciaveneziagorizialiguriaimperiabulsan-suedtirolbalsan-suedtirolbarlettatraniandriaxn--trentino-sdtirol-szbforlì-cesenatuscanyvallée-d-aostemantovavallée-aostecasertapiemontevalleaostaval-daostafriulivgiuliatrevisoforli-cesenavalléedaosteferrarapescaravald-aostatrentino-altoadigefriuli-vegiuliavallee-aostecarboniaiglesiastarantomediocampidanovalleedaostetrentinosud-tirolcampobassotrentinsüd-tiroltrentinosüd-tirolmonzabrianzatrentino-südtirolxn--trentino-sd-tirol-c3bpotenzacosenzavicenzaemiliaromagnavenicefrosinonemarchepordenonetrentinosued-tirolvaresemolisevalléeaostefriuli-veneziagiuliabasilicatalatinaanconasavonaveronamodenabiellabolzano-altoadigepugliafoggiaumbriatrentino-stirolgenovapadovamateranovararagusapiacenzatrentinostirolvalleeaostetempio-olbiasudsardegnatrentinsudtirolmassa-carrarafriuliveneziagiuliatrentinosuedtirolandria-barletta-tranitrapanixn--cesenaforl-i8amaceratacaltanissettaascoli-picenobrindisicarraramassacagliaririmininapolivibo-valentiachietibulsan-sudtirolbalsan-sudtiroltrentino-a-adigebulsanbalsaniglesiascarboniamilanotorinoteramodell-ogliastraarezzotrentinoalto-adigerovigotrentovenetoiglesias-carboniatrentino-sud-tirolaltoadigereggio-emiliareggio-calabriasardegnatranibarlettaandriapiedmontxn--sdtirol-n2amedio-campidanotrentino-süd-tirolfriuli-vgiuliafriuli-ve-giuliaromeennaromapisa32-b16-b64-blodiastibarineencomonaplesforlicesenailiadboxosalessandriasicilytrani-barletta-andriaxn--trentin-sdtirol-7vbpesarourbinotrentinsued-tirolcesena-forliforlìcesenaemilia-romagnamonzaebrianzaxn--trentinsdtirol-nsbtrentinos-tiroltrentinsüdtirolvalledaostaolbia-tempiocampidanomediovibovalentiasassarivalle-daostalombardysud-sardegnafriulivegiuliareggioemiliamonzaedellabrianzaalto-adigevercellitrentin-sudtiroltraniandriabarlettatrentino-sudtirolascolipicenobozen-südtirolfriulive-giuliaflorencexn--cesena-forl-mcbcarbonia-iglesiasaosta-valleycarrara-massadellogliastratrentinoa-adigexn--valleaoste-e7apesaro-urbinoxn--trentinosdtirol-7vbxn--trentin-sd-tirol-rzbxn--trentinsd-tirol-6vbtrani-andria-barlettatrentin-süd-tirolxn--trentinosd-tirol-rzbgrossetomonza-e-della-brianzasüdtirolreggiocalabriatrentinoaadigetrentin-südtirolverbano-cusio-ossolafriuliv-giuliaverbaniacampaniatrentino-aadigefriulivenezia-giuliasardiniaandriabarlettatranibarletta-trani-andriacatanzarooristanourbino-pesarocesena-forlìvalle-d-aostacampidano-medio123homepagesiracusatempioolbiasuedtirollombardiaavellinocesenaforlìtrentinofriuli-venezia-giuliabozen-sudtirolandria-trani-barlettabulsan-südtirolbalsan-südtirolmonza-brianzabolzanotrentino-sued-tirolbellunosalernolivornocrotonesondriodnshometrentinsud-tirolmassacarraratrentin-sud-tiroltrentino-suedtirolviterbobergamocesenaforliolbiatempiopalermobeneventoagrigentoofcoorgnetfmaitvphdengorgmilcomschnetedugovperagrikanieasukehandachitatokaiaisaikonanoharuamaobuhigashiuraowariasahiinuyamatobishimaiwakurashitarainazawatoyonegamagorimihamatoyotataharakariyayatomioguchikomakimiyoshinishiotokonamekiyosuchiryutoyohashiokazakiisshikikasugaikotakiratoeianjotogofusosetohazutsushimashinshirotakahamanisshinshikatsuhekinantoyokawaichinomiyatoyoakeodateogataakitaikawakyowahonjoogayurihonjonoshirokamiokakatagamimitanegojomeyokotekosakadaisenkazunonikahohonjyomoriyoshimisatohappoukamikoanihachirogatahigashinarusesembokufujisatokitaakitaitayanagiowanitakkomutsutsurutahirosakigonoheoirasetowadamisawanohejiaomorishingohiranairokunohehashikamitsugarushichinohehachinohenakadomarisannohekuroishisakaeisumiasahiotakiinzaiabikomatsudoyachiyomutsuzawakujukuriomigawakashiwatoganemihamanaritasakuranagaramobarahanamigawachoshishiroichoseikozakishisuikatorimidorichonankyonanfuttsuonjukufunabashinagareyamanodasosatakochuotohnoshourayasukimitsuyokaichibayotsukaidosodegauratateyamakamagayayokoshibahikariyachimatakatsuuratomisatokisarazukamogawaichikawanarashinoichinomiyashimofusaminamibososhirakoichiharaoamishirasatoikatahonaiainansaijoseiyoiyoozuuwajimaniihamanamikatamasakiuchikokihokutobetoonshikokuchuomatsuyamaimabarikamijimakumakogenyawatahamamatsunosabaeikedaobamasakaifukuiohionotsurugamihamawakasaminamiechizeneiheijikatsuyamatakahamaechizensoedaukihaomutaokawanishiogoribuzenonojosueumiokiotochikugosasagurisaigawamizumakishinyoshitomikurumekurateyamadakasuganakamamiyamanogatatakatahakataiizukakawaratagawakasuyaashiyainatsukimunakataminamitsuikishonaikurogifukuchikeisenhigashimiyakoshinguyukuhashiokagakiyamekogaongausuikahotohochuotoyotsumiyawakadazaifuhisayamatachiaraiyanagawanakagawahirokawachikujochikushinochikuhochikuzennamieotamaokumashowateneiiwakikoorinangoononishigoshimogoomotegomishimafukushimaasakawakagamiishishirakawaiitatefutabahiratayugawahanawakitakatakawamatakunimiyabukibandaihigashihironoyamatomiharuyamatsuriaizubangedatesomaaizuwakamatsuyanaizuaizumisatonishiaizuizumizakikitashiobarataishinkaneyamakoriyamainawashirotanagurafurudonosamegawasukagawaishikawatamakawaikedaogakitaruiginanenahashimahichisonakatsugawaibigawashirakawamizunamiminokamomitakekawauesekigaharatomikasakahogikitagatayamagatatajimianpachimotosuyaotsukakamigaharahidakanisekitokigujominogodoyorogifukasamatsutakayamawanouchihigashishirakawakasaharashimonitatsumagoichiyodakannakanrashowameiwakiryuotaoratomiokafujiokaitakuranaganoharahigashiagatsumatakasakishibukawaminakamikatashinatsukiyonokawabanumataannakaoizumimidorishintoisesakiuenoyoshiokakusatsutakayamanakanojonanmokutamamuratatebayashimaebashiotakekaitadaiwahongofuchukuietajimashobaramiharahatsukaichihigashihiroshimamiyoshikumanokurenakasakaseraseranishiasaminamifukuyamashinichionomichiosakikamijimajinsekikogentakeharaotobenanaeikedatohmaozoraobiraabirakyowaeniwataikibibaisharirebunerimohiroooketootarupippunishiokoppechitosefurubirahakodateshiranukakitahiroshimakushiroobihironanporoiwamizawaniikappukunneppufukushimanakasatsunaitoyourakuromatsunaiakabirakamisunagawashibechaurakawakamifuranonakatombetsuasahikawashimokawakayabeokoppebiratoriabashirisaromaatsumanumatahidakabifukamukawamikasahorokanaitoyotomisarufutsuhigashikawaishikarikitamiyoichiesashiiwanaitomariminamifuranoakkeshifuranotoyakoyakumootoineppushikaoishiraoinemuronayorohaboroashorobihororishirifujiutashinaihokutotakasuebetsuurausuassabukikonaishimamakinaiedatetoyabieinikiesanuryuoumuteshikagarikubetsuashibetsukimobetsuaibetsutobetsusobetsuembetsushimizuchippubetsurishirihokuryuhoronobeshintokutsubetsushibetsuhonbetsumombetsutsukigatakuriyamakoshimizushiriuchikutchanmurorannoboribetsukamishihorowassamushinshinotsukembuchiwakkanaikamoenaikiyosatotakinoueshikabesunagawafukagawanakagawatakikawakamikawahigashikagurahamatonbetsumatsumaemoseushirankoshishakotanimakanemashikeotofuketomakomaisandatambaitamiawajikasaiasagoshisoonoakoyashirotoyookaminamiawajiinagawafukusakitakasagokamigorikasugaharimayokawaashiyahimejiakashitaishiaogakisannantakinosumototakarazukanishinomiyashingugoshikinishiwakiyokatakaaioimikisayoyabukawanishiamagasakisasayamashinonsenkakogawaichikawakamikawatatsunotsukubaiwamaogawaasahisakaitokaioaraiitakobandodaigosuifuinaamikasumigaurakashimaomitamayachiyoshimodatetomobetoridehitachinakainashikisakuragawakasamayawaramoriyahitachiomiyanamegatayamagatahitachikamisuushikutakahagiibarakitonekoganakasowayukimihojosomitoryugasakishimotsumafujishirotsuchiurachikuseihitachiotashirosatotamatsukuriuchiharashikahakuinanaotsubatawajimakahokukawakitatsurugikaganominotosuzuuchinadakomatsuanamizunakanotohakusannonoichikanazawaiwateshiwafudaikawaimoriokaofunatohanamakikuzumakikitakamininohekunoheyamadayahabasumitaichinosekitanohatahiraizumirikuzentakatajobojiotsuchihironomiyakoiwaizumikarumaiichinohenodakujitonooshushizukuishifujisawamizusawakamaishikanegasakimannoutazukotohiraayagawazentsujihigashikagawauchinomikanonjisanukimarugamemitoyotakamatsutadotsunaoshimatonoshoakuneamamiizumihiokiyusuikinkoisasookouyamanakatanekagoshimakanoyaisenkawanabeminamitanemakurazakitarumizunishinoomotematsumotosatsumasendaioimatsudaayaseebinamiurazushinakaiodawaraiseharasagamiharahakoneaikawakaiseiatsugitsukuihadanoyamatoyamakitazamaoisochigasakininomiyayokosukakamakuraminamiashigarafujisawasamukawakiyokawahiratsukayugawaraokawaumajikochitsunootoyoakiinonishitosayasudahidakamiharasakawaniyodogawahigashitsunokagamigeiseisusakiotsukinaharisukumomurototosakamiochitoyotosashimizumotoyamanankokunakamurakitagawayusuharaogunichoyoukiasoutoozugyokutoamakusamifunetakamoriyamagaminamataminamiogunikikuchisumotoyamatonagasumashikiaraokumamotokamiamakusanishiharayatsushiroayabeseikasakyoideineujinakagyokameokakyotangokyotanabekyotambaminamiyamashiroyamashinatanabeyawatawazukaminaminantanmiyazuhigashiyamafukuchiyamakitamukokamojoyokizumaizuruujitawaraoyamazakinagaokakyokumiyamakawagoeinabeshimameiwaasahitaikiudonoisetsukisosakikuwanamihamamiyamasuzukatamakimisuginabarikumanokomonominamiisewataraitobakiwatakikihotadomatsusakayokkaichikameyamaureshinoishinomakishichikashukuohirataiwaosakizaohigashimatsushimashikamaiwanumashibataogawaraonagawakawasakiseminemarumoriminamisanrikukakudamuratawakuyatomiyanatoriwataritagajomisatotomekamirifushiroishimatsushimayamamotoshiogamafurukawahyugaebinotsunosaitoayakushimanobeokakitauramiyazakitakazakigokaseshiibamimatashintomikunitomikitakatakobayashikawaminamitakaharukijotakanabemiyakonojonishimeranichinankitagawakadogawamorotsukakisofukushimaminamimakisakaeobuseikedaogawamiasaokayaasahiotakiotarichinoinaomichikumakomaganechikuhokukaruizawayasuokaooshikaikusakaminamiaikitogakushimatsukawakawakamitateshinatakamorikitaaikishiojirimiyadahakubaiizunaiijimaiiyamamiyotasuzakayasakatoguraookuwanagawaminowahirayayamagataminamiminowafujimiomachisakakitakaginaganonakanosakuhokomoronagisoshinanomachiwadauedaiidaharasuwatomiachiaokianankisosakunozawaonsenagematsutakayamashimosuwamatsumotoyamanouchinakagawamochizukiazuminotatsunoobamaomuraseihiunzenosetofutsuikichijiwanagasakiisahayahasamisaikaikawatanasasebohiradokuchinotsugototogitsutsushimashimabarashinkamigotomatsuurayamazoekashibaikomakawaitenrioyodosangokoryoudaojiikarugayamatokoriyamatenkawakatsuragikurotakikawakamimiyakemitsuetakatorikamikitayamayamatotakadahegurishinjokanmakisakuraitawaramotogoseoudanarasoniandokawanishishimoichihigashiyoshinokashiharashimokitayamanosegawayoshinomintsivorytopazsakuragehirnsumomoaseinetopalmail-boxmokurenyoitamuikaojiyagosensanjoaganomyokoseiroagaomishibataniigatanagaokamurakamiuonumayuzawakariwatagamitainaitsunanminamiuonumatochioyahikojoetsuseiroukamosadoizumozakitokamachiitoigawasekikawakashiwazakitsubamemitsukekokonoesaikiusukibeppuusahimeshimakunisakihasamataketatsukumihitaoitahijikusuyufukujukamitsuebungoonobungotakadaibaraniimibizentsuyamaokayamakasaokahayashimayakagemaniwaakaiwamisakishinjotamanotakahashikibichuowakesojanagishookumenannishiawakurakurashikiasakuchisetouchikagaminosatoshotomigusukunakagusukuyaeseizenaurumaiheyaaguniogiminanjokinminamidaitokitanakagusukuyonaguniokinawaishigakikunigamiurasoekadenataramahiraraginozataketomishimojizamamitonakiitomanhigashimotobuyonabarugushikamionnanahanagohaebarukumejimakitadaitonakijinnishiharayomitanginowantokashikiishikawaikedasuitaminohizuminishisakaikananabenodaitoosakasayamayaokishiwadatadaokakaizukatondabayashichihayaakasakakumatorikadomasayamahigashiosakashijonawatehirakatataishimisakitajirihannansennankatanotoyonominatosettsuhigashiyodogawaibarakinosekitachuohigashisumiyoshifujiiderakashiwaraizumiotsutoyonakamatsubaramoriguchiizumisanoshimamototakatsukineyagawahabikinotakaishikawachinaganoyoshinogarikamiminearitaouchiimarihizenogikashimaariakekiyamafukudomikitagatakitahataomachigenkaikanzakinishiaritakyuragisagataratosutakushiroishikaratsuhamatamakouhokukawagoeyoshidasatteogoseirumaasakaurawaogawaniizaomiyayoriiotakishikihonjooganohannohanyuinasaitamaokegawaarakawayoshikawayokozehasudasayamahidakafukayachichibuiwatsukiryokamiyoshimikamiizumifujimiwarabiranzanmiyoshiminanoyashiosakadosugitomisatohigashichichibutodasokakukiyonokazoshiraokakasukabekounosukawajimatsurugashimamiyashirokitamotohatoyamamoroyamahatogayakumagayakawaguchinagatorokamisatomatsubushinamegawatokigawakamikawafujiminohigashimatsuyamakoshigayatokorozawas3isk01isk02ryuohkoseikonanaishorittotakashimamaibarahikonetorahimenishiazaikokagamokotoyasuotsukusatsunagahamamoriyamatoyosatotakatsukinotogawaomihachimanhigashiomiakagiunnanizumogotsuamayatsukakakinokimatsuehamadamasudahikawahikimiokuizumoyasugiyakumomisatotamayuohdahigashiizumookinoshimanishinoshimatsuwanoshimaneshimadafujiedayoshidashimodagotembaiwataatamikosaiyaizuitoizumishimahaibaramakinoharaomaezakikawanehonkannamisusonohigashiizufukuroinumazukawazufujiaraishizuokahamamatsushimizuizunokunimatsuzakimorimachiminamiizunishiizukikugawakakegawafujikawafujinomiyaujiietsugaoyamayaitaohiranikkoashikagakuroisokanumasakurashioyakarasuyamamotegiichikaikaminokawatochigihagamokanogisanobatonasumibunasushiobaranishikatautsunomiyaiwafunemashikoshimotsukeohtawaratakanezawaitanokomatsushimatokushimaichibaminamiaizumiwajikikainanmiyoshinarutomimamugiananmatsushigesanagochishishikuinakagawamachidachiyodakomaefussainagitaitochofufuchuomeotahigashiyamatotoshimaokutamaaogashimakodairaedogawaarakawahachiojishinagawatachikawashibuyasuginamihinodekiyosesumidaoshimanerimamitakahamuraadachinakanomizuhobunkyomegurominatokoganeihigashikurumekokubunjihigashimurayamamusashimurayamatamakitahinochuokotokatsushikakouzushimaogasawaraakishimakunitachishinjukusetagayamusashinohachijoitabashiakirunohinoharachizunanbukotouramisasawakasayonagokogehinoyazutottorinichinansakaiminatokawaharaoyabetairainamiasahinantoimizufuchutakaokakurobeyamadajohanatoyamatonaminyuzenfunahashinakaniikawanamerikawaunazukitogahimiuozufukumitsutateyamakamiichiiwadearidayuasainamitaijikatsuragiaridagawatanabemihamahidakakainankiminomisatoshingushirahamakamitondayurakozakoyagobokitayamawakayamakudoyamahashimotokushimotokozagawahirogawakinokawanachikatsuurarsuseroeoishidasagaeoguniasahinagaitendonanyoobanazawanishikawasakataohkuratozawamikawamamurogawayamagatafunagatatakahatashonaishinjokahokuiideyuzakawanishitsuruokakaminoyamayamanobeshiratakamurayamanakayamakaneyamahigashineyonezawasakegawamitouubeyuuabushimonosekitabuseoshimatoyotaiwakunihikarishunannagatohagihofukudamatsutokuyamashowadoshitsurunanbukoshukaiminami-alpsnirasakikosugeotsukioshinohokutominobuyamanashifuefukichuokofuichikawamisatoyamanakakonakamichitabayamanishikatsuranarusawafujikawahayakawafujiyoshidafujikawaguchikouenohara長野京都岐阜大阪三重群馬千葉滋賀佐賀奈良adednelgaccogogror秋田愛知高知埼玉沖縄栃木熊本岩手青森山梨新潟島根鳥取長崎香川宮城石川大分宮崎茨城山口兵庫山形徳島広島福島福岡岡山富山静岡愛媛福井東京xn--4it168dhatenadiaryxn--vgu402ckawaiishophatenablogcocottenamaste北海道penneehimeiwateversestabachibashigagonnagunmapermahaccaakitaosakauh-ohblushkochiaichifukuikuroncapooitigohyogotokyokyotopunyuthickcheap0t00g00j0mie2-ddaapyawjg0amfemsubxiiboomoobutchueekpgwrgrherskrboyrdyupperunderflierchipsmydnsheavyangryhippygirlyrulez神奈川鹿児島和歌山bambinaxn--nit225kokayamasaitamaxn--k7yn95exn--1lqs03nsapporoparasitelolipopmcxn--efvn9sniigatafukuokatokushimafukushimahiroshimakagoshimafakefurokinawaxn--8pvr4ucoolblogxn--0trq7p7nnkawasakinagasakimiyazakichilloutxn--8ltr62kxn--klty5xpeeweezombiecutegirlxn--rny31hxn--uuwu58axn--ntso0iqx3axn--djrs72d6uytoyamanikitanyantakagawamimozanagoyaboyfriendxn--2m4a15egreaterchowderegoismyamagatafashionstorexn--elqq16hxn--pssu33lsendaimiyagixn--rht27zpecoriaomorisaloonwatsonvivianxn--djty4knobushipigboatnaganopinokoxn--f6qx53asadistvelvetsecretxn--5js045dchicappayamanashiibarakidigickgirlfriendxn--1lqs71dmongolianxn--c3s14mxn--qqqt11mtochigixn--5rtq34kparallelo0o0mondkobesagabonadecaoitanarafoolkilldecimainhiholomosblokilociaoundopupugifutankcrapflopnooroopsmodsholyjeezstripperpepperbittershizuokaxn--rht3dkitakyushureadymadeicurusversusmatrixxn--rht61ehungryfloppygloomycrankyhandcraftedlittlestarxn--klt787dxn--kltx9awhitesnowsunnydaytottorilovepoptheshopbuyshopxn--5rtp49cxn--d5qv7z876cwebaccelxn--kbrq7oxn--4pvxsxn--1ctwolovesickkumamotocatfoodxn--tor131oyokohamawakayamatonkotsuxn--ehqz56nxn--uist22hxn--6btw5axn--kltp7dyamaguchifrenchkisspussycatxn--4it797kxn--uisz3gbabybluexn--zbx025dnetgamersxn--7t0a264ckanagawaxn--6orx2rishikawaxn--ntsq17ghalfmoonschoolbusjellybeanxn--mkru45iusercontentlolitapunkxn--32vp30hsakurastoragehokkaidoshimanecandypopbabymilksupersaleweblikeraindropbackdropwebsozaikikirarahateblodaynightmeneacsccogoormobiinfoaeusxxorgmilcomnetedugovorgcomnetedugovbizinfotmprdorgmilcomnomedugovassnotairespresseassocoopgouvveterinairemedecinpharmaciensorgnetedugovtraorgcomedurepgovmeneperekgacscaiiocogoitoresmshsseoulbusanulsandaeguc01milvkimmvchungnamjeonnamjeonbukeliv-dnsgyeonggijejueliv-cdnincheondaejeongangwongyeongbukgwangjuchungbukgyeongnameliv-apicoeduindorgcomembnetedugovorgmilcomnetedugovjcloudorgcomnetintedugovperbnrinfocooyorgcomnetedugovethipfscanvamypepethw3sstorachakeeneticjoinmcinbrowserdwebcyonnftstoragemyfritzaemewphlxachotelltdorgcomwebsocschngonetintedugrpgovassnomgacsccoorgnetedugovbizinfo123websiteidorgmilcomasnnetedugovconfidmedorgcomplcschnetedugovaccoorgnetgovpresstmassoirseproxaccosoundcasthoptocraftvp4c66orgnetedugovitsmcdirmyboxbarsyedgestacksynologylogintoopencloudnohostwebhopdiskstationi234tcp4hoocgroknoipprivmydsddnsdnsforlohmustransipdscloudfilegear-sgbrasiliafilegearframerbarsybarsyonlinecoprdorgmilcomnomedugovinforgcomnetedugovnameacprorgcomartnetedugovpresseinfoassoinstgouvorgnycedugovbarsydscloudjuorgcomnetedugovminisiteaccoororgcomnetgovorgmilcompronetintedugovbizmuseumnameinfoaerocoopaccoorgcomnetintedugovbizcooporgcomgobneteduorgmilcomnetedugovbiznameaccoorgmilneteduadvgovcoorgcomnetaltgovforgotherhiskeeneticispmanagernomassoprod5476132eastasiacentraluswesteuropewestus2eastus2pnortheurope-01newzealandnorth-01southindia-01southcentralus2-01norwaywest-01eastus2-01westus2-01australiaeast-01italynorth-01israelnorthwest-01swedencentral-01westeurope-01centraluseuap-01taiwannorthwest-01uaecentral-01northcentralusstage-01israelcentral-01mexicocentral-01canadacentral-01austriaeast-01germanywestcentral-01francecentral-01ukwest-01denmarkeast-01polandcentral-01eastus-01westus-01swedensouth-01eastus3-01westus3-01brazilsouth-01centralus-01francesouth-01australiacentral-01westindia-01uaenorth-01jioindiacentral-01canadaeast-01belgiumcentral-01spaincentral-01koreacentral-01chilecentral-01qatarcentral-01westcentralus-01eastus2euap-01norwayeast-01southafricanorth-01brazilsoutheast-01germanynorth-01switzerlandnorth-01switzerlandwest-01japanwest-01southafricawest-01japaneast-01eastasia-01indiasouthcentral-01taiwannorth-01centralindia-01uksouth-01southcentralus-01northcentralus-01eastasiastage-01indonesiacentral-01australiacentral2-01australiasoutheast-01malaysiawest-01koreasouth-01southeastasia-01southeastus5-01northeastus5-01jioindiawest-01rucdnwest1-usfra1-desandboxjls-sto1jls-sto3jls-sto2aglobalabglobalsslmapprodfreetlsmapvpslon-1lon-2ny-1fr-1sg-1ny-2paassnwebpaashostingjelasticnordeste-idcsocuserpagescwebfileblobservicebuscoreatlricnjsjelasticwebsitestoragesezagbinruhuukjptsmyspreadshopmynetnameakamaiorigin-stagingfrom-coipv64dynv6cdn77serveblogadobeaemcloudhicamsprytdnsupno-ipownipde5ovhicpfirewall-gatewaysytesmypsxbarsyusgovcloudapimyamazemyradwebakamaihdsaveincloudfastlylbfrom-lasubsc-paysquare7in-the-bandblackbaudcdnhomelinuxoninfernoctfcloudservebbsdns-dynamiccloudfrontakamai-stagingipifonyham-radio-opsenseeringclickrisingcommunity-profrom-nylocalcertgrafana-devedgesuite-stagingcloudflareanycasteating-organicatlassian-devmydattofeste-iplocaltotorprojectknx-serveredgekeycloudflareglobalcloudyclustercasacamserveftpakamaized-stagingakamaiorigindns-cloudmyeffectboomlabotdashbuyshousestwmailhetemlazure-mobilein-dslthruhereredirectmedynuddnsbouncemesupabaseluyanicloudappakamaicloudfunctionsdebiannhlfanpgafanstatic-accessin-vpnmysynologymafeloappudohomeftptrafficmanagersiteleafseidatmemsetcloudflarecloudaccesskeyword-onazure-apiis-a-chefdoes-itgets-itwebhopselfiphomeipkicks-assedgesuitewindowsserver-ontunnelmolemydissentscrapper-sitecloudflarecnuni5srcfggffiobbzabchrsndenodynuopikddnsvpndnsakadnselastxkinghostvps-hostfastlyhomeunixazureedgeshopselectdontexistmyfritzcloudjiffyalwaysdatasells-itsquaresbroke-itazurefddattolocalat-band-campmeinforumfamilydsazurestaticappsdefinimabplaceddnsaliasdynaliasnow-dnsblogdnsroutingthecloudendofinternetdsmynasakamaiedgemymediapcadobeio-staticakamaiedge-stagingakamaihd-stagingddns-ipprivatizehealthinsurancelive-onkrellianschokokeksmassivegridmysecuritycamerarackmazeserveminecraftfrom-azis-a-geekakamaizedmoonscaleoffice-on-theusgovtrafficmanageradobeioruntimeedgekey-stagingreserve-onlinechannelsdvrdnsdojousgovcloudappcdn77-sslapps-1and1podzoneazurewebsitesdynathomescaleforceyandexcloudvusercontentisa-geekcdn-edgescoaemalcesappwriteazimuthtlonarvobuiltwithrocketnoticeablestorecomwebrecnetperotherfirminfoartslgdloncogoiltdorgmilcolcomplcschgenngonetedugovbiznamefirmmobiacincoorgmilcomnomwebgobnetintedubizinfocomyspreadshopdemongovtransurl123websitehosting-clusterkhplaycistrongsnesosvalervålerxn--vler-qoaossandeheroysandeherøybøboheroyherøyxn--hery-iraxn--b-5gavalerbøboxn--b-5gasandesandexn--hery-iraxn--vler-qoavålerhåreålaahavaofsfvfhlolnlalrlhmfmtmahcostntbuåstrmreigersundmyspreadshopgálsáeidsvolltingvollgildeskalflorøvadsøvardøvanylvenxn--bhccavuotna-k7astrandaxn--kvnangen-k0axn--sknland-fxaxn--mosjen-eyarakkestadhyllestadnannestadvevelstadvaapstenordre-landsondre-landsøndre-landtjieltexn--vrggt-xqadsør-aurdalsor-aurdalheradstordmoldefordeførdeseljefedjeryggehemnexn--krehamn-dxasognegranesøgnebrynetjomevallebykletokkegiskedovretjømehobølvoldasaudatolgasømnaviknadønnasomnadonnatranafrananesnaraumasmolatrænafrænalesjasmølaørstaorstahitrafloraaukraloppafrøyarissasnasahalsagalsaromsaraisaráisafroyasnåsagronghobolfjelltydalårdalardalaskimharamkraanghkekråanghkesorumbarumhurumbærumsørummodumsálátbálátfrognbjugnvåganvagangulenskienløtenlotenstrynvefsnxn--merker-kuaskaunsveiobømlobomloskjåkvardoflorovadsosalatbalatsálatklæbuklabuselbubarduulvikskjakklepprisørxn--nttery-byaeflåeidflahofmilgolholsellomskifetvikdepvgsfhsaskerrisorhamarasnesåsnesrørosrorosxn--slat-5namasoynaroyvaroyluroydyroyaskoyradoyandoyrodoymeloyradøyandøyrødøymeløyaskøylurøydyrøymåsøyværøynærøyhoylandethøylandetdivtasvuodnalørenskoglorenskognesoddtangenxn--tjme-hraxn--smla-hraxn--stjrdal-s1aunjargalillehammerunjárgaxn--hamary-fyadavvenjargaxn--bearalvhki-y4a123hjemmesidegjerdrumxn--brnnysund-m8acxn--tnsberg-q1axn--mlatvuopmi-s4axn--snsa-roaxn--skierv-utaxn--brum-voatysfjordkvafjordeidfjordkvæfjordsongdalenmjondalenmjøndalenxn--gls-elackragerogáŋgaviikagangaviikasørreisasorreisasør-varangersor-varangerxn--risr-iraskiervaxn--frna-woaxn--trna-woakvinesdalleksvikleirvikrøyrvikroyrviksvelvikvenneslaevje-og-hornnessandnessjøenmarnardalvindafjordsandefjordenebakksnillfjordullensvangxn--trany-yuabrønnøysundnamsskoganaustevollxn--stjrdalshalsen-sqbnord-aurdalnord-frontrøgstadtrogstadgrimstadflakstadgjerstadxn--sandy-yuaxn--leagaviika-52bnore-og-uvdalvegarsheixn--rlingen-mxaxn--ggaviika-8ya47hvegårsheikarlsoykvitsoymasfjordenhamaroyinderoyosteroydavvenjárgasauheradguovdageaidnuxn--vre-eiker-k8abronnoysiellakkrødsheradkrodsheradkvinnheradbrønnøyxn--mtta-vrjjat-k7afxn--lrenskog-54akvitsøyvárggátkarlsøyosterøyinderøyhamarøybronnoysundxn--aurskog-hland-jnbbahccavuotnabáhccavuotnagiehtavuoatnastor-elvdalmidtre-gauldalxn--gildeskl-g0akarasjokevenassixn--bievt-0qaxn--yer-znalebesbynessebyxn--hbmer-xqamalselvmålselvxn--unjrga-rtamøre-og-romsdalmore-og-romsdalhareidmelandørlandorlandstrandålgårdsolundalgardafjordåfjorddielddanuorrikautokeinoxn--stre-toten-zcbskodjeaejriestangeliernebamblestokkefauskesnåasesnaasekongsvingerlangevagberlevagxn--flor-jrahattfjelldalostre-totenøstre-totenvestfoldxn--mely-iraálaheadjualaheadjunordreisaxn--troms-zuaxn--lgrd-poacporsangerflatangerstavangerleikangerbremangersamnangergieldakarasjohkaxn--rdy-0nabfrostautsirasnoasatromsaxn--sr-aurdal-l8aflekkefjordjølsterjolsteraremarkhedmarknååmesjevuemienaamesjevuemiexn--vard-jrarollagmeråkermerakerorskogørskogxn--bdddj-mrabdákŋoluoktaxn--osyro-wuaaknoluoktatrysilskjervøymandaljondalbindalrindalmeldalsuldalorkdalsigdalalvdallærdalhurdalsirdalverdallerdallardaloppdalåseralaseralhadselkragerødivttasvuotnaoverhallasteinkjerxn--hnefoss-q1askedsmokorsettromsøxn--dyry-iravestre-totenmuseumxn--sandnessjen-ogbrahkkeravjufylkesbiblbájddarbajddarxn--laheadju-7yarennesøyxn--koluokta-7ya57hxn--hgebostad-g3aleirfjordstorfjordbalsfjordbåtsfjordbatsfjordmuosátbievátloabátkárášjohkanøtterøyxn--mjndalen-64anordkappláhppilahppialstahaugsiljanverranrøykenroykenhaldenlyngenbergenhortenhønefosshonefosstroandinbeiarnvarggatosoyroosøyrotromsoidrettmuosatbievatruovatloabatvoagattynsetnessetxn--indery-fyaskánitskanitraholtråholtxn--ystre-slidre-ujbandebusarpsborgbearduxn--karlsy-fyahordalandjorpelandjørpelanddeatnuringsakersør-odalsor-odalxn--slt-elabringerikeaudnedalnittedalnissedalhemsedalslattumsurnadalxn--blt-elabelverumstjørdalnaustdalhjartdalgjøvikfyresdalhasviknarviklarvikgjovikmalvikgamviklenvikporsgrunnstjordalengerdaldrobakdrøbakxn--msy-ula0hvestvagoyxn--vgan-qoaxn--ryken-vuaxn--lten-graxn--stfold-9xaxn--hpmir-xqaxn--lury-iramálatvuopmimalatvuopmitysværkirkenesbirkenesmoskenesbáidárxn--fjord-lraxn--rdal-poabahcavuotnabáhcavuotnaxn--frde-gralindåsbearalvahkixn--hobl-iraráhkkerávjuxn--loabt-0qavågåáltábodøsundlundraderådeetnetimeholeauregrueoddavagavegaranatanaarnasolasulaaltalekafusavangbergkvamåmliamlibokntinnroangranosenoslobodorøstroststatåmotamotivguprivøyeroyerliermossvossxn--nvuotna-hwalusterlunnermarkerhábmerhabmerhvalerfjalerxn--rholt-mratysvarbaidarfitjargaularhápmirhapmirmelhusfosnesøksnesoksnestysneshemnesevenesflesbergeidsbergtonsbergtønsberglindasxn--sndre-land-0cbnamsosxn--srum-graøystre-slidreoystre-slidrevestre-slidretrondheimbalestrandxn--langevg-jxaaustrheimxn--skjk-soavagsoyaveroysandoykarmoyfinnoytranoyvestbytranbysykkylvenxn--hyanger-q1aspjelkavikandasuoloxn--fl-ziaxn--drbak-wuastathellexn--sr-varanger-ggbtelemarkxn--bhcavuotna-s4axn--porsgu-sta26fčáhcesuolocahcesuoloakrehamnåkrehamnsandøykarmøyfinnøytranøyvågsøyaverøynamdalseidxn--lesund-huabadaddjaxn--vegrshei-c0axn--btsfjord-9zagildeskålporsanguxn--trgstad-r1anávuotnanavuotnahammerfestxn--sgne-graxn--brnny-wuacibestadharstadnarviikaevenáššivestnesgjemnessandnesagdenesrennesoyxn--avery-yuaxn--tysvr-vrabearalváhkikongsbergspydebergrandabergxn--andy-iradavvesiidaxn--krdsherad-m8aporsáŋgufredrikstadbjerkreimringeburennebuaurskog-holandnotteroyxn--vgsy-qoa0jxn--rmskog-byaskierváivelandbyglandfrolandaurlandforsandxn--bjddar-ptamidsundålesundalesundfetsundfarsundovre-eikerøvre-eikerakershusxn--moreke-juasørfoldøstfoldostfoldsorfoldhøyangerhoyangerlevangerorkangertanangerxn--vestvgy-ixa6olillesandulsteinxn--rennesy-v1agranvinskjervoyxn--klbu-woalavagisxn--h-2faxn--ryrvik-byakafjordkåfjordseljordfolkebiblxn--gjvik-wuajevnakerxn--kfjord-iuabudejjuxn--kranghke-b0axn--davvenjrga-y4axn--rland-uuaxn--ldingen-q1axn--mlselv-iuaxn--rady-iraxn--linds-prabrumunddalxn--ygarden-p1amo-i-ranaeidskogrømskogromskoghjelmelandxn--finny-yuaxn--sr-odal-q1axn--skjervy-v1aballangenkvanangenkvænangengratangenxn--hmmrfeasta-s4acvossevangensuohkanxn--rde-ulaxn--mli-tlaxn--ksnes-uuanordlandskanlandskånlandsortlandfuoiskuxn--rros-graxn--hcesuolo-7ya35bxn--eveni-0qa01gagaivuotnagáivuotnaxn--seral-lradrammenmodalenmosjoenjan-mayentorskensteigengloppenxn--snes-poamatta-varjjatxn--sr-fron-q1aomasvuotnajessheimbådåddjåxn--krager-gyaxn--kvfjord-nxaxn--asky-iraxn--snase-nraxn--bidr-5nacholtålenxn--vads-jraxn--jlster-byamosjøenxn--rst-0nastavernxn--ostery-fyaxn--oppegrd-ixaxn--sknit-yqaxn--risa-5naoppegårdskiptvetrendalenholtalenxn--mot-tlaxn--lhppi-xqaxn--holtlen-hxaxn--srreisa-q1akopervikxn--muost-0qaxn--bmlo-grahokksundkvalsundegersundxn--karmy-yuaullensakerxn--hylandet-54axn--kvitsy-fyaxn--bod-2nalangevågberlevågkristiansandxn--rsta-frahornindalstjørdalshalsenstjordalshalsensandnessjoenhámmárfeastaxn--lrdal-srasør-fronsor-fronnord-odalkristiansundmátta-várjjatvestvågøynesoddennotoddenbuskerudøygardenoygardensalangenlavangenralingenrælingenlodingenlødingenleaŋgaviikalaakesvuemieleangaviikauenorgexn--srfold-byaaskvollxn--rskog-uuaxn--nry-yla5gxn--vry-yla5ghammarfeastaxn--rhkkervju-01afxn--givuotna-8yakommunekrokstadelvanedre-eikerhagebostadhægebostadxn--berlevg-jxakviteseidxn--s-1faxn--l-1faxn--nmesjevuemie-tcbafuosskomoårekemoarekexn--lt-liacxn--jrpeland-54asvalbardoppegardholmestrandtvedestrandsogndalsokndalarendalsunndalfolldalxn--krjohka-hwab49jlyngdaletnedalnorddalsaltdalgausdalskedsmovaksdalgjesdalstordalxn--frya-hraaarbortedrangedalxn--smna-graaurskog-hølandxn--vg-yiabtjeldsundhaugesundlindesnesxn--mre-og-romsdal-qqbxn--dnna-gradyntmpheremerseineshacknetenterprisecloudmineaccomaorimāoriorgmilcriiwigennetschoolhealthkiwigovtgeekxn--mori-qsacloudnsparliamentcomedorgcompronetedugovmuseumwebsitekinservicebarsywebsitebuildereerobookheimdnsleapcelleero-stagetechcrscsslorigingohomecdbedeeeiemesecabgngilnlalplchfisiincnnoroptatitmtltruauhulumkdkukskjplvtrgrfrkrhrusesismycynzcznetinteduassoososcloudstgbetaaezaeuhkusjshatenadiarycdn77hoptozaptois-a-knightmyftpno-ipjpnddnssdpdnsspdnsbarsysweetpepperis-a-bruinsfanis-very-sweetservegameis-a-soxfanhomelinuxcdn77-secureservebbsmisconfusedwebredirectblogsitefreedesktopcouchpotatofriestoolforgeaccesscamis-lostreadmyblogsmall-webfedorapeopleserveftpis-a-celticsfanmywirepotagertwmailin-dslsellsyourhomeread-booksfreeddnscable-modemis-savednflfanufcfanmlbfanstuff-4-saleendoftheinternetin-vpnmy-firewallhomeftpis-localis-a-chefboldlygoingnowherewebhopselfipkicks-assroxatunkcamdvrfedoraprojectgotdnsdvrdnsdyndnspubtlspimientahomeunixdontexistfedorainfracloudwmflabsfspagesbmoattachmentsteckidsfamilydsdnsaliasdynaliasnow-dnscloudnsdoomdnsduckdnsblogdnshomednsroutingthecloudendofinternetdsmynasip-dynamicpoivronhttpbinmyfirewallis-very-evilmysecuritycamerais-a-linux-userwmcloudis-a-geektuxfamilyis-a-candidatedoesntexistis-very-badhobby-sitegame-hostaltervistais-foundis-a-patsfandnsdojohepforgepodzonedynservcollegefanis-very-goodfrom-meis-very-niceisa-geeknerdpolacmedsldingorgcomnomgobabonetedupleskaemhlxmyboxrockyprvcydeuxfleurspdnscodebergheyflowstatichostorgmilcomnomgobneteduorgcomeduiorgmilcomngonetedugovcloudns1337ngrokacorggogfamcomwebgobnetedugokgopgkpgovgosbizpasaugumicsopozpapuwmwsrprusiskwpspkppspkmpspokeoiawsawifoumsdnskokwpmuppuppsppiwwiwoowuzswkzoschrzpisdnwzmiuwwitdpssewsseumigugimoirmpinbwinbwiihupporzgwgriwupowwskrwioswuozstarostwokonsulattmpccopruszkowmyspreadshopostrodakartuzyopolegminamediaustkazgorajgoraolawailawalomzawloclradombytomjaworznotargilubinkoninzagantorunkutnokepnonakloczestsopotsanokturekplockslasksklepzarowlukowmedaidgdaorgmilrelcomnomatmgsmartneteduelkgovwawsossexbiztgorysejnytychypomorzeboleslawiechomesklepsdscloudunicloudzakopanelegnicarawa-mazbydgoszczswidnikkrasnikwloclawekbielawamragowograjeworealestatebeskidykaszubymalopolskaprzeworskswiebodzinlecznadfirmaszkolawarmiagdyniamiastakazimierz-dolnymalborkswidnicadlugolekaostrolekapodlasieelblagtravelsimplesitezachpomormielecszczecinnieruchomosciwalbrzychlezajsklublinbedzinpoznanwielunmielnooleckostarachowicedkontopowiatwroclawrybniksuwalkileborkslupskgdanskostrowwlkptarnobrzegtourismwegrowkrakowglogowyou2pilanysamailwrocinfoagroautobeepshoppriviqhslapypiszlodzcfolksecommerce-shopmazurypulawyskoczowrzeszowpomorskiezgierzkaliszolkuszlowiczostrowiecsosnowiecmazowszewodzislawbialowiezazgorzeleckatowicepabianicejelenia-gorawolominkarpaczsieradznowarudaczeladzkonskowolaskierniewiceswinoujscieturystykabieszczadycieszynketrzynolsztynbialystokbabia-goraprochowicewarszawastalowa-wolapolkowicegorlicegliwiceponiatowalimanowalubartowaugustowkobierzyceopocznognieznoszczytnokolobrzegshoparenapodhalebielskoklodzkostargardatwithplayitownnamecoorgnetedugovacorgcomproestnetedugovbiznameislaprofinforechtngrokmedaaaacacpaenglawjurbarbarsykeeneticavocatacctcloudnsorgcomsecplonetedugov123paginaweborgcomnetintedugovnomepublidkinbarsygovx443cloudnsorgmilcomnetedugovcooporgmilcomschnetedugovnamecomcannetlibassoaemclantmcontstoreorgcomnomrecwwwbarsyfirminfoshopartsstackitmyddnswebspacelima-cityacincooxorgedugovbarsybrendlyhbvpsvpsspectrumlandinghostingacppmordoviamcprecbgorgmilcomspbnetintedumsknovgovbirrasmcdirmytismircloudvladimirnalchikadygeyamarinepyatigorskmyjinobashkiriaeurodirvladikavkazna4ugroznykustanaikalmykiacldmaildagestaniranbuildcloudcanvaliaravalwixdevelopmentappwritemigrationneedleverceldatabasestackitcodereplravendbonporterlovableaccoorgmilnetgovcoopmedorgcompubschnetedugovservicemecomygovorggovtvmedorgcomnetedugovinfoedgfacbmlonihkutwpsryxzbdtmacfhppmyspreadshopbrandpartiorgcomfhvpress123minsidaitcouldbeworlanbibkommunalforbundfhskiopsyskomvuxkomforbnaturbruksgymnloginlineorgcomnetedugovenscaledeuusentsurgebotdaorgmilcomnetgovnowteleporthashbangplatformlovablebarsyshopwarebasehoplixbarsyonlinemsf5gitpagewawamscofigma-govcaffeinefigmacanvasoltstscwputerbarsysupportchatgptsquareomniweopensocialcpanelplaycodenotionnovecorewpsquaredpreviewjelecyonbyensrhtfastvpspieboxconvexjouwwebheyflowplatformshloginlinemadethissourcecraftclouderaorgorgcomartedugouvunivmeorgcomnetedugovsurveysstatichfheiyuxs4allprojectmyfastubervibehostapp-ionosdeployagentmecoorgcomschnetedugovbizcncostoreorgmilcomneteduembaixadaconsuladokiraranohoprincipesaotomeheliohobarsystorebaseshopwaresellfyaiabkhaziavologdamordoviapenzalenugsochinavoiexnetspbmsknovnorth-kazakhstanashgabadkareliaarmeniageorgiavladimirnalchikivanovobukharaadygeyakhakassiakalugakrasnodarjambylaktyubinsktroitskbryanskobninskkurganazerbaijanpokrovskbashkiriatselinogradvladikavkazmurmansktulatuvamangyshlaktashkentchimkentgroznykaragandatermezarkhangelskkustanaikalmykiabalashoveast-kazakhstankaracoldagestantogliattibarsyredorgcomgobedumirenaccoorgjelasticdiscoursecleverappsschacmiincogoornetonlineshopcogoorgmilcomwebnicnetintedugovbiznametestcoorgmilcomnomnetedugovorangecloudpersoindorgcomfinnatnetgovensmincomtourismintlinfox0611oyaorgmilcomnetedugovquickconnectvpnplusnettprequalifymeaddrmyaddrntdllwadlnctvavdrk12orgmilpolbeltelcomwebgennetedutskkepgovbbsbiznameinfocoorgmilcompronetedugovbiznameinfobetter-thanworse-thansakurafromdyndnson-the-webmymailerorgmilurlcomneteduidvgovmydnsgameclubebizmeneacsccogotvorhotelmilmobiinfovodteiflgplkmsmsbcckhincndnvncoztltmkckppzpdprvcvkvlvcrkrkscxuzchernovtsyrivneyaltaodesavolynrovnolutskltdinforgcomnetedugovbizvinnicazhitomirternopilpoltavakropyvnytskyizaporizhzhiasevastopolsebastopoluzhgoroduzhhorodkharkovkharkivvinnytsiakhmelnytskyizaporizhzhecrimeaodessazhytomyrnikolaevcherkassydonetskluganskluhanskkirovogradivano-frankivskchernivtsikrymkievkyivlvivsumyzakarpattiamykolaivcherkasychernigovkhersonchernihivdnipropetrovskdnepropetrovskkhmelnitskiyneacsccogoorusorgmilcomedugovmyspreadshopadimono-ipbarsybarsyonlinelayershiftnh-servretrosnubapicampaignservicelugaffinitylotteryweeklylotteryraffleentrygluglugsmeaccoindependent-inquestnimsitecopropymntltdorgplcschnetgovnhsbarsyindependent-commissionindependent-reviewpolicepublic-inquiryindependent-panelconnhospindependent-inquiryroyal-commissionoraclegovcloudappscck12libaws-govccphxcclibpvtparochchtrcck12libcceatonk12coglibtecgendstmusann-arborwashtenawcck12glghcck12sealibforksolympiabainbridge-islkeyporthoquiamyarrow-pointcentraliaport-townsendsequimport-ludlowrentonsilverdalebremertonredmondsheltonbellevueport-orchardport-angeleskingstonchehalisaberdeengig-harborseattlepoulsboidmdndsddemenegacalamaiavawapailalflnmdcncscohnhmihiviwiriinmntnmocoutvtctmtgunjokakwvnvprarorasmskstxwynykyazisadninsnngosrvis-bymircloudservernamepointtoenscaledland-4-salefreeddnsstuff-4-saleazure-apinoipdatabricksappscloudnsgolffanheliohostazurewebsitesgvorgmilcomgubneteducoorgcomnetd0egvorgmilcomnetedugovmydnsiacostoree12orgmilcomnomwebgobbibrectecnetintedugovraremprendefirminfoartseducok12orgcomnethidnsidacaiiosonlahanamhanoicamauhueorgcompronetintedugovbizbacninhtayninhhoabinhnamdinhtravinhhaiphongvinhlonghaiduongquangnamquangtrithuathienhuequangninhbacgianghaugiangquangbinhsoctrangbentrethanhphohochiminhdanangkontumhatinhkhanhhoathanhhoahealthgialailaocaiyenbaibackanngheanlonganphuyenphuthocanthodaklakdongnainameinfovinhphucdongthapkiengiangtiengiangquangngailaichaulangsonlamdongdaknonghagiangangiangcaobangbinhduongninhthuanbinhthuanbaclieuthaibinhninhbinhbinhdinhtuyenquanghungyenbaria-vungtauthainguyendienbienbinhphuocschbizputerimagine-proxyorgcomnetedugovcloud66advisormypetsdyndnsxn--8dbq2axn--4dbgdty6cxn--5dbhl8dxn--hebda8bxn--80auxn--d1atxn--c1avgxn--o1acxn--o1achxn--90azhxn--55qx5dxn--uc0atvxn--od0algxn--wcvs22dxn--gmqw5axn--mxtq1mxn--12c1fe0brxn--h3cuzk1dixn--12co0c3b4evaxn--12cfi8ixb8lxn--o3cyx2axn--m3ch0j3axn--j1adpxn--90amcxn--90a1afxn--h1ahnxn--j1ael8bxn--h1alizxn--c1avgxn--j1aefxn--80aaa0cvacxn--41acaffeineexeopentunnelbotdashtelebitorgtmaccoagricorgmilnomwebnicngonetaltedugovlawnisschoolgrondaraccoorgmilcomschnetedugovbizinfoprg1-zeropstritonstackitlimazeropsaccoorgmilgovяспборгкоммскбизмирсамаракрымсочиакодпроргобрупрצהלממשלישובאקדמיהองค์กรธุรกิจรัฐบาลศึกษาทหารเน็ต教育網絡組織公司政府個人닷넷한국澳门新闻澳門联通家電嘉里招聘通販닷컴삼성コムგეбгрфеюadcdbdgdidmdsdtdaebedeeegeiejekemenepereseveyegabacalamanauavapaqasazacfbfafgfnfpfwftfbgcgagggegkgngmgsgpgvgtgugilmlnlalclglplsltlhmimjmkmmmomambmcmdmfmgmzmpmsmtmgbbblbsbecccacnclcmcvctcscmhkhghchbhthphshlinikifigiaibicivisikninhnmncnbngnsnpnvntnjoionomobocoaofodorosotoptstttytatbtetgtithtmtltrusuvuaucueuguhulumunufjdjbjtjsjlkmkhkfkdkcktkukskpkgpmpnpkpjpgqaqmqiqsvtvcvbvmvlvrwpwtwzwbwcwawgwkwmwtrsrprgrfrercrbrarnrmrlrkrirhrwsusrssspsgsesbsaslsmsissxmxaxcxuypysylymykygybycyuztzsznzmzkzdzczbzazελευ世界台灣购物公益点看臺灣网络書籍在线网站手机机构大拿游戏信息台湾谷歌慈善商标香港中国餐厅网址中國商城食品微博政务移动集团公司八卦商店健康网店政府时尚佛山中信娱乐广东企业homedepotengineeringاماراتrepublicankuokgroupversicherungchannelcitadelxn--pgbs0dhxn--b4w605ferdstatebankwebsitexn--mgb9awbf亚马逊淡马锡alibabaxn--ngbc5azdxn--mgbbh1axn--45br5cyltoshibabuildworldcloudtradeguideplacespacedancemoviephoneprimesmilebiblestyleappleazurestoreskypegripexn--l1accdrivelottehorsehouseleasechasereisestadahondaomegaaetnaamicaninjanokiamediadeltavodkaedekaosakapizzaslingemailgmailtirolshelltmallfinallegaltotalhotelamfamforumrehabmusicciticricohcoachwatchboschearthfaithirishmiamiarchidubaiguccipraxiみんなストアセールcanonsalononionnikonepsonkoelngreensevencrownikanoradioaudioweiboglobopromogalloyahoociscorodeovideomangobingotokyovolvolottokyotophotosmartsportquesttrusthyattjetztadultcymrubaidutushuxn--kprw13dubankclickblackmerckgroupsharpcheapnowtvxn--h2brj9cקוםհայоргсрбмонкомбелмкдқазрусукрمصرقطرعربكومdadcfdmedwedredphdthdbidpidkrdmsdltdiceonewmeglemoerwecfageacbanbambaaaammakianraspacpaaxawtfbcgaegongingaigvigorgdogdhlmilrilonlaolloluoljllcalgalnflafltelsrlfrllplkimibmcamcombommomifmabbjcbscbwebcabnabtabmlbpubabcbbcnecincpncllcstcwtcpwcnyckfhbzhovhmoiskiobisbitcifyituipinvinwinxincbnbcnmanfangdnmenrenkpnmtnyunrunfununobiojioriohbogmofooboooooacoecoceongoproartistottnttbbtcateatlatvetpetbetnethktmitfitintjothotgotdotbotprueduicujnjyouinknhktdkappsapgapmapdnptopgopllpjmpzipvipripesqtrvdtvitvdevmovgovhivnrwlawsewnewbmwwownowhowdvrftrmtrsfrbarcartvscrseusawsupsubssbsadsddsldssasbmsmlsxxxboxfoxgmxtjxsextaxbuyflydiysoyjoyskypaydaygayxyzanzbizwebersenerpokerlameractortatarsolarລາວคอมไทยtourslocusnexuslexusgiftsbeatsboatspartspressglassswissकॉमनेटtiresgivescodeshomesgamestunesshoescardswalesloansvegastoolsdealsautosparisファッションworkssucksrocksxeroxforexfedexpartylillymoneystudyrugbytoraytoday中文网xn--unup4y天主教飞利浦新加坡enterprises我爱你嘉里大酒店christmasxn--fct429kholdingsxn--8y0a063axn--mgbx4cd0ablifestyleabogadoallstatenetbankكاثوليكxn--s9brj9cxn--gk3at1ebestbuycharityxn--55qx5dmicrosoftpropertybasketballhomegoodscorsicajewelrygallerygrocerysurgerycountrybrusselsverisignferreroxn--czr694bhdfcbankcommbanksoftbankپاكستانپاکستانnextdirectالسعوديهالعليانxn--h2brj9c8cxn--80adxhksshikshaxn--mgbai9azgqp6jcuisinellabarclayscatholicxn--kpry57dcompanyxn--xhq521bblackfridayxn--mgba3a3ejtsandvikxn--d1acj3bacademydownloadمليسياxn--j1amhxn--w4r85el8fhu5dnraipirangaathletaxn--fhbeixn--mgbqly7cvafrzuerichxn--c2br7gஇலங்கைcontractorsxn--io0a7igraphicsinsurancetemasekxn--xkc2al3hye2amotorcyclesphotographydirectoryplumbingxn--vhquvclothingtrainingcleaningwilliamhilllightingxn--mgba3a4f16ashoppingcateringeducationokinawapicturesventuresproductionsxn--9et52uwalmartഭാരതംsupportrealestatecapitalonexn--nqv7fs00emaauspostfloristdentistxn--qxamgodaddybradescobargainsmitsubishikerryhotelsxn--9dbq2axn--3pxu8kimmobilienxn--fjq720axn--mgbtx2bholidaymckinseymadridbusinessbuildershelsinkixn--4gbrimмоскваالسعودیةcoffeedegreelacaixapartnersalsaceofficeabbvievoyageorangegeorgeonlinechromemobilekindlegoogleoraclecircleschulesecureinsurexn--mgba7c0bbn0aestatexn--mgbc0a9azcgcruisehangoutxn--vuq861bxn--42c2d9arexrothfirestoneuniversityxn--nnx388alifeinsuranceextraspaceонлайнvermögensberatersoftwarexn--fiqs8sxn--mgbab2bdxn--w4rs40ltiendaभारतम्africatoyotaotsukasakuracameracreditcardnagoyaconsultingnetworktheatermonsterprogressivepioneerxn--55qw42gracingdatingvotingvikinglivinggivingxn--bck1b9a5dre4cbrotherweatherjoburgفلسطينlplfinancialxn--clchc0ea0b2g2a9gcdfutbolschoolsocialglobaldentalwoodsidechanelairtelmatteltravelrealtorwebcamstreamభారత్unicomalstomxn--nodexn--6frz82gmuseumfurniturexn--rvc1e0am3exn--mix891faccenturexn--11b4c3dismailineustardiscountquebeccomsecclinicservicesxn--y9a3aqxn--c1avgswatchchurchsearchالاردنmarketingcontacthealthmonashshoujisanofitaipeiamericanexpresssuzukiアマゾンクラウドポイントbhartiグーグルxn--mgberp4a5d4armemorialxn--1qqw23alondonmormoninstitutevisionbostonnortoncouponmaisonamazonvirginberlindesigndurbanolayannissananquanxihuanhitachikaufengardenreisenbayerntechnologydatsunxn--90a3aclatinocasinostudiophysioxn--ngbe9e0apharmacytattootaobaoaramcoexpertreportabbottdirectselectimamatfairwindspictettargetmarketintuittravelersinsurancecreditdupontryukyusuppliesxn--tckwebnpparibasschmidtmerckmsdyodobashirestaurantbridgestonecricketxn--fpcrj9c3dbostikbroadwayattorneylefrakemerckxn--fiq228c5hscareersfarmerswinnersflowersxn--wgbh1cguitarsxn--54b7fta0ccxn--p1acfmakeupgalluplandroverxn--kcrx77d1x4agoldpointbauhausxn--mgbayh7gpahiphopplaystationxn--mgba3a4fraxn--eckvdtc9dhyundaixn--gckr3f0fistanbulticketsmarketsflightschintaireviewsxn--3e0b707ewindowsxn--fiqz9sfinancialxn--fzys8d69uvgmابوظبيdiscoverreviewবাংলাxn--5su34j936bgsgmoscowobserverapartmentsдетиارامكوсайтeurovisionxn--i1b6b1a6a2exn--xkc2dl3a5ee0hتونسموقعبارتڀارتشبكةعمانبيتكعراقreadkredbondlandbandfundfoodprodgoldfordtubecafesafelifeggeeieeefreefagepagegugezonewinememenamegamesaleablebikenikelikecarecbreherefiresaveloveliveblueartedatesitevotecaseluxebofamodaltdaasdatiaayogasinavanashiaasiajavabbvatevavivadatazaraarpacasavisasncfprofmaifsurfgolfdvagsongbingpingwangkpmggoogblogpohlfailcooldellcalldeallidlsarlfilmteamroomfarmimdbarabclubhdfcicbchsbcgmbhrichtechfishdishcashminiernikddiaudiwikimobitaxicitikiwidesiqponskinloanakdnwienopenporncerntownimmolimoolloinfonicofidolegosaxozeroaerovivoautovotomotofastbestresthostpostnextlgbtchatseatgiftmeetdietreitmintrentgentspotscotguruitausohumenucyoubanklinkpinkdclktalksilkbookseekworkrsvpaarpjeepshopcoophelpcamppccwshowbeerstarruhrflirweirhaircarsparsjprshausplusnewstipstoysjobskidsfanspicsdocsxboxamexsexynavycitysonyarmyallybabyplaydeliverybuzzgbizlamborghiniphilipsලංකාಭಾರತfitnessexpresslanxesspfizercenterwalterlawyersoccercareerkosherbrokerlockerdealerdoctorauthorxn--mgbqly7c0a67fbcvermögensberatungjaguarxn--pssy2uxn--hxt814eflickrrepairrogersairbusxn--mgbai9a5eva00beventsyachtsxn--t60b56aভাৰতভারতभारतभारोतviajeshermeshughesxn--j1aefसंगठनvillasଭାରତclaimshotelsભારતzapposphotosjuegoscondostatamotorsgratistennisਭਾਰਤtkmaxxtjmaxxschaeffleryandexxn--80aswgrealtysafetybeautyluxuryxn--3ds443gsupplyfamilyxn--o3cw4hhockeysydneyxn--90aenissayalipayenergycomputeragencyxn--rovu88b電訊盈科xn--gecrj9cstatefarmaccountantaquarelleolayangroup香格里拉xn--p1ai组织机构xn--1ck2e1bxn--mgbt3dhdschwarzموريتانياabudhabinowruzkomatsufujitsuhospitalxn--80asehdbxn--mgbtf8flxn--j6w193gxn--yfro4i67oprudentialxn--flw351ecruisescoursesrecipesxn--e1a4cferrarixn--ses554gxn--wgbl6awatchesstaplessinglesxn--mgbcpq6gpa1axn--otu796dpropertiescreditunionxn--mgbah1a3hjkrdstockholmhisamitsuالسعوديةstcgroupdomainsoriginscouponsbloombergclubmedfroganslimitedxn--80aqecdr1aexposedinternationalequipmentbarclaycardxn--q7ce6axn--mgbi4ecexpprotectionassociatesconstructionxn--cck2b3bxn--45q11candroidfoundationישראלxn--mgbca7dzdocliniqueboutiqueengineerxn--qxa6asystemsfirmdalefashionauctionxn--nqv7finfinitirentalsreliancetradingweddingfishinghostinggentingbookingcookingxn--3hcrj9cgraingerxn--czrs0tdemocratsamsungyokohamaxn--h2breg3evexn--nyqy26alundbeckmelbournevacationssolutionsfrontierxn--vermgensberatung-pwbmanagementxn--cg4bkixn--mgb2ddeslincolnhamburgsandvikcoromantblockbusterairforcebarefootxn--4dbrk0ceinvestmentsfeedbackcommunityxn--ngbrxالبحرينdiamondsamsterdamhealthcareredumbrellaxn--mxtq1mxn--2scrj9cagakhanxn--mgbpl2fhкатоликcaravanசிங்கப்பூர்richardlimortgageamericanfamilyxn--fzc2c9e2cscholarshipssaarlandxn--imr513nvlaanderensamsclubgoodyearkitchenஇந்தியாweatherchannelallfinanzxn--kput3iالسعودیۃxn--90aisxn--efvy88hالجزائرxn--mgbaam7a8hexchangejpmorganxn--tiq49xqyjfidelitysecurityxn--mk1bu44cwanggouxn--fiq64bxn--6qq986b3xlxn--mgbbh1a71exn--80ao21amarshallsxn--5tzm5gtravelerspanasoniclatrobeyoutubeaccountantsxn--rhqv96gxn--cckwcxetdanalyticsxn--ygbi2ammxبازاربھارتسوريةorganicfreseniusسورياxn--9krt00axn--qcka1pmcxn--jlq480n2rgdeloittesciencefinancexn--jvr189mxn--30rr7yhomesensehotmailbaseballfootballleclercboehringerxn--q9jyb4cxn--mix082fاليمنهمراهpolitieسودانايرانایرانnetflixyamaxunxn--lgbbat1ad8jcollegestoragecapetowncolognekerrypropertiesxn--mgbgu82axn--ogbpf8flxn--czru2dwhoswhociprianilasallexn--g2xx48cforsalebanamexaudiblexn--vermgensberater-ctbxn--zfr164bericssonvanguardxn--45brj9cindustriestheatremarriottxn--3bst00mcomparexn--mgberp4a5d4a87gcapitaldigitalالمغربbarcelonashangrilaxn--d1alfcalvinkleinwwwcitysapporokawasakinagoyasendaikobekitakyushuyokohamackjp".charCodeAt(offset + i) !== hostname.charCodeAt(start + i)) return false;
	return true;
}
/**
* Find the child edge of `node` whose label is `hostname[start, start + length)`.
* Edges are sorted by hash, so binary-search the hash then verify the label
* (scanning the rare run of equal hashes). Returns the edge index or -1.
*/
function findEdge(node, hash, hostname, start, length) {
	let lo = edgeStart[node];
	let hi = edgeStart[node + 1];
	while (lo < hi) {
		const mid = lo + hi >>> 1;
		const value = edgeHash[mid];
		if (value < hash) lo = mid + 1;
		else if (value > hash) hi = mid;
		else {
			for (let e = mid; e >= lo && edgeHash[e] === hash; e -= 1) if (labelEquals(e, hostname, start, length)) return e;
			for (let e = mid + 1; e < hi && edgeHash[e] === hash; e += 1) if (labelEquals(e, hostname, start, length)) return e;
			return -1;
		}
	}
	return -1;
}
/**
* Walk `hostname`'s labels right-to-left from `root`, recording the deepest
* node whose flag passes `allowedMask` (with the label boundaries of that match
* in `matchStart`/`matchEnd`). Returns whether any match was found.
*/
function walk(hostname, root, allowedMask) {
	let node = root;
	let end = hostname.length;
	let hash = 5381;
	matchNode = -1;
	for (let i = hostname.length - 1; i >= 0; i -= 1) {
		const code = hostname.charCodeAt(i);
		if (code === 46) {
			const start = i + 1;
			let edge = findEdge(node, hash >>> 0, hostname, start, end - start);
			if (edge === -1) edge = wildcardEdge[node];
			if (edge === -1) return matchNode !== -1;
			node = edgeChild[edge];
			if ((nodeFlags[node] & allowedMask) !== 0) {
				matchNode = node;
				matchStart = start;
				matchEnd = end;
			}
			end = i;
			hash = 5381;
		} else hash = hash * 33 ^ code;
	}
	let edge = findEdge(node, hash >>> 0, hostname, 0, end);
	if (edge === -1) edge = wildcardEdge[node];
	if (edge !== -1) {
		node = edgeChild[edge];
		if ((nodeFlags[node] & allowedMask) !== 0) {
			matchNode = node;
			matchStart = 0;
			matchEnd = end;
		}
	}
	return matchNode !== -1;
}
/**
* Check if `hostname` has a valid public suffix in the trie.
*/
function suffixLookup(hostname, options, out) {
	if (fast_path_default(hostname, options, out)) return;
	const allowedMask = (options.allowPrivateDomains ? 2 : 0) | (options.allowIcannDomains ? 1 : 0);
	if (walk(hostname, 657, allowedMask)) {
		out.isIcann = (nodeFlags[matchNode] & 1) !== 0;
		out.isPrivate = (nodeFlags[matchNode] & 2) !== 0;
		out.publicSuffix = hostname.slice(matchEnd + 1);
		return;
	}
	if (walk(hostname, 653, allowedMask)) {
		out.isIcann = (nodeFlags[matchNode] & 1) !== 0;
		out.isPrivate = (nodeFlags[matchNode] & 2) !== 0;
		out.publicSuffix = hostname.slice(matchStart);
		return;
	}
	out.isIcann = false;
	out.isPrivate = false;
	const lastDot = hostname.lastIndexOf(".");
	out.publicSuffix = lastDot === -1 ? hostname : hostname.slice(lastDot + 1);
}
//#endregion
//#region node_modules/tldts/dist/es6/index.js
var RESULT = getEmptyResult();
function getDomain(url, options) {
	resetResult(RESULT);
	return parseImpl(url, 3, suffixLookup, options, RESULT).domain;
}
//#endregion
//#region node_modules/msw/node_modules/tough-cookie/dist/index.js
function pathMatch(reqPath, cookiePath) {
	if (cookiePath === reqPath) return true;
	if (reqPath.indexOf(cookiePath) === 0) {
		if (cookiePath[cookiePath.length - 1] === "/") return true;
		if (reqPath.startsWith(cookiePath) && reqPath[cookiePath.length] === "/") return true;
	}
	return false;
}
var SPECIAL_USE_DOMAINS = [
	"local",
	"example",
	"invalid",
	"localhost",
	"test"
];
var SPECIAL_TREATMENT_DOMAINS = ["localhost", "invalid"];
var defaultGetPublicSuffixOptions = {
	allowSpecialUseDomain: false,
	ignoreError: false
};
function getPublicSuffix(domain, options = {}) {
	options = {
		...defaultGetPublicSuffixOptions,
		...options
	};
	const domainParts = domain.split(".");
	const topLevelDomain = domainParts[domainParts.length - 1];
	const allowSpecialUseDomain = !!options.allowSpecialUseDomain;
	const ignoreError = !!options.ignoreError;
	if (allowSpecialUseDomain && topLevelDomain !== void 0 && SPECIAL_USE_DOMAINS.includes(topLevelDomain)) {
		if (domainParts.length > 1) return `${domainParts[domainParts.length - 2]}.${topLevelDomain}`;
		else if (SPECIAL_TREATMENT_DOMAINS.includes(topLevelDomain)) return topLevelDomain;
	}
	if (!ignoreError && topLevelDomain !== void 0 && SPECIAL_USE_DOMAINS.includes(topLevelDomain)) throw new Error(`Cookie has domain set to the public suffix "${topLevelDomain}" which is a special use domain. To allow this, configure your CookieJar with {allowSpecialUseDomain: true, rejectPublicSuffixes: false}.`);
	const publicSuffix = getDomain(domain, {
		allowIcannDomains: true,
		allowPrivateDomains: true
	});
	if (publicSuffix) return publicSuffix;
}
function permuteDomain(domain, allowSpecialUseDomain) {
	const pubSuf = getPublicSuffix(domain, { allowSpecialUseDomain });
	if (!pubSuf) return;
	if (pubSuf == domain) return [domain];
	if (domain.slice(-1) == ".") domain = domain.slice(0, -1);
	const parts = domain.slice(0, -(pubSuf.length + 1)).split(".").reverse();
	let cur = pubSuf;
	const permutations = [cur];
	while (parts.length) {
		cur = `${parts.shift()}.${cur}`;
		permutations.push(cur);
	}
	return permutations;
}
var Store = class {
	constructor() {
		this.synchronous = false;
	}
	/**
	* @internal No doc because this is an overload that supports the implementation
	*/
	findCookie(_domain, _path, _key, _callback) {
		throw new Error("findCookie is not implemented");
	}
	/**
	* @internal No doc because this is an overload that supports the implementation
	*/
	findCookies(_domain, _path, _allowSpecialUseDomain = false, _callback) {
		throw new Error("findCookies is not implemented");
	}
	/**
	* @internal No doc because this is an overload that supports the implementation
	*/
	putCookie(_cookie, _callback) {
		throw new Error("putCookie is not implemented");
	}
	/**
	* @internal No doc because this is an overload that supports the implementation
	*/
	updateCookie(_oldCookie, _newCookie, _callback) {
		throw new Error("updateCookie is not implemented");
	}
	/**
	* @internal No doc because this is an overload that supports the implementation
	*/
	removeCookie(_domain, _path, _key, _callback) {
		throw new Error("removeCookie is not implemented");
	}
	/**
	* @internal No doc because this is an overload that supports the implementation
	*/
	removeCookies(_domain, _path, _callback) {
		throw new Error("removeCookies is not implemented");
	}
	/**
	* @internal No doc because this is an overload that supports the implementation
	*/
	removeAllCookies(_callback) {
		throw new Error("removeAllCookies is not implemented");
	}
	/**
	* @internal No doc because this is an overload that supports the implementation
	*/
	getAllCookies(_callback) {
		throw new Error("getAllCookies is not implemented (therefore jar cannot be serialized)");
	}
};
var objectToString = (obj) => Object.prototype.toString.call(obj);
var safeArrayToString = (arr, seenArrays) => {
	if (typeof arr.join !== "function") return objectToString(arr);
	seenArrays.add(arr);
	return arr.map((val) => val === null || val === void 0 || seenArrays.has(val) ? "" : safeToStringImpl(val, seenArrays)).join();
};
var safeToStringImpl = (val, seenArrays = /* @__PURE__ */ new WeakSet()) => {
	if (typeof val !== "object" || val === null) return String(val);
	else if (typeof val.toString === "function") return Array.isArray(val) ? safeArrayToString(val, seenArrays) : String(val);
	else return objectToString(val);
};
var safeToString = (val) => safeToStringImpl(val);
function createPromiseCallback(cb) {
	let callback;
	let resolve;
	let reject;
	const promise = new Promise((_resolve, _reject) => {
		resolve = _resolve;
		reject = _reject;
	});
	if (typeof cb === "function") callback = (err, result) => {
		try {
			if (err) cb(err);
			else cb(null, result);
		} catch (e) {
			reject(e instanceof Error ? e : /* @__PURE__ */ new Error());
		}
	};
	else callback = (err, result) => {
		try {
			if (err) reject(err);
			else resolve(result);
		} catch (e) {
			reject(e instanceof Error ? e : /* @__PURE__ */ new Error());
		}
	};
	return {
		promise,
		callback,
		resolve: (value) => {
			callback(null, value);
			return promise;
		},
		reject: (error) => {
			callback(error);
			return promise;
		}
	};
}
function inOperator(k, o) {
	return k in o;
}
var MemoryCookieStore = class extends Store {
	/**
	* Create a new {@link MemoryCookieStore}.
	*/
	constructor() {
		super();
		this.synchronous = true;
		this.idx = /* @__PURE__ */ Object.create(null);
	}
	/**
	* @internal No doc because this is an overload that supports the implementation
	*/
	findCookie(domain, path, key, callback) {
		const promiseCallback = createPromiseCallback(callback);
		if (domain == null || path == null || key == null) return promiseCallback.resolve(void 0);
		const result = this.idx[domain]?.[path]?.[key];
		return promiseCallback.resolve(result);
	}
	/**
	* @internal No doc because this is an overload that supports the implementation
	*/
	findCookies(domain, path, allowSpecialUseDomain = false, callback) {
		if (typeof allowSpecialUseDomain === "function") {
			callback = allowSpecialUseDomain;
			allowSpecialUseDomain = true;
		}
		const results = [];
		const promiseCallback = createPromiseCallback(callback);
		if (!domain) return promiseCallback.resolve([]);
		let pathMatcher;
		if (!path) pathMatcher = function matchAll(domainIndex) {
			for (const curPath in domainIndex) {
				const pathIndex = domainIndex[curPath];
				for (const key in pathIndex) {
					const value = pathIndex[key];
					if (value) results.push(value);
				}
			}
		};
		else pathMatcher = function matchRFC(domainIndex) {
			for (const cookiePath in domainIndex) if (pathMatch(path, cookiePath)) {
				const pathIndex = domainIndex[cookiePath];
				for (const key in pathIndex) {
					const value = pathIndex[key];
					if (value) results.push(value);
				}
			}
		};
		const domains = permuteDomain(domain, allowSpecialUseDomain) || [domain];
		const idx = this.idx;
		domains.forEach((curDomain) => {
			const domainIndex = idx[curDomain];
			if (!domainIndex) return;
			pathMatcher(domainIndex);
		});
		return promiseCallback.resolve(results);
	}
	/**
	* @internal No doc because this is an overload that supports the implementation
	*/
	putCookie(cookie, callback) {
		const promiseCallback = createPromiseCallback(callback);
		const { domain, path, key } = cookie;
		if (domain == null || path == null || key == null) return promiseCallback.resolve(void 0);
		const domainEntry = this.idx[domain] ?? /* @__PURE__ */ Object.create(null);
		this.idx[domain] = domainEntry;
		const pathEntry = domainEntry[path] ?? /* @__PURE__ */ Object.create(null);
		domainEntry[path] = pathEntry;
		pathEntry[key] = cookie;
		return promiseCallback.resolve(void 0);
	}
	/**
	* @internal No doc because this is an overload that supports the implementation
	*/
	updateCookie(_oldCookie, newCookie, callback) {
		if (callback) this.putCookie(newCookie, callback);
		else return this.putCookie(newCookie);
	}
	/**
	* @internal No doc because this is an overload that supports the implementation
	*/
	removeCookie(domain, path, key, callback) {
		const promiseCallback = createPromiseCallback(callback);
		delete this.idx[domain]?.[path]?.[key];
		return promiseCallback.resolve(void 0);
	}
	/**
	* @internal No doc because this is an overload that supports the implementation
	*/
	removeCookies(domain, path, callback) {
		const promiseCallback = createPromiseCallback(callback);
		const domainEntry = this.idx[domain];
		if (domainEntry) if (path) delete domainEntry[path];
		else delete this.idx[domain];
		return promiseCallback.resolve(void 0);
	}
	/**
	* @internal No doc because this is an overload that supports the implementation
	*/
	removeAllCookies(callback) {
		const promiseCallback = createPromiseCallback(callback);
		this.idx = /* @__PURE__ */ Object.create(null);
		return promiseCallback.resolve(void 0);
	}
	/**
	* @internal No doc because this is an overload that supports the implementation
	*/
	getAllCookies(callback) {
		const promiseCallback = createPromiseCallback(callback);
		const cookies = [];
		const idx = this.idx;
		Object.keys(idx).forEach((domain) => {
			const domainEntry = idx[domain] ?? {};
			Object.keys(domainEntry).forEach((path) => {
				const pathEntry = domainEntry[path] ?? {};
				Object.keys(pathEntry).forEach((key) => {
					const keyEntry = pathEntry[key];
					if (keyEntry != null) cookies.push(keyEntry);
				});
			});
		});
		cookies.sort((a, b) => {
			return (a.creationIndex || 0) - (b.creationIndex || 0);
		});
		return promiseCallback.resolve(cookies);
	}
};
function isNonEmptyString(data) {
	return isString(data) && data !== "";
}
function isEmptyString(data) {
	return data === "" || data instanceof String && data.toString() === "";
}
function isString(data) {
	return typeof data === "string" || data instanceof String;
}
function isObject$1(data) {
	return objectToString(data) === "[object Object]";
}
function validate(bool, cbOrMessage, message) {
	if (bool) return;
	const cb = typeof cbOrMessage === "function" ? cbOrMessage : void 0;
	let options = typeof cbOrMessage === "function" ? message : cbOrMessage;
	if (!isObject$1(options)) options = "[object Object]";
	const err = new ParameterError(safeToString(options));
	if (cb) cb(err);
	else throw err;
}
var ParameterError = class extends Error {};
var version = "6.0.2";
var PrefixSecurityEnum = {
	SILENT: "silent",
	STRICT: "strict",
	DISABLED: "unsafe-disabled"
};
Object.freeze(PrefixSecurityEnum);
var IP_V6_REGEX = `
\\[?(?:
(?:[a-fA-F\\d]{1,4}:){7}(?:[a-fA-F\\d]{1,4}|:)|
(?:[a-fA-F\\d]{1,4}:){6}(?:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)){3}|:[a-fA-F\\d]{1,4}|:)|
(?:[a-fA-F\\d]{1,4}:){5}(?::(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)){3}|(?::[a-fA-F\\d]{1,4}){1,2}|:)|
(?:[a-fA-F\\d]{1,4}:){4}(?:(?::[a-fA-F\\d]{1,4}){0,1}:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)){3}|(?::[a-fA-F\\d]{1,4}){1,3}|:)|
(?:[a-fA-F\\d]{1,4}:){3}(?:(?::[a-fA-F\\d]{1,4}){0,2}:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)){3}|(?::[a-fA-F\\d]{1,4}){1,4}|:)|
(?:[a-fA-F\\d]{1,4}:){2}(?:(?::[a-fA-F\\d]{1,4}){0,3}:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)){3}|(?::[a-fA-F\\d]{1,4}){1,5}|:)|
(?:[a-fA-F\\d]{1,4}:){1}(?:(?::[a-fA-F\\d]{1,4}){0,4}:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)){3}|(?::[a-fA-F\\d]{1,4}){1,6}|:)|
(?::(?:(?::[a-fA-F\\d]{1,4}){0,5}:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)){3}|(?::[a-fA-F\\d]{1,4}){1,7}|:))
)(?:%[0-9a-zA-Z]{1,})?\\]?
`.replace(/\s*\/\/.*$/gm, "").replace(/\n/g, "").trim();
var IP_V6_REGEX_OBJECT = new RegExp(`^${IP_V6_REGEX}$`);
var IP_V4_REGEX_OBJECT = new RegExp(`^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$`);
function domainToASCII(domain) {
	return new URL(`http://${domain}`).hostname;
}
function canonicalDomain(domainName) {
	if (domainName == null) return;
	let str = domainName.trim().replace(/^\./, "");
	if (IP_V6_REGEX_OBJECT.test(str)) {
		if (!str.startsWith("[")) str = "[" + str;
		if (!str.endsWith("]")) str = str + "]";
		return domainToASCII(str).slice(1, -1);
	}
	if (/[^\u0001-\u007f]/.test(str)) return domainToASCII(str);
	return str.toLowerCase();
}
function formatDate(date) {
	return date.toUTCString();
}
function parseDate(cookieDate) {
	if (!cookieDate) return;
	const flags = {
		foundTime: void 0,
		foundDayOfMonth: void 0,
		foundMonth: void 0,
		foundYear: void 0
	};
	const dateTokens = cookieDate.split(DELIMITER).filter((token) => token.length > 0);
	for (const dateToken of dateTokens) {
		if (flags.foundTime === void 0) {
			const [, hours, minutes, seconds] = TIME.exec(dateToken) || [];
			if (hours != void 0 && minutes != void 0 && seconds != void 0) {
				const parsedHours = parseInt(hours, 10);
				const parsedMinutes = parseInt(minutes, 10);
				const parsedSeconds = parseInt(seconds, 10);
				if (!isNaN(parsedHours) && !isNaN(parsedMinutes) && !isNaN(parsedSeconds)) {
					flags.foundTime = {
						hours: parsedHours,
						minutes: parsedMinutes,
						seconds: parsedSeconds
					};
					continue;
				}
			}
		}
		if (flags.foundDayOfMonth === void 0 && DAY_OF_MONTH.test(dateToken)) {
			const dayOfMonth = parseInt(dateToken, 10);
			if (!isNaN(dayOfMonth)) {
				flags.foundDayOfMonth = dayOfMonth;
				continue;
			}
		}
		if (flags.foundMonth === void 0 && MONTH.test(dateToken)) {
			const month = months.indexOf(dateToken.substring(0, 3).toLowerCase());
			if (month >= 0 && month <= 11) {
				flags.foundMonth = month;
				continue;
			}
		}
		if (flags.foundYear === void 0 && YEAR.test(dateToken)) {
			const parsedYear = parseInt(dateToken, 10);
			if (!isNaN(parsedYear)) {
				flags.foundYear = parsedYear;
				continue;
			}
		}
	}
	if (flags.foundYear !== void 0 && flags.foundYear >= 70 && flags.foundYear <= 99) flags.foundYear += 1900;
	if (flags.foundYear !== void 0 && flags.foundYear >= 0 && flags.foundYear <= 69) flags.foundYear += 2e3;
	if (flags.foundDayOfMonth === void 0 || flags.foundMonth === void 0 || flags.foundYear === void 0 || flags.foundTime === void 0) return;
	if (flags.foundDayOfMonth < 1 || flags.foundDayOfMonth > 31) return;
	if (flags.foundYear < 1601) return;
	if (flags.foundTime.hours > 23) return;
	if (flags.foundTime.minutes > 59) return;
	if (flags.foundTime.seconds > 59) return;
	const date = new Date(Date.UTC(flags.foundYear, flags.foundMonth, flags.foundDayOfMonth, flags.foundTime.hours, flags.foundTime.minutes, flags.foundTime.seconds));
	if (date.getUTCFullYear() !== flags.foundYear || date.getUTCMonth() !== flags.foundMonth || date.getUTCDate() !== flags.foundDayOfMonth) return;
	return date;
}
var months = [
	"jan",
	"feb",
	"mar",
	"apr",
	"may",
	"jun",
	"jul",
	"aug",
	"sep",
	"oct",
	"nov",
	"dec"
];
var DELIMITER = /[\x09\x20-\x2F\x3B-\x40\x5B-\x60\x7B-\x7E]/;
var TIME = /^(\d{1,2}):(\d{1,2}):(\d{1,2})(?:[\x00-\x2F\x3A-\xFF][\x00-\xFF]*)?$/;
var DAY_OF_MONTH = /^[0-9]{1,2}(?:[\x00-\x2F\x3A-\xFF][\x00-\xFF]*)?$/;
var MONTH = /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[\x00-\xFF]*$/i;
var YEAR = /^[\x30-\x39]{2,4}(?:[\x00-\x2F\x3A-\xFF][\x00-\xFF]*)?$/;
var COOKIE_OCTETS = /^[\x21\x23-\x2B\x2D-\x3A\x3C-\x5B\x5D-\x7E]+$/;
var PATH_VALUE = /[\x20-\x3A\x3C-\x7E]+/;
var CONTROL_CHARS = /[\x00-\x1F]/;
var TERMINATORS = [
	"\n",
	"\r",
	"\0"
];
function trimTerminator(str) {
	if (isEmptyString(str)) return str;
	for (let t = 0; t < TERMINATORS.length; t++) {
		const terminator = TERMINATORS[t];
		const terminatorIdx = terminator ? str.indexOf(terminator) : -1;
		if (terminatorIdx !== -1) str = str.slice(0, terminatorIdx);
	}
	return str;
}
function parseCookiePair(cookiePair, looseMode) {
	cookiePair = trimTerminator(cookiePair);
	let firstEq = cookiePair.indexOf("=");
	if (looseMode) {
		if (firstEq === 0) {
			cookiePair = cookiePair.substring(1);
			firstEq = cookiePair.indexOf("=");
		}
	} else if (firstEq <= 0) return;
	let cookieName, cookieValue;
	if (firstEq <= 0) {
		cookieName = "";
		cookieValue = cookiePair.trim();
	} else {
		cookieName = cookiePair.slice(0, firstEq).trim();
		cookieValue = cookiePair.slice(firstEq + 1).trim();
	}
	if (CONTROL_CHARS.test(cookieName) || CONTROL_CHARS.test(cookieValue)) return;
	const c = new Cookie();
	c.key = cookieName;
	c.value = cookieValue;
	return c;
}
function parse$2(str, options) {
	if (isEmptyString(str) || !isString(str)) return;
	str = str.trim();
	const firstSemi = str.indexOf(";");
	const c = parseCookiePair(firstSemi === -1 ? str : str.slice(0, firstSemi), options?.loose ?? false);
	if (!c) return;
	if (firstSemi === -1) return c;
	const unparsed = str.slice(firstSemi + 1).trim();
	if (unparsed.length === 0) return c;
	const cookie_avs = unparsed.split(";");
	while (cookie_avs.length) {
		const av = (cookie_avs.shift() ?? "").trim();
		if (av.length === 0) continue;
		const av_sep = av.indexOf("=");
		let av_key, av_value;
		if (av_sep === -1) {
			av_key = av;
			av_value = null;
		} else {
			av_key = av.slice(0, av_sep);
			av_value = av.slice(av_sep + 1);
		}
		av_key = av_key.trim().toLowerCase();
		if (av_value) av_value = av_value.trim();
		switch (av_key) {
			case "expires":
				if (av_value) {
					const exp = parseDate(av_value);
					if (exp) c.expires = exp;
				}
				break;
			case "max-age":
				if (av_value) {
					if (/^-?[0-9]+$/.test(av_value)) {
						const delta = parseInt(av_value, 10);
						c.setMaxAge(delta);
					}
				}
				break;
			case "domain":
				if (av_value) {
					const domain = av_value.trim().replace(/^\./, "");
					if (domain) c.domain = domain.toLowerCase();
				}
				break;
			case "path":
				c.path = av_value && av_value[0] === "/" ? av_value : null;
				break;
			case "secure":
				c.secure = true;
				break;
			case "httponly":
				c.httpOnly = true;
				break;
			case "samesite":
				switch (av_value ? av_value.toLowerCase() : "") {
					case "strict":
						c.sameSite = "strict";
						break;
					case "lax":
						c.sameSite = "lax";
						break;
					case "none":
						c.sameSite = "none";
						break;
					default: c.sameSite = void 0;
				}
				break;
			default:
				c.extensions = c.extensions || [];
				c.extensions.push(av);
		}
	}
	return c;
}
function fromJSON(str) {
	if (!str || isEmptyString(str)) return;
	let obj;
	if (typeof str === "string") try {
		obj = JSON.parse(str);
	} catch {
		return;
	}
	else obj = str;
	const c = new Cookie();
	Cookie.serializableProperties.forEach((prop) => {
		if (obj && typeof obj === "object" && inOperator(prop, obj)) {
			const val = obj[prop];
			if (val === void 0) return;
			if (inOperator(prop, cookieDefaults) && val === cookieDefaults[prop]) return;
			switch (prop) {
				case "key":
				case "value":
				case "sameSite":
					if (typeof val === "string") c[prop] = val;
					break;
				case "expires":
				case "creation":
				case "lastAccessed":
					if (typeof val === "number" || typeof val === "string" || val instanceof Date) c[prop] = obj[prop] == "Infinity" ? "Infinity" : new Date(val);
					else if (val === null) c[prop] = null;
					break;
				case "maxAge":
					if (typeof val === "number" || val === "Infinity" || val === "-Infinity") c[prop] = val;
					break;
				case "domain":
				case "path":
					if (typeof val === "string" || val === null) c[prop] = val;
					break;
				case "secure":
				case "httpOnly":
					if (typeof val === "boolean") c[prop] = val;
					break;
				case "extensions":
					if (Array.isArray(val) && val.every((item) => typeof item === "string")) c[prop] = val;
					break;
				case "hostOnly":
				case "pathIsDefault": if (typeof val === "boolean" || val === null) c[prop] = val;
			}
		}
	});
	return c;
}
var cookieDefaults = {
	key: "",
	value: "",
	expires: "Infinity",
	maxAge: null,
	domain: null,
	path: null,
	secure: false,
	httpOnly: false,
	extensions: null,
	hostOnly: null,
	pathIsDefault: null,
	creation: null,
	lastAccessed: null,
	sameSite: void 0
};
var _Cookie = class _Cookie {
	/**
	* Create a new Cookie instance.
	* @public
	* @param options - The attributes to set on the cookie
	*/
	constructor(options = {}) {
		this.key = options.key ?? cookieDefaults.key;
		this.value = options.value ?? cookieDefaults.value;
		this.expires = options.expires ?? cookieDefaults.expires;
		this.maxAge = options.maxAge ?? cookieDefaults.maxAge;
		this.domain = options.domain ?? cookieDefaults.domain;
		this.path = options.path ?? cookieDefaults.path;
		this.secure = options.secure ?? cookieDefaults.secure;
		this.httpOnly = options.httpOnly ?? cookieDefaults.httpOnly;
		this.extensions = options.extensions ?? cookieDefaults.extensions;
		this.creation = options.creation ?? cookieDefaults.creation;
		this.hostOnly = options.hostOnly ?? cookieDefaults.hostOnly;
		this.pathIsDefault = options.pathIsDefault ?? cookieDefaults.pathIsDefault;
		this.lastAccessed = options.lastAccessed ?? cookieDefaults.lastAccessed;
		this.sameSite = options.sameSite ?? cookieDefaults.sameSite;
		this.creation = options.creation ?? /* @__PURE__ */ new Date();
		Object.defineProperty(this, "creationIndex", {
			configurable: false,
			enumerable: false,
			writable: true,
			value: ++_Cookie.cookiesCreated
		});
		this.creationIndex = _Cookie.cookiesCreated;
	}
	[/* @__PURE__ */ Symbol.for("nodejs.util.inspect.custom")]() {
		const now = Date.now();
		const hostOnly = this.hostOnly != null ? this.hostOnly.toString() : "?";
		const createAge = this.creation && this.creation !== "Infinity" ? `${String(now - this.creation.getTime())}ms` : "?";
		const accessAge = this.lastAccessed && this.lastAccessed !== "Infinity" ? `${String(now - this.lastAccessed.getTime())}ms` : "?";
		return `Cookie="${this.toString()}; hostOnly=${hostOnly}; aAge=${accessAge}; cAge=${createAge}"`;
	}
	/**
	* For convenience in using `JSON.stringify(cookie)`. Returns a plain-old Object that can be JSON-serialized.
	*
	* @remarks
	* - Any `Date` properties (such as {@link Cookie.expires}, {@link Cookie.creation}, and {@link Cookie.lastAccessed}) are exported in ISO format (`Date.toISOString()`).
	*
	*  - Custom Cookie properties are discarded. In tough-cookie 1.x, since there was no {@link Cookie.toJSON} method explicitly defined, all enumerable properties were captured.
	*      If you want a property to be serialized, add the property name to {@link Cookie.serializableProperties}.
	*/
	toJSON() {
		const obj = {};
		for (const prop of _Cookie.serializableProperties) {
			const val = this[prop];
			if (val === cookieDefaults[prop]) continue;
			switch (prop) {
				case "key":
				case "value":
				case "sameSite":
					if (typeof val === "string") obj[prop] = val;
					break;
				case "expires":
				case "creation":
				case "lastAccessed":
					if (typeof val === "number" || typeof val === "string" || val instanceof Date) obj[prop] = val == "Infinity" ? "Infinity" : new Date(val).toISOString();
					else if (val === null) obj[prop] = null;
					break;
				case "maxAge":
					if (typeof val === "number" || val === "Infinity" || val === "-Infinity") obj[prop] = val;
					break;
				case "domain":
				case "path":
					if (typeof val === "string" || val === null) obj[prop] = val;
					break;
				case "secure":
				case "httpOnly":
					if (typeof val === "boolean") obj[prop] = val;
					break;
				case "extensions":
					if (Array.isArray(val)) obj[prop] = val;
					break;
				case "hostOnly":
				case "pathIsDefault": if (typeof val === "boolean" || val === null) obj[prop] = val;
			}
		}
		return obj;
	}
	/**
	* Does a deep clone of this cookie, implemented exactly as `Cookie.fromJSON(cookie.toJSON())`.
	* @public
	*/
	clone() {
		return fromJSON(this.toJSON());
	}
	/**
	* Validates cookie attributes for semantic correctness. Useful for "lint" checking any `Set-Cookie` headers you generate.
	* For now, it returns a boolean, but eventually could return a reason string.
	*
	* @remarks
	* Works for a few things, but is by no means comprehensive.
	*
	* @beta
	*/
	validate() {
		if (!this.value || !COOKIE_OCTETS.test(this.value)) return false;
		if (this.expires != "Infinity" && !(this.expires instanceof Date) && !parseDate(this.expires)) return false;
		if (this.maxAge != null && this.maxAge !== "Infinity" && (this.maxAge === "-Infinity" || this.maxAge <= 0)) return false;
		if (this.path != null && !PATH_VALUE.test(this.path)) return false;
		const cdomain = this.cdomain();
		if (cdomain) {
			if (cdomain.match(/\.$/)) return false;
			if (getPublicSuffix(cdomain) == null) return false;
		}
		return true;
	}
	/**
	* Sets the 'Expires' attribute on a cookie.
	*
	* @remarks
	* When given a `string` value it will be parsed with {@link parseDate}. If the value can't be parsed as a cookie date
	* then the 'Expires' attribute will be set to `"Infinity"`.
	*
	* @param exp - the new value for the 'Expires' attribute of the cookie.
	*/
	setExpires(exp) {
		if (exp instanceof Date) this.expires = exp;
		else this.expires = parseDate(exp) || "Infinity";
	}
	/**
	* Sets the 'Max-Age' attribute (in seconds) on a cookie.
	*
	* @remarks
	* Coerces `-Infinity` to `"-Infinity"` and `Infinity` to `"Infinity"` so it can be serialized to JSON.
	*
	* @param age - the new value for the 'Max-Age' attribute (in seconds).
	*/
	setMaxAge(age) {
		if (age === Infinity) this.maxAge = "Infinity";
		else if (age === -Infinity) this.maxAge = "-Infinity";
		else this.maxAge = age;
	}
	/**
	* Encodes to a `Cookie` header value (specifically, the {@link Cookie.key} and {@link Cookie.value} properties joined with "=").
	* @public
	*/
	cookieString() {
		const val = this.value || "";
		if (this.key) return `${this.key}=${val}`;
		return val;
	}
	/**
	* Encodes to a `Set-Cookie header` value.
	* @public
	*/
	toString() {
		let str = this.cookieString();
		if (this.expires != "Infinity") {
			if (this.expires instanceof Date) str += `; Expires=${formatDate(this.expires)}`;
		}
		if (this.maxAge != null && this.maxAge != Infinity) str += `; Max-Age=${String(this.maxAge)}`;
		if (this.domain && !this.hostOnly) str += `; Domain=${this.domain}`;
		if (this.path) str += `; Path=${this.path}`;
		if (this.secure) str += "; Secure";
		if (this.httpOnly) str += "; HttpOnly";
		if (this.sameSite && this.sameSite !== "none") if (this.sameSite.toLowerCase() === _Cookie.sameSiteCanonical.lax.toLowerCase()) str += `; SameSite=${_Cookie.sameSiteCanonical.lax}`;
		else if (this.sameSite.toLowerCase() === _Cookie.sameSiteCanonical.strict.toLowerCase()) str += `; SameSite=${_Cookie.sameSiteCanonical.strict}`;
		else str += `; SameSite=${this.sameSite}`;
		if (this.extensions) this.extensions.forEach((ext) => {
			str += `; ${ext}`;
		});
		return str;
	}
	/**
	* Computes the TTL relative to now (milliseconds).
	*
	* @remarks
	* - `Infinity` is returned for cookies without an explicit expiry
	*
	* - `0` is returned if the cookie is expired.
	*
	* - Otherwise a time-to-live in milliseconds is returned.
	*
	* @param now - passing an explicit value is mostly used for testing purposes since this defaults to the `Date.now()`
	* @public
	*/
	TTL(now = Date.now()) {
		if (this.maxAge != null && typeof this.maxAge === "number") return this.maxAge <= 0 ? 0 : this.maxAge * 1e3;
		const expires = this.expires;
		if (expires === "Infinity") return Infinity;
		return (expires?.getTime() ?? now) - (now || Date.now());
	}
	/**
	* Computes the absolute unix-epoch milliseconds that this cookie expires.
	*
	* The "Max-Age" attribute takes precedence over "Expires" (as per the RFC). The {@link Cookie.lastAccessed} attribute
	* (or the `now` parameter if given) is used to offset the {@link Cookie.maxAge} attribute.
	*
	* If Expires ({@link Cookie.expires}) is set, that's returned.
	*
	* @param now - can be used to provide a time offset (instead of {@link Cookie.lastAccessed}) to use when calculating the "Max-Age" value
	*/
	expiryTime(now) {
		if (this.maxAge != null) {
			const relativeTo = now || this.lastAccessed || /* @__PURE__ */ new Date();
			const maxAge = typeof this.maxAge === "number" ? this.maxAge : -Infinity;
			const age = maxAge <= 0 ? -Infinity : maxAge * 1e3;
			if (relativeTo === "Infinity") return Infinity;
			return relativeTo.getTime() + age;
		}
		if (this.expires == "Infinity") return Infinity;
		return this.expires ? this.expires.getTime() : void 0;
	}
	/**
	* Similar to {@link Cookie.expiryTime}, computes the absolute unix-epoch milliseconds that this cookie expires and returns it as a Date.
	*
	* The "Max-Age" attribute takes precedence over "Expires" (as per the RFC). The {@link Cookie.lastAccessed} attribute
	* (or the `now` parameter if given) is used to offset the {@link Cookie.maxAge} attribute.
	*
	* If Expires ({@link Cookie.expires}) is set, that's returned.
	*
	* @param now - can be used to provide a time offset (instead of {@link Cookie.lastAccessed}) to use when calculating the "Max-Age" value
	*/
	expiryDate(now) {
		const millisec = this.expiryTime(now);
		if (millisec == Infinity) return /* @__PURE__ */ new Date(2147483647e3);
		else if (millisec == -Infinity) return /* @__PURE__ */ new Date(0);
		else return millisec == void 0 ? void 0 : new Date(millisec);
	}
	/**
	* Indicates if the cookie has been persisted to a store or not.
	* @public
	*/
	isPersistent() {
		return this.maxAge != null || this.expires != "Infinity";
	}
	/**
	* Calls {@link canonicalDomain} with the {@link Cookie.domain} property.
	* @public
	*/
	canonicalizedDomain() {
		return canonicalDomain(this.domain);
	}
	/**
	* Alias for {@link Cookie.canonicalizedDomain}
	* @public
	*/
	cdomain() {
		return canonicalDomain(this.domain);
	}
	/**
	* Parses a string into a Cookie object.
	*
	* @remarks
	* Note: when parsing a `Cookie` header it must be split by ';' before each Cookie string can be parsed.
	*
	* @example
	* ```
	* // parse a `Set-Cookie` header
	* const setCookieHeader = 'a=bcd; Expires=Tue, 18 Oct 2011 07:05:03 GMT'
	* const cookie = Cookie.parse(setCookieHeader)
	* cookie.key === 'a'
	* cookie.value === 'bcd'
	* cookie.expires === new Date(Date.parse('Tue, 18 Oct 2011 07:05:03 GMT'))
	* ```
	*
	* @example
	* ```
	* // parse a `Cookie` header
	* const cookieHeader = 'name=value; name2=value2; name3=value3'
	* const cookies = cookieHeader.split(';').map(Cookie.parse)
	* cookies[0].name === 'name'
	* cookies[0].value === 'value'
	* cookies[1].name === 'name2'
	* cookies[1].value === 'value2'
	* cookies[2].name === 'name3'
	* cookies[2].value === 'value3'
	* ```
	*
	* @param str - The `Set-Cookie` header or a Cookie string to parse.
	* @param options - Configures `strict` or `loose` mode for cookie parsing
	*/
	static parse(str, options) {
		return parse$2(str, options);
	}
	/**
	* Does the reverse of {@link Cookie.toJSON}.
	*
	* @remarks
	* Any Date properties (such as .expires, .creation, and .lastAccessed) are parsed via Date.parse, not tough-cookie's parseDate, since ISO timestamps are being handled at this layer.
	*
	* @example
	* ```
	* const json = JSON.stringify({
	*   key: 'alpha',
	*   value: 'beta',
	*   domain: 'example.com',
	*   path: '/foo',
	*   expires: '2038-01-19T03:14:07.000Z',
	* })
	* const cookie = Cookie.fromJSON(json)
	* cookie.key === 'alpha'
	* cookie.value === 'beta'
	* cookie.domain === 'example.com'
	* cookie.path === '/foo'
	* cookie.expires === new Date(Date.parse('2038-01-19T03:14:07.000Z'))
	* ```
	*
	* @param str - An unparsed JSON string or a value that has already been parsed as JSON
	*/
	static fromJSON(str) {
		return fromJSON(str);
	}
};
_Cookie.cookiesCreated = 0;
/**
* @internal
*/
_Cookie.sameSiteLevel = {
	strict: 3,
	lax: 2,
	none: 1
};
/**
* @internal
*/
_Cookie.sameSiteCanonical = {
	strict: "Strict",
	lax: "Lax"
};
/**
* Cookie properties that will be serialized when using {@link Cookie.fromJSON} and {@link Cookie.toJSON}.
* @public
*/
_Cookie.serializableProperties = [
	"key",
	"value",
	"expires",
	"maxAge",
	"domain",
	"path",
	"secure",
	"httpOnly",
	"extensions",
	"hostOnly",
	"pathIsDefault",
	"creation",
	"lastAccessed",
	"sameSite"
];
var Cookie = _Cookie;
var MAX_TIME = 2147483647e3;
function cookieCompare(a, b) {
	let cmp;
	const aPathLen = a.path ? a.path.length : 0;
	cmp = (b.path ? b.path.length : 0) - aPathLen;
	if (cmp !== 0) return cmp;
	cmp = (a.creation && a.creation instanceof Date ? a.creation.getTime() : MAX_TIME) - (b.creation && b.creation instanceof Date ? b.creation.getTime() : MAX_TIME);
	if (cmp !== 0) return cmp;
	cmp = (a.creationIndex || 0) - (b.creationIndex || 0);
	return cmp;
}
function defaultPath(path) {
	if (!path || path.slice(0, 1) !== "/") return "/";
	if (path === "/") return path;
	const rightSlash = path.lastIndexOf("/");
	if (rightSlash === 0) return "/";
	return path.slice(0, rightSlash);
}
var IP_REGEX_LOWERCASE = /(?:^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}$)|(?:^(?:(?:[a-f\d]{1,4}:){7}(?:[a-f\d]{1,4}|:)|(?:[a-f\d]{1,4}:){6}(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|:[a-f\d]{1,4}|:)|(?:[a-f\d]{1,4}:){5}(?::(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-f\d]{1,4}){1,2}|:)|(?:[a-f\d]{1,4}:){4}(?:(?::[a-f\d]{1,4}){0,1}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-f\d]{1,4}){1,3}|:)|(?:[a-f\d]{1,4}:){3}(?:(?::[a-f\d]{1,4}){0,2}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-f\d]{1,4}){1,4}|:)|(?:[a-f\d]{1,4}:){2}(?:(?::[a-f\d]{1,4}){0,3}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-f\d]{1,4}){1,5}|:)|(?:[a-f\d]{1,4}:){1}(?:(?::[a-f\d]{1,4}){0,4}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-f\d]{1,4}){1,6}|:)|(?::(?:(?::[a-f\d]{1,4}){0,5}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-f\d]{1,4}){1,7}|:)))$)/;
function domainMatch(domain, cookieDomain, canonicalize) {
	if (domain == null || cookieDomain == null) return;
	let _str;
	let _domStr;
	if (canonicalize !== false) {
		_str = canonicalDomain(domain);
		_domStr = canonicalDomain(cookieDomain);
	} else {
		_str = domain;
		_domStr = cookieDomain;
	}
	if (_str == null || _domStr == null) return;
	if (_str == _domStr) return true;
	const idx = _str.lastIndexOf(_domStr);
	if (idx <= 0) return false;
	if (_str.length !== _domStr.length + idx) return false;
	if (_str.substring(idx - 1, idx) !== ".") return false;
	return !IP_REGEX_LOWERCASE.test(_str);
}
function isLoopbackV4(address) {
	const octets = address.split(".");
	return octets.length === 4 && octets[0] !== void 0 && parseInt(octets[0], 10) === 127;
}
function isLoopbackV6(address) {
	return address === "::1";
}
function isNormalizedLocalhostTLD(lowerHost) {
	return lowerHost.endsWith(".localhost");
}
function isLocalHostname(host) {
	const lowerHost = host.toLowerCase();
	return lowerHost === "localhost" || isNormalizedLocalhostTLD(lowerHost);
}
function hostNoBrackets(host) {
	if (host.length >= 2 && host.startsWith("[") && host.endsWith("]")) return host.substring(1, host.length - 1);
	return host;
}
function isPotentiallyTrustworthy(inputUrl, allowSecureOnLocal = true) {
	let url;
	if (typeof inputUrl === "string") try {
		url = new URL(inputUrl);
	} catch {
		return false;
	}
	else url = inputUrl;
	const scheme = url.protocol.replace(":", "").toLowerCase();
	const hostname = hostNoBrackets(url.hostname).replace(/\.+$/, "");
	if (scheme === "https" || scheme === "wss") return true;
	if (!allowSecureOnLocal) return false;
	if (IP_V4_REGEX_OBJECT.test(hostname)) return isLoopbackV4(hostname);
	if (IP_V6_REGEX_OBJECT.test(hostname)) return isLoopbackV6(hostname);
	return isLocalHostname(hostname);
}
var defaultSetCookieOptions = {
	loose: false,
	sameSiteContext: void 0,
	ignoreError: false,
	http: true
};
var defaultGetCookieOptions = {
	http: true,
	expire: true,
	allPaths: false,
	sameSiteContext: void 0,
	sort: void 0
};
var SAME_SITE_CONTEXT_VAL_ERR = "Invalid sameSiteContext option for getCookies(); expected one of \"strict\", \"lax\", or \"none\"";
function getCookieContext(url) {
	if (url && typeof url === "object" && "hostname" in url && typeof url.hostname === "string" && "pathname" in url && typeof url.pathname === "string" && "protocol" in url && typeof url.protocol === "string") return {
		hostname: url.hostname,
		pathname: url.pathname,
		protocol: url.protocol
	};
	else if (typeof url === "string") {
		const parsed = new URL(url);
		let pathname = parsed.pathname;
		try {
			pathname = decodeURI(pathname);
		} catch {}
		return {
			hostname: parsed.hostname,
			pathname,
			protocol: parsed.protocol
		};
	} else throw new ParameterError("`url` argument is not a string or URL.");
}
function checkSameSiteContext(value) {
	const context = value.toLowerCase();
	if (context === "none" || context === "lax" || context === "strict") return context;
	else return;
}
function isSecurePrefixConditionMet(cookie) {
	return !(typeof cookie.key === "string" && cookie.key.startsWith("__Secure-")) || cookie.secure;
}
function isHostPrefixConditionMet(cookie) {
	return !(typeof cookie.key === "string" && cookie.key.startsWith("__Host-")) || Boolean(cookie.secure && cookie.hostOnly && cookie.path != null && cookie.path === "/");
}
function getNormalizedPrefixSecurity(prefixSecurity) {
	const normalizedPrefixSecurity = prefixSecurity.toLowerCase();
	switch (normalizedPrefixSecurity) {
		case PrefixSecurityEnum.STRICT:
		case PrefixSecurityEnum.SILENT:
		case PrefixSecurityEnum.DISABLED: return normalizedPrefixSecurity;
		default: return PrefixSecurityEnum.SILENT;
	}
}
var CookieJar = class _CookieJar {
	/**
	* Creates a new `CookieJar` instance.
	*
	* @remarks
	* - If a custom store is not passed to the constructor, an in-memory store ({@link MemoryCookieStore} will be created and used.
	* - If a boolean value is passed as the `options` parameter, this is equivalent to passing `{ rejectPublicSuffixes: <value> }`
	*
	* @param store - a custom {@link Store} implementation (defaults to {@link MemoryCookieStore})
	* @param options - configures how cookies are processed by the cookie jar
	*/
	constructor(store, options) {
		if (typeof options === "boolean") options = { rejectPublicSuffixes: options };
		this.rejectPublicSuffixes = options?.rejectPublicSuffixes ?? true;
		this.enableLooseMode = options?.looseMode ?? false;
		this.allowSpecialUseDomain = options?.allowSpecialUseDomain ?? true;
		this.allowSecureOnLocal = options?.allowSecureOnLocal ?? true;
		this.prefixSecurity = getNormalizedPrefixSecurity(options?.prefixSecurity ?? "silent");
		this.store = store ?? new MemoryCookieStore();
	}
	callSync(fn) {
		if (!this.store.synchronous) throw new Error("CookieJar store is not synchronous; use async API instead.");
		let syncErr = null;
		let syncResult = void 0;
		try {
			fn.call(this, (error, result) => {
				syncErr = error;
				syncResult = result;
			});
		} catch (err) {
			syncErr = err;
		}
		if (syncErr) throw syncErr;
		return syncResult;
	}
	/**
	* @internal No doc because this is the overload implementation
	*/
	setCookie(cookie, url, options, callback) {
		if (typeof options === "function") {
			callback = options;
			options = void 0;
		}
		const promiseCallback = createPromiseCallback(callback);
		const cb = promiseCallback.callback;
		let context;
		try {
			if (typeof url === "string") validate(isNonEmptyString(url), callback, safeToString(options));
			context = getCookieContext(url);
			if (typeof url === "function") return promiseCallback.reject(/* @__PURE__ */ new Error("No URL was specified"));
			if (typeof options === "function") options = defaultSetCookieOptions;
			validate(typeof cb === "function", cb);
			if (!isNonEmptyString(cookie) && !isObject$1(cookie) && cookie instanceof String && cookie.length == 0) return promiseCallback.resolve(void 0);
		} catch (err) {
			return promiseCallback.reject(err);
		}
		const host = canonicalDomain(context.hostname) ?? null;
		const loose = options?.loose || this.enableLooseMode;
		let sameSiteContext = null;
		if (options?.sameSiteContext) {
			sameSiteContext = checkSameSiteContext(options.sameSiteContext);
			if (!sameSiteContext) return promiseCallback.reject(new Error(SAME_SITE_CONTEXT_VAL_ERR));
		}
		if (typeof cookie === "string" || cookie instanceof String) {
			const parsedCookie = Cookie.parse(cookie.toString(), { loose });
			if (!parsedCookie) {
				const err = /* @__PURE__ */ new Error("Cookie failed to parse");
				return options?.ignoreError ? promiseCallback.resolve(void 0) : promiseCallback.reject(err);
			}
			cookie = parsedCookie;
		} else if (!(cookie instanceof Cookie)) {
			const err = /* @__PURE__ */ new Error("First argument to setCookie must be a Cookie object or string");
			return options?.ignoreError ? promiseCallback.resolve(void 0) : promiseCallback.reject(err);
		}
		const now = options?.now || /* @__PURE__ */ new Date();
		if (this.rejectPublicSuffixes && cookie.domain) try {
			const cdomain = cookie.cdomain();
			if ((typeof cdomain === "string" ? getPublicSuffix(cdomain, {
				allowSpecialUseDomain: this.allowSpecialUseDomain,
				ignoreError: options?.ignoreError
			}) : null) == null && !IP_V6_REGEX_OBJECT.test(cookie.domain)) {
				const err = /* @__PURE__ */ new Error("Cookie has domain set to a public suffix");
				return options?.ignoreError ? promiseCallback.resolve(void 0) : promiseCallback.reject(err);
			}
		} catch (err) {
			return options?.ignoreError ? promiseCallback.resolve(void 0) : promiseCallback.reject(err);
		}
		if (cookie.domain) {
			if (!domainMatch(host ?? void 0, cookie.cdomain() ?? void 0, false)) {
				const err = /* @__PURE__ */ new Error(`Cookie not in this host's domain. Cookie:${cookie.cdomain() ?? "null"} Request:${host ?? "null"}`);
				return options?.ignoreError ? promiseCallback.resolve(void 0) : promiseCallback.reject(err);
			}
			if (cookie.hostOnly == null) cookie.hostOnly = false;
		} else {
			cookie.hostOnly = true;
			cookie.domain = host;
		}
		if (!cookie.path || cookie.path[0] !== "/") {
			cookie.path = defaultPath(context.pathname);
			cookie.pathIsDefault = true;
		}
		if (options?.http === false && cookie.httpOnly) {
			const err = /* @__PURE__ */ new Error("Cookie is HttpOnly and this isn't an HTTP API");
			return options.ignoreError ? promiseCallback.resolve(void 0) : promiseCallback.reject(err);
		}
		if (cookie.sameSite !== "none" && cookie.sameSite !== void 0 && sameSiteContext) {
			if (sameSiteContext === "none") {
				const err = /* @__PURE__ */ new Error("Cookie is SameSite but this is a cross-origin request");
				return options?.ignoreError ? promiseCallback.resolve(void 0) : promiseCallback.reject(err);
			}
		}
		const ignoreErrorForPrefixSecurity = this.prefixSecurity === PrefixSecurityEnum.SILENT;
		if (!(this.prefixSecurity === PrefixSecurityEnum.DISABLED)) {
			let errorFound = false;
			let errorMsg;
			if (!isSecurePrefixConditionMet(cookie)) {
				errorFound = true;
				errorMsg = "Cookie has __Secure prefix but Secure attribute is not set";
			} else if (!isHostPrefixConditionMet(cookie)) {
				errorFound = true;
				errorMsg = "Cookie has __Host prefix but either Secure or HostOnly attribute is not set or Path is not '/'";
			}
			if (errorFound) return options?.ignoreError || ignoreErrorForPrefixSecurity ? promiseCallback.resolve(void 0) : promiseCallback.reject(new Error(errorMsg));
		}
		const store = this.store;
		if (!store.updateCookie) store.updateCookie = async function(_oldCookie, newCookie, cb2) {
			return this.putCookie(newCookie).then(() => cb2?.(null), (error) => cb2?.(error));
		};
		store.findCookie(cookie.domain, cookie.path, cookie.key, function withCookie2(err, oldCookie) {
			if (err) {
				cb(err);
				return;
			}
			const next = function(err2) {
				if (err2) cb(err2);
				else if (typeof cookie === "string") cb(null, void 0);
				else cb(null, cookie);
			};
			if (oldCookie) {
				if (options && "http" in options && options.http === false && oldCookie.httpOnly) {
					err = /* @__PURE__ */ new Error("old Cookie is HttpOnly and this isn't an HTTP API");
					if (options.ignoreError) cb(null, void 0);
					else cb(err);
					return;
				}
				if (cookie instanceof Cookie) {
					cookie.creation = oldCookie.creation;
					cookie.creationIndex = oldCookie.creationIndex;
					cookie.lastAccessed = now;
					store.updateCookie(oldCookie, cookie, next);
				}
			} else if (cookie instanceof Cookie) {
				cookie.creation = cookie.lastAccessed = now;
				store.putCookie(cookie, next);
			}
		});
		return promiseCallback.promise;
	}
	/**
	* Synchronously attempt to set the {@link Cookie} in the {@link CookieJar}.
	*
	* <strong>Note:</strong> Only works if the configured {@link Store} is also synchronous.
	*
	* @remarks
	* - If successfully persisted, the {@link Cookie} will have updated
	*     {@link Cookie.creation}, {@link Cookie.lastAccessed} and {@link Cookie.hostOnly}
	*     properties.
	*
	* - As per the RFC, the {@link Cookie.hostOnly} flag is set if there was no `Domain={value}`
	*     attribute on the cookie string. The {@link Cookie.domain} property is set to the
	*     fully-qualified hostname of `currentUrl` in this case. Matching this cookie requires an
	*     exact hostname match (not a {@link domainMatch} as per usual)
	*
	* @param cookie - The cookie object or cookie string to store. A string value will be parsed into a cookie using {@link Cookie.parse}.
	* @param url - The domain to store the cookie with.
	* @param options - Configuration settings to use when storing the cookie.
	* @public
	*/
	setCookieSync(cookie, url, options) {
		const setCookieFn = options ? this.setCookie.bind(this, cookie, url, options) : this.setCookie.bind(this, cookie, url);
		return this.callSync(setCookieFn);
	}
	/**
	* @internal No doc because this is the overload implementation
	*/
	getCookies(url, options, callback) {
		if (typeof options === "function") {
			callback = options;
			options = defaultGetCookieOptions;
		} else if (options === void 0) options = defaultGetCookieOptions;
		const promiseCallback = createPromiseCallback(callback);
		const cb = promiseCallback.callback;
		let context;
		try {
			if (typeof url === "string") validate(isNonEmptyString(url), cb, url);
			context = getCookieContext(url);
			validate(isObject$1(options), cb, safeToString(options));
			validate(typeof cb === "function", cb);
		} catch (parameterError) {
			return promiseCallback.reject(parameterError);
		}
		const host = canonicalDomain(context.hostname);
		const path = context.pathname || "/";
		const potentiallyTrustworthy = isPotentiallyTrustworthy(url, this.allowSecureOnLocal);
		let sameSiteLevel = 0;
		if (options.sameSiteContext) {
			const sameSiteContext = checkSameSiteContext(options.sameSiteContext);
			if (sameSiteContext == null) return promiseCallback.reject(new Error(SAME_SITE_CONTEXT_VAL_ERR));
			sameSiteLevel = Cookie.sameSiteLevel[sameSiteContext];
			if (!sameSiteLevel) return promiseCallback.reject(new Error(SAME_SITE_CONTEXT_VAL_ERR));
		}
		const http = options.http ?? true;
		const now = Date.now();
		const expireCheck = options.expire ?? true;
		const allPaths = options.allPaths ?? false;
		const store = this.store;
		function matchingCookie(c) {
			if (c.hostOnly) {
				if (c.domain != host) return false;
			} else if (!domainMatch(host ?? void 0, c.domain ?? void 0, false)) return false;
			if (!allPaths && typeof c.path === "string" && !pathMatch(path, c.path)) return false;
			if (c.secure && !potentiallyTrustworthy) return false;
			if (c.httpOnly && !http) return false;
			if (sameSiteLevel) {
				let cookieLevel;
				if (c.sameSite === "lax") cookieLevel = Cookie.sameSiteLevel.lax;
				else if (c.sameSite === "strict") cookieLevel = Cookie.sameSiteLevel.strict;
				else cookieLevel = Cookie.sameSiteLevel.none;
				if (cookieLevel > sameSiteLevel) return false;
			}
			const expiryTime = c.expiryTime();
			if (expireCheck && expiryTime != void 0 && expiryTime <= now) {
				store.removeCookie(c.domain, c.path, c.key, () => {});
				return false;
			}
			return true;
		}
		store.findCookies(host, allPaths ? null : path, this.allowSpecialUseDomain, (err, cookies) => {
			if (err) {
				cb(err);
				return;
			}
			if (cookies == null) {
				cb(null, []);
				return;
			}
			cookies = cookies.filter(matchingCookie);
			if ("sort" in options && options.sort !== false) cookies = cookies.sort(cookieCompare);
			const now2 = /* @__PURE__ */ new Date();
			for (const cookie of cookies) cookie.lastAccessed = now2;
			cb(null, cookies);
		});
		return promiseCallback.promise;
	}
	/**
	* Synchronously retrieve the list of cookies that can be sent in a Cookie header for the
	* current URL.
	*
	* <strong>Note</strong>: Only works if the configured Store is also synchronous.
	*
	* @remarks
	* - The array of cookies returned will be sorted according to {@link cookieCompare}.
	*
	* - The {@link Cookie.lastAccessed} property will be updated on all returned cookies.
	*
	* @param url - The domain to store the cookie with.
	* @param options - Configuration settings to use when retrieving the cookies.
	*/
	getCookiesSync(url, options) {
		return this.callSync(this.getCookies.bind(this, url, options)) ?? [];
	}
	/**
	* @internal No doc because this is the overload implementation
	*/
	getCookieString(url, options, callback) {
		if (typeof options === "function") {
			callback = options;
			options = void 0;
		}
		const promiseCallback = createPromiseCallback(callback);
		const next = function(err, cookies) {
			if (err) promiseCallback.callback(err);
			else promiseCallback.callback(null, cookies?.sort(cookieCompare).map((c) => c.cookieString()).join("; "));
		};
		this.getCookies(url, options, next);
		return promiseCallback.promise;
	}
	/**
	* Synchronous version of `.getCookieString()`. Accepts the same options as `.getCookies()` but returns a string suitable for a
	* `Cookie` header rather than an Array.
	*
	* <strong>Note</strong>: Only works if the configured Store is also synchronous.
	*
	* @param url - The domain to store the cookie with.
	* @param options - Configuration settings to use when retrieving the cookies.
	*/
	getCookieStringSync(url, options) {
		return this.callSync(options ? this.getCookieString.bind(this, url, options) : this.getCookieString.bind(this, url)) ?? "";
	}
	/**
	* @internal No doc because this is the overload implementation
	*/
	getSetCookieStrings(url, options, callback) {
		if (typeof options === "function") {
			callback = options;
			options = void 0;
		}
		const promiseCallback = createPromiseCallback(callback);
		const next = function(err, cookies) {
			if (err) promiseCallback.callback(err);
			else promiseCallback.callback(null, cookies?.map((c) => {
				return c.toString();
			}));
		};
		this.getCookies(url, options, next);
		return promiseCallback.promise;
	}
	/**
	* Synchronous version of `.getSetCookieStrings()`. Returns an array of strings suitable for `Set-Cookie` headers.
	* Accepts the same options as `.getCookies()`.
	*
	* <strong>Note</strong>: Only works if the configured Store is also synchronous.
	*
	* @param url - The domain to store the cookie with.
	* @param options - Configuration settings to use when retrieving the cookies.
	*/
	getSetCookieStringsSync(url, options = {}) {
		return this.callSync(this.getSetCookieStrings.bind(this, url, options)) ?? [];
	}
	/**
	* @internal No doc because this is the overload implementation
	*/
	serialize(callback) {
		const promiseCallback = createPromiseCallback(callback);
		let type = this.store.constructor.name;
		if (isObject$1(type)) type = null;
		const serialized = {
			version: `tough-cookie@${version}`,
			storeType: type,
			rejectPublicSuffixes: this.rejectPublicSuffixes,
			enableLooseMode: this.enableLooseMode,
			allowSpecialUseDomain: this.allowSpecialUseDomain,
			prefixSecurity: getNormalizedPrefixSecurity(this.prefixSecurity),
			cookies: []
		};
		if (typeof this.store.getAllCookies !== "function") return promiseCallback.reject(/* @__PURE__ */ new Error("store does not support getAllCookies and cannot be serialized"));
		this.store.getAllCookies((err, cookies) => {
			if (err) {
				promiseCallback.callback(err);
				return;
			}
			if (cookies == null) {
				promiseCallback.callback(null, serialized);
				return;
			}
			serialized.cookies = cookies.map((cookie) => {
				const serializedCookie = cookie.toJSON();
				delete serializedCookie.creationIndex;
				return serializedCookie;
			});
			promiseCallback.callback(null, serialized);
		});
		return promiseCallback.promise;
	}
	/**
	* Serialize the CookieJar if the underlying store supports `.getAllCookies`.
	*
	* <strong>Note</strong>: Only works if the configured Store is also synchronous.
	*/
	serializeSync() {
		return this.callSync((callback) => {
			this.serialize(callback);
		});
	}
	/**
	* Alias of {@link CookieJar.serializeSync}. Allows the cookie to be serialized
	* with `JSON.stringify(cookieJar)`.
	*/
	toJSON() {
		return this.serializeSync();
	}
	/**
	* Use the class method CookieJar.deserialize instead of calling this directly
	* @internal
	*/
	_importCookies(serialized, callback) {
		let cookies = void 0;
		if (serialized && typeof serialized === "object" && inOperator("cookies", serialized) && Array.isArray(serialized.cookies)) cookies = serialized.cookies;
		if (!cookies) {
			callback(/* @__PURE__ */ new Error("serialized jar has no cookies array"), void 0);
			return;
		}
		cookies = cookies.slice();
		const putNext = (err) => {
			if (err) {
				callback(err, void 0);
				return;
			}
			if (Array.isArray(cookies)) {
				if (!cookies.length) {
					callback(err, this);
					return;
				}
				let cookie;
				try {
					cookie = Cookie.fromJSON(cookies.shift());
				} catch (e) {
					callback(e instanceof Error ? e : /* @__PURE__ */ new Error(), void 0);
					return;
				}
				if (cookie === void 0) {
					putNext(null);
					return;
				}
				this.store.putCookie(cookie, putNext);
			}
		};
		putNext(null);
	}
	/**
	* @internal
	*/
	_importCookiesSync(serialized) {
		this.callSync(this._importCookies.bind(this, serialized));
	}
	/**
	* @internal No doc because this is the overload implementation
	*/
	clone(newStore, callback) {
		if (typeof newStore === "function") {
			callback = newStore;
			newStore = void 0;
		}
		const promiseCallback = createPromiseCallback(callback);
		const cb = promiseCallback.callback;
		this.serialize((err, serialized) => {
			if (err) return promiseCallback.reject(err);
			return _CookieJar.deserialize(serialized ?? "", newStore, cb);
		});
		return promiseCallback.promise;
	}
	/**
	* @internal
	*/
	_cloneSync(newStore) {
		const cloneFn = newStore && typeof newStore !== "function" ? this.clone.bind(this, newStore) : this.clone.bind(this);
		return this.callSync((callback) => {
			cloneFn(callback);
		});
	}
	/**
	* Produces a deep clone of this CookieJar. Modifications to the original do
	* not affect the clone, and vice versa.
	*
	* <strong>Note</strong>: Only works if both the configured Store and destination
	* Store are synchronous.
	*
	* @remarks
	* - When no {@link Store} is provided, a new {@link MemoryCookieStore} will be used.
	*
	* - Transferring between store types is supported so long as the source
	*     implements `.getAllCookies()` and the destination implements `.putCookie()`.
	*
	* @param newStore - The target {@link Store} to clone cookies into.
	*/
	cloneSync(newStore) {
		if (!newStore) return this._cloneSync();
		if (!newStore.synchronous) throw new Error("CookieJar clone destination store is not synchronous; use async API instead.");
		return this._cloneSync(newStore);
	}
	/**
	* @internal No doc because this is the overload implementation
	*/
	removeAllCookies(callback) {
		const promiseCallback = createPromiseCallback(callback);
		const cb = promiseCallback.callback;
		const store = this.store;
		if (typeof store.removeAllCookies === "function" && store.removeAllCookies !== Store.prototype.removeAllCookies) {
			store.removeAllCookies(cb);
			return promiseCallback.promise;
		}
		store.getAllCookies((err, cookies) => {
			if (err) {
				cb(err);
				return;
			}
			if (!cookies) cookies = [];
			if (cookies.length === 0) {
				cb(null, void 0);
				return;
			}
			let completedCount = 0;
			const removeErrors = [];
			const removeCookieCb = function removeCookieCb2(removeErr) {
				if (removeErr) removeErrors.push(removeErr);
				completedCount++;
				if (completedCount === cookies.length) {
					if (removeErrors[0]) cb(removeErrors[0]);
					else cb(null, void 0);
					return;
				}
			};
			cookies.forEach((cookie) => {
				store.removeCookie(cookie.domain, cookie.path, cookie.key, removeCookieCb);
			});
		});
		return promiseCallback.promise;
	}
	/**
	* Removes all cookies from the CookieJar.
	*
	* <strong>Note</strong>: Only works if the configured Store is also synchronous.
	*
	* @remarks
	* - This is a new backwards-compatible feature of tough-cookie version 2.5,
	*     so not all Stores will implement it efficiently. For Stores that do not
	*     implement `removeAllCookies`, the fallback is to call `removeCookie` after
	*     `getAllCookies`.
	*
	* - If `getAllCookies` fails or isn't implemented in the Store, an error is returned.
	*
	* - If one or more of the `removeCookie` calls fail, only the first error is returned.
	*/
	removeAllCookiesSync() {
		this.callSync((callback) => {
			this.removeAllCookies(callback);
		});
	}
	/**
	* @internal No doc because this is the overload implementation
	*/
	static deserialize(strOrObj, store, callback) {
		if (typeof store === "function") {
			callback = store;
			store = void 0;
		}
		const promiseCallback = createPromiseCallback(callback);
		let serialized;
		if (typeof strOrObj === "string") try {
			serialized = JSON.parse(strOrObj);
		} catch (e) {
			return promiseCallback.reject(e instanceof Error ? e : /* @__PURE__ */ new Error());
		}
		else serialized = strOrObj;
		const readSerializedProperty = (property) => {
			return serialized && typeof serialized === "object" && inOperator(property, serialized) ? serialized[property] : void 0;
		};
		const readSerializedBoolean = (property) => {
			const value = readSerializedProperty(property);
			return typeof value === "boolean" ? value : void 0;
		};
		const readSerializedString = (property) => {
			const value = readSerializedProperty(property);
			return typeof value === "string" ? value : void 0;
		};
		const jar = new _CookieJar(store, {
			rejectPublicSuffixes: readSerializedBoolean("rejectPublicSuffixes"),
			looseMode: readSerializedBoolean("enableLooseMode"),
			allowSpecialUseDomain: readSerializedBoolean("allowSpecialUseDomain"),
			prefixSecurity: getNormalizedPrefixSecurity(readSerializedString("prefixSecurity") ?? "silent")
		});
		jar._importCookies(serialized, (err) => {
			if (err) {
				promiseCallback.callback(err);
				return;
			}
			promiseCallback.callback(null, jar);
		});
		return promiseCallback.promise;
	}
	/**
	* A new CookieJar is created and the serialized {@link Cookie} values are added to
	* the underlying store. Each {@link Cookie} is added via `store.putCookie(...)` in
	* the order in which they appear in the serialization.
	*
	* <strong>Note</strong>: Only works if the configured Store is also synchronous.
	*
	* @remarks
	* - When no {@link Store} is provided, a new {@link MemoryCookieStore} will be used.
	*
	* - As a convenience, if `strOrObj` is a string, it is passed through `JSON.parse` first.
	*
	* @param strOrObj - A JSON string or object representing the deserialized cookies.
	* @param store - The underlying store to persist the deserialized cookies into.
	*/
	static deserializeSync(strOrObj, store) {
		const serialized = typeof strOrObj === "string" ? JSON.parse(strOrObj) : strOrObj;
		const readSerializedProperty = (property) => {
			return serialized && typeof serialized === "object" && inOperator(property, serialized) ? serialized[property] : void 0;
		};
		const readSerializedBoolean = (property) => {
			const value = readSerializedProperty(property);
			return typeof value === "boolean" ? value : void 0;
		};
		const readSerializedString = (property) => {
			const value = readSerializedProperty(property);
			return typeof value === "string" ? value : void 0;
		};
		const jar = new _CookieJar(store, {
			rejectPublicSuffixes: readSerializedBoolean("rejectPublicSuffixes"),
			looseMode: readSerializedBoolean("enableLooseMode"),
			allowSpecialUseDomain: readSerializedBoolean("allowSpecialUseDomain"),
			prefixSecurity: getNormalizedPrefixSecurity(readSerializedString("prefixSecurity") ?? "silent")
		});
		if (!jar.store.synchronous) throw new Error("CookieJar store is not synchronous; use async API instead.");
		jar._importCookiesSync(serialized);
		return jar;
	}
	/**
	* Alias of {@link CookieJar.deserializeSync}.
	*
	* @remarks
	* - When no {@link Store} is provided, a new {@link MemoryCookieStore} will be used.
	*
	* - As a convenience, if `strOrObj` is a string, it is passed through `JSON.parse` first.
	*
	* @param jsonString - A JSON string or object representing the deserialized cookies.
	* @param store - The underlying store to persist the deserialized cookies into.
	*/
	static fromJSON(jsonString, store) {
		return _CookieJar.deserializeSync(jsonString, store);
	}
};
/*!
* Copyright (c) 2015-2020, Salesforce.com, Inc.
* All rights reserved.
*
* Redistribution and use in source and binary forms, with or without
* modification, are permitted provided that the following conditions are met:
*
* 1. Redistributions of source code must retain the above copyright notice,
* this list of conditions and the following disclaimer.
*
* 2. Redistributions in binary form must reproduce the above copyright notice,
* this list of conditions and the following disclaimer in the documentation
* and/or other materials provided with the distribution.
*
* 3. Neither the name of Salesforce.com nor the names of its contributors may
* be used to endorse or promote products derived from this software without
* specific prior written permission.
*
* THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
* AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
* IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
* ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
* LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
* CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
* SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
* INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
* CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
* ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
* POSSIBILITY OF SUCH DAMAGE.
*/
//#endregion
//#region node_modules/msw/lib/core/utils/internal/jsonParse.mjs
function jsonParse(value) {
	try {
		return JSON.parse(value);
	} catch {
		return;
	}
}
//#endregion
//#region node_modules/msw/lib/core/utils/cookieStore.mjs
var CookieStore = class {
	#storageKey = "__msw-cookie-store__";
	#jar;
	#memoryStore;
	constructor() {
		if (!isNodeProcess$1()) invariant$1(typeof localStorage !== "undefined", "Failed to create a CookieStore: `localStorage` is not available in this environment. This is likely an issue with your environment, which has been detected as browser (or browser-like) environment and must implement global browser APIs correctly.");
		this.#memoryStore = new MemoryCookieStore();
		this.#memoryStore.idx = this.getCookieStoreIndex();
		this.#jar = new CookieJar(this.#memoryStore);
	}
	getCookies(url) {
		return this.#jar.getCookiesSync(url);
	}
	async setCookie(cookieName, url) {
		await this.#jar.setCookie(cookieName, url);
		this.persist();
	}
	getCookieStoreIndex() {
		if (typeof localStorage === "undefined" || typeof localStorage.getItem !== "function") return {};
		const cookiesString = localStorage.getItem(this.#storageKey);
		if (cookiesString == null) return {};
		const rawCookies = jsonParse(cookiesString);
		if (rawCookies == null) return {};
		const cookies = {};
		for (const rawCookie of rawCookies) {
			const cookie = Cookie.fromJSON(rawCookie);
			if (cookie != null && cookie.domain != null && cookie.path != null) {
				cookies[cookie.domain] ||= {};
				cookies[cookie.domain][cookie.path] ||= {};
				cookies[cookie.domain][cookie.path][cookie.key] = cookie;
			}
		}
		return cookies;
	}
	persist() {
		if (typeof localStorage === "undefined" || typeof localStorage.setItem !== "function") return;
		const data = [];
		const { idx } = this.#memoryStore;
		for (const domain in idx) for (const path in idx[domain]) for (const key in idx[domain][path]) data.push(idx[domain][path][key].toJSON());
		localStorage.setItem(this.#storageKey, JSON.stringify(data));
	}
};
var cookieStore = new CookieStore();
//#endregion
//#region node_modules/msw/lib/core/utils/request/storeResponseCookies.mjs
async function storeResponseCookies(request, response) {
	const responseCookies = getRawSetCookie(response);
	if (responseCookies) await cookieStore.setCookie(responseCookies, request.url);
}
function shouldBypassRequest(request) {
	return !!request.headers.get("accept")?.includes("msw/passthrough");
}
function isPassthroughResponse(response) {
	return response.status === 302 && response.headers.get("x-msw-intention") === "passthrough";
}
function deleteRequestPassthroughHeader(request) {
	const acceptHeader = request.headers.get("accept");
	if (acceptHeader) {
		const nextAcceptHeader = acceptHeader.replace(/(,\s+)?msw\/passthrough/, "");
		if (nextAcceptHeader) request.headers.set("accept", nextAcceptHeader);
		else request.headers.delete("accept");
	}
}
//#endregion
//#region node_modules/path-to-regexp/dist.es2015/index.js
/**
* Tokenize input string.
*/
function lexer(str) {
	var tokens = [];
	var i = 0;
	while (i < str.length) {
		var char = str[i];
		if (char === "*" || char === "+" || char === "?") {
			tokens.push({
				type: "MODIFIER",
				index: i,
				value: str[i++]
			});
			continue;
		}
		if (char === "\\") {
			tokens.push({
				type: "ESCAPED_CHAR",
				index: i++,
				value: str[i++]
			});
			continue;
		}
		if (char === "{") {
			tokens.push({
				type: "OPEN",
				index: i,
				value: str[i++]
			});
			continue;
		}
		if (char === "}") {
			tokens.push({
				type: "CLOSE",
				index: i,
				value: str[i++]
			});
			continue;
		}
		if (char === ":") {
			var name = "";
			var j = i + 1;
			while (j < str.length) {
				var code = str.charCodeAt(j);
				if (code >= 48 && code <= 57 || code >= 65 && code <= 90 || code >= 97 && code <= 122 || code === 95) {
					name += str[j++];
					continue;
				}
				break;
			}
			if (!name) throw new TypeError("Missing parameter name at ".concat(i));
			tokens.push({
				type: "NAME",
				index: i,
				value: name
			});
			i = j;
			continue;
		}
		if (char === "(") {
			var count = 1;
			var pattern = "";
			var j = i + 1;
			if (str[j] === "?") throw new TypeError("Pattern cannot start with \"?\" at ".concat(j));
			while (j < str.length) {
				if (str[j] === "\\") {
					pattern += str[j++] + str[j++];
					continue;
				}
				if (str[j] === ")") {
					count--;
					if (count === 0) {
						j++;
						break;
					}
				} else if (str[j] === "(") {
					count++;
					if (str[j + 1] !== "?") throw new TypeError("Capturing groups are not allowed at ".concat(j));
				}
				pattern += str[j++];
			}
			if (count) throw new TypeError("Unbalanced pattern at ".concat(i));
			if (!pattern) throw new TypeError("Missing pattern at ".concat(i));
			tokens.push({
				type: "PATTERN",
				index: i,
				value: pattern
			});
			i = j;
			continue;
		}
		tokens.push({
			type: "CHAR",
			index: i,
			value: str[i++]
		});
	}
	tokens.push({
		type: "END",
		index: i,
		value: ""
	});
	return tokens;
}
/**
* Parse a string for the raw tokens.
*/
function parse$1(str, options) {
	if (options === void 0) options = {};
	var tokens = lexer(str);
	var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
	var result = [];
	var key = 0;
	var i = 0;
	var path = "";
	var tryConsume = function(type) {
		if (i < tokens.length && tokens[i].type === type) return tokens[i++].value;
	};
	var mustConsume = function(type) {
		var value = tryConsume(type);
		if (value !== void 0) return value;
		var _a = tokens[i], nextType = _a.type, index = _a.index;
		throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
	};
	var consumeText = function() {
		var result = "";
		var value;
		while (value = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) result += value;
		return result;
	};
	var isSafe = function(value) {
		for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
			var char = delimiter_1[_i];
			if (value.indexOf(char) > -1) return true;
		}
		return false;
	};
	var safePattern = function(prefix) {
		var prev = result[result.length - 1];
		var prevText = prefix || (prev && typeof prev === "string" ? prev : "");
		if (prev && !prevText) throw new TypeError("Must have text between two parameters, missing text after \"".concat(prev.name, "\""));
		if (!prevText || isSafe(prevText)) return "[^".concat(escapeString(delimiter), "]+?");
		return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
	};
	while (i < tokens.length) {
		var char = tryConsume("CHAR");
		var name = tryConsume("NAME");
		var pattern = tryConsume("PATTERN");
		if (name || pattern) {
			var prefix = char || "";
			if (prefixes.indexOf(prefix) === -1) {
				path += prefix;
				prefix = "";
			}
			if (path) {
				result.push(path);
				path = "";
			}
			result.push({
				name: name || key++,
				prefix,
				suffix: "",
				pattern: pattern || safePattern(prefix),
				modifier: tryConsume("MODIFIER") || ""
			});
			continue;
		}
		var value = char || tryConsume("ESCAPED_CHAR");
		if (value) {
			path += value;
			continue;
		}
		if (path) {
			result.push(path);
			path = "";
		}
		if (tryConsume("OPEN")) {
			var prefix = consumeText();
			var name_1 = tryConsume("NAME") || "";
			var pattern_1 = tryConsume("PATTERN") || "";
			var suffix = consumeText();
			mustConsume("CLOSE");
			result.push({
				name: name_1 || (pattern_1 ? key++ : ""),
				pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
				prefix,
				suffix,
				modifier: tryConsume("MODIFIER") || ""
			});
			continue;
		}
		mustConsume("END");
	}
	return result;
}
/**
* Create path match function from `path-to-regexp` spec.
*/
function match(str, options) {
	var keys = [];
	return regexpToFunction(pathToRegexp(str, keys, options), keys, options);
}
/**
* Create a path match function from `path-to-regexp` output.
*/
function regexpToFunction(re, keys, options) {
	if (options === void 0) options = {};
	var _a = options.decode, decode = _a === void 0 ? function(x) {
		return x;
	} : _a;
	return function(pathname) {
		var m = re.exec(pathname);
		if (!m) return false;
		var path = m[0], index = m.index;
		var params = Object.create(null);
		var _loop_1 = function(i) {
			if (m[i] === void 0) return "continue";
			var key = keys[i - 1];
			if (key.modifier === "*" || key.modifier === "+") params[key.name] = m[i].split(key.prefix + key.suffix).map(function(value) {
				return decode(value, key);
			});
			else params[key.name] = decode(m[i], key);
		};
		for (var i = 1; i < m.length; i++) _loop_1(i);
		return {
			path,
			index,
			params
		};
	};
}
/**
* Escape a regular expression string.
*/
function escapeString(str) {
	return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
/**
* Get the flags for a regexp from the options.
*/
function flags(options) {
	return options && options.sensitive ? "" : "i";
}
/**
* Pull out keys from a regexp.
*/
function regexpToRegexp(path, keys) {
	if (!keys) return path;
	var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
	var index = 0;
	var execResult = groupsRegex.exec(path.source);
	while (execResult) {
		keys.push({
			name: execResult[1] || index++,
			prefix: "",
			suffix: "",
			modifier: "",
			pattern: ""
		});
		execResult = groupsRegex.exec(path.source);
	}
	return path;
}
/**
* Transform an array into a regexp.
*/
function arrayToRegexp(paths, keys, options) {
	var parts = paths.map(function(path) {
		return pathToRegexp(path, keys, options).source;
	});
	return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
/**
* Create a path regexp from string input.
*/
function stringToRegexp(path, keys, options) {
	return tokensToRegexp(parse$1(path, options), keys, options);
}
/**
* Expose a function for taking tokens and returning a RegExp.
*/
function tokensToRegexp(tokens, keys, options) {
	if (options === void 0) options = {};
	var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
		return x;
	} : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
	var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
	var delimiterRe = "[".concat(escapeString(delimiter), "]");
	var route = start ? "^" : "";
	for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
		var token = tokens_1[_i];
		if (typeof token === "string") route += escapeString(encode(token));
		else {
			var prefix = escapeString(encode(token.prefix));
			var suffix = escapeString(encode(token.suffix));
			if (token.pattern) {
				if (keys) keys.push(token);
				if (prefix || suffix) if (token.modifier === "+" || token.modifier === "*") {
					var mod = token.modifier === "*" ? "?" : "";
					route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
				} else route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
				else {
					if (token.modifier === "+" || token.modifier === "*") throw new TypeError("Can not repeat \"".concat(token.name, "\" without a prefix and suffix"));
					route += "(".concat(token.pattern, ")").concat(token.modifier);
				}
			} else route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
		}
	}
	if (end) {
		if (!strict) route += "".concat(delimiterRe, "?");
		route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
	} else {
		var endToken = tokens[tokens.length - 1];
		var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
		if (!strict) route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
		if (!isEndDelimited) route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
	}
	return new RegExp(route, flags(options));
}
/**
* Normalize the given path string, returning a regular expression.
*
* An empty array can be passed in for the keys, which will hold the
* placeholder key descriptions. For example, using `/user/:id`, `keys` will
* contain `[{ name: 'id', delimiter: '/', optional: false, repeat: false }]`.
*/
function pathToRegexp(path, keys, options) {
	if (path instanceof RegExp) return regexpToRegexp(path, keys);
	if (Array.isArray(path)) return arrayToRegexp(path, keys, options);
	return stringToRegexp(path, keys, options);
}
//#endregion
//#region node_modules/msw/lib/core/utils/url/cleanUrl.mjs
var REDUNDANT_CHARACTERS_EXP = /[?|#].*$/g;
function cleanUrl(path) {
	if (path.endsWith("?")) return path;
	return path.replace(REDUNDANT_CHARACTERS_EXP, "");
}
//#endregion
//#region node_modules/msw/lib/core/utils/url/isAbsoluteUrl.mjs
function isAbsoluteUrl(url) {
	return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url);
}
//#endregion
//#region node_modules/msw/lib/core/utils/url/getAbsoluteUrl.mjs
function getAbsoluteUrl(path, baseUrl) {
	if (isAbsoluteUrl(path)) return path;
	if (path.startsWith("*")) return path;
	const origin = baseUrl || typeof location !== "undefined" && location.href;
	return origin ? decodeURI(new URL(encodeURI(path), origin).href) : path;
}
//#endregion
//#region node_modules/msw/lib/core/utils/matching/normalizePath.mjs
function normalizePath(path, baseUrl) {
	if (path instanceof RegExp) return path;
	return cleanUrl(getAbsoluteUrl(path, baseUrl));
}
//#endregion
//#region node_modules/msw/lib/core/utils/matching/matchRequestUrl.mjs
function coercePath(path) {
	return path.replace(/([:a-zA-Z_-]*)(\*{1,2})+/g, (_, parameterName, wildcard) => {
		const expression = "(.*)";
		if (!parameterName) return expression;
		return parameterName.startsWith(":") ? `${parameterName}${wildcard}` : `${parameterName}${expression}`;
	}).replace(/([^/])(:)(?=(?:\d+|\(\.\*\))(?=\/|$))/, "$1\\$2").replace(/^([^/]+)(:)(?=\/\/)/, "$1\\$2");
}
function matchRequestUrl(url, path, baseUrl) {
	const normalizedPath = normalizePath(path, baseUrl);
	const cleanPath = typeof normalizedPath === "string" ? coercePath(normalizedPath) : normalizedPath;
	const cleanUrl = getCleanUrl(url);
	const result = match(cleanPath, { decode: decodeURIComponent })(cleanUrl);
	const params = result && result.params || {};
	return {
		matches: result !== false,
		params
	};
}
function isPath(value) {
	return typeof value === "string" || value instanceof RegExp;
}
//#endregion
//#region node_modules/msw/lib/core/utils/logging/getTimestamp.mjs
function getTimestamp(options) {
	const now = /* @__PURE__ */ new Date();
	const timestamp = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
	if (options?.milliseconds) return `${timestamp}.${now.getMilliseconds().toString().padStart(3, "0")}`;
	return timestamp;
}
//#endregion
//#region node_modules/msw/lib/core/utils/internal/isObject.mjs
function isObject(value) {
	return value != null && typeof value === "object" && !Array.isArray(value);
}
//#endregion
//#region node_modules/msw/lib/core/ws/utils/getMessageLength.mjs
function getMessageLength(data) {
	if (data instanceof Blob) return data.size;
	if (isObject(data) && "byteLength" in data) return data.byteLength;
	return new Blob([data]).size;
}
//#endregion
//#region node_modules/msw/lib/core/ws/utils/truncateMessage.mjs
var MAX_LENGTH = 24;
function truncateMessage(message) {
	if (message.length <= MAX_LENGTH) return message;
	return `${message.slice(0, MAX_LENGTH)}\u2026`;
}
//#endregion
//#region node_modules/msw/lib/core/ws/utils/getPublicData.mjs
async function getPublicData(data) {
	if (data instanceof Blob) return `Blob(${truncateMessage(await data.text())})`;
	if (isObject(data)) return `ArrayBuffer(${truncateMessage(new TextDecoder().decode(data))})`;
	return truncateMessage(data);
}
//#endregion
//#region node_modules/msw/lib/core/ws/utils/attachWebSocketLogger.mjs
var colors = {
	system: "#3b82f6",
	outgoing: "#22c55e",
	incoming: "#ef4444",
	mocked: "#ff6a33"
};
function attachWebSocketLogger(connection) {
	const { client, server } = connection;
	const controller = new AbortController();
	logConnectionOpen(client);
	client.addEventListener("message", (event) => {
		logOutgoingClientMessage(event);
	}, { signal: controller.signal });
	client.addEventListener("close", (event) => {
		logConnectionClose(event);
	}, { signal: controller.signal });
	client.socket.addEventListener("error", (event) => {
		logClientError(event);
	}, { signal: controller.signal });
	const { send: originalClientSend } = client;
	client.send = new Proxy(client.send, { apply(target, thisArg, args) {
		const [data] = args;
		const messageEvent = new MessageEvent("message", { data });
		Object.defineProperties(messageEvent, {
			currentTarget: {
				enumerable: true,
				writable: false,
				value: client.socket
			},
			target: {
				enumerable: true,
				writable: false,
				value: client.socket
			}
		});
		queueMicrotask(() => {
			logIncomingMockedClientMessage(messageEvent);
		});
		return Reflect.apply(target, thisArg, args);
	} });
	server.addEventListener("open", () => {
		server.addEventListener("message", (event) => {
			logIncomingServerMessage(event);
		});
	}, {
		once: true,
		signal: controller.signal
	});
	const { send: originalServerSend } = server;
	server.send = new Proxy(server.send, { apply(target, thisArg, args) {
		const [data] = args;
		const messageEvent = new MessageEvent("message", { data });
		Object.defineProperties(messageEvent, {
			currentTarget: {
				enumerable: true,
				writable: false,
				value: server.socket
			},
			target: {
				enumerable: true,
				writable: false,
				value: server.socket
			}
		});
		logOutgoingMockedClientMessage(messageEvent);
		return Reflect.apply(target, thisArg, args);
	} });
	controller.signal.addEventListener("abort", () => {
		client.send = originalClientSend;
		server.send = originalServerSend;
	}, { once: true });
	return () => {
		controller.abort();
	};
}
function logConnectionOpen(client) {
	const publicUrl = toPublicUrl(client.url);
	console.groupCollapsed(devUtils.formatMessage(`${getTimestamp()} %c\u25B6%c ${publicUrl}`), `color:${colors.system}`, "color:inherit");
	console.log("Client:", client.socket);
	console.groupEnd();
}
function logConnectionClose(event) {
	const target = event.target;
	const publicUrl = toPublicUrl(target.url);
	console.groupCollapsed(devUtils.formatMessage(`${getTimestamp({ milliseconds: true })} %c\u25A0%c ${publicUrl}`), `color:${colors.system}`, "color:inherit");
	console.log(event);
	console.groupEnd();
}
function logClientError(event) {
	const socket = event.target;
	const publicUrl = toPublicUrl(socket.url);
	console.groupCollapsed(devUtils.formatMessage(`${getTimestamp({ milliseconds: true })} %c\xD7%c ${publicUrl}`), `color:${colors.system}`, "color:inherit");
	console.log(event);
	console.groupEnd();
}
async function logOutgoingClientMessage(event) {
	const byteLength = getMessageLength(event.data);
	const publicData = await getPublicData(event.data);
	const arrow = event.defaultPrevented ? "⇡" : "⬆";
	console.groupCollapsed(devUtils.formatMessage(`${getTimestamp({ milliseconds: true })} %c${arrow}%c ${publicData} %c${byteLength}%c`), `color:${colors.outgoing}`, "color:inherit", "color:gray;font-weight:normal", "color:inherit;font-weight:inherit");
	console.log(event);
	console.groupEnd();
}
async function logOutgoingMockedClientMessage(event) {
	const byteLength = getMessageLength(event.data);
	const publicData = await getPublicData(event.data);
	console.groupCollapsed(devUtils.formatMessage(`${getTimestamp({ milliseconds: true })} %c\u2B06%c ${publicData} %c${byteLength}%c`), `color:${colors.mocked}`, "color:inherit", "color:gray;font-weight:normal", "color:inherit;font-weight:inherit");
	console.log(event);
	console.groupEnd();
}
async function logIncomingMockedClientMessage(event) {
	const byteLength = getMessageLength(event.data);
	const publicData = await getPublicData(event.data);
	console.groupCollapsed(devUtils.formatMessage(`${getTimestamp({ milliseconds: true })} %c\u2B07%c ${publicData} %c${byteLength}%c`), `color:${colors.mocked}`, "color:inherit", "color:gray;font-weight:normal", "color:inherit;font-weight:inherit");
	console.log(event);
	console.groupEnd();
}
async function logIncomingServerMessage(event) {
	const byteLength = getMessageLength(event.data);
	const publicData = await getPublicData(event.data);
	const arrow = event.defaultPrevented ? "⇣" : "⬇";
	console.groupCollapsed(devUtils.formatMessage(`${getTimestamp({ milliseconds: true })} %c${arrow}%c ${publicData} %c${byteLength}%c`), `color:${colors.incoming}`, "color:inherit", "color:gray;font-weight:normal", "color:inherit;font-weight:inherit");
	console.log(event);
	console.groupEnd();
}
//#endregion
//#region node_modules/msw/lib/core/handlers/WebSocketHandler.mjs
var kEmitter$2 = /* @__PURE__ */ Symbol("kEmitter");
var kConnect = /* @__PURE__ */ Symbol("kConnect");
var kAutoConnect = /* @__PURE__ */ Symbol("kAutoConnect");
var kStopPropagationPatched = /* @__PURE__ */ Symbol("kStopPropagationPatched");
var KOnStopPropagation = /* @__PURE__ */ Symbol("KOnStopPropagation");
var WebSocketHandler = class {
	constructor(url) {
		this.url = url;
		this.id = createRequestId$1();
		this[kEmitter$2] = new Emitter$2();
		this.callFrame = getCallFrame(/* @__PURE__ */ new Error());
	}
	url;
	id;
	callFrame;
	kind = "websocket";
	[kEmitter$2];
	parse(args) {
		const clientUrl = new URL(args.url);
		const resolvedHandlerUrl = this.url instanceof RegExp || this.url.startsWith("*") ? this.url : this.#resolveWebSocketUrl(this.url, args.resolutionContext?.baseUrl);
		clientUrl.pathname = clientUrl.pathname.replace(/^\/socket.io\//, "/");
		return { match: matchRequestUrl(clientUrl, resolvedHandlerUrl, args.resolutionContext?.baseUrl) };
	}
	predicate(args) {
		return args.parsedResult.match.matches;
	}
	test(url, resolutionContext) {
		return this.#match(url, resolutionContext) != null;
	}
	async run(connection, resolutionContext) {
		const parsedResult = this.#match(connection.client.url, resolutionContext);
		if (parsedResult == null) return null;
		const resolvedConnection = {
			...connection,
			params: parsedResult.match.params || {}
		};
		if (resolutionContext?.[kAutoConnect] ?? true) {
			if (this[kConnect](resolvedConnection)) return resolvedConnection;
			return null;
		}
		return resolvedConnection;
	}
	#match(url, resolutionContext) {
		const resolvedUrl = this.#resolveWebSocketUrl(url.toString(), resolutionContext?.baseUrl);
		const parsedResult = this.parse({
			url: resolvedUrl,
			resolutionContext
		});
		if (this.predicate({
			url,
			parsedResult
		})) return parsedResult;
		return null;
	}
	[kConnect](connection) {
		connection.client.addEventListener("message", createStopPropagationListener(this));
		connection.client.addEventListener("close", createStopPropagationListener(this));
		connection.server.addEventListener("open", createStopPropagationListener(this));
		connection.server.addEventListener("message", createStopPropagationListener(this));
		connection.server.addEventListener("error", createStopPropagationListener(this));
		connection.server.addEventListener("close", createStopPropagationListener(this));
		return this[kEmitter$2].emit("connection", connection);
	}
	log(connection) {
		return attachWebSocketLogger(connection);
	}
	#resolveWebSocketUrl(url, baseUrl) {
		return resolveWebSocketUrl$1(baseUrl ? new URL(url, baseUrl) : url).replace(/\/$/, "");
	}
};
function createStopPropagationListener(handler) {
	return function stopPropagationListener(event) {
		const propagationStoppedAt = Reflect.get(event, "kPropagationStoppedAt");
		if (propagationStoppedAt && handler.id !== propagationStoppedAt) {
			event.stopImmediatePropagation();
			return;
		}
		Object.defineProperty(event, KOnStopPropagation, {
			value() {
				Object.defineProperty(event, "kPropagationStoppedAt", { value: handler.id });
			},
			configurable: true
		});
		if (!Reflect.get(event, kStopPropagationPatched)) {
			event.stopPropagation = new Proxy(event.stopPropagation, { apply: (target, thisArg, args) => {
				Reflect.get(event, KOnStopPropagation)?.call(handler);
				return Reflect.apply(target, thisArg, args);
			} });
			Object.defineProperty(event, kStopPropagationPatched, {
				value: true,
				configurable: false
			});
		}
	};
}
//#endregion
//#region node_modules/msw/lib/core/utils/internal/attachSiblingHandlers.mjs
var kSiblingHandlers = /* @__PURE__ */ Symbol("kSiblingHandlers");
function attachSiblingHandlers(owner, siblings) {
	invariant$1(getSiblingHandlers(owner).length === 0, "Failed to merge handlers: the owner \"%s\" handler is already merged", owner.kind);
	Object.defineProperty(owner, kSiblingHandlers, {
		value: siblings,
		enumerable: false,
		writable: false,
		configurable: false
	});
	return owner;
}
function getSiblingHandlers(owner) {
	return Reflect.get(owner, kSiblingHandlers) || [];
}
//#endregion
//#region node_modules/msw/lib/core/experimental/handlers-controller.mjs
function groupHandlersByKind(handlers) {
	const groups = {};
	const pushUnique = (kind, handler) => {
		const bucket = groups[kind] ||= [];
		if (!bucket.includes(handler)) bucket.push(handler);
	};
	for (const handler of handlers) {
		pushUnique(handler.kind, handler);
		for (const sibling of getSiblingHandlers(handler)) pushUnique(sibling.kind, sibling);
	}
	return groups;
}
var HandlersController = class {
	getInitialState(initialHandlers) {
		invariant$1(this.#validateHandlers(initialHandlers), devUtils.formatMessage("Failed to apply given request handlers: invalid input. Did you forget to spread the request handlers Array?"));
		const normalizedInitialHandlers = groupHandlersByKind(initialHandlers);
		return {
			initialHandlers: normalizedInitialHandlers,
			handlers: { ...normalizedInitialHandlers }
		};
	}
	currentHandlers() {
		return Object.values(this.getState().handlers).flat().filter((handler) => handler != null);
	}
	getHandlersByKind(kind) {
		return this.getState().handlers[kind] || [];
	}
	use(nextHandlers) {
		invariant$1(this.#validateHandlers(nextHandlers), devUtils.formatMessage("[MSW] Failed to call \"use()\" with the given request handlers: invalid input. Did you forget to spread the array of request handlers?"));
		if (nextHandlers.length === 0) return;
		const { handlers } = this.getState();
		const overrides = groupHandlersByKind(nextHandlers);
		for (const kind in overrides) {
			const overridesForKind = overrides[kind];
			const existingForKind = handlers[kind];
			handlers[kind] = existingForKind ? [...overridesForKind, ...existingForKind] : overridesForKind;
		}
		this.setState({ handlers });
	}
	reset(nextHandlers) {
		invariant$1(nextHandlers.length > 0 ? this.#validateHandlers(nextHandlers) : true, devUtils.formatMessage("Failed to replace initial handlers during reset: invalid handlers. Did you forget to spread the handlers array?"));
		for (const handler of this.currentHandlers()) if ("reset" in handler) handler["reset"]();
		const { initialHandlers } = this.getState();
		if (nextHandlers.length === 0) {
			this.setState({ handlers: { ...initialHandlers } });
			return;
		}
		const normalizedNextHandlers = groupHandlersByKind(nextHandlers);
		this.setState({
			initialHandlers: normalizedNextHandlers,
			handlers: { ...normalizedNextHandlers }
		});
	}
	restore() {
		for (const handler of this.currentHandlers()) if ("restore" in handler) handler["restore"]();
	}
	#validateHandlers(handlers) {
		return handlers.every((handler) => !Array.isArray(handler));
	}
};
var InMemoryHandlersController = class extends HandlersController {
	#handlers;
	#initialHandlers;
	constructor(initialHandlers) {
		super();
		const initialState = this.getInitialState(initialHandlers);
		this.#initialHandlers = initialState.initialHandlers;
		this.#handlers = initialState.handlers;
	}
	getState() {
		return {
			initialHandlers: this.#initialHandlers,
			handlers: this.#handlers
		};
	}
	setState(nextState) {
		if (nextState.initialHandlers) this.#initialHandlers = nextState.initialHandlers;
		if (nextState.handlers) this.#handlers = nextState.handlers;
	}
};
//#endregion
//#region node_modules/msw/lib/core/experimental/frames/http-frame.mjs
var RequestEvent = class extends TypedEvent$1 {
	requestId;
	request;
	constructor(type, data) {
		super(...[type, {}]);
		this.requestId = data.requestId;
		this.request = data.request;
	}
};
var ResponseEvent = class extends TypedEvent$1 {
	requestId;
	request;
	response;
	constructor(type, data) {
		super(...[type, {}]);
		this.requestId = data.requestId;
		this.request = data.request;
		this.response = data.response;
	}
};
var UnhandledExceptionEvent = class extends TypedEvent$1 {
	error;
	requestId;
	request;
	constructor(type, data) {
		super(...[type, {}]);
		this.error = data.error;
		this.requestId = data.requestId;
		this.request = data.request;
	}
};
var HttpNetworkFrame = class extends NetworkFrame {
	constructor(options) {
		const id = options.id || createRequestId$1();
		super("http", {
			id,
			request: options.request
		});
	}
	getHandlers(controller) {
		return controller.getHandlersByKind("request");
	}
	async getUnhandledMessage() {
		const { request } = this.data;
		const url = new URL(request.url);
		const publicUrl = toPublicUrl(url) + url.search;
		const requestBody = request.body == null ? null : await request.clone().text();
		return `intercepted a request without a matching request handler:${`

  \u2022 ${request.method} ${publicUrl}

${requestBody ? `  \u2022 Request body: ${requestBody}

` : ""}`}If you still wish to intercept this unhandled request, please create a request handler for it.
Read more: https://mswjs.io/docs/http/intercepting-requests`;
	}
	async resolve(handlers, onUnhandledFrame, resolutionContext) {
		const { id: requestId, request } = this.data;
		const requestCloneForLogs = resolutionContext?.quiet ? null : request.clone();
		this.events.emit(new RequestEvent("request:start", {
			requestId,
			request
		}));
		if (shouldBypassRequest(request)) {
			this.events.emit(new RequestEvent("request:end", {
				requestId,
				request
			}));
			this.passthrough();
			return null;
		}
		const [lookupError, lookupResult] = await until$1(() => {
			return executeHandlers({
				requestId,
				request,
				handlers,
				resolutionContext: {
					baseUrl: resolutionContext?.baseUrl?.toString(),
					quiet: resolutionContext?.quiet
				}
			});
		});
		if (lookupError != null) {
			if (!this.events.emit(new UnhandledExceptionEvent("unhandledException", {
				error: lookupError,
				requestId,
				request
			}))) {
				console.error(lookupError);
				devUtils.error("Encountered an unhandled exception during the handler lookup for \"%s %s\". Please see the original error above.", request.method, request.url);
			}
			this.errorWith(lookupError);
			return null;
		}
		if (lookupResult == null) {
			this.events.emit(new RequestEvent("request:unhandled", {
				requestId,
				request
			}));
			await executeUnhandledFrameHandle(this, onUnhandledFrame).then(() => this.passthrough(), (error) => this.errorWith(error));
			this.events.emit(new RequestEvent("request:end", {
				requestId,
				request
			}));
			return false;
		}
		const { response, handler, parsedResult } = lookupResult;
		this.events.emit(new RequestEvent("request:match", {
			requestId,
			request
		}));
		if (response == null) {
			this.events.emit(new RequestEvent("request:end", {
				requestId,
				request
			}));
			this.passthrough();
			return null;
		}
		if (isPassthroughResponse(response)) {
			this.events.emit(new RequestEvent("request:end", {
				requestId,
				request
			}));
			this.passthrough();
			return null;
		}
		const responseCloneForLogs = resolutionContext?.quiet ? null : response.clone();
		await storeResponseCookies(request, response);
		this.respondWith(response);
		this.events.emit(new RequestEvent("request:end", {
			requestId,
			request
		}));
		if (!resolutionContext?.quiet) handler.log({
			request: requestCloneForLogs,
			response: responseCloneForLogs,
			parsedResult
		});
		return true;
	}
};
//#endregion
//#region node_modules/msw/lib/core/experimental/on-unhandled-frame.mjs
async function executeUnhandledFrameHandle(frame, handle) {
	const printStrategyMessage = async (strategy) => {
		if (strategy === "bypass") return;
		const message = await frame.getUnhandledMessage();
		switch (strategy) {
			case "warn": return devUtils.warn("Warning: %s", message);
			case "error": return devUtils.error("Error: %s", message);
		}
	};
	const applyStrategy = async (strategy) => {
		invariant$1.as(
			InternalError,
			strategy === "bypass" || strategy === "warn" || strategy === "error",
			/**
			* @fixme Rename "onUnhandledRequest" to "onUnhandledFrame" in the error message
			* with the next major release.
			*/
			devUtils.formatMessage("Failed to react to an unhandled network frame: unknown strategy \"%s\". Please provide one of the supported strategies (\"bypass\", \"warn\", \"error\") or a custom callback function as the value of the \"onUnhandledRequest\" option.", strategy)
		);
		if (strategy === "bypass") return;
		await printStrategyMessage(strategy);
		if (strategy === "error") return Promise.reject(new InternalError(devUtils.formatMessage("Cannot bypass a request when using the \"error\" strategy for the \"onUnhandledRequest\" option.")));
	};
	if (typeof handle === "function") return handle({
		frame,
		defaults: {
			warn: printStrategyMessage.bind(null, "warn"),
			/**
			* @note The defaults only print the corresponding messages now.
			* They do not affect the frame resolution (e.g. do not error the frame).
			* That is only for backward compatibility reasons. In the future, these should
			* be an alias to `applyStrategy.bind(null, 'error')` instead.
			*/
			error: printStrategyMessage.bind(null, "error")
		}
	});
	if (frame instanceof HttpNetworkFrame && isCommonAssetRequest(frame.data.request)) return;
	return applyStrategy(handle);
}
//#endregion
//#region node_modules/msw/lib/core/utils/internal/toReadonlyArray.mjs
function toReadonlyArray(source) {
	const clone = [...source];
	Object.freeze(clone);
	return clone;
}
//#endregion
//#region node_modules/msw/lib/core/utils/internal/Disposable.mjs
var Disposable = class {
	subscriptions = [];
	dispose() {
		let subscription;
		const errors = [];
		while (subscription = this.subscriptions.shift()) try {
			subscription();
		} catch (error) {
			if (error instanceof Error) errors.push(error);
		}
		if (errors.length > 0) console.error(new AggregateError(errors, devUtils.formatMessage("Failed to dispose of some side effects. This is likely an issue with MSW, please report it on GitHub: https://github.com/mswjs/msw/issues")));
	}
};
//#endregion
//#region node_modules/msw/lib/core/experimental/define-network.mjs
function colorlessPromiseAll(values) {
	const promises = [];
	for (const value of values) if (value instanceof Promise) promises.push(value);
	if (promises.length > 0) return Promise.all(promises).then(() => {});
}
var NetworkReadyState = /* @__PURE__ */ ((NetworkReadyState2) => {
	NetworkReadyState2[NetworkReadyState2["DISABLED"] = 0] = "DISABLED";
	NetworkReadyState2[NetworkReadyState2["ENABLED"] = 1] = "ENABLED";
	return NetworkReadyState2;
})(NetworkReadyState || {});
function defineNetwork(options) {
	let readyState = 0;
	const events = new Emitter$1();
	const disposable = new Disposable();
	const deriveHandlersController = (handlers) => {
		return handlers instanceof HandlersController ? handlers : new InMemoryHandlersController(handlers || []);
	};
	let resolvedOptions = { ...options };
	let handlersController = deriveHandlersController(resolvedOptions.handlers);
	return {
		get readyState() {
			return readyState;
		},
		events,
		configure(options2) {
			invariant$1(readyState === 0, "Failed to call \"configure()\" on the network: cannot configure an already enabled network.");
			if (options2.handlers && !Object.is(options2.handlers, resolvedOptions.handlers)) handlersController = deriveHandlersController(options2.handlers);
			resolvedOptions = {
				...resolvedOptions,
				...options2
			};
		},
		enable() {
			invariant$1(readyState === 0, "Failed to call \"enable\" on the network: already enabled");
			readyState = 1;
			const session = { active: true };
			disposable["subscriptions"].push(() => {
				session.active = false;
			});
			return colorlessPromiseAll(resolvedOptions.sources.map((source) => {
				NetworkSource.prototype.disable.call(source);
				source.on("frame", async ({ frame }) => {
					frame.events.on("*", (event) => {
						if (!session.active) return;
						events.emit(event);
					});
					const handlers = frame.getHandlers(handlersController);
					await frame.resolve(handlers, resolvedOptions.onUnhandledFrame || "warn", resolvedOptions.context);
				});
				return source.enable();
			}));
		},
		disable() {
			invariant$1(readyState === 1, "Failed to call \"disable\" on the network: already disabled");
			readyState = 0;
			disposable.dispose();
			return colorlessPromiseAll(resolvedOptions.sources.map((source) => source.disable()));
		},
		use(...handlers) {
			handlersController.use(handlers);
		},
		resetHandlers(...handlers) {
			handlersController.reset(handlers);
		},
		restoreHandlers() {
			handlersController.restore();
		},
		listHandlers() {
			return toReadonlyArray(handlersController.currentHandlers());
		}
	};
}
//#endregion
//#region node_modules/msw/lib/core/experimental/frames/websocket-frame.mjs
var WebSocketConnectionEvent = class extends TypedEvent$1 {
	url;
	protocols;
	constructor(type, data) {
		super(...[type, {}]);
		this.url = data.url;
		this.protocols = data.protocols;
	}
};
var UnhandledWebSocketExceptionEvent = class extends TypedEvent$1 {
	url;
	protocols;
	error;
	constructor(type, data) {
		super(...[type, {}]);
		this.url = data.url;
		this.protocols = data.protocols;
		this.error = data.error;
	}
};
var WebSocketNetworkFrame = class extends NetworkFrame {
	constructor(options) {
		super("ws", { connection: options.connection });
	}
	getHandlers(controller) {
		return controller.getHandlersByKind("websocket");
	}
	async resolve(handlers, onUnhandledFrame, resolutionContext) {
		const { connection } = this.data;
		this.events.emit(new WebSocketConnectionEvent("connection", {
			url: connection.client.url,
			protocols: connection.info.protocols
		}));
		if (handlers.length === 0) {
			await executeUnhandledFrameHandle(this, onUnhandledFrame).then(() => this.passthrough(), (error) => this.errorWith(error));
			return false;
		}
		let hasMatchingHandlers = false;
		for (const handler of handlers) {
			const handlerConnection = await handler.run(connection, {
				baseUrl: resolutionContext?.baseUrl?.toString(),
				/**
				* @note Do not emit the "connection" event when running the handler.
				* Use the run only to get the resolved connection object.
				*/
				[kAutoConnect]: false
			});
			if (!handlerConnection) continue;
			hasMatchingHandlers = true;
			const removeLogger = !resolutionContext?.quiet ? handler.log(connection) : void 0;
			try {
				if (!handler[kConnect](handlerConnection)) removeLogger?.();
			} catch (error) {
				if (!this.events.emit(new UnhandledWebSocketExceptionEvent("unhandledException", {
					error,
					url: connection.client.url,
					protocols: connection.info.protocols
				}))) {
					console.error(error);
					devUtils.error("Encountered an unhandled exception during the handler lookup for \"%s\". Please see the original error above.", connection.client.url);
				}
				throw error;
			}
		}
		if (!hasMatchingHandlers) {
			await executeUnhandledFrameHandle(this, onUnhandledFrame).then(() => this.passthrough(), (error) => this.errorWith(error));
			return false;
		}
		return true;
	}
	async getUnhandledMessage() {
		const { connection } = this.data;
		return `intercepted a WebSocket connection without a matching event handler:${`

  \u2022 ${connection.client.url}

`}If you still wish to intercept this unhandled connection, please create an event handler for it.
Read more: https://mswjs.io/docs/websocket`;
	}
};
//#endregion
//#region node_modules/msw/lib/core/experimental/sources/interceptor-source.mjs
var InterceptorSource = class extends NetworkSource {
	#interceptor;
	#frames;
	constructor(options) {
		super();
		this.#interceptor = new BatchInterceptor({
			name: "interceptor-source",
			interceptors: options.interceptors
		});
		this.#frames = /* @__PURE__ */ new Map();
	}
	enable() {
		this.#interceptor.apply();
		this.#interceptor.on("request", this.#handleRequest.bind(this)).on("response", this.#handleResponse.bind(this)).on("connection", this.#handleWebSocketConnection.bind(this));
	}
	disable() {
		super.disable();
		this.#interceptor.dispose();
		this.#frames.clear();
	}
	async #handleRequest({ requestId, request, controller }) {
		const httpFrame = new InterceptorHttpNetworkFrame({
			id: requestId,
			request,
			controller
		});
		this.#frames.set(requestId, httpFrame);
		await this.queue(httpFrame);
	}
	async #handleResponse({ requestId, request, response, isMockedResponse }) {
		const httpFrame = this.#frames.get(requestId);
		this.#frames.delete(requestId);
		if (httpFrame == null) return;
		queueMicrotask(() => {
			try {
				httpFrame.events.emit(new ResponseEvent(isMockedResponse ? "response:mocked" : "response:bypass", {
					requestId,
					request,
					response
				}));
			} finally {
				httpFrame.events.removeAllListeners();
			}
		});
	}
	async #handleWebSocketConnection(connection) {
		await this.queue(new InterceptorWebSocketNetworkFrame({ connection }));
	}
};
var InterceptorHttpNetworkFrame = class extends HttpNetworkFrame {
	#controller;
	constructor(options) {
		super({
			id: options.id,
			request: options.request
		});
		this.#controller = options.controller;
	}
	passthrough() {
		deleteRequestPassthroughHeader(this.data.request);
	}
	respondWith(response) {
		if (response) this.#controller.respondWith(response);
	}
	errorWith(reason) {
		if (reason instanceof Response) return this.respondWith(reason);
		if (reason instanceof InternalError) this.#controller.errorWith(reason);
		throw reason;
	}
};
var InterceptorWebSocketNetworkFrame = class extends WebSocketNetworkFrame {
	constructor(args) {
		super({ connection: args.connection });
		args.connection.client.addEventListener("close", () => {
			this.events.removeAllListeners();
		}, { once: true });
	}
	errorWith(reason) {
		if (reason instanceof Error) {
			const { client } = this.data.connection;
			const errorEvent = new Event("error");
			Object.defineProperty(errorEvent, "cause", {
				enumerable: true,
				configurable: false,
				value: reason
			});
			client.socket.dispatchEvent(errorEvent);
		}
	}
	passthrough() {
		this.data.connection.server.connect();
	}
};
//#endregion
//#region node_modules/msw/lib/core/experimental/compat.mjs
function fromLegacyOnUnhandledRequest(getLegacyValue) {
	return ({ frame, defaults }) => {
		const legacyOnUnhandledRequestStrategy = getLegacyValue();
		if (legacyOnUnhandledRequestStrategy == null) return;
		if (typeof legacyOnUnhandledRequestStrategy === "function") {
			const request = frame instanceof HttpNetworkFrame ? frame.data.request : frame instanceof WebSocketNetworkFrame ? new Request(frame.data.connection.client.url, { headers: {
				connection: "upgrade",
				upgrade: "websocket"
			} }) : null;
			invariant$1(request != null, "Failed to coerce a network frame to a legacy `onUnhandledRequest` strategy: unknown frame protocol \"%s\"", frame.protocol);
			return legacyOnUnhandledRequestStrategy(request, {
				warning: defaults.warn,
				error: defaults.error
			});
		}
		return executeUnhandledFrameHandle(frame, legacyOnUnhandledRequestStrategy);
	};
}
//#endregion
//#region node_modules/msw/lib/core/utils/toResponseInit.mjs
function toResponseInit(response) {
	return {
		status: response.status,
		statusText: response.statusText,
		headers: Object.fromEntries(response.headers.entries())
	};
}
//#endregion
//#region node_modules/msw/lib/browser/index.mjs
var POSITIONALS_EXP = /(%?)(%([sdijo]))/g;
function serializePositional(positional, flag) {
	switch (flag) {
		case "s": return positional;
		case "d":
		case "i": return Number(positional);
		case "j": return JSON.stringify(positional);
		case "o": {
			if (typeof positional === "string") return positional;
			const json = JSON.stringify(positional);
			if (json === "{}" || json === "[]" || /^\[object .+?\]$/.test(json)) return positional;
			return json;
		}
	}
}
function format(message, ...positionals) {
	if (positionals.length === 0) return message;
	let positionalIndex = 0;
	let formattedMessage = message.replace(POSITIONALS_EXP, (match, isEscaped, _, flag) => {
		const positional = positionals[positionalIndex];
		const value = serializePositional(positional, flag);
		if (!isEscaped) {
			positionalIndex++;
			return value;
		}
		return match;
	});
	if (positionalIndex < positionals.length) formattedMessage += ` ${positionals.slice(positionalIndex).join(" ")}`;
	formattedMessage = formattedMessage.replace(/%{2,2}/g, "%");
	return formattedMessage;
}
var STACK_FRAMES_TO_IGNORE = 2;
function cleanErrorStack(error2) {
	if (!error2.stack) return;
	const nextStack = error2.stack.split("\n");
	nextStack.splice(1, STACK_FRAMES_TO_IGNORE);
	error2.stack = nextStack.join("\n");
}
var InvariantError = class extends Error {
	constructor(message, ...positionals) {
		super(message);
		this.message = message;
		this.name = "Invariant Violation";
		this.message = format(message, ...positionals);
		cleanErrorStack(this);
	}
};
var invariant = (predicate, message, ...positionals) => {
	if (!predicate) throw new InvariantError(message, ...positionals);
};
invariant.as = (ErrorConstructor, predicate, message, ...positionals) => {
	if (!predicate) {
		const formatMessage = positionals.length === 0 ? message : format(message, ...positionals);
		let error2;
		try {
			error2 = Reflect.construct(ErrorConstructor, [formatMessage]);
		} catch (err) {
			error2 = ErrorConstructor(formatMessage);
		}
		throw error2;
	}
};
function isNodeProcess() {
	if (typeof navigator !== "undefined" && navigator.product === "ReactNative") return true;
	if (typeof process !== "undefined") {
		const type = process.type;
		if (type === "renderer" || type === "worker") return false;
		return !!(process.versions && process.versions.node);
	}
	return false;
}
var __defProp$1 = Object.defineProperty;
var __export = (target, all) => {
	for (var name in all) __defProp$1(target, name, {
		get: all[name],
		enumerable: true
	});
};
var colors_exports = {};
__export(colors_exports, {
	blue: () => blue,
	gray: () => gray,
	green: () => green,
	red: () => red,
	yellow: () => yellow
});
function yellow(text) {
	return `\x1B[33m${text}\x1B[0m`;
}
function blue(text) {
	return `\x1B[34m${text}\x1B[0m`;
}
function gray(text) {
	return `\x1B[90m${text}\x1B[0m`;
}
function red(text) {
	return `\x1B[31m${text}\x1B[0m`;
}
function green(text) {
	return `\x1B[32m${text}\x1B[0m`;
}
var IS_NODE = isNodeProcess();
var Logger = class {
	constructor(name) {
		this.name = name;
		this.prefix = `[${this.name}]`;
		const LOGGER_NAME = getVariable("DEBUG");
		const LOGGER_LEVEL = getVariable("LOG_LEVEL");
		if (LOGGER_NAME === "1" || LOGGER_NAME === "true" || typeof LOGGER_NAME !== "undefined" && this.name.startsWith(LOGGER_NAME)) {
			this.debug = isDefinedAndNotEquals(LOGGER_LEVEL, "debug") ? noop : this.debug;
			this.info = isDefinedAndNotEquals(LOGGER_LEVEL, "info") ? noop : this.info;
			this.success = isDefinedAndNotEquals(LOGGER_LEVEL, "success") ? noop : this.success;
			this.warning = isDefinedAndNotEquals(LOGGER_LEVEL, "warning") ? noop : this.warning;
			this.error = isDefinedAndNotEquals(LOGGER_LEVEL, "error") ? noop : this.error;
		} else {
			this.info = noop;
			this.success = noop;
			this.warning = noop;
			this.error = noop;
			this.only = noop;
		}
	}
	prefix;
	extend(domain) {
		return new Logger(`${this.name}:${domain}`);
	}
	/**
	* Print a debug message.
	* @example
	* logger.debug('no duplicates found, creating a document...')
	*/
	debug(message, ...positionals) {
		this.logEntry({
			level: "debug",
			message: gray(message),
			positionals,
			prefix: this.prefix,
			colors: { prefix: "gray" }
		});
	}
	/**
	* Print an info message.
	* @example
	* logger.info('start parsing...')
	*/
	info(message, ...positionals) {
		this.logEntry({
			level: "info",
			message,
			positionals,
			prefix: this.prefix,
			colors: { prefix: "blue" }
		});
		const performance2 = new PerformanceEntry();
		return (message2, ...positionals2) => {
			performance2.measure();
			this.logEntry({
				level: "info",
				message: `${message2} ${gray(`${performance2.deltaTime}ms`)}`,
				positionals: positionals2,
				prefix: this.prefix,
				colors: { prefix: "blue" }
			});
		};
	}
	/**
	* Print a success message.
	* @example
	* logger.success('successfully created document')
	*/
	success(message, ...positionals) {
		this.logEntry({
			level: "info",
			message,
			positionals,
			prefix: `\u2714 ${this.prefix}`,
			colors: {
				timestamp: "green",
				prefix: "green"
			}
		});
	}
	/**
	* Print a warning.
	* @example
	* logger.warning('found legacy document format')
	*/
	warning(message, ...positionals) {
		this.logEntry({
			level: "warning",
			message,
			positionals,
			prefix: `\u26A0 ${this.prefix}`,
			colors: {
				timestamp: "yellow",
				prefix: "yellow"
			}
		});
	}
	/**
	* Print an error message.
	* @example
	* logger.error('something went wrong')
	*/
	error(message, ...positionals) {
		this.logEntry({
			level: "error",
			message,
			positionals,
			prefix: `\u2716 ${this.prefix}`,
			colors: {
				timestamp: "red",
				prefix: "red"
			}
		});
	}
	/**
	* Execute the given callback only when the logging is enabled.
	* This is skipped in its entirety and has no runtime cost otherwise.
	* This executes regardless of the log level.
	* @example
	* logger.only(() => {
	*   logger.info('additional info')
	* })
	*/
	only(callback) {
		callback();
	}
	createEntry(level, message) {
		return {
			timestamp: /* @__PURE__ */ new Date(),
			level,
			message
		};
	}
	logEntry(args) {
		const { level, message, prefix, colors: customColors, positionals = [] } = args;
		const entry = this.createEntry(level, message);
		const timestampColor = customColors?.timestamp || "gray";
		const prefixColor = customColors?.prefix || "gray";
		const colorize = {
			timestamp: colors_exports[timestampColor],
			prefix: colors_exports[prefixColor]
		};
		this.getWriter(level)([colorize.timestamp(this.formatTimestamp(entry.timestamp))].concat(prefix != null ? colorize.prefix(prefix) : []).concat(serializeInput(message)).join(" "), ...positionals.map(serializeInput));
	}
	formatTimestamp(timestamp) {
		return `${timestamp.toLocaleTimeString("en-GB")}:${timestamp.getMilliseconds()}`;
	}
	getWriter(level) {
		switch (level) {
			case "debug":
			case "success":
			case "info": return log;
			case "warning": return warn;
			case "error": return error;
		}
	}
};
var PerformanceEntry = class {
	startTime;
	endTime;
	deltaTime;
	constructor() {
		this.startTime = performance.now();
	}
	measure() {
		this.endTime = performance.now();
		const deltaTime = this.endTime - this.startTime;
		this.deltaTime = deltaTime.toFixed(2);
	}
};
var noop = () => void 0;
function log(message, ...positionals) {
	if (IS_NODE) {
		process.stdout.write(format(message, ...positionals) + "\n");
		return;
	}
	console.log(message, ...positionals);
}
function warn(message, ...positionals) {
	if (IS_NODE) {
		process.stderr.write(format(message, ...positionals) + "\n");
		return;
	}
	console.warn(message, ...positionals);
}
function error(message, ...positionals) {
	if (IS_NODE) {
		process.stderr.write(format(message, ...positionals) + "\n");
		return;
	}
	console.error(message, ...positionals);
}
function getVariable(variableName) {
	if (IS_NODE) return process.env[variableName];
	return globalThis[variableName]?.toString();
}
function isDefinedAndNotEquals(value, expected) {
	return value !== void 0 && value !== expected;
}
function serializeInput(message) {
	if (typeof message === "undefined") return "undefined";
	if (message === null) return "null";
	if (typeof message === "string") return message;
	if (typeof message === "object") return JSON.stringify(message);
	return message.toString();
}
var MemoryLeakError = class extends Error {
	constructor(emitter, type, count) {
		super(`Possible EventEmitter memory leak detected. ${count} ${type.toString()} listeners added. Use emitter.setMaxListeners() to increase limit`);
		this.emitter = emitter;
		this.type = type;
		this.count = count;
		this.name = "MaxListenersExceededWarning";
	}
};
var _Emitter = class {
	static listenerCount(emitter, eventName) {
		return emitter.listenerCount(eventName);
	}
	constructor() {
		this.events = /* @__PURE__ */ new Map();
		this.maxListeners = _Emitter.defaultMaxListeners;
		this.hasWarnedAboutPotentialMemoryLeak = false;
	}
	_emitInternalEvent(internalEventName, eventName, listener) {
		this.emit(internalEventName, ...[eventName, listener]);
	}
	_getListeners(eventName) {
		return Array.prototype.concat.apply([], this.events.get(eventName)) || [];
	}
	_removeListener(listeners, listener) {
		const index = listeners.indexOf(listener);
		if (index > -1) listeners.splice(index, 1);
		return [];
	}
	_wrapOnceListener(eventName, listener) {
		const onceListener = (...data) => {
			this.removeListener(eventName, onceListener);
			return listener.apply(this, data);
		};
		Object.defineProperty(onceListener, "name", { value: listener.name });
		return onceListener;
	}
	setMaxListeners(maxListeners) {
		this.maxListeners = maxListeners;
		return this;
	}
	/**
	* Returns the current max listener value for the `Emitter` which is
	* either set by `emitter.setMaxListeners(n)` or defaults to
	* `Emitter.defaultMaxListeners`.
	*/
	getMaxListeners() {
		return this.maxListeners;
	}
	/**
	* Returns an array listing the events for which the emitter has registered listeners.
	* The values in the array will be strings or Symbols.
	*/
	eventNames() {
		return Array.from(this.events.keys());
	}
	/**
	* Synchronously calls each of the listeners registered for the event named `eventName`,
	* in the order they were registered, passing the supplied arguments to each.
	* Returns `true` if the event has listeners, `false` otherwise.
	*
	* @example
	* const emitter = new Emitter<{ hello: [string] }>()
	* emitter.emit('hello', 'John')
	*/
	emit(eventName, ...data) {
		const listeners = this._getListeners(eventName);
		listeners.forEach((listener) => {
			listener.apply(this, data);
		});
		return listeners.length > 0;
	}
	addListener(eventName, listener) {
		this._emitInternalEvent("newListener", eventName, listener);
		const nextListeners = this._getListeners(eventName).concat(listener);
		this.events.set(eventName, nextListeners);
		if (this.maxListeners > 0 && this.listenerCount(eventName) > this.maxListeners && !this.hasWarnedAboutPotentialMemoryLeak) {
			this.hasWarnedAboutPotentialMemoryLeak = true;
			const memoryLeakWarning = new MemoryLeakError(this, eventName, this.listenerCount(eventName));
			console.warn(memoryLeakWarning);
		}
		return this;
	}
	on(eventName, listener) {
		return this.addListener(eventName, listener);
	}
	once(eventName, listener) {
		return this.addListener(eventName, this._wrapOnceListener(eventName, listener));
	}
	prependListener(eventName, listener) {
		const listeners = this._getListeners(eventName);
		if (listeners.length > 0) {
			const nextListeners = [listener].concat(listeners);
			this.events.set(eventName, nextListeners);
		} else this.events.set(eventName, listeners.concat(listener));
		return this;
	}
	prependOnceListener(eventName, listener) {
		return this.prependListener(eventName, this._wrapOnceListener(eventName, listener));
	}
	removeListener(eventName, listener) {
		const listeners = this._getListeners(eventName);
		if (listeners.length > 0) {
			this._removeListener(listeners, listener);
			this.events.set(eventName, listeners);
			this._emitInternalEvent("removeListener", eventName, listener);
		}
		return this;
	}
	/**
	* Alias for `emitter.removeListener()`.
	*
	* @example
	* emitter.off('hello', listener)
	*/
	off(eventName, listener) {
		return this.removeListener(eventName, listener);
	}
	removeAllListeners(eventName) {
		if (eventName) this.events.delete(eventName);
		else this.events.clear();
		return this;
	}
	/**
	* Returns a copy of the array of listeners for the event named `eventName`.
	*/
	listeners(eventName) {
		return Array.from(this._getListeners(eventName));
	}
	/**
	* Returns the number of listeners listening to the event named `eventName`.
	*/
	listenerCount(eventName) {
		return this._getListeners(eventName).length;
	}
	rawListeners(eventName) {
		return this.listeners(eventName);
	}
};
var Emitter = _Emitter;
Emitter.defaultMaxListeners = 10;
var INTERNAL_REQUEST_ID_HEADER_NAME = "x-interceptors-internal-request-id";
function getGlobalSymbol(symbol) {
	return globalThis[symbol] || void 0;
}
function setGlobalSymbol(symbol, value) {
	globalThis[symbol] = value;
}
function deleteGlobalSymbol(symbol) {
	delete globalThis[symbol];
}
var InterceptorReadyState = /* @__PURE__ */ (function(InterceptorReadyState$1) {
	InterceptorReadyState$1["INACTIVE"] = "INACTIVE";
	InterceptorReadyState$1["APPLYING"] = "APPLYING";
	InterceptorReadyState$1["APPLIED"] = "APPLIED";
	InterceptorReadyState$1["DISPOSING"] = "DISPOSING";
	InterceptorReadyState$1["DISPOSED"] = "DISPOSED";
	return InterceptorReadyState$1;
})({});
var Interceptor = class {
	constructor(symbol) {
		this.symbol = symbol;
		this.readyState = InterceptorReadyState.INACTIVE;
		this.emitter = new Emitter();
		this.subscriptions = [];
		this.logger = new Logger(symbol.description);
		this.emitter.setMaxListeners(0);
		this.logger.info("constructing the interceptor...");
	}
	/**
	* Determine if this interceptor can be applied
	* in the current environment.
	*/
	checkEnvironment() {
		return true;
	}
	/**
	* Apply this interceptor to the current process.
	* Returns an already running interceptor instance if it's present.
	*/
	apply() {
		const logger = this.logger.extend("apply");
		logger.info("applying the interceptor...");
		if (this.readyState === InterceptorReadyState.APPLIED) {
			logger.info("intercepted already applied!");
			return;
		}
		if (!this.checkEnvironment()) {
			logger.info("the interceptor cannot be applied in this environment!");
			return;
		}
		this.readyState = InterceptorReadyState.APPLYING;
		const runningInstance = this.getInstance();
		if (runningInstance) {
			logger.info("found a running instance, reusing...");
			this.on = (event, listener) => {
				logger.info("proxying the \"%s\" listener", event);
				runningInstance.emitter.addListener(event, listener);
				this.subscriptions.push(() => {
					runningInstance.emitter.removeListener(event, listener);
					logger.info("removed proxied \"%s\" listener!", event);
				});
				return this;
			};
			this.readyState = InterceptorReadyState.APPLIED;
			return;
		}
		logger.info("no running instance found, setting up a new instance...");
		this.setup();
		this.setInstance();
		this.readyState = InterceptorReadyState.APPLIED;
	}
	/**
	* Setup the module augments and stubs necessary for this interceptor.
	* This method is not run if there's a running interceptor instance
	* to prevent instantiating an interceptor multiple times.
	*/
	setup() {}
	/**
	* Listen to the interceptor's public events.
	*/
	on(event, listener) {
		const logger = this.logger.extend("on");
		if (this.readyState === InterceptorReadyState.DISPOSING || this.readyState === InterceptorReadyState.DISPOSED) {
			logger.info("cannot listen to events, already disposed!");
			return this;
		}
		logger.info("adding \"%s\" event listener:", event, listener);
		this.emitter.on(event, listener);
		return this;
	}
	once(event, listener) {
		this.emitter.once(event, listener);
		return this;
	}
	off(event, listener) {
		this.emitter.off(event, listener);
		return this;
	}
	removeAllListeners(event) {
		this.emitter.removeAllListeners(event);
		return this;
	}
	/**
	* Disposes of any side-effects this interceptor has introduced.
	*/
	dispose() {
		const logger = this.logger.extend("dispose");
		if (this.readyState === InterceptorReadyState.DISPOSED) {
			logger.info("cannot dispose, already disposed!");
			return;
		}
		logger.info("disposing the interceptor...");
		this.readyState = InterceptorReadyState.DISPOSING;
		if (!this.getInstance()) {
			logger.info("no interceptors running, skipping dispose...");
			return;
		}
		this.clearInstance();
		logger.info("global symbol deleted:", getGlobalSymbol(this.symbol));
		if (this.subscriptions.length > 0) {
			logger.info("disposing of %d subscriptions...", this.subscriptions.length);
			for (const dispose of this.subscriptions) dispose();
			this.subscriptions = [];
			logger.info("disposed of all subscriptions!", this.subscriptions.length);
		}
		this.emitter.removeAllListeners();
		logger.info("destroyed the listener!");
		this.readyState = InterceptorReadyState.DISPOSED;
	}
	getInstance() {
		const instance = getGlobalSymbol(this.symbol);
		this.logger.info("retrieved global instance:", instance?.constructor?.name);
		return instance;
	}
	setInstance() {
		setGlobalSymbol(this.symbol, this);
		this.logger.info("set global instance!", this.symbol.description);
	}
	clearInstance() {
		deleteGlobalSymbol(this.symbol);
		this.logger.info("cleared global instance!", this.symbol.description);
	}
};
function createRequestId() {
	return Math.random().toString(16).slice(2);
}
function resolveWebSocketUrl(url) {
	if (typeof url === "string") return resolveWebSocketUrl(new URL(url, typeof location !== "undefined" ? location.href : void 0));
	if (url.protocol === "http:") url.protocol = "ws:";
	else if (url.protocol === "https:") url.protocol = "wss:";
	if (url.protocol !== "ws:" && url.protocol !== "wss:") throw new SyntaxError(`Failed to construct 'WebSocket': The URL's scheme must be either 'http', 'https', 'ws', or 'wss'. '${url.protocol}' is not allowed.`);
	if (url.hash !== "") throw new SyntaxError(`Failed to construct 'WebSocket': The URL contains a fragment identifier ('${url.hash}'). Fragment identifiers are not allowed in WebSocket URLs.`);
	return url.href;
}
async function emitAsync(emitter, eventName, ...data) {
	const listeners = emitter.listeners(eventName);
	if (listeners.length === 0) return;
	for (const listener of listeners) await listener.apply(emitter, data);
}
var PatchesRegistry = class {
	#replacements = /* @__PURE__ */ new Map();
	applyPatch(owner, key, getNextValue) {
		const ownerReplacements = this.#replacements.get(owner);
		invariant(!ownerReplacements?.has(key), `Failed to replace a global value at "${String(key)}": already replaced.`);
		const match = getDeepPropertyDescriptor(owner, key);
		if (typeof match === "undefined") {
			console.warn(`Failed to replace a global value at "${String(key)}": not a global value.`);
			return () => {};
		}
		if (match.descriptor.configurable) Object.defineProperty(owner, key, {
			value: getNextValue(owner[key]),
			enumerable: true,
			configurable: true
		});
		else if (match.descriptor.writable) owner[key] = getNextValue(owner[key]);
		else throw new Error(`Failed to patch a non-configurable non-writable property "${key.toString()}"`);
		const restorePatch = () => {
			const currentReplacements = this.#replacements.get(owner);
			if (!currentReplacements?.has(key)) return;
			if (match.owner === owner) Object.defineProperty(match.owner, key, match.descriptor);
			else Reflect.deleteProperty(owner, key);
			currentReplacements.delete(key);
			if (currentReplacements.size === 0) this.#replacements.delete(owner);
		};
		if (ownerReplacements) ownerReplacements.set(key, restorePatch);
		else this.#replacements.set(owner, /* @__PURE__ */ new Map([[key, restorePatch]]));
		return restorePatch;
	}
	restoreAllPatches() {
		const errors = [];
		for (const [, ownerReplacements] of this.#replacements) for (const [, restorePatch] of ownerReplacements) try {
			restorePatch();
		} catch (error2) {
			if (error2 instanceof Error) errors.push(error2);
			else throw error2;
		}
		if (errors.length > 0) throw new AggregateError(errors, "FOO!");
	}
};
var patchesRegistry = new PatchesRegistry();
function getDeepPropertyDescriptor(owner, key) {
	let currentOwner = owner;
	let descriptor;
	while (currentOwner) {
		descriptor = Object.getOwnPropertyDescriptor(currentOwner, key);
		if (descriptor) return {
			owner: currentOwner,
			descriptor
		};
		currentOwner = Object.getPrototypeOf(currentOwner);
	}
}
function hasConfigurableGlobal(propertyName) {
	const match = getDeepPropertyDescriptor(globalThis, propertyName);
	if (typeof match === "undefined") return false;
	const { descriptor } = match;
	if (typeof descriptor.get === "function" && typeof descriptor.get() === "undefined") return false;
	if (typeof descriptor.get === "undefined" && descriptor.value == null) return false;
	if (typeof descriptor.set === "undefined" && !descriptor.configurable) {
		console.error(`[MSW] Failed to apply interceptor: the global \`${propertyName}\` property is non-configurable. This is likely an issue with your environment. If you are using a framework, please open an issue about this in their repository.`);
		return false;
	}
	return true;
}
function createDeferredExecutor() {
	const executor = (resolve, reject) => {
		executor.state = "pending";
		executor.resolve = (data) => {
			if (executor.state !== "pending") return;
			executor.result = data;
			const onFulfilled = (value) => {
				executor.state = "fulfilled";
				return value;
			};
			return resolve(data instanceof Promise ? data : Promise.resolve(data).then(onFulfilled));
		};
		executor.reject = (reason) => {
			if (executor.state !== "pending") return;
			queueMicrotask(() => {
				executor.state = "rejected";
			});
			return reject(executor.rejectionReason = reason);
		};
	};
	return executor;
}
var DeferredPromise = class extends Promise {
	#executor;
	resolve;
	reject;
	constructor(executor = null) {
		const deferredExecutor = createDeferredExecutor();
		super((originalResolve, originalReject) => {
			deferredExecutor(originalResolve, originalReject);
			executor?.(deferredExecutor.resolve, deferredExecutor.reject);
		});
		this.#executor = deferredExecutor;
		this.resolve = this.#executor.resolve;
		this.reject = this.#executor.reject;
	}
	get state() {
		return this.#executor.state;
	}
	get rejectionReason() {
		return this.#executor.rejectionReason;
	}
	then(onFulfilled, onRejected) {
		return this.#decorate(super.then(onFulfilled, onRejected));
	}
	catch(onRejected) {
		return this.#decorate(super.catch(onRejected));
	}
	finally(onfinally) {
		return this.#decorate(super.finally(onfinally));
	}
	#decorate(promise) {
		return Object.defineProperties(promise, {
			resolve: {
				configurable: true,
				value: this.resolve
			},
			reject: {
				configurable: true,
				value: this.reject
			}
		});
	}
};
function bindEvent(target, event) {
	Object.defineProperties(event, {
		target: {
			value: target,
			enumerable: true,
			writable: true
		},
		currentTarget: {
			value: target,
			enumerable: true,
			writable: true
		}
	});
	return event;
}
var kCancelable = /* @__PURE__ */ Symbol("kCancelable");
var kDefaultPrevented = /* @__PURE__ */ Symbol("kDefaultPrevented");
var CancelableMessageEvent = class extends MessageEvent {
	constructor(type, init) {
		super(type, init);
		this[kCancelable] = !!init.cancelable;
		this[kDefaultPrevented] = false;
	}
	get cancelable() {
		return this[kCancelable];
	}
	set cancelable(nextCancelable) {
		this[kCancelable] = nextCancelable;
	}
	get defaultPrevented() {
		return this[kDefaultPrevented];
	}
	set defaultPrevented(nextDefaultPrevented) {
		this[kDefaultPrevented] = nextDefaultPrevented;
	}
	preventDefault() {
		if (this.cancelable && !this[kDefaultPrevented]) this[kDefaultPrevented] = true;
	}
};
var CloseEvent = class extends Event {
	constructor(type, init = {}) {
		super(type, init);
		this.code = init.code === void 0 ? 0 : init.code;
		this.reason = init.reason === void 0 ? "" : init.reason;
		this.wasClean = init.wasClean === void 0 ? false : init.wasClean;
	}
};
var CancelableCloseEvent = class extends CloseEvent {
	constructor(type, init = {}) {
		super(type, init);
		this[kCancelable] = !!init.cancelable;
		this[kDefaultPrevented] = false;
	}
	get cancelable() {
		return this[kCancelable];
	}
	set cancelable(nextCancelable) {
		this[kCancelable] = nextCancelable;
	}
	get defaultPrevented() {
		return this[kDefaultPrevented];
	}
	set defaultPrevented(nextDefaultPrevented) {
		this[kDefaultPrevented] = nextDefaultPrevented;
	}
	preventDefault() {
		if (this.cancelable && !this[kDefaultPrevented]) this[kDefaultPrevented] = true;
	}
};
var kEmitter$1 = /* @__PURE__ */ Symbol("kEmitter");
var kBoundListener$1 = /* @__PURE__ */ Symbol("kBoundListener");
var WebSocketClientConnection = class {
	constructor(socket, transport) {
		this.socket = socket;
		this.transport = transport;
		this.id = createRequestId();
		this.url = new URL(socket.url);
		this[kEmitter$1] = new EventTarget();
		this.transport.addEventListener("outgoing", (event) => {
			const message = bindEvent(this.socket, new CancelableMessageEvent("message", {
				data: event.data,
				origin: event.origin,
				cancelable: true
			}));
			this[kEmitter$1].dispatchEvent(message);
			if (message.defaultPrevented) event.preventDefault();
		});
		this.transport.addEventListener("close", (event) => {
			this[kEmitter$1].dispatchEvent(bindEvent(this.socket, new CloseEvent("close", event)));
		});
	}
	/**
	* Listen for the outgoing events from the connected WebSocket client.
	*/
	addEventListener(type, listener, options) {
		if (!Reflect.has(listener, kBoundListener$1)) {
			const boundListener = listener.bind(this.socket);
			Object.defineProperty(listener, kBoundListener$1, {
				value: boundListener,
				enumerable: false,
				configurable: false
			});
		}
		this[kEmitter$1].addEventListener(type, Reflect.get(listener, kBoundListener$1), options);
	}
	/**
	* Removes the listener for the given event.
	*/
	removeEventListener(event, listener, options) {
		this[kEmitter$1].removeEventListener(event, Reflect.get(listener, kBoundListener$1), options);
	}
	/**
	* Send data to the connected client.
	*/
	send(data) {
		this.transport.send(data);
	}
	/**
	* Close the WebSocket connection.
	* @param {number} code A status code (see https://www.rfc-editor.org/rfc/rfc6455#section-7.4.1).
	* @param {string} reason A custom connection close reason.
	*/
	close(code, reason) {
		this.transport.close(code, reason);
	}
};
var WEBSOCKET_CLOSE_CODE_RANGE_ERROR = "InvalidAccessError: close code out of user configurable range";
var kPassthroughPromise = /* @__PURE__ */ Symbol("kPassthroughPromise");
var kOnSend = /* @__PURE__ */ Symbol("kOnSend");
var kClose = /* @__PURE__ */ Symbol("kClose");
var WebSocketOverride = class extends EventTarget {
	static {
		this.CONNECTING = 0;
	}
	static {
		this.OPEN = 1;
	}
	static {
		this.CLOSING = 2;
	}
	static {
		this.CLOSED = 3;
	}
	constructor(url, protocols) {
		super();
		this.CONNECTING = 0;
		this.OPEN = 1;
		this.CLOSING = 2;
		this.CLOSED = 3;
		this._onopen = null;
		this._onmessage = null;
		this._onerror = null;
		this._onclose = null;
		this.url = resolveWebSocketUrl(url);
		this.protocol = "";
		this.extensions = "";
		this.binaryType = "blob";
		this.readyState = this.CONNECTING;
		this.bufferedAmount = 0;
		this[kPassthroughPromise] = new DeferredPromise();
		queueMicrotask(async () => {
			if (await this[kPassthroughPromise]) return;
			this.protocol = typeof protocols === "string" ? protocols : Array.isArray(protocols) && protocols.length > 0 ? protocols[0] : "";
			if (this.readyState === this.CONNECTING) {
				this.readyState = this.OPEN;
				this.dispatchEvent(bindEvent(this, new Event("open")));
			}
		});
	}
	set onopen(listener) {
		this.removeEventListener("open", this._onopen);
		this._onopen = listener;
		if (listener !== null) this.addEventListener("open", listener);
	}
	get onopen() {
		return this._onopen;
	}
	set onmessage(listener) {
		this.removeEventListener("message", this._onmessage);
		this._onmessage = listener;
		if (listener !== null) this.addEventListener("message", listener);
	}
	get onmessage() {
		return this._onmessage;
	}
	set onerror(listener) {
		this.removeEventListener("error", this._onerror);
		this._onerror = listener;
		if (listener !== null) this.addEventListener("error", listener);
	}
	get onerror() {
		return this._onerror;
	}
	set onclose(listener) {
		this.removeEventListener("close", this._onclose);
		this._onclose = listener;
		if (listener !== null) this.addEventListener("close", listener);
	}
	get onclose() {
		return this._onclose;
	}
	/**
	* @see https://websockets.spec.whatwg.org/#ref-for-dom-websocket-send%E2%91%A0
	*/
	send(data) {
		if (this.readyState === this.CONNECTING) {
			this.close();
			throw new DOMException("InvalidStateError");
		}
		if (this.readyState === this.CLOSING || this.readyState === this.CLOSED) return;
		this.bufferedAmount += getDataSize(data);
		queueMicrotask(() => {
			this.bufferedAmount = 0;
			this[kOnSend]?.(data);
		});
	}
	close(code = 1e3, reason) {
		invariant(code, WEBSOCKET_CLOSE_CODE_RANGE_ERROR);
		invariant(code === 1e3 || code >= 3e3 && code <= 4999, WEBSOCKET_CLOSE_CODE_RANGE_ERROR);
		this[kClose](code, reason);
	}
	[kClose](code = 1e3, reason, wasClean = true) {
		if (this.readyState === this.CLOSING || this.readyState === this.CLOSED) return;
		this.readyState = this.CLOSING;
		queueMicrotask(() => {
			this.readyState = this.CLOSED;
			this.dispatchEvent(bindEvent(this, new CloseEvent("close", {
				code,
				reason,
				wasClean
			})));
			this._onopen = null;
			this._onmessage = null;
			this._onerror = null;
			this._onclose = null;
		});
	}
	addEventListener(type, listener, options) {
		return super.addEventListener(type, listener, options);
	}
	removeEventListener(type, callback, options) {
		return super.removeEventListener(type, callback, options);
	}
};
function getDataSize(data) {
	if (typeof data === "string") return data.length;
	if (data instanceof Blob) return data.size;
	return data.byteLength;
}
var kEmitter = /* @__PURE__ */ Symbol("kEmitter");
var kBoundListener = /* @__PURE__ */ Symbol("kBoundListener");
var kSend = /* @__PURE__ */ Symbol("kSend");
var WebSocketServerConnection = class {
	constructor(client, transport, createConnection) {
		this.client = client;
		this.transport = transport;
		this.createConnection = createConnection;
		this[kEmitter] = new EventTarget();
		this.mockCloseController = new AbortController();
		this.realCloseController = new AbortController();
		this.transport.addEventListener("outgoing", (event) => {
			if (typeof this.realWebSocket === "undefined") return;
			queueMicrotask(() => {
				if (!event.defaultPrevented) this[kSend](event.data);
			});
		});
		this.transport.addEventListener("incoming", this.handleIncomingMessage.bind(this));
	}
	/**
	* The `WebSocket` instance connected to the original server.
	* Accessing this before calling `server.connect()` will throw.
	*/
	get socket() {
		invariant(this.realWebSocket, "Cannot access \"socket\" on the original WebSocket server object: the connection is not open. Did you forget to call `server.connect()`?");
		return this.realWebSocket;
	}
	/**
	* Open connection to the original WebSocket server.
	*/
	connect() {
		invariant(!this.realWebSocket || this.realWebSocket.readyState !== WebSocket.OPEN, "Failed to call \"connect()\" on the original WebSocket instance: the connection already open");
		const realWebSocket = this.createConnection();
		realWebSocket.binaryType = this.client.binaryType;
		realWebSocket.addEventListener("open", (event) => {
			this[kEmitter].dispatchEvent(bindEvent(this.realWebSocket, new Event("open", event)));
		}, { once: true });
		realWebSocket.addEventListener("message", (event) => {
			this.transport.dispatchEvent(bindEvent(this.realWebSocket, new MessageEvent("incoming", {
				data: event.data,
				origin: event.origin
			})));
		});
		this.client.addEventListener("close", (event) => {
			this.handleMockClose(event);
		}, { signal: this.mockCloseController.signal });
		realWebSocket.addEventListener("close", (event) => {
			this.handleRealClose(event);
		}, { signal: this.realCloseController.signal });
		realWebSocket.addEventListener("error", () => {
			const errorEvent = bindEvent(realWebSocket, new Event("error", { cancelable: true }));
			this[kEmitter].dispatchEvent(errorEvent);
			if (!errorEvent.defaultPrevented) this.client.dispatchEvent(bindEvent(this.client, new Event("error")));
		});
		this.realWebSocket = realWebSocket;
	}
	/**
	* Listen for the incoming events from the original WebSocket server.
	*/
	addEventListener(event, listener, options) {
		if (!Reflect.has(listener, kBoundListener)) {
			const boundListener = listener.bind(this.client);
			Object.defineProperty(listener, kBoundListener, {
				value: boundListener,
				enumerable: false
			});
		}
		this[kEmitter].addEventListener(event, Reflect.get(listener, kBoundListener), options);
	}
	/**
	* Remove the listener for the given event.
	*/
	removeEventListener(event, listener, options) {
		this[kEmitter].removeEventListener(event, Reflect.get(listener, kBoundListener), options);
	}
	/**
	* Send data to the original WebSocket server.
	* @example
	* server.send('hello')
	* server.send(new Blob(['hello']))
	* server.send(new TextEncoder().encode('hello'))
	*/
	send(data) {
		this[kSend](data);
	}
	[kSend](data) {
		const { realWebSocket } = this;
		invariant(realWebSocket, "Failed to call \"server.send()\" for \"%s\": the connection is not open. Did you forget to call \"server.connect()\"?", this.client.url);
		if (realWebSocket.readyState === WebSocket.CLOSING || realWebSocket.readyState === WebSocket.CLOSED) return;
		if (realWebSocket.readyState === WebSocket.CONNECTING) {
			realWebSocket.addEventListener("open", () => {
				realWebSocket.send(data);
			}, { once: true });
			return;
		}
		realWebSocket.send(data);
	}
	/**
	* Close the actual server connection.
	*/
	close() {
		const { realWebSocket } = this;
		invariant(realWebSocket, "Failed to close server connection for \"%s\": the connection is not open. Did you forget to call \"server.connect()\"?", this.client.url);
		this.realCloseController.abort();
		if (realWebSocket.readyState === WebSocket.CLOSING || realWebSocket.readyState === WebSocket.CLOSED) return;
		realWebSocket.close();
		queueMicrotask(() => {
			this[kEmitter].dispatchEvent(bindEvent(this.realWebSocket, new CancelableCloseEvent("close", {
				code: 1e3,
				cancelable: true
			})));
		});
	}
	handleIncomingMessage(event) {
		const messageEvent = bindEvent(event.target, new CancelableMessageEvent("message", {
			data: event.data,
			origin: event.origin,
			cancelable: true
		}));
		this[kEmitter].dispatchEvent(messageEvent);
		if (!messageEvent.defaultPrevented) this.client.dispatchEvent(bindEvent(
			/**
			* @note Bind the forwarded original server events
			* to the mock WebSocket instance so it would
			* dispatch them straight away.
			*/
			this.client,
			new MessageEvent("message", {
				data: event.data,
				origin: event.origin
			})
		));
	}
	handleMockClose(_event) {
		if (this.realWebSocket) this.realWebSocket.close();
	}
	handleRealClose(event) {
		this.mockCloseController.abort();
		const closeEvent = bindEvent(this.realWebSocket, new CancelableCloseEvent("close", {
			code: event.code,
			reason: event.reason,
			wasClean: event.wasClean,
			cancelable: true
		}));
		this[kEmitter].dispatchEvent(closeEvent);
		if (!closeEvent.defaultPrevented) this.client[kClose](event.code, event.reason);
	}
};
var WebSocketClassTransport = class extends EventTarget {
	constructor(socket) {
		super();
		this.socket = socket;
		this.socket.addEventListener("close", (event) => {
			this.dispatchEvent(bindEvent(this.socket, new CloseEvent("close", event)));
		});
		this.socket[kOnSend] = (data) => {
			this.dispatchEvent(bindEvent(this.socket, new CancelableMessageEvent("outgoing", {
				data,
				origin: this.socket.url,
				cancelable: true
			})));
		};
	}
	addEventListener(type, callback, options) {
		return super.addEventListener(type, callback, options);
	}
	dispatchEvent(event) {
		return super.dispatchEvent(event);
	}
	send(data) {
		queueMicrotask(() => {
			if (this.socket.readyState === this.socket.CLOSING || this.socket.readyState === this.socket.CLOSED) return;
			const dispatchEvent = () => {
				this.socket.dispatchEvent(bindEvent(
					/**
					* @note Setting this event's "target" to the
					* WebSocket override instance is important.
					* This way it can tell apart original incoming events
					* (must be forwarded to the transport) from the
					* mocked message events like the one below
					* (must be dispatched on the client instance).
					*/
					this.socket,
					new MessageEvent("message", {
						data,
						origin: this.socket.url
					})
				));
			};
			if (this.socket.readyState === this.socket.CONNECTING) this.socket.addEventListener("open", () => {
				dispatchEvent();
			}, { once: true });
			else dispatchEvent();
		});
	}
	close(code, reason) {
		this.socket[kClose](code, reason);
	}
};
var WebSocketInterceptor = class WebSocketInterceptor2 extends Interceptor {
	static {
		this.symbol = /* @__PURE__ */ Symbol.for("websocket-interceptor");
	}
	constructor() {
		super(WebSocketInterceptor2.symbol);
	}
	checkEnvironment() {
		return hasConfigurableGlobal("WebSocket");
	}
	setup() {
		const logger = this.logger.extend("setup");
		const WebSocketProxy = new Proxy(globalThis.WebSocket, { construct: (target, args, newTarget) => {
			const [url, protocols] = args;
			const createConnection = () => {
				return Reflect.construct(target, args, newTarget);
			};
			const socket = new WebSocketOverride(url, protocols);
			const transport = new WebSocketClassTransport(socket);
			queueMicrotask(async () => {
				try {
					const server = new WebSocketServerConnection(socket, transport, createConnection);
					const hasConnectionListeners = this.emitter.listenerCount("connection") > 0;
					await emitAsync(this.emitter, "connection", {
						client: new WebSocketClientConnection(socket, transport),
						server,
						info: { protocols }
					});
					if (hasConnectionListeners) socket[kPassthroughPromise].resolve(false);
					else {
						socket[kPassthroughPromise].resolve(true);
						server.connect();
						server.addEventListener("open", () => {
							socket.dispatchEvent(bindEvent(socket, new Event("open")));
							if (server["realWebSocket"]) socket.protocol = server["realWebSocket"].protocol;
						});
					}
				} catch (error2) {
					if (error2 instanceof Error) {
						socket.dispatchEvent(new Event("error"));
						if (socket.readyState !== WebSocket.CLOSING && socket.readyState !== WebSocket.CLOSED) socket[kClose](1011, error2.message, false);
						console.error(error2);
					}
				}
			});
			return socket;
		} });
		logger.info("patching global WebSocket...");
		this.subscriptions.push(patchesRegistry.applyPatch(globalThis, "WebSocket", () => WebSocketProxy));
		logger.info("global WebSocket patched!", globalThis.WebSocket.name);
	}
};
function supportsServiceWorker() {
	return typeof navigator !== "undefined" && "serviceWorker" in navigator && typeof location !== "undefined" && location.protocol !== "file:";
}
function supportsReadableStreamTransfer() {
	try {
		const stream = new ReadableStream({ start: (controller) => controller.close() });
		new MessageChannel().port1.postMessage(stream, [stream]);
		return true;
	} catch {
		return false;
	}
}
function createDeferredExecutor2() {
	const executor = ((resolve, reject) => {
		executor.state = "pending";
		executor.resolve = (data) => {
			if (executor.state !== "pending") return;
			executor.result = data;
			const onFulfilled = (value) => {
				executor.state = "fulfilled";
				return value;
			};
			return resolve(data instanceof Promise ? data : Promise.resolve(data).then(onFulfilled));
		};
		executor.reject = (reason) => {
			if (executor.state !== "pending") return;
			queueMicrotask(() => {
				executor.state = "rejected";
			});
			return reject(executor.rejectionReason = reason);
		};
	});
	return executor;
}
var DeferredPromise2 = class extends Promise {
	#executor;
	resolve;
	reject;
	constructor(executor = null) {
		const deferredExecutor = createDeferredExecutor2();
		super((originalResolve, originalReject) => {
			deferredExecutor(originalResolve, originalReject);
			executor?.(deferredExecutor.resolve, deferredExecutor.reject);
		});
		this.#executor = deferredExecutor;
		this.resolve = this.#executor.resolve;
		this.reject = this.#executor.reject;
	}
	get state() {
		return this.#executor.state;
	}
	get rejectionReason() {
		return this.#executor.rejectionReason;
	}
	then(onFulfilled, onRejected) {
		return this.#decorate(super.then(onFulfilled, onRejected));
	}
	catch(onRejected) {
		return this.#decorate(super.catch(onRejected));
	}
	finally(onfinally) {
		return this.#decorate(super.finally(onfinally));
	}
	#decorate(promise) {
		return Object.defineProperties(promise, {
			resolve: {
				configurable: true,
				value: this.resolve
			},
			reject: {
				configurable: true,
				value: this.reject
			}
		});
	}
};
var InterceptorError = class InterceptorError2 extends Error {
	constructor(message) {
		super(message);
		this.name = "InterceptorError";
		Object.setPrototypeOf(this, InterceptorError2.prototype);
	}
};
var RequestController = class RequestController2 {
	static {
		this.PENDING = 0;
	}
	static {
		this.PASSTHROUGH = 1;
	}
	static {
		this.RESPONSE = 2;
	}
	static {
		this.ERROR = 3;
	}
	constructor(request, source) {
		this.request = request;
		this.source = source;
		this.readyState = RequestController2.PENDING;
		this.handled = new DeferredPromise();
	}
	get #handled() {
		return this.handled;
	}
	/**
	* Perform this request as-is.
	*/
	async passthrough() {
		invariant.as(InterceptorError, this.readyState === RequestController2.PENDING, "Failed to passthrough the \"%s %s\" request: the request has already been handled", this.request.method, this.request.url);
		this.readyState = RequestController2.PASSTHROUGH;
		await this.source.passthrough();
		this.#handled.resolve();
	}
	/**
	* Respond to this request with the given `Response` instance.
	*
	* @example
	* controller.respondWith(new Response())
	* controller.respondWith(Response.json({ id }))
	* controller.respondWith(Response.error())
	*/
	respondWith(response) {
		invariant.as(InterceptorError, this.readyState === RequestController2.PENDING, "Failed to respond to the \"%s %s\" request with \"%d %s\": the request has already been handled (%d)", this.request.method, this.request.url, response.status, response.statusText || "OK", this.readyState);
		this.readyState = RequestController2.RESPONSE;
		this.#handled.resolve();
		this.source.respondWith(response);
	}
	/**
	* Error this request with the given reason.
	*
	* @example
	* controller.errorWith()
	* controller.errorWith(new Error('Oops!'))
	* controller.errorWith({ message: 'Oops!'})
	*/
	errorWith(reason) {
		invariant.as(InterceptorError, this.readyState === RequestController2.PENDING, "Failed to error the \"%s %s\" request with \"%s\": the request has already been handled (%d)", this.request.method, this.request.url, reason?.toString(), this.readyState);
		this.readyState = RequestController2.ERROR;
		this.source.errorWith(reason);
		this.#handled.resolve();
	}
};
function canParseUrl(url) {
	try {
		new URL(url);
		return true;
	} catch (_error) {
		return false;
	}
}
function getValueBySymbol(symbolName, source) {
	const symbol = Object.getOwnPropertySymbols(source).find((symbol$1) => {
		return symbol$1.description === symbolName;
	});
	if (symbol) return Reflect.get(source, symbol);
}
var FetchRequest = class FetchRequest2 extends Request {
	static #resolveProperty(input, init = {}, key) {
		return init[key] ?? (input instanceof Request ? input[key] : void 0);
	}
	/**
	* Check if the given request method is configurable.
	* @see https://fetch.spec.whatwg.org/#methods
	*/
	static isConfigurableMethod(method) {
		return method !== "CONNECT" && method !== "TRACE" && method !== "TRACK";
	}
	static isMethodWithBody(method) {
		return method !== "HEAD" && method !== "GET" && FetchRequest2.isConfigurableMethod(method);
	}
	/**
	* Check if the given request `mode` is configurable.
	* @see https://fetch.spec.whatwg.org/#concept-request-mode
	*/
	static isConfigurableMode(mode) {
		return mode !== "navigate" && mode !== "websocket" && mode !== "webtransport";
	}
	constructor(input, init) {
		const method = FetchRequest2.#resolveProperty(input, init, "method") || "GET";
		const safeMethod = FetchRequest2.isConfigurableMethod(method) ? method : "GET";
		const hasExplicitBody = init != null && "body" in init;
		const bodyInit = !FetchRequest2.isMethodWithBody(method) ? { body: void 0 } : hasExplicitBody ? { body: init.body } : {};
		const mode = FetchRequest2.#resolveProperty(input, init, "mode") ?? void 0;
		const safeMode = FetchRequest2.isConfigurableMode(mode) ? mode : void 0;
		super(input, {
			...init || {},
			method: safeMethod,
			mode: safeMode,
			duplex: init?.duplex ?? (FetchRequest2.isMethodWithBody(method) ? "half" : void 0),
			...bodyInit
		});
		if (method !== safeMethod) this.#setInternalProperty("method", method);
		if (method === "CONNECT") {
			const url = new URL(input instanceof Request ? input.url : input);
			let authority;
			if (url.protocol === "localhost:") authority = url.href;
			else authority = url.pathname.replace(/^\/+/, "");
			Object.defineProperty(this, "url", {
				get: () => authority,
				enumerable: true,
				configurable: true
			});
		}
		if (mode != null && mode !== safeMode) this.#setInternalProperty("mode", mode);
	}
	#setInternalProperty(key, value) {
		const internalState = getValueBySymbol("state", this);
		if (internalState) Reflect.set(internalState, key, value);
		else Object.defineProperty(this, key, {
			value,
			enumerable: true,
			configurable: true,
			writable: false
		});
	}
};
var kStatus = /* @__PURE__ */ Symbol("kStatus");
var kUrl = /* @__PURE__ */ Symbol("kUrl");
var FetchResponse = class FetchResponse2 extends Response {
	static {
		this.STATUS_CODES_WITHOUT_BODY = [
			101,
			103,
			204,
			205,
			304
		];
	}
	static {
		this.STATUS_CODES_WITH_REDIRECT = [
			301,
			302,
			303,
			307,
			308
		];
	}
	static isConfigurableStatusCode(status) {
		return status >= 200 && status <= 599;
	}
	static isRedirectResponse(status) {
		return FetchResponse2.STATUS_CODES_WITH_REDIRECT.includes(status);
	}
	/**
	* Returns a boolean indicating whether the given response status
	* code represents a response that can have a body.
	*/
	static isResponseWithBody(status) {
		return !FetchResponse2.STATUS_CODES_WITHOUT_BODY.includes(status);
	}
	static setStatus(status, response) {
		const internalState = getValueBySymbol("state", response);
		if (internalState) internalState.status = status;
		else Object.defineProperty(response, "status", {
			value: status,
			enumerable: true,
			configurable: true,
			writable: false
		});
		Object.defineProperty(response, kStatus, {
			value: status,
			enumerable: false
		});
	}
	static setUrl(url, response) {
		if (!url || url === "about:" || !canParseUrl(url)) return;
		const state = getValueBySymbol("state", response);
		if (state) state.urlList.push(new URL(url));
		else Object.defineProperty(response, "url", {
			value: url,
			enumerable: true,
			configurable: true,
			writable: false
		});
		Object.defineProperty(response, kUrl, {
			value: url,
			enumerable: false
		});
	}
	/**
	* Parses the given raw HTTP headers into a Fetch API `Headers` instance.
	*/
	static parseRawHeaders(rawHeaders) {
		const headers = new Headers();
		for (let line = 0; line < rawHeaders.length; line += 2) headers.append(rawHeaders[line], rawHeaders[line + 1]);
		return headers;
	}
	/**
	* Safely clones the given `Response`.
	* Coerces response clone exceptions into 500 mocked responses.
	* Handy in the environments that introduce arbitrary response
	* cloning restrictions, like "101 Switching Protocols" cloning
	* in "miniflare".
	*/
	static clone(response) {
		try {
			return response.clone();
		} catch (error2) {
			return Response.json(error2 instanceof Error ? {
				name: error2.name,
				message: error2.message,
				stack: error2.stack
			} : {}, {
				status: 500,
				statusText: "Unclonable Response"
			});
		}
	}
	constructor(body, init = {}) {
		const status = init.status ?? 200;
		const safeStatus = FetchResponse2.isConfigurableStatusCode(status) ? status : 200;
		const finalBody = FetchResponse2.isResponseWithBody(status) ? body : null;
		super(finalBody, {
			status: safeStatus,
			statusText: init.statusText,
			headers: init.headers
		});
		if (status !== safeStatus) FetchResponse2.setStatus(status, this);
		FetchResponse2.setUrl(init.url, this);
	}
	clone() {
		const clonedResponse = super.clone();
		const customStatus = Reflect.get(this, kStatus);
		if (customStatus) FetchResponse2.setStatus(customStatus, clonedResponse);
		const customUrl = Reflect.get(this, kUrl);
		if (customUrl) FetchResponse2.setUrl(customUrl, clonedResponse);
		return clonedResponse;
	}
};
var kRawRequest = /* @__PURE__ */ Symbol("kRawRequest");
function setRawRequest(request, rawRequest) {
	Reflect.set(request, kRawRequest, rawRequest);
}
var encoder = new TextEncoder();
function encodeBuffer(text) {
	return encoder.encode(text);
}
function decodeBuffer(buffer, encoding) {
	return new TextDecoder(encoding).decode(buffer);
}
function toArrayBuffer(array) {
	return array.buffer.slice(array.byteOffset, array.byteOffset + array.byteLength);
}
async function until(callback) {
	try {
		return [null, await callback().catch((error2) => {
			throw error2;
		})];
	} catch (error2) {
		return [error2, null];
	}
}
function getAbsoluteWorkerUrl(workerUrl) {
	return new URL(workerUrl, location.href).href;
}
function getWorkerByRegistration(registration, absoluteWorkerUrl, findWorker) {
	return [
		registration.active,
		registration.installing,
		registration.waiting
	].filter((state) => {
		return state != null;
	}).find((worker2) => {
		return findWorker(worker2.scriptURL, absoluteWorkerUrl);
	}) || null;
}
var getWorkerInstance = async (url, options = {}, findWorker) => {
	const absoluteWorkerUrl = getAbsoluteWorkerUrl(url);
	const mockRegistrations = await navigator.serviceWorker.getRegistrations().then((registrations) => registrations.filter((registration) => getWorkerByRegistration(registration, absoluteWorkerUrl, findWorker)));
	if (!navigator.serviceWorker.controller && mockRegistrations.length > 0) location.reload();
	const [existingRegistration] = mockRegistrations;
	if (existingRegistration) {
		existingRegistration.update();
		return [getWorkerByRegistration(existingRegistration, absoluteWorkerUrl, findWorker), existingRegistration];
	}
	const [registrationError, registrationResult] = await until(async () => {
		const registration = await navigator.serviceWorker.register(url, options);
		return [getWorkerByRegistration(registration, absoluteWorkerUrl, findWorker), registration];
	});
	if (registrationError) {
		if (registrationError.message.includes("(404)")) {
			const scopeUrl = new URL(options?.scope || "/", location.href);
			throw new Error(devUtils.formatMessage(`Failed to register a Service Worker for scope ('${scopeUrl.href}') with script ('${absoluteWorkerUrl}'): Service Worker script does not exist at the given path.

Did you forget to run "npx msw init <PUBLIC_DIR>"?

Learn more about creating the Service Worker script: https://mswjs.io/docs/cli/init`));
		}
		throw new Error(devUtils.formatMessage("Failed to register the Service Worker:\n\n%s", registrationError.message));
	}
	return registrationResult;
};
var LensList = class {
	#list;
	#lens;
	constructor() {
		this.#list = [];
		this.#lens = /* @__PURE__ */ new Map();
	}
	get [Symbol.iterator]() {
		return this.#list[Symbol.iterator].bind(this.#list);
	}
	entries() {
		return this.#lens.entries();
	}
	/**
	* Return an order-sensitive list of values by the given key.
	*/
	get(key) {
		return this.#lens.get(key) || [];
	}
	/**
	* Return an order-sensitive list of all values.
	*/
	getAll() {
		return this.#list.map(([, value]) => value);
	}
	/**
	* Append a new value to the given key.
	*/
	append(key, value) {
		this.#list.push([key, value]);
		this.#openLens(key, (list) => list.push(value));
	}
	/**
	* Prepend a new value to the given key.
	*/
	prepend(key, value) {
		this.#list.unshift([key, value]);
		this.#openLens(key, (list) => list.unshift(value));
	}
	/**
	* Delete the value belonging to the given key.
	* Returns `true` if the value was present and removed, `false` otherwise.
	*/
	delete(key, value) {
		if (this.size === 0) return false;
		const values = this.#lens.get(key);
		if (!values) return false;
		const index = values.indexOf(value);
		if (index === -1) return false;
		values.splice(index, 1);
		this.#list.splice(this.#list.findIndex((item) => item[0] === key && item[1] === value), 1);
		return true;
	}
	/**
	* Delete all values belogning to the given key.
	*/
	deleteAll(key) {
		if (this.size === 0) return;
		this.#list = this.#list.filter((item) => item[0] !== key);
		this.#lens.delete(key);
	}
	get size() {
		return this.#list.length;
	}
	clear() {
		if (this.size === 0) return;
		this.#list.length = 0;
		this.#lens.clear();
	}
	#openLens(key, setter) {
		setter(this.#lens.get(key) || this.#lens.set(key, []).get(key));
	}
};
var kDefaultPrevented2 = /* @__PURE__ */ Symbol("kDefaultPrevented");
var kPropagationStopped = /* @__PURE__ */ Symbol("kPropagationStopped");
var kImmediatePropagationStopped = /* @__PURE__ */ Symbol("kImmediatePropagationStopped");
var TypedEvent = class extends MessageEvent {
	/**
	* @note Keep a placeholder property with the return type
	* because the type must be set somewhere in order to be
	* correctly associated and inferred from the event.
	*/
	#returnType;
	[kDefaultPrevented2];
	[kPropagationStopped];
	[kImmediatePropagationStopped];
	constructor(...args) {
		super(args[0], args[1]);
		this[kDefaultPrevented2] = false;
	}
	get defaultPrevented() {
		return this[kDefaultPrevented2];
	}
	preventDefault() {
		super.preventDefault();
		this[kDefaultPrevented2] = true;
	}
	stopImmediatePropagation() {
		super.stopImmediatePropagation();
		this[kImmediatePropagationStopped] = true;
	}
};
var Emitter2 = class {
	#listeners;
	#listenerOptions;
	#listenerAbortCleanups;
	#typelessListeners;
	#hookListeners;
	#hookListenerOptions;
	#hookListenerAbortCleanups;
	hooks;
	constructor() {
		this.#listeners = new LensList();
		this.#listenerOptions = /* @__PURE__ */ new WeakMap();
		this.#listenerAbortCleanups = /* @__PURE__ */ new WeakMap();
		this.#typelessListeners = /* @__PURE__ */ new WeakSet();
		this.#hookListeners = new LensList();
		this.#hookListenerOptions = /* @__PURE__ */ new WeakMap();
		this.#hookListenerAbortCleanups = /* @__PURE__ */ new WeakMap();
		this.hooks = {
			on: (hook, callback, options) => {
				if (options?.signal?.aborted) return;
				if (options?.once) {
					const original = callback;
					const wrapper = ((...args) => {
						this.#deleteHookListener(hook, wrapper);
						return original(...args);
					});
					callback = wrapper;
				}
				this.#hookListeners.append(hook, callback);
				if (options) this.#hookListenerOptions.set(callback, options);
				if (options?.signal) {
					const { signal } = options;
					const onAbort = () => {
						this.#deleteHookListener(hook, callback);
					};
					signal.addEventListener("abort", onAbort, { once: true });
					this.#hookListenerAbortCleanups.set(callback, () => {
						signal.removeEventListener("abort", onAbort);
					});
				}
			},
			removeListener: (hook, callback) => {
				this.#deleteHookListener(hook, callback);
			}
		};
	}
	#deleteHookListener(hook, callback) {
		this.#hookListeners.delete(hook, callback);
		const cleanup = this.#hookListenerAbortCleanups.get(callback);
		if (cleanup) {
			cleanup();
			this.#hookListenerAbortCleanups.delete(callback);
		}
	}
	#deleteListener(type, listener) {
		const removed = this.#listeners.delete(type, listener);
		const cleanup = this.#listenerAbortCleanups.get(listener);
		if (cleanup) {
			cleanup();
			this.#listenerAbortCleanups.delete(listener);
		}
		return removed;
	}
	/**
	* Adds a listener for the given event type.
	*/
	on(type, listener, options) {
		this.#addListener(type, listener, options);
		return this;
	}
	/**
	* Adds a one-time listener for the given event type.
	*/
	once(type, listener, options) {
		return this.on(type, listener, {
			...options || {},
			once: true
		});
	}
	/**
	* Prepends a listener for the given event type.
	*/
	earlyOn(type, listener, options) {
		this.#addListener(type, listener, options, "prepend");
		return this;
	}
	/**
	* Prepends a one-time listener for the given event type.
	*/
	earlyOnce(type, listener, options) {
		return this.earlyOn(type, listener, {
			...options || {},
			once: true
		});
	}
	/**
	* Emits the given typed event.
	*
	* @returns {boolean} Returns `true` if the event had any listeners, `false` otherwise.
	*/
	emit(event) {
		if (this.#listeners.size === 0) return false;
		const hasListeners = this.listenerCount(event.type) > 0;
		const proxiedEvent = this.#proxyEvent(event);
		for (const listener of this.#matchListeners(event.type)) {
			if (proxiedEvent.event[kPropagationStopped] != null && proxiedEvent.event[kPropagationStopped] !== this) {
				proxiedEvent.revoke();
				return false;
			}
			if (proxiedEvent.event[kImmediatePropagationStopped]) break;
			this.#callListener(proxiedEvent.event, listener);
		}
		proxiedEvent.revoke();
		return hasListeners;
	}
	/**
	* Emits the given typed event and returns a promise that resolves
	* when all the listeners for that event have settled.
	*
	* @returns {Promise<Array<Emitter.ListenerReturnType>>} A promise that resolves
	* with the return values of all listeners.
	*/
	async emitAsPromise(event) {
		if (this.#listeners.size === 0) return [];
		const pendingListeners = [];
		const proxiedEvent = this.#proxyEvent(event);
		for (const listener of this.#matchListeners(event.type)) {
			if (proxiedEvent.event[kPropagationStopped] != null && proxiedEvent.event[kPropagationStopped] !== this) {
				proxiedEvent.revoke();
				return [];
			}
			if (proxiedEvent.event[kImmediatePropagationStopped]) break;
			const returnValue = await Promise.resolve(this.#callListener(proxiedEvent.event, listener));
			if (!this.#isTypelessListener(listener)) pendingListeners.push(returnValue);
		}
		proxiedEvent.revoke();
		return Promise.allSettled(pendingListeners).then((results) => {
			return results.map((result) => result.status === "fulfilled" ? result.value : result.reason);
		});
	}
	/**
	* Emits the given event and returns a generator that yields
	* the result of each listener in the order of their registration.
	* This way, you stop exhausting the listeners once you get the expected value.
	*/
	*emitAsGenerator(event) {
		if (this.#listeners.size === 0) return;
		const proxiedEvent = this.#proxyEvent(event);
		for (const listener of this.#matchListeners(event.type)) {
			if (proxiedEvent.event[kPropagationStopped] != null && proxiedEvent.event[kPropagationStopped] !== this) {
				proxiedEvent.revoke();
				return;
			}
			if (proxiedEvent.event[kImmediatePropagationStopped]) break;
			const returnValue = this.#callListener(proxiedEvent.event, listener);
			if (!this.#isTypelessListener(listener)) yield returnValue;
		}
		proxiedEvent.revoke();
	}
	/**
	* Removes a listener for the given event type.
	*/
	removeListener(type, listener) {
		const options = this.#listenerOptions.get(listener);
		if (!this.#deleteListener(type, listener)) return;
		for (const hook of this.#hookListeners.get("removeListener").slice()) hook(type, listener, options);
	}
	/**
	* Removes all listeners for the given event type.
	* If no event type is provided, removes all existing listeners.
	*/
	removeAllListeners(type) {
		if (type == null) {
			for (const [listenerType, listeners$1] of this.#listeners.entries()) while (listeners$1.length > 0) this.removeListener(listenerType, listeners$1[0]);
			for (const [hookType, hookListener] of [...this.#hookListeners]) if (!this.#hookListenerOptions.get(hookListener)?.persist) this.#deleteHookListener(hookType, hookListener);
			return;
		}
		const listeners = this.listeners(type);
		while (listeners.length > 0) this.removeListener(type, listeners[0]);
	}
	/**
	* Returns the list of listeners for the given event type.
	* If no even type is provided, returns all listeners.
	*/
	listeners(type) {
		if (type == null) return this.#listeners.getAll();
		return this.#listeners.get(type);
	}
	/**
	* Returns the number of listeners for the given event type.
	* If no even type is provided, returns the total number of listeners.
	*/
	listenerCount(type) {
		if (type == null) return this.#listeners.size;
		return this.listeners(type).length;
	}
	#addListener(type, listener, options, insertMode = "append") {
		if (options?.signal?.aborted) return;
		for (const hook of this.#hookListeners.get("newListener").slice()) hook(type, listener, options);
		if (type === "*") this.#typelessListeners.add(listener);
		if (insertMode === "prepend") this.#listeners.prepend(type, listener);
		else this.#listeners.append(type, listener);
		if (options) {
			this.#listenerOptions.set(listener, options);
			if (options.signal) {
				const { signal } = options;
				const onAbort = () => {
					this.removeListener(type, listener);
				};
				signal.addEventListener("abort", onAbort, { once: true });
				this.#listenerAbortCleanups.set(listener, () => {
					signal.removeEventListener("abort", onAbort);
				});
			}
		}
	}
	#proxyEvent(event) {
		const { stopPropagation } = event;
		event.stopPropagation = () => {
			event[kPropagationStopped] = this;
			stopPropagation.call(event);
		};
		return {
			event,
			revoke() {
				event.stopPropagation = stopPropagation;
			}
		};
	}
	#callListener(event, listener) {
		for (const hook of this.#hookListeners.get("beforeEmit").slice()) if (hook(event) === false) return;
		const returnValue = listener.call(this, event);
		const options = this.#listenerOptions.get(listener);
		if (options?.once) {
			const type = this.#isTypelessListener(listener) ? "*" : event.type;
			if (this.#deleteListener(type, listener)) for (const hook of this.#hookListeners.get("removeListener").slice()) hook(type, listener, options);
		}
		return returnValue;
	}
	/**
	* Return a list of all event listeners relevant for the given event type.
	* This includes the explicit event listeners and also typeless event listeners.
	*
	* @note Snapshot the matching listeners before yielding. Listeners can add or
	* remove other listeners during emission (e.g. `earlyOn` unshifts `#list`),
	* which would otherwise shift the live iterator and re-yield prior entries.
	*/
	*#matchListeners(type) {
		const snapshot = [];
		for (const [key, listener] of this.#listeners) if (key === "*" || key === type) snapshot.push(listener);
		yield* snapshot;
	}
	#isTypelessListener(listener) {
		return this.#typelessListeners.has(listener);
	}
};
var SUPPORTS_SERVICE_WORKER = supportsServiceWorker();
var WorkerEvent = class extends TypedEvent {
	#workerEvent;
	constructor(workerEvent) {
		const type = workerEvent.data.type;
		const data = workerEvent.data.payload;
		super(type, { data });
		this.#workerEvent = workerEvent;
	}
	get ports() {
		return this.#workerEvent.ports;
	}
	/**
	* Reply directly to this event using its `MessagePort`.
	*/
	postMessage(type, ...rest) {
		this.#workerEvent.ports[0].postMessage({
			type,
			data: rest[0]
		}, { transfer: rest[1] });
	}
};
var WorkerChannel = class extends Emitter2 {
	#getWorker;
	#controller;
	constructor(options) {
		super();
		invariant(SUPPORTS_SERVICE_WORKER, "Failed to open a WorkerChannel: Service Worker is not supported in this environment.");
		this.#getWorker = options.getWorker;
		this.#controller = new AbortController();
		navigator.serviceWorker.addEventListener("message", async (event) => {
			const worker = await this.#getWorker();
			if (event.source != null && event.source !== worker) return;
			if (event.data && isObject(event.data) && "type" in event.data) this.emit(new WorkerEvent(event));
		}, { signal: this.#controller.signal });
	}
	/**
	* Send data to the Service Worker controlling this client.
	* This triggers the `message` event listener on ServiceWorkerGlobalScope.
	*/
	postMessage(type) {
		invariant(SUPPORTS_SERVICE_WORKER, "Failed to post message on a WorkerChannel: the Service Worker API is unavailable in this environment. This is likely an issue with MSW. Please report it on GitHub: https://github.com/mswjs/msw/issues");
		this.#getWorker().then((worker) => {
			worker.postMessage(type);
		});
	}
	/**
	* Terminal teardown. Removes the `navigator.serviceWorker` message listener
	* and all emitter subscriptions. The channel is not usable afterwards.
	*/
	terminate() {
		this.#controller.abort();
		this.removeAllListeners();
	}
};
function pruneGetRequestBody(request) {
	if (["HEAD", "GET"].includes(request.method)) return;
	return request.body;
}
function deserializeRequest(serializedRequest) {
	return new Request(serializedRequest.url, {
		...serializedRequest,
		body: pruneGetRequestBody(serializedRequest)
	});
}
function validateWorkerScope(registration) {
	if (!location.href.startsWith(registration.scope)) devUtils.warn(`Cannot intercept requests on this page because it's outside of the worker's scope ("${registration.scope}"). If you wish to mock API requests on this page, you must resolve this scope issue.

- (Recommended) Register the worker at the root level ("/") of your application.
- Set the "Service-Worker-Allowed" response header to allow out-of-scope workers.`);
}
function shouldInvalidateWorker(prevOptions, nextOptions) {
	return prevOptions.findWorker !== nextOptions.findWorker || prevOptions.serviceWorker.url !== nextOptions.serviceWorker.url || JSON.stringify(prevOptions.serviceWorker.options) !== JSON.stringify(nextOptions.serviceWorker.options);
}
var ServiceWorkerSource = class _ServiceWorkerSource extends NetworkSource {
	static #current;
	/**
	* Create a new Service Worker source or reuse an existing one.
	* These sources act as a singleton and only get recreated if the options change.
	*/
	static async from(options) {
		if (_ServiceWorkerSource.#current == null) _ServiceWorkerSource.#current = new _ServiceWorkerSource(options);
		else if (shouldInvalidateWorker(_ServiceWorkerSource.#current.#options, options)) {
			await _ServiceWorkerSource.#current.terminate();
			_ServiceWorkerSource.#current = new _ServiceWorkerSource(options);
		}
		return _ServiceWorkerSource.#current;
	}
	#options;
	#frames;
	#channel;
	#listenerController;
	#clientPromise;
	#keepAliveInterval;
	#stoppedAt;
	workerPromise;
	constructor(options) {
		super();
		invariant(supportsServiceWorker(), "Failed to use Service Worker as the network source: the Service Worker API is not supported in this environment");
		this.#options = options;
		this.#frames = /* @__PURE__ */ new Map();
		this.workerPromise = new DeferredPromise2();
		this.#channel = new WorkerChannel({ getWorker: () => this.workerPromise.then(([worker]) => worker) });
	}
	async enable() {
		if (this.workerPromise.state === "fulfilled" && typeof this.#stoppedAt == "undefined") {
			devUtils.warn("Found a redundant \"worker.start()\" call. Note that starting the worker while mocking is already enabled will have no effect. Consider removing this \"worker.start()\" call.");
			return this.workerPromise.then(([, registration2]) => registration2);
		}
		this.#stoppedAt = void 0;
		this.#channel.removeAllListeners();
		this.#frames.clear();
		this.#listenerController = new AbortController();
		const [worker, registration] = await this.#startWorker();
		if (worker.state !== "activated") {
			const controller = new AbortController();
			const activationPromise = new DeferredPromise2();
			activationPromise.then(() => controller.abort());
			worker.addEventListener("statechange", () => {
				if (worker.state === "activated") activationPromise.resolve();
			}, { signal: controller.signal });
			await activationPromise;
		}
		this.#channel.postMessage("MOCK_ACTIVATE");
		const clientConfirmationPromise = new DeferredPromise2();
		this.#clientPromise = clientConfirmationPromise;
		this.#channel.once("MOCKING_ENABLED", (event) => {
			clientConfirmationPromise.resolve(event.data.client);
		});
		await clientConfirmationPromise;
		if (!this.#options.quiet) this.#printStartMessage();
		return registration;
	}
	disable() {
		if (typeof this.#stoppedAt !== "undefined") {
			devUtils.warn(`Found a redundant "worker.stop()" call. Notice that stopping the worker after it has already been stopped has no effect. Consider removing this "worker.stop()" call.`);
			return;
		}
		this.#stoppedAt = Date.now();
		this.#listenerController?.abort();
		this.#listenerController = void 0;
		this.#channel.postMessage("CLIENT_CLOSED");
		if (!this.#options.quiet) this.#printStopMessage();
	}
	/**
	* Terminal teardown. Unregisters the Service Worker, tears down the channel,
	* and clears timers. Called when the singleton is being replaced with one
	* that has different options. The instance is not usable afterwards.
	*/
	async terminate() {
		if (this.#keepAliveInterval != null) {
			clearInterval(this.#keepAliveInterval);
			this.#keepAliveInterval = void 0;
		}
		this.#frames.clear();
		this.#channel.terminate();
		this.#listenerController?.abort();
		this.#listenerController = void 0;
		if (this.workerPromise.state === "fulfilled") {
			const [, registration] = await this.workerPromise;
			await registration.unregister();
		}
		if (_ServiceWorkerSource.#current === this) _ServiceWorkerSource.#current = void 0;
	}
	async #startWorker() {
		if (this.#keepAliveInterval) clearInterval(this.#keepAliveInterval);
		const workerUrl = this.#options.serviceWorker.url;
		const [worker, registration] = await getWorkerInstance(workerUrl, this.#options.serviceWorker.options, this.#options.findWorker || this.#defaultFindWorker);
		if (worker == null) {
			const missingWorkerMessage = this.#options?.findWorker ? devUtils.formatMessage(`Failed to locate the Service Worker registration using a custom "findWorker" predicate.

Please ensure that the custom predicate properly locates the Service Worker registration at "%s".
More details: https://mswjs.io/docs/api/setup-worker/start#findworker
     `, workerUrl) : devUtils.formatMessage(`Failed to locate the Service Worker registration.

This most likely means that the worker script URL "%s" cannot resolve against the actual public hostname (%s). This may happen if your application runs behind a proxy, or has a dynamic hostname.

Please consider using a custom "serviceWorker.url" option to point to the actual worker script location, or a custom "findWorker" option to resolve the Service Worker registration manually. More details: https://mswjs.io/docs/api/setup-worker/start`, workerUrl, location.host);
			throw new Error(missingWorkerMessage);
		}
		if (this.workerPromise.state === "pending") this.workerPromise.resolve([worker, registration]);
		else this.workerPromise = new DeferredPromise2((resolve) => {
			resolve([worker, registration]);
		});
		this.#channel.on("REQUEST", this.#handleRequest.bind(this));
		this.#channel.on("RESPONSE", this.#handleResponse.bind(this));
		window.addEventListener("beforeunload", () => {
			if (worker.state !== "redundant") this.#channel.postMessage("CLIENT_CLOSED");
			clearInterval(this.#keepAliveInterval);
			window.postMessage({ type: "msw/worker:stop" });
		}, { signal: this.#listenerController?.signal });
		await this.#checkWorkerIntegrity().catch((error2) => {
			devUtils.error("Error while checking the worker script integrity. Please report this on GitHub (https://github.com/mswjs/msw/issues) and include the original error below.");
			console.error(error2);
		});
		this.#keepAliveInterval = window.setInterval(() => {
			this.#channel.postMessage("KEEPALIVE_REQUEST");
		}, 5e3);
		if (!this.#options.quiet) validateWorkerScope(registration);
		return [worker, registration];
	}
	async #handleRequest(event) {
		if (this.#stoppedAt && event.data.interceptedAt > this.#stoppedAt) return event.postMessage("PASSTHROUGH");
		const request = deserializeRequest(event.data);
		RequestHandler.cache.set(request, request.clone());
		const frame = new ServiceWorkerHttpNetworkFrame({
			event,
			request
		});
		this.#frames.set(event.data.id, frame);
		await this.queue(frame);
	}
	async #handleResponse(event) {
		const { request, response, isMockedResponse } = event.data;
		const frame = this.#frames.get(request.id);
		if (response.type?.includes("opaque")) {
			this.#frames.delete(request.id);
			frame?.events.removeAllListeners();
			return;
		}
		this.#frames.delete(request.id);
		if (frame == null) return;
		const fetchRequest = deserializeRequest(request);
		const fetchResponse = response.status === 0 ? Response.error() : new FetchResponse(
			/**
			* Responses may be streams here, but when we create a response object
			* with null-body status codes, like 204, 205, 304 Response will
			* throw when passed a non-null body, so ensure it's null here
			* for those codes
			*/
			FetchResponse.isResponseWithBody(response.status) ? response.body : null,
			{
				...response,
				/**
				* Set response URL if it's not set already.
				* @see https://github.com/mswjs/msw/issues/2030
				* @see https://developer.mozilla.org/en-US/docs/Web/API/Response/url
				*/
				url: request.url
			}
		);
		try {
			frame.events.emit(new ResponseEvent(isMockedResponse ? "response:mocked" : "response:bypass", {
				requestId: frame.data.id,
				request: fetchRequest,
				response: fetchResponse,
				isMockedResponse
			}));
		} finally {
			frame.events.removeAllListeners();
		}
	}
	#defaultFindWorker = (workerUrl, mockServiceWorkerUrl) => {
		return workerUrl === mockServiceWorkerUrl;
	};
	async #checkWorkerIntegrity() {
		const integrityCheckPromise = new DeferredPromise2();
		this.#channel.postMessage("INTEGRITY_CHECK_REQUEST");
		this.#channel.once("INTEGRITY_CHECK_RESPONSE", (event) => {
			const { checksum, packageVersion } = event.data;
			if (checksum !== "03cb67ac84128e63d7cd722a6e5b7f1e") devUtils.warn(`The currently registered Service Worker has been generated by a different version of MSW (${packageVersion}) and may not be fully compatible with the installed version.

It's recommended you update your worker script by running this command:

  \u2022 npx msw init <PUBLIC_DIR>

You can also automate this process and make the worker script update automatically upon the library installations. Read more: https://mswjs.io/docs/cli/init.`);
			integrityCheckPromise.resolve();
		});
		return integrityCheckPromise;
	}
	async #printStartMessage() {
		if (this.workerPromise.state === "rejected") return;
		invariant(this.#clientPromise != null, "[ServiceWorkerSource] Failed to print a start message: client confirmation not received");
		const client = await this.#clientPromise;
		const [worker, registration] = await this.workerPromise;
		console.groupCollapsed(`%c${devUtils.formatMessage("Mocking enabled.")}`, "color:orangered;font-weight:bold;");
		console.log("%cDocumentation: %chttps://mswjs.io/docs", "font-weight:bold", "font-weight:normal");
		console.log("Found an issue? https://github.com/mswjs/msw/issues");
		console.log("Worker script URL:", worker.scriptURL);
		console.log("Worker scope:", registration.scope);
		if (client) console.log("Client ID: %s (%s)", client.id, client.frameType);
		console.groupEnd();
	}
	#printStopMessage() {
		console.log(`%c${devUtils.formatMessage("Mocking disabled.")}`, "color:orangered;font-weight:bold;");
	}
};
var ServiceWorkerHttpNetworkFrame = class extends HttpNetworkFrame {
	#event;
	constructor(options) {
		super({ request: options.request });
		this.#event = options.event;
	}
	passthrough() {
		this.#event.postMessage("PASSTHROUGH");
	}
	respondWith(response) {
		if (response) this.#respondWith(response);
	}
	errorWith(reason) {
		if (reason instanceof Response) return this.respondWith(reason);
		devUtils.warn(`Uncaught exception in the request handler for "%s %s". This exception has been gracefully handled as a 500 response, however, it's strongly recommended to resolve this error, as it indicates a mistake in your code. If you wish to mock an error response, please see this guide: https://mswjs.io/docs/http/mocking-responses/error-responses`, this.data.request.method, this.data.request.url);
		const error2 = reason instanceof Error ? reason : new Error(reason?.toString() || "Request failure");
		this.respondWith(HttpResponse.json({
			name: error2.name,
			message: error2.message,
			stack: error2.stack
		}, {
			status: 500,
			statusText: "Request Handler Error"
		}));
	}
	async #respondWith(response) {
		let responseBody;
		let transfer;
		const responseInit = toResponseInit(response);
		if (supportsReadableStreamTransfer()) {
			responseBody = response.body;
			transfer = response.body == null ? void 0 : [response.body];
		} else responseBody = response.body == null ? null : await response.clone().arrayBuffer();
		this.#event.postMessage("MOCK_RESPONSE", {
			...responseInit,
			body: responseBody
		}, transfer);
	}
};
var until2 = async (promise) => {
	try {
		return {
			error: null,
			data: await promise().catch((error2) => {
				throw error2;
			})
		};
	} catch (error2) {
		return {
			error: error2,
			data: null
		};
	}
};
function isObject2(value, loose = false) {
	return loose ? Object.prototype.toString.call(value).startsWith("[object ") : Object.prototype.toString.call(value) === "[object Object]";
}
function isPropertyAccessible(obj, key) {
	try {
		obj[key];
		return true;
	} catch {
		return false;
	}
}
function createServerErrorResponse(body) {
	return new Response(JSON.stringify(body instanceof Error ? {
		name: body.name,
		message: body.message,
		stack: body.stack
	} : body), {
		status: 500,
		statusText: "Unhandled Exception",
		headers: { "Content-Type": "application/json" }
	});
}
function isResponseError(response) {
	return response != null && response instanceof Response && isPropertyAccessible(response, "type") && response.type === "error";
}
function isResponseLike(value) {
	return isObject2(value, true) && isPropertyAccessible(value, "status") && isPropertyAccessible(value, "statusText") && isPropertyAccessible(value, "bodyUsed");
}
function isNodeLikeError(error2) {
	if (error2 == null) return false;
	if (!(error2 instanceof Error)) return false;
	return "code" in error2 && "errno" in error2;
}
async function handleRequest(options) {
	const handleResponse = async (response) => {
		if (response instanceof Error) {
			await options.controller.errorWith(response);
			return true;
		}
		if (isResponseError(response)) {
			await options.controller.respondWith(response);
			return true;
		}
		if (isResponseLike(response)) {
			await options.controller.respondWith(response);
			return true;
		}
		if (isObject2(response)) {
			await options.controller.errorWith(response);
			return true;
		}
		return false;
	};
	const handleResponseError = async (error2) => {
		if (error2 instanceof InterceptorError) throw result.error;
		if (isNodeLikeError(error2)) {
			await options.controller.errorWith(error2);
			return true;
		}
		if (error2 instanceof Response) return await handleResponse(error2);
		return false;
	};
	const requestAbortPromise = new DeferredPromise();
	const onAbort = () => {
		requestAbortPromise.reject(options.request.signal?.reason);
	};
	if (options.request.signal) {
		if (options.request.signal.aborted) {
			await options.controller.errorWith(options.request.signal.reason);
			return;
		}
		options.request.signal.addEventListener("abort", onAbort, { once: true });
	}
	const result = await until2(async () => {
		const requestListenersPromise = emitAsync(options.emitter, "request", {
			requestId: options.requestId,
			request: options.request,
			controller: options.controller
		});
		await Promise.race([
			requestAbortPromise,
			requestListenersPromise,
			options.controller.handled
		]);
	});
	options.request.signal?.removeEventListener("abort", onAbort);
	if (requestAbortPromise.state === "rejected") {
		await options.controller.errorWith(requestAbortPromise.rejectionReason);
		return;
	}
	if (result.error) {
		if (await handleResponseError(result.error)) return;
		if (options.emitter.listenerCount("unhandledException") > 0) {
			const unhandledExceptionController = new RequestController(options.request, {
				passthrough() {},
				async respondWith(response) {
					await handleResponse(response);
				},
				async errorWith(reason) {
					await options.controller.errorWith(reason);
				}
			});
			await emitAsync(options.emitter, "unhandledException", {
				error: result.error,
				request: options.request,
				requestId: options.requestId,
				controller: unhandledExceptionController
			});
			if (unhandledExceptionController.readyState !== RequestController.PENDING) return;
		}
		await options.controller.respondWith(createServerErrorResponse(result.error));
		return;
	}
	if (options.controller.readyState === RequestController.PENDING) return await options.controller.passthrough();
	return options.controller.handled;
}
function createNetworkError(cause) {
	return Object.assign(/* @__PURE__ */ new TypeError("Failed to fetch"), { cause });
}
var REQUEST_BODY_HEADERS = [
	"content-encoding",
	"content-language",
	"content-location",
	"content-type",
	"content-length"
];
var kRedirectCount = /* @__PURE__ */ Symbol("kRedirectCount");
async function followFetchRedirect(request, response) {
	if (response.status !== 303 && request.body != null) return Promise.reject(createNetworkError());
	const requestUrl = new URL(request.url);
	let locationUrl;
	try {
		locationUrl = new URL(response.headers.get("location"), request.url);
	} catch (error2) {
		return Promise.reject(createNetworkError(error2));
	}
	if (!(locationUrl.protocol === "http:" || locationUrl.protocol === "https:")) return Promise.reject(createNetworkError("URL scheme must be a HTTP(S) scheme"));
	if (Reflect.get(request, kRedirectCount) > 20) return Promise.reject(createNetworkError("redirect count exceeded"));
	Object.defineProperty(request, kRedirectCount, { value: (Reflect.get(request, kRedirectCount) || 0) + 1 });
	if (request.mode === "cors" && (locationUrl.username || locationUrl.password) && !sameOrigin(requestUrl, locationUrl)) return Promise.reject(createNetworkError("cross origin not allowed for request mode \"cors\""));
	const requestInit = {};
	if ([301, 302].includes(response.status) && request.method === "POST" || response.status === 303 && !["HEAD", "GET"].includes(request.method)) {
		requestInit.method = "GET";
		requestInit.body = null;
		REQUEST_BODY_HEADERS.forEach((headerName) => {
			request.headers.delete(headerName);
		});
	}
	if (!sameOrigin(requestUrl, locationUrl)) {
		request.headers.delete("authorization");
		request.headers.delete("proxy-authorization");
		request.headers.delete("cookie");
		request.headers.delete("host");
	}
	requestInit.headers = request.headers;
	const finalResponse = await fetch(new Request(locationUrl, requestInit));
	Object.defineProperty(finalResponse, "redirected", {
		value: true,
		configurable: true
	});
	return finalResponse;
}
function sameOrigin(left, right) {
	if (left.origin === right.origin && left.origin === "null") return true;
	if (left.protocol === right.protocol && left.hostname === right.hostname && left.port === right.port) return true;
	return false;
}
var BrotliDecompressionStream = class extends TransformStream {
	constructor() {
		console.warn("[Interceptors]: Brotli decompression of response streams is not supported in the browser");
		super({ transform(chunk, controller) {
			controller.enqueue(chunk);
		} });
	}
};
var PipelineStream = class extends TransformStream {
	constructor(transformStreams, ...strategies) {
		super({}, ...strategies);
		const readable = [super.readable, ...transformStreams].reduce((readable$1, transform) => readable$1.pipeThrough(transform));
		Object.defineProperty(this, "readable", { get() {
			return readable;
		} });
	}
};
function parseContentEncoding(contentEncoding) {
	return contentEncoding.toLowerCase().split(",").map((coding) => coding.trim());
}
function createDecompressionStream(contentEncoding) {
	if (contentEncoding === "") return null;
	const codings = parseContentEncoding(contentEncoding);
	if (codings.length === 0) return null;
	return new PipelineStream(codings.reduceRight((transformers, coding) => {
		if (coding === "gzip" || coding === "x-gzip") return transformers.concat(new DecompressionStream("gzip"));
		else if (coding === "deflate") return transformers.concat(new DecompressionStream("deflate"));
		else if (coding === "br") return transformers.concat(new BrotliDecompressionStream());
		else transformers.length = 0;
		return transformers;
	}, []));
}
function decompressResponse(response) {
	if (response.body === null) return null;
	const decompressionStream = createDecompressionStream(response.headers.get("content-encoding") || "");
	if (!decompressionStream) return null;
	response.body.pipeTo(decompressionStream.writable);
	return decompressionStream.readable;
}
var FetchInterceptor = class FetchInterceptor2 extends Interceptor {
	static {
		this.symbol = /* @__PURE__ */ Symbol.for("fetch-interceptor");
	}
	constructor() {
		super(FetchInterceptor2.symbol);
	}
	checkEnvironment() {
		return hasConfigurableGlobal("fetch");
	}
	async setup() {
		const logger = this.logger.extend("setup");
		const pureFetch = globalThis.fetch;
		const fetchProxy = async (input, init) => {
			const requestId = createRequestId();
			const request = new FetchRequest(typeof input === "string" && typeof location !== "undefined" && !canParseUrl(input) ? new URL(input, location.href) : input, init);
			if (input instanceof Request) setRawRequest(request, input);
			const responsePromise = new DeferredPromise();
			const controller = new RequestController(request, {
				passthrough: async () => {
					this.logger.info("request has not been handled, passthrough...");
					const requestCloneForResponseEvent = request.clone();
					const { error: responseError, data: originalResponse } = await until2(() => pureFetch(request));
					if (responseError) return responsePromise.reject(responseError);
					this.logger.info("original fetch performed", originalResponse);
					if (this.emitter.listenerCount("response") > 0) {
						this.logger.info("emitting the \"response\" event...");
						const responseClone = FetchResponse.clone(originalResponse);
						await emitAsync(this.emitter, "response", {
							response: responseClone,
							isMockedResponse: false,
							request: requestCloneForResponseEvent,
							requestId
						});
					}
					responsePromise.resolve(originalResponse);
				},
				respondWith: async (rawResponse) => {
					if (isResponseError(rawResponse)) {
						this.logger.info("request has errored!", { response: rawResponse });
						responsePromise.reject(createNetworkError(rawResponse));
						return;
					}
					this.logger.info("received mocked response!", { rawResponse });
					const response = new FetchResponse(decompressResponse(rawResponse) || rawResponse.body, {
						url: request.url,
						status: rawResponse.status,
						statusText: rawResponse.statusText,
						headers: rawResponse.headers
					});
					if (FetchResponse.isRedirectResponse(response.status)) {
						if (request.redirect === "error") {
							responsePromise.reject(createNetworkError("unexpected redirect"));
							return;
						}
						if (request.redirect === "follow") {
							followFetchRedirect(request, response).then((response$1) => {
								responsePromise.resolve(response$1);
							}, (reason) => {
								responsePromise.reject(reason);
							});
							return;
						}
					}
					if (this.emitter.listenerCount("response") > 0) {
						this.logger.info("emitting the \"response\" event...");
						await emitAsync(this.emitter, "response", {
							response: FetchResponse.clone(response),
							isMockedResponse: true,
							request,
							requestId
						});
					}
					responsePromise.resolve(response);
				},
				errorWith: (reason) => {
					this.logger.info("request has been aborted!", { reason });
					responsePromise.reject(reason);
				}
			});
			this.logger.info("[%s] %s", request.method, request.url);
			this.logger.info("awaiting for the mocked response...");
			this.logger.info("emitting the \"request\" event for %s listener(s)...", this.emitter.listenerCount("request"));
			await handleRequest({
				request,
				requestId,
				emitter: this.emitter,
				controller
			});
			return responsePromise;
		};
		logger.info("patching global fetch...");
		this.subscriptions.push(patchesRegistry.applyPatch(globalThis, "fetch", () => fetchProxy));
		logger.info("global fetch patched!", globalThis.fetch.name);
	}
};
function concatArrayBuffer(left, right) {
	const result = new Uint8Array(left.byteLength + right.byteLength);
	result.set(left, 0);
	result.set(right, left.byteLength);
	return result;
}
var EventPolyfill = class {
	constructor(type, options) {
		this.NONE = 0;
		this.CAPTURING_PHASE = 1;
		this.AT_TARGET = 2;
		this.BUBBLING_PHASE = 3;
		this.type = "";
		this.srcElement = null;
		this.currentTarget = null;
		this.eventPhase = 0;
		this.isTrusted = true;
		this.composed = false;
		this.cancelable = true;
		this.defaultPrevented = false;
		this.bubbles = true;
		this.lengthComputable = true;
		this.loaded = 0;
		this.total = 0;
		this.cancelBubble = false;
		this.returnValue = true;
		this.type = type;
		this.target = options?.target || null;
		this.currentTarget = options?.currentTarget || null;
		this.timeStamp = Date.now();
	}
	composedPath() {
		return [];
	}
	initEvent(type, bubbles, cancelable) {
		this.type = type;
		this.bubbles = !!bubbles;
		this.cancelable = !!cancelable;
	}
	preventDefault() {
		this.defaultPrevented = true;
	}
	stopPropagation() {}
	stopImmediatePropagation() {}
};
var ProgressEventPolyfill = class extends EventPolyfill {
	constructor(type, init) {
		super(type);
		this.lengthComputable = init?.lengthComputable || false;
		this.composed = init?.composed || false;
		this.loaded = init?.loaded || 0;
		this.total = init?.total || 0;
	}
};
var SUPPORTS_PROGRESS_EVENT = typeof ProgressEvent !== "undefined";
function createEvent(target, type, init) {
	const progressEvents = [
		"error",
		"progress",
		"loadstart",
		"loadend",
		"load",
		"timeout",
		"abort"
	];
	const ProgressEventClass = SUPPORTS_PROGRESS_EVENT ? ProgressEvent : ProgressEventPolyfill;
	return progressEvents.includes(type) ? new ProgressEventClass(type, {
		lengthComputable: true,
		loaded: init?.loaded || 0,
		total: init?.total || 0
	}) : new EventPolyfill(type, {
		target,
		currentTarget: target
	});
}
function findPropertySource(target, propertyName) {
	if (!(propertyName in target)) return null;
	if (Object.prototype.hasOwnProperty.call(target, propertyName)) return target;
	const prototype = Reflect.getPrototypeOf(target);
	return prototype ? findPropertySource(prototype, propertyName) : null;
}
function createProxy(target, options) {
	return new Proxy(target, optionsToProxyHandler(options));
}
function optionsToProxyHandler(options) {
	const { constructorCall, methodCall, getProperty, setProperty } = options;
	const handler = {};
	if (typeof constructorCall !== "undefined") handler.construct = function(target, args, newTarget) {
		const next = Reflect.construct.bind(null, target, args, newTarget);
		return constructorCall.call(newTarget, args, next);
	};
	handler.set = function(target, propertyName, nextValue) {
		const next = () => {
			const propertySource = findPropertySource(target, propertyName) || target;
			const ownDescriptors = Reflect.getOwnPropertyDescriptor(propertySource, propertyName);
			if (typeof ownDescriptors?.set !== "undefined") {
				ownDescriptors.set.apply(target, [nextValue]);
				return true;
			}
			return Reflect.defineProperty(propertySource, propertyName, {
				writable: true,
				enumerable: true,
				configurable: true,
				value: nextValue
			});
		};
		if (typeof setProperty !== "undefined") return setProperty.call(target, [propertyName, nextValue], next);
		return next();
	};
	handler.get = function(target, propertyName, receiver) {
		const next = () => target[propertyName];
		const value = typeof getProperty !== "undefined" ? getProperty.call(target, [propertyName, receiver], next) : next();
		if (typeof value === "function") return (...args) => {
			const next$1 = value.bind(target, ...args);
			if (typeof methodCall !== "undefined") return methodCall.call(target, [propertyName, args], next$1);
			return next$1();
		};
		return value;
	};
	return handler;
}
function isDomParserSupportedType(type) {
	return [
		"application/xhtml+xml",
		"application/xml",
		"image/svg+xml",
		"text/html",
		"text/xml"
	].some((supportedType) => {
		return type.startsWith(supportedType);
	});
}
function parseJson(data) {
	try {
		return JSON.parse(data);
	} catch (_) {
		return null;
	}
}
function createResponse(request, body) {
	return new FetchResponse(FetchResponse.isResponseWithBody(request.status) ? body : null, {
		url: request.responseURL,
		status: request.status,
		statusText: request.statusText,
		headers: createHeadersFromXMLHttpRequestHeaders(request.getAllResponseHeaders())
	});
}
function createHeadersFromXMLHttpRequestHeaders(headersString) {
	const headers = new Headers();
	const lines = headersString.split(/[\r\n]+/);
	for (const line of lines) {
		if (line.trim() === "") continue;
		const [name, ...parts] = line.split(": ");
		const value = parts.join(": ");
		headers.append(name, value);
	}
	return headers;
}
async function getBodyByteLength(input) {
	const explicitContentLength = input.headers.get("content-length");
	if (explicitContentLength != null && explicitContentLength !== "") return Number(explicitContentLength);
	return (await input.arrayBuffer()).byteLength;
}
var kIsRequestHandled = /* @__PURE__ */ Symbol("kIsRequestHandled");
var IS_NODE2 = isNodeProcess();
var kFetchRequest = /* @__PURE__ */ Symbol("kFetchRequest");
var XMLHttpRequestController = class {
	constructor(initialRequest, logger) {
		this.initialRequest = initialRequest;
		this.logger = logger;
		this.method = "GET";
		this.url = null;
		this[kIsRequestHandled] = false;
		this.events = /* @__PURE__ */ new Map();
		this.uploadEvents = /* @__PURE__ */ new Map();
		this.requestId = createRequestId();
		this.requestHeaders = new Headers();
		this.responseBuffer = /* @__PURE__ */ new Uint8Array();
		this.request = createProxy(initialRequest, {
			setProperty: ([propertyName, nextValue], invoke) => {
				switch (propertyName) {
					case "ontimeout": {
						const eventName = propertyName.slice(2);
						this.request.addEventListener(eventName, nextValue);
						return invoke();
					}
					default: return invoke();
				}
			},
			methodCall: ([methodName, args], invoke) => {
				switch (methodName) {
					case "open": {
						const [method, url] = args;
						if (typeof url === "undefined") {
							this.method = "GET";
							this.url = toAbsoluteUrl(method);
						} else {
							this.method = method;
							this.url = toAbsoluteUrl(url);
						}
						this.logger = this.logger.extend(`${this.method} ${this.url.href}`);
						this.logger.info("open", this.method, this.url.href);
						return invoke();
					}
					case "addEventListener": {
						const [eventName, listener] = args;
						this.registerEvent(eventName, listener);
						this.logger.info("addEventListener", eventName, listener);
						return invoke();
					}
					case "setRequestHeader": {
						const [name, value] = args;
						this.requestHeaders.set(name, value);
						this.logger.info("setRequestHeader", name, value);
						return invoke();
					}
					case "send": {
						const [body] = args;
						this.request.addEventListener("load", () => {
							if (typeof this.onResponse !== "undefined") {
								const fetchResponse = createResponse(
									this.request,
									/**
									* The `response` property is the right way to read
									* the ambiguous response body, as the request's "responseType" may differ.
									* @see https://xhr.spec.whatwg.org/#the-response-attribute
									*/
									this.request.response
								);
								this.onResponse.call(this, {
									response: fetchResponse,
									isMockedResponse: this[kIsRequestHandled],
									request: fetchRequest,
									requestId: this.requestId
								});
							}
						});
						const requestBody = typeof body === "string" ? encodeBuffer(body) : body;
						const fetchRequest = this.toFetchApiRequest(requestBody);
						this[kFetchRequest] = fetchRequest.clone();
						queueMicrotask(() => {
							(this.onRequest?.call(this, {
								request: fetchRequest,
								requestId: this.requestId
							}) || Promise.resolve()).finally(() => {
								if (!this[kIsRequestHandled]) {
									this.logger.info("request callback settled but request has not been handled (readystate %d), performing as-is...", this.request.readyState);
									if (IS_NODE2) this.request.setRequestHeader(INTERNAL_REQUEST_ID_HEADER_NAME, this.requestId);
									return invoke();
								}
							});
						});
						break;
					}
					default: return invoke();
				}
			}
		});
		define(this.request, "upload", createProxy(this.request.upload, {
			setProperty: ([propertyName, nextValue], invoke) => {
				switch (propertyName) {
					case "onloadstart":
					case "onprogress":
					case "onaboart":
					case "onerror":
					case "onload":
					case "ontimeout":
					case "onloadend": {
						const eventName = propertyName.slice(2);
						this.registerUploadEvent(eventName, nextValue);
					}
				}
				return invoke();
			},
			methodCall: ([methodName, args], invoke) => {
				switch (methodName) {
					case "addEventListener": {
						const [eventName, listener] = args;
						this.registerUploadEvent(eventName, listener);
						this.logger.info("upload.addEventListener", eventName, listener);
						return invoke();
					}
				}
			}
		}));
	}
	registerEvent(eventName, listener) {
		const nextEvents = (this.events.get(eventName) || []).concat(listener);
		this.events.set(eventName, nextEvents);
		this.logger.info("registered event \"%s\"", eventName, listener);
	}
	registerUploadEvent(eventName, listener) {
		const nextEvents = (this.uploadEvents.get(eventName) || []).concat(listener);
		this.uploadEvents.set(eventName, nextEvents);
		this.logger.info("registered upload event \"%s\"", eventName, listener);
	}
	/**
	* Responds to the current request with the given
	* Fetch API `Response` instance.
	*/
	async respondWith(response) {
		this[kIsRequestHandled] = true;
		if (this[kFetchRequest]) {
			const totalRequestBodyLength = await getBodyByteLength(this[kFetchRequest]);
			this.trigger("loadstart", this.request.upload, {
				loaded: 0,
				total: totalRequestBodyLength
			});
			this.trigger("progress", this.request.upload, {
				loaded: totalRequestBodyLength,
				total: totalRequestBodyLength
			});
			this.trigger("load", this.request.upload, {
				loaded: totalRequestBodyLength,
				total: totalRequestBodyLength
			});
			this.trigger("loadend", this.request.upload, {
				loaded: totalRequestBodyLength,
				total: totalRequestBodyLength
			});
		}
		this.logger.info("responding with a mocked response: %d %s", response.status, response.statusText);
		define(this.request, "status", response.status);
		define(this.request, "statusText", response.statusText);
		define(this.request, "responseURL", this.url.href);
		this.request.getResponseHeader = new Proxy(this.request.getResponseHeader, { apply: (_, __, args) => {
			this.logger.info("getResponseHeader", args[0]);
			if (this.request.readyState < this.request.HEADERS_RECEIVED) {
				this.logger.info("headers not received yet, returning null");
				return null;
			}
			const headerValue = response.headers.get(args[0]);
			this.logger.info("resolved response header \"%s\" to", args[0], headerValue);
			return headerValue;
		} });
		this.request.getAllResponseHeaders = new Proxy(this.request.getAllResponseHeaders, { apply: () => {
			this.logger.info("getAllResponseHeaders");
			if (this.request.readyState < this.request.HEADERS_RECEIVED) {
				this.logger.info("headers not received yet, returning empty string");
				return "";
			}
			const allHeaders = Array.from(response.headers.entries()).map(([headerName, headerValue]) => {
				return `${headerName}: ${headerValue}`;
			}).join("\r\n");
			this.logger.info("resolved all response headers to", allHeaders);
			return allHeaders;
		} });
		Object.defineProperties(this.request, {
			response: {
				enumerable: true,
				configurable: false,
				get: () => this.response
			},
			responseText: {
				enumerable: true,
				configurable: false,
				get: () => this.responseText
			},
			responseXML: {
				enumerable: true,
				configurable: false,
				get: () => this.responseXML
			}
		});
		const totalResponseBodyLength = await getBodyByteLength(response.clone());
		this.logger.info("calculated response body length", totalResponseBodyLength);
		this.trigger("loadstart", this.request, {
			loaded: 0,
			total: totalResponseBodyLength
		});
		this.setReadyState(this.request.HEADERS_RECEIVED);
		this.setReadyState(this.request.LOADING);
		const finalizeResponse = () => {
			this.logger.info("finalizing the mocked response...");
			this.setReadyState(this.request.DONE);
			this.trigger("load", this.request, {
				loaded: this.responseBuffer.byteLength,
				total: totalResponseBodyLength
			});
			this.trigger("loadend", this.request, {
				loaded: this.responseBuffer.byteLength,
				total: totalResponseBodyLength
			});
		};
		if (response.body) {
			this.logger.info("mocked response has body, streaming...");
			const reader = response.body.getReader();
			const readNextResponseBodyChunk = async () => {
				const { value, done } = await reader.read();
				if (done) {
					this.logger.info("response body stream done!");
					finalizeResponse();
					return;
				}
				if (value) {
					this.logger.info("read response body chunk:", value);
					this.responseBuffer = concatArrayBuffer(this.responseBuffer, value);
					this.trigger("progress", this.request, {
						loaded: this.responseBuffer.byteLength,
						total: totalResponseBodyLength
					});
				}
				readNextResponseBodyChunk();
			};
			readNextResponseBodyChunk();
		} else finalizeResponse();
	}
	responseBufferToText() {
		return decodeBuffer(this.responseBuffer);
	}
	get response() {
		this.logger.info("getResponse (responseType: %s)", this.request.responseType);
		if (this.request.readyState !== this.request.DONE) return null;
		switch (this.request.responseType) {
			case "json": {
				const responseJson = parseJson(this.responseBufferToText());
				this.logger.info("resolved response JSON", responseJson);
				return responseJson;
			}
			case "arraybuffer": {
				const arrayBuffer = toArrayBuffer(this.responseBuffer);
				this.logger.info("resolved response ArrayBuffer", arrayBuffer);
				return arrayBuffer;
			}
			case "blob": {
				const mimeType = this.request.getResponseHeader("Content-Type") || "text/plain";
				const responseBlob = new Blob([this.responseBufferToText()], { type: mimeType });
				this.logger.info("resolved response Blob (mime type: %s)", responseBlob, mimeType);
				return responseBlob;
			}
			default: {
				const responseText = this.responseBufferToText();
				this.logger.info("resolving \"%s\" response type as text", this.request.responseType, responseText);
				return responseText;
			}
		}
	}
	get responseText() {
		invariant(this.request.responseType === "" || this.request.responseType === "text", "InvalidStateError: The object is in invalid state.");
		if (this.request.readyState !== this.request.LOADING && this.request.readyState !== this.request.DONE) return "";
		const responseText = this.responseBufferToText();
		this.logger.info("getResponseText: \"%s\"", responseText);
		return responseText;
	}
	get responseXML() {
		invariant(this.request.responseType === "" || this.request.responseType === "document", "InvalidStateError: The object is in invalid state.");
		if (this.request.readyState !== this.request.DONE) return null;
		const contentType = this.request.getResponseHeader("Content-Type") || "";
		if (typeof DOMParser === "undefined") {
			console.warn("Cannot retrieve XMLHttpRequest response body as XML: DOMParser is not defined. You are likely using an environment that is not browser or does not polyfill browser globals correctly.");
			return null;
		}
		if (isDomParserSupportedType(contentType)) return new DOMParser().parseFromString(this.responseBufferToText(), contentType);
		return null;
	}
	errorWith(error2) {
		this[kIsRequestHandled] = true;
		this.logger.info("responding with an error");
		this.setReadyState(this.request.DONE);
		this.trigger("error", this.request);
		this.trigger("loadend", this.request);
	}
	/**
	* Transitions this request's `readyState` to the given one.
	*/
	setReadyState(nextReadyState) {
		this.logger.info("setReadyState: %d -> %d", this.request.readyState, nextReadyState);
		if (this.request.readyState === nextReadyState) {
			this.logger.info("ready state identical, skipping transition...");
			return;
		}
		define(this.request, "readyState", nextReadyState);
		this.logger.info("set readyState to: %d", nextReadyState);
		if (nextReadyState !== this.request.UNSENT) {
			this.logger.info("triggering \"readystatechange\" event...");
			this.trigger("readystatechange", this.request);
		}
	}
	/**
	* Triggers given event on the `XMLHttpRequest` instance.
	*/
	trigger(eventName, target, options) {
		const callback = target[`on${eventName}`];
		const event = createEvent(target, eventName, options);
		this.logger.info("trigger \"%s\"", eventName, options || "");
		if (typeof callback === "function") {
			this.logger.info("found a direct \"%s\" callback, calling...", eventName);
			callback.call(target, event);
		}
		const events = target instanceof XMLHttpRequestUpload ? this.uploadEvents : this.events;
		for (const [registeredEventName, listeners] of events) if (registeredEventName === eventName) {
			this.logger.info("found %d listener(s) for \"%s\" event, calling...", listeners.length, eventName);
			listeners.forEach((listener) => listener.call(target, event));
		}
	}
	/**
	* Converts this `XMLHttpRequest` instance into a Fetch API `Request` instance.
	*/
	toFetchApiRequest(body) {
		this.logger.info("converting request to a Fetch API Request...");
		const resolvedBody = body instanceof Document ? body.documentElement.innerText : body;
		const fetchRequest = new FetchRequest(this.url.href, {
			method: this.method,
			headers: this.requestHeaders,
			credentials: this.request.withCredentials ? "include" : "same-origin",
			body: ["GET", "HEAD"].includes(this.method.toUpperCase()) ? null : resolvedBody
		});
		define(fetchRequest, "headers", createProxy(fetchRequest.headers, { methodCall: ([methodName, args], invoke) => {
			switch (methodName) {
				case "append":
				case "set": {
					const [headerName, headerValue] = args;
					this.request.setRequestHeader(headerName, headerValue);
					break;
				}
				case "delete": {
					const [headerName] = args;
					console.warn(`XMLHttpRequest: Cannot remove a "${headerName}" header from the Fetch API representation of the "${fetchRequest.method} ${fetchRequest.url}" request. XMLHttpRequest headers cannot be removed.`);
					break;
				}
			}
			return invoke();
		} }));
		setRawRequest(fetchRequest, this.request);
		this.logger.info("converted request to a Fetch API Request!", fetchRequest);
		return fetchRequest;
	}
};
function toAbsoluteUrl(url) {
	if (typeof location === "undefined") return new URL(url);
	return new URL(url.toString(), location.href);
}
function define(target, property, value) {
	Reflect.defineProperty(target, property, {
		writable: true,
		enumerable: true,
		value
	});
}
function createXMLHttpRequestProxy({ emitter, logger }) {
	return new Proxy(globalThis.XMLHttpRequest, { construct(target, args, newTarget) {
		logger.info("constructed new XMLHttpRequest");
		const originalRequest = Reflect.construct(target, args, newTarget);
		const prototypeDescriptors = Object.getOwnPropertyDescriptors(target.prototype);
		for (const propertyName in prototypeDescriptors) Reflect.defineProperty(originalRequest, propertyName, prototypeDescriptors[propertyName]);
		const xhrRequestController = new XMLHttpRequestController(originalRequest, logger);
		xhrRequestController.onRequest = async function({ request, requestId }) {
			const controller = new RequestController(request, {
				passthrough: () => {
					this.logger.info("no mocked response received, performing request as-is...");
				},
				respondWith: async (response) => {
					if (isResponseError(response)) {
						this.errorWith(/* @__PURE__ */ new TypeError("Network error"));
						return;
					}
					await this.respondWith(response);
				},
				errorWith: (reason) => {
					this.logger.info("request errored!", { error: reason });
					if (reason instanceof Error) this.errorWith(reason);
				}
			});
			this.logger.info("awaiting mocked response...");
			this.logger.info("emitting the \"request\" event for %s listener(s)...", emitter.listenerCount("request"));
			await handleRequest({
				request,
				requestId,
				controller,
				emitter
			});
		};
		xhrRequestController.onResponse = async function({ response, isMockedResponse, request, requestId }) {
			this.logger.info("emitting the \"response\" event for %s listener(s)...", emitter.listenerCount("response"));
			emitter.emit("response", {
				response,
				isMockedResponse,
				request,
				requestId
			});
		};
		return xhrRequestController.request;
	} });
}
var XMLHttpRequestInterceptor = class XMLHttpRequestInterceptor2 extends Interceptor {
	static {
		this.symbol = /* @__PURE__ */ Symbol.for("xhr-interceptor");
	}
	constructor() {
		super(XMLHttpRequestInterceptor2.symbol);
	}
	checkEnvironment() {
		return hasConfigurableGlobal("XMLHttpRequest");
	}
	setup() {
		const logger = this.logger.extend("setup");
		logger.info("patching global XMLHttpRequest...");
		this.subscriptions.push(patchesRegistry.applyPatch(globalThis, "XMLHttpRequest", () => {
			return createXMLHttpRequestProxy({
				emitter: this.emitter,
				logger: this.logger
			});
		}));
		logger.info("global XMLHttpRequest patched!", globalThis.XMLHttpRequest.name);
	}
};
var FallbackHttpSource = class extends InterceptorSource {
	constructor(options) {
		super({ interceptors: [new XMLHttpRequestInterceptor(), new FetchInterceptor()] });
		this.options = options;
	}
	options;
	enable() {
		super.enable();
		if (!this.options.quiet) this.#printStartMessage();
	}
	disable() {
		super.disable();
		if (!this.options.quiet) this.#printStopMessage();
	}
	#printStartMessage() {
		console.groupCollapsed(`%c${devUtils.formatMessage("Mocking enabled (fallback mode).")}`, "color:orangered;font-weight:bold;");
		console.log("%cDocumentation: %chttps://mswjs.io/docs", "font-weight:bold", "font-weight:normal");
		console.log("Found an issue? https://github.com/mswjs/msw/issues");
		console.groupEnd();
	}
	#printStopMessage() {
		console.log(`%c${devUtils.formatMessage("Mocking disabled.")}`, "color:orangered;font-weight:bold;");
	}
};
var DEFAULT_WORKER_URL = "/mockServiceWorker.js";
function setupWorker(...handlers) {
	invariant(!isNodeProcess(), devUtils.formatMessage("Failed to execute `setupWorker` in a non-browser environment"));
	const network = defineNetwork({
		sources: [],
		handlers
	});
	return {
		async start(options) {
			if (options?.waitUntilReady != null) devUtils.warn(`The "waitUntilReady" option has been deprecated. Please remove it from this "worker.start()" call. Follow the recommended Browser integration (https://mswjs.io/docs/integrations/browser) to eliminate any race conditions between the Service Worker registration and any requests made by your application on initial render.`);
			if (network.readyState === NetworkReadyState.ENABLED) {
				devUtils.warn("Found a redundant \"worker.start()\" call. Note that starting the worker while mocking is already enabled will have no effect. Consider removing this \"worker.start()\" call.");
				return;
			}
			const httpSource = supportsServiceWorker() ? await ServiceWorkerSource.from({
				serviceWorker: {
					url: options?.serviceWorker?.url?.toString() || DEFAULT_WORKER_URL,
					options: options?.serviceWorker?.options
				},
				findWorker: options?.findWorker,
				quiet: options?.quiet
			}) : new FallbackHttpSource({ quiet: options?.quiet });
			network.configure({
				sources: [httpSource, new InterceptorSource({ interceptors: [new WebSocketInterceptor()] })],
				onUnhandledFrame: fromLegacyOnUnhandledRequest(() => {
					return options?.onUnhandledRequest || "warn";
				}),
				context: { quiet: options?.quiet }
			});
			await network.enable();
			if (httpSource instanceof ServiceWorkerSource) {
				const [, registration] = await httpSource.workerPromise;
				return registration;
			}
		},
		stop() {
			if (network.readyState === NetworkReadyState.DISABLED) {
				devUtils.warn(`Found a redundant "worker.stop()" call. Notice that stopping the worker after it has already been stopped has no effect. Consider removing this "worker.stop()" call.`);
				return;
			}
			network.disable();
			window.postMessage({ type: "msw/worker:stop" });
		},
		events: network.events,
		use: network.use.bind(network),
		resetHandlers: network.resetHandlers.bind(network),
		restoreHandlers: network.restoreHandlers.bind(network),
		listHandlers: network.listHandlers.bind(network)
	};
}
//#endregion
//#region node_modules/msw/lib/core/utils/internal/isStringEqual.mjs
function isStringEqual(actual, expected) {
	return actual.toLowerCase() === expected.toLowerCase();
}
//#endregion
//#region node_modules/msw/lib/core/utils/logging/getStatusCodeColor.mjs
function getStatusCodeColor(status) {
	if (status < 300) return "#69AB32";
	if (status < 400) return "#F0BB4B";
	return "#E95F5D";
}
//#endregion
//#region node_modules/msw/lib/core/utils/logging/serializeRequest.mjs
async function serializeRequest(request) {
	const requestText = await request.clone().text();
	return {
		url: new URL(request.url),
		method: request.method,
		headers: Object.fromEntries(request.headers.entries()),
		body: requestText
	};
}
//#endregion
//#region node_modules/msw/lib/core/utils/logging/serializeResponse.mjs
var { message } = statuses_default;
async function serializeResponse(response) {
	const responseClone = response.clone();
	const responseText = await responseClone.text();
	const responseStatus = responseClone.status || 200;
	return {
		status: responseStatus,
		statusText: responseClone.statusText || message[responseStatus] || "OK",
		headers: Object.fromEntries(responseClone.headers.entries()),
		body: responseText
	};
}
//#endregion
//#region node_modules/msw/lib/shims/cookie.mjs
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
	return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") {
		for (let key of __getOwnPropNames(from)) if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: () => from[key],
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
var allCookie = __toESM(__commonJS({ "node_modules/.pnpm/cookie@1.1.1/node_modules/cookie/dist/index.js"(exports) {
	"use strict";
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.parseCookie = parseCookie;
	exports.parse = parseCookie;
	exports.stringifyCookie = stringifyCookie;
	exports.stringifySetCookie = stringifySetCookie;
	exports.serialize = stringifySetCookie;
	exports.parseSetCookie = parseSetCookie;
	exports.stringifySetCookie = stringifySetCookie;
	exports.serialize = stringifySetCookie;
	var cookieNameRegExp = /^[\u0021-\u003A\u003C\u003E-\u007E]+$/;
	var cookieValueRegExp = /^[\u0021-\u003A\u003C-\u007E]*$/;
	var domainValueRegExp = /^([.]?[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)([.][a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i;
	var pathValueRegExp = /^[\u0020-\u003A\u003D-\u007E]*$/;
	var maxAgeRegExp = /^-?\d+$/;
	var __toString = Object.prototype.toString;
	var NullObject = /* @__PURE__ */ (() => {
		const C = function() {};
		C.prototype = /* @__PURE__ */ Object.create(null);
		return C;
	})();
	function parseCookie(str, options) {
		const obj = new NullObject();
		const len = str.length;
		if (len < 2) return obj;
		const dec = options?.decode || decode;
		let index = 0;
		do {
			const eqIdx = eqIndex(str, index, len);
			if (eqIdx === -1) break;
			const endIdx = endIndex(str, index, len);
			if (eqIdx > endIdx) {
				index = str.lastIndexOf(";", eqIdx - 1) + 1;
				continue;
			}
			const key = valueSlice(str, index, eqIdx);
			if (obj[key] === void 0) obj[key] = dec(valueSlice(str, eqIdx + 1, endIdx));
			index = endIdx + 1;
		} while (index < len);
		return obj;
	}
	function stringifyCookie(cookie2, options) {
		const enc = options?.encode || encodeURIComponent;
		const cookieStrings = [];
		for (const name of Object.keys(cookie2)) {
			const val = cookie2[name];
			if (val === void 0) continue;
			if (!cookieNameRegExp.test(name)) throw new TypeError(`cookie name is invalid: ${name}`);
			const value = enc(val);
			if (!cookieValueRegExp.test(value)) throw new TypeError(`cookie val is invalid: ${val}`);
			cookieStrings.push(`${name}=${value}`);
		}
		return cookieStrings.join("; ");
	}
	function stringifySetCookie(_name, _val, _opts) {
		const cookie2 = typeof _name === "object" ? _name : {
			..._opts,
			name: _name,
			value: String(_val)
		};
		const enc = (typeof _val === "object" ? _val : _opts)?.encode || encodeURIComponent;
		if (!cookieNameRegExp.test(cookie2.name)) throw new TypeError(`argument name is invalid: ${cookie2.name}`);
		const value = cookie2.value ? enc(cookie2.value) : "";
		if (!cookieValueRegExp.test(value)) throw new TypeError(`argument val is invalid: ${cookie2.value}`);
		let str = cookie2.name + "=" + value;
		if (cookie2.maxAge !== void 0) {
			if (!Number.isInteger(cookie2.maxAge)) throw new TypeError(`option maxAge is invalid: ${cookie2.maxAge}`);
			str += "; Max-Age=" + cookie2.maxAge;
		}
		if (cookie2.domain) {
			if (!domainValueRegExp.test(cookie2.domain)) throw new TypeError(`option domain is invalid: ${cookie2.domain}`);
			str += "; Domain=" + cookie2.domain;
		}
		if (cookie2.path) {
			if (!pathValueRegExp.test(cookie2.path)) throw new TypeError(`option path is invalid: ${cookie2.path}`);
			str += "; Path=" + cookie2.path;
		}
		if (cookie2.expires) {
			if (!isDate(cookie2.expires) || !Number.isFinite(cookie2.expires.valueOf())) throw new TypeError(`option expires is invalid: ${cookie2.expires}`);
			str += "; Expires=" + cookie2.expires.toUTCString();
		}
		if (cookie2.httpOnly) str += "; HttpOnly";
		if (cookie2.secure) str += "; Secure";
		if (cookie2.partitioned) str += "; Partitioned";
		if (cookie2.priority) switch (typeof cookie2.priority === "string" ? cookie2.priority.toLowerCase() : void 0) {
			case "low":
				str += "; Priority=Low";
				break;
			case "medium":
				str += "; Priority=Medium";
				break;
			case "high":
				str += "; Priority=High";
				break;
			default: throw new TypeError(`option priority is invalid: ${cookie2.priority}`);
		}
		if (cookie2.sameSite) switch (typeof cookie2.sameSite === "string" ? cookie2.sameSite.toLowerCase() : cookie2.sameSite) {
			case true:
			case "strict":
				str += "; SameSite=Strict";
				break;
			case "lax":
				str += "; SameSite=Lax";
				break;
			case "none":
				str += "; SameSite=None";
				break;
			default: throw new TypeError(`option sameSite is invalid: ${cookie2.sameSite}`);
		}
		return str;
	}
	function parseSetCookie(str, options) {
		const dec = options?.decode || decode;
		const len = str.length;
		const endIdx = endIndex(str, 0, len);
		const eqIdx = eqIndex(str, 0, endIdx);
		const setCookie = eqIdx === -1 ? {
			name: "",
			value: dec(valueSlice(str, 0, endIdx))
		} : {
			name: valueSlice(str, 0, eqIdx),
			value: dec(valueSlice(str, eqIdx + 1, endIdx))
		};
		let index = endIdx + 1;
		while (index < len) {
			const endIdx2 = endIndex(str, index, len);
			const eqIdx2 = eqIndex(str, index, endIdx2);
			const attr = eqIdx2 === -1 ? valueSlice(str, index, endIdx2) : valueSlice(str, index, eqIdx2);
			const val = eqIdx2 === -1 ? void 0 : valueSlice(str, eqIdx2 + 1, endIdx2);
			switch (attr.toLowerCase()) {
				case "httponly":
					setCookie.httpOnly = true;
					break;
				case "secure":
					setCookie.secure = true;
					break;
				case "partitioned":
					setCookie.partitioned = true;
					break;
				case "domain":
					setCookie.domain = val;
					break;
				case "path":
					setCookie.path = val;
					break;
				case "max-age":
					if (val && maxAgeRegExp.test(val)) setCookie.maxAge = Number(val);
					break;
				case "expires":
					if (!val) break;
					const date = new Date(val);
					if (Number.isFinite(date.valueOf())) setCookie.expires = date;
					break;
				case "priority":
					if (!val) break;
					const priority = val.toLowerCase();
					if (priority === "low" || priority === "medium" || priority === "high") setCookie.priority = priority;
					break;
				case "samesite":
					if (!val) break;
					const sameSite = val.toLowerCase();
					if (sameSite === "lax" || sameSite === "strict" || sameSite === "none") setCookie.sameSite = sameSite;
			}
			index = endIdx2 + 1;
		}
		return setCookie;
	}
	function endIndex(str, min, len) {
		const index = str.indexOf(";", min);
		return index === -1 ? len : index;
	}
	function eqIndex(str, min, max) {
		const index = str.indexOf("=", min);
		return index < max ? index : -1;
	}
	function valueSlice(str, min, max) {
		let start = min;
		let end = max;
		do {
			const code = str.charCodeAt(start);
			if (code !== 32 && code !== 9) break;
		} while (++start < end);
		while (end > start) {
			const code = str.charCodeAt(end - 1);
			if (code !== 32 && code !== 9) break;
			end--;
		}
		return str.slice(start, end);
	}
	function decode(str) {
		if (str.indexOf("%") === -1) return str;
		try {
			return decodeURIComponent(str);
		} catch (e) {
			return str;
		}
	}
	function isDate(val) {
		return __toString.call(val) === "[object Date]";
	}
} })(), 1);
var cookie = allCookie.default || allCookie;
var parse = cookie.parse;
var serialize = cookie.serialize;
//#endregion
//#region node_modules/msw/lib/core/utils/request/getRequestCookies.mjs
function parseCookies(input) {
	const parsedCookies = parse(input);
	const cookies = {};
	for (const cookieName in parsedCookies) if (typeof parsedCookies[cookieName] !== "undefined") cookies[cookieName] = parsedCookies[cookieName];
	return cookies;
}
function getAllDocumentCookies() {
	return parseCookies(document.cookie);
}
function getDocumentCookies(request) {
	if (typeof document === "undefined" || typeof location === "undefined") return {};
	switch (request.credentials) {
		case "same-origin": {
			const requestUrl = new URL(request.url);
			return location.origin === requestUrl.origin ? getAllDocumentCookies() : {};
		}
		case "include": return getAllDocumentCookies();
		default: return {};
	}
}
function getAllRequestCookies(request) {
	const requestCookieHeader = request.headers.get("cookie");
	const cookiesFromHeaders = requestCookieHeader ? parseCookies(requestCookieHeader) : {};
	const cookiesFromDocument = getDocumentCookies(request);
	for (const name in cookiesFromDocument) request.headers.append("cookie", serialize(name, cookiesFromDocument[name]));
	const cookiesFromStore = cookieStore.getCookies(request.url);
	const storedCookiesObject = Object.fromEntries(cookiesFromStore.map((cookie) => [cookie.key, cookie.value]));
	for (const cookie of cookiesFromStore) request.headers.append("cookie", cookie.toString());
	return {
		...cookiesFromDocument,
		...storedCookiesObject,
		...cookiesFromHeaders
	};
}
//#endregion
//#region node_modules/msw/lib/core/handlers/HttpHandler.mjs
var HttpMethods = /* @__PURE__ */ ((HttpMethods2) => {
	HttpMethods2["HEAD"] = "HEAD";
	HttpMethods2["GET"] = "GET";
	HttpMethods2["POST"] = "POST";
	HttpMethods2["PUT"] = "PUT";
	HttpMethods2["PATCH"] = "PATCH";
	HttpMethods2["OPTIONS"] = "OPTIONS";
	HttpMethods2["DELETE"] = "DELETE";
	return HttpMethods2;
})(HttpMethods || {});
var HttpHandler = class extends RequestHandler {
	constructor(method, predicate, resolver, options) {
		const displayPath = typeof predicate === "function" ? "[custom predicate]" : predicate;
		super({
			info: {
				header: `${method}${displayPath ? ` ${displayPath}` : ""}`,
				path: predicate,
				method
			},
			resolver,
			options
		});
		this.checkRedundantQueryParameters();
	}
	checkRedundantQueryParameters() {
		const { method, path } = this.info;
		if (!path || path instanceof RegExp || typeof path === "function") return;
		if (cleanUrl(path) === path) return;
		devUtils.warn(`Found a redundant usage of query parameters in the request handler URL for "${method} ${path}". Please match against a path instead and access query parameters using "new URL(request.url).searchParams" instead. Learn more: https://mswjs.io/docs/http/intercepting-requests#querysearch-parameters`);
	}
	async parse(args) {
		const url = new URL(args.request.url);
		const cookies = getAllRequestCookies(args.request);
		if (typeof this.info.path === "function") {
			const customPredicateResult = await this.info.path({
				request: args.request,
				cookies
			});
			return {
				match: typeof customPredicateResult === "boolean" ? {
					matches: customPredicateResult,
					params: {}
				} : customPredicateResult,
				cookies
			};
		}
		return {
			match: this.info.path ? matchRequestUrl(url, this.info.path, args.resolutionContext?.baseUrl) : {
				matches: false,
				params: {}
			},
			cookies
		};
	}
	async predicate(args) {
		const hasMatchingMethod = this.matchMethod(args.request.method);
		const hasMatchingUrl = args.parsedResult.match.matches;
		return hasMatchingMethod && hasMatchingUrl;
	}
	matchMethod(actualMethod) {
		return this.info.method instanceof RegExp ? this.info.method.test(actualMethod) : isStringEqual(this.info.method, actualMethod);
	}
	extendResolverArgs(args) {
		return {
			params: args.parsedResult.match?.params || {},
			cookies: args.parsedResult.cookies
		};
	}
	async log(args) {
		const publicUrl = toPublicUrl(args.request.url);
		const loggedRequest = await serializeRequest(args.request);
		const loggedResponse = await serializeResponse(args.response);
		const statusColor = getStatusCodeColor(loggedResponse.status);
		console.groupCollapsed(devUtils.formatMessage(`${getTimestamp()} ${args.request.method} ${publicUrl} (%c${loggedResponse.status} ${loggedResponse.statusText}%c)`), `color:${statusColor}`, "color:inherit");
		console.log("Request", loggedRequest);
		console.log("Handler:", this);
		console.log("Response", loggedResponse);
		console.groupEnd();
	}
};
//#endregion
//#region node_modules/msw/lib/core/http.mjs
function createHttpHandler(method) {
	return (predicate, resolver, options = {}) => {
		return new HttpHandler(method, predicate, resolver, options);
	};
}
var http = {
	all: createHttpHandler(/.+/),
	head: createHttpHandler(HttpMethods.HEAD),
	get: createHttpHandler(HttpMethods.GET),
	post: createHttpHandler(HttpMethods.POST),
	put: createHttpHandler(HttpMethods.PUT),
	delete: createHttpHandler(HttpMethods.DELETE),
	patch: createHttpHandler(HttpMethods.PATCH),
	options: createHttpHandler(HttpMethods.OPTIONS)
};
//#endregion
//#region node_modules/msw/lib/core/utils/internal/hasRefCounted.mjs
function hasRefCounted(value) {
	return isObject(value) && typeof Reflect.get(value, "ref") === "function" && typeof Reflect.get(value, "unref") === "function";
}
//#endregion
//#region node_modules/msw/lib/core/ws/WebSocketMemoryClientStore.mjs
var WebSocketMemoryClientStore = class {
	store;
	constructor() {
		this.store = /* @__PURE__ */ new Map();
	}
	async add(client) {
		this.store.set(client.id, {
			id: client.id,
			url: client.url.href
		});
	}
	getAll() {
		return Promise.resolve(Array.from(this.store.values()));
	}
	async deleteMany(clientIds) {
		for (const clientId of clientIds) this.store.delete(clientId);
	}
};
//#endregion
//#region node_modules/msw/lib/core/ws/WebSocketIndexedDBClientStore.mjs
var DB_NAME = "msw-websocket-clients";
var DB_STORE_NAME = "clients";
var WebSocketIndexedDBClientStore = class {
	db;
	constructor() {
		this.db = this.createDatabase();
	}
	async add(client) {
		const promise = new DeferredPromise$1();
		const request = (await this.getStore()).put({
			id: client.id,
			url: client.url.href
		});
		request.onsuccess = () => {
			promise.resolve();
		};
		request.onerror = () => {
			console.error(request.error);
			promise.reject(/* @__PURE__ */ new Error(`Failed to add WebSocket client "${client.id}". There is likely an additional output above.`));
		};
		return promise;
	}
	async getAll() {
		const promise = new DeferredPromise$1();
		const request = (await this.getStore()).getAll();
		request.onsuccess = () => {
			promise.resolve(request.result);
		};
		request.onerror = () => {
			console.error(request.error);
			promise.reject(/* @__PURE__ */ new Error(`Failed to get all WebSocket clients. There is likely an additional output above.`));
		};
		return promise;
	}
	async deleteMany(clientIds) {
		const promise = new DeferredPromise$1();
		const store = await this.getStore();
		for (const clientId of clientIds) store.delete(clientId);
		store.transaction.oncomplete = () => {
			promise.resolve();
		};
		store.transaction.onerror = () => {
			console.error(store.transaction.error);
			promise.reject(/* @__PURE__ */ new Error(`Failed to delete WebSocket clients [${clientIds.join(", ")}]. There is likely an additional output above.`));
		};
		return promise;
	}
	async createDatabase() {
		const promise = new DeferredPromise$1();
		const request = indexedDB.open(DB_NAME, 1);
		request.onsuccess = ({ currentTarget }) => {
			const db = Reflect.get(currentTarget, "result");
			if (db.objectStoreNames.contains(DB_STORE_NAME)) return promise.resolve(db);
		};
		request.onupgradeneeded = async ({ currentTarget }) => {
			const db = Reflect.get(currentTarget, "result");
			if (db.objectStoreNames.contains(DB_STORE_NAME)) return;
			const store = db.createObjectStore(DB_STORE_NAME, { keyPath: "id" });
			store.transaction.oncomplete = () => {
				promise.resolve(db);
			};
			store.transaction.onerror = () => {
				console.error(store.transaction.error);
				promise.reject(/* @__PURE__ */ new Error("Failed to create WebSocket client store. There is likely an additional output above."));
			};
		};
		request.onerror = () => {
			console.error(request.error);
			promise.reject(/* @__PURE__ */ new Error("Failed to open an IndexedDB database. There is likely an additional output above."));
		};
		return promise;
	}
	async getStore() {
		return (await this.db).transaction(DB_STORE_NAME, "readwrite").objectStore(DB_STORE_NAME);
	}
};
//#endregion
//#region node_modules/msw/lib/core/ws/WebSocketClientManager.mjs
var WebSocketClientManager = class {
	constructor(channel) {
		this.channel = channel;
		this.store = typeof indexedDB !== "undefined" ? new WebSocketIndexedDBClientStore() : new WebSocketMemoryClientStore();
		this.runtimeClients = /* @__PURE__ */ new Map();
		this.allClients = /* @__PURE__ */ new Set();
		this.channel.addEventListener("message", (message) => {
			if (message.data?.type === "db:update") this.flushDatabaseToMemory();
		});
		if (typeof window !== "undefined") window.addEventListener("message", async (message) => {
			if (message.data?.type === "msw/worker:stop") await this.removeRuntimeClients();
		});
	}
	channel;
	store;
	runtimeClients;
	allClients;
	async flushDatabaseToMemory() {
		const storedClients = await this.store.getAll();
		this.allClients = new Set(storedClients.map((client) => {
			const runtimeClient = this.runtimeClients.get(client.id);
			if (runtimeClient) return runtimeClient;
			return new WebSocketRemoteClientConnection(client.id, new URL(client.url), this.channel);
		}));
	}
	async removeRuntimeClients() {
		await this.store.deleteMany(Array.from(this.runtimeClients.keys()));
		this.runtimeClients.clear();
		await this.flushDatabaseToMemory();
		this.notifyOthersAboutDatabaseUpdate();
	}
	/**
	* All active WebSocket client connections.
	*/
	get clients() {
		return this.allClients;
	}
	/**
	* Notify other runtimes about the database update
	* using the shared `BroadcastChannel` instance.
	*/
	notifyOthersAboutDatabaseUpdate() {
		this.channel.postMessage({ type: "db:update" });
	}
	async addClient(client) {
		await this.store.add(client);
		await this.flushDatabaseToMemory();
		this.notifyOthersAboutDatabaseUpdate();
	}
	/**
	* Adds the given `WebSocket` client connection to the set
	* of all connections. The given connection is always the complete
	* connection object because `addConnection()` is called only
	* for the opened connections in the same runtime.
	*/
	async addConnection(client) {
		this.runtimeClients.set(client.id, client);
		await this.addClient(client);
		const handleExtraneousMessage = (message) => {
			const { type, payload } = message.data;
			if (typeof payload === "object" && "clientId" in payload && payload.clientId !== client.id) return;
			switch (type) {
				case "extraneous:send":
					client.send(payload.data);
					break;
				case "extraneous:close": client.close(payload.code, payload.reason);
			}
		};
		const abortController = new AbortController();
		this.channel.addEventListener("message", handleExtraneousMessage, { signal: abortController.signal });
		client.addEventListener("close", () => abortController.abort(), { once: true });
	}
};
var WebSocketRemoteClientConnection = class {
	constructor(id, url, channel) {
		this.id = id;
		this.url = url;
		this.channel = channel;
	}
	id;
	url;
	channel;
	send(data) {
		this.channel.postMessage({
			type: "extraneous:send",
			payload: {
				clientId: this.id,
				data
			}
		});
	}
	close(code, reason) {
		this.channel.postMessage({
			type: "extraneous:close",
			payload: {
				clientId: this.id,
				code,
				reason
			}
		});
	}
	addEventListener(_type, _listener, _options) {
		throw new Error("WebSocketRemoteClientConnection.addEventListener is not supported");
	}
	removeEventListener(_event, _listener, _options) {
		throw new Error("WebSocketRemoteClientConnection.removeEventListener is not supported");
	}
};
//#endregion
//#region node_modules/msw/lib/core/ws.mjs
var webSocketChannel = new BroadcastChannel("msw:websocket-client-manager");
if (hasRefCounted(webSocketChannel)) webSocketChannel.unref();
function createWebSocketLinkHandler(url) {
	invariant$1(url, "Expected a WebSocket server URL but got undefined");
	invariant$1(isPath(url), "Expected a WebSocket server URL to be a valid path but got %s", typeof url);
	const clientManager = new WebSocketClientManager(webSocketChannel);
	const upgradeHandler = http.get(({ request }) => {
		return request.headers.get("upgrade")?.toLowerCase() === "websocket" && matchRequestUrl(new URL(resolveWebSocketUrl$1(request.url)), url).matches;
	}, ws.onUpgrade);
	return {
		get clients() {
			return clientManager.clients;
		},
		addEventListener(event, listener) {
			const webSocketHandler = new WebSocketHandler(url);
			webSocketHandler[kEmitter$2].on("connection", async ({ client }) => {
				await clientManager.addConnection(client);
			});
			webSocketHandler[kEmitter$2].on(event, listener);
			return attachSiblingHandlers(webSocketHandler, [upgradeHandler]);
		},
		broadcast(data) {
			this.broadcastExcept([], data);
		},
		broadcastExcept(clients, data) {
			const ignoreClients = Array.prototype.concat(clients).map((client) => client.id);
			clientManager.clients.forEach((otherClient) => {
				if (!ignoreClients.includes(otherClient.id)) otherClient.send(data);
			});
		}
	};
}
var WEBSOCKET_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
var ws = {
	link: createWebSocketLinkHandler,
	async onUpgrade({ request }) {
		const key = request.headers.get("sec-websocket-key");
		if (!key) return;
		const keyBytes = new TextEncoder().encode(key + WEBSOCKET_GUID);
		const digest = await crypto.subtle.digest("SHA-1", keyBytes);
		const acceptValue = btoa(String.fromCharCode(...new Uint8Array(digest)));
		new WebSocket(resolveWebSocketUrl$1(request.url));
		return new FetchResponse$1(null, {
			status: 101,
			headers: {
				upgrade: "websocket",
				connection: "upgrade",
				"sec-websocket-accept": acceptValue
			}
		});
	}
};
//#endregion
//#region node_modules/msw/lib/core/delay.mjs
var SET_TIMEOUT_MAX_ALLOWED_INT = 2147483647;
function getRealisticResponseTime() {
	if (isNodeProcess$1()) return 5;
	return Math.floor(Math.random() * 300 + 100);
}
async function delay(durationOrMode) {
	let delayTime;
	if (typeof durationOrMode === "string") switch (durationOrMode) {
		case "infinite":
			delayTime = SET_TIMEOUT_MAX_ALLOWED_INT;
			break;
		case "real":
			delayTime = getRealisticResponseTime();
			break;
		default: throw new Error(`Failed to delay a response: unknown delay mode "${durationOrMode}". Please make sure you provide one of the supported modes ("real", "infinite") or a number.`);
	}
	else if (typeof durationOrMode === "undefined") delayTime = getRealisticResponseTime();
	else {
		if (durationOrMode > 2147483647) throw new Error(`Failed to delay a response: provided delay duration (${durationOrMode}) exceeds the maximum allowed duration for "setTimeout" (${SET_TIMEOUT_MAX_ALLOWED_INT}). This will cause the response to be returned immediately. Please use a number within the allowed range to delay the response by exact duration, or consider the "infinite" delay mode to delay the response indefinitely.`);
		delayTime = durationOrMode;
	}
	return new Promise((resolve) => {
		const timeoutId = setTimeout(resolve, delayTime);
		if (delayTime === 2147483647 && isNodeProcess$1() && hasRefCounted(timeoutId)) timeoutId.unref();
	});
}
//#endregion
export { HttpResponse as a, setupWorker as i, ws as n, http as r, delay as t };
