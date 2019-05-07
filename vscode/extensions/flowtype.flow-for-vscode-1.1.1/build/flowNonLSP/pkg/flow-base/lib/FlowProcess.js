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
exports.FlowProcess = exports.FLOW_RETURN_CODES = void 0;

var _os = _interopRequireDefault(require("os"));

var _rxjs = require("rxjs");

var _main = require("../../nuclide-logging/lib/main");

var _process = require("../../commons-node/process");

var _FlowHelpers = require("./FlowHelpers");

var _FlowConstants = require("./FlowConstants");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const logger = (0, _main.getLogger)(); // import {track} from '../../nuclide-analytics';

// Names modeled after https://github.com/facebook/flow/blob/master/src/common/flowExitStatus.ml
const FLOW_RETURN_CODES = {
  ok: 0,
  serverInitializing: 1,
  typeError: 2,
  noServerRunning: 6,
  // This means that the server exists, but it is not responding, typically because it is busy doing
  // other work.
  outOfRetries: 7,
  buildIdMismatch: 9,
  unexpectedArgument: 64
};
exports.FLOW_RETURN_CODES = FLOW_RETURN_CODES;
const SERVER_READY_TIMEOUT_MS = 10 * 1000;
const EXEC_FLOW_RETRIES = 5;

class FlowProcess {
  // If we had to start a Flow server, store the process here so we can kill it when we shut down.
  // The current state of the Flow server in this directory
  // The path to the directory where the .flowconfig is -- i.e. the root of the Flow project.
  constructor(root) {
    _defineProperty(this, "_startedServer", void 0);

    _defineProperty(this, "_serverStatus", void 0);

    _defineProperty(this, "_root", void 0);

    this._serverStatus = new _rxjs.BehaviorSubject(_FlowConstants.ServerStatus.UNKNOWN);
    this._root = root;

    this._serverStatus.subscribe(status => {
      logger.info(`[${status}]: Flow server in ${this._root}`);
    });

    this._serverStatus.filter(x => x === _FlowConstants.ServerStatus.NOT_RUNNING).subscribe(() => {
      this._startFlowServer();

      this._pingServer();
    });

    function isBusyOrInit(status) {
      return status === _FlowConstants.ServerStatus.BUSY || status === _FlowConstants.ServerStatus.INIT;
    }

    this._serverStatus.filter(isBusyOrInit).subscribe(() => {
      this._pingServer();
    }); // this._serverStatus.filter(status => status === ServerStatus.FAILED).subscribe(() => {
    //   track('flow-server-failed');
    // });

  }

  async dispose() {
    this._serverStatus.complete();

    if (this._startedServer && (0, _FlowHelpers.getStopFlowOnExit)()) {
      // The default, SIGTERM, does not reliably kill the flow servers.
      this._startedServer.kill('SIGKILL');

      const pathToFlow = await (0, _FlowHelpers.getPathToFlow)();
      (0, _process.safeSpawn)(pathToFlow, ['stop'], this._getFlowExecOptions());
    }
  }
  /**
   * If the Flow server fails we will not try to restart it again automatically. Calling this
   * method lets us exit that state and retry.
   */


  allowServerRestart() {
    if (this._serverStatus.getValue() === _FlowConstants.ServerStatus.FAILED) {
      // We intentionally do not use _setServerStatus because leaving the FAILED state is a
      // special-case that _setServerStatus does not allow.
      this._serverStatus.next(_FlowConstants.ServerStatus.UNKNOWN);
    }
  }

  getServerStatusUpdates() {
    return this._serverStatus.asObservable();
  }
  /**
   * Returns null if Flow cannot be found.
   */


  async execFlow(args, options, waitForServer = false, suppressErrors = false) {
    const maxRetries = waitForServer ? EXEC_FLOW_RETRIES : 0;

    if (this._serverStatus.getValue() === _FlowConstants.ServerStatus.FAILED) {
      return null;
    }

    for (let i = 0;; i++) {
      try {
        const result = await this._rawExecFlow( // eslint-disable-line babel/no-await-in-loop
        args, options);
        return result;
      } catch (e) {
        const couldRetry = [_FlowConstants.ServerStatus.NOT_RUNNING, _FlowConstants.ServerStatus.INIT, _FlowConstants.ServerStatus.BUSY].indexOf(this._serverStatus.getValue()) !== -1;

        if (i < maxRetries && couldRetry) {
          await this._serverIsReady(); // eslint-disable-line babel/no-await-in-loop
          // Then try again.
        } else {
          // If it couldn't retry, it means there was a legitimate error. If it could retry, we
          // don't want to log because it just means the server is busy and we don't want to wait.
          if (!couldRetry && !suppressErrors) {
            // not sure what happened, but we'll let the caller deal with it
            const pathToFlow = await (0, _FlowHelpers.getPathToFlow)();
            logger.error(`Flow failed: ${pathToFlow} ${args.join(' ')}. Error: ${JSON.stringify(e)}`);
          }

          throw e;
        } // try again

      }
    } // otherwise flow complains
    // eslint-disable-next-line no-unreachable


    return null;
  }
  /** Starts a Flow server in the current root */


  async _startFlowServer() {
    const pathToFlow = await (0, _FlowHelpers.getPathToFlow)(); // `flow server` will start a server in the foreground. asyncExecute
    // will not resolve the promise until the process exits, which in this
    // case is never. We need to use spawn directly to get access to the
    // ChildProcess object.

    const serverProcess = await (0, _process.safeSpawn)( // eslint-disable-line babel/no-await-in-loop
    pathToFlow, ['server', '--from', 'nuclide', '--max-workers', this._getMaxWorkers().toString(), this._root], this._getFlowExecOptions());

    const logIt = data => {
      const pid = serverProcess.pid;
      logger.debug(`flow server (${pid}): ${data}`);
    };

    serverProcess.stdout.on('data', logIt);
    serverProcess.stderr.on('data', logIt);
    serverProcess.on('exit', (code, signal) => {
      // We only want to blacklist this root if the Flow processes
      // actually failed, rather than being killed manually. It seems that
      // if they are killed, the code is null and the signal is 'SIGTERM'.
      // In the Flow crashes I have observed, the code is 2 and the signal
      // is null. So, let's blacklist conservatively for now and we can
      // add cases later if we observe Flow crashes that do not fit this
      // pattern.
      if (code === 2 && signal === null) {
        logger.error('Flow server unexpectedly exited', this._root);

        this._setServerStatus(_FlowConstants.ServerStatus.FAILED);
      }
    });
    this._startedServer = serverProcess;
  }
  /** Execute Flow with the given arguments */


  async _rawExecFlow(args, options = {}) {
    const installed = await (0, _FlowHelpers.isFlowInstalled)();

    if (!installed) {
      this._updateServerStatus(null);

      return null;
    }

    const flowOptions = this._getFlowExecOptions();

    options = _objectSpread({}, flowOptions, options);
    args = [...args, '--retry-if-init', 'false', '--retries', '0', '--no-auto-start'];

    try {
      const result = await FlowProcess.execFlowClient(args, options);

      this._updateServerStatus(result);

      return result;
    } catch (e) {
      this._updateServerStatus(e);

      if (e.exitCode === FLOW_RETURN_CODES.typeError) {
        return e;
      } else {
        throw e;
      }
    }
  }

  _updateServerStatus(result) {
    let status;

    if (result == null) {
      status = _FlowConstants.ServerStatus.NOT_INSTALLED;
    } else {
      switch (result.exitCode) {
        case FLOW_RETURN_CODES.ok: // falls through

        case FLOW_RETURN_CODES.typeError:
          status = _FlowConstants.ServerStatus.READY;
          break;

        case FLOW_RETURN_CODES.serverInitializing:
          status = _FlowConstants.ServerStatus.INIT;
          break;

        case FLOW_RETURN_CODES.noServerRunning:
          status = _FlowConstants.ServerStatus.NOT_RUNNING;
          break;

        case FLOW_RETURN_CODES.outOfRetries:
          status = _FlowConstants.ServerStatus.BUSY;
          break;

        case FLOW_RETURN_CODES.buildIdMismatch:
          // If the version doesn't match, the server is automatically killed and the client
          // returns 9.
          logger.info('Killed flow server with incorrect version in', this._root);
          status = _FlowConstants.ServerStatus.NOT_RUNNING;
          break;

        case FLOW_RETURN_CODES.unexpectedArgument:
          // If we issued an unexpected argument we have learned nothing about the state of the Flow
          // server. So, don't update.
          return;

        default:
          logger.error(`Unknown return code from Flow: ${String(result.exitCode)}`);
          status = _FlowConstants.ServerStatus.UNKNOWN;
      }
    }

    this._setServerStatus(status);
  }

  _setServerStatus(status) {
    const currentStatus = this._serverStatus.getValue();

    if ( // Avoid duplicate updates
    status !== currentStatus && // Avoid moving the status away from FAILED, to let any existing  work die out when the
    // server fails.
    currentStatus !== _FlowConstants.ServerStatus.FAILED) {
      this._serverStatus.next(status);
    }
  }
  /** Ping the server until it leaves the current state */


  async _pingServer(tries = 5) {
    const fromState = this._serverStatus.getValue();

    let stateChanged = false;

    this._serverStatus.filter(newState => newState !== fromState).first().subscribe(() => {
      stateChanged = true;
    });

    for (let i = 0; !stateChanged && i < tries; i++) {
      /* eslint-disable babel/no-await-in-loop */
      await this._rawExecFlow(['status']).catch(() => null); // Wait 1 second

      await _rxjs.Observable.of(null).delay(1000).toPromise();
      /* eslint-enable babel/no-await-in-loop */
    }
  }
  /**
   * Resolves when the server is ready or the request times out, as indicated by the result of the
   * returned Promise.
   */


  _serverIsReady() {
    return this._serverStatus.filter(x => x === _FlowConstants.ServerStatus.READY).map(() => true).race(_rxjs.Observable.of(false).delay(SERVER_READY_TIMEOUT_MS)) // If the stream is completed timeout will not return its default value and we will see an
    // EmptyError. So, provide a defaultValue here so the promise resolves.
    .first(null, null, false).toPromise();
  }
  /**
  * If this returns null, then it is not safe to run flow.
  */


  _getFlowExecOptions() {
    return {
      cwd: this._root,
      env: _objectSpread({
        // Allows backtrace to be printed:
        // http://caml.inria.fr/pub/docs/manual-ocaml/runtime.html#sec279
        OCAMLRUNPARAM: 'b'
      }, process.env)
    };
  }

  _getMaxWorkers() {
    return Math.max(_os.default.cpus().length - 2, 1);
  }
  /**
   * This should be used to execute Flow commands that do not rely on a Flow server. So, they do not
   * need to be associated with a FlowProcess instance and they may be executed from any working
   * directory.
   *
   * Note that using this method means that you get no guarantee that the Flow version specified in
   * any given .flowconfig is the one that will be executed here, because it has no association with
   * any given root. If you need this property, create an instance with the appropriate root and use
   * execFlow.
   */


  static async execFlowClient(args, options = {}) {
    args = [...args, '--from', 'nuclide'];
    const pathToFlow = await (0, _FlowHelpers.getPathToFlow)();
    const ret = await (0, _process.asyncExecute)(pathToFlow, args, options);

    if (ret.exitCode !== 0) {
      // TODO: bubble up the exit code via return value instead
      throw ret;
    }

    return ret;
  }

}

exports.FlowProcess = FlowProcess;
//# sourceMappingURL=FlowProcess.js.map