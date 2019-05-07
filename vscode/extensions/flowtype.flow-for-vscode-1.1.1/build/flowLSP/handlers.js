"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.onDidChangeActiveTextEditor = onDidChangeActiveTextEditor;
exports.onDidOpenTextDocument = onDidOpenTextDocument;
exports.onDidRemoveWorkspaceFolders = onDidRemoveWorkspaceFolders;
exports.onDidChangeConfiguration = onDidChangeConfiguration;

var _path = _interopRequireDefault(require("path"));

var vscode = _interopRequireWildcard(require("vscode"));

var _utils = require("./utils");

var _FlowLanguageClient = _interopRequireDefault(require("./FlowLanguageClient"));

var _FlowClients = _interopRequireDefault(require("./FlowClients"));

var _toDiagnosticSeverity = _interopRequireDefault(require("./utils/toDiagnosticSeverity"));

var _Logger = _interopRequireDefault(require("./utils/Logger"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const activationDocumentSelector = [{
  scheme: 'file',
  language: 'javascript'
}, {
  scheme: 'file',
  language: 'javascriptreact'
}, {
  scheme: 'file',
  pattern: '**/.flowconfig'
}];

function onDidChangeActiveTextEditor(clients, activeTextEditor) {
  clients.setActive(null);

  if (!activeTextEditor) {
    return;
  } // ignore if not valid document


  if (!vscode.languages.match(activationDocumentSelector, activeTextEditor.document)) {
    return;
  }

  (0, _utils.findDocumentFlowconfig)('.flowconfig', activeTextEditor.document).then(flowconfigPath => {
    if (flowconfigPath && // activeTextEditor can change in b/w
    vscode.window.activeTextEditor === activeTextEditor) {
      clients.setActive(clients.get(flowconfigPath));
    }
  });
}

function onDidOpenTextDocument(clients, document, outputChannel, logger) {
  if (!vscode.languages.match(activationDocumentSelector, document)) {
    return;
  }

  const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);

  if (!workspaceFolder) {
    return;
  }

  const docPath = document.uri.fsPath;
  const rootPath = workspaceFolder.uri.fsPath;

  const startDir = _path.default.dirname(docPath); // flow also supports custom flowconfigName
  // not hardcoding '.flowconfig' in code so that we can later add support easily


  const flowconfigName = '.flowconfig';
  logger.trace(`File opened ${document.uri.fsPath}.`);
  logger.trace(`Searching flowconfig for file ${docPath}`); // NOTE: currently I'm not caching "findFlowconfig" result to avoid bugs due to caching (say user moves .flowconfig)
  // if this becomes bottleneck in future we can cache findFlowConfig result with some cache invalidation

  (0, _utils.findFlowconfig)(flowconfigName, startDir, rootPath).then(flowconfigPath => {
    if (!flowconfigPath) {
      logger.info(`Not starting flow client. No ${flowconfigName} found for file ${docPath}.`);
      return;
    }

    logger.trace(`Found flowconfig ${flowconfigPath} for file ${docPath}`);

    if (clients.has(flowconfigPath)) {
      logger.trace(`Flow client already exists for flowconfig ${flowconfigPath}.`);
      return;
    }

    logger.trace(`Creating flow client for flowconfig ${flowconfigPath}`);
    const client = new _FlowLanguageClient.default({
      flowconfigPath,
      workspaceRoot: workspaceFolder.uri.fsPath,
      outputChannel,
      // NOTE: passing config as getFunction instead of plain object
      // to add support of handling config change without the requirement of vscode restart
      getConfig: () => {
        const pluginConfig = vscode.workspace.getConfiguration('flow', workspaceFolder.uri);
        return {
          useNPMPackagedFlow: pluginConfig.get('useNPMPackagedFlow'),
          pathToFlow: pluginConfig.get('pathToFlow'),
          useBundledFlow: pluginConfig.get('useBundledFlow'),
          stopFlowOnExit: pluginConfig.get('stopFlowOnExit'),
          liveSyntaxErrors: pluginConfig.get('runOnEdit'),
          logLevel: pluginConfig.get('logLevel'),
          lazyMode: pluginConfig.get('lazyMode'),
          coverage: {
            showUncovered: pluginConfig.get('showUncovered'),
            diagnosticSeverity: (0, _toDiagnosticSeverity.default)(pluginConfig.get('coverageSeverity'), vscode.DiagnosticSeverity.Information)
          }
        };
      }
    });
    clients.add(flowconfigPath, client); // if document is active also mark client active

    if (vscode.window.activeTextEditor && vscode.window.activeTextEditor.document === document) {
      clients.setActive(client);
    }
  });
}

function onDidRemoveWorkspaceFolders(clients, folders) {
  folders.forEach(folder => {
    clients.disposeByWorkspaceFolder(folder);
  });
}

function onDidChangeConfiguration() {
  // @todo instead of asking user to restart vscode
  // handle different config change cases. In most cases
  // we dont need to restart vscode.
  vscode.window.showInformationMessage('Flow settings changed, reload vscode to apply changes.', 'Reload').then(selected => {
    if (selected === 'Reload') {
      vscode.commands.executeCommand('workbench.action.reloadWindow');
    }
  });
}
//# sourceMappingURL=handlers.js.map