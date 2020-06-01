/*

Handles logging to terminal and file with specific select modes

*/
const fs = require("fs");
const moment = require("moment");

class Log {

    /*
        Log creation
        Parameters: type, message and options object {fileOnly:bool, consoleOnly:bool, error:bool}
    */
    new(type, message, options) {
        return new Promise((resolve , reject) => {

            this.options         = options || {};

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
            this.dataTimestamp   = `[ ${moment().format("hh:mm:ss")} ]`;
            try {
                process.stdout.write(Buffer.from(`[ ${options.error ? "ERROR" : "INFO"} ] ${this.dataTimestamp} ${type.toUpperCase()}: ${message}\n`));
                resolve("Log created to console")
            } catch (error) { reject(error.message) }
        })
    }

}

module.exports = Log;