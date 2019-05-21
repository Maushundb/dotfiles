"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function createAutoLoadCache(loader) {
    const cache = new Map();
    return {
        get: (key) => {
            const found = cache.get(key);
            if (found)
                return found;
            const value = loader(key);
            cache.set(key, value);
            return value;
        },
        has: (key) => cache.has(key),
        delete: (key) => cache.delete(key),
        clear: () => cache.clear(),
    };
}
exports.createAutoLoadCache = createAutoLoadCache;
const notSet = Symbol('Value Not Set');
function createLazy(loader) {
    let v = notSet;
    return {
        get: () => {
            if (v === notSet) {
                v = loader();
            }
            return v;
        },
        clear: () => v = notSet,
    };
}
exports.createLazy = createLazy;
//# sourceMappingURL=autoLoadCache.js.map