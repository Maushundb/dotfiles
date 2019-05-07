"use strict";
'use babel';
/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _ScribeProcess = _interopRequireDefault(require("../../commons-node/ScribeProcess"));

var _systemInfo = require("../../commons-node/system-info");

var _fsPromise = _interopRequireDefault(require("../../commons-node/fsPromise"));

var _userInfo = _interopRequireDefault(require("../../commons-node/userInfo"));

var _os = _interopRequireDefault(require("os"));

var _main = _interopRequireDefault(require("../../nuclide-remote-uri/lib/main"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const LOG_DIRECTORY = _main.default.join(_os.default.tmpdir(), `/nuclide-${(0, _userInfo.default)().username}-logs`);

const LOG_FILE_PATH = _main.default.join(LOG_DIRECTORY, 'nuclide.log');

let logDirectoryInitialized = false;

const scribeAppenderPath = _main.default.join(__dirname, '../fb/scribeAppender.js');

const LOG4JS_DATE_FORMAT = '-yyyy-MM-dd';

async function getServerLogAppenderConfig() {
  // Skip config scribe_cat logger if
  // 1) running in test environment
  // 2) or running in Atom client
  // 3) or running in open sourced version of nuclide
  // 4) or the scribe_cat command is missing.
  if ((0, _systemInfo.isRunningInTest)() || (0, _systemInfo.isRunningInClient)() || !(await _fsPromise.default.exists(scribeAppenderPath)) || !(await _ScribeProcess.default.isScribeCatOnPath())) {
    return null;
  }

  return {
    type: 'logLevelFilter',
    level: 'DEBUG',
    appender: {
      type: scribeAppenderPath,
      scribeCategory: 'errorlog_arsenal'
    }
  };
}
/**
 * @return The absolute path to the log file for the specified date.
 */


function getPathToLogFileForDate(targetDate) {
  const log4jsFormatter = require('log4js/lib/date_format').asString;

  return LOG_FILE_PATH + log4jsFormatter(LOG4JS_DATE_FORMAT, targetDate);
}
/**
 * @return The absolute path to the log file for today.
 */


function getPathToLogFileForToday() {
  return getPathToLogFileForDate(new Date());
}

module.exports = {
  async getDefaultConfig() {
    if (!logDirectoryInitialized) {
      await _fsPromise.default.mkdirp(LOG_DIRECTORY);
      logDirectoryInitialized = true;
    }

    const config = {
      appenders: [{
        type: 'logLevelFilter',
        level: 'INFO',
        appender: {
          type: _main.default.join(__dirname, './consoleAppender')
        }
      }, {
        type: 'dateFile',
        alwaysIncludePattern: true,
        absolute: true,
        filename: LOG_FILE_PATH,
        pattern: LOG4JS_DATE_FORMAT,
        layout: {
          type: 'pattern',
          // Format log in following pattern:
          // yyyy-MM-dd HH:mm:ss.mil $Level (pid:$pid) $categroy - $message.
          pattern: `%d{ISO8601} %p (pid:${process.pid}) %c - %m`
        }
      }]
    };
    const serverLogAppenderConfig = await getServerLogAppenderConfig();

    if (serverLogAppenderConfig) {
      config.appenders.push(serverLogAppenderConfig);
    }

    return config;
  },

  getPathToLogFileForToday,
  LOG_FILE_PATH,
  __test__: {
    getPathToLogFileForDate
  }
};
//# sourceMappingURL=config.js.map