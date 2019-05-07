"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const perf_1 = require("./util/perf");
perf_1.performance.mark('cspell_start_extension');
const path = require("path");
perf_1.performance.mark('import 1');
const settings_1 = require("./settings");
perf_1.performance.mark('import 2');
const settings = require("./settings");
perf_1.performance.mark('import 3');
perf_1.performance.mark('import 4');
const client_1 = require("./client");
perf_1.performance.mark('import 5');
perf_1.performance.mark('import 6');
const vscode = require("vscode");
perf_1.performance.mark('import 7');
const statusbar_1 = require("./statusbar");
perf_1.performance.mark('import 8');
const commands_1 = require("./commands");
perf_1.performance.mark('import 9');
const commands = require("./commands");
perf_1.performance.mark('import 10');
const settingsViewer = require("./infoViewer/infoView");
perf_1.performance.mark('cspell_done_import');
async function activate(context) {
    perf_1.performance.mark('cspell_activate_start');
    // The server is implemented in node
    const serverModule = context.asAbsolutePath(path.join('server', 'server.js'));
    // Get the cSpell Client
    const client = await client_1.CSpellClient.create(serverModule);
    // Start the client.
    const clientDispose = client.start();
    function triggerGetSettings() {
        client.triggerSettingsRefresh();
    }
    function splitTextFn(apply) {
        return (word, uri) => {
            const editor = vscode.window.activeTextEditor;
            const document = editor && editor.document;
            const uriToUse = uri || document && document.uri || null;
            return client.splitTextIntoDictionaryWords(word)
                .then(result => result.words)
                .then(words => apply(words.join(' '), uriToUse));
        };
    }
    function dumpPerfTimeline() {
        perf_1.performance.getEntries().forEach(entry => {
            console.log(entry.name, perf_1.toMilliseconds(entry.startTime), entry.duration);
        });
    }
    const actionAddWordToFolder = commands_1.userCommandOnCurrentSelectionOrPrompt('Add Word to Folder Dictionary', splitTextFn(commands.addWordToFolderDictionary));
    const actionAddWordToWorkspace = commands_1.userCommandOnCurrentSelectionOrPrompt('Add Word to Workspace Dictionary', splitTextFn(commands.addWordToWorkspaceDictionary));
    const actionAddWordToDictionary = commands_1.userCommandOnCurrentSelectionOrPrompt('Add Word to User Dictionary', splitTextFn(commands.addWordToUserDictionary));
    const actionAddIgnoreWord = commands_1.userCommandOnCurrentSelectionOrPrompt('Ignore Word', splitTextFn((word, uri) => commands.addIgnoreWordToTarget(word, settings.Target.WorkspaceFolder, uri)));
    const actionAddIgnoreWordToFolder = commands_1.userCommandOnCurrentSelectionOrPrompt('Ignore Word in Folder Settings', splitTextFn((word, uri) => commands.addIgnoreWordToTarget(word, settings.Target.WorkspaceFolder, uri)));
    const actionAddIgnoreWordToWorkspace = commands_1.userCommandOnCurrentSelectionOrPrompt('Ignore Word in Workspace Settings', splitTextFn((word, uri) => commands.addIgnoreWordToTarget(word, settings.Target.Workspace, uri)));
    const actionAddIgnoreWordToUser = commands_1.userCommandOnCurrentSelectionOrPrompt('Ignore Word in User Settings', splitTextFn((word, uri) => commands.addIgnoreWordToTarget(word, settings.Target.Global, uri)));
    const actionRemoveWordFromFolderDictionary = commands_1.userCommandOnCurrentSelectionOrPrompt('Remove Word from Dictionary', splitTextFn(commands.removeWordFromFolderDictionary));
    const actionRemoveWordFromWorkspaceDictionary = commands_1.userCommandOnCurrentSelectionOrPrompt('Remove Word from Dictionary', splitTextFn(commands.removeWordFromWorkspaceDictionary));
    const actionRemoveWordFromDictionary = commands_1.userCommandOnCurrentSelectionOrPrompt('Remove Word from Dictionary', splitTextFn(commands.removeWordFromUserDictionary));
    statusbar_1.initStatusBar(context, client);
    // Push the disposable to the context's subscriptions so that the
    // client can be deactivated on extension deactivation
    context.subscriptions.push(clientDispose, vscode.commands.registerCommand('cSpell.editText', commands_1.handlerApplyTextEdits(client.client)), vscode.commands.registerCommand('cSpell.addWordToDictionarySilent', commands.addWordToFolderDictionary), vscode.commands.registerCommand('cSpell.addWordToWorkspaceDictionarySilent', commands.addWordToWorkspaceDictionary), vscode.commands.registerCommand('cSpell.addWordToUserDictionarySilent', commands.addWordToUserDictionary), vscode.commands.registerCommand('cSpell.addWordToDictionary', actionAddWordToFolder), vscode.commands.registerCommand('cSpell.addWordToWorkspaceDictionary', actionAddWordToWorkspace), vscode.commands.registerCommand('cSpell.addWordToUserDictionary', actionAddWordToDictionary), vscode.commands.registerCommand('cSpell.addIgnoreWord', actionAddIgnoreWord), vscode.commands.registerCommand('cSpell.addIgnoreWordToFolder', actionAddIgnoreWordToFolder), vscode.commands.registerCommand('cSpell.addIgnoreWordToWorkspace', actionAddIgnoreWordToWorkspace), vscode.commands.registerCommand('cSpell.addIgnoreWordToUser', actionAddIgnoreWordToUser), vscode.commands.registerCommand('cSpell.removeWordFromFolderDictionary', actionRemoveWordFromFolderDictionary), vscode.commands.registerCommand('cSpell.removeWordFromWorkspaceDictionary', actionRemoveWordFromWorkspaceDictionary), vscode.commands.registerCommand('cSpell.removeWordFromUserDictionary', actionRemoveWordFromDictionary), vscode.commands.registerCommand('cSpell.enableLanguage', commands.enableLanguageId), vscode.commands.registerCommand('cSpell.disableLanguage', commands.disableLanguageId), vscode.commands.registerCommand('cSpell.enableForWorkspace', () => settings_1.setEnableSpellChecking(settings.Target.Workspace, false)), vscode.commands.registerCommand('cSpell.disableForWorkspace', () => settings_1.setEnableSpellChecking(settings.Target.Workspace, false)), vscode.commands.registerCommand('cSpell.toggleEnableSpellChecker', commands.toggleEnableSpellChecker), vscode.commands.registerCommand('cSpell.enableCurrentLanguage', commands.enableCurrentLanguage), vscode.commands.registerCommand('cSpell.disableCurrentLanguage', commands.disableCurrentLanguage), vscode.commands.registerCommand('cSpell.logPerfTimeline', dumpPerfTimeline), settings.watchSettingsFiles(triggerGetSettings));
    // infoViewer.activate(context, client);
    settingsViewer.activate(context, client);
    function registerConfig(path) {
        client.registerConfiguration(path);
    }
    const server = {
        registerConfig,
        triggerGetSettings,
        enableLanguageId: commands.enableLanguageId,
        disableLanguageId: commands.disableLanguageId,
        enableCurrentLanguage: commands.enableCurrentLanguage,
        disableCurrentLanguage: commands.disableCurrentLanguage,
        addWordToUserDictionary: commands.addWordToUserDictionary,
        addWordToWorkspaceDictionary: commands.addWordToWorkspaceDictionary,
        enableLocal: settings.enableLocal,
        disableLocal: settings.disableLocal,
        updateSettings: () => false,
        cSpellClient: () => client,
    };
    perf_1.performance.mark('cspell_activate_end');
    perf_1.performance.measure('cspell_activation', 'cspell_activate_start', 'cspell_activate_end');
    return server;
}
exports.activate = activate;
perf_1.performance.mark('cspell_done_load');
//# sourceMappingURL=extension.js.map