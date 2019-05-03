"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const LangServer = require("vscode-languageserver");
const cspell_1 = require("cspell");
const Validator = require("./validator");
const cspell = require("cspell");
const walker_1 = require("cspell-trie/dist/lib/walker");
const documentSettings_1 = require("./documentSettings");
const defaultNumSuggestions = 10;
const regexJoinedWords = /[+]/g;
const maxWordLengthForSuggestions = 20;
const wordLengthForLimitingSuggestions = 15;
const maxNumberOfSuggestionsForLongWords = 1;
const maxEdits = 3;
function extractText(textDocument, range) {
    const { start, end } = range;
    const offStart = textDocument.offsetAt(start);
    const offEnd = textDocument.offsetAt(end);
    return textDocument.getText().slice(offStart, offEnd);
}
function onCodeActionHandler(documents, fnSettings, fnSettingsVersion, documentSettings) {
    const settingsCache = new Map();
    async function getSettings(doc) {
        const cached = settingsCache.get(doc.uri);
        if (!cached || cached.docVersion !== doc.version) {
            const settings = constructSettings(doc);
            const settingsVersion = fnSettingsVersion(doc);
            settingsCache.set(doc.uri, { docVersion: doc.version, settings, settingsVersion });
        }
        return settingsCache.get(doc.uri).settings;
    }
    async function constructSettings(doc) {
        const docSetting = cspell.constructSettingsForText(await fnSettings(doc), doc.getText(), doc.languageId);
        const dict = await cspell.getDictionary(docSetting);
        return [docSetting, dict];
    }
    const handler = async (params) => {
        const actions = [];
        const { context, textDocument: { uri } } = params;
        if (!documentSettings_1.isUriAllowed(uri)) {
            return [];
        }
        const { diagnostics } = context;
        const optionalTextDocument = documents.get(uri);
        if (!optionalTextDocument)
            return [];
        const textDocument = optionalTextDocument;
        const [docSetting, dictionary] = await getSettings(textDocument);
        const { numSuggestions = defaultNumSuggestions } = docSetting;
        const folders = await documentSettings.folders;
        const showAddToWorkspace = folders && folders.length > 1;
        const showAddToFolder = folders && folders.length > 0;
        function replaceText(range, text) {
            return LangServer.TextEdit.replace(range, text || '');
        }
        function getSuggestions(dictionary, word, numSuggestions) {
            if (word.length > maxWordLengthForSuggestions) {
                return [];
            }
            const numSugs = word.length > wordLengthForLimitingSuggestions ? maxNumberOfSuggestionsForLongWords : numSuggestions;
            const numEdits = maxEdits;
            // Turn off compound suggestions for now until it works a bit better.
            return dictionary.suggest(word, numSugs, walker_1.CompoundWordsMethod.NONE, numEdits).map(sr => sr.word.replace(regexJoinedWords, ''));
        }
        function createAction(title, command, diags, ...args) {
            const cmd = LangServer.Command.create(title, command, ...args);
            const action = LangServer.CodeAction.create(title, cmd);
            action.diagnostics = diags;
            action.kind = LangServer.CodeActionKind.QuickFix;
            return action;
        }
        function genSuggestions(dictionary) {
            const spellCheckerDiags = diagnostics.filter(diag => diag.source === Validator.diagSource);
            let diagWord;
            for (const diag of spellCheckerDiags) {
                const word = extractText(textDocument, diag.range);
                diagWord = diagWord || word;
                const sugs = getSuggestions(dictionary, word, numSuggestions);
                sugs
                    .map(sug => cspell_1.Text.matchCase(word, sug))
                    .forEach(sugWord => {
                    const action = createAction(sugWord, 'cSpell.editText', [diag], uri, textDocument.version, [replaceText(diag.range, sugWord)]);
                    // Waiting on [Add isPreferred to the CodeAction protocol. Pull Request #489 · Microsoft/vscode-languageserver-node](https://github.com/Microsoft/vscode-languageserver-node/pull/489)
                    // if (!actions.length) {
                    //     action.isPreferred = true;
                    // }
                    actions.push(action);
                });
            }
            const word = diagWord || extractText(textDocument, params.range);
            // Only suggest adding if it is our diagnostic and there is a word.
            if (word && spellCheckerDiags.length) {
                actions.push(createAction('Add: "' + word + '" to user dictionary', 'cSpell.addWordToUserDictionarySilent', spellCheckerDiags, word, textDocument.uri));
                if (showAddToFolder) {
                    // Allow the them to add it to the project dictionary.
                    actions.push(createAction('Add: "' + word + '" to folder dictionary', 'cSpell.addWordToDictionarySilent', spellCheckerDiags, word, textDocument.uri));
                }
                if (showAddToWorkspace) {
                    // Allow the them to add it to the workspace dictionary.
                    actions.push(createAction('Add: "' + word + '" to workspace dictionary', 'cSpell.addWordToWorkspaceDictionarySilent', spellCheckerDiags, word, textDocument.uri));
                }
            }
            return actions;
        }
        return genSuggestions(dictionary);
    };
    return handler;
}
exports.onCodeActionHandler = onCodeActionHandler;
//# sourceMappingURL=codeActions.js.map