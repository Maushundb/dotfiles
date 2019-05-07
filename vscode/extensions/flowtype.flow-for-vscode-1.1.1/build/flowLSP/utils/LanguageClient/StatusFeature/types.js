"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LspMessageType = void 0;
// window/showStatus is a Nuclide-specific extension to LSP
// for reporting whether the LSP server is ready to handle requests
const LspMessageType = {
  // An error message.
  Error: 1,
  // A warning message.
  Warning: 2,
  // An information message.
  Info: 3,
  // A log message.
  Log: 4
};
exports.LspMessageType = LspMessageType;
//# sourceMappingURL=types.js.map