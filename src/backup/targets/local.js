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
                    //Cleanup
                    fs.unlinkSync(this.location);
                    resolve();
                })
            } else { reject(`Invalid local target location: ${this.location}`) }
        })
    }

    //Verify that restoring from this target is possible
    verifyRestore() {
        return new Promise((resolve, reject) => {
            //Check that the file created from this target still exists
            let testStream = fs.createReadStream(this.location);
            testStream.on("error", (error) => { reject("Could not access backup files") });
            testStream.on("ready", () => {
                testStream.close();
                resolve();
            })
        })
    }

    //Create a writestream to pipe into the archiver
    createStream() {
        try { 
            let writable = fs.createWriteStream(this.location);
            return writable;
        } catch (error) { throw new Error("Failed create writable stream to local output") }
    }

    //Create a readStream to pipe into the restoration
    restoreStream() {
        try {
            let readable = fs.createReadStream(this.location);
            return readable;
        } catch (error) { throw new Error("Failed to create read stream to local restore target")}
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