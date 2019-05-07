"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CompletionSupport = void 0;

var vscode = _interopRequireWildcard(require("vscode"));

var _FlowService = require("./pkg/flow-base/lib/FlowService");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

/*
 Copyright (c) 2015-present, Facebook, Inc.
 All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 the root directory of this source tree.
 */
class CompletionSupport {
  async provideCompletionItems(document, position, token) {
    const fileName = document.uri.fsPath;
    const currentContents = document.getText();
    const line = position.line;
    const col = position.character;
    const prefix = '.'; // TODO do better.

    const completions = await (0, _FlowService.flowGetAutocompleteSuggestions)(fileName, currentContents, line, col, prefix, true);

    if (completions) {
      return completions.map(atomCompletion => {
        const completion = new vscode.CompletionItem(atomCompletion.displayText);

        if (atomCompletion.description) {
          completion.detail = atomCompletion.description;
        }

        completion.kind = this.typeToKind(atomCompletion.type, atomCompletion.description);

        if (completion.kind === vscode.CompletionItemKind.Function) {
          completion.insertText = new vscode.SnippetString(atomCompletion.snippet);
        }

        return completion;
      });
    }

    return [];
  }

  typeToKind(type, description) {
    // Possible Kinds in VS Code:
    // Method,
    // Function,
    // Constructor,
    // Field,
    // Variable,
    // Class,
    // Interface,
    // Module,
    // Property
    if (type === 'function') {
      return vscode.CompletionItemKind.Function;
    }

    if (description && description.indexOf('[class: ') >= 0) {
      return vscode.CompletionItemKind.Class;
    }

    return vscode.CompletionItemKind.Variable;
  }

}

exports.CompletionSupport = CompletionSupport;
//# sourceMappingURL=flowCompletion.js.map