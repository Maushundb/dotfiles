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
exports.default = debounce;

var _assert = _interopRequireDefault(require("assert"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function debounce(func, wait, immediate = false) {
  // Taken from: https://github.com/jashkenas/underscore/blob/b10b2e6d72/underscore.js#L815.
  let timeout;
  let args;
  let context;
  let timestamp = 0;
  let result;

  const later = function () {
    const last = Date.now() - timestamp;

    if (last < wait && last >= 0) {
      timeout = setTimeout(later, wait - last);
    } else {
      timeout = null;

      if (!immediate) {
        (0, _assert.default)(args);
        result = func.apply(context, args);

        if (!timeout) {
          context = args = null;
        }
      }
    }
  }; // $FlowIssue -- Flow's type system isn't expressive enough to type debounce.


  return function () {
    context = this; // eslint-disable-line consistent-this

    args = arguments;
    timestamp = Date.now();
    const callNow = immediate && !timeout;

    if (!timeout) {
      timeout = setTimeout(later, wait);
    }

    if (callNow) {
      result = func.apply(context, args);
      context = args = null;
    }

    return result;
  };
}
//# sourceMappingURL=debounce.js.map