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
exports.FlowVersion = void 0;

var _FlowConstants = require("./FlowConstants");

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/*
 * Queries Flow for its version and caches the results. The version is a best guess: it is not 100%
 * guaranteed to be reliable due to caching, but will nearly always be correct.
 */
class FlowVersion {
  constructor(versionFn) {
    _defineProperty(this, "_lastVersion", void 0);

    _defineProperty(this, "_versionFn", void 0);

    this._versionFn = versionFn;
    this._lastVersion = null;
  }

  invalidateVersion() {
    this._lastVersion = null;
  }

  async getVersion() {
    const lastVersion = this._lastVersion;

    if (lastVersion == null) {
      return await this._queryAndSetVersion();
    }

    const msSinceReceived = Date.now() - lastVersion.receivedTime;

    if (msSinceReceived >= _FlowConstants.VERSION_TIMEOUT_MS) {
      return await this._queryAndSetVersion();
    }

    return lastVersion.version;
  }

  async _queryAndSetVersion() {
    const version = await this._versionFn();
    this._lastVersion = {
      version,
      receivedTime: Date.now()
    };
    return version;
  }

}

exports.FlowVersion = FlowVersion;
//# sourceMappingURL=FlowVersion.js.map