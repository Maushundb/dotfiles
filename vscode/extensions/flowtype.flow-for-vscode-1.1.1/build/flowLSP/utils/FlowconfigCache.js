"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var vscode = _interopRequireWildcard(require("vscode"));

var _findDocumentFlowconfig = _interopRequireDefault(require("./findDocumentFlowconfig"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class FlowconfigCache {
  constructor(flowconfigName) {
    _defineProperty(this, "_cache", new Map());

    _defineProperty(this, "_flowconfigName", void 0);

    this._flowconfigName = flowconfigName;
  }

  async get(document) {
    const docPath = document.uri.fsPath;

    const val = this._cache.get(docPath);

    if (val !== undefined) {
      return Promise.resolve(val);
    } // compute


    const flowconfigPath = await (0, _findDocumentFlowconfig.default)(this._flowconfigName, document);

    this._cache.set(docPath, flowconfigPath);

    return flowconfigPath;
  }

  delete(document) {
    this._cache.delete(document.uri.fsPath);
  }

}

exports.default = FlowconfigCache;
//# sourceMappingURL=FlowconfigCache.js.map