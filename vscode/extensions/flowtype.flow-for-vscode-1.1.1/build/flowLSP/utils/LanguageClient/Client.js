"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _vscodeLanguageclient = require("vscode-languageclient");

var _TypeCoverageFeature = _interopRequireDefault(require("./TypeCoverageFeature"));

var _StatusFeature = _interopRequireDefault(require("./StatusFeature"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Extend VscodeLanguageClient to add support for
// 1) TypeCoverage
// 2) Status
class LanguageClientEx extends _vscodeLanguageclient.LanguageClient {
  constructor(id, name, serverOptions, clientOptions, forceDebug) {
    super(id, name, serverOptions, clientOptions, forceDebug); // $FlowFixMe: hack BaseLanguageClient removes extra properties from clientOptions so adding them back below

    this._clientOptions.extensions = clientOptions.extensions;

    this._registerExtraFeatures();
  }

  get clientOptions() {
    // $FlowFixMe: type clientOptions correctly
    return this._clientOptions;
  }

  _registerExtraFeatures() {
    this.registerFeature(new _TypeCoverageFeature.default(this));
    this.registerFeature(new _StatusFeature.default(this));
  }

}

exports.default = LanguageClientEx;
//# sourceMappingURL=Client.js.map