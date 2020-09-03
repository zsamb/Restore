/*
    Backup source: Local file
    Creates readable stream of local file
*/
const fs = require("fs");

const requirements = [
    { location: "Location of the file on the system" }
]

class file {

    constructor(args) { this.location = args[0] }

    verify() {
        return new Promise((resolve, reject) => {
            if (typeof this.location == "string") {
                fs.promises.access(this.location, fs.constants.F_OK | fs.constants.R_OK)
                .then(() => { return fs.promises.lstat(this.location) })
                .then((stats) => {  if (!stats.isDirectory()) { resolve() } else { reject("File path leads to a directory") } })
                .catch(error => { reject(error.message) })
            } else { reject(`Source path is invalid: ${this.location ? this.location : "undefined"}`) }
        })
    }

    verifySync() {
        if (typeof this.location == "string") {
            let exists = fs.existsSync(this.location);
            if (exists) {
                let stats = fs.lstatSync(this.location);
                if (!stats.isDirectory()) { return true }
                else { throw new Error(`File path leads to a directory`) }
            } else { throw new Error(`Source file does not exist: ${this.location}`)}
        } else { throw new Error(`Source path is invalid: ${this.location ? this.location : "undefined"}`) }
    }

    read(archive) { 
        try { archive.file(this.location, { name: this.location.split("/")[this.location.split("/").length - 1] })
        } catch (error) { throw new Error(`Failed to compress source file: ${error.message}`)}
     }

}

module.exports = { file, requirements } ;