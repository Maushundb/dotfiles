"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.TypeCoverageRequest = void 0;

var vscode = _interopRequireWildcard(require("vscode"));

var lsp = _interopRequireWildcard(require("vscode-languageclient"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const TypeCoverageRequest = {
  type: new lsp.RequestType('textDocument/typeCoverage')
};
exports.TypeCoverageRequest = TypeCoverageRequest;
const ConnectionStatusNotification = {
  type: new lsp.NotificationType('telemetry/connectionStatus')
};

class TypeCoverageProvider {
  constructor(_client) {
    _defineProperty(this, "_client", void 0);

    _defineProperty(this, "_listeners", []);

    _defineProperty(this, "onConnectionStatus", listener => {
      this._listeners.push(listener); // dispose


      return {
        dispose: () => {
          const index = this._listeners.findIndex(_listener => listener === _listener);

          if (index !== -1) {
            this._listeners.splice(index, 1);
          }
        }
      };
    });

    _defineProperty(this, "provideTypeCoverage", document => {
      const {
        middleware
      } = this._client.clientOptions;
      return middleware && middleware.provideTypeCoverage ? middleware.provideTypeCoverage(document, this._provideTypeCoverage) : this._provideTypeCoverage(document);
    });

    _defineProperty(this, "_provideTypeCoverage", document => {
      const client = this._client;
      return client.sendRequest(TypeCoverageRequest.type, {
        textDocument: client.code2ProtocolConverter.asTextDocumentIdentifier(document)
      }).then(coverage => coverage, error => {
        client.logFailedRequest(TypeCoverageRequest.type, error);
        return Promise.resolve(null);
      });
    });

    _defineProperty(this, "_handleConnectionStatus", params => {
      this._listeners.forEach(listener => {
        listener(params);
      });
    });

    this._client = _client;

    this._client.onNotification(ConnectionStatusNotification.type, this._handleConnectionStatus);
  }

}

exports.default = TypeCoverageProvider;
//# sourceMappingURL=TypeCoverageProvider.js.map