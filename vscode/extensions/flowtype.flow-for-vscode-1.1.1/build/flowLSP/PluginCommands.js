"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var vscode = _interopRequireWildcard(require("vscode"));

var _FlowClients = _interopRequireDefault(require("./FlowClients"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class PluginCommands {
  constructor(clients, outputChannel) {
    _defineProperty(this, "_clients", void 0);

    _defineProperty(this, "_outputChannel", void 0);

    _defineProperty(this, "_subscriptions", []);

    this._clients = clients;
    this._outputChannel = outputChannel;

    this._registerCommands();
  }

  dispose() {
    this._subscriptions.forEach(item => {
      item.dispose();
    });
  }

  _registerCommands() {
    /* prettier-ignore */
    this._subscriptions.push(vscode.commands.registerCommand('flow.toggleCoverage', this.toggleCoverage, this), vscode.commands.registerCommand('flow.showStatus', this.showStatus, this), vscode.commands.registerCommand('flow.restartClient', this.restartClient, this), vscode.commands.registerCommand('flow.logClientDebugInfo', this.logClientDebugInfo, this), vscode.commands.registerCommand('flow.showOutputChannel', this.showOutputChannel, this));
  }

  showStatus() {
    this._clients.pick('Select a client to show status').then(client => {
      if (client) {
        vscode.commands.executeCommand(client.commands.showStatus);
      }
    });
  }

  toggleCoverage() {
    this._clients.pick('Select a client to toggle coverage').then(client => {
      if (client) {
        vscode.commands.executeCommand(client.commands.toggleCoverage);
      }
    });
  }

  restartClient() {
    this._clients.pick('Select a client to restart').then(client => {
      if (client) {
        vscode.commands.executeCommand(client.commands.restartClient);
      }
    });
  }

  logClientDebugInfo() {
    this._clients.pick('Select a client to log debug info').then(client => {
      if (client) {
        vscode.commands.executeCommand(client.commands.logDebugInfo);
      }
    });
  }

  showOutputChannel() {
    this._outputChannel.show(true);
  }

}

exports.default = PluginCommands;
//# sourceMappingURL=PluginCommands.js.map