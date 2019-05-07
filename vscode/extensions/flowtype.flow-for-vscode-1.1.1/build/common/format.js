"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = format;

var _prettier = _interopRequireDefault(require("prettier"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// NOTE: flow output is not always valid javascript and prettier only works if it can parse code.
// So I am trying to convert input to valid javascript before running prettier.
function format(input) {
  try {
    // if some `type` value
    // example: { a: string }
    const val = runPrettier(`type t = ${input}`);
    return val.replace('type t = ', '');
  } catch (err) {
    try {
      // if some valid javascript
      // example: type Props = { value: string };
      return runPrettier(input);
    } catch (_unused) {
      // cases which dont need formatting or we cant run prettier
      // example: `class XYZ`, `import name`
      return input;
    }
  }
}

function runPrettier(code) {
  return _prettier.default.format(code, {
    parser: 'flow',
    semi: false,
    // vscode uses max-width 500px on hover ui
    // prettier better handles wrapping
    // @TODO: use current fontSize to decide value (??)
    printWidth: 60
  });
}
//# sourceMappingURL=format.js.map