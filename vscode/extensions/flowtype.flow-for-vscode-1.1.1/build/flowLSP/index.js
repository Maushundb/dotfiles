"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.activate = activate;

var vscode = _interopRequireWildcard(require("vscode"));

var _FlowClients = _interopRequireDefault(require("./FlowClients"));

var _PluginCommands = _interopRequireDefault(require("./PluginCommands"));

var handlers = _interopRequireWildcard(require("./handlers"));

var _Logger = _interopRequireDefault(require("./utils/Logger"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function activate(context) {
  const outputChannel = vscode.window.createOutputChannel('Flow');
  const logger = new _Logger.default('', outputChannel, 'error');
  const clients = new _FlowClients.default(logger);
  const commands = new _PluginCommands.default(clients, outputChannel);
  logger.info('Open javascript or flowconfig to start flow.');
  context.subscriptions.push(clients, // handlers
  vscode.workspace.onDidOpenTextDocument(document => {
    handlers.onDidOpenTextDocument(clients, document, outputChannel, logger);
  }), vscode.window.onDidChangeActiveTextEditor(editor => {
    handlers.onDidChangeActiveTextEditor(clients, editor);
  }), vscode.workspace.onDidChangeWorkspaceFolders(event => {
    // NOTE: as we are lazily starting flow clients
    // so no need to handle 'added' case
    if (event.removed.length > 0) {
      handlers.onDidRemoveWorkspaceFolders(clients, event.removed);
    }
  }), vscode.workspace.onDidChangeConfiguration(config => {
    if (config.affectsConfiguration('flow')) {
      handlers.onDidChangeConfiguration();
    }
  }), commands, outputChannel); // create flow clients for currently opened documents

  vscode.workspace.textDocuments.forEach(document => {
    handlers.onDidOpenTextDocument(clients, document, outputChannel, logger);
  });
}
//# sourceMappingURL=index.js.map