"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var vscode = _interopRequireWildcard(require("vscode"));

var _StatusProvider = _interopRequireDefault(require("./StatusProvider"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class Status {
  constructor(provider, options) {
    _defineProperty(this, "state", {
      status: {
        kind: 'null'
      }
    });

    _defineProperty(this, "_provider", void 0);

    _defineProperty(this, "_options", void 0);

    _defineProperty(this, "_subscriptions", []);

    this._options = options;
    this._provider = provider;

    this._subscriptions.push(this._provider.onStatus(statusData => {
      this.setState({
        status: statusData
      });
    }));
  }

  setState(partialState) {
    this.state = _objectSpread({}, this.state, partialState);
    this.render();
  }

  render() {
    const {
      status
    } = this.state;

    switch (status.kind) {
      case 'green':
        this._options.onChange({
          state: 'idle',
          message: status.message || ''
        });

        break;

      case 'yellow':
        this._options.onChange({
          state: 'busy',
          progress: this._getProgress(status),
          message: status.message || '',
          actions: this._createActions(status.id, status.buttons)
        });

        break;

      case 'red':
        this._options.onChange({
          state: 'error',
          message: status.message || '',
          actions: this._createActions(status.id, status.buttons)
        });

        break;

      case 'null':
        this._options.onChange(null);

        break;

      default:
        this._options.onChange(null);

    }
  }

  _createActions(statusID, statusButtons) {
    return statusButtons.map(button => ({
      title: button,
      command: () => this._provider.clickAction(statusID || '', button)
    }));
  }

  _getProgress(status) {
    if (status.kind !== 'yellow') {
      return '';
    }

    if (status.shortMessage != null) {
      return status.shortMessage;
    }

    if (status.progress != null) {
      const {
        numerator,
        denominator
      } = status.progress;
      return `${Math.round(numerator / (denominator == null ? 100 : denominator) * 100)}%`;
    }

    if (status.message != null) {
      // remove `Flow:` from message
      return status.message.replace('Flow:', '');
    }

    return '';
  }

  dispose() {
    this._subscriptions.forEach(item => item.dispose());
  }

}

exports.default = Status;
//# sourceMappingURL=Status.js.map