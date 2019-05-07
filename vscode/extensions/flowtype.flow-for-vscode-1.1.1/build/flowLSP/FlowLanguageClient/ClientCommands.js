"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var vscode = _interopRequireWildcard(require("vscode"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class ClientCommands {
  constructor(client) {
    _defineProperty(this, "_client", void 0);

    _defineProperty(this, "_commands", void 0);

    _defineProperty(this, "toggleCoverage", void 0);

    _defineProperty(this, "showStatus", void 0);

    _defineProperty(this, "restartClient", void 0);

    _defineProperty(this, "logDebugInfo", void 0);

    _defineProperty(this, "clientActions", void 0);

    _defineProperty(this, "showOutput", void 0);

    _defineProperty(this, "_registerCommands", () => {
      this._commands = [vscode.commands.registerCommand(this.showStatus, this._handleShowStatus), vscode.commands.registerCommand(this.restartClient, () => this._client.restart()), vscode.commands.registerCommand(this.clientActions, this._handleClientActionsCommand), vscode.commands.registerCommand(this.logDebugInfo, this._handleLogDebugInfo)];
    });

    _defineProperty(this, "_handleClientActionsCommand", () => {
      const status = this._client.getStatus(); // if server is in error state then directly run show status


      if (status && status.state === 'error') {
        this.runShowStatusCommand();
        return null;
      } // show user options to choose command


      const items = [{
        label: 'Toggle display of uncovered areas',
        description: 'Type coverage',
        command: this.toggleCoverage
      }, {
        label: 'Show Client Status',
        command: this.showStatus
      }, {
        label: 'Restart Client',
        command: this.restartClient
      }, {
        label: 'Log Debug Info',
        command: this.logDebugInfo
      }, {
        label: 'Show Output Channel',
        command: 'flow.showOutputChannel'
      }];
      return vscode.window.showQuickPick(items, {
        placeHolder: 'Select a command to run'
      }).then(selectedItem => {
        if (selectedItem) {
          return vscode.commands.executeCommand(selectedItem.command);
        }

        return null;
      });
    });

    _defineProperty(this, "_handleShowStatus", () => {
      const name = this._client.getName();

      const status = this._client.getStatus();

      if (!status) {
        return;
      }

      switch (status.state) {
        case 'error':
          {
            const actions = status.actions || [];
            vscode.window.showErrorMessage(`[${name}] ${status.message || ''}`, ...actions).then(selection => {
              if (selection) {
                selection.command();
              }
            });
            break;
          }

        case 'busy':
          {
            const actions = status.actions || [];
            vscode.window.showWarningMessage(`[${name}] ${status.message || ''}`, ...actions).then(selection => {
              if (selection) {
                selection.command();
              }
            });
            break;
          }

        case 'idle':
          {
            vscode.window.showInformationMessage(`[${name}] ${status.message || ''}`);
            break;
          }

        default:
          break;
      }
    });

    _defineProperty(this, "_handleLogDebugInfo", () => {
      this._client.logDebugInfo(); // open output channel
      // command inside command not running so running in next tick


      setTimeout(() => {
        this.runShowOutputCommand();
      }, 0);
    });

    this._client = client;

    const clientID = this._client.getID();

    this.toggleCoverage = `flow.toggleCoverage.${clientID}`;
    this.showStatus = `flow.showStatus.${clientID}`;
    this.restartClient = `flow.restartClient.${clientID}`;
    this.logDebugInfo = `flow.logDebugInfo.${clientID}`;
    this.clientActions = `flow.clientActions.${clientID}`;
    this.showOutput = 'flow.showOutputChannel';

    this._registerCommands();
  }

  runRestartClientCommand() {
    vscode.commands.executeCommand(this.restartClient);
  }

  runShowStatusCommand() {
    vscode.commands.executeCommand(this.showStatus);
  }

  runShowOutputCommand() {
    vscode.commands.executeCommand(this.showOutput);
  }

  dispose() {
    this._commands.forEach(command => command.dispose());
  }

}

exports.default = ClientCommands;
//# sourceMappingURL=ClientCommands.js.map