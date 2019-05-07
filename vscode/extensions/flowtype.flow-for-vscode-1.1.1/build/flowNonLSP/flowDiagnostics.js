"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setupDiagnostics = setupDiagnostics;

var vscode = _interopRequireWildcard(require("vscode"));

var path = _interopRequireWildcard(require("path"));

var _FlowService = require("./pkg/flow-base/lib/FlowService");

var _flowStatus = require("./flowStatus");

var _flowCoverage = require("./flowCoverage");

var _util = require("./utils/util");

var _lodash = _interopRequireDefault(require("lodash.debounce"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 *
 * 
 */
const ON_CHANGE_TEXT_TIMEOUT = 500;
const status = new _flowStatus.Status();
const coverage = new _flowCoverage.Coverage();
let lastDiagnostics = null;

function setupDiagnostics(context) {
  const {
    subscriptions
  } = context;
  const debouncedUpdateDiagnostics = (0, _lodash.default)(updateDiagnostics, ON_CHANGE_TEXT_TIMEOUT); // Do an initial call to get diagnostics from the active editor if any

  if (vscode.window.activeTextEditor && (0, _util.hasFlowPragma)(vscode.window.activeTextEditor.document.getText())) {
    debouncedUpdateDiagnostics(context, vscode.window.activeTextEditor.document);
  } // Update diagnostics when active text editor changes


  subscriptions.push(vscode.window.onDidChangeActiveTextEditor(editor => {
    if (editor && (0, _util.hasFlowPragma)(editor.document.getText())) {
      debouncedUpdateDiagnostics(context, editor.document);
    }
  })); // Update diagnostics when document is saved

  subscriptions.push(vscode.workspace.onDidSaveTextDocument(event => {
    if (vscode.window.activeTextEditor && (0, _util.hasFlowPragma)(vscode.window.activeTextEditor.document.getText())) {
      debouncedUpdateDiagnostics(context, vscode.window.activeTextEditor.document);
    }
  })); // Update diagnostics when document is edited

  subscriptions.push(vscode.workspace.onDidChangeTextDocument(event => {
    const {
      activeTextEditor
    } = vscode.window;

    if (!activeTextEditor) {
      return;
    }

    const isDocumentActive = activeTextEditor.document.fileName === event.document.fileName;

    if (isDocumentActive && (0, _util.isRunOnEditEnabled)() && (0, _util.hasFlowPragma)(event.document.getText())) {
      debouncedUpdateDiagnostics(context, event.document);
    }
  }));
}

const pendingDiagnostics = new Map();

function updateDiagnostics(context, document) {
  const {
    uri,
    version
  } = document;

  if (uri.scheme !== 'file') {
    return;
  }

  const id = uri.toString();
  const pendingVersion = pendingDiagnostics.get(id);

  if (pendingVersion == null) {
    requestDiagnostics(context, document);
  } else if (pendingVersion !== version) {
    abortDiagnostics(id);
    requestDiagnostics(context, document);
  }
}

function abortDiagnostics(id) {
  if (pendingDiagnostics.has(id)) {
    pendingDiagnostics.delete(id);
  }

  if (pendingDiagnostics.size === 0) {
    status.idle();
  }
}

async function requestDiagnostics(context, document) {
  const {
    uri,
    version
  } = document;
  const id = uri.toString();
  pendingDiagnostics.set(id, version);

  if (pendingDiagnostics.size > 0) {
    status.busy();
  }

  try {
    let diagnostics = await getDocumentDiagnostics(context, document);

    if (pendingDiagnostics.get(id) === version) {
      applyDiagnostics(diagnostics);
    }
  } catch (error) {
    console.error(error);
  }

  status.idle();
  coverage.update(document.uri);

  if (pendingDiagnostics.get(id) === version) {
    pendingDiagnostics.delete(id);
  }

  if (pendingDiagnostics.size === 0) {
    status.idle();
  }
}

async function getDocumentDiagnostics(context, document) {
  if (document.isUntitled) {
    return getDraftDocumentDiagnostics(context, document);
  } else if (document.isDirty) {
    return getDirtyDocumentDiagnostics(context, document);
  } else {
    return getSavedDocumentDiagnostics(context, document);
  }
}

const noDiagnostics = Object.create(null);

async function getFileDiagnostics(filePath, content, pathToURI = _util.toURI) {
  const extensions = (0, _util.getFileExtensions)();

  if (extensions.indexOf(path.extname(filePath)) === -1) {
    return noDiagnostics;
  } // flowFindDiagnostics takes the provided filePath and then walks up directories
  // until a .flowconfig is found. The diagnostics are then valid for the entire
  // flow workspace.


  let rawDiag = await (0, _FlowService.flowFindDiagnostics)(filePath, content);

  if (rawDiag && rawDiag.messages) {
    const {
      flowRoot,
      messages
    } = rawDiag;
    const diags = Object.create(null);
    messages.forEach(message => {
      const {
        level,
        messageComponents
      } = message;
      if (!messageComponents.length) return;
      const [baseMessage, ...other] = messageComponents,
            range = baseMessage.range;
      if (range == null) return;
      const file = path.resolve(flowRoot, range.file);
      const uri = pathToURI(file);
      let diag = {
        severity: level,
        startLine: range.start.line,
        startCol: range.start.column,
        endLine: range.end.line,
        endCol: range.end.column,
        msg: ''
      };
      let details = [];
      other.forEach(part => {
        let partMsg = part.descr;

        if (partMsg && partMsg !== 'null' && partMsg !== 'undefined') {
          details.push(partMsg);
        }
      });
      let msg = baseMessage.descr;

      if (details.length) {
        msg = `${msg} (${details.join(' ')})`;
      }

      diag.msg = msg;

      if (!diags[file]) {
        diags[file] = {
          uri,
          reports: []
        };
      }

      diags[file].reports.push(diag);
    });
    return diags;
  } else {
    return noDiagnostics;
  }
}

const supportedLanguages = new Set(['javascript', 'javascriptreact']);

async function getDraftDocumentDiagnostics(context, document) {
  if (supportedLanguages.has(document.languageId)) {
    const content = document.getText();
    const tryPath = (0, _util.getTryPath)(context);
    const uri = document.uri;

    const pathToURI = path => uri;

    return getFileDiagnostics(tryPath, content, pathToURI);
  }

  return noDiagnostics;
}

async function getDirtyDocumentDiagnostics(context, document) {
  return getFileDiagnostics(document.uri.fsPath, document.getText());
}

async function getSavedDocumentDiagnostics(context, document) {
  return getFileDiagnostics(document.uri.fsPath, null);
}

function mapSeverity(sev) {
  switch (sev) {
    case 'error':
      return vscode.DiagnosticSeverity.Error;

    case 'warning':
      return vscode.DiagnosticSeverity.Warning;

    default:
      return vscode.DiagnosticSeverity.Error;
  }
}

function applyDiagnostics(diagnostics) {
  if (lastDiagnostics) {
    lastDiagnostics.dispose(); // clear old collection
  } // create new collection


  lastDiagnostics = vscode.languages.createDiagnosticCollection();

  for (let file in diagnostics) {
    const {
      uri,
      reports
    } = diagnostics[file];
    const diags = reports.map(error => {
      // don't allow non-0 lines
      const startLine = Math.max(0, error.startLine - 1);
      const endLine = Math.max(0, error.endLine - 1);
      const range = new vscode.Range(startLine, error.startCol - 1, endLine, error.endCol);
      const location = new vscode.Location(uri, range);
      const diag = new vscode.Diagnostic(range, error.msg, mapSeverity(error.severity));
      diag.source = 'flow';
      return diag;
    });
    lastDiagnostics.set(uri, diags);
  }
}
//# sourceMappingURL=flowDiagnostics.js.map