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

const verifySQL = () => {

    const { createConnection } = require("mysql");
    const { read } = require("./config");

    return new Promise(async (resolve, reject) => {

        let config = await read();
        let connection = createConnection(config.config.sql);
        connection.connect((err) => {
            if (err) { reject(err.sqlMessage) } 
            else {
                connection.end();
                resolve();
            }
        })

    })

}

module.exports = { verifyLogs, verifySQL }