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
exports.FlowRootContainer = void 0;

var _assert = _interopRequireDefault(require("assert"));

var _rxjs = require("rxjs");

var _FlowHelpers = require("./FlowHelpers");

var _FlowRoot = require("./FlowRoot");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class FlowRootContainer {
  // string rather than NuclideUri because this module will always execute at the location of the
  // file, so it will always be a real path and cannot be prefixed with nuclide://
  constructor() {
    _defineProperty(this, "_flowRootMap", void 0);

    _defineProperty(this, "_flowRoot$", void 0);

    _defineProperty(this, "_disposed", void 0);

    this._disposed = false;
    this._flowRootMap = new Map(); // No need to dispose of this subscription since we want to keep it for the entire life of this
    // object. When this object is garbage collected the subject should be too.

    this._flowRoot$ = new _rxjs.Subject();

    this._flowRoot$.subscribe(flowRoot => {
      this._flowRootMap.set(flowRoot.getPathToRoot(), flowRoot);
    });
  }

  async getRootForPath(path) {
    this._checkForDisposal();

    const rootPath = await (0, _FlowHelpers.findFlowConfigDir)(path); // During the await above, this may have been disposed. If so, return null to stop the current
    // operation.

    if (rootPath == null || this._disposed) {
      return null;
    }

    let instance = this._flowRootMap.get(rootPath);

    if (!instance) {
      instance = new _FlowRoot.FlowRoot(rootPath);

      this._flowRoot$.next(instance);
    }

    return instance;
  }

  async runWithRoot(file, f) {
    this._checkForDisposal();

    const instance = await this.getRootForPath(file);

    if (instance == null) {
      return null;
    }

    return await f(instance);
  }

  getAllRoots() {
    this._checkForDisposal();

    return this._flowRootMap.values();
  }

  getServerStatusUpdates() {
    this._checkForDisposal();

    return this._flowRoot$.flatMap(root => {
      const pathToRoot = root.getPathToRoot(); // The status update stream will be completed when a root is disposed, so there is no need to
      // use takeUntil here to truncate the stream and release resources.

      return root.getServerStatusUpdates().map(status => ({
        pathToRoot,
        status
      }));
    });
  }

  dispose() {
    this._checkForDisposal();

    this._flowRootMap.forEach(instance => instance.dispose());

    this._flowRootMap.clear();

    this._disposed = true;
  }

  _checkForDisposal() {
    (0, _assert.default)(!this._disposed, 'Method called on disposed FlowRootContainer');
  }

}

exports.FlowRootContainer = FlowRootContainer;
//# sourceMappingURL=FlowRootContainer.js.map