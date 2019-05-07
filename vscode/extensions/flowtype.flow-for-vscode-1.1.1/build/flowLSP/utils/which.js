"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = which;

var _which2 = _interopRequireDefault(require("which"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function which(command) {
  return new Promise(resolve => {
    (0, _which2.default)(command, {
      pathExt: '.cmd'
    }, (err, resolvedPath) => {
      if (err) {
        resolve(null);
      } else {
        resolve(resolvedPath);
      }
    });
  });
}
//# sourceMappingURL=which.js.map