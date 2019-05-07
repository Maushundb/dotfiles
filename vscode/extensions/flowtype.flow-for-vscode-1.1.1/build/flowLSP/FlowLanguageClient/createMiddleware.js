"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createMiddleware;

var vscode = _interopRequireWildcard(require("vscode"));

var lsp = _interopRequireWildcard(require("../utils/LanguageClient"));

var _FlowconfigCache = _interopRequireDefault(require("../utils/FlowconfigCache"));

var _formatMarkedDownString = _interopRequireDefault(require("../utils/formatMarkedDownString"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

// Middleware:
// 1) Prevent duplicate results in nested .flowconfig directory structure
// - root
//   -.flowconfig [lsp running for all files under root (including project-a files) [client-root]]
//   - fileA.js
//   - project-a
//     -.flowconfig [lsp running for all files under project-a [client-A]]
//     - fileB.js  [client-root and client-A both serve lsp request for this file]
// Below middleware will noop fileB.js request in client-root
function createMiddleware(clientFlowconfig) {
  const flowconfigCache = new _FlowconfigCache.default('.flowconfig');
  return {
    didOpen(document, next) {
      // NOTE: language client already matches document with passed documentSelector (js files)
      // so document here is always js file
      flowconfigCache.get(document).then(docFlowconfig => {
        if (docFlowconfig === clientFlowconfig) {
          return next(document);
        }

        return undefined;
      });
    },

    didClose(document, next) {
      flowconfigCache.get(document).then(docFlowconfig => {
        // delete from cache after file closes
        // will keep a upper limit on cache size
        flowconfigCache.delete(document);

        if (docFlowconfig === clientFlowconfig) {
          return next(document);
        }

        return undefined;
      });
    },

    didChange(event, next) {
      flowconfigCache.get(event.document).then(docFlowconfig => {
        if (docFlowconfig === clientFlowconfig) {
          return next(event);
        }

        return undefined;
      });
    },

    provideCompletionItem(document, position, context, token, next) {
      return flowconfigCache.get(document).then(docFlowconfig => {
        if (docFlowconfig === clientFlowconfig) {
          return next(document, position, context, token);
        }

        return null;
      });
    },

    // Not needed
    // resolveCompletitionItem
    provideHover(document, position, token, next) {
      return flowconfigCache.get(document).then(docFlowconfig => {
        if (docFlowconfig === clientFlowconfig) {
          return Promise.resolve(next(document, position, token)).then(formatHoverContent);
        }

        return null;
      });
    },

    // Adding this middleware for future
    // current flow (<=0.89) doesnt support signatureHelp.
    provideSignatureHelp(document, position, token, next) {
      return flowconfigCache.get(document).then(docFlowconfig => {
        if (docFlowconfig === clientFlowconfig) {
          return next(document, position, token);
        }

        return null;
      });
    },

    provideDefinition(document, position, token, next) {
      return flowconfigCache.get(document).then(docFlowconfig => {
        if (docFlowconfig === clientFlowconfig) {
          return next(document, position, token);
        }

        return null;
      });
    },

    provideReferences(document, position, options, token, next) {
      return flowconfigCache.get(document).then(docFlowconfig => {
        if (docFlowconfig === clientFlowconfig) {
          return next(document, position, options, token);
        }

        return null;
      });
    },

    provideDocumentHighlights(document, position, token, next) {
      return flowconfigCache.get(document).then(docFlowconfig => {
        if (docFlowconfig === clientFlowconfig) {
          return next(document, position, token);
        }

        return null;
      });
    },

    provideDocumentSymbols(document, token, next) {
      return flowconfigCache.get(document).then(docFlowconfig => {
        if (docFlowconfig === clientFlowconfig) {
          return next(document, token);
        }

        return null;
      });
    },

    provideRenameEdits(document, position, newName, token, next) {
      return flowconfigCache.get(document).then(docFlowconfig => {
        if (docFlowconfig === clientFlowconfig) {
          return next(document, position, newName, token);
        }

        return null;
      });
    },

    // Adding this middleware for future
    // current flow (<=0.89) doesnt support this.
    prepareRename(document, position, token, next) {
      return flowconfigCache.get(document).then(docFlowconfig => {
        if (docFlowconfig === clientFlowconfig) {
          return next(document, position, token);
        }

        return null;
      });
    },

    provideTypeCoverage(document, next) {
      return flowconfigCache.get(document).then(docFlowconfig => {
        if (docFlowconfig === clientFlowconfig) {
          return next(document);
        }

        return null;
      });
    }

  };
}

function formatHoverContent(value) {
  if (!value) {
    return value;
  } // format content


  value.contents = value.contents.map(content => {
    // NOTE: in our case, content is always MarkdownString
    if (content instanceof vscode.MarkdownString) {
      return (0, _formatMarkedDownString.default)(content);
    }

    return content;
  });
  return value;
}
//# sourceMappingURL=createMiddleware.js.map