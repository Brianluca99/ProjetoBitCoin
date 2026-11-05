//#region node_modules/msw/node_modules/@open-draft/deferred-promise/build/index.mjs
function createDeferredExecutor() {
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
export { DeferredPromise as t };
