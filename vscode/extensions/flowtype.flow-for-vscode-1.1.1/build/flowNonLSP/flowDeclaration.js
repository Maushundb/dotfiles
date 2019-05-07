"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DeclarationSupport = void 0;

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
function normalizeLineNumber(x) {
  return x < 0 ? 0 : x;
}

class DeclarationSupport {
  async provideDefinition(document, position, token) {
    const fileName = document.uri.fsPath;
    const currentContents = document.getText();
    const wordAtPosition = document.getWordRangeAtPosition(position);

    if (wordAtPosition) {
      const line = wordAtPosition.start.line + 1; // fix offsets

      const col = wordAtPosition.start.character + 1; // fix offsets

      const definition = await (0, _FlowService.flowFindDefinition)(fileName, currentContents, line, col);

      if (definition) {
        const range = new vscode.Range(normalizeLineNumber(definition.point.line), definition.point.column, normalizeLineNumber(definition.point.line), definition.point.column);
        const uri = vscode.Uri.file(definition.file);
        return new vscode.Location(uri, range);
      }
    }

    return null; // no definition
  }

}

exports.DeclarationSupport = DeclarationSupport;
//# sourceMappingURL=flowDeclaration.js.map