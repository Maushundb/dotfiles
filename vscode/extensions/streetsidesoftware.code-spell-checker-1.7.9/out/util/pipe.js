"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function defaultTo(value) {
    return (v) => v === undefined ? value : v;
}
exports.defaultTo = defaultTo;
function extract(key) {
    if (arguments.length > 1) {
        const args = [...arguments];
        return (t) => {
            let v = t;
            for (const k of args) {
                v = v === undefined ? undefined : v[k];
            }
            return v;
        };
    }
    return (t) => t === undefined ? undefined : t[key];
}
exports.extract = extract;
function map(fn) {
    return (t) => t === undefined ? undefined : fn(t);
}
exports.map = map;
function pipe(t) {
    if (arguments.length > 1) {
        const fns = [...arguments].slice(1);
        let v = t;
        for (const fn of fns) {
            v = fn(v);
        }
        return v;
    }
    return t;
}
exports.pipe = pipe;
//# sourceMappingURL=pipe.js.map