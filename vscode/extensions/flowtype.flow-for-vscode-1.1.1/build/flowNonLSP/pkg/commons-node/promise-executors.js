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
exports.PromiseQueue = exports.PromisePool = void 0;

var _dequeue = _interopRequireDefault(require("dequeue"));

var _events = _interopRequireDefault(require("events"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * A pool that executes Promise executors in parallel given the poolSize, in order.
 *
 * The executor function passed to the constructor of a Promise is evaluated
 * immediately. This may not always be desirable. Use a PromisePool if you have
 * a sequence of async operations that need to be run in parallel and you also want
 * control the number of concurrent executions.
 */
class PromisePool {
  constructor(poolSize) {
    _defineProperty(this, "_fifo", void 0);

    _defineProperty(this, "_emitter", void 0);

    _defineProperty(this, "_numPromisesRunning", void 0);

    _defineProperty(this, "_poolSize", void 0);

    _defineProperty(this, "_nextRequestId", void 0);

    this._fifo = new _dequeue.default();
    this._emitter = new _events.default();
    this._numPromisesRunning = 0;
    this._poolSize = poolSize;
    this._nextRequestId = 1;
  }
  /**
   * @param executor A function that takes resolve and reject callbacks, just
   *     like the Promise constructor.
   * @return A Promise that will be resolved/rejected in response to the
   *     execution of the executor.
   */


  submit(executor) {
    const id = this._getNextRequestId();

    this._fifo.push({
      id,
      executor
    });

    const promise = new Promise((resolve, reject) => {
      this._emitter.once(id, result => {
        const {
          isSuccess,
          value
        } = result;
        (isSuccess ? resolve : reject)(value);
      });
    });

    this._run();

    return promise;
  }

  _run() {
    if (this._numPromisesRunning === this._poolSize) {
      return;
    }

    if (this._fifo.length === 0) {
      return;
    }

    const {
      id,
      executor
    } = this._fifo.shift();

    this._numPromisesRunning++;
    new Promise(executor).then(result => {
      this._emitter.emit(id, {
        isSuccess: true,
        value: result
      });

      this._numPromisesRunning--;

      this._run();
    }, error => {
      this._emitter.emit(id, {
        isSuccess: false,
        value: error
      });

      this._numPromisesRunning--;

      this._run();
    });
  }

  _getNextRequestId() {
    return (this._nextRequestId++).toString(16);
  }

}
/**
 * FIFO queue that executes Promise executors one at a time, in order.
 *
 * The executor function passed to the constructor of a Promise is evaluated
 * immediately. This may not always be desirable. Use a PromiseQueue if you have
 * a sequence of async operations that need to use a shared resource serially.
 */


exports.PromisePool = PromisePool;

class PromiseQueue {
  constructor() {
    _defineProperty(this, "_promisePool", void 0);

    this._promisePool = new PromisePool(1);
  }
  /**
   * @param executor A function that takes resolve and reject callbacks, just
   *     like the Promise constructor.
   * @return A Promise that will be resolved/rejected in response to the
   *     execution of the executor.
   */


  submit(executor) {
    return this._promisePool.submit(executor);
  }

}

exports.PromiseQueue = PromiseQueue;
//# sourceMappingURL=promise-executors.js.map