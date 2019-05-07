"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.Status = void 0;

var _vscode = require("vscode");

var _util = require("./utils/util");

var _elegantSpinner = _interopRequireDefault(require("elegant-spinner"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class Status {
  static createStatusBarItem() {
    const statusBarItem = _vscode.window.createStatusBarItem(_vscode.StatusBarAlignment.Left);

    statusBarItem.tooltip = 'Flow is type checking';
    statusBarItem.command = 'flow.show-output';
    return statusBarItem;
  }

  static render(status) {
    return status.render();
  }

  constructor() {
    _defineProperty(this, "statusBarItem", void 0);

    _defineProperty(this, "state", void 0);

    this.statusBarItem = Status.createStatusBarItem();
  }

  isBusy() {
    return this.state != null;
  }

  idle() {
    this.update(false);
  }

  busy() {
    this.update((0, _util.isFlowStatusEnabled)());
  }

  update(busy) {
    const {
      state
    } = this;

    if (state && !busy) {
      clearInterval(state.id);
      this.state = null;
    }

    if (!state && busy) {
      this.state = {
        id: setInterval(Status.render, 100, this)
      };
    }

    if (state != this.state) {
      this.render();
    }
  }

  render() {
    if (this.isBusy()) {
      this.statusBarItem.show();
      this.statusBarItem.text = `Flow: ${Status.spin()}`;
    } else {
      this.statusBarItem.hide();
      this.statusBarItem.text = ``;
    }
  }

}

exports.Status = Status;

_defineProperty(Status, "spin", (0, _elegantSpinner.default)());

var _default = Status;
exports.default = _default;
//# sourceMappingURL=flowStatus.js.map