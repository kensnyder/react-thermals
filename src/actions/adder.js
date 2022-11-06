"use strict";
exports.__esModule = true;
exports.adderSync = exports.adder = void 0;
var withFlushSync_1 = require("./withFlushSync");
var updatePath_1 = require("../updatePath/updatePath");
/**
 * Helper function to create a setState function that adds the given amount
 * @param {String} path  The name of or path to the value to set
 * @param {Number} baseAmount  A base amount to add
 *   e.g. use amount = 1 to create an incrementer function and amount = -1 for a decremeter function
 * @return {Function}  A function suitable for a store action
 */
function adder(path, baseAmount) {
    if (baseAmount === void 0) { baseAmount = 0; }
    var add = (0, updatePath_1.updatePath)(path, function addHandler(old, totalAmount) {
        return old + totalAmount;
    });
    return function updater(amount) {
        if (amount === void 0) { amount = 0; }
        return this.setState(function (old) { return add(old, baseAmount + amount); });
    };
}
exports.adder = adder;
/**
 * Run adder and then flush pending state changes
 * e.g. use amount = 1 to create an incrementer function and amount = -1 for a decremeter function
 * @param {String} path  The name of or path to the property to toggle
 * @return {Function}  A function suitable for a store action
 */
exports.adderSync = (0, withFlushSync_1["default"])(adder);
