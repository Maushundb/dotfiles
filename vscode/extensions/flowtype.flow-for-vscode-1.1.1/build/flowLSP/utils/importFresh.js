"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = importFresh;

var _clearModule = _interopRequireDefault(require("clear-module"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// NOTE: I am not using "import-fresh" or any similar package from npm
// as most of them only clear entry file from cache before importing
// in our use case we are using importFresh (for now) to load flow-bin node_module
// which internally requires package.json file to load version.
function importFresh(moduleId) {
  Object.keys(require.cache).forEach(filePath => {
    if (filePath.startsWith(moduleId)) {
      (0, _clearModule.default)(filePath);
    }
  });
  return require(moduleId);
}
//# sourceMappingURL=importFresh.js.map