/**
 * @module Bytes
 */

/**
 * Rounds a value to the given precison
 * @param {Number} value The number to round
 * @param {Number} precision Decimal point precision
 * @returns {Number} Returns the rounded value round
*/
const round = (value, precision) => {
    let multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
}

/**
 * Converts bytes into their smallest scale
 * @param {Number} bytes Bytes to convert
 * @returns {String} Returns the converted value
 */
const convert = (bytes) => {
    let tb = Math.round(bytes / 1e+12);
    let gb = Math.round(bytes / 1e+9);
    let mb = Math.round(bytes / 1e+6);
    let kb = Math.round(bytes / 1000);

    if (tb >= 0.01) {
        return `${round(tb, 3)}TB`
    } else if (gb >= 0.01) {
        return `${round(gb, 3)}GB`
    } else if (mb >= 0.01) {
        return `${round(mb, 3)}MB`
    } else if (kb >= 0.01) {
        return `${round(kb, 3)}KB`
    } else {
        return `${bytes}B`
    }
}

module.exports = {convert}