/*
    Restore target: Local file
    Creates writable stream to path
*/
const fs = require("fs");
const unzipper = require("unzipper");

const requirements = [
    { location: "Location to restore files to" },
    { fileName: "Name of the file to write the backup to" }
]

class local {

    //Parse the arguments
    constructor(args) { 
        this.location = args[0];
        this.fileName = args[1];
    }

    //Verifies that we can restore to the local location
    verify() {
        return new Promise((resolve, reject) => {
            if (typeof this.location == "string" && this.location.length > 2) {
                if (typeof this.fileName == "string") {
                    let testStream = fs.createWriteStream(this.location + `/${this.fileName}`);
                    testStream.on("error", (error) => { reject(`Invalid restore location, is not writable: ${this.location + `/${this.fileName}`}`)})
                    testStream.on("ready", () => { 
                        testStream.close();
                        //Cleanup
                        fs.unlinkSync(this.location + `/${this.fileName}`);
                        resolve();
                    })
                } else { reject(`Invalid filename: ${this.fileName}`) }
            } else { reject(`Invalid local restore location: ${this.location}`) }
        })
    }

    //Using the provided readstream, write to the file location
    restore(readStream) {
        return new Promise((resolve, reject) => {
            readStream.on("error", error => reject(error.message));

            let writeStream = fs.createWriteStream(this.location + `/${this.fileName}`);
            writeStream.on("error", error => reject(error.message));
            writeStream.on("close", () => resolve());

            readStream.pipe(writeStream);
        })
    }

    //Extract the restored file
    extract() {
        return new Promise((resolve, reject) => {
            try {
                fs.createReadStream(this.location + `/${this.fileName}`)
                .pipe(unzipper.Extract({ path: this.location }))
                .on("close", () => { 
                    //Remove compressed file
                    fs.unlinkSync(this.location + `/${this.fileName}`);
                    resolve();
                })
                .on("error", error => { reject(error.message) })
            } catch (error) { reject(error.message) }
        })
    }

}

module.exports = { local, requirements };