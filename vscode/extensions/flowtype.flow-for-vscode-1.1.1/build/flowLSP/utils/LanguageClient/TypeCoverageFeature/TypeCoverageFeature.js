"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var lsp = _interopRequireWildcard(require("vscode-languageclient"));

var vscode = _interopRequireWildcard(require("vscode"));

var UUID = _interopRequireWildcard(require("vscode-languageclient/lib/utils/uuid"));

var _TypeCoverage = _interopRequireDefault(require("./TypeCoverage"));

var _TypeCoverageProvider = _interopRequireWildcard(require("./TypeCoverageProvider"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class TypeCoverageFeature extends lsp.TextDocumentFeature {
  constructor(client) {
    super(client, _TypeCoverageProvider.TypeCoverageRequest.type);

    _defineProperty(this, "_client", void 0);

    this._client = client;
  }

  fillClientCapabilities(capabilities) {
    capabilities.telemetry = capabilities.telemetry || {};
    capabilities.telemetry.connectionStatus = {
      dynamicRegistration: false
    };
  }

  initialize(capabilities, documentSelector) {
    if (!capabilities.typeCoverageProvider || !documentSelector) {
      return;
    }

    this.register(this.messages, {
      id: UUID.generateUuid(),
      registerOptions: {
        documentSelector
      }
    });
  }

  registerLanguageProvider(options) {
    const provider = new _TypeCoverageProvider.default(this._client);
    return new _TypeCoverage.default(options.documentSelector, provider, this._client.clientOptions.extensions.typeCoverage);
  }

}

exports.default = TypeCoverageFeature;
//# sourceMappingURL=TypeCoverageFeature.js.map