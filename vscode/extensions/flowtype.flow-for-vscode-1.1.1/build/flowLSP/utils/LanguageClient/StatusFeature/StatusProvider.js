"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var vscode = _interopRequireWildcard(require("vscode"));

var _vscodeLanguageclient = require("vscode-languageclient");

var _utils = require("./utils");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const ShowStatusRequest = {
  type: new _vscodeLanguageclient.RequestType('window/showStatus')
};

class StatusProvider {
  constructor(client) {
    _defineProperty(this, "_client", void 0);

    _defineProperty(this, "_currentStatusID", 0);

    _defineProperty(this, "_statusActionDeferred", new _utils.Defer());

    _defineProperty(this, "_listeners", []);

    _defineProperty(this, "_updateStatus", status => {
      this._listeners.forEach(listener => {
        listener(status);
      });
    });

    _defineProperty(this, "_handleShowStatusRequest", params => {
      const actions = params.actions || [];
      const status = (0, _utils.convertToStatus)(params);

      if (!status) {
        return Promise.resolve(null);
      }

      return Promise.resolve(this._showStatus(status)).then(response => {
        if (response === null) {
          return null;
        }

        const chosenAction = actions.find(action => action.title === response); // invariant(chosenAction != null);

        return chosenAction || null;
      });
    });

    this._client = client;

    this._client.onRequest(ShowStatusRequest.type, this._handleShowStatusRequest);
  }

  clickAction(id, button) {
    // to ignore clicks from old status
    if (id === String(this._currentStatusID)) {
      this._statusActionDeferred.resolve(button);
    }
  }

  onStatus(listener) {
    this._listeners.push(listener);

    return {
      dispose: () => {
        const index = this._listeners.findIndex(_listener => listener === _listener);

        if (index !== -1) {
          this._listeners.splice(index, 1);
        }
      }
    };
  }

  _showStatus(status) {
    this._statusActionDeferred.resolve(null);

    this._statusActionDeferred = new _utils.Defer();
    this._currentStatusID += 1;

    switch (status.kind) {
      case 'red':
        this._updateStatus(_objectSpread({
          kind: 'red'
        }, status, {
          id: String(this._currentStatusID)
        }));

        break;

      case 'yellow':
        this._updateStatus(_objectSpread({
          kind: 'yellow'
        }, status, {
          id: String(this._currentStatusID)
        }));

        break;

      default:
        this._updateStatus(status);

    }

    return this._statusActionDeferred.promise;
  }

}

exports.default = StatusProvider;
//# sourceMappingURL=StatusProvider.js.map