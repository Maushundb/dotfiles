"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setupLogging = setupLogging;

var vscode = _interopRequireWildcard(require("vscode"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

/**
 * Adds a gloabl that is used inside consoleAppender.js to output console messages
 * to the user, instead of to the developer console.
 */
function setupLogging(context) {
  const channel = vscode.window.createOutputChannel('Flow');
  vscode.commands.registerCommand('flow.show-output', () => channel.show());
  global.flowOutputChannel = channel;
  context.subscriptions.push(channel);
}
//# sourceMappingURL=flowLogging.js.map