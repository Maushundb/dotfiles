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
exports.arrayRemove = arrayRemove;
exports.arrayEqual = arrayEqual;
exports.arrayCompact = arrayCompact;
exports.mapUnion = mapUnion;
exports.mapFilter = mapFilter;
exports.mapEqual = mapEqual;
exports.setIntersect = setIntersect;
exports.isEmpty = isEmpty;
exports.keyMirror = keyMirror;
exports.collect = collect;
exports.MultiMap = void 0;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function arrayRemove(array, element) {
  const index = array.indexOf(element);

  if (index >= 0) {
    array.splice(index, 1);
  }
}

function arrayEqual(array1, array2, equalComparator) {
  if (array1.length !== array2.length) {
    return false;
  }

  const equalFunction = equalComparator || ((a, b) => a === b);

  return array1.every((item1, i) => equalFunction(item1, array2[i]));
}
/**
 * Returns a copy of the input Array with all `null` and `undefined` values filtered out.
 * Allows Flow to typecheck the common `filter(x => x != null)` pattern.
 */


function arrayCompact(array) {
  const result = [];

  for (const elem of array) {
    if (elem != null) {
      result.push(elem);
    }
  }

  return result;
}
/**
 * Merges a given arguments of maps into one Map, with the latest maps
 * overriding the values of the prior maps.
 */


function mapUnion(...maps) {
  const unionMap = new Map();

  for (const map of maps) {
    for (const [key, value] of map) {
      unionMap.set(key, value);
    }
  }

  return unionMap;
}

function mapFilter(map, selector) {
  const selected = new Map();

  for (const [key, value] of map) {
    if (selector(key, value)) {
      selected.set(key, value);
    }
  }

  return selected;
}

function mapEqual(map1, map2) {
  if (map1.size !== map2.size) {
    return false;
  }

  for (const [key1, value1] of map1) {
    if (map2.get(key1) !== value1) {
      return false;
    }
  }

  return true;
}

function setIntersect(a, b) {
  return new Set(Array.from(a).filter(e => b.has(e)));
}
/**
 * O(1)-check if a given object is empty (has no properties, inherited or not)
 */


function isEmpty(obj) {
  for (const key in obj) {
    // eslint-disable-line no-unused-vars
    return false;
  }

  return true;
}
/**
 * Constructs an enumeration with keys equal to their value.
 * e.g. keyMirror({a: null, b: null}) => {a: 'a', b: 'b'}
 *
 * Based off the equivalent function in www.
 */


function keyMirror(obj) {
  const ret = {};
  Object.keys(obj).forEach(key => {
    ret[key] = key;
  });
  return ret;
}
/**
 * Given an array of [key, value] pairs, construct a map where the values for
 * each key are collected into an array of values, in order.
 */


function collect(pairs) {
  const result = new Map();

  for (const pair of pairs) {
    const [k, v] = pair;
    let list = result.get(k);

    if (list == null) {
      list = [];
      result.set(k, list);
    }

    list.push(v);
  }

  return result;
}

class MultiMap {
  // Invariant: no empty sets. They should be removed instead.
  // TODO may be worth defining a getter but no setter, to mimic Map. But please just behave and
  // don't mutate this from outside this class.
  //
  // Invariant: equal to the sum of the sizes of all the sets contained in this._map

  /* The total number of key-value bindings contained */
  constructor() {
    _defineProperty(this, "_map", void 0);

    _defineProperty(this, "size", void 0);

    this._map = new Map();
    this.size = 0;
  }
  /*
   * Returns the set of values associated with the given key. Do not mutate the given set. Copy it
   * if you need to store it past the next operation on this MultiMap.
   */


  get(key) {
    const set = this._map.get(key);

    if (set == null) {
      return new Set();
    }

    return set;
  }
  /*
   * Mimics the Map.prototype.set interface. Deliberately did not choose "set" as the name since the
   * implication is that it removes the previous binding.
   */


  add(key, value) {
    let set = this._map.get(key);

    if (set == null) {
      set = new Set();

      this._map.set(key, set);
    }

    if (!set.has(value)) {
      set.add(value);
      this.size++;
    }

    return this;
  }
  /*
   * Deletes a single binding. Returns true iff the binding existed.
   */


  delete(key, value) {
    const set = this.get(key);
    const didRemove = set.delete(value);

    if (set.size === 0) {
      this._map.delete(key);
    }

    if (didRemove) {
      this.size--;
    }

    return didRemove;
  }
  /*
   * Deletes all bindings associated with the given key. Returns true iff any bindings were deleted.
   */


  deleteAll(key) {
    const set = this.get(key);
    this.size -= set.size;
    return this._map.delete(key);
  }

  clear() {
    this._map.clear();

    this.size = 0;
  }

  has(key, value) {
    return this.get(key).has(value);
  }

  hasAny(key) {
    return this._map.has(key);
  }

}

exports.MultiMap = MultiMap;
//# sourceMappingURL=collection.js.map