"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var vscode = _interopRequireWildcard(require("vscode"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const LOG_LEVEL = Object.freeze({
  error: 3,
  warn: 2,
  info: 1,
  trace: 0
});
// max of keys LOG_LEVEL
const MAX_LEVEL_LENGTH = Object.keys(LOG_LEVEL).reduce((maxLength, level) => {
  if (level.length > maxLength) {
    return level.length;
  }

  return maxLength;
}, 0);

class Logger {
  constructor(context, outputChannel, level) {
    _defineProperty(this, "_outputChannel", void 0);

    _defineProperty(this, "_level", void 0);

    _defineProperty(this, "_context", void 0);

    this._outputChannel = outputChannel;
    this._level = level;
    this._context = context;
  }

  error(message) {
    if (this._getLevelVal() <= LOG_LEVEL.error) {
      this._write(message, 'Error');
    }
  }

  warn(message) {
    if (this._getLevelVal() <= LOG_LEVEL.warn) {
      this._write(message, 'Warn');
    }
  }

  info(message) {
    if (this._getLevelVal() <= LOG_LEVEL.info) {
      this._write(message, 'Info');
    }
  }

  trace(message) {
    if (this._getLevelVal() <= LOG_LEVEL.trace) {
      this._write(message, 'Trace');
    }
  }

  _getLevelVal() {
    return LOG_LEVEL[this._level];
  }

  _write(message, level) {
    const levelStr = level.padEnd(MAX_LEVEL_LENGTH);
    const tag = [levelStr, new Date().toLocaleTimeString(), this._context ? this._context : null].filter(Boolean).join(' - ');

    this._outputChannel.appendLine(`[${tag}] ${message}`);
  }

}

exports.default = Logger;
//# sourceMappingURL=Logger.js.map