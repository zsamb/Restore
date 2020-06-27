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

//Verify the database and mongodb server can be connected to and used - if error returns array of errors
const verifyMongo = () => {
    return new Promise((resolve, reject) => {

        const { read } = require("./config.js");
        const { send, sendMultiple } = require("../utils/log");
        const { checkConfig } = require("../db/validate");
        const mongoose = require("mongoose");

        //Read config
        read().then((data) => {
            //Check data
            checkConfig(data.config.mongo).then(() => {

                let mongo = data.config.mongo;
                let connectionURI = `mongodb://${mongo.user}:${mongo.password}@${mongo.host}:${mongo.port}`;

                send("system", "Connecting to MongoDB for validation...")

                mongoose.connect(connectionURI, {
                    useNewUrlParser: true,
                    useUnifiedTopology: true
                }).then(() => {

                    //Disconnect if good connection
                    sendMultiple("system", ["Validated database credentials", "Disconnecting from MongoDB"]);
                    mongoose.disconnect();
                    resolve();

                }).catch(error => reject([error.message]));
            }).catch(errors => reject(errors));
        }).catch(error => reject([error.message]));
    })
}

module.exports = { verifyLogs, verifyMongo }