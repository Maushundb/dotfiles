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
exports.createExecEnvironment = createExecEnvironment;
exports.safeSpawn = safeSpawn;
exports.forkWithExecEnvironment = forkWithExecEnvironment;
exports.createArgsForScriptCommand = createArgsForScriptCommand;
exports.scriptSafeSpawn = scriptSafeSpawn;
exports.scriptSafeSpawnAndObserveOutput = scriptSafeSpawnAndObserveOutput;
exports.createProcessStream = createProcessStream;
exports.observeProcessExit = observeProcessExit;
exports.getOutputStream = getOutputStream;
exports.observeProcess = observeProcess;
exports.asyncExecute = asyncExecute;
exports.checkOutput = checkOutput;
exports.runCommand = runCommand;
exports.__test__ = exports.ProcessExitError = exports.ProcessSystemError = void 0;

var _child_process = _interopRequireDefault(require("child_process"));

var _crossSpawn = _interopRequireDefault(require("cross-spawn"));

var _main = _interopRequireDefault(require("../nuclide-remote-uri/lib/main"));

var _stream = require("./stream");

var _rxjs = require("rxjs");

var _promiseExecutors = require("./promise-executors");

var _shellQuote = require("shell-quote");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class ProcessSystemError extends Error {
  constructor(opts) {
    super(`"${opts.command}" failed with code ${opts.code}`);

    _defineProperty(this, "command", void 0);

    _defineProperty(this, "args", void 0);

    _defineProperty(this, "options", void 0);

    _defineProperty(this, "code", void 0);

    _defineProperty(this, "originalError", void 0);

    this.name = 'ProcessSystemError';
    this.command = opts.command;
    this.args = opts.args;
    this.options = opts.options;
    this.code = opts.code;
    this.originalError = opts.originalError;
  }

}

exports.ProcessSystemError = ProcessSystemError;

class ProcessExitError extends Error {
  constructor(opts) {
    super(`"${opts.command}" failed with code ${opts.code}\n\n${opts.stderr}`);

    _defineProperty(this, "command", void 0);

    _defineProperty(this, "args", void 0);

    _defineProperty(this, "options", void 0);

    _defineProperty(this, "code", void 0);

    _defineProperty(this, "stdout", void 0);

    _defineProperty(this, "stderr", void 0);

    this.name = 'ProcessExitError';
    this.command = opts.command;
    this.args = opts.args;
    this.options = opts.options;
    this.code = opts.code;
    this.stdout = opts.stdout;
    this.stderr = opts.stderr;
  }

}

exports.ProcessExitError = ProcessExitError;
let platformPathPromise;
const blockingQueues = {};
const COMMON_BINARY_PATHS = ['/usr/bin', '/bin', '/usr/sbin', '/sbin', '/usr/local/bin'];
/**
 * Captures the value of the PATH env variable returned by Darwin's (OS X) `path_helper` utility.
 * `path_helper -s`'s return value looks like this:
 *
 *     PATH="/usr/bin"; export PATH;
 */

const DARWIN_PATH_HELPER_REGEXP = /PATH="([^"]+)"/;
const STREAM_NAMES = ['stdin', 'stdout', 'stderr'];

function getPlatformPath() {
  // Do not return the cached value if we are executing under the test runner.
  if (platformPathPromise && process.env.NODE_ENV !== 'test') {
    // Path is being fetched, await the Promise that's in flight.
    return platformPathPromise;
  } // We do not cache the result of this check because we have unit tests that temporarily redefine
  // the value of process.platform.


  if (process.platform === 'darwin') {
    // OS X apps don't inherit PATH when not launched from the CLI, so reconstruct it. This is a
    // bug, filed against Atom Linter here: https://github.com/AtomLinter/Linter/issues/150
    // TODO(jjiaa): remove this hack when the Atom issue is closed
    platformPathPromise = new Promise((resolve, reject) => {
      _child_process.default.execFile('/usr/libexec/path_helper', ['-s'], (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          const match = stdout.toString().match(DARWIN_PATH_HELPER_REGEXP);
          resolve(match && match.length > 1 ? match[1] : '');
        }
      });
    });
  } else {
    platformPathPromise = Promise.resolve('');
  }

  return platformPathPromise;
}
/**
 * Since OS X apps don't inherit PATH when not launched from the CLI, this function creates a new
 * environment object given the original environment by modifying the env.PATH using following
 * logic:
 *  1) If originalEnv.PATH doesn't equal to process.env.PATH, which means the PATH has been
 *    modified, we shouldn't do anything.
 *  1) If we are running in OS X, use `/usr/libexec/path_helper -s` to get the correct PATH and
 *    REPLACE the PATH.
 *  2) If step 1 failed or we are not running in OS X, APPEND commonBinaryPaths to current PATH.
 */


async function createExecEnvironment(originalEnv, commonBinaryPaths) {
  const execEnv = _objectSpread({}, originalEnv);

  if (execEnv.PATH !== process.env.PATH) {
    return execEnv;
  }

  execEnv.PATH = execEnv.PATH || '';
  let platformPath = null;

  try {
    platformPath = await getPlatformPath();
  } catch (error) {
    logError('Failed to getPlatformPath', error);
  } // If the platform returns a non-empty PATH, use it. Otherwise use the default set of common
  // binary paths.


  if (platformPath) {
    execEnv.PATH = platformPath;
  } else if (commonBinaryPaths.length) {
    const paths = _main.default.splitPathList(execEnv.PATH);

    commonBinaryPaths.forEach(commonBinaryPath => {
      if (paths.indexOf(commonBinaryPath) === -1) {
        paths.push(commonBinaryPath);
      }
    });
    execEnv.PATH = _main.default.joinPathList(paths);
  }

  return execEnv;
}

function logError(...args) {
  // Can't use nuclide-logging here to not cause cycle dependency.

  /*eslint-disable no-console*/
  console.error(...args);
  /*eslint-enable no-console*/
}

function monitorStreamErrors(process, command, args, options) {
  STREAM_NAMES.forEach(streamName => {
    // $FlowIssue
    const stream = process[streamName];

    if (stream == null) {
      return;
    }

    stream.on('error', error => {
      // This can happen without the full execution of the command to fail,
      // but we want to learn about it.
      logError(`stream error on stream ${streamName} with command:`, command, args, options, 'error:', error);
    });
  });
}
/**
 * Basically like spawn, except it handles and logs errors instead of crashing
 * the process. This is much lower-level than asyncExecute. Unless you have a
 * specific reason you should use asyncExecute instead.
 */


async function safeSpawn(command, args = [], options = {}) {
  options.env = await createExecEnvironment(options.env || process.env, COMMON_BINARY_PATHS);
  const child = (0, _crossSpawn.default)(command, args, options);
  monitorStreamErrors(child, command, args, options);
  child.on('error', error => {
    logError('error with command:', command, args, options, 'error:', error);
  });
  return child;
}

async function forkWithExecEnvironment(modulePath, args = [], options = {}) {
  const forkOptions = _objectSpread({}, options, {
    env: await createExecEnvironment(options.env || process.env, COMMON_BINARY_PATHS)
  });

  const child = _child_process.default.fork(modulePath, args, forkOptions);

  child.on('error', error => {
    logError('error from module:', modulePath, args, options, 'error:', error);
  });
  return child;
}
/**
 * Takes the command and args that you would normally pass to `spawn()` and returns `newArgs` such
 * that you should call it with `spawn('script', newArgs)` to run the original command/args pair
 * under `script`.
 */


function createArgsForScriptCommand(command, args = []) {
  if (process.platform === 'darwin') {
    // On OS X, script takes the program to run and its arguments as varargs at the end.
    return ['-q', '/dev/null', command].concat(args);
  } else {
    // On Linux, script takes the command to run as the -c parameter.
    const allArgs = [command].concat(args);
    return ['-q', '/dev/null', '-c', (0, _shellQuote.quote)(allArgs)];
  }
}
/**
 * Basically like safeSpawn, but runs the command with the `script` command.
 * `script` ensures terminal-like environment and commands we run give colored output.
 */


function scriptSafeSpawn(command, args = [], options = {}) {
  const newArgs = createArgsForScriptCommand(command, args);
  return safeSpawn('script', newArgs, options);
}
/**
 * Wraps scriptSafeSpawn with an Observable that lets you listen to the stdout and
 * stderr of the spawned process.
 */


function scriptSafeSpawnAndObserveOutput(command, args = [], options = {}) {
  return _rxjs.Observable.create(observer => {
    let childProcess;
    scriptSafeSpawn(command, args, options).then(proc => {
      childProcess = proc;
      childProcess.stdout.on('data', data => {
        observer.next({
          stdout: data.toString()
        });
      });
      let stderr = '';
      childProcess.stderr.on('data', data => {
        stderr += data;
        observer.next({
          stderr: data.toString()
        });
      });
      childProcess.on('exit', exitCode => {
        if (exitCode !== 0) {
          observer.error(stderr);
        } else {
          observer.complete();
        }

        childProcess = null;
      });
    });
    return () => {
      if (childProcess) {
        childProcess.kill();
      }
    };
  });
}
/**
 * Creates an observable with the following properties:
 *
 * 1. It contains a process that's created using the provided factory upon subscription.
 * 2. It doesn't complete until the process exits (or errors).
 * 3. The process is killed when there are no more subscribers.
 *
 * IMPORTANT: The exit event does NOT mean that all stdout and stderr events have been received.
 */


function _createProcessStream(createProcess, throwOnError) {
  return _rxjs.Observable.create(observer => {
    const promise = Promise.resolve(createProcess());
    let process;
    let disposed = false;
    let exited = false;

    const maybeKill = () => {
      if (process != null && disposed && !exited) {
        process.kill();
        process = null;
      }
    };

    promise.then(p => {
      process = p;
      maybeKill();
    }); // Create a stream that contains the process but never completes. We'll use this to build the
    // completion conditions.

    const processStream = _rxjs.Observable.fromPromise(promise).merge(_rxjs.Observable.never());

    const errors = processStream.switchMap(p => _rxjs.Observable.fromEvent(p, 'error'));
    const exit = processStream.flatMap(p => _rxjs.Observable.fromEvent(p, 'exit', (code, signal) => signal)) // An exit signal from SIGUSR1 doesn't actually exit the process, so skip that.
    .filter(signal => signal !== 'SIGUSR1').do(() => {
      exited = true;
    });
    const completion = throwOnError ? exit : exit.race(errors);
    return new _stream.CompositeSubscription(processStream.merge(throwOnError ? errors.flatMap(_rxjs.Observable.throw) : _rxjs.Observable.empty()).takeUntil(completion).subscribe(observer), () => {
      disposed = true;
      maybeKill();
    });
  }); // TODO: We should really `.share()` this observable, but there seem to be issues with that and
  //   `.retry()` in Rx 3 and 4. Once we upgrade to Rx5, we should share this observable and verify
  //   that our retry logic (e.g. in adb-logcat) works.
}

function createProcessStream(createProcess) {
  return _createProcessStream(createProcess, true);
}
/**
 * Observe the stdout, stderr and exit code of a process.
 * stdout and stderr are split by newlines.
 */


function observeProcessExit(createProcess) {
  return _createProcessStream(createProcess, false).flatMap(process => _rxjs.Observable.fromEvent(process, 'exit').take(1));
}

function getOutputStream(childProcess) {
  return _rxjs.Observable.fromPromise(Promise.resolve(childProcess)).flatMap(process => {
    // We need to start listening for the exit event immediately, but defer emitting it until the
    // output streams end.
    const exit = _rxjs.Observable.fromEvent(process, 'exit').take(1).map(exitCode => ({
      kind: 'exit',
      exitCode
    })).publishReplay();

    const exitSub = exit.connect();

    const error = _rxjs.Observable.fromEvent(process, 'error').map(errorObj => ({
      kind: 'error',
      error: errorObj
    }));

    const stdout = (0, _stream.splitStream)((0, _stream.observeStream)(process.stdout)).map(data => ({
      kind: 'stdout',
      data
    }));
    const stderr = (0, _stream.splitStream)((0, _stream.observeStream)(process.stderr)).map(data => ({
      kind: 'stderr',
      data
    }));
    return (0, _stream.takeWhileInclusive)(_rxjs.Observable.merge(_rxjs.Observable.merge(stdout, stderr).concat(exit), error), event => event.kind !== 'error' && event.kind !== 'exit').finally(() => {
      exitSub.unsubscribe();
    });
  });
}
/**
 * Observe the stdout, stderr and exit code of a process.
 */


function observeProcess(createProcess) {
  return _createProcessStream(createProcess, false).flatMap(getOutputStream);
}
/**
 * Returns a promise that resolves to the result of executing a process.
 *
 * @param command The command to execute.
 * @param args The arguments to pass to the command.
 * @param options Options for changing how to run the command.
 *     Supports the options listed here: http://nodejs.org/api/child_process.html
 *     in addition to the custom options listed in AsyncExecuteOptions.
 */


function asyncExecute(command, args, options = {}) {
  // Clone passed in options so this function doesn't modify an object it doesn't own.
  const localOptions = _objectSpread({}, options);

  const executor = (resolve, reject) => {
    let firstChild;
    let lastChild;
    let firstChildStderr;

    if (localOptions.pipedCommand) {
      // If a second command is given, pipe stdout of first to stdin of second. String output
      // returned in this function's Promise will be stderr/stdout of the second command.
      firstChild = (0, _crossSpawn.default)(command, args, localOptions);
      monitorStreamErrors(firstChild, command, args, localOptions);
      firstChildStderr = '';
      firstChild.on('error', error => {
        // Resolve early with the result when encountering an error.
        resolve({
          command: [command].concat(args).join(' '),
          errorMessage: error.message,
          errorCode: error.code,
          stderr: firstChildStderr,
          stdout: ''
        });
      });

      if (firstChild.stderr != null) {
        firstChild.stderr.on('data', data => {
          firstChildStderr += data;
        });
      }

      lastChild = (0, _crossSpawn.default)(localOptions.pipedCommand, localOptions.pipedArgs, localOptions);
      monitorStreamErrors(lastChild, command, args, localOptions); // pipe() normally pauses the writer when the reader errors (closes).
      // This is not how UNIX pipes work: if the reader closes, the writer needs
      // to also close (otherwise the writer process may hang.)
      // We have to manually close the writer in this case.

      if (lastChild.stdin != null && firstChild.stdout != null) {
        lastChild.stdin.on('error', () => {
          firstChild.stdout.emit('end');
        });
        firstChild.stdout.pipe(lastChild.stdin);
      }
    } else {
      lastChild = (0, _crossSpawn.default)(command, args, localOptions);
      monitorStreamErrors(lastChild, command, args, localOptions);
      firstChild = lastChild;
    }

    let stderr = '';
    let stdout = '';
    let timeout = null;

    if (localOptions.timeout != null) {
      timeout = setTimeout(() => {
        // Prevent the other handlers from firing.
        lastChild.removeAllListeners();
        lastChild.kill();
        resolve({
          command: [command].concat(args).join(' '),
          errorMessage: `Exceeded timeout of ${localOptions.timeout}ms`,
          errorCode: 'ETIMEDOUT',
          stderr,
          stdout
        });
      }, localOptions.timeout);
    }

    lastChild.on('close', exitCode => {
      resolve({
        exitCode,
        stderr,
        stdout
      });

      if (timeout != null) {
        clearTimeout(timeout);
      }
    });
    lastChild.on('error', error => {
      // Return early with the result when encountering an error.
      resolve({
        command: [command].concat(args).join(' '),
        errorMessage: error.message,
        errorCode: error.code,
        stderr,
        stdout
      });

      if (timeout != null) {
        clearTimeout(timeout);
      }
    });

    if (lastChild.stderr != null) {
      lastChild.stderr.on('data', data => {
        stderr += data;
      });
    }

    if (lastChild.stdout != null) {
      lastChild.stdout.on('data', data => {
        stdout += data;
      });
    }

    if (typeof localOptions.stdin === 'string' && firstChild.stdin != null) {
      // Note that the Node docs have this scary warning about stdin.end() on
      // http://nodejs.org/api/child_process.html#child_process_child_stdin:
      //
      // "A Writable Stream that represents the child process's stdin. Closing
      // this stream via end() often causes the child process to terminate."
      //
      // In practice, this has not appeared to cause any issues thus far.
      firstChild.stdin.write(localOptions.stdin);
      firstChild.stdin.end();
    }
  };

  function makePromise() {
    if (localOptions.queueName === undefined) {
      return new Promise(executor);
    } else {
      if (!blockingQueues[localOptions.queueName]) {
        blockingQueues[localOptions.queueName] = new _promiseExecutors.PromiseQueue();
      }

      return blockingQueues[localOptions.queueName].submit(executor);
    }
  }

  return createExecEnvironment(localOptions.env || process.env, COMMON_BINARY_PATHS).then(val => {
    localOptions.env = val;
    return makePromise();
  }, error => {
    localOptions.env = localOptions.env || process.env;
    return makePromise();
  });
}
/**
 * Simple wrapper around asyncExecute that throws if the exitCode is non-zero.
 */


async function checkOutput(command, args, options = {}) {
  const result = await asyncExecute(command, args, options);

  if (result.exitCode !== 0) {
    const reason = result.exitCode != null ? `exitCode: ${result.exitCode}` : `error: ${String(result.errorMessage)}`;
    throw new Error(`asyncExecute "${command}" failed with ${reason}, ` + `stderr: ${String(result.stderr)}, stdout: ${String(result.stdout)}.`);
  }

  return result;
}
/**
 * Run a command, accumulate the output. Errors are surfaced as stream errors and unsubscribing will
 * kill the process.
 */


function runCommand(command, args = [], options = {}) {
  return observeProcess(() => safeSpawn(command, args, options)).reduce((acc, event) => {
    switch (event.kind) {
      case 'stdout':
        acc.stdout += event.data;
        break;

      case 'stderr':
        acc.stderr += event.data;
        break;

      case 'error':
        acc.error = event.error;
        break;

      case 'exit':
        acc.exitCode = event.exitCode;
        break;
    }

    return acc;
  }, {
    error: null,
    stdout: '',
    stderr: '',
    exitCode: null
  }).map(acc => {
    if (acc.error != null) {
      throw new ProcessSystemError({
        command,
        args,
        options,
        code: acc.error.code,
        // Alias of errno
        originalError: acc.error // Just in case.

      });
    }

    if (acc.exitCode != null && acc.exitCode !== 0) {
      throw new ProcessExitError({
        command,
        args,
        options,
        code: acc.exitCode,
        stdout: acc.stdout,
        stderr: acc.stderr
      });
    }

    return acc.stdout;
  });
}

const __test__ = {
  DARWIN_PATH_HELPER_REGEXP
};
exports.__test__ = __test__;
//# sourceMappingURL=process.js.map