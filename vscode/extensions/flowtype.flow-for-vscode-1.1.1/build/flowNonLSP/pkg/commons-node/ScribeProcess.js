"use strict";
'use babel';
/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.__test__ = exports.default = void 0;

var _os = _interopRequireDefault(require("os"));

var _process = require("./process");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const DEFAULT_JOIN_TIMEOUT = 5000;
let SCRIBE_CAT_COMMAND = 'scribe_cat';
/**
 * A wrapper of `scribe_cat` (https://github.com/facebookarchive/scribe/blob/master/examples/scribe_cat)
 * command. User could call `new ScribeProcess($scribeCategoryName)` to create a process and then
 * call `scribeProcess.write($object)` to save an JSON schemaed Object into scribe category.
 * It will also recover from `scribe_cat` failure automatically.
 */

class ScribeProcess {
  constructor(scribeCategory) {
    _defineProperty(this, "_scribeCategory", void 0);

    _defineProperty(this, "_childPromise", void 0);

    _defineProperty(this, "_childProcessRunning", void 0);

    this._scribeCategory = scribeCategory;
    this._childProcessRunning = new WeakMap();

    this._getOrCreateChildProcess();
  }
  /**
   * Check if `scribe_cat` exists in PATH.
   */


  static async isScribeCatOnPath() {
    const {
      exitCode
    } = await (0, _process.asyncExecute)('which', [SCRIBE_CAT_COMMAND]);
    return exitCode === 0;
  }
  /**
   * Write a string to a Scribe category.
   * Ensure newlines are properly escaped.
   */


  async write(message) {
    const child = await this._getOrCreateChildProcess();
    return new Promise((resolve, reject) => {
      child.stdin.write(`${message}${_os.default.EOL}`, resolve);
    });
  }

  async dispose() {
    if (this._childPromise) {
      const child = await this._childPromise;

      if (this._childProcessRunning.get(child)) {
        child.kill();
      }
    }
  }

  async join(timeout = DEFAULT_JOIN_TIMEOUT) {
    if (this._childPromise) {
      const child = await this._childPromise;
      child.stdin.end();
      return new Promise(resolve => {
        child.on('exit', () => resolve());
        setTimeout(resolve, timeout);
      });
    }
  }

  _getOrCreateChildProcess() {
    if (this._childPromise) {
      return this._childPromise;
    }

    this._childPromise = (0, _process.safeSpawn)(SCRIBE_CAT_COMMAND, [this._scribeCategory]).then(child => {
      child.stdin.setDefaultEncoding('utf8');

      this._childProcessRunning.set(child, true);

      child.on('error', error => {
        this._childPromise = null;

        this._childProcessRunning.set(child, false);
      });
      child.on('exit', e => {
        this._childPromise = null;

        this._childProcessRunning.set(child, false);
      });
      return child;
    });
    return this._childPromise;
  }

}

exports.default = ScribeProcess;
const __test__ = {
  setScribeCatCommand(newCommand) {
    const originalCommand = SCRIBE_CAT_COMMAND;
    SCRIBE_CAT_COMMAND = newCommand;
    return originalCommand;
  }

};
exports.__test__ = __test__;
//# sourceMappingURL=ScribeProcess.js.map