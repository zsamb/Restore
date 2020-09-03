/*

Clear application logs script

*/
const fs = require('fs');

const locations = ["backup", "system", "access"];
const path = "./logs/"

locations.forEach(loc => {
    fs.promises.readdir(`${path}${loc}`)
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
