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
exports.isRunningInClient = isRunningInClient;
exports.getAtomNuclideDir = getAtomNuclideDir;
exports.getAtomVersion = getAtomVersion;
exports.getNuclideVersion = getNuclideVersion;
exports.getNuclideRealDir = getNuclideRealDir;
exports.getOsType = getOsType;
exports.isRunningInWindows = isRunningInWindows;
exports.getOsVersion = getOsVersion;
exports.getFlowVersion = getFlowVersion;
exports.getClangVersion = getClangVersion;
exports.getRuntimePath = getRuntimePath;
exports.isRunningInTest = exports.isDevelopment = exports.OS_TYPE = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _assert = _interopRequireDefault(require("assert"));

var _once = _interopRequireDefault(require("./once"));

var _os = _interopRequireDefault(require("os"));

var _main = _interopRequireDefault(require("../nuclide-remote-uri/lib/main"));

var _process = require("./process");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const NUCLIDE_PACKAGE_JSON_PATH = require.resolve('../../../package.json');

const NUCLIDE_BASEDIR = _main.default.dirname(NUCLIDE_PACKAGE_JSON_PATH);

const pkgJson = JSON.parse(_fs.default.readFileSync(NUCLIDE_PACKAGE_JSON_PATH).toString());
const OS_TYPE = {
  WIN32: 'win32',
  WIN64: 'win64',
  LINUX: 'linux',
  OSX: 'darwin'
}; // "Development" is defined as working from source - not packaged code.
// apm/npm and internal releases don't package the base `.flowconfig`, so
// we use this to figure if we're packaged or not.

exports.OS_TYPE = OS_TYPE;
const isDevelopment = (0, _once.default)(() => {
  try {
    _fs.default.statSync(_main.default.join(NUCLIDE_BASEDIR, '.flowconfig'));

    return true;
  } catch (err) {
    return false;
  }
}); // Prior to Atom v1.7.0, `atom.inSpecMode` had a chance of performing an IPC call that could be
// expensive depending on how much work the other process was doing. Because this value will not
// change during run time, memoize the value to ensure the IPC call is performed only once.
//
// See [`getWindowLoadSettings`][1] for the sneaky getter and `remote` call that this memoization
// ensures happens only once.
//
// [1]: https://github.com/atom/atom/blob/v1.6.2/src/window-load-settings-helpers.coffee#L10-L14

exports.isDevelopment = isDevelopment;
const isRunningInTest = (0, _once.default)(() => {
  if (isRunningInClient()) {
    return atom.inSpecMode();
  } else {
    return process.env.NODE_ENV === 'test';
  }
});
exports.isRunningInTest = isRunningInTest;

function isRunningInClient() {
  return typeof atom !== 'undefined';
} // This path may be a symlink.


function getAtomNuclideDir() {
  if (!isRunningInClient()) {
    throw Error('Not running in Atom.');
  }

  const nuclidePackageModule = atom.packages.getLoadedPackage('nuclide');
  (0, _assert.default)(nuclidePackageModule);
  return nuclidePackageModule.path;
}

function getAtomVersion() {
  if (!isRunningInClient()) {
    throw Error('Not running in Atom.');
  }

  return atom.getVersion();
}

function getNuclideVersion() {
  return pkgJson.version;
}

function getNuclideRealDir() {
  return NUCLIDE_BASEDIR;
}

function getOsType() {
  return _os.default.platform();
}

function isRunningInWindows() {
  return getOsType() === OS_TYPE.WIN32 || getOsType() === OS_TYPE.WIN64;
}

function getOsVersion() {
  return _os.default.release();
}

async function getFlowVersion() {
  // $UPFixMe: This should use nuclide-features-config
  const flowPath = global.atom && global.atom.config.get('nuclide-flow.pathToFlow') || 'flow';
  const {
    stdout
  } = await (0, _process.checkOutput)(flowPath, ['--version']);
  return stdout.trim();
}

async function getClangVersion() {
  const {
    stdout
  } = await (0, _process.checkOutput)('clang', ['--version']);
  return stdout.trim();
}

function getRuntimePath() {
  // "resourcesPath" only exists in Atom. It's as close as you can get to
  // Atom's path. In the general case, it looks like this:
  // Mac: "/Applications/Atom.app/Contents/Resources"
  // Linux: "/usr/share/atom/resources"
  // Windows: "C:\\Users\\asuarez\\AppData\\Local\\atom\\app-1.6.2\\resources"
  //          "C:\Atom\resources"
  if (global.atom && typeof process.resourcesPath === 'string') {
    const resourcesPath = process.resourcesPath;

    if (_os.default.platform() === 'darwin') {
      return resourcesPath.replace(/\/Contents\/Resources$/, '');
    } else if (_os.default.platform() === 'linux') {
      return resourcesPath.replace(/\/resources$/, '');
    } else {
      return resourcesPath.replace(/[\\]+resources$/, '');
    }
  } else {
    return process.execPath;
  }
}
//# sourceMappingURL=system-info.js.map