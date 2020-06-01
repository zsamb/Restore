/*

Clear application logs script

*/
const util = require('util');
const fs = require('fs');

const readdir = util.promisify(fs.readdir);
const locations = ["backup", "system"];
const path = "./logs/"

locations.forEach(loc => {
    readdir(`${path}${loc}`)
    .then(files => {
        files.forEach(file => {
            if (file.split(".")[1] == "log") {
                fs.unlink(`${path}${loc}/${file}`, (error) => {
                    if (error) { console.log(`Could not delete ${file}: ${error.message}`) }
                    else { console.log(`Deleted ${file}`) }
                })
            }
        })
    })
    .catch(error => {
        console.error("Failed to clear logs: " + error.message);
    })
})
