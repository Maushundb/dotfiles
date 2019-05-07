"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CSpellSettings = require("./settings/CSpellSettings");
const Settings = require("./settings");
const vscode_1 = require("vscode");
var settings_1 = require("./settings");
exports.toggleEnableSpellChecker = settings_1.toggleEnableSpellChecker;
exports.enableCurrentLanguage = settings_1.enableCurrentLanguage;
exports.disableCurrentLanguage = settings_1.disableCurrentLanguage;
function handlerApplyTextEdits(client) {
    return async function applyTextEdits(uri, documentVersion, edits) {
        const textEditor = vscode_1.window.activeTextEditor;
        if (textEditor && textEditor.document.uri.toString() === uri) {
            if (textEditor.document.version !== documentVersion) {
                vscode_1.window.showInformationMessage(`Spelling changes are outdated and cannot be applied to the document.`);
            }
            const cfg = vscode_1.workspace.getConfiguration(CSpellSettings.sectionCSpell);
            if (cfg.get('fixSpellingWithRenameProvider') && edits.length === 1) {
                console.log('fixSpellingWithRenameProvider Enabled');
                const edit = edits[0];
                const range = client.protocol2CodeConverter.asRange(edit.range);
                if (await attemptRename(textEditor.document, range, edit.newText)) {
                    return;
                }
            }
            textEditor.edit(mutator => {
                for (const edit of edits) {
                    mutator.replace(client.protocol2CodeConverter.asRange(edit.range), edit.newText);
                }
            }).then((success) => {
                if (!success) {
                    vscode_1.window.showErrorMessage('Failed to apply spelling changes to the document.');
                }
            });
        }
    };
}
exports.handlerApplyTextEdits = handlerApplyTextEdits;
async function attemptRename(document, range, text) {
    if (range.start.line !== range.end.line) {
        return false;
    }
    const wordRange = document.getWordRangeAtPosition(range.start);
    if (!wordRange || !wordRange.contains(range)) {
        return false;
    }
    const orig = wordRange.start.character;
    const a = range.start.character - orig;
    const b = range.end.character - orig;
    const docText = document.getText(wordRange);
    const newText = [docText.slice(0, a), text, docText.slice(b)].join('');
    const workspaceEdit = await vscode_1.commands.executeCommand('vscode.executeDocumentRenameProvider', document.uri, range.start, newText).then(a => a, reason => (console.log(reason), undefined));
    return workspaceEdit && workspaceEdit.size > 0 && await vscode_1.workspace.applyEdit(workspaceEdit);
}
function addWordToFolderDictionary(word, uri) {
    return addWordToTarget(word, Settings.Target.WorkspaceFolder, uri);
}
exports.addWordToFolderDictionary = addWordToFolderDictionary;
function addWordToWorkspaceDictionary(word, uri) {
    return addWordToTarget(word, Settings.Target.Workspace, uri);
}
exports.addWordToWorkspaceDictionary = addWordToWorkspaceDictionary;
function addWordToUserDictionary(word) {
    return addWordToTarget(word, Settings.Target.Global, undefined);
}
exports.addWordToUserDictionary = addWordToUserDictionary;
async function addWordToTarget(word, target, uri) {
    const actualTarget = resolveTarget(target, uri);
    await Settings.addWordToSettings(actualTarget, word);
    const path = await determineSettingsPath(actualTarget, uri);
    if (path) {
        await CSpellSettings.addWordToSettingsAndUpdate(path, word);
    }
}
async function addIgnoreWordToTarget(word, target, uri) {
    const actualTarget = resolveTarget(target, uri);
    await Settings.addIgnoreWordToSettings(actualTarget, word);
    const path = await determineSettingsPath(actualTarget, uri);
    if (path) {
        await CSpellSettings.addIgnoreWordToSettingsAndUpdate(path, word);
    }
}
exports.addIgnoreWordToTarget = addIgnoreWordToTarget;
function removeWordFromFolderDictionary(word, uri) {
    return removeWordFromTarget(word, Settings.Target.WorkspaceFolder, uri);
}
exports.removeWordFromFolderDictionary = removeWordFromFolderDictionary;
function removeWordFromWorkspaceDictionary(word, uri) {
    return removeWordFromTarget(word, Settings.Target.Workspace, uri);
}
exports.removeWordFromWorkspaceDictionary = removeWordFromWorkspaceDictionary;
function removeWordFromUserDictionary(word) {
    return removeWordFromTarget(word, Settings.Target.Global, undefined);
}
exports.removeWordFromUserDictionary = removeWordFromUserDictionary;
async function removeWordFromTarget(word, target, uri) {
    const actualTarget = resolveTarget(target, uri);
    await Settings.removeWordFromSettings(actualTarget, word);
    const path = await determineSettingsPath(actualTarget, uri);
    if (path) {
        await CSpellSettings.removeWordFromSettingsAndUpdate(path, word);
    }
}
async function determineSettingsPath(target, uri) {
    if (target !== Settings.Target.Global) {
        const useUri = uri ? pathToUri(uri) : undefined;
        return Settings.findExistingSettingsFileLocation(useUri);
    }
    return undefined;
}
function resolveTarget(target, uri) {
    if (target === Settings.Target.Global || !Settings.hasWorkspaceLocation()) {
        return Settings.Target.Global;
    }
    if (!uri) {
        return Settings.Target.Workspace;
    }
    const resolvedUri = pathToUri(uri);
    return Settings.createTargetForUri(target, resolvedUri);
}
function enableLanguageId(languageId, uri) {
    return Settings.enableLanguageIdForClosestTarget(languageId, true, uri ? vscode_1.Uri.parse(uri) : undefined);
}
exports.enableLanguageId = enableLanguageId;
function disableLanguageId(languageId, uri) {
    return Settings.enableLanguageIdForClosestTarget(languageId, false, uri ? vscode_1.Uri.parse(uri) : undefined);
}
exports.disableLanguageId = disableLanguageId;
function userCommandOnCurrentSelectionOrPrompt(prompt, fnAction) {
    return function () {
        const { activeTextEditor = {} } = vscode_1.window;
        const { selection, document } = activeTextEditor;
        const range = selection && document ? document.getWordRangeAtPosition(selection.active) : undefined;
        const value = range ? document.getText(selection) || document.getText(range) : selection && document.getText(selection) || '';
        return (selection && !selection.isEmpty)
            ? fnAction(value, document && document.uri)
            : vscode_1.window.showInputBox({ prompt, value }).then(word => { word && fnAction(word, document && document.uri); });
    };
}
exports.userCommandOnCurrentSelectionOrPrompt = userCommandOnCurrentSelectionOrPrompt;
function pathToUri(uri) {
    if (uri instanceof vscode_1.Uri) {
        return uri;
    }
    return vscode_1.Uri.parse(uri);
}
//# sourceMappingURL=commands.js.map