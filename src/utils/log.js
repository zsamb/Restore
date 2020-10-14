/**
 * @module Log
 */
const Path = require("path");
const fs = require("fs");
const moment = require("moment");

/**
 * @typedef {'FgBlack'|'FgRed'|'FgGreen'|'FgYellow'|'FgBlue'|'FgMagenta'|'FgCyan'|'FgWhite'|'BgBlack'|'BgRed'|'BgGreen'|'BgYellow'|'BgBlue'|'BgMagenta'|'BgCyan'|'BgWhite'} Colours
 */

const colours = {

    FgBlack: "\x1b[30m",
    FgRed: "\x1b[31m",
    FgGreen: "\x1b[32m",
    FgYellow: "\x1b[33m",
    FgBlue: "\x1b[34m",
    FgMagenta: "\x1b[35m",
    FgCyan: "\x1b[36m",
    FgWhite: "\x1b[37m",
    BgBlack: "\x1b[40m",
    BgRed: "\x1b[41m",
    BgGreen: "\x1b[42m",
    BgYellow: "\x1b[43m",
    BgBlue: "\x1b[44m",
    BgMagenta: "\x1b[45m",
    BgCyan: "\x1b[46m",
    BgWhite: "\x1b[47m"

}

/**
 * Creates a log message
 * @param {('system'|'backup')} type The log message type
 * @param {String} message The message to log
 * @param {Object} options Log message options
 * @param {Boolean} options.fileOnly Only log message to file
 * @param {Boolean} options.consoleOnly Only log message to console
 * @param {Colours} options.colour Colour to log the message in
 * @param {Boolean} options.error Message is an error
*/
const send = (type, message, options) => {
    return new Promise((resolve, reject) => {

        let Options = options || new Object();

        if (type == "system" || type == "backup") {
            if (Options.fileOnly) {                                    //File only
                _toFile(type, message, Options)
                    .then((success) => {
                            resolve()
                        },
                        (error) => {
                            reject()
                        })

            } else if (Options.consoleOnly) {                          //Console only
                _toConsole(type, message, Options)
                    .then((success) => {
                            resolve()
                        },
                        (error) => {
                            reject()
                        })

            } else {                                                   //Both
                _toConsole(type, message, Options)
                    .then((success) => {
                        _toFile(type, message, Options)
                            .then((success) => {
                                resolve()
                            }, (error) => {
                                reject("Failed to log to file")
                            })
                    }, (error) => {
                        reject("Failed to log to console")
                    })
            }
        } else {
            reject("Invalid log type")
        }
    })
}

/**
 * Creates multiple log messages
 * @param {('system'|'backup')} type The log message type
 * @param {Array.<String>} messages The message to log
 * @param {Object} options Log message options
 * @param {Boolean} options.fileOnly Only log message to file
 * @param {Boolean} options.consoleOnly Only log message to console
 * @param {Colours} options.colour Colour to log the message in
 * @param {Boolean} options.error Message is an error
*/
const sendMultiple = (type, messages, options) => {
    return new Promise((resolve, reject) => {

        let Options = options || new Object();

        if (type == "system" || type == "backup") {
            messages.forEach(message => {
                if (Options.fileOnly) {                                    //File only
                    _toFile(type, message, Options)
                        .then((success) => {
                                resolve()
                            },
                            (error) => {
                                reject()
                            })

                } else if (Options.consoleOnly) {                          //Console only
                    _toConsole(type, message, Options)
                        .then((success) => {
                                resolve()
                            },
                            (error) => {
                                reject()
                            })

                } else {                                                   //Both
                    _toConsole(type, message, Options)
                        .then((success) => {
                            _toFile(type, message, Options)
                                .then((success) => {
                                    resolve()
                                }, (error) => {
                                    reject("Failed to log to file")
                                })
                        }, (error) => {
                            reject("Failed to log to console")
                        })
                }
            })
        } else {
            reject("Invalid log type")
        }
    })
}

//Async append new log to file
const _toFile = (type, message, options) => {
    return new Promise((resolve, reject) => {
        let fileTimestamp = moment().format("YYYY-MM-DD").concat(".log");
        let objectTimestamp = moment().format("x");
        fs.appendFile(Path.join(__dirname, `../../logs/${type}/${type}-${fileTimestamp}`), JSON.stringify({
            error: options.error ? true : false,
            time: objectTimestamp,
            message: message
        }).concat("\n"), (error) => {
            if (error) {
                reject(error.message)
            } else {
                resolve("Log appended to file")
            }
        })
    })
}

//Async write log to console stream
const _toConsole = (type, message, options) => {
    return new Promise((resolve, reject) => {
        let dataTimestamp = `[ ${moment().format("HH:mm:ss")} ]`;
        try {
            process.stdout.write(Buffer.from(`${options.colour ? (colours[options.colour] || "") : ""}[ ${options.error ? "ERROR" : "INFO"} ] ${dataTimestamp} ${type.toUpperCase()}: ${message}\x1b[0m\n`));
            resolve("Log created to console")
        } catch (error) {
            reject(error.message)
        }
    })
}

module.exports = {send, sendMultiple};