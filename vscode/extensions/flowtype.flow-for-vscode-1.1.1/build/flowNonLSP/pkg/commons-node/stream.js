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
exports.observeStream = observeStream;
exports.observeRawStream = observeRawStream;
exports.splitStream = splitStream;
exports.bufferUntil = bufferUntil;
exports.cacheWhileSubscribed = cacheWhileSubscribed;
exports.diffSets = diffSets;
exports.reconcileSetDiffs = reconcileSetDiffs;
exports.toggle = toggle;
exports.compact = compact;
exports.takeWhileInclusive = takeWhileInclusive;
exports.CompositeSubscription = exports.DisposableSubscription = void 0;

var _assert = _interopRequireDefault(require("assert"));

var _eventKit = require("event-kit");

var _rxjs = require("rxjs");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * Observe a stream like stdout or stderr.
 */
function observeStream(stream) {
  return observeRawStream(stream).map(data => data.toString());
}

function observeRawStream(stream) {
  const error = _rxjs.Observable.fromEvent(stream, 'error').flatMap(_rxjs.Observable.throw);

  return _rxjs.Observable.fromEvent(stream, 'data').merge(error).takeUntil(_rxjs.Observable.fromEvent(stream, 'end'));
}
/**
 * Splits a stream of strings on newlines.
 * Includes the newlines in the resulting stream.
 * Sends any non-newline terminated data before closing.
 * Never sends an empty string.
 */


function splitStream(input) {
  return _rxjs.Observable.create(observer => {
    let current = '';

    function onEnd() {
      if (current !== '') {
        observer.next(current);
        current = '';
      }
    }

    return input.subscribe(value => {
      const lines = (current + value).split('\n');
      current = lines.pop();
      lines.forEach(line => observer.next(line + '\n'));
    }, error => {
      onEnd();
      observer.error(error);
    }, () => {
      onEnd();
      observer.complete();
    });
  });
}

class DisposableSubscription {
  constructor(subscription) {
    _defineProperty(this, "_subscription", void 0);

    this._subscription = subscription;
  }

  dispose() {
    this._subscription.unsubscribe();
  }

}

exports.DisposableSubscription = DisposableSubscription;

class CompositeSubscription {
  constructor(...subscriptions) {
    _defineProperty(this, "_subscription", void 0);

    this._subscription = new _rxjs.Subscription();
    subscriptions.forEach(sub => {
      this._subscription.add(sub);
    });
  }

  unsubscribe() {
    this._subscription.unsubscribe();
  }

} // TODO: We used to use `stream.buffer(stream.filter(...))` for this but it doesn't work in RxJS 5.
//  See https://github.com/ReactiveX/rxjs/issues/1610


exports.CompositeSubscription = CompositeSubscription;

function bufferUntil(stream, condition) {
  return _rxjs.Observable.create(observer => {
    let buffer = null;

    const flush = () => {
      if (buffer != null) {
        observer.next(buffer);
        buffer = null;
      }
    };

    return stream.subscribe(x => {
      if (buffer == null) {
        buffer = [];
      }

      buffer.push(x);

      if (condition(x)) {
        flush();
      }
    }, err => {
      flush();
      observer.error(err);
    }, () => {
      flush();
      observer.complete();
    });
  });
}
/**
 * Like Observable.prototype.cache(1) except it forgets the cached value when there are no
 * subscribers. This is useful so that if consumers unsubscribe and then subscribe much later, they
 * do not get an ancient cached value.
 *
 * This is intended to be used with cold Observables. If you have a hot Observable, `cache(1)` will
 * be just fine because the hot Observable will continue producing values even when there are no
 * subscribers, so you can be assured that the cached values are up-to-date.
 */


function cacheWhileSubscribed(input) {
  return input.multicast(() => new _rxjs.ReplaySubject(1)).refCount();
}

function subtractSet(a, b) {
  const result = new Set();
  a.forEach(value => {
    if (!b.has(value)) {
      result.add(value);
    }
  });
  return result;
}
/**
 * Shallowly compare two Sets.
 */


function setsAreEqual(a, b) {
  if (a.size !== b.size) {
    return false;
  }

  for (const item of a) {
    if (!b.has(item)) {
      return false;
    }
  }

  return true;
}
/**
 * Given a stream of sets, return a stream of diffs.
 * **IMPORTANT:** These sets are assumed to be immutable by convention. Don't mutate them!
 */


function diffSets(stream) {
  return _rxjs.Observable.concat(_rxjs.Observable.of(new Set()), // Always start with no items with an empty set
  stream).distinctUntilChanged(setsAreEqual).pairwise().map(([previous, next]) => ({
    added: subtractSet(next, previous),
    removed: subtractSet(previous, next)
  }));
}
/**
 * Give a stream of diffs, perform an action for each added item and dispose of the returned
 * disposable when the item is removed.
 */


function reconcileSetDiffs(diffs, addAction) {
  const itemsToDisposables = new Map();

  const disposeItem = item => {
    const disposable = itemsToDisposables.get(item);
    (0, _assert.default)(disposable != null);
    disposable.dispose();
    itemsToDisposables.delete(item);
  };

  const disposeAll = () => {
    itemsToDisposables.forEach(disposable => {
      disposable.dispose();
    });
    itemsToDisposables.clear();
  };

  return new _eventKit.CompositeDisposable(new DisposableSubscription(diffs.subscribe(diff => {
    // For every item that got added, perform the add action.
    diff.added.forEach(item => {
      itemsToDisposables.set(item, addAction(item));
    }); // "Undo" the add action for each item that got removed.

    diff.removed.forEach(disposeItem);
  })), new _eventKit.Disposable(disposeAll));
}

function toggle(source, toggler) {
  return toggler.distinctUntilChanged().switchMap(enabled => enabled ? source : _rxjs.Observable.empty());
}

function compact(source) {
  // Flow does not understand the semantics of `filter`
  return source.filter(x => x != null);
}
/**
 * Like `takeWhile`, but includes the first item that doesn't match the predicate.
 */


function takeWhileInclusive(source, predicate) {
  return _rxjs.Observable.create(observer => source.subscribe(x => {
    observer.next(x);

    if (!predicate(x)) {
      observer.complete();
    }
  }, err => {
    observer.error(err);
  }, () => {
    observer.complete();
  }));
}
//# sourceMappingURL=stream.js.map