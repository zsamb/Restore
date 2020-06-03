/*

Configuration helper to execute commands regarding the configuration file.

*/
const fs = require("fs");

let configPath = "config.json";

//Read the config file
const read = () => {
    return new Promise((resolve, reject) => {
        fs.open(configPath, "r", (error, fd) => {
            if (error) {
                if (error.code == "ENOENT") {
                    reject("Config does not exist");
                } else {
                    reject(`Failed to read config: ${error.message}`);
                }
            } else {
                fs.stat(configPath, (error, stats) => {
                    if (error) {
                        reject(`Failed to read config: ${error.message}`);
                    } else {
                        let buffer = Buffer.alloc(stats.size);
                        fs.read(fd, buffer, 0, buffer.length, null, (error, bytesRead, buffer) => {
                            if (error) {
                                reject(`Failed to read config: ${error.message}`);
                            } else {
                                resolve({ config: JSON.parse(buffer.toString()), bytes: bytesRead })
                            }
                        })
                    }
                })
            }
        })
    })
}


//Edit a key value of the config file
const edit = (key, value) => {
    return new Promise((resolve, reject) => {
        read()
        .then((result) => {
            const config = result.config;
            if (key in config) {
                config[key] = value;
                //Save
                save(config)
                .then((result) => {
                    resolve({config, bytes: result})
                },
                (error) => {
                    reject(`Failed to edit config: ${error.message}`)
                })
            } else {
                reject(`The object key does not exist`)
            }
        }, 
        (error) => {
            reject(`Failed to edit config: ${error.message}`)
        })
    })
}


//Save the config
const save = (confObj) => {
    return new Promise((resolve, reject) => {
        fs.open(configPath, "r+",(error, fd) => {
            if (error) {
                if (error.code == "ENOENT") {
                    reject("Config does not exist")
                } else {
                    reject(`Failed to save config: ${error.message}`)
                }
            } else {
                let buffer = Buffer.from(JSON.stringify(confObj, null, 4))
                fs.write(fd, buffer, 0, buffer.length, null, (error, bytesWritten, buffer) => {
                    if (error) {
                        reject(`Failed to save config: ${error.message}`)
                    } else {
                        //Check the full buffer was written
                        if (bytesWritten == buffer.length) {
                            resolve(bytesWritten)
                        } else {
                            reject("The full buffer was not written")
                        }
                    }
                })
            }
        })
            
    })
}


module.exports = { read, edit, save };