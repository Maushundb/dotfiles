"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.convertToStatus = convertToStatus;
exports.Defer = void 0;

var _types = require("./types");

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function convertToStatus(params) {
  const actions = params.actions || [];
  const buttons = actions.map(action => action.title);

  switch (params.type) {
    case _types.LspMessageType.Error:
      return {
        kind: 'red',
        message: params.message == null ? '' : params.message,
        buttons
      };

    case _types.LspMessageType.Warning:
      return {
        kind: 'yellow',
        message: params.message == null ? '' : params.message,
        shortMessage: params.shortMessage,
        progress: params.progress == null ? undefined : {
          numerator: params.progress.numerator,
          denominator: params.progress.denominator
        },
        buttons
      };

    case _types.LspMessageType.Info:
      return {
        kind: 'green',
        message: params.message
      };

    default:
      return null;
  }
}

class Defer {
  constructor() {
    _defineProperty(this, "promise", void 0);

    _defineProperty(this, "resolve", void 0);

    _defineProperty(this, "reject", void 0);

    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

}

exports.Defer = Defer;
//# sourceMappingURL=utils.js.map