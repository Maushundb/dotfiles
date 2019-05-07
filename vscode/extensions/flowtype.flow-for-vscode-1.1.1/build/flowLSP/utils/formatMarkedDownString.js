"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = formatMarkedDownString;

var vscode = _interopRequireWildcard(require("vscode"));

var _format = _interopRequireDefault(require("../../common/format"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function formatMarkedDownString(mdStr) {
  const code = extractCode(mdStr, 'flow');
  const formatted = (0, _format.default)(code);
  const formattedStr = new vscode.MarkdownString();
  formattedStr.appendCodeblock(formatted, 'javascript');
  return formattedStr;
} // ```languageID code``` => code


function extractCode(mdStr, language) {
  return mdStr.value.replace(`\`\`\`${language}`, '').replace('```', '').trim();
}
//# sourceMappingURL=formatMarkedDownString.js.map