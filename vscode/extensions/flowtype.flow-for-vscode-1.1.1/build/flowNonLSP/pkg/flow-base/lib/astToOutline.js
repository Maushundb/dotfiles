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
exports.astToOutline = astToOutline;

var _collection = require("../../commons-node/collection");

var _main = require("../../nuclide-tokenized-text/lib/main");

var _assert = _interopRequireDefault(require("assert"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function astToOutline(ast) {
  return itemsToTrees(ast.body);
}

function itemsToTrees(items) {
  return (0, _collection.arrayCompact)(items.map(itemToTree));
}

function itemToTree(item) {
  if (item == null) {
    return null;
  }

  const extent = getExtent(item);

  switch (item.type) {
    case 'FunctionDeclaration':
      return _objectSpread({
        tokenizedText: [(0, _main.keyword)('function'), (0, _main.whitespace)(' '), (0, _main.method)(item.id.name), (0, _main.plain)('('), ...paramsTokenizedText(item.params), (0, _main.plain)(')')],
        representativeName: item.id.name,
        children: []
      }, extent);

    case 'ClassDeclaration':
      return _objectSpread({
        tokenizedText: [(0, _main.keyword)('class'), (0, _main.whitespace)(' '), (0, _main.className)(item.id.name)],
        representativeName: item.id.name,
        children: itemsToTrees(item.body.body)
      }, extent);

    case 'ClassProperty':
      let paramTokens = [];

      if (item.value && item.value.type === 'ArrowFunctionExpression') {
        paramTokens = [(0, _main.plain)('('), ...paramsTokenizedText(item.value.params), (0, _main.plain)(')')];
      }

      return _objectSpread({
        tokenizedText: [(0, _main.method)(item.key.name), (0, _main.plain)('='), ...paramTokens],
        representativeName: item.key.name,
        children: []
      }, extent);

    case 'MethodDefinition':
      return _objectSpread({
        tokenizedText: [(0, _main.method)(item.key.name), (0, _main.plain)('('), ...paramsTokenizedText(item.value.params), (0, _main.plain)(')')],
        representativeName: item.key.name,
        children: []
      }, extent);

    case 'ExportDeclaration':
      const tree = itemToTree(item.declaration);

      if (tree == null) {
        return null;
      }

      return _objectSpread({
        tokenizedText: [(0, _main.keyword)('export'), (0, _main.whitespace)(' '), ...tree.tokenizedText],
        representativeName: tree.representativeName,
        children: tree.children
      }, extent);

    case 'ExpressionStatement':
      return topLevelExpressionOutline(item);

    case 'TypeAlias':
      return typeAliasOutline(item);

    default:
      return null;
  }
}

function paramsTokenizedText(params) {
  const textElements = [];
  params.forEach((p, index) => {
    switch (p.type) {
      case 'Identifier':
        textElements.push((0, _main.param)(p.name));
        break;

      case 'ObjectPattern':
        textElements.push((0, _main.plain)('{'));
        textElements.push(...paramsTokenizedText(p.properties.map(obj => obj.key)));
        textElements.push((0, _main.plain)('}'));
        break;

      case 'ArrayPattern':
        textElements.push((0, _main.plain)('['));
        textElements.push(...paramsTokenizedText(p.elements));
        textElements.push((0, _main.plain)(']'));
        break;

      default:
        throw new Error(`encountered unexpected argument type ${p.type}`);
    }

    if (index < params.length - 1) {
      textElements.push((0, _main.plain)(','));
      textElements.push((0, _main.whitespace)(' '));
    }
  });
  return textElements;
}

function getExtent(item) {
  return {
    startPosition: {
      // It definitely makes sense that the lines we get are 1-based and the columns are
      // 0-based... convert to 0-based all around.
      line: item.loc.start.line - 1,
      column: item.loc.start.column
    },
    endPosition: {
      line: item.loc.end.line - 1,
      column: item.loc.end.column
    }
  };
}

function typeAliasOutline(typeAliasExpression) {
  (0, _assert.default)(typeAliasExpression.type === 'TypeAlias');
  const name = typeAliasExpression.id.name;
  return _objectSpread({
    tokenizedText: [(0, _main.keyword)('type'), (0, _main.whitespace)(' '), (0, _main.type)(name)],
    representativeName: name,
    children: []
  }, getExtent(typeAliasExpression));
}

function topLevelExpressionOutline(expressionStatement) {
  switch (expressionStatement.expression.type) {
    case 'CallExpression':
      return specOutline(expressionStatement,
      /* describeOnly */
      true);

    case 'AssignmentExpression':
      return moduleExportsOutline(expressionStatement.expression);

    default:
      return null;
  }
}

function moduleExportsOutline(assignmentStatement) {
  (0, _assert.default)(assignmentStatement.type === 'AssignmentExpression');
  const left = assignmentStatement.left;

  if (!isModuleExports(left)) {
    return null;
  }

  const right = assignmentStatement.right;

  if (right.type !== 'ObjectExpression') {
    return null;
  }

  const properties = right.properties;
  return _objectSpread({
    tokenizedText: [(0, _main.plain)('module.exports')],
    children: (0, _collection.arrayCompact)(properties.map(moduleExportsPropertyOutline))
  }, getExtent(assignmentStatement));
}

function isModuleExports(left) {
  return left.type === 'MemberExpression' && left.object.type === 'Identifier' && left.object.name === 'module' && left.property.type === 'Identifier' && left.property.name === 'exports';
}

function moduleExportsPropertyOutline(property) {
  (0, _assert.default)(property.type === 'Property');

  if (property.key.type !== 'Identifier') {
    return null;
  }

  const propName = property.key.name;

  if (property.shorthand) {
    // This happens when the shorthand `{ foo }` is used for `{ foo: foo }`
    return _objectSpread({
      tokenizedText: [(0, _main.string)(propName)],
      representativeName: propName,
      children: []
    }, getExtent(property));
  }

  if (property.value.type === 'FunctionExpression' || property.value.type === 'ArrowFunctionExpression') {
    return _objectSpread({
      tokenizedText: [(0, _main.method)(propName), (0, _main.plain)('('), ...paramsTokenizedText(property.value.params), (0, _main.plain)(')')],
      representativeName: propName,
      children: []
    }, getExtent(property));
  }

  return _objectSpread({
    tokenizedText: [(0, _main.string)(propName), (0, _main.plain)(':')],
    representativeName: propName,
    children: []
  }, getExtent(property));
}

function specOutline(expressionStatement, describeOnly = false) {
  const expression = expressionStatement.expression;

  if (expression.type !== 'CallExpression') {
    return null;
  }

  const functionName = getFunctionName(expression.callee);

  if (functionName == null) {
    return null;
  }

  if (!isDescribe(functionName)) {
    if (describeOnly || !isIt(functionName)) {
      return null;
    }
  }

  const description = getStringLiteralValue(expression.arguments[0]);
  const specBody = getFunctionBody(expression.arguments[1]);

  if (description == null || specBody == null) {
    return null;
  }

  let children;

  if (isIt(functionName)) {
    children = [];
  } else {
    children = (0, _collection.arrayCompact)(specBody.filter(item => item.type === 'ExpressionStatement').map(item => specOutline(item)));
  }

  return _objectSpread({
    tokenizedText: [(0, _main.method)(functionName), (0, _main.whitespace)(' '), (0, _main.string)(description)],
    representativeName: description,
    children
  }, getExtent(expressionStatement));
} // Return the function name as written as a string. Intended to stringify patterns like `describe`
// and `describe.only` even though `describe.only` is a MemberExpression rather than an Identifier.


function getFunctionName(callee) {
  switch (callee.type) {
    case 'Identifier':
      return callee.name;

    case 'MemberExpression':
      if (callee.object.type !== 'Identifier' || callee.property.type !== 'Identifier') {
        return null;
      }

      return `${callee.object.name}.${callee.property.name}`;

    default:
      return null;
  }
}

function isDescribe(functionName) {
  switch (functionName) {
    case 'describe':
    case 'fdescribe':
    case 'ddescribe':
    case 'xdescribe':
    case 'describe.only':
      return true;

    default:
      return false;
  }
}

function isIt(functionName) {
  switch (functionName) {
    case 'it':
    case 'fit':
    case 'iit':
    case 'pit':
    case 'xit':
    case 'it.only':
      return true;

    default:
      return false;
  }
}
/** If the given AST Node is a string literal, return its literal value. Otherwise return null */


function getStringLiteralValue(literal) {
  if (literal == null) {
    return null;
  }

  if (literal.type !== 'Literal') {
    return null;
  }

  const value = literal.value;

  if (typeof value !== 'string') {
    return null;
  }

  return value;
}

function getFunctionBody(fn) {
  if (fn == null) {
    return null;
  }

  if (fn.type !== 'ArrowFunctionExpression' && fn.type !== 'FunctionExpression') {
    return null;
  }

  return fn.body.body;
}
//# sourceMappingURL=astToOutline.js.map