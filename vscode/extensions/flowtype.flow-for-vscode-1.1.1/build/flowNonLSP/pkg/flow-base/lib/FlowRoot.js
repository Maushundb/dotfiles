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
exports.FlowRoot = void 0;

var _fuzzaldrin = require("fuzzaldrin");

var _semver = _interopRequireDefault(require("semver"));

var _main = require("../../nuclide-logging/lib/main");

var _FlowHelpers = require("./FlowHelpers");

var _FlowProcess = require("./FlowProcess");

var _FlowVersion = require("./FlowVersion");

var _astToOutline = require("./astToOutline");

var _diagnosticsParser = require("./diagnosticsParser");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const logger = (0, _main.getLogger)();

/** Encapsulates all of the state information we need about a specific Flow root */
class FlowRoot {
  // The path to the directory where the .flowconfig is -- i.e. the root of the Flow project.
  constructor(root) {
    _defineProperty(this, "_root", void 0);

    _defineProperty(this, "_process", void 0);

    _defineProperty(this, "_version", void 0);

    this._root = root;
    this._process = new _FlowProcess.FlowProcess(root);
    this._version = new _FlowVersion.FlowVersion(() => this._flowGetVersion());

    this._process.getServerStatusUpdates().filter(state => state === 'not running').subscribe(() => this._version.invalidateVersion());
  }

  dispose() {
    this._process.dispose();
  }

  allowServerRestart() {
    this._process.allowServerRestart();
  }

  getPathToRoot() {
    return this._root;
  }

  getServerStatusUpdates() {
    return this._process.getServerStatusUpdates();
  }

  async flowFindDefinition(file, currentContents, line, column) {
    const options = {}; // We pass the current contents of the buffer to Flow via stdin.
    // This makes it possible for get-def to operate on the unsaved content in
    // the user's editor rather than what is saved on disk. It would be annoying
    // if the user had to save before using the jump-to-definition feature to
    // ensure he or she got accurate results.

    options.stdin = currentContents;
    const args = ['get-def', '--json', '--path', file, line, column];

    try {
      const result = await this._process.execFlow(args, options);

      if (!result) {
        return null;
      }

      const json = parseJSON(args, result.stdout);

      if (json.path) {
        return {
          file: json.path,
          point: {
            line: json.line - 1,
            column: json.start - 1
          }
        };
      } else {
        return null;
      }
    } catch (e) {
      return null;
    }
  }
  /**
   * If currentContents is null, it means that the file has not changed since
   * it has been saved, so we can avoid piping the whole contents to the Flow
   * process.
   */


  async flowFindDiagnostics(file, currentContents) {
    await this._forceRecheck(file);
    const options = {};
    let args;

    if (currentContents) {
      options.stdin = currentContents; // Currently, `flow check-contents` returns all of the errors in the
      // project. It would be nice if it would use the path for filtering, as
      // currently the client has to do the filtering.

      args = ['check-contents', '--json', file];
    } else {
      // We can just use `flow status` if the contents are unchanged.
      args = ['status', '--json', file];
    }

    let result;

    try {
      // Don't log errors if the command returns a nonzero exit code, because status returns nonzero
      // if it is reporting any issues, even when it succeeds.
      result = await this._process.execFlow(args, options,
      /* waitForServer */
      true);

      if (!result) {
        return null;
      }
    } catch (e) {
      // This codepath will be exercised when Flow finds type errors as the
      // exit code will be non-zero. Note this codepath could also be exercised
      // due to a logical error in Nuclide, so we try to differentiate.
      if (e.exitCode !== undefined) {
        result = e;
      } else {
        logger.error(e);
        return null;
      }
    }

    let json;

    try {
      json = parseJSON(args, result.stdout);
    } catch (e) {
      return null;
    }

    return (0, _diagnosticsParser.flowStatusOutputToDiagnostics)(this._root, json);
  }

  async flowGetAutocompleteSuggestions(file, currentContents, line, column, prefix, activatedManually) {
    // We may want to make this configurable, but if it is ever higher than one we need to make sure
    // it works properly when the user manually activates it (e.g. with ctrl+space). See
    // https://github.com/atom/autocomplete-plus/issues/597
    //
    // If this is made configurable, consider using autocomplete-plus' minimumWordLength setting, as
    // per https://github.com/atom/autocomplete-plus/issues/594
    const minimumPrefixLength = 1; // Allows completions to immediately appear when we are completing off of object properties.
    // This also needs to be changed if minimumPrefixLength goes above 1, since after you type a
    // single alphanumeric character, autocomplete-plus no longer includes the dot in the prefix.

    const prefixHasDot = prefix.indexOf('.') !== -1; // If it is just whitespace and punctuation, ignore it (this keeps us
    // from eating leading dots).

    const replacementPrefix = /^[\s.]*$/.test(prefix) ? '' : prefix;

    if (!activatedManually && !prefixHasDot && replacementPrefix.length < minimumPrefixLength) {
      return [];
    }

    const options = {};
    const args = ['autocomplete', '--json', file];
    options.stdin = (0, _FlowHelpers.insertAutocompleteToken)(currentContents, line, column);

    try {
      const result = await this._process.execFlow(args, options);

      if (!result) {
        return [];
      }

      const json = parseJSON(args, result.stdout);
      let resultsArray;

      if (Array.isArray(json)) {
        // Flow < v0.20.0
        resultsArray = json;
      } else {
        // Flow >= v0.20.0. The output format was changed to support more detailed failure
        // information.
        resultsArray = json.result;
      }

      const candidates = resultsArray.map(item => (0, _FlowHelpers.processAutocompleteItem)(replacementPrefix, item));
      return (0, _fuzzaldrin.filter)(candidates, replacementPrefix, {
        key: 'displayText'
      });
    } catch (e) {
      return [];
    }
  }

  async flowGetType(file, currentContents, line, column, includeRawType) {
    const options = {};
    options.stdin = currentContents;
    line++;
    column++;
    const args = ['type-at-pos', '--json', '--path', file, line, column];

    if (includeRawType) {
      args.push('--raw');
    }

    let output;

    try {
      const result = await this._process.execFlow(args, options);

      if (!result) {
        return null;
      }

      output = result.stdout;

      if (output === '') {
        // if there is a syntax error, Flow returns the JSON on stderr while
        // still returning a 0 exit code (t8018595)
        output = result.stderr;
      }
    } catch (e) {
      return null;
    }

    let json;

    try {
      json = parseJSON(args, output);
    } catch (e) {
      return null;
    }

    const type = json.type;
    const rawType = json.raw_type;

    if (!type || type === '(unknown)' || type === '') {
      if (type === '') {
        // This should not happen. The Flow team believes it's an error in Flow
        // if it does. I'm leaving the condition here because it used to happen
        // before the switch to JSON and I'd rather log something than have the
        // user experience regress in case I'm wrong.
        logger.error('Received empty type hint from `flow type-at-pos`');
      }

      return null;
    }

    return {
      type,
      rawType
    };
  }

  async flowGetCoverage(path) {
    // The coverage command doesn't actually have the required information until Flow v0.28. For
    // earlier versions, we have to fall back on dump-types, which is slower especially in
    // pathological cases. We can remove this entirely when we want to stop supporting versions
    // earlier than v0.28.
    const version = await this._version.getVersion(); // Fall back to dump types if we don't know the version

    const useDumpTypes = version == null || _semver.default.lte(version, '0.27.0');

    return useDumpTypes ? await this._getCoverageViaDumpTypes(path) : await this._getCoverageViaCoverage(path);
  }

  async _getCoverageViaDumpTypes(path) {
    const args = ['dump-types', '--json', path];
    let result;

    try {
      result = await this._process.execFlow(args, {});
    } catch (e) {
      return null;
    }

    if (result == null) {
      return null;
    }

    let json;

    try {
      json = parseJSON(args, result.stdout);
    } catch (e) {
      // The error is already logged in parseJSON
      return null;
    }

    const allEntries = json;
    const uncoveredEntries = allEntries.filter(item => item.type === '' || item.type === 'any');
    const uncoveredRanges = uncoveredEntries.map(item => (0, _FlowHelpers.flowCoordsToAtomCoords)(item.loc));
    const uncoveredCount = uncoveredEntries.length;
    const totalCount = allEntries.length;
    const coveredCount = totalCount - uncoveredCount;
    return {
      percentage: totalCount === 0 ? 100 : coveredCount / totalCount * 100,
      uncoveredRanges
    };
  }

  async _getCoverageViaCoverage(path) {
    const args = ['coverage', '--json', path];
    let result;

    try {
      result = await this._process.execFlow(args, {});
    } catch (e) {
      return null;
    }

    if (result == null) {
      return null;
    }

    let json;

    try {
      json = parseJSON(args, result.stdout);
    } catch (e) {
      // The error is already logged in parseJSON
      return null;
    }

    const expressions = json.expressions;
    const uncoveredCount = expressions.uncovered_count;
    const coveredCount = expressions.covered_count;
    const totalCount = uncoveredCount + coveredCount;
    const uncoveredRanges = expressions.uncovered_locs.map(_FlowHelpers.flowCoordsToAtomCoords);
    return {
      percentage: totalCount === 0 ? 100 : coveredCount / totalCount * 100,
      uncoveredRanges
    };
  }

  async _forceRecheck(file) {
    try {
      await this._process.execFlow(['force-recheck', file],
      /* options */
      {}, // Make an attempt to force a recheck, but if the server is busy don't insist.

      /* waitsForServer */
      false,
      /* suppressErrors */
      true);
      return true;
    } catch (e) {
      // This command was introduced in Flow v0.23, so silently swallow errors to avoid logspam on
      // earlier versions, until we want to break support for earlier version.
      return false;
    }
  }

  async _flowGetVersion() {
    const args = ['version', '--json'];
    let json;

    try {
      const result = await _FlowProcess.FlowProcess.execFlowClient(args);

      if (result == null) {
        return null;
      }

      json = parseJSON(args, result.stdout);
    } catch (e) {
      logger.warn(e);
      return null;
    }

    return json.semver;
  }

  static async flowGetOutline(currentContents) {
    const options = {
      stdin: currentContents
    };
    const args = ['ast'];
    let json;

    try {
      const result = await _FlowProcess.FlowProcess.execFlowClient(args, options);

      if (result == null) {
        return null;
      }

      json = parseJSON(args, result.stdout);
    } catch (e) {
      logger.warn(e);
      return null;
    }

    try {
      return (0, _astToOutline.astToOutline)(json);
    } catch (e) {
      // Traversing the AST is an error-prone process and it's hard to be sure we've handled all the
      // cases. Fail gracefully if it does not work.
      logger.error(e);
      return null;
    }
  }

}

exports.FlowRoot = FlowRoot;

function parseJSON(args, value) {
  try {
    return JSON.parse(value);
  } catch (e) {
    logger.error(`Invalid JSON result from flow ${args.join(' ')}. JSON:\n'${value}'.`);
    throw e;
  }
}
//# sourceMappingURL=FlowRoot.js.map