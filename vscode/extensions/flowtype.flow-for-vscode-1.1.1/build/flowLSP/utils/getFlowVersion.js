"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getFlowVersion;

var _binVersion = _interopRequireDefault(require("bin-version"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getFlowVersion(flowPath) {
  return (0, _binVersion.default)(flowPath);
}
//# sourceMappingURL=getFlowVersion.js.map