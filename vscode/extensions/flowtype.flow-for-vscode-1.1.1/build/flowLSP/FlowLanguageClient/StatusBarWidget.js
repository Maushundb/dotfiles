"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var vscode = _interopRequireWildcard(require("vscode"));

var _elegantSpinner = _interopRequireDefault(require("elegant-spinner"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class StatusBarWidget {
  constructor(options) {
    _defineProperty(this, "_item", void 0);

    _defineProperty(this, "_defaultColor", void 0);

    _defineProperty(this, "_options", void 0);

    _defineProperty(this, "_spinner", (0, _elegantSpinner.default)());

    _defineProperty(this, "_spinnerTimeoutID", void 0);

    _defineProperty(this, "state", {
      status: null,
      coverage: null,
      flowInfo: {
        path: '',
        version: ''
      },
      show: false
    });

    _defineProperty(this, "_getSpinner", () => {
      // using setTimeout to animate spinner
      this._clearSpinnerTimeout();

      this._spinnerTimeoutID = setTimeout(() => this.render(), 100);
      return this._spinner();
    });

    this._options = options;
    this._item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, // to render after all items
    -Number.MAX_SAFE_INTEGER);
    this._defaultColor = this._item.color;
  }

  setFlowInfo(value) {
    this._setState({
      flowInfo: value
    });
  }

  getFlowInfo() {
    return this.state.flowInfo;
  }

  setStatus(value) {
    this._setState({
      status: value
    });
  }

  getStatus() {
    return this.state.status;
  }

  setCoverage(value) {
    this._setState({
      coverage: value
    });
  }

  render() {
    const item = this._item;
    const options = this._options;
    const {
      coverage,
      status,
      flowInfo,
      show
    } = this.state;

    if (!coverage && !status || !show) {
      item.hide();
      return;
    }

    let text = 'Flow';
    let tooltipText = '';
    let color = this._defaultColor; // show flow version in status widget

    if (flowInfo.version) {
      text += ` ${flowInfo.version}`;
    } // flow info


    tooltipText += [`${heading('Flow Info')}`, `Config = ${options.flowconfig}`, `Version = ${flowInfo.version}`, `Path = ${flowInfo.path}`, `ClientName = ${options.clientName}`].join('\n'); // status text

    if (status) {
      tooltipText += `\n\n${heading('Server Status')}\n`;

      switch (status.state) {
        case 'idle':
          tooltipText += status.message;
          break;

        case 'busy':
          text += ` ${this._getSpinner()} ${status.progress}`;
          tooltipText += status.message;
          break;

        case 'error':
          text += ' $(stop)';
          tooltipText += status.message;
          color = 'red';
          break;

        default:
          break;
      }
    } // show coverage only if server not busy


    if (coverage && !this._isServerBusy()) {
      const {
        coveredPercent,
        computing,
        showingUncovered
      } = coverage; // text

      const value = [coveredPercent !== null ? `${coveredPercent}%` : null, // show sync icon is computing coverage
      computing ? `${this._getSpinner()}` : null, // show eye icon if showing uncovered
      showingUncovered ? '$(eye)' : null].filter(Boolean).join(' ');
      const showingUncoveredMsg = `Uncovered areas: ${showingUncovered ? 'Visible' : 'Hidden'}`; // tooltipText

      const message = computing || coveredPercent === null ? 'Computing coverage...' : `This file is ${coveredPercent}% covered by flow.\n${showingUncoveredMsg}`;
      text += ` ( coverage ${value} )`;
      tooltipText += `\n\n${heading('Type Coverage')}\n${message}`;
    }

    item.text = text;
    item.tooltip = tooltipText;
    item.command = options.onClickCommand;
    item.color = color;
    item.show();
  }

  show() {
    this._setState({
      show: true
    });
  }

  hide() {
    this._setState({
      show: false
    });
  }

  dispose() {
    this._item.dispose();
  }

  _isServerBusy() {
    const {
      status
    } = this.state;
    return status && status.state !== 'idle';
  }

  _clearSpinnerTimeout() {
    if (this._spinnerTimeoutID) {
      clearTimeout(this._spinnerTimeoutID);
      this._spinnerTimeoutID = null;
    }
  }

  _setState(partialState) {
    this.state = _objectSpread({}, this.state, partialState);
    this.render();
  }

}

exports.default = StatusBarWidget;

function heading(str) {
  return `[ ${str} ]`;
}
//# sourceMappingURL=StatusBarWidget.js.map