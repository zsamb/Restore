/*

Frequent useful commands which interact with files

*/
const fs = require("fs");

class File {

    //Check log directories exist and whether to create them if not (create:bool)
    verifyLogs(create) {
        return new Promise((resolve, reject) => {
            this.paths = ["./logs/backup", "./logs/system"];
            this.count = 0;
            this.paths.forEach(path => {
                if(fs.existsSync(path)) { this.count++ } 
                else { 
                    if (create) {
                        try { 
                            fs.mkdirSync(path, {recursive: true});
                            fs.writeFileSync(`${path}/.gitignore`, "*\n!.gitignore");
                            this.count++
                        } catch (error) {}
                    }
                }
            })
            if (this.count == this.paths.length) { resolve() }
            else { reject("Invalid log directory") }
        })
    }

}

module.exports = File;