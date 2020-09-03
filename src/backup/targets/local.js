/*
    Backup target: Local file
    Creates writable stream to path
*/
const fs = require("fs");

const requirements = [
    { location: "Location of the backup file that should be created" }
]

class local {

    //Parse the arguments
    constructor(args) { this.location = args[0] }

    //Verifies that the creation of a writestream will not fail or could create problems in backup creation
    verify() {
        return new Promise((resolve, reject) => {
            if (typeof this.location == "string" && this.location.length > 2) {
                let testStream = fs.createWriteStream(this.location);
                testStream.on("error", (error) => { reject(`Invalid target location, is not writable: ${this.location}`)})
                testStream.on("ready", () => { 
                    testStream.close();
                    resolve();
                })
            } else { reject(`Invalid local target location: ${this.location}`) }
        })
    }

    //Create a writestream to pipe into the archiver
    createStream() {
        try { 
            let writable = fs.createWriteStream(this.location);
            return writable;
        } catch (error) { throw new Error("Failed create writable stream to local output") }
    }

    //Delete the file produced by this action - returns a single error message
    delete() {
        return new Promise((resolve, reject) => {
            fs.promises.access(this.location, fs.constants.R_OK | fs.constants.W_OK)
            .then(() => {
                //Files accessible, attempt to remove
                fs.promises.unlink(this.location)
                .then(() => resolve())
                .catch(error => reject(`Could not remove files: ${error}`))
            })
            .catch(error => { reject("Backup files no longer exist")})
        })
    }

}

module.exports = { local, requirements };