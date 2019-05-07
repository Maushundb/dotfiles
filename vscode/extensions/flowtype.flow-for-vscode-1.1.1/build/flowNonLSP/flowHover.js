"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.HoverSupport = void 0;

var vscode = _interopRequireWildcard(require("vscode"));

var _utils = require("./utils");

var _FlowService = require("./pkg/flow-base/lib/FlowService");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

/*
 Copyright (c) 2015-present, Facebook, Inc.
 All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 the root directory of this source tree.
 */
class HoverSupport {
  async provideHover(document, position) {
    const fileName = document.uri.fsPath;
    const wordPosition = document.getWordRangeAtPosition(position);
    if (!wordPosition) return;
    const word = document.getText(wordPosition);
    const currentContents = document.getText();
    const line = position.line;
    const col = position.character;
    const completions = await (0, _FlowService.flowGetType)(fileName, currentContents, line, col, false);

    if (completions) {
      const beautifiedData = (0, _utils.format)(completions.type);
      return new vscode.Hover(['[Flow]', {
        language: 'javascript',
        value: `${word}: ${beautifiedData}`
      }]);
    }
  }

}

exports.HoverSupport = HoverSupport;
//# sourceMappingURL=flowHover.js.map