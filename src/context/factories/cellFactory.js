"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMultiplierCell = exports.createOperatorCell = exports.createValueCell = exports.createEmptyCell = void 0;
var baseCell = function (row, column) {
    return {
        id: null,
        type: "empty",
        row: row,
        column: column,
        allowedValues: [],
    };
};
var createEmptyCell = function (row, column) {
    return __assign(__assign({}, baseCell(row, column)), { type: "empty" });
};
exports.createEmptyCell = createEmptyCell;
var createValueCell = function (row, column, value) {
    return __assign(__assign({}, baseCell(row, column)), { type: "value", value: value });
};
exports.createValueCell = createValueCell;
var createOperatorCell = function (row, column, operator) {
    return __assign(__assign({}, baseCell(row, column)), { type: "operator", operator: operator });
};
exports.createOperatorCell = createOperatorCell;
var createMultiplierCell = function (row, column, multiplier) {
    return __assign(__assign({}, baseCell(row, column)), { type: "multiplier", multiplier: multiplier });
};
exports.createMultiplierCell = createMultiplierCell;
