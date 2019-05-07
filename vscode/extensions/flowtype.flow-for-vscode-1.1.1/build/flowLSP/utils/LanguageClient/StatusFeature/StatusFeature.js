"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var lsp = _interopRequireWildcard(require("vscode-languageclient"));

var _StatusProvider = _interopRequireDefault(require("./StatusProvider"));

var _Status = _interopRequireDefault(require("./Status"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class StatusFeature {
  constructor(client) {
    _defineProperty(this, "_client", void 0);

    this._client = client;
  }

  fillClientCapabilities(capabilities) {
    capabilities.window = capabilities.window || {};
    capabilities.window.status = {
      dynamicRegistration: false
    };
  }

  initialize() {
    const statusProvider = new _StatusProvider.default(this._client);
    return new _Status.default(statusProvider, this._client.clientOptions.extensions.status);
  }

}

exports.default = StatusFeature;
//# sourceMappingURL=StatusFeature.js.map