/*
    Backup source: Local folder
    Creates readable stream of local folder
*/
const fs = require("fs");
const path = require("path");

const requirements = [
    {location: "Location of the folder on the system"}
]

class folder {

    constructor(args) {
        this.location = args[0]
    }

    verify() {
        return new Promise((resolve, reject) => {
            fs.promises.access(this.location, fs.constants.F_OK | fs.constants.R_OK)
                .then(() => {
                    return fs.promises.lstat(this.location)
                })
                .then((stats) => {
                    if (stats.isDirectory()) {
                        resolve()
                    } else {
                        reject()
                    }
                })
                .catch(error => reject(error.message))
        })
    }

    verifySync() {
        if (typeof this.location == "string") {
            let exists = fs.existsSync(this.location);
            if (exists) {
                let stats = fs.lstatSync(this.location);
                if (stats.isDirectory()) {
                    return true
                } else {
                    throw new Error(`File path leads to a file`)
                }
            } else {
                throw new Error(`Source folder does not exist: ${this.location}`)
            }
        } else {
            throw new Error(`Source path is invalid: ${this.location ? this.location : "undefined"}`)
        }
    }

    getSize() {
        try {

            let totalSize = 0;

            const getAllFiles = function(dirPath, arrayOfFiles) {
                let files = fs.readdirSync(dirPath)
                arrayOfFiles = arrayOfFiles || []
                files.forEach(function(file) {
                    let stats = fs.statSync(dirPath + "/" + file)
                    if (stats.isDirectory()) {
                        totalSize += stats.size;
                        arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles)
                    } else {
                        arrayOfFiles.push(path.join(dirPath, file))
                    }
                })
                return arrayOfFiles
            }  

            const getTotalSize = function(directoryPath) {
                const arrayOfFiles = getAllFiles(directoryPath)
                let thisTotalSize = 0
                arrayOfFiles.forEach(function(filePath) {
                    thisTotalSize += fs.statSync(filePath).size
                })
                return thisTotalSize;
            }

            this.size = getTotalSize(this.location) + totalSize;
        } catch (error) { 
            if (error.code !== "ENOENT") {
                throw new Error(`Failed to fetch source folder size: ${error.message}`)
            }
        }
    }

    read(archive) {
        try {
            if (this.location[this.location.length - 1] == "/") {
                this.location[this.location.length - 1] = ""
            }
            let destDir = this.location.split("/")[this.location.split("/").length - 1];
            archive.directory(this.location, destDir);
        } catch (error) {
            throw new Error(`Failed to compress source folder: ${error.message}`)
        }
    }

}

module.exports = {folder, requirements};