"use strict";
'use babel';
/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

/**
 * This designed for logging on both Nuclide client and Nuclide server. It is based on [log4js]
 * (https://www.npmjs.com/package/log4js) with the ability to lazy initialize and update config
 * after initialized.
 * To make sure we only have one instance of log4js logger initialized globally, we save the logger
 * to `global` object.
 */

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.flushLogsAndExit = flushLogsAndExit;
exports.flushLogsAndAbort = flushLogsAndAbort;
exports.updateConfig = updateConfig;
exports.initialUpdateConfig = initialUpdateConfig;
exports.getLogger = getLogger;
exports.getCategoryLogger = getCategoryLogger;
exports.getPathToLogFileForToday = getPathToLogFileForToday;

var _stacktrace = _interopRequireDefault(require("./stacktrace"));

var _assert = _interopRequireDefault(require("assert"));

var _singleton = _interopRequireDefault(require("../../commons-node/singleton"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const DEFAULT_LOGGER_CATEGORY = 'nuclide';
const INITIAL_UPDATE_CONFIG_KEY = '_initial_update_config_key_';

function getCategory(category) {
  return category ? category : DEFAULT_LOGGER_CATEGORY;
}

function flushLogsAndExit(exitCode) {
  const log4js = require('log4js');

  log4js.shutdown(() => process.exit(exitCode));
}

function flushLogsAndAbort() {
  const log4js = require('log4js');

  log4js.shutdown(() => process.abort());
}
/**
 * Get log4js logger instance which is also singleton per category.
 * log4js.getLogger() API internally should already provide singleton per category guarantee
 * see https://github.com/nomiddlename/log4js-node/blob/master/lib/log4js.js#L120 for details.
 */


function getLog4jsLogger(category) {
  const log4js = require('log4js');

  return log4js.getLogger(category);
}

function updateConfig(config, options) {
  // update config takes affect global to all existing and future loggers.
  const log4js = require('log4js');

  log4js.configure(config, options);
} // Create a lazy logger that will not initialize the underlying log4js logger until
// `lazyLogger.$level(...)` is called. This way, another package could require nuclide-logging
// during activation without worrying about introducing a significant startup cost.


function createLazyLogger(category) {
  function createLazyLoggerMethod(level) {
    return function (...args) {
      const logger = getLog4jsLogger(category);
      (0, _assert.default)(logger);
      logger[level].apply(logger, args);
    };
  }

  function setLoggerLevelHelper(level) {
    const logger = getLog4jsLogger(category);
    (0, _assert.default)(logger);
    logger.setLevel(level);
  }

  function isLevelEnabledHelper(level) {
    const logger = getLog4jsLogger(category);
    (0, _assert.default)(logger);
    return logger.isLevelEnabled(level);
  }

  return {
    debug: createLazyLoggerMethod('debug'),
    error: createLazyLoggerMethod('error'),
    fatal: createLazyLoggerMethod('fatal'),
    info: createLazyLoggerMethod('info'),
    trace: createLazyLoggerMethod('trace'),
    warn: createLazyLoggerMethod('warn'),
    isLevelEnabled: isLevelEnabledHelper,
    setLevel: setLoggerLevelHelper
  };
}
/**
 * Push initial default config to log4js.
 * Execute only once.
 */


function initialUpdateConfig() {
  return _singleton.default.get(INITIAL_UPDATE_CONFIG_KEY, async () => {
    const defaultConfig = await require('./config').getDefaultConfig();
    updateConfig(defaultConfig);
  });
} // Get Logger instance which is singleton per logger category.


function getLogger(category) {
  (0, _stacktrace.default)();
  initialUpdateConfig();
  const loggerCategory = getCategory(category);
  return _singleton.default.get(loggerCategory, () => {
    return createLazyLogger(loggerCategory);
  });
}

// Utility function that returns a wrapper logger for input category.
function getCategoryLogger(category) {
  function setLogLevel(level) {
    getLogger(category).setLevel(level);
  }

  function logHelper(level, message) {
    const logger = getLogger(category); // isLevelEnabled() is required to reduce the amount of logging to
    // log4js which greatly improves performance.

    if (logger.isLevelEnabled(level)) {
      logger[level](message);
    }
  }

  function logTrace(message) {
    logHelper('trace', message);
  }

  function log(message) {
    logHelper('debug', message);
  }

  function logInfo(message) {
    logHelper('info', message);
  }

  function logError(message) {
    logHelper('error', message);
  }

  function logErrorAndThrow(message) {
    logError(message);
    logError(new Error().stack);
    throw new Error(message);
  }

  return {
    log,
    logTrace,
    logInfo,
    logError,
    logErrorAndThrow,
    setLogLevel
  };
}

function getPathToLogFileForToday() {
  return require('./config').getPathToLogFileForToday();
}
//# sourceMappingURL=main.js.map