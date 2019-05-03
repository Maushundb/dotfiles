"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_languageclient_1 = require("vscode-languageclient");
const vscode = require("vscode");
const Settings = require("../settings");
const LanguageIds = require("../settings/languageIds");
const util_1 = require("../util");
// The debug options for the server
const debugExecArgv = ['--nolazy', '--inspect=60048'];
const diagnosticCollectionName = 'cSpell';
const methodNames = {
    isSpellCheckEnabled: 'isSpellCheckEnabled',
    getConfigurationForDocument: 'getConfigurationForDocument',
    splitTextIntoWords: 'splitTextIntoWords',
};
const defaultGetConfigurationForDocumentResult = {
    languageEnabled: undefined,
    fileEnabled: undefined,
    settings: undefined,
    docSettings: undefined,
};
class CSpellClient {
    /**
     * @param: {string} module -- absolute path to the server module.
     */
    constructor(module, languageIds) {
        this.import = new Set();
        const enabledLanguageIds = Settings.getScopedSettingFromVSConfig('enabledLanguageIds', Settings.Scopes.Workspace);
        this.allowedSchemas = new Set(Settings.getScopedSettingFromVSConfig('allowedSchemas', Settings.Scopes.Workspace) || util_1.supportedSchemes);
        util_1.setOfSupportedSchemes.clear();
        this.allowedSchemas.forEach(schema => util_1.setOfSupportedSchemes.add(schema));
        this.languageIds = new Set(languageIds
            .concat(enabledLanguageIds || [])
            .concat(LanguageIds.languageIds));
        const uniqueLangIds = [...this.languageIds];
        const documentSelector = [...this.allowedSchemas]
            .map(scheme => uniqueLangIds.map(language => ({ language, scheme })))
            .reduce((a, b) => a.concat(b));
        // Options to control the language client
        const clientOptions = {
            documentSelector,
            diagnosticCollectionName,
            synchronize: {
                // Synchronize the setting section 'spellChecker' to the server
                configurationSection: ['cSpell', 'search']
            }
        };
        const execArgv = this.calcServerArgs();
        const options = { execArgv };
        // The debug options for the server
        const debugOptions = { execArgv: [...execArgv, ...debugExecArgv] };
        // If the extension is launched in debug mode the debug server options are use
        // Otherwise the run options are used
        const serverOptions = {
            run: { module, transport: vscode_languageclient_1.TransportKind.ipc, options },
            debug: { module, transport: vscode_languageclient_1.TransportKind.ipc, options: debugOptions }
        };
        // Create the language client and start the client.
        this.client = new vscode_languageclient_1.LanguageClient('cspell', 'Code Spell Checker', serverOptions, clientOptions);
        this.client.registerProposedFeatures();
    }
    needsStart() {
        return this.client.needsStart();
    }
    needsStop() {
        return this.client.needsStop();
    }
    start() {
        return this.client.start();
    }
    isSpellCheckEnabled(document) {
        const { uri, languageId = '' } = document;
        if (!uri || !languageId) {
            return Promise.resolve({});
        }
        return this.client.onReady().then(() => this.sendRequest(methodNames.isSpellCheckEnabled, { uri: uri.toString(), languageId }))
            .then((response) => response);
    }
    async getConfigurationForDocument(document) {
        if (!document) {
            return defaultGetConfigurationForDocumentResult;
        }
        const { uri, languageId = '' } = document;
        if (!uri || !languageId) {
            return defaultGetConfigurationForDocumentResult;
        }
        await this.client.onReady();
        const result = await this.sendRequest(methodNames.getConfigurationForDocument, { uri: uri.toString(), languageId });
        return result;
    }
    splitTextIntoDictionaryWords(text) {
        return this.client.onReady().then(() => this.sendRequest(methodNames.splitTextIntoWords, text));
    }
    notifySettingsChanged() {
        return this.client.onReady().then(() => this.sendNotification('onConfigChange'));
    }
    registerConfiguration(path) {
        return this.client.onReady().then(() => this.sendNotification('registerConfigurationFile', path));
    }
    get diagnostics() {
        return (this.client && this.client.diagnostics) || undefined;
    }
    triggerSettingsRefresh() {
        return this.notifySettingsChanged();
    }
    sendRequest(method, param) {
        return this.client.sendRequest(method, param);
    }
    sendNotification(method, params) {
        this.client.sendNotification(method, params);
    }
    static create(module) {
        return vscode.languages.getLanguages().then(langIds => new CSpellClient(module, langIds));
    }
    isLookBackSupported() {
        try {
            return /(?<=\s)x/.test(' x');
        }
        catch (_) {
        }
        return false;
    }
    calcServerArgs() {
        const args = [];
        if (!this.isLookBackSupported()) {
            args.push('--harmony_regexp_lookbehind');
        }
        return args;
    }
}
exports.CSpellClient = CSpellClient;
//# sourceMappingURL=client.js.map