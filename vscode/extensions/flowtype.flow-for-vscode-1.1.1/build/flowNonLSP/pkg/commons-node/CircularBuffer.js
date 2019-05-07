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

var _Symbol$iterator = Symbol.iterator;

class CircularBuffer {
  /** The maximum number of elements this CircularBuffer can hold. */

  /** Whether this CircularBuffer has reached its capacity. */

  /**
   * Represents the state of the CircularBuffer when an Iterator for it is created. If the
   * state of the CircularBuffer changes while it is being iterated, it will throw an exception.
   */

  /**
   * @param capacity is the maximum number of elements this CircularBuffer can hold. It must be an
   *   integer greater than zero.
   */
  constructor(capacity) {
    _defineProperty(this, "_capacity", void 0);

    _defineProperty(this, "_elements", void 0);

    _defineProperty(this, "_nextInsertIndex", void 0);

    _defineProperty(this, "_isFull", void 0);

    _defineProperty(this, "_generation", void 0);

    if (!Number.isInteger(capacity)) {
      throw new Error(`capacity must be an integer, but was ${capacity}.`);
    }

    if (capacity <= 0) {
      throw new Error(`capacity must be greater than zero, but was ${capacity}.`);
    }

    this._capacity = capacity;
    this._elements = new Array(capacity);
    this._nextInsertIndex = 0;
    this._isFull = false;
    this._generation = 0;
  }
  /**
   * The maximum number of elements this CircularBuffer can hold.
   */


  get capacity() {
    return this._capacity;
  }

  push(element) {
    ++this._generation;
    this._elements[this._nextInsertIndex] = element;
    const nextIndex = this._nextInsertIndex + 1;
    this._nextInsertIndex = nextIndex % this._capacity;

    if (this._nextInsertIndex === 0 && !this._isFull) {
      this._isFull = true;
    }
  }
  /**
   * @return an `Iterator` that iterates through the last N elements added to the buffer where N
   *   is <= `capacty`. If the buffer is modified while it is being iterated, an Error will be
   *   thrown.
   */
  // $FlowIssue: t6187050


  [_Symbol$iterator]() {
    const generation = this._generation;
    let index = this._isFull ? this._nextInsertIndex : 0;
    let numIterations = this._isFull ? this._capacity : this._nextInsertIndex;

    const next = () => {
      if (numIterations === 0) {
        return {
          done: true,
          value: undefined
        };
      }

      if (generation !== this._generation) {
        throw new Error('CircularBuffer was modified during iteration.');
      }

      --numIterations;
      const value = this._elements[index];
      index = (index + 1) % this._capacity;
      return {
        done: false,
        value
      };
    };

    return {
      next
    };
  }

}

exports.default = CircularBuffer;
//# sourceMappingURL=CircularBuffer.js.map