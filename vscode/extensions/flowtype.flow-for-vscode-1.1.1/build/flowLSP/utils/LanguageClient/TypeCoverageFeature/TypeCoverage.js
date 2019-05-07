"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var vscode = _interopRequireWildcard(require("vscode"));

var _TypeCoverageProvider = _interopRequireDefault(require("./TypeCoverageProvider"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class TypeCoverage {
  constructor(documentSelector, provider, options) {
    _defineProperty(this, "_subscriptions", []);

    _defineProperty(this, "_diagnostics", void 0);

    _defineProperty(this, "_documentSelector", void 0);

    _defineProperty(this, "_provider", void 0);

    _defineProperty(this, "_options", void 0);

    _defineProperty(this, "_state", void 0);

    _defineProperty(this, "_handleConnectionStatus", params => {
      this._setState({
        isConnected: params.isConnected
      });

      if (params.isConnected && vscode.window.activeTextEditor) {
        this._computeCoverage(vscode.window.activeTextEditor.document);
      }
    });

    this._provider = provider;
    this._options = options;
    this._documentSelector = documentSelector;
    this._state = {
      showUncovered: options.defaultShowUncovered,
      activeDocument: null,
      coverage: null,
      pendingRequest: null,
      isConnected: false
    };
    this._diagnostics = vscode.languages.createDiagnosticCollection('flow_coverage');

    this._subscriptions.push(this._provider.onConnectionStatus(this._handleConnectionStatus), this._diagnostics, vscode.commands.registerCommand(options.command, () => {
      this._setState({
        showUncovered: !this._state.showUncovered
      });
    }), vscode.workspace.onDidSaveTextDocument(document => this._computeCoverage(document)), vscode.window.onDidChangeActiveTextEditor(editor => {
      this._computeCoverage(editor ? editor.document : null);
    }));

    if (vscode.window.activeTextEditor) {
      this._computeCoverage(vscode.window.activeTextEditor.document);
    }
  }

  dispose() {
    this._subscriptions.forEach(item => item.dispose());

    if (this._state.pendingRequest) {
      this._state.pendingRequest.cancel();
    }
  }

  render() {
    this._renderCoverage();

    this._renderDiagnostics();
  }

  _renderCoverage() {
    const {
      _state: state
    } = this;
    const {
      coverage
    } = state;

    if (state.activeDocument && state.isConnected) {
      // computing coverage for first time
      if (!coverage && state.pendingRequest) {
        this._options.onChange({
          computing: true,
          coveredPercent: null,
          showingUncovered: state.showUncovered
        });

        return;
      } // update covearge


      if (coverage) {
        const computing = Boolean(state.pendingRequest);

        this._options.onChange({
          computing,
          coveredPercent: coverage.coveredPercent,
          showingUncovered: state.showUncovered
        });

        return;
      }
    }

    this._options.onChange(null);
  }

  _renderDiagnostics() {
    const {
      coverage,
      showUncovered,
      activeDocument,
      pendingRequest
    } = this._state;

    this._diagnostics.clear();

    if (!showUncovered || !activeDocument || pendingRequest) {
      return;
    }

    if (coverage && coverage.uncoveredRanges.length > 0) {
      const diagnostics = coverage.uncoveredRanges.map(uncoveredRange => uncoveredRangeToDiagnostic(uncoveredRange, this._options.diagnosticSeverity));

      this._diagnostics.set(activeDocument.uri, diagnostics);
    }
  }

  _setState(partialState) {
    this._state = _objectSpread({}, this._state, partialState);
    this.render();
  }

  _computeCoverage(document) {
    if (!this._state.isConnected || !document || !vscode.languages.match(this._documentSelector, document)) {
      this._setState({
        activeDocument: null,
        pendingRequest: null,
        coverage: null
      });

      return;
    }

    if (this._state.pendingRequest) {
      this._state.pendingRequest.cancel();
    }

    const pendingRequest = requestTypeCoverage(this._provider, document, coverage => {
      this._setState({
        pendingRequest: null,
        coverage
      });
    });

    this._setState({
      activeDocument: document,
      pendingRequest,
      // reset coverage when document changed
      coverage: this._state.activeDocument !== document ? null : this._state.coverage
    });
  }

}

exports.default = TypeCoverage;

function requestTypeCoverage(provider, document, callback) {
  let isCancelled = false;
  Promise.resolve(provider.provideTypeCoverage(document)).then(coverage => {
    if (!isCancelled) {
      return callback(coverage || null);
    }

    return null;
  });
  return {
    cancel: () => {
      isCancelled = true;
    }
  };
}

function uncoveredRangeToDiagnostic(uncoveredRange, severity) {
  const diagnostic = new vscode.Diagnostic(uncoveredRange.range, uncoveredRange.message || 'Not covered by flow', severity);
  diagnostic.source = 'Type Coverage';
  return diagnostic;
}
//# sourceMappingURL=TypeCoverage.js.map