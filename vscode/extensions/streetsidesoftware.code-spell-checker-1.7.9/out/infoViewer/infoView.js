"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const perf_1 = require("../util/perf");
perf_1.performance.mark('infoView.ts');
const vscode = require("vscode");
const path = require("path");
const util_1 = require("../util");
const settingsViewer_1 = require("../../settingsViewer");
const cSpellInfo_1 = require("./cSpellInfo");
const settings_1 = require("../settings");
const pipe_1 = require("../util/pipe");
const commonPrefix_1 = require("../util/commonPrefix");
const Kefir = require("kefir");
const viewerPath = path.join('settingsViewer', 'webapp');
const title = 'Spell Checker Preferences';
let currentPanel = undefined;
let isDebugLogEnabled = false;
const targetToConfigurationTarget = {
    user: vscode.ConfigurationTarget.Global,
    workspace: vscode.ConfigurationTarget.Workspace,
    folder: vscode.ConfigurationTarget.WorkspaceFolder
};
function activate(context, client) {
    const root = context.asAbsolutePath(viewerPath);
    context.subscriptions.push(vscode.commands.registerCommand(cSpellInfo_1.commandDisplayCSpellInfo, async () => {
        const column = vscode.window.activeTextEditor && vscode.window.activeTextEditor.viewColumn || vscode.ViewColumn.Active;
        if (currentPanel) {
            currentPanel.reveal(column);
        }
        else {
            currentPanel = await createView(context, column, client);
        }
        updateView(currentPanel, root);
    }));
}
exports.activate = activate;
async function createView(context, column, client) {
    const root = context.asAbsolutePath(viewerPath);
    const state = await calcInitialState();
    const extPath = context.extensionPath;
    let notifyViewEmitter;
    const subscriptions = [];
    const options = {
        enableScripts: true,
        localResourceRoots: [
            vscode.Uri.file(root),
            vscode.Uri.file(extPath)
        ],
    };
    const panel = vscode.window.createWebviewPanel('cspellConfigViewer', title, column, options);
    const messageBus = new settingsViewer_1.MessageBus(webviewApiFromPanel(panel));
    async function calcStateSettings(activeDocumentUri, activeFolderUri) {
        const doc = activeDocumentUri && cSpellInfo_1.findMatchingDocument(activeDocumentUri);
        return calcSettings(doc, activeFolderUri, client);
    }
    async function refreshState() {
        log(`refreshState: uri "${state.activeDocumentUri}"`);
        state.settings = await calcStateSettings(state.activeDocumentUri, state.activeFolderUri);
    }
    function notifyView() {
        notifyViewEmitter && notifyViewEmitter.emit();
    }
    subscriptions.push(Kefir.stream((emitter) => {
        notifyViewEmitter = emitter;
        return () => { notifyViewEmitter = undefined; };
    })
        .debounce(250)
        .observe(() => {
        const { activeTabName: activeTab, settings } = state;
        log(`notifyView: tab ${activeTab}`);
        messageBus.postMessage({ command: 'ConfigurationChangeMessage', value: { activeTab, settings } });
    }));
    async function refreshStateAndNotify() {
        const level = settings_1.getSettingFromVSConfig('logLevel', null);
        isDebugLogEnabled = level === 'Debug';
        log('refreshStateAndNotify');
        await refreshState();
        await notifyView();
    }
    function setActiveDocumentUri(docUri) {
        state.activeDocumentUri = calcActiveDocumentUri(docUri) || state.activeDocumentUri;
    }
    function setActiveDocumentFromEditor(e) {
        setActiveDocumentUri(calcActiveDocumentFromEditor(e));
    }
    subscriptions.push(Kefir.stream(emitter => {
        vscode.workspace.onDidChangeConfiguration(() => emitter.value({}), null, context.subscriptions);
    })
        .debounce(500)
        .observe(() => refreshStateAndNotify()));
    vscode.window.onDidChangeActiveTextEditor(async (e) => {
        if (e) {
            setActiveDocumentFromEditor(e);
            await refreshStateAndNotify();
        }
    }, null, context.subscriptions);
    messageBus.listenFor('RequestConfigurationMessage', refreshStateAndNotify);
    messageBus.listenFor('SelectTabMessage', (msg) => {
        log(`SelectTabMessage: tab ${msg.value}`);
        state.activeTabName = msg.value;
    });
    messageBus.listenFor('SelectFolderMessage', (msg) => {
        log(`SelectFolderMessage: folder '${msg.value}'`);
        const uri = msg.value;
        const defaultFolder = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0];
        state.activeFolderUri = uri && vscode.Uri.parse(uri) || defaultFolder && defaultFolder.uri;
        refreshStateAndNotify();
    });
    messageBus.listenFor('SelectFileMessage', (msg) => {
        log(`SelectFolderMessage: folder '${msg.value}'`);
        const uri = msg.value;
        state.activeDocumentUri = uri && vscode.Uri.parse(uri) || state.activeDocumentUri;
        refreshStateAndNotify();
    });
    subscriptions.push(Kefir.stream((emitter) => {
        messageBus.listenFor('EnableLanguageIdMessage', (msg) => emitter.value(msg));
    })
        .debounce(20)
        .observe((msg) => {
        const { target, languageId, enable, uri } = msg.value;
        log(`EnableLanguageIdMessage: ${target}, ${languageId}, ${enable ? 'enable' : 'disable'}`);
        const uriFolder = uri ? vscode.Uri.parse(uri) : undefined;
        if (target) {
            const configTarget = { target: targetToConfigurationTarget[target], uri: uriFolder };
            settings_1.enableLanguageIdForTarget(languageId, enable, configTarget, true);
        }
        else {
            settings_1.enableLanguageIdForClosestTarget(languageId, enable, uriFolder);
        }
    }));
    subscriptions.push(Kefir.stream((emitter) => {
        messageBus.listenFor('EnableLocalMessage', (msg) => emitter.value(msg));
    })
        .debounce(20)
        .observe((msg) => {
        const { target, local, enable, uri } = msg.value;
        log(`EnableLocalMessage: ${target}, ${local}, ${enable ? 'enable' : 'disable'}`);
        const uriFolder = uri ? vscode.Uri.parse(uri) : undefined;
        const configTarget = { target: targetToConfigurationTarget[target], uri: uriFolder };
        if (enable) {
            settings_1.enableLocal(configTarget, local);
        }
        else {
            settings_1.disableLocal(configTarget, local);
        }
    }));
    panel.onDidDispose(() => {
        currentPanel = undefined;
        notifyViewEmitter = undefined;
        subscriptions.forEach(s => s.unsubscribe());
    }, null, context.subscriptions);
    return panel;
    function calcActiveDocumentUri(docUri) {
        return docUri && client.allowedSchemas.has(docUri.scheme) ? docUri : undefined;
    }
    function calcActiveDocumentFromEditor(e) {
        return calcActiveDocumentUri(e && e.document.uri);
    }
    async function calcInitialState() {
        const activeDocumentUri = calcActiveDocumentFromEditor(vscode.window.activeTextEditor);
        const folder = (activeDocumentUri && vscode.workspace.getWorkspaceFolder(activeDocumentUri))
            || (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0]);
        const activeFolderUri = folder && folder.uri;
        return {
            activeTabName: activeDocumentUri ? 'File' : 'User',
            activeDocumentUri,
            activeFolderUri,
            settings: await calcStateSettings(activeDocumentUri, activeFolderUri),
        };
    }
}
function getDefaultWorkspaceFolder() {
    return vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0];
}
function getDefaultWorkspaceFolderUri() {
    const folder = getDefaultWorkspaceFolder();
    return folder && folder.uri;
}
function normalizeFileName(filename) {
    const uri = vscode.Uri.file(filename);
    const folder = vscode.workspace.getWorkspaceFolder(uri);
    if (folder) {
        const folderPath = folder.uri.fsPath;
        return folder.name + filename.slice(folderPath.length);
    }
    if (!vscode.workspace.workspaceFolders || !vscode.workspace.workspaceFolders.length) {
        return path.basename(filename);
    }
    const folders = vscode.workspace.workspaceFolders;
    const prefix = commonPrefix_1.commonPrefix(folders.map(f => f.uri.fsPath).concat([filename]));
    return filename.slice(prefix.length);
}
async function calcSettings(document, folderUri, client) {
    const activeFolderUri = folderUri
        || getDefaultWorkspaceFolderUri()
        || null;
    const config = settings_1.inspectConfig(activeFolderUri);
    const docConfig = await client.getConfigurationForDocument(document);
    const settings = {
        knownLanguageIds: [...client.languageIds].sort(),
        dictionaries: extractDictionariesFromConfig(docConfig.settings),
        configs: extractViewerConfigFromConfig(config, docConfig, document),
        workspace: mapWorkspace(client.allowedSchemas),
        activeFileUri: document && document.uri.toString(),
        activeFolderUri: activeFolderUri && activeFolderUri.toString() || undefined,
    };
    return settings;
}
const keyMap = {
    'defaultValue': 'default',
    'globalValue': 'user',
    'workspaceValue': 'workspace',
    'workspaceFolderValue': 'folder',
};
const configOrder = ['globalValue', 'workspaceValue', 'workspaceFolderValue'];
function extractViewerConfigFromConfig(config, docConfig, doc) {
    function findNearestConfigField(orderPos, key) {
        for (let i = orderPos; i >= 0; --i) {
            const inspectKey = configOrder[i];
            const setting = config[inspectKey];
            if (setting && setting[key]) {
                return inspectKey;
            }
        }
        return 'defaultValue';
    }
    function extractNearestConfig(orderPos) {
        const localSource = findNearestConfigField(orderPos, 'language');
        const languageIdsEnabledSource = findNearestConfigField(orderPos, 'enabledLanguageIds');
        const cfg = {
            inherited: { locals: keyMap[localSource], languageIdsEnabled: keyMap[languageIdsEnabledSource] },
            locals: normalizeLocals(config[localSource].language),
            languageIdsEnabled: config[languageIdsEnabledSource].enabledLanguageIds,
        };
        return cfg;
    }
    function extractFileConfig() {
        const { languageEnabled, docSettings, fileEnabled } = docConfig;
        if (!doc)
            return undefined;
        const { uri, fileName, languageId, isUntitled } = doc;
        const enabledDicts = new Set(docSettings && docSettings.dictionaries || []);
        const dictionaries = extractDictionariesFromConfig(docSettings).filter(dic => enabledDicts.has(dic.name));
        log(`extractFileConfig languageEnabled: ${languageEnabled ? 'true' : 'false'}`);
        const cfg = {
            uri: uri.toString(),
            fileName,
            isUntitled,
            languageId,
            dictionaries,
            languageEnabled,
            fileEnabled,
        };
        return cfg;
    }
    return {
        user: extractNearestConfig(0),
        workspace: extractNearestConfig(1),
        folder: extractNearestConfig(2),
        file: extractFileConfig(),
    };
}
function extractDictionariesFromConfig(config) {
    if (!config) {
        return [];
    }
    const dictionaries = config.dictionaryDefinitions || [];
    const dictionariesByName = new Map(dictionaries
        .map(e => ({ name: e.name, locals: [], languageIds: [], description: e.description }))
        .map(e => [e.name, e]));
    const languageSettings = config.languageSettings || [];
    languageSettings.forEach(setting => {
        const locals = normalizeLocals(setting.local);
        const languageIds = normalizeId(setting.languageId);
        const dicts = setting.dictionaries || [];
        dicts.forEach(dict => {
            const dictEntry = dictionariesByName.get(dict);
            if (dictEntry) {
                dictEntry.locals = merge(dictEntry.locals, locals);
                dictEntry.languageIds = merge(dictEntry.languageIds, languageIds);
            }
        });
    });
    return [...dictionariesByName.values()];
}
function normalizeLocals(local) {
    return normalizeId(local);
}
function normalizeId(local) {
    return pipe_1.pipe(local, pipe_1.map(local => typeof local === 'string' ? local : local.join(',')), pipe_1.map(local => local.replace(/\*/g, '').split(/[,;]/).map(a => a.trim()).filter(a => !!a)), pipe_1.defaultTo([]));
}
function merge(left, right) {
    return left.concat(right).filter(util_1.uniqueFilter());
}
function webviewApiFromPanel(panel) {
    let _listener;
    const disposable = panel.webview.onDidReceiveMessage((msg) => {
        if (_listener) {
            _listener({ data: msg });
        }
    });
    const webviewApi = {
        set onmessage(listener) {
            _listener = listener;
        },
        postMessage(msg) {
            panel.webview.postMessage(msg);
            return webviewApi;
        },
    };
    return webviewApi;
}
function mapWorkspace(allowedSchemas) {
    function mapWorkspaceFolder(wsf) {
        const { name, index } = wsf;
        return {
            uri: wsf.uri.toString(),
            name,
            index,
        };
    }
    function mapTextDocuments(td) {
        const { fileName, languageId, isUntitled } = td;
        return {
            uri: td.uri.toString(),
            fileName: normalizeFileName(fileName),
            languageId,
            isUntitled
        };
    }
    const { name, workspaceFolders, textDocuments } = vscode.workspace;
    const workspace = {
        name,
        workspaceFolders: workspaceFolders
            ? workspaceFolders.map(mapWorkspaceFolder)
            : undefined,
        textDocuments: textDocuments.filter(td => allowedSchemas.has(td.uri.scheme)).map(mapTextDocuments),
    };
    return workspace;
}
async function updateView(panel, root) {
    log('updateView');
    const html = getHtml(root);
    panel.title = title;
    panel.webview.html = html;
}
function getHtml(root) {
    const resource = vscode.Uri.file(root).with({ scheme: 'vscode-resource' });
    return `
<!DOCTYPE html>
<html>
    <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CSpell Settings Viewer</title>
    <link href="${resource}/index.css" rel="stylesheet"></head>
    <body>
    <div id="root">Root</div>
    <script type="text/javascript" src="${resource}/index.bundle.js"></script></body>
</html>
`;
}
function log(msg) {
    if (!isDebugLogEnabled) {
        return;
    }
    const now = new Date();
    console.log(`${now.toISOString()} InfoView -- ${msg}`);
}
perf_1.performance.mark('infoView.ts Done');
//# sourceMappingURL=infoView.js.map