"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = findDocumentFlowconfig;

var vscode = _interopRequireWildcard(require("vscode"));

var _path = _interopRequireDefault(require("path"));

var _findFlowconfig = _interopRequireDefault(require("./findFlowconfig"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function findDocumentFlowconfig(flowconfigName, document) {
  const workspace = vscode.workspace.getWorkspaceFolder(document.uri);

  if (!workspace) {
    return Promise.resolve(null);
  }

  const startDir = _path.default.dirname(document.uri.fsPath);

  const rootPath = workspace.uri.fsPath;
  return (0, _findFlowconfig.default)(flowconfigName, startDir, rootPath);
}
//# sourceMappingURL=findDocumentFlowconfig.js.map