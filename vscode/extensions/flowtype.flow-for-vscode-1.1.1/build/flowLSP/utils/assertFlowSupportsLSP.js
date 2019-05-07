"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = assertFlowSupportsLSP;

var _semver = _interopRequireDefault(require("semver"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const FLOW_VERSION_FOR_LSP = '>=0.75';

function assertFlowSupportsLSP(version) {
  if (!_semver.default.satisfies(version, FLOW_VERSION_FOR_LSP)) {
    throw new Error(`Flow version ${version} doesn't support 'flow lsp'.` + ` Please upgrade flow to version ${FLOW_VERSION_FOR_LSP}.`);
  }
}
//# sourceMappingURL=assertFlowSupportsLSP.js.map