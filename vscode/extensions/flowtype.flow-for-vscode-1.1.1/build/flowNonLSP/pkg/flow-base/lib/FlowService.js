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
exports.dispose = dispose;
exports.getServerStatusUpdates = getServerStatusUpdates;
exports.flowFindDefinition = flowFindDefinition;
exports.flowFindDiagnostics = flowFindDiagnostics;
exports.flowGetAutocompleteSuggestions = flowGetAutocompleteSuggestions;
exports.flowGetType = flowGetType;
exports.flowGetCoverage = flowGetCoverage;
exports.flowGetOutline = flowGetOutline;
exports.allowServerRestart = allowServerRestart;

var _FlowRoot = require("./FlowRoot");

var _FlowRootContainer = require("./FlowRootContainer");

// Diagnostic information, returned from findDiagnostics.

/*
 * Each error or warning can consist of any number of different messages from
 * Flow to help explain the problem and point to different locations that may be
 * of interest.
 */
// If types are added here, make sure to also add them to FlowConstants.js. This needs to be the
// canonical type definition so that we can use these in the service framework.
// The origin of this type is at nuclide-tokenized-text/lib/main.js
// When updating update both locations!
// The origin of this type is at nuclide-tokenized-text/lib/main.js
// When updating update both locations!
// The origin of this type is at nuclide-tokenized-text/lib/main.js
// When updating update both locations!
let rootContainer = null;

function getRootContainer() {
  if (rootContainer == null) {
    rootContainer = new _FlowRootContainer.FlowRootContainer();
  }

  return rootContainer;
}

function dispose() {
  if (rootContainer != null) {
    rootContainer.dispose();
    rootContainer = null;
  }
}

function getServerStatusUpdates() {
  return getRootContainer().getServerStatusUpdates();
}

function flowFindDefinition(file, currentContents, line, column) {
  return getRootContainer().runWithRoot(file, root => root.flowFindDefinition(file, currentContents, line, column));
}

function flowFindDiagnostics(file, currentContents) {
  return getRootContainer().runWithRoot(file, root => root.flowFindDiagnostics(file, currentContents));
}

function flowGetAutocompleteSuggestions(file, currentContents, line, column, prefix, activatedManually) {
  return getRootContainer().runWithRoot(file, root => root.flowGetAutocompleteSuggestions(file, currentContents, line, column, prefix, activatedManually));
}

async function flowGetType(file, currentContents, line, column, includeRawType) {
  return getRootContainer().runWithRoot(file, root => root.flowGetType(file, currentContents, line, column, includeRawType));
}

async function flowGetCoverage(file) {
  return getRootContainer().runWithRoot(file, root => root.flowGetCoverage(file));
}

function flowGetOutline(currentContents) {
  return _FlowRoot.FlowRoot.flowGetOutline(currentContents);
}

function allowServerRestart() {
  for (const root of getRootContainer().getAllRoots()) {
    root.allowServerRestart();
  }
}
//# sourceMappingURL=FlowService.js.map