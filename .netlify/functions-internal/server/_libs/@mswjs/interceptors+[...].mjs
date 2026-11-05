//#region node_modules/outvariant/lib/index.mjs
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
function cleanErrorStack(error) {
	if (!error.stack) return;
	const nextStack = error.stack.split("\n");
	nextStack.splice(1, STACK_FRAMES_TO_IGNORE);
	error.stack = nextStack.join("\n");
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
		let error;
		try {
			error = Reflect.construct(ErrorConstructor, [formatMessage]);
		} catch (err) {
			error = ErrorConstructor(formatMessage);
		}
		throw error;
	}
};
//#endregion
//#region node_modules/is-node-process/lib/index.mjs
function isNodeProcess() {
	if (typeof navigator !== "undefined" && navigator.product === "ReactNative") return true;
	if (typeof process !== "undefined") {
		const type = process.type;
		if (type === "renderer" || type === "worker") return false;
		return !!(process.versions && process.versions.node);
	}
	return false;
}
//#endregion
//#region node_modules/@open-draft/logger/lib/index.mjs
var __defProp = Object.defineProperty;
var __export = (target, all) => {
	for (var name in all) __defProp(target, name, {
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
//#endregion
//#region node_modules/strict-event-emitter/lib/index.mjs
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
//#endregion
//#region node_modules/msw/node_modules/@mswjs/interceptors/node_modules/@open-draft/deferred-promise/build/index.mjs
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
//#endregion
//#region node_modules/msw/node_modules/@mswjs/interceptors/lib/node/fetchUtils-BKJ1XmiO.mjs
function getGlobalSymbol$1(symbol) {
	return globalThis[symbol] || void 0;
}
function setGlobalSymbol$1(symbol, value) {
	globalThis[symbol] = value;
}
function deleteGlobalSymbol$1(symbol) {
	delete globalThis[symbol];
}
var InterceptorReadyState$2 = /* @__PURE__ */ function(InterceptorReadyState$1) {
	InterceptorReadyState$1["INACTIVE"] = "INACTIVE";
	InterceptorReadyState$1["APPLYING"] = "APPLYING";
	InterceptorReadyState$1["APPLIED"] = "APPLIED";
	InterceptorReadyState$1["DISPOSING"] = "DISPOSING";
	InterceptorReadyState$1["DISPOSED"] = "DISPOSED";
	return InterceptorReadyState$1;
}({});
var Interceptor$1 = class {
	constructor(symbol) {
		this.symbol = symbol;
		this.readyState = InterceptorReadyState$2.INACTIVE;
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
		if (this.readyState === InterceptorReadyState$2.APPLIED) {
			logger.info("intercepted already applied!");
			return;
		}
		if (!this.checkEnvironment()) {
			logger.info("the interceptor cannot be applied in this environment!");
			return;
		}
		this.readyState = InterceptorReadyState$2.APPLYING;
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
			this.readyState = InterceptorReadyState$2.APPLIED;
			return;
		}
		logger.info("no running instance found, setting up a new instance...");
		this.setup();
		this.setInstance();
		this.readyState = InterceptorReadyState$2.APPLIED;
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
		if (this.readyState === InterceptorReadyState$2.DISPOSING || this.readyState === InterceptorReadyState$2.DISPOSED) {
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
		if (this.readyState === InterceptorReadyState$2.DISPOSED) {
			logger.info("cannot dispose, already disposed!");
			return;
		}
		logger.info("disposing the interceptor...");
		this.readyState = InterceptorReadyState$2.DISPOSING;
		if (!this.getInstance()) {
			logger.info("no interceptors running, skipping dispose...");
			return;
		}
		this.clearInstance();
		logger.info("global symbol deleted:", getGlobalSymbol$1(this.symbol));
		if (this.subscriptions.length > 0) {
			logger.info("disposing of %d subscriptions...", this.subscriptions.length);
			for (const dispose of this.subscriptions) dispose();
			this.subscriptions = [];
			logger.info("disposed of all subscriptions!", this.subscriptions.length);
		}
		this.emitter.removeAllListeners();
		logger.info("destroyed the listener!");
		this.readyState = InterceptorReadyState$2.DISPOSED;
	}
	getInstance() {
		const instance = getGlobalSymbol$1(this.symbol);
		this.logger.info("retrieved global instance:", instance?.constructor?.name);
		return instance;
	}
	setInstance() {
		setGlobalSymbol$1(this.symbol, this);
		this.logger.info("set global instance!", this.symbol.description);
	}
	clearInstance() {
		deleteGlobalSymbol$1(this.symbol);
		this.logger.info("cleared global instance!", this.symbol.description);
	}
};
var InterceptorError = class InterceptorError extends Error {
	constructor(message) {
		super(message);
		this.name = "InterceptorError";
		Object.setPrototypeOf(this, InterceptorError.prototype);
	}
};
(class RequestController {
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
		this.readyState = RequestController.PENDING;
		this.handled = new DeferredPromise();
	}
	get #handled() {
		return this.handled;
	}
	/**
	* Perform this request as-is.
	*/
	async passthrough() {
		invariant.as(InterceptorError, this.readyState === RequestController.PENDING, "Failed to passthrough the \"%s %s\" request: the request has already been handled", this.request.method, this.request.url);
		this.readyState = RequestController.PASSTHROUGH;
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
		invariant.as(InterceptorError, this.readyState === RequestController.PENDING, "Failed to respond to the \"%s %s\" request with \"%d %s\": the request has already been handled (%d)", this.request.method, this.request.url, response.status, response.statusText || "OK", this.readyState);
		this.readyState = RequestController.RESPONSE;
		this.#handled.resolve();
		/**
		* @note Although `source.respondWith()` is potentially asynchronous,
		* do NOT await it for backward-compatibility. Awaiting it will short-circuit
		* the request listener invocation as soon as a listener responds to a request.
		* Ideally, that's what we want, but that's not what we promise the user.
		*/
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
		invariant.as(InterceptorError, this.readyState === RequestController.PENDING, "Failed to error the \"%s %s\" request with \"%s\": the request has already been handled (%d)", this.request.method, this.request.url, reason?.toString(), this.readyState);
		this.readyState = RequestController.ERROR;
		this.source.errorWith(reason);
		this.#handled.resolve();
	}
});
/**
* Generate a random ID string to represent a request.
* @example
* createRequestId()
* // "f774b6c9c600f"
*/
function createRequestId$1() {
	return Math.random().toString(16).slice(2);
}
/**
* Returns a boolean indicating whether the given URL string
* can be parsed into a `URL` instance.
* A substitute for `URL.canParse()` for Node.js 18.
*/
function canParseUrl(url) {
	try {
		new URL(url);
		return true;
	} catch (_error) {
		return false;
	}
}
/**
* Returns the value behind the symbol with the given name.
*/
function getValueBySymbol(symbolName, source) {
	const symbol = Object.getOwnPropertySymbols(source).find((symbol$1) => {
		return symbol$1.description === symbolName;
	});
	if (symbol) return Reflect.get(source, symbol);
}
var kStatus = Symbol("kStatus");
var kUrl = Symbol("kUrl");
var FetchResponse = class FetchResponse extends Response {
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
		return FetchResponse.STATUS_CODES_WITH_REDIRECT.includes(status);
	}
	/**
	* Returns a boolean indicating whether the given response status
	* code represents a response that can have a body.
	*/
	static isResponseWithBody(status) {
		return !FetchResponse.STATUS_CODES_WITHOUT_BODY.includes(status);
	}
	static setStatus(status, response) {
		/**
		* @note Undici keeps an internal "Symbol(state)" that holds
		* the actual value of response status. Update that in Node.js.
		*/
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
		} catch (error) {
			return Response.json(error instanceof Error ? {
				name: error.name,
				message: error.message,
				stack: error.stack
			} : {}, {
				status: 500,
				statusText: "Unclonable Response"
			});
		}
	}
	constructor(body, init = {}) {
		const status = init.status ?? 200;
		const safeStatus = FetchResponse.isConfigurableStatusCode(status) ? status : 200;
		const finalBody = FetchResponse.isResponseWithBody(status) ? body : null;
		super(finalBody, {
			status: safeStatus,
			statusText: init.statusText,
			headers: init.headers
		});
		/**
		* Since Node.js v24, Undici stores the Response state in an inaccessible field "#state".
		* Forward the modified status/URL to the cloned response manually.
		* @see https://github.com/nodejs/undici/blob/f734c87280e626c75f59aad55b65eb6a89cef392/lib/web/fetch/response.js#L242
		*/
		if (status !== safeStatus) FetchResponse.setStatus(status, this);
		FetchResponse.setUrl(init.url, this);
	}
	clone() {
		const clonedResponse = super.clone();
		const customStatus = Reflect.get(this, kStatus);
		if (customStatus) FetchResponse.setStatus(customStatus, clonedResponse);
		const customUrl = Reflect.get(this, kUrl);
		if (customUrl) FetchResponse.setUrl(customUrl, clonedResponse);
		return clonedResponse;
	}
};
//#endregion
//#region node_modules/msw/node_modules/@mswjs/interceptors/lib/node/BatchInterceptor-C4-RX5rg.mjs
/**
* A batch interceptor that exposes a single interface
* to apply and operate with multiple interceptors at once.
*/
var BatchInterceptor = class BatchInterceptor extends Interceptor$1 {
	constructor(options) {
		BatchInterceptor.symbol = Symbol.for(options.name);
		super(BatchInterceptor.symbol);
		this.interceptors = options.interceptors;
	}
	setup() {
		const logger = this.logger.extend("setup");
		logger.info("applying all %d interceptors...", this.interceptors.length);
		for (const interceptor of this.interceptors) {
			logger.info("applying \"%s\" interceptor...", interceptor.constructor.name);
			interceptor.apply();
			logger.info("adding interceptor dispose subscription");
			this.subscriptions.push(() => interceptor.dispose());
		}
	}
	on(event, listener) {
		for (const interceptor of this.interceptors) interceptor.on(event, listener);
		return this;
	}
	once(event, listener) {
		for (const interceptor of this.interceptors) interceptor.once(event, listener);
		return this;
	}
	off(event, listener) {
		for (const interceptor of this.interceptors) interceptor.off(event, listener);
		return this;
	}
	removeAllListeners(event) {
		for (const interceptors of this.interceptors) interceptors.removeAllListeners(event);
		return this;
	}
};
new TextEncoder();
//#endregion
//#region node_modules/msw/node_modules/@mswjs/interceptors/lib/node/index.mjs
/**
* Removes query parameters and hashes from a given URL.
*/
function getCleanUrl(url, isAbsolute = true) {
	return [isAbsolute && url.origin, url.pathname].filter(Boolean).join("");
}
/**
* Resolve potentially relative WebSocket URLs the same way
* the browser does (replace the protocol, use the origin, etc).
*
* @see https://websockets.spec.whatwg.org//#dom-websocket-websocket
*/
function resolveWebSocketUrl$1(url) {
	if (typeof url === "string") return resolveWebSocketUrl$1(new URL(url, typeof location !== "undefined" ? location.href : void 0));
	if (url.protocol === "http:") url.protocol = "ws:";
	else if (url.protocol === "https:") url.protocol = "wss:";
	if (url.protocol !== "ws:" && url.protocol !== "wss:")
 /**
	* @note These errors are modeled after the browser errors.
	* The exact error messages aren't provided in the specification.
	* Node.js uses more obscure error messages that I don't wish to replicate.
	*/
	throw new SyntaxError(`Failed to construct 'WebSocket': The URL's scheme must be either 'http', 'https', 'ws', or 'wss'. '${url.protocol}' is not allowed.`);
	if (url.hash !== "") throw new SyntaxError(`Failed to construct 'WebSocket': The URL contains a fragment identifier ('${url.hash}'). Fragment identifiers are not allowed in WebSocket URLs.`);
	return url.href;
}
//#endregion
//#region node_modules/msw/node_modules/@mswjs/interceptors/lib/browser/createRequestId-DYCsFHOi.mjs
function getGlobalSymbol(symbol) {
	return globalThis[symbol] || void 0;
}
function setGlobalSymbol(symbol, value) {
	globalThis[symbol] = value;
}
function deleteGlobalSymbol(symbol) {
	delete globalThis[symbol];
}
var InterceptorReadyState = /* @__PURE__ */ function(InterceptorReadyState$1) {
	InterceptorReadyState$1["INACTIVE"] = "INACTIVE";
	InterceptorReadyState$1["APPLYING"] = "APPLYING";
	InterceptorReadyState$1["APPLIED"] = "APPLIED";
	InterceptorReadyState$1["DISPOSING"] = "DISPOSING";
	InterceptorReadyState$1["DISPOSED"] = "DISPOSED";
	return InterceptorReadyState$1;
}({});
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
/**
* Generate a random ID string to represent a request.
* @example
* createRequestId()
* // "f774b6c9c600f"
*/
function createRequestId() {
	return Math.random().toString(16).slice(2);
}
//#endregion
//#region node_modules/msw/node_modules/@mswjs/interceptors/lib/browser/resolveWebSocketUrl-C83-x9iE.mjs
/**
* Resolve potentially relative WebSocket URLs the same way
* the browser does (replace the protocol, use the origin, etc).
*
* @see https://websockets.spec.whatwg.org//#dom-websocket-websocket
*/
function resolveWebSocketUrl(url) {
	if (typeof url === "string") return resolveWebSocketUrl(new URL(url, typeof location !== "undefined" ? location.href : void 0));
	if (url.protocol === "http:") url.protocol = "ws:";
	else if (url.protocol === "https:") url.protocol = "wss:";
	if (url.protocol !== "ws:" && url.protocol !== "wss:")
 /**
	* @note These errors are modeled after the browser errors.
	* The exact error messages aren't provided in the specification.
	* Node.js uses more obscure error messages that I don't wish to replicate.
	*/
	throw new SyntaxError(`Failed to construct 'WebSocket': The URL's scheme must be either 'http', 'https', 'ws', or 'wss'. '${url.protocol}' is not allowed.`);
	if (url.hash !== "") throw new SyntaxError(`Failed to construct 'WebSocket': The URL contains a fragment identifier ('${url.hash}'). Fragment identifiers are not allowed in WebSocket URLs.`);
	return url.href;
}
//#endregion
//#region node_modules/msw/node_modules/@mswjs/interceptors/lib/browser/hasConfigurableGlobal-C8zq1MCg.mjs
/**
* Emits an event on the given emitter but executes
* the listeners sequentially. This accounts for asynchronous
* listeners (e.g. those having "sleep" and handling the request).
*/
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
			if (match.owner === owner)
 /**
			* @note Restoring non-configurable properties works as long as "writable: true"
			* and none of the other descriptor properties except for "value" have changed.
			*/
			Object.defineProperty(match.owner, key, match.descriptor);
			else
 /**
			* @todo Delete the proxy property set by the registry.
			* If the match's owner isn't the original owner, the property is likely nested in the prototype.
			* The registry does not meddle with those, they are left intact.
			*/
			Reflect.deleteProperty(owner, key);
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
		} catch (error) {
			if (error instanceof Error) errors.push(error);
			else throw error;
		}
		if (errors.length > 0) throw new AggregateError(errors, "FOO!");
	}
};
var patchesRegistry = new PatchesRegistry();
/**
* Returns a property descriptor for the given property on the owner.
* Walks down the prototype chain if the property does not exist on the owner.
* Handy for getting a global property descriptor where `globalThis` is
* replaced with a controlled class (e.g. ServiceWorkerGlobalScope).
*/
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
/**
* Returns a boolean indicating whether the given global property
* is defined and is configurable.
*/
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
//#endregion
//#region node_modules/msw/node_modules/@mswjs/interceptors/lib/browser/interceptors/WebSocket/index.mjs
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
var kCancelable = Symbol("kCancelable");
var kDefaultPrevented = Symbol("kDefaultPrevented");
/**
* A `MessageEvent` superset that supports event cancellation
* in Node.js. It's rather non-intrusive so it can be safely
* used in the browser as well.
*
* @see https://github.com/nodejs/node/issues/51767
*/
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
var kEmitter$1 = Symbol("kEmitter");
var kBoundListener$1 = Symbol("kBoundListener");
/**
* The WebSocket client instance represents an incoming
* client connection. The user can control the connection,
* send and receive events.
*/
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
		/**
		* Emit the "close" event on the "client" connection
		* whenever the underlying transport is closed.
		* @note "client.close()" does NOT dispatch the "close"
		* event on the WebSocket because it uses non-configurable
		* close status code. Thus, we listen to the transport
		* instead of the WebSocket's "close" event.
		*/
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
var kPassthroughPromise = Symbol("kPassthroughPromise");
var kOnSend = Symbol("kOnSend");
var kClose = Symbol("kClose");
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
			/**
			* @note Check that nothing has prevented this connection
			* (e.g. called `client.close()` in the connection listener).
			* If the connection has been prevented, never dispatch the open event,.
			*/
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
			/**
			* @note Notify the parent about outgoing data.
			* This notifies the transport and the connection
			* listens to the outgoing data to emit the "message" event.
			*/
			this[kOnSend]?.(data);
		});
	}
	close(code = 1e3, reason) {
		invariant(code, WEBSOCKET_CLOSE_CODE_RANGE_ERROR);
		invariant(code === 1e3 || code >= 3e3 && code <= 4999, WEBSOCKET_CLOSE_CODE_RANGE_ERROR);
		this[kClose](code, reason);
	}
	[kClose](code = 1e3, reason, wasClean = true) {
		/**
		* @note Move this check here so that even internal closures,
		* like those triggered by the `server` connection, are not
		* performed twice.
		*/
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
var kEmitter = Symbol("kEmitter");
var kBoundListener = Symbol("kBoundListener");
var kSend = Symbol("kSend");
/**
* The WebSocket server instance represents the actual production
* WebSocket server connection. It's idle by default but you can
* establish it by calling `server.connect()`.
*/
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
				if (!event.defaultPrevented)
 /**
				* @note Use the internal send mechanism so consumers can tell
				* apart direct user calls to `server.send()` and internal calls.
				* E.g. MSW has to ignore this internal call to log out messages correctly.
				*/
				this[kSend](event.data);
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
		/**
		* @note Emit "message" event on the server connection
		* instance to let the interceptor know about these
		* incoming events from the original server. In that listener,
		* the interceptor can modify or skip the event forwarding
		* to the mock WebSocket instance.
		*/
		this[kEmitter].dispatchEvent(messageEvent);
		/**
		* @note Forward the incoming server events to the client.
		* Preventing the default on the message event stops this.
		*/
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
/**
* Abstraction over the given mock `WebSocket` instance that allows
* for controlling that instance (e.g. sending and receiving messages).
*/
var WebSocketClassTransport = class extends EventTarget {
	constructor(socket) {
		super();
		this.socket = socket;
		this.socket.addEventListener("close", (event) => {
			this.dispatchEvent(bindEvent(this.socket, new CloseEvent("close", event)));
		});
		/**
		* Emit the "outgoing" event on the transport
		* whenever the WebSocket client sends data ("ws.send()").
		*/
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
		/**
		* @note Call the internal close method directly
		* to allow closing the connection with the status codes
		* that are non-configurable by the user (> 1000 <= 1015).
		*/
		this.socket[kClose](code, reason);
	}
};
(class WebSocketInterceptor extends Interceptor {
	static {
		this.symbol = Symbol.for("websocket-interceptor");
	}
	constructor() {
		super(WebSocketInterceptor.symbol);
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
				} catch (error) {
					/**
					* @note Translate unhandled exceptions during the connection
					* handling (i.e. interceptor exceptions) as WebSocket connection
					* closures with error. This prevents from the exceptions occurring
					* in `queueMicrotask` from being process-wide and uncatchable.
					*/
					if (error instanceof Error) {
						socket.dispatchEvent(new Event("error"));
						if (socket.readyState !== WebSocket.CLOSING && socket.readyState !== WebSocket.CLOSED) socket[kClose](1011, error.message, false);
						console.error(error);
					}
				}
			});
			return socket;
		} });
		logger.info("patching global WebSocket...");
		this.subscriptions.push(patchesRegistry.applyPatch(globalThis, "WebSocket", () => WebSocketProxy));
		logger.info("global WebSocket patched!", globalThis.WebSocket.name);
	}
});
//#endregion
export { createRequestId$1 as a, format as c, FetchResponse as i, invariant as l, resolveWebSocketUrl$1 as n, Emitter as o, BatchInterceptor as r, isNodeProcess as s, getCleanUrl as t };
