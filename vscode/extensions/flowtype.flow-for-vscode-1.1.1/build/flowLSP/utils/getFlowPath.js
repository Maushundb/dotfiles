"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getFlowPath;

var _path = _interopRequireDefault(require("path"));

var _getExtentionPath = _interopRequireDefault(require("./getExtentionPath"));

var _which = _interopRequireDefault(require("./which"));

var _Logger = _interopRequireDefault(require("./Logger"));

var _importFresh = _interopRequireDefault(require("./importFresh"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

async function getFlowPath({
  pathToFlow,
  flowconfigDir,
  workspaceRoot,
  useNPMPackagedFlow,
  useBundledFlow,
  logger
}) {
  // 1) find using `npmPackagedFlow`
  if (useNPMPackagedFlow) {
    try {
      const flowPath = getNpmPackagedFlow(flowconfigDir, workspaceRoot, logger);
      logger.info('Found flow using option `useNPMPackagedFlow`');
      return flowPath;
    } catch (err) {
      logger.error(`Error loading flow using option 'useNPMPackagedFlow'\n${err.message}`);
    }
  } // 2) find using pathToFlow


  try {
    const flowPath = await getCommandFlowPath(normalizePathToFlow(pathToFlow, {
      flowconfigDir,
      workspaceRoot
    }), logger);
    logger.info('Found flow using option `pathToFlow`');
    return flowPath;
  } catch (err) {
    logger.error(`Error loading flow using option 'pathToFlow'\n${err.message}`);
  } // 3) if nothing works fallback to bundled flow


  if (useBundledFlow) {
    try {
      const flowPath = getBundledFlowPath();
      logger.info('Falling back to bundled flow.');
      return flowPath;
    } catch (err) {
      logger.error(`Failed to load bundled flow.\n${err.message}`);
    }
  }

  throw new Error('Flow not found');
}

function getNpmPackagedFlow(flowconfigDir, workspaceRoot, logger) {
  const dirsToCheck = [// a) check in flowconfig dir
  flowconfigDir, // b) check in workspaceRoot (ignore if flowconfigDir and workspaceRoot same)
  flowconfigDir !== workspaceRoot ? workspaceRoot : null].filter(Boolean);

  for (let i = 0; i < dirsToCheck.length; i += 1) {
    const flowPath = getFlowBinPath(dirsToCheck[i], logger);

    if (flowPath) {
      return flowPath;
    }
  }

  throw new Error(`Pkg flow-bin not found in ${dirsToCheck.join(', ')}`);
}

async function getCommandFlowPath(command, logger) {
  logger.trace(`Checking '${command}'`);
  const flowPath = await (0, _which.default)(command);

  if (!flowPath) {
    throw new Error(`'${command}' not found`);
  }

  return flowPath;
}

function getBundledFlowPath() {
  const extensionPath = (0, _getExtentionPath.default)(); // NOTE: 'vsce package' never bundles node_modules/.bin folder
  // (see: https://github.com/Microsoft/vscode/issues/53916)
  // so require module instead of using node_moudles/.bin

  const bundledFlowModulePath = _path.default.join(extensionPath, 'node_modules', 'flow-bin');

  return (0, _importFresh.default)(bundledFlowModulePath);
}

function getFlowBinPath(cwd, logger) {
  logger.trace(`Checking flow-bin in '${cwd}`);

  const flowBinModulePath = _path.default.join(cwd, 'node_modules', 'flow-bin');

  try {
    // user can change version of module or remove module while plugin is running
    // so always importFresh
    return (0, _importFresh.default)(flowBinModulePath);
  } catch (err) {
    logger.trace(`Error loading flow-bin from '${cwd}'\n${err.message}`);
  }

  return null;
}

function normalizePathToFlow(val, vars) {
  return _path.default.normalize(val // eslint-disable-next-line no-template-curly-in-string
  .replace('${workspaceFolder}', vars.workspaceRoot) // eslint-disable-next-line no-template-curly-in-string
  .replace('${flowconfigDir}', vars.flowconfigDir));
}
//# sourceMappingURL=getFlowPath.js.map