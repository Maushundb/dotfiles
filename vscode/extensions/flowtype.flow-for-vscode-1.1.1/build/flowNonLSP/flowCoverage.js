"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.Coverage = void 0;

var vscode = _interopRequireWildcard(require("vscode"));

var _FlowService = require("./pkg/flow-base/lib/FlowService");

var _util = require("./utils/util");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

let lastDiagnostics = null;

class Coverage {
  static createStatusBarItem() {
    const coverageStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    coverageStatus.tooltip = 'Flow type coverage. Click to toggle uncovered code';
    coverageStatus.command = 'flow.show-coverage';
    return coverageStatus;
  }

  constructor() {
    _defineProperty(this, "coverageStatus", void 0);

    _defineProperty(this, "state", void 0);

    this.coverageStatus = Coverage.createStatusBarItem();
    this.state = {
      showUncovered: (0, _util.shouldShowUncoveredCode)(),
      uri: null
    };
    vscode.commands.registerCommand('flow.show-coverage', () => {
      this.setState({
        showUncovered: !this.state.showUncovered
      });
    });
  }

  setState(newState) {
    this.state = Object.assign({}, this.state, newState);
    this.render();
  }

  update(uri) {
    this.setState({
      uri
    });
  }

  applyDiagnostics(coverageReport, uri) {
    if (lastDiagnostics) {
      lastDiagnostics.dispose();
    }

    lastDiagnostics = vscode.languages.createDiagnosticCollection();
    const {
      uncoveredRanges
    } = coverageReport;
    const diags = uncoveredRanges.map(item => {
      const range = new vscode.Range(item.start.line, item.start.column, item.end.line, item.end.column);
      const diag = new vscode.Diagnostic(range, 'uncovered code', vscode.DiagnosticSeverity.Information);
      diag.source = 'flow coverage';
      return diag;
    });

    if (this.state.showUncovered) {
      lastDiagnostics.set(uri, diags);
    }
  }

  async render() {
    const {
      uri
    } = this.state;

    if (!uri) {
      return null;
    }

    this.coverageStatus.show();

    try {
      const coverageReport = await (0, _FlowService.flowGetCoverage)(uri.fsPath);

      if (coverageReport) {
        const percentage = typeof coverageReport.percentage === 'number' && coverageReport.percentage.toFixed(1);
        this.coverageStatus.text = `Flow: ${percentage.toString()}%`;
        this.applyDiagnostics(coverageReport, uri);
      }
    } catch (e) {
      this.coverageStatus.text = '';
    }
  }

}

exports.Coverage = Coverage;
var _default = Coverage;
exports.default = _default;
//# sourceMappingURL=flowCoverage.js.map