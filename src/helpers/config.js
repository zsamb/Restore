/*

Configuration helper to execute commands regarding the configuration file.

*/
const fs = require("fs");

class Config {

    constructor() {
        this.configPath = "config.json";
    }

    //Read the config file
    read() {
        return new Promise((resolve, reject) => {
            fs.open(this.configPath, "r", (error, fd) => {
                if (error) {
                    if (error.code == "ENOENT") {
                        reject("Config does not exist");
                    } else {
                        reject(`Failed to read config: ${error}`);
                    }
                } else {
                    fs.stat(this.configPath, (error, stats) => {
                        if (error) {
                            reject(`Failed to read config: ${error}`);
                        } else {
                            let buffer = Buffer.alloc(stats.size);
                            fs.read(fd, buffer, 0, buffer.length, null, (error, bytesRead, buffer) => {
                                if (error) {
                                    reject(`Failed to read config: ${error}`);
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

}

module.exports = new Config();