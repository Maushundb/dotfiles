"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var vscode = _interopRequireWildcard(require("vscode"));

var _FlowLanguageClient = _interopRequireDefault(require("./FlowLanguageClient"));

var _Logger = _interopRequireDefault(require("./utils/Logger"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class FlowClients {
  constructor(logger) {
    _defineProperty(this, "_clients", new Map());

    _defineProperty(this, "_logger", void 0);

    _defineProperty(this, "_activeClient", null);

    this._logger = logger;
  }

  add(flowconfig, client) {
    this._clients.set(flowconfig, client);
  }

  has(flowconfig) {
    return this._clients.has(flowconfig);
  }

  get(flowconfig) {
    return this._clients.get(flowconfig);
  } // will dispose all clients


  dispose() {
    this._logger.trace('Disposing all clients');

    const promises = [];

    this._clients.forEach(client => {
      promises.push(this._disposeClient(client));
    });

    return Promise.all(promises).then(() => undefined);
  } // will dispose all clients under given workspaceFolder


  disposeByWorkspaceFolder(folder) {
    const workspaceClients = this._getClientByWorkspaceFolder(folder);

    this._logger.trace(`Disposing all clients of workspaceFolder '${folder.uri.fsPath}'`);

    workspaceClients.forEach(client => {
      this._disposeClient(client);
    });
  }

  setActive(client) {
    if (this._activeClient) {
      this._activeClient.setActive(false);
    }

    this._activeClient = client;

    if (this._activeClient) {
      this._activeClient.setActive(true);
    }
  }

  getActive() {
    return this._activeClient;
  }

  pick(placeHolder) {
    const items = [];

    this._clients.forEach(client => {
      const isActiveClient = client === this._activeClient;
      const item = {
        label: client.getName(),
        description: isActiveClient ? 'active editor client' : '',
        client
      };

      if (isActiveClient) {
        // always keep active client on top
        items.unshift(item);
      } else {
        items.push(item);
      }
    });

    if (items.length === 0) {
      vscode.window.showErrorMessage('No flow client found');
      return Promise.resolve(null);
    } // if only one client present directly pick


    if (items.length === 1) {
      return Promise.resolve(items[0].client);
    }

    return vscode.window.showQuickPick(items, {
      placeHolder
    }).then(selectedItem => {
      if (selectedItem) {
        return selectedItem.client;
      }

      return null;
    });
  }

  _disposeClient(client) {
    if (this._activeClient === client) {
      this.setActive(null);
    }

    this._clients.delete(client.getFlowconfig());

    client.getLogger().info('disposing client');
    return client.dispose();
  }

  _getClientByWorkspaceFolder(workspaceFolder) {
    const clients = [];

    this._clients.forEach(client => {
      if (client.getWorkspaceRoot() === workspaceFolder.uri.fsPath) {
        clients.push(client);
      }
    });

    return clients;
  }

}

exports.default = FlowClients;
//# sourceMappingURL=FlowClients.js.map