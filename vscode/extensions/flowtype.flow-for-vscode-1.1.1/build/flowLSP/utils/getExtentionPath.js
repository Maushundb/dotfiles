"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getExtensionPath;

var vscode = _interopRequireWildcard(require("vscode"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

const THIS_EXSTENSION_ID = 'flowtype.flow-for-vscode';

function getExtensionPath() {
  const thisExtension = vscode.extensions.getExtension(THIS_EXSTENSION_ID);

  if (!thisExtension) {
    throw new Error('Failed to find extensionPath');
  }

  return thisExtension.extensionPath;
}
//# sourceMappingURL=getExtentionPath.js.map