"use strict";

Object.defineProperty(exports, '__esModule', {
  value: true
});

exports.default = function (_ref) {
  var Plugin = _ref.Plugin;
  var types = _ref.types;

  return new Plugin('class-display-name', {
    visitor: {
      ClassDeclaration: function ClassDeclaration(node) {
        this.insertAfter([
          types.expressionStatement(types.assignmentExpression(
            "=",
            types.memberExpression(node.id, types.identifier("displayName")),
            types.literal(node.id.name)
          ))
        ]);
      }
    }
  });
};

module.exports = exports["default"];
