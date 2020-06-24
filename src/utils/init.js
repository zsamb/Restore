/*

Frequent useful commands which interact with files

*/

//Check log directories exist and whether to create them if not (create:bool)
const verifyLogs = (create) => {

    const { existsSync, mkdirSync, writeFileSync } = require("fs");
    let paths = ["./logs/backup", "./logs/system"];
    let count = 0;

    return new Promise((resolve, reject) => {
        paths.forEach(path => {
            if(existsSync(path)) { count++ } 
            else { 
                if (create) {
                    try { 
                        mkdirSync(path, {recursive: true});
                        writeFileSync(`${path}/.gitignore`, "*\n!.gitignore");
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