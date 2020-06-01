/*

Handles logging to terminal and file with specific modes

*/
const fs = require("fs");
const moment = require("moment");

class Log {

    constructor() {
        this.colours = {

            FgBlack:   "\x1b[30m",
            FgRed:     "\x1b[31m",
            FgGreen:   "\x1b[32m",
            FgYellow:  "\x1b[33m",
            FgBlue:    "\x1b[34m",
            FgMagenta: "\x1b[35m",
            FgCyan:    "\x1b[36m",
            FgWhite:   "\x1b[37m",
            BgBlack:   "\x1b[40m",
            BgRed:     "\x1b[41m",
            BgGreen:   "\x1b[42m",
            BgYellow:  "\x1b[43m",
            BgBlue:    "\x1b[44m",
            BgMagenta: "\x1b[45m",
            BgCyan:    "\x1b[46m",
            BgWhite:   "\x1b[47m"

        }
    }

    /*
        Log creation
        Parameters: type, message and options object {fileOnly:bool, consoleOnly:bool, error:bool, color:key}
    */
    new(type, message, options) {
        return new Promise((resolve , reject) => {

            this.options = options || {};

            if (type == "system" || type == "backup") {
                if (this.options.fileOnly) {                                    //File only
                    this._toFile(type, message, this.options)
                    .then((success) => { resolve() }, 
                          (error)   => { reject()  })

                } else if (this.options.consoleOnly) {                          //Console only
                    this._toConsole(type, message, this.options)
                    .then((success) => { resolve() },
                          (error)   => { reject()  })

                } else {                                                        //Both
                    this._toConsole(type, message, this.options)
                    .then((success) => {
                        this._toFile(type, message, this.options)
                        .then((success) => {
                            resolve()
                        }, (error) => { reject("Failed to log to file") })
                    }, (error) => { reject("Failed to log to console") })
                }
            } else { reject("Invalid log type") }
        })

    }

    //Async append new log to file
    _toFile(type, message, options) {
        return new Promise((resolve, reject) => {
            this.fileTimestamp   = moment().format("YYYY-MM-DD").concat(".log");
            this.objectTimestamp = moment().format("x");
            fs.appendFile(`./logs/${type}/${type}-${this.fileTimestamp}`, JSON.stringify({error: options.error ? true : false, time: this.objectTimestamp, message: message}).concat("\n"), (error) => {
                if (error) { reject(error.message) }
                else { resolve ("Log appended to file") }
            })
        })
    }

    //Async write log to console stream
    _toConsole(type, message, options) {
        return new Promise((resolve, reject) => {
            this.dataTimestamp = `[ ${moment().format("hh:mm:ss")} ]`;
            try {
                process.stdout.write(Buffer.from(`${options.colour ? (this.colours[options.colour] || "") : ""}[ ${options.error ? "ERROR" : "INFO"} ] ${this.dataTimestamp} ${type.toUpperCase()}: ${message}\x1b[0m\n`));
                resolve("Log created to console")
            } catch (error) { reject(error.message) }
        })
    }

}

module.exports = Log;