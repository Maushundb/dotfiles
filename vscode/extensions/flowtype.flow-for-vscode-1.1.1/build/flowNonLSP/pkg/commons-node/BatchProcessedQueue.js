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
exports.default = void 0;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// A Queue which will process elements at intervals, only if the
// queue contains any elements.
class BatchProcessedQueue {
  constructor(batchPeriod, handler) {
    _defineProperty(this, "_batchPeriod", void 0);

    _defineProperty(this, "_handler", void 0);

    _defineProperty(this, "_timeoutId", void 0);

    _defineProperty(this, "_items", void 0);

    this._batchPeriod = batchPeriod;
    this._handler = handler;
    this._timeoutId = null;
    this._items = [];
  }

  add(item) {
    this._items.push(item);

    if (this._timeoutId === null) {
      this._timeoutId = setTimeout(() => {
        this._handleBatch();
      }, this._batchPeriod);
    }
  }

  _handleBatch() {
    this._timeoutId = null;
    const batch = this._items;
    this._items = [];

    this._handler(batch);
  }

  dispose() {
    if (this._timeoutId !== null) {
      clearTimeout(this._timeoutId);

      this._handleBatch();
    }
  }

}

exports.default = BatchProcessedQueue;
//# sourceMappingURL=BatchProcessedQueue.js.map