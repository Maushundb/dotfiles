"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const perf_1 = require("../util/perf");
perf_1.performance.mark('settings.ts');
const server_1 = require("../server");
const CSpellSettings = require("./CSpellSettings");
const vscode_1 = require("vscode");
perf_1.performance.mark('settings.ts imports 1');
const path = require("path");
const vscode_2 = require("vscode");
const vscode = require("vscode");
perf_1.performance.mark('settings.ts imports 2');
const util_1 = require("../util");
const watcher = require("../util/watcher");
const config = require("./config");
perf_1.performance.mark('settings.ts imports 3');
const fs = require("fs-extra");
perf_1.performance.mark('settings.ts imports 4');
perf_1.performance.mark('settings.ts imports done');
exports.baseConfigName = CSpellSettings.defaultFileName;
exports.configFileLocations = [
    exports.baseConfigName,
    exports.baseConfigName.toLowerCase(),
    `.vscode/${exports.baseConfigName}`,
    `.vscode/${exports.baseConfigName.toLowerCase()}`,
];
function watchSettingsFiles(callback) {
    // Every 10 seconds see if we have new files to watch.
    let busy = false;
    const intervalObj = setInterval(async () => {
        if (busy) {
            return;
        }
        busy = true;
        const settingsFiles = await findSettingsFiles();
        settingsFiles
            .map(uri => uri.fsPath)
            .filter(file => !watcher.isWatching(file))
            .forEach(file => watcher.add(file, callback));
        busy = false;
    }, 10000);
    return vscode.Disposable.from({ dispose: () => {
            watcher.dispose();
            clearInterval(intervalObj);
        } });
}
exports.watchSettingsFiles = watchSettingsFiles;
function getDefaultWorkspaceConfigLocation() {
    const { workspaceFolders } = vscode_1.workspace;
    const root = workspaceFolders
        && workspaceFolders[0]
        && workspaceFolders[0].uri.fsPath;
    return root
        ? path.join(root, exports.baseConfigName)
        : undefined;
}
exports.getDefaultWorkspaceConfigLocation = getDefaultWorkspaceConfigLocation;
function hasWorkspaceLocation() {
    const { workspaceFolders } = vscode_1.workspace;
    return !!(workspaceFolders && workspaceFolders[0]);
}
exports.hasWorkspaceLocation = hasWorkspaceLocation;
function findSettingsFiles(uri) {
    const { workspaceFolders } = vscode_1.workspace;
    if (!workspaceFolders || !hasWorkspaceLocation()) {
        return Promise.resolve([]);
    }
    const folders = uri
        ? [vscode_1.workspace.getWorkspaceFolder(uri)].filter(a => !!a)
        : workspaceFolders;
    const possibleLocations = folders
        .map(folder => folder.uri.fsPath)
        .map(root => exports.configFileLocations.map(rel => path.join(root, rel)))
        .reduce((a, b) => a.concat(b));
    const found = possibleLocations
        .map(filename => fs.pathExists(filename)
        .then(exists => ({ filename, exists })));
    return Promise.all(found).then(found => found
        .filter(found => found.exists)
        .map(found => found.filename)
        .map(filename => vscode_2.Uri.file(filename)));
}
exports.findSettingsFiles = findSettingsFiles;
function findExistingSettingsFileLocation(uri) {
    return findSettingsFiles(uri)
        .then(uris => uris.map(uri => uri.fsPath))
        .then(paths => paths[0]);
}
exports.findExistingSettingsFileLocation = findExistingSettingsFileLocation;
function findSettingsFileLocation() {
    return findExistingSettingsFileLocation()
        .then(path => path || getDefaultWorkspaceConfigLocation());
}
exports.findSettingsFileLocation = findSettingsFileLocation;
function loadTheSettingsFile() {
    return findSettingsFileLocation()
        .then(loadSettingsFile);
}
exports.loadTheSettingsFile = loadTheSettingsFile;
function loadSettingsFile(path) {
    return path
        ? CSpellSettings.readSettings(path).then(settings => (path ? { path, settings } : undefined))
        : Promise.resolve(undefined);
}
exports.loadSettingsFile = loadSettingsFile;
function setEnableSpellChecking(target, enabled) {
    return config.setSettingInVSConfig('enabled', enabled, target);
}
exports.setEnableSpellChecking = setEnableSpellChecking;
function getEnabledLanguagesFromConfig(scope) {
    return config.getScopedSettingFromVSConfig('enabledLanguageIds', scope) || [];
}
exports.getEnabledLanguagesFromConfig = getEnabledLanguagesFromConfig;
/**
 * @description Enable a programming language
 * @param target - which level of setting to set
 * @param languageId - the language id, e.g. 'typescript'
 */
async function enableLanguage(target, languageId) {
    await enableLanguageIdForTarget(languageId, true, target, true);
}
exports.enableLanguage = enableLanguage;
async function disableLanguage(target, languageId) {
    await enableLanguageIdForTarget(languageId, false, target, true);
}
exports.disableLanguage = disableLanguage;
function addWordToSettings(target, word) {
    const useGlobal = config.isGlobalTarget(target) || !hasWorkspaceLocation();
    const addWords = word.split(' ');
    const section = useGlobal ? 'userWords' : 'words';
    return updateSettingInConfig(section, target, words => util_1.unique(addWords.concat(words || []).sort()), true);
}
exports.addWordToSettings = addWordToSettings;
function addIgnoreWordToSettings(target, word) {
    const addWords = word.split(' ');
    return updateSettingInConfig('ignoreWords', target, words => util_1.unique(addWords.concat(words || []).sort()), true);
}
exports.addIgnoreWordToSettings = addIgnoreWordToSettings;
async function removeWordFromSettings(target, word) {
    const useGlobal = config.isGlobalTarget(target);
    const section = useGlobal ? 'userWords' : 'words';
    const toRemove = word.split(' ');
    return updateSettingInConfig(section, target, words => CSpellSettings.filterOutWords(words || [], toRemove), true);
}
exports.removeWordFromSettings = removeWordFromSettings;
function toggleEnableSpellChecker(target) {
    const resource = config.isConfigTargetWithResource(target) ? target.uri : null;
    const curr = config.getSettingFromVSConfig('enabled', resource);
    return config.setSettingInVSConfig('enabled', !curr, target);
}
exports.toggleEnableSpellChecker = toggleEnableSpellChecker;
/**
 * Enables the current programming language of the active file in the editor.
 */
function enableCurrentLanguage() {
    const editor = vscode.window && vscode.window.activeTextEditor;
    if (editor && editor.document && editor.document.languageId) {
        const target = config.createTargetForDocument(vscode_1.ConfigurationTarget.WorkspaceFolder, editor.document);
        return enableLanguage(target, editor.document.languageId);
    }
    return Promise.resolve();
}
exports.enableCurrentLanguage = enableCurrentLanguage;
/**
 * Disables the current programming language of the active file in the editor.
 */
function disableCurrentLanguage() {
    const editor = vscode.window && vscode.window.activeTextEditor;
    if (editor && editor.document && editor.document.languageId) {
        const target = config.createTargetForDocument(vscode_1.ConfigurationTarget.WorkspaceFolder, editor.document);
        return disableLanguage(target, editor.document.languageId);
    }
    return Promise.resolve();
}
exports.disableCurrentLanguage = disableCurrentLanguage;
async function enableLocal(target, local) {
    await enableLocalForTarget(local, true, target, true);
}
exports.enableLocal = enableLocal;
async function disableLocal(target, local) {
    await enableLocalForTarget(local, false, target, true);
}
exports.disableLocal = disableLocal;
function enableLocalForTarget(local, enable, target, isCreateAllowed) {
    const applyFn = enable
        ? (currentLanguage) => util_1.unique(server_1.normalizeLocal(currentLanguage).split(',').concat(local.split(','))).join(',')
        : (currentLanguage) => util_1.unique(server_1.normalizeLocal(currentLanguage).split(',')).filter(lang => lang !== local).join(',');
    return updateSettingInConfig('language', target, applyFn, isCreateAllowed, shouldUpdateCSpell(target));
}
exports.enableLocalForTarget = enableLocalForTarget;
function enableLanguageIdForTarget(languageId, enable, target, isCreateAllowed) {
    const fn = enable
        ? (src) => util_1.unique([languageId].concat(src || [])).sort()
        : (src) => {
            const v = src && util_1.unique(src.filter(v => v !== languageId)).sort();
            return v && v.length > 0 && v || undefined;
        };
    return updateSettingInConfig('enabledLanguageIds', target, fn, isCreateAllowed, shouldUpdateCSpell(target));
}
exports.enableLanguageIdForTarget = enableLanguageIdForTarget;
/**
 * Try to enable / disable a programming language id starting at folder level going to global level, stopping when successful.
 * @param languageId
 * @param enable
 * @param uri
 */
async function enableLanguageIdForClosestTarget(languageId, enable, uri) {
    if (languageId) {
        if (uri) {
            // Apply it to the workspace folder if it exists.
            const target = {
                target: vscode_1.ConfigurationTarget.WorkspaceFolder,
                uri,
            };
            if (await enableLanguageIdForTarget(languageId, enable, target, false))
                return;
        }
        if (vscode.workspace.workspaceFolders
            && vscode.workspace.workspaceFolders.length
            && await enableLanguageIdForTarget(languageId, enable, config.Target.Workspace, false)) {
            return;
        }
        // Apply it to User settings.
        await enableLanguageIdForTarget(languageId, enable, config.Target.Global, true);
    }
    return;
}
exports.enableLanguageIdForClosestTarget = enableLanguageIdForClosestTarget;
/**
 * Determine if we should update the cspell file if it exists.
 * 1. Update is allowed for WorkspaceFolders
 * 1. Update is allowed for Workspace if there is only 1 folder.
 * 1. Update is not allowed for the Global target.
 * @param target
 */
function shouldUpdateCSpell(target) {
    const cfgTarget = config.extractTarget(target);
    return cfgTarget !== config.Target.Global
        && vscode_1.workspace.workspaceFolders
        && (cfgTarget === config.Target.WorkspaceFolder || vscode_1.workspace.workspaceFolders.length === 1);
}
/**
 * Update Config Settings.
 * Writes to both the VS Config and the `cspell.json` if it exists.
 * If a `cspell.json` exists, it will be preferred over the VS Code config setting.
 * @param section the configuration value to set/update.
 * @param target the configuration level (Global, Workspace, WorkspaceFolder)
 * @param applyFn the function to calculate the new value.
 * @param create if the setting does not exist, then create it.
 * @param updateCSpell update the cspell.json file if it exists.
 */
async function updateSettingInConfig(section, target, applyFn, create, updateCSpell = true) {
    const scope = config.configTargetToScope(target);
    const orig = config.findScopedSettingFromVSConfig(section, scope);
    const uri = config.isConfigTargetWithOptionalResource(target) && target.uri || undefined;
    const settingsFilename = updateCSpell && !config.isGlobalLevelTarget(target) && await findExistingSettingsFileLocation(uri) || undefined;
    async function updateConfig() {
        if (create || orig.value !== undefined && orig.scope === config.extractScope(scope)) {
            const newValue = applyFn(orig.value);
            await config.setSettingInVSConfig(section, newValue, target);
            return { value: newValue };
        }
        return false;
    }
    async function updateCSpellFile(settingsFilename, defaultValue) {
        if (settingsFilename) {
            await CSpellSettings.readApplyUpdateSettingsFile(settingsFilename, settings => {
                const v = settings[section];
                const newValue = v !== undefined ? applyFn(v) : applyFn(defaultValue);
                const newSettings = Object.assign({}, settings);
                if (newValue === undefined) {
                    delete newSettings[section];
                }
                else {
                    newSettings[section] = newValue;
                }
                return newSettings;
            });
            return true;
        }
        return false;
    }
    const configResult = await updateConfig();
    const cspellResult = await updateCSpellFile(settingsFilename, orig.value);
    return [
        !!configResult,
        cspellResult
    ].reduce((a, b) => a || b, false);
}
exports.updateSettingInConfig = updateSettingInConfig;
perf_1.performance.mark('settings.ts done');
//# sourceMappingURL=settings.js.map