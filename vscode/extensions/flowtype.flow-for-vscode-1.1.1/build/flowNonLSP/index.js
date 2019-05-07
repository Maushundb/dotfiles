"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.activate = activate;

var vscode = _interopRequireWildcard(require("vscode"));

var _flowCompletion = require("./flowCompletion");

var _flowHover = require("./flowHover");

var _flowDeclaration = require("./flowDeclaration");

var _flowDiagnostics = require("./flowDiagnostics");

var _utils = require("./utils");

var _FlowHelpers = require("./pkg/flow-base/lib/FlowHelpers");

var _flowLogging = require("./flowLogging");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

/*
 Copyright (c) 2015-present, Facebook, Inc.
 All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 the root directory of this source tree.
 */
const languages = [{
  language: 'javascript',
  scheme: 'file'
}, {
  language: 'javascriptreact',
  scheme: 'file'
}];

function activate(context) {
  //User can disable flow for some projects that previously used flow, but it's not have actual typing
  if (!(0, _utils.isFlowEnabled)()) {
    return;
  }

  global.vscode = vscode;
  (0, _flowLogging.setupLogging)(context);
  (0, _utils.checkNode)();
  (0, _utils.checkFlow)(); // Language features

  languages.forEach(lang => {
    context.subscriptions.push(vscode.languages.registerHoverProvider(lang, new _flowHover.HoverSupport()));
    context.subscriptions.push(vscode.languages.registerDefinitionProvider(lang, new _flowDeclaration.DeclarationSupport()));
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider(lang, new _flowCompletion.CompletionSupport(), '.'));
  }); // https://github.com/Microsoft/vscode/issues/7031 Workaround for language scoring for language and in-memory. Check in nearest Insiders build
  // context.subscriptions.push(vscode.languages.registerCompletionItemProvider({ language: 'javascript' }, new CompletionSupport(), '.'));
  // Diagnostics

  (0, _flowDiagnostics.setupDiagnostics)(context);
}

vscode.workspace.onDidChangeConfiguration(params => {
  (0, _FlowHelpers.clearWorkspaceCaches)();
});
//# sourceMappingURL=index.js.map