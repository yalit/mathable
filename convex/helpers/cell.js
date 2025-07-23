"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasValue = void 0;
var hasValue = function (cell) {
    return cell.value !== null || cell.tileId !== null;
};
exports.hasValue = hasValue;
