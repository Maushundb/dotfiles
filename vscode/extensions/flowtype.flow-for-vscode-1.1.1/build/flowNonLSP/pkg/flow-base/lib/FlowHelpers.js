"use strict";
'use babel';
/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _main = _interopRequireDefault(require("../../nuclide-remote-uri/lib/main"));

var _process = require("../../commons-node/process");

var _fsPromise = _interopRequireDefault(require("../../commons-node/fsPromise"));

var _lruCache = _interopRequireDefault(require("lru-cache"));

var _assert = _interopRequireDefault(require("assert"));

var _path = _interopRequireDefault(require("path"));

var _os = _interopRequireDefault(require("os"));

var _main2 = require("../../nuclide-logging/lib/main");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const logger = (0, _main2.getLogger)();
const flowConfigDirCache = (0, _lruCache.default)({
  max: 10,
  maxAge: 1000 * 30 //30 seconds

});
const flowPathCache = (0, _lruCache.default)({
  max: 10,
  maxAge: 1000 * 30 // 30 seconds

});

function insertAutocompleteToken(contents, line, col) {
  const lines = contents.split('\n');
  let theLine = lines[line];
  theLine = theLine.substring(0, col) + 'AUTO332' + theLine.substring(col);
  lines[line] = theLine;
  return lines.join('\n');
}
/**
 * Takes an autocomplete item from Flow and returns a valid autocomplete-plus
 * response, as documented here:
 * https://github.com/atom/autocomplete-plus/wiki/Provider-API
 */


function processAutocompleteItem(replacementPrefix, flowItem) {
  // Truncate long types for readability
  const description = flowItem.type.length < 80 ? flowItem.type : flowItem.type.substring(0, 80) + ' ...';
  let result = {
    description,
    displayText: flowItem.name,
    replacementPrefix
  };
  const funcDetails = flowItem.func_details;

  if (funcDetails) {
    // The parameters in human-readable form for use on the right label.
    const rightParamStrings = funcDetails.params.map(param => `${param.name}: ${param.type}`);
    const snippetString = getSnippetString(funcDetails.params.map(param => param.name));
    result = _objectSpread({}, result, {
      leftLabel: funcDetails.return_type,
      rightLabel: `(${rightParamStrings.join(', ')})`,
      snippet: `${flowItem.name}(${snippetString})`,
      type: 'function'
    });
  } else {
    result = _objectSpread({}, result, {
      rightLabel: flowItem.type,
      text: flowItem.name
    });
  }

  return result;
}

function getSnippetString(paramNames) {
  const groupedParams = groupParamNames(paramNames); // The parameters turned into snippet strings.

  const snippetParamStrings = groupedParams.map(params => params.join(', ')).map((param, i) => `\${${i + 1}:${param}}`);
  return snippetParamStrings.join(', ');
}
/**
 * Group the parameter names so that all of the trailing optional parameters are together with the
 * last non-optional parameter. That makes it easy to ignore the optional parameters, since they
 * will be selected along with the last non-optional parameter and you can just type to overwrite
 * them.
 */


function groupParamNames(paramNames) {
  // Split the parameters into two groups -- all of the trailing optional paramaters, and the rest
  // of the parameters. Trailing optional means all optional parameters that have only optional
  const [ordinaryParams, trailingOptional] = paramNames.reduceRight(([ordinary, optional], param) => {
    // If there have only been optional params so far, and this one is optional, add it to the
    // list of trailing optional params.
    if (isOptional(param) && ordinary.length === 0) {
      optional.unshift(param);
    } else {
      ordinary.unshift(param);
    }

    return [ordinary, optional];
  }, [[], []]);
  const groupedParams = ordinaryParams.map(param => [param]);
  const lastParam = groupedParams[groupedParams.length - 1];

  if (lastParam != null) {
    lastParam.push(...trailingOptional);
  } else if (trailingOptional.length > 0) {
    groupedParams.push(trailingOptional);
  }

  return groupedParams;
}

function isOptional(param) {
  (0, _assert.default)(param.length > 0);
  const lastChar = param[param.length - 1];
  return lastChar === '?';
}

function clearWorkspaceCaches() {
  flowPathCache.reset();
  flowConfigDirCache.reset();
  global.cachedPathToFlowBin = undefined;
}

async function isFlowInstalled() {
  const flowPath = await getPathToFlow();

  if (!flowPathCache.has(flowPath)) {
    flowPathCache.set(flowPath, (await canFindFlow(flowPath)));
  }

  return flowPathCache.get(flowPath);
}

async function canFindFlow(flowPath) {
  try {
    // https://github.com/facebook/nuclide/issues/561
    const {
      command,
      args
    } = buildSearchFlowCommand(flowPath);
    await (0, _process.checkOutput)(command, args);
    return true;
  } catch (e) {
    return false;
  }
}

async function getFlowAbsolutePath(flowPath) {
  const {
    command,
    args
  } = buildSearchFlowCommand(flowPath);
  const result = await (0, _process.asyncExecute)(command, args, {});

  if (result.exitCode !== 0) {
    return null;
  }

  const flowExecutable = process.platform === 'win32' ? 'flow.cmd' : 'flow';
  const files = result.stdout.split(_os.default.EOL).filter(f => f.endsWith(flowExecutable));

  if (files.length === 0) {
    return null;
  }

  return files[0];
}
/**
 * @return The path to Flow on the user's machine. First using the the user's 
 *   config, then looking into the node_modules for the project.
 * 
 *   It is cached, so it is expected that changing the users settings will 
 *   trigger a call to `clearWorkspaceCaches`.
 */


async function getPathToFlow() {
  if (!global.cachedPathToFlowBin) {
    const workspaceRoot = global.vscode.workspace.rootPath;
    const config = global.vscode.workspace.getConfiguration('flow');
    const shouldUseNodeModule = config.get('useNPMPackagedFlow');
    const userPath = config.get('pathToFlow').replace('${workspaceRoot}', workspaceRoot);
    const nodeModuleFlowPath = nodeModuleFlowLocation(workspaceRoot);

    if (shouldUseNodeModule && (await canFindFlow(nodeModuleFlowPath))) {
      global.cachedPathToFlowBin = nodeModuleFlowPath;
    } else if (await canFindFlow(userPath)) {
      global.cachedPathToFlowBin = await getFlowAbsolutePath(userPath);
    } else if (await canFindFlow('flow')) {
      global.cachedPathToFlowBin = await getFlowAbsolutePath('flow');
    } else {
      const extensionRoot = _path.default.resolve(__dirname, '../../../../');

      global.cachedPathToFlowBin = nodeModuleFlowLocation(extensionRoot);
    }

    logger.info("Path to Flow: " + global.cachedPathToFlowBin);
  }

  return global.cachedPathToFlowBin;
}
/**
 * @return The potential path to Flow on the user's machine if they are using NPM/Yarn to manage
 * their installs of flow.
 */


function nodeModuleFlowLocation(rootPath) {
  if (process.platform === 'win32') {
    return `${rootPath}\\node_modules\\.bin\\flow.cmd`;
  } else {
    return `${rootPath}/node_modules/.bin/flow`;
  }
}
/**
 * @return The command and arguments used to test the presence of flow according to platform.
 */


function buildSearchFlowCommand(testPath) {
  if (process.platform !== 'win32') {
    return {
      command: 'which',
      args: [testPath]
    };
  } else {
    const splitCharLocation = testPath.lastIndexOf('\\');
    const command = testPath.substring(splitCharLocation + 1, testPath.length);
    const searchDirectory = testPath.substring(0, splitCharLocation);
    const args = !searchDirectory ? [command] : ['/r', searchDirectory, command];
    return {
      command: `${process.env.SYSTEMROOT || 'C:\\Windows'}\\System32\\where`,
      args: args
    };
  }
}

function getStopFlowOnExit() {
  // $UPFixMe: This should use nuclide-features-config
  // Does not currently do so because this is an npm module that may run on the server.
  if (global.vscode) {
    return global.vscode.workspace.getConfiguration('flow').get('stopFlowOnExit');
  }

  return true;
}

function findFlowConfigDir(localFile) {
  if (!flowConfigDirCache.has(localFile)) {
    const flowConfigDir = _fsPromise.default.findNearestFile('.flowconfig', _main.default.dirname(localFile));

    flowConfigDirCache.set(localFile, flowConfigDir);
  }

  return flowConfigDirCache.get(localFile);
}

function flowCoordsToAtomCoords(flowCoords) {
  return {
    start: {
      line: flowCoords.start.line - 1,
      column: flowCoords.start.column - 1
    },
    end: {
      line: flowCoords.end.line - 1,
      // Yes, this is inconsistent. Yes, it works as expected in practice.
      column: flowCoords.end.column
    }
  };
}

module.exports = {
  buildSearchFlowCommand,
  findFlowConfigDir,
  getPathToFlow,
  getStopFlowOnExit,
  insertAutocompleteToken,
  isFlowInstalled,
  processAutocompleteItem,
  groupParamNames,
  flowCoordsToAtomCoords,
  clearWorkspaceCaches
};
//# sourceMappingURL=FlowHelpers.js.map