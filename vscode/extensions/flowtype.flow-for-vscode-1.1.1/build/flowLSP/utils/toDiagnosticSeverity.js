"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = toDiagnosticSeverity;

var vscode = _interopRequireWildcard(require("vscode"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function toDiagnosticSeverity(val, defaultVal) {
  switch (val) {
    case 'error':
      return vscode.DiagnosticSeverity.Error;

    case 'warn':
      return vscode.DiagnosticSeverity.Warning;

    case 'info':
      return vscode.DiagnosticSeverity.Information;

    default:
      return defaultVal;
  }
}
//# sourceMappingURL=toDiagnosticSeverity.js.map