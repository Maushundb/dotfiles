"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {
  LanguageClient: true
};
Object.defineProperty(exports, "LanguageClient", {
  enumerable: true,
  get: function () {
    return _Client.default;
  }
});

var _types = require("./types");

Object.keys(_types).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _types[key];
    }
  });
});

var _Client = _interopRequireDefault(require("./Client"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
//# sourceMappingURL=index.js.map