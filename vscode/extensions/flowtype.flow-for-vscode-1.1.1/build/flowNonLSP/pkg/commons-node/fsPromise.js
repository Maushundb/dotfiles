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

var _fsPlus = _interopRequireDefault(require("fs-plus"));

var _mkdirp = _interopRequireDefault(require("mkdirp"));

var _main = _interopRequireDefault(require("../nuclide-remote-uri/lib/main"));

var _rimraf = _interopRequireDefault(require("rimraf"));

var _temp = _interopRequireDefault(require("temp"));

var _process = require("./process");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Create a temp directory with given prefix. The caller is responsible for cleaning up the
 *   drectory.
 * @param prefix optinal prefix for the temp directory name.
 * @return path to a temporary directory.
 */
function tempdir(prefix = '') {
  return new Promise((resolve, reject) => {
    _temp.default.mkdir(prefix, (err, dirPath) => {
      if (err) {
        reject(err);
      } else {
        resolve(dirPath);
      }
    });
  });
}
/**
 * @return path to a temporary file. The caller is responsible for cleaning up
 *     the file.
 */


function tempfile(options) {
  return new Promise((resolve, reject) => {
    _temp.default.open(options, (err, info) => {
      if (err) {
        reject(err);
      } else {
        _fsPlus.default.close(info.fd, closeErr => {
          if (closeErr) {
            reject(closeErr);
          } else {
            resolve(info.path);
          }
        });
      }
    });
  });
}
/**
 * Searches upward through the filesystem from pathToDirectory to find a file with
 * fileName.
 * @param fileName The name of the file to find.
 * @param pathToDirectory Where to begin the search. Must be a path to a directory,
 *   not a file.
 * @return directory that contains the nearest file or null.
 */


async function findNearestFile(fileName, pathToDirectory) {
  // TODO(5586355): If this becomes a bottleneck, we should consider memoizing
  // this function. The downside would be that if someone added a closer file
  // with fileName to pathToFile (or deleted the one that was cached), then we
  // would have a bug. This would probably be pretty rare, though.
  let currentPath = _main.default.resolve(pathToDirectory);

  do {
    // eslint-disable-line no-constant-condition
    const fileToFind = _main.default.join(currentPath, fileName);

    const hasFile = await exists(fileToFind); // eslint-disable-line babel/no-await-in-loop

    if (hasFile) {
      return currentPath;
    }

    if (_main.default.isRoot(currentPath)) {
      return null;
    }

    currentPath = _main.default.dirname(currentPath);
  } while (true);
}
/**
 * Searches upward through the filesystem from pathToDirectory to find the furthest
 * file with fileName.
 * @param fileName The name of the file to find.
 * @param pathToDirectory Where to begin the search. Must be a path to a directory,
 *   not a file.
 * @param stopOnMissing Stop searching when we reach a directory without fileName.
 * @return directory that contains the furthest file or null.
 */


async function findFurthestFile(fileName, pathToDirectory, stopOnMissing = false) {
  let currentPath = _main.default.resolve(pathToDirectory);

  let result = null;

  do {
    // eslint-disable-line no-constant-condition
    const fileToFind = _main.default.join(currentPath, fileName);

    const hasFile = await exists(fileToFind); // eslint-disable-line babel/no-await-in-loop

    if (!hasFile && stopOnMissing || _main.default.isRoot(currentPath)) {
      return result;
    } else if (hasFile) {
      result = currentPath;
    }

    currentPath = _main.default.dirname(currentPath);
  } while (true);
}

function getCommonAncestorDirectory(filePaths) {
  let commonDirectoryPath = _main.default.dirname(filePaths[0]);

  while (filePaths.some(filePath => !filePath.startsWith(commonDirectoryPath))) {
    commonDirectoryPath = _main.default.dirname(commonDirectoryPath);
  }

  return commonDirectoryPath;
}

function exists(filePath) {
  return new Promise((resolve, reject) => {
    _fsPlus.default.exists(filePath, resolve);
  });
}
/**
 * Runs the equivalent of `mkdir -p` with the given path.
 *
 * Like most implementations of mkdirp, if it fails, it is possible that
 * directories were created for some prefix of the given path.
 * @return true if the path was created; false if it already existed.
 */


async function mkdirp(filePath) {
  const isExistingDirectory = await exists(filePath);

  if (isExistingDirectory) {
    return false;
  } else {
    return new Promise((resolve, reject) => {
      (0, _mkdirp.default)(filePath, err => {
        if (err) {
          reject(err);
        } else {
          resolve(true);
        }
      });
    });
  }
}
/**
 * Removes directories even if they are non-empty. Does not fail if the directory doesn't exist.
 */


async function rmdir(filePath) {
  return new Promise((resolve, reject) => {
    (0, _rimraf.default)(filePath, err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}
/** @return true only if we are sure directoryPath is on NFS. */


async function isNfs(entityPath) {
  if (process.platform === 'linux' || process.platform === 'darwin') {
    const {
      stdout,
      exitCode
    } = await (0, _process.asyncExecute)('stat', ['-f', '-L', '-c', '%T', entityPath]);

    if (exitCode === 0) {
      return stdout.trim() === 'nfs';
    } else {
      return false;
    }
  } else {
    // TODO Handle other platforms (windows?): t9917576.
    return false;
  }
}
/**
 * Takes a method from Node's fs module and returns a "denodeified" equivalent, i.e., an adapter
 * with the same functionality, but returns a Promise rather than taking a callback. This isn't
 * quite as efficient as Q's implementation of denodeify, but it's considerably less code.
 */


function _denodeifyFsMethod(methodName) {
  return function (...args) {
    const method = _fsPlus.default[methodName];
    return new Promise((resolve, reject) => {
      method.apply(_fsPlus.default, args.concat([(err, result) => err ? reject(err) : resolve(result)]));
    });
  };
}

var _default = {
  tempdir,
  tempfile,
  findNearestFile,
  findFurthestFile,
  getCommonAncestorDirectory,
  exists,
  mkdirp,
  rmdir,
  isNfs,
  copy: _denodeifyFsMethod('copy'),
  chmod: _denodeifyFsMethod('chmod'),
  lstat: _denodeifyFsMethod('lstat'),
  mkdir: _denodeifyFsMethod('mkdir'),
  readdir: _denodeifyFsMethod('readdir'),
  readFile: _denodeifyFsMethod('readFile'),
  readlink: _denodeifyFsMethod('readlink'),
  realpath: _denodeifyFsMethod('realpath'),
  rename: _denodeifyFsMethod('rename'),
  move: _denodeifyFsMethod('move'),
  stat: _denodeifyFsMethod('stat'),
  symlink: _denodeifyFsMethod('symlink'),
  unlink: _denodeifyFsMethod('unlink'),
  writeFile: _denodeifyFsMethod('writeFile')
};
exports.default = _default;
//# sourceMappingURL=fsPromise.js.map