"use strict";
'use babel';
/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.flowStatusOutputToDiagnostics = flowStatusOutputToDiagnostics;
exports.oldFlowStatusOutputToDiagnostics = oldFlowStatusOutputToDiagnostics;
exports.newFlowStatusOutputToDiagnostics = newFlowStatusOutputToDiagnostics;

function flowStatusOutputToDiagnostics(root, statusOutput) {
  if (statusOutput.flowVersion != null) {
    return newFlowStatusOutputToDiagnostics(root, statusOutput);
  } else {
    return oldFlowStatusOutputToDiagnostics(root, statusOutput);
  }
}

function oldFlowStatusOutputToDiagnostics(root, statusOutput) {
  const errors = statusOutput.errors;
  const messages = errors.map(flowStatusError => {
    const flowMessageComponents = flowStatusError.message;
    const level = flowMessageComponents[0].level;
    const messageComponents = flowMessageComponents.map(flowMessageComponentToMessageComponent);
    const operation = flowStatusError.operation;

    if (operation != null) {
      // The operation field provides additional context. I don't fully understand the motivation
      // behind separating it out, but prepending it with 'See also: ' and adding it to the end of
      // the messages is what the Flow team recommended.
      const operationComponent = flowMessageComponentToMessageComponent(operation);
      operationComponent.descr = 'See also: ' + operationComponent.descr;
      messageComponents.push(operationComponent);
    }

    return {
      level,
      messageComponents
    };
  });
  return {
    flowRoot: root,
    messages
  };
}

function flowMessageComponentToMessageComponent(component) {
  const path = component.path;
  let range = null; // Flow returns the empty string instead of null when there is no relevant path. The upcoming
  // format changes described elsewhere in this file fix the issue, but for now we must still work
  // around it.

  if (path != null && path !== '') {
    range = {
      file: path,
      start: {
        line: component.line,
        column: component.start
      },
      end: {
        line: component.endline,
        column: component.end
      }
    };
  }

  return {
    descr: component.descr,
    range
  };
}

function newFlowStatusOutputToDiagnostics(root, statusOutput) {
  const errors = statusOutput.errors;
  const messages = errors.map(flowStatusError => {
    const flowMessageComponents = flowStatusError.message;
    const level = flowStatusError.level;
    const messageComponents = flowMessageComponents.map(newFlowMessageComponentToMessageComponent);
    const operation = flowStatusError.operation;

    if (operation != null) {
      const operationComponent = newFlowMessageComponentToMessageComponent(operation);
      operationComponent.descr = 'See also: ' + operationComponent.descr;
      messageComponents.push(operationComponent);
    }

    const extra = flowStatusError.extra;

    if (extra != null) {
      const flatExtra = [].concat(...extra.map(({
        message
      }) => message));
      messageComponents.push(...flatExtra.map(newFlowMessageComponentToMessageComponent));
    }

    return {
      level,
      messageComponents
    };
  });
  return {
    flowRoot: root,
    messages
  };
}

function newFlowMessageComponentToMessageComponent(component) {
  return {
    descr: component.descr,
    range: maybeFlowLocToRange(component.loc)
  };
}

function maybeFlowLocToRange(loc) {
  return loc == null ? null : flowLocToRange(loc);
}

function flowLocToRange(loc) {
  return {
    file: loc.source,
    start: {
      line: loc.start.line,
      column: loc.start.column
    },
    end: {
      line: loc.end.line,
      column: loc.end.column
    }
  };
}
//# sourceMappingURL=diagnosticsParser.js.map