/*

Frequent useful commands which interact with files

*/
const fs = require("fs");

//Check log directories exist and whether to create them if not (create:bool)
const verifyLogs = (create) => {
    return new Promise((resolve, reject) => {
        let paths = ["./logs/backup", "./logs/system"];
        let count = 0;
        paths.forEach(path => {
            if(fs.existsSync(path)) { count++ } 
            else { 
                if (create) {
                    try { 
                        fs.mkdirSync(path, {recursive: true});
                        fs.writeFileSync(`${path}/.gitignore`, "*\n!.gitignore");
                        count++
                    } catch (error) {}
                }
            }
        })
        if (count == paths.length) { resolve() }
        else { reject("Invalid log directory") }
    })
}

module.exports = { verifyLogs }