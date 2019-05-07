"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = findFlowconfig;

var _path = _interopRequireDefault(require("path"));

var _fsPlus = _interopRequireDefault(require("fs-plus"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

async function findFlowconfig(flowconfigName, startDir, endDir) {
  const dir = _path.default.resolve(startDir);

  const configPath = _path.default.join(dir, flowconfigName);

  const found = await checkFileExists(configPath);

  if (found) {
    return configPath;
  }

  if (dir === endDir) {
    return null;
  }

  return findFlowconfig(flowconfigName, _path.default.dirname(dir), endDir);
}

function checkFileExists(filepath) {
  return new Promise(resolve => {
    _fsPlus.default.access(filepath, err => {
      resolve(!err);
    });
  });
}
//# sourceMappingURL=findFlowconfig.js.map