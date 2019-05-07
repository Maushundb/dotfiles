"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isFlowEnabled = isFlowEnabled;
exports.isFlowStatusEnabled = isFlowStatusEnabled;
exports.shouldShowUncoveredCode = shouldShowUncoveredCode;
exports.isRunOnEditEnabled = isRunOnEditEnabled;
exports.shouldRunOnAllFiles = shouldRunOnAllFiles;
exports.getFileExtensions = getFileExtensions;
exports.shouldStopFlowOnExit = shouldStopFlowOnExit;
exports.getTryPath = getTryPath;
exports.toURI = toURI;
exports.hasFlowPragma = hasFlowPragma;
exports.checkNode = checkNode;
exports.checkFlow = checkFlow;
exports.getFlowVersion = getFlowVersion;

var _crossSpawn = _interopRequireDefault(require("cross-spawn"));

var _vscode = require("vscode");

var path = _interopRequireWildcard(require("path"));

var _FlowHelpers = require("../pkg/flow-base/lib/FlowHelpers");

var _process = require("../pkg/commons-node/process");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const NODE_NOT_FOUND = '[Flow] Cannot find node in PATH. The simplest way to resolve it is install node globally';
const FLOW_NOT_FOUND = '[Flow] Cannot find flow in PATH. Try to install it by npm install flow-bin -g';

function isFlowEnabled() {
  return _vscode.workspace.getConfiguration('flow').get('enabled');
}

function isFlowStatusEnabled() {
  return _vscode.workspace.getConfiguration('flow').get('showStatus');
}

function shouldShowUncoveredCode() {
  return _vscode.workspace.getConfiguration('flow').get('showUncovered');
}

function isRunOnEditEnabled() {
  return _vscode.workspace.getConfiguration('flow').get('runOnEdit');
}

function shouldRunOnAllFiles() {
  return _vscode.workspace.getConfiguration('flow').get('runOnAllFiles');
}

function getFileExtensions() {
  return _vscode.workspace.getConfiguration('flow').get('fileExtensions');
}

function shouldStopFlowOnExit() {
  return _vscode.workspace.getConfiguration('flow').get('stopFlowOnExit');
}

function getTryPath(context) {
  return context.asAbsolutePath('./playground/try.js');
}

function toURI(path) {
  return _vscode.Uri.file(path);
}

function hasFlowPragma(content) {
  if (shouldRunOnAllFiles()) return true;
  return /^\s*(\/*\*+|\/\/)\s*@flow/m.test(content);
}

function checkNode() {
  try {
    const check = (0, _crossSpawn.default)(process.platform === 'win32' ? 'where' : 'which', ['node']);
    let flowOutput = "",
        flowOutputError = "";
    check.stdout.on('data', function (data) {
      flowOutput += data.toString();
    });
    check.stderr.on('data', function (data) {
      flowOutputError += data.toString();
    });
    check.on('exit', function (code) {
      if (code != 0) {
        _vscode.window.showErrorMessage(NODE_NOT_FOUND);
      }
    });
  } catch (e) {
    _vscode.window.showErrorMessage(NODE_NOT_FOUND);
  }
}

async function checkFlow() {
  const path = await (0, _FlowHelpers.getPathToFlow)();

  try {
    const {
      command,
      args
    } = (0, _FlowHelpers.buildSearchFlowCommand)(path);
    const check = (0, _crossSpawn.default)(command, args);
    let flowOutput = "",
        flowOutputError = "";
    check.stdout.on('data', function (data) {
      flowOutput += data.toString();
    });
    check.stderr.on('data', function (data) {
      flowOutputError += data.toString();
    });
    check.on('exit', function (code) {
      if (code != 0) {
        _vscode.window.showErrorMessage(FLOW_NOT_FOUND);
      }
    });
  } catch (e) {
    _vscode.window.showErrorMessage(FLOW_NOT_FOUND);
  }
}

async function getFlowVersion() {
  const flowPath = await (0, _FlowHelpers.getPathToFlow)();
  const resp = await (0, _process.runCommand)(flowPath, ['version', '--json']).toPromise();
  const versionJson = JSON.parse(resp);
  return versionJson.semver;
}
//# sourceMappingURL=util.js.map