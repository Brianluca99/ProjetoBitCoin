//#region node_modules/set-cookie-parser/lib/set-cookie.js
var defaultParseOptions = {
	decodeValues: true,
	map: false,
	silent: false,
	split: "auto"
};
function isForbiddenKey(key) {
	return typeof key !== "string" || key in {};
}
function createNullObj() {
	return Object.create(null);
}
function isNonEmptyString(str) {
	return typeof str === "string" && !!str.trim();
}
function parseString(setCookieValue, options) {
	var parts = setCookieValue.split(";");
	var nameValuePairStr = parts.shift();
	if (!isNonEmptyString(nameValuePairStr)) return null;
	var parsed = parseNameValuePair(nameValuePairStr);
	var name = parsed.name;
	var value = parsed.value;
	options = options ? Object.assign({}, defaultParseOptions, options) : defaultParseOptions;
	if (isForbiddenKey(name)) {
		if (!options.silent) console.warn("set-cookie-parser: dropping cookie due to name:", name);
		return null;
	}
	try {
		value = options.decodeValues ? decodeURIComponent(value) : value;
	} catch (e) {
		if (!options.silent) console.error("set-cookie-parser: failed to decode cookie value. Set options.decodeValues=false to disable decoding.", e);
	}
	var cookie = createNullObj();
	cookie.name = name;
	cookie.value = value;
	parts.forEach(function(part) {
		var sides = part.split("=");
		var key = sides.shift().trim().toLowerCase();
		if (isForbiddenKey(key) || key === "name" || key === "value") {
			if (!options.silent) console.warn("set-cookie-parser: ignoring attribute:", part);
			return;
		}
		var value = sides.join("=").trim();
		if (key === "expires") {
			var expires = new Date(value);
			if (Number.isNaN(expires.getTime())) {
				if (!options.silent) console.error("set-cookie-parser: failed to parse expires time:", value);
			} else cookie.expires = expires;
		} else if (key === "max-age") {
			if (/^-?\d+$/.test(value)) cookie.maxAge = parseInt(value, 10);
			else if (!options.silent) console.error("set-cookie-parser: failed to parse max-age:", value);
		} else if (key === "secure") cookie.secure = true;
		else if (key === "httponly") cookie.httpOnly = true;
		else if (key === "samesite") cookie.sameSite = value;
		else if (key === "partitioned") cookie.partitioned = true;
		else if (key) cookie[key] = value;
	});
	return cookie;
}
function parseNameValuePair(nameValuePairStr) {
	var name = "";
	var value = "";
	var nameValueArr = nameValuePairStr.split("=");
	if (nameValueArr.length > 1) {
		name = nameValueArr.shift();
		value = nameValueArr.join("=");
	} else value = nameValuePairStr;
	return {
		name: trimWsp(name),
		value: trimWsp(value)
	};
}
function trimWsp(str) {
	var start = 0;
	var end = str.length;
	while (start < end && isWsp(str.charCodeAt(start))) start += 1;
	while (end > start && isWsp(str.charCodeAt(end - 1))) end -= 1;
	return str.substring(start, end);
}
function isWsp(code) {
	return code === 32 || code === 9;
}
function parseSetCookie(input, options) {
	options = options ? Object.assign({}, defaultParseOptions, options) : defaultParseOptions;
	if (!input) if (!options.map) return [];
	else return createNullObj();
	if (input.headers) if (typeof input.headers.getSetCookie === "function") input = input.headers.getSetCookie();
	else if (input.headers["set-cookie"]) input = input.headers["set-cookie"];
	else {
		var sch = input.headers[Object.keys(input.headers).find(function(key) {
			return key.toLowerCase() === "set-cookie";
		})];
		if (!sch && input.headers.cookie && !options.silent) console.warn("Warning: set-cookie-parser appears to have been called on a request object. It is designed to parse Set-Cookie headers from responses, not Cookie headers from requests.");
		input = sch;
	}
	var split = options.split;
	var isArray = Array.isArray(input);
	if (split === "auto") split = !isArray;
	if (!isArray) input = [input];
	input = input.filter(isNonEmptyString);
	if (split) input = input.map(splitCookiesString).flat();
	if (!options.map) return input.map(function(str) {
		return parseString(str, options);
	}).filter(Boolean);
	else {
		var cookies = createNullObj();
		return input.reduce(function(cookies, str) {
			var cookie = parseString(str, options);
			if (cookie) cookies[cookie.name] = cookie;
			return cookies;
		}, cookies);
	}
}
function splitCookiesString(cookiesString) {
	if (Array.isArray(cookiesString)) return cookiesString;
	if (typeof cookiesString !== "string") return [];
	var cookiesStrings = [];
	var pos = 0;
	var start;
	var ch;
	var lastComma;
	var nextStart;
	var cookiesSeparatorFound;
	function skipWhitespace() {
		while (pos < cookiesString.length && /\s/.test(cookiesString.charAt(pos))) pos += 1;
		return pos < cookiesString.length;
	}
	function notSpecialChar() {
		ch = cookiesString.charAt(pos);
		return ch !== "=" && ch !== ";" && ch !== ",";
	}
	while (pos < cookiesString.length) {
		start = pos;
		cookiesSeparatorFound = false;
		while (skipWhitespace()) {
			ch = cookiesString.charAt(pos);
			if (ch === ",") {
				lastComma = pos;
				pos += 1;
				skipWhitespace();
				nextStart = pos;
				while (pos < cookiesString.length && notSpecialChar()) pos += 1;
				if (pos < cookiesString.length && cookiesString.charAt(pos) === "=") {
					cookiesSeparatorFound = true;
					pos = nextStart;
					cookiesStrings.push(cookiesString.substring(start, lastComma));
					start = pos;
				} else pos = lastComma + 1;
			} else pos += 1;
		}
		if (!cookiesSeparatorFound || pos >= cookiesString.length) cookiesStrings.push(cookiesString.substring(start, cookiesString.length));
	}
	return cookiesStrings;
}
parseSetCookie.parseSetCookie = parseSetCookie;
parseSetCookie.parse = parseSetCookie;
parseSetCookie.parseString = parseString;
parseSetCookie.splitCookiesString = splitCookiesString;
//#endregion
//#region node_modules/headers-polyfill/lib/index.mjs
var HEADERS_INVALID_CHARACTERS = /[^a-z0-9\-#$%&'*+.^_`|~]/i;
function normalizeHeaderName(name) {
	if (HEADERS_INVALID_CHARACTERS.test(name) || name.trim() === "") throw new TypeError("Invalid character in header field name");
	return name.trim().toLowerCase();
}
var charCodesToRemove = [
	String.fromCharCode(10),
	String.fromCharCode(13),
	String.fromCharCode(9),
	String.fromCharCode(32)
];
var HEADER_VALUE_REMOVE_REGEXP = new RegExp(`(^[${charCodesToRemove.join("")}]|$[${charCodesToRemove.join("")}])`, "g");
/**
* Normalize the given header value.
* @see https://fetch.spec.whatwg.org/#concept-header-value-normalize
*/
function normalizeHeaderValue(value) {
	return value.replace(HEADER_VALUE_REMOVE_REGEXP, "");
}
/**
* Validate the given header name.
* @see https://fetch.spec.whatwg.org/#header-name
*/
function isValidHeaderName(value) {
	if (typeof value !== "string") return false;
	if (value.length === 0) return false;
	for (let i = 0; i < value.length; i++) {
		const character = value.charCodeAt(i);
		if (character > 127 || !isToken(character)) return false;
	}
	return true;
}
function isToken(value) {
	return ![
		127,
		32,
		"(",
		")",
		"<",
		">",
		"@",
		",",
		";",
		":",
		"\\",
		"\"",
		"/",
		"[",
		"]",
		"?",
		"=",
		"{",
		"}"
	].includes(value);
}
/**
* Validate the given header value.
* @see https://fetch.spec.whatwg.org/#header-value
*/
function isValidHeaderValue(value) {
	if (typeof value !== "string") return false;
	if (value.trim() !== value) return false;
	for (let i = 0; i < value.length; i++) {
		const character = value.charCodeAt(i);
		if (character === 0 || character === 10 || character === 13) return false;
	}
	return true;
}
var _Symbol$toStringTag;
var NORMALIZED_HEADERS = Symbol("normalizedHeaders");
var RAW_HEADER_NAMES = Symbol("rawHeaderNames");
var HEADER_VALUE_DELIMITER = ", ";
var Headers = class Headers {
	constructor(init) {
		this[NORMALIZED_HEADERS] = {};
		this[RAW_HEADER_NAMES] = /* @__PURE__ */ new Map();
		this[_Symbol$toStringTag] = "Headers";
		/**
		* @note Cannot necessarily check if the `init` is an instance of the
		* `Headers` because that class may not be defined in Node or jsdom.
		*/
		if (["Headers", "HeadersPolyfill"].includes(init?.constructor?.name) || init instanceof Headers || typeof globalThis.Headers !== "undefined" && init instanceof globalThis.Headers) init.forEach((value, name) => {
			this.append(name, value);
		}, this);
		else if (Array.isArray(init)) init.forEach(([name, value]) => {
			this.append(name, Array.isArray(value) ? value.join(HEADER_VALUE_DELIMITER) : value);
		});
		else if (init) Object.getOwnPropertyNames(init).forEach((name) => {
			const value = init[name];
			this.append(name, Array.isArray(value) ? value.join(HEADER_VALUE_DELIMITER) : value);
		});
	}
	[(_Symbol$toStringTag = Symbol.toStringTag, Symbol.iterator)]() {
		return this.entries();
	}
	*keys() {
		for (const [name] of this.entries()) yield name;
	}
	*values() {
		for (const [, value] of this.entries()) yield value;
	}
	*entries() {
		let sortedKeys = Object.keys(this[NORMALIZED_HEADERS]).sort((a, b) => a.localeCompare(b));
		for (const name of sortedKeys) if (name === "set-cookie") for (const value of this.getSetCookie()) yield [name, value];
		else yield [name, this.get(name)];
	}
	/**
	* Returns a boolean stating whether a `Headers` object contains a certain header.
	*/
	has(name) {
		if (!isValidHeaderName(name)) throw new TypeError(`Invalid header name "${name}"`);
		return this[NORMALIZED_HEADERS].hasOwnProperty(normalizeHeaderName(name));
	}
	/**
	* Returns a `ByteString` sequence of all the values of a header with a given name.
	*/
	get(name) {
		if (!isValidHeaderName(name)) throw TypeError(`Invalid header name "${name}"`);
		return this[NORMALIZED_HEADERS][normalizeHeaderName(name)] ?? null;
	}
	/**
	* Sets a new value for an existing header inside a `Headers` object, or adds the header if it does not already exist.
	*/
	set(name, value) {
		if (!isValidHeaderName(name) || !isValidHeaderValue(value)) return;
		const normalizedName = normalizeHeaderName(name);
		const normalizedValue = normalizeHeaderValue(value);
		this[NORMALIZED_HEADERS][normalizedName] = normalizeHeaderValue(normalizedValue);
		this[RAW_HEADER_NAMES].set(normalizedName, name);
	}
	/**
	* Appends a new value onto an existing header inside a `Headers` object, or adds the header if it does not already exist.
	*/
	append(name, value) {
		if (!isValidHeaderName(name) || !isValidHeaderValue(value)) return;
		const normalizedName = normalizeHeaderName(name);
		const normalizedValue = normalizeHeaderValue(value);
		let resolvedValue = this.has(normalizedName) ? `${this.get(normalizedName)}, ${normalizedValue}` : normalizedValue;
		this.set(name, resolvedValue);
	}
	/**
	* Deletes a header from the `Headers` object.
	*/
	delete(name) {
		if (!isValidHeaderName(name)) return;
		if (!this.has(name)) return;
		const normalizedName = normalizeHeaderName(name);
		delete this[NORMALIZED_HEADERS][normalizedName];
		this[RAW_HEADER_NAMES].delete(normalizedName);
	}
	/**
	* Traverses the `Headers` object,
	* calling the given callback for each header.
	*/
	forEach(callback, thisArg) {
		for (const [name, value] of this.entries()) callback.call(thisArg, value, name, this);
	}
	/**
	* Returns an array containing the values
	* of all Set-Cookie headers associated
	* with a response
	*/
	getSetCookie() {
		const setCookieHeader = this.get("set-cookie");
		if (setCookieHeader === null) return [];
		if (setCookieHeader === "") return [""];
		return splitCookiesString(setCookieHeader);
	}
};
//#endregion
export { Headers as t };
