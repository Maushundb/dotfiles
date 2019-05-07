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
exports.findVcs = findVcs;

var _process = require("./process");

var _main = _interopRequireDefault(require("../nuclide-remote-uri/lib/main"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const vcsInfoCache = {};

async function findVcsHelper(src) {
  const options = {
    cwd: _main.default.dirname(src)
  };
  const hgResult = await (0, _process.asyncExecute)('hg', ['root'], options);

  if (hgResult.exitCode === 0) {
    return {
      vcs: 'hg',
      root: hgResult.stdout.trim()
    };
  }

  const gitResult = await (0, _process.asyncExecute)('git', ['rev-parse', '--show-toplevel'], options);

  if (gitResult.exitCode === 0) {
    return {
      vcs: 'git',
      root: gitResult.stdout.trim()
    };
  }

  throw new Error('Could not find VCS for: ' + src);
}
/**
 * For the given source file, find the type of vcs that is managing it as well
 * as the root directory for the VCS.
 */


async function findVcs(src) {
  let vcsInfo = vcsInfoCache[src];

  if (vcsInfo) {
    return vcsInfo;
  }

  vcsInfo = await findVcsHelper(src);
  vcsInfoCache[src] = vcsInfo;
  return vcsInfo;
}
//# sourceMappingURL=vcs.js.map