"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var vscode = _interopRequireWildcard(require("vscode"));

var _path = _interopRequireDefault(require("path"));

var lsp = _interopRequireWildcard(require("../utils/LanguageClient"));

var _StatusBarWidget = _interopRequireDefault(require("./StatusBarWidget"));

var _createMiddleware = _interopRequireDefault(require("./createMiddleware"));

var _ClientCommands = _interopRequireDefault(require("./ClientCommands"));

var UUID = _interopRequireWildcard(require("vscode-languageclient/lib/utils/uuid"));

var _getFlowPath = _interopRequireDefault(require("../utils/getFlowPath"));

var _getFlowVersion = _interopRequireDefault(require("../utils/getFlowVersion"));

var _assertFlowSupportsLSP = _interopRequireDefault(require("../utils/assertFlowSupportsLSP"));

var _Logger = _interopRequireDefault(require("../utils/Logger"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class FlowLanguageClient {
  constructor(options) {
    _defineProperty(this, "_options", void 0);

    _defineProperty(this, "_statusBarWidget", void 0);

    _defineProperty(this, "_logger", void 0);

    _defineProperty(this, "_client", null);

    _defineProperty(this, "_id", void 0);

    _defineProperty(this, "commands", void 0);

    _defineProperty(this, "_handleInitError", err => {
      const msg = `Failed to start flow\n${err.toString()}`;

      this._logger.error(msg);

      this._setStatus({
        state: 'error',
        message: `${msg}`,
        actions: [{
          title: 'Retry',
          command: () => {
            this._reinit();
          }
        }]
      });
    });

    this._id = UUID.generateUuid();
    this._options = options;
    this.commands = new _ClientCommands.default(this);
    this._statusBarWidget = new _StatusBarWidget.default({
      clientName: this.getName(),
      flowconfig: this._options.flowconfigPath,
      onClickCommand: this.commands.clientActions
    });

    this._init();
  }

  getID() {
    return this._id;
  }

  getStatus() {
    return this._statusBarWidget.getStatus();
  }

  dispose() {
    this._statusBarWidget.dispose();

    this.commands.dispose();
    return this._disposeClient();
  }

  getName() {
    const {
      _options
    } = this;
    return _path.default.relative(_path.default.dirname(_options.workspaceRoot), _options.flowconfigPath);
  }

  restart() {
    this._logger.info('restarting client'); // NOTE: re-initializing instead of restarting client
    // as this will handle more error edge cases
    // (example flow is removed so we need to find flow again)


    this._reinit();
  }

  setActive(val) {
    if (val) {
      this._statusBarWidget.show();
    } else {
      this._statusBarWidget.hide();
    }
  }

  getWorkspaceRoot() {
    return this._options.workspaceRoot;
  }

  getFlowconfig() {
    return this._options.flowconfigPath;
  }

  getLogger() {
    return this._logger;
  }

  async _reinit() {
    try {
      await this._disposeClient();
    } catch (err) {// ignore error if disposeClient failed
    }

    await this._init();
  }

  async _init() {
    try {
      const config = this._options.getConfig();

      this._logger = this._createLogger(config);
      this._client = await this._createClient(config);

      this._client.start();
    } catch (err) {
      this._handleInitError(err);
    }
  }

  async _createClient(config) {
    const {
      _logger,
      _options,
      _statusBarWidget
    } = this;
    const {
      outputChannel,
      flowconfigPath,
      workspaceRoot
    } = _options;

    const flowconfigDir = _path.default.dirname(flowconfigPath);

    const flowPath = await (0, _getFlowPath.default)({
      pathToFlow: config.pathToFlow,
      flowconfigDir: _path.default.dirname(flowconfigPath),
      workspaceRoot,
      useNPMPackagedFlow: config.useNPMPackagedFlow,
      useBundledFlow: config.useBundledFlow,
      logger: _logger
    });
    const flowVersion = await (0, _getFlowVersion.default)(flowPath);

    _logger.info(`Using flow '${flowPath}' (v${flowVersion})`); // make sure flow support `flow lsp`


    (0, _assertFlowSupportsLSP.default)(flowVersion);

    _statusBarWidget.setFlowInfo({
      path: flowPath,
      version: flowVersion
    });

    const serverOptions = {
      command: flowPath,
      args: ['lsp', ...['--from', 'vscode'], ...(config.lazyMode ? ['--lazy-mode', config.lazyMode] : []), // auto stop flow process
      config.stopFlowOnExit ? '--autostop' : null].filter(Boolean) // see: clientOptions.workspaceFolder below
      // options: { cwd: flowconfigDir },

    }; // all files inside flowconfigDir

    const pattern = new vscode.RelativePattern(flowconfigDir, '**/*');
    const clientOptions = {
      // NOTE: nested .flowconfig filtering not possible using only documentSelector
      // so also using middleware to filter out nested files request from parent clients
      documentSelector: [{
        scheme: 'file',
        language: 'javascript',
        pattern
      }, {
        scheme: 'file',
        language: 'javascriptreact',
        pattern
      }],
      middleware: (0, _createMiddleware.default)(flowconfigPath),
      uriConverters: {
        code2Protocol: uri => uri.toString(true),
        // this disables URL-encoding for file URLs
        protocol2Code: value => vscode.Uri.parse(value)
      },
      outputChannel,
      // flow lsp throws error in many cases and lsp client by default opens up output panel on error
      // Should we make this configurable?? Maybe it's useful to know why some commands not working
      // in some cases.
      revealOutputChannelOn: lsp.RevealOutputChannelOn.Never,
      initializationOptions: {
        // [Partial 'runOnEdit' support]
        // flow lsp currently only support live syntax errors
        liveSyntaxErrors: config.liveSyntaxErrors
      },
      initializationFailedHandler: error => {
        this._handleInitError(error); // don't initialize again let user decide what to do


        return false;
      },
      errorHandler: {
        // called when `flow lsp` connection throws error
        // eslint-disable-next-line handle-callback-err
        error: (_error, _message, count) => {
          if (count && count <= 3) {
            return lsp.ErrorAction.Continue;
          } // throw error and let user decide what to do next


          this._setStatus({
            state: 'error',
            message: 'Connection to flow server is erroring. Shutting down server. See the output for more information.',
            actions: [{
              title: 'Go to output',
              command: () => {
                this.commands.runShowOutputCommand();
              }
            }, {
              title: 'Restart Client',
              command: () => {
                this.commands.runRestartClientCommand();
              }
            }]
          });

          return lsp.ErrorAction.Shutdown;
        },
        // Can we find the reason here somehow ??
        // For now adding 'Go to output' action. Maybe 'flow lsp' connection logged some error in output panel.
        closed: () => {
          this._setStatus({
            state: 'error',
            message: 'Connection to flow server got closed. See the output for more information.',
            actions: [{
              title: 'Go to output',
              command: () => {
                this.commands.runShowOutputCommand();
              }
            }, {
              title: 'Restart Client',
              command: () => {
                this.commands.runRestartClientCommand();
              }
            }]
          }); // DoNotRestart: user will decide what to do


          return lsp.CloseAction.DoNotRestart;
        }
      },
      // NOTE: we want client rootPath & cwd to be flowconfigPath
      // vscode-languageclient uses clientOptions.workspaceFolder (if passed) for cwd and rootPath
      // so passing dummy workspaceFolder with flowconfigDir as uri
      workspaceFolder: {
        name: flowconfigPath,
        index: 0,
        uri: vscode.Uri.file(flowconfigDir)
      },
      // NOTE: not part of official vscode-languageclient
      extensions: {
        status: {
          onChange: status => {
            if (status && status.state === 'error') {
              status.actions = [{
                title: 'Restart Client',
                command: () => {
                  this.commands.runRestartClientCommand();
                }
              }, ...(status.actions || [])];
            }

            this._setStatus(status);
          }
        },
        typeCoverage: {
          onChange: coverage => {
            this._statusBarWidget.setCoverage(coverage);
          },
          command: this.commands.toggleCoverage,
          defaultShowUncovered: config.coverage.showUncovered,
          diagnosticSeverity: config.coverage.diagnosticSeverity
        }
      }
    }; // Create the language client and start the client.

    const client = new lsp.LanguageClient('flow', 'Flow', serverOptions, clientOptions);
    return client;
  }

  _disposeClient() {
    return Promise.resolve(this._client ? this._client.stop() : undefined);
  }

  _createLogger(config) {
    const {
      _options
    } = this;
    return new _Logger.default(this.getName(), _options.outputChannel, config.logLevel);
  }

  _setStatus(status) {
    this._statusBarWidget.setStatus(status);

    if (status && status.state === 'error') {
      this.commands.runShowStatusCommand();
    }
  }

  logDebugInfo() {
    this._logger.info(JSON.stringify({
      flowconfig: this._options.flowconfigPath,
      flow: this._statusBarWidget.getFlowInfo(),
      serverStatus: this._statusBarWidget.getStatus()
    }, null, 2));
  }

}

exports.default = FlowLanguageClient;
//# sourceMappingURL=FlowLanguageClient.js.map