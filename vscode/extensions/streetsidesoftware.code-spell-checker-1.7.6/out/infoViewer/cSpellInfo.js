"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const perf_1 = require("../util/perf");
perf_1.performance.mark('cSpellInfo.ts');
const vscode = require("vscode");
exports.commandDisplayCSpellInfo = 'cSpell.displayCSpellInfo';
function findDocumentInVisibleTextEditors(uri) {
    const u = uri.toString();
    const docs = vscode.window.visibleTextEditors
        .map(e => e.document)
        .filter(doc => !!doc)
        .filter(doc => doc.uri.toString() === u);
    return docs[0];
}
exports.findDocumentInVisibleTextEditors = findDocumentInVisibleTextEditors;
function findMatchingDocument(uri) {
    const u = uri.toString();
    const workspace = vscode.workspace || {};
    const docs = (workspace.textDocuments || [])
        .filter(doc => doc.uri.toString() === u);
    return docs[0] || findDocumentInVisibleTextEditors(uri);
}
exports.findMatchingDocument = findMatchingDocument;
perf_1.performance.mark('cSpellInfo.ts Done');
//# sourceMappingURL=cSpellInfo.js.map