"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.activate = activate;

var _vscode = require("vscode");

var _useLSP = _interopRequireDefault(require("./common/useLSP"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function activate(context) {
  if ((0, _useLSP.default)()) {
    require('./flowLSP').activate(context);
  } else {
    require('./flowNonLSP').activate(context);
  }
}
//# sourceMappingURL=index.js.map