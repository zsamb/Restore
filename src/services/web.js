/*
    Begins webserver and configures express
*/
const express = require("express");
const moment = require("moment");
const app = express();
const cookieParser = require("cookie-parser");
const http = require("http");
const path = require("path");
const fs = require("fs");

const Log = require("../utils/log");
const Socket = require("./sockets/socket.js");

//Start webserver
const start = (config) => {
    return new Promise((resolve, reject) => {
        try {
            //Configure express
            Log.send("system", "Configuring express..");
            app.use(express.json());
            app.use((error, req, res, next) => {
                if (error instanceof SyntaxError && error.status >= 400 && error.status < 500 && error.message.indexOf("JSON") !== -1) {
                    res.status(400).send({error: true, data: "Invalid JSON body"});
                } else {
                    next()
                }
            })
            //Trust proxy if behind proxy
            if (config.web.proxy) {
                app.set("trust_proxy", true);
                Log.send("system", "Enabled trust_proxy.");
            }
            //Load assets and engines
            Log.send("system", "Loading assets..");
            app.use("/assets", express.static("public/assets"));
            app.set("view engine", "hbs");
            app.set("views", path.join(__dirname, "../../templates"));
            app.use(cookieParser());
            //Register routers
            Log.send("system", "Registering routers..");
            fs.promises.readdir(path.join(__dirname, "../routers"))
                .then(files => {
                    files.forEach(file => {
                        if (file.split(".")[1] == "js") {
                            let router = require(`../routers/${file}`);
                            app.use(router);
                            if (config.web.debug_mode) {
                                let debugTimestamp = `[ ${moment().format("HH:mm:ss")} ]`;
                                console.log(`\x1b[34m[ DEBUG ] ${debugTimestamp} Loaded ${file}\x1b[0m`);
                            }

                        }
                    })
                    Log.send("system", "Registering API routers..");
                    fs.promises.readdir(path.join(__dirname, "../routers/api"))
                        .then(files => {
                            files.forEach(file => {
                                if (file.split(".")[1] == "js") {
                                    let router = require(`../routers/api/${file}`);
                                    app.use(router);
                                    if (config.web.debug_mode) {
                                        let debugTimestamp = `[ ${moment().format("HH:mm:ss")} ]`;
                                        console.log(`\x1b[34m[ DEBUG ] ${debugTimestamp} Loaded ${file}\x1b[0m`)
                                    }

                                }
                            })

                            try {
                                //Create server and wrap socket.io
                                Log.send("system", "Starting http server..");
                                const httpServer = http.createServer(app);
                                const io = require("socket.io")(httpServer);

                                //Handle socket connections and events
                                Socket.handler(io, {})
                                    .then(() => {
                                        //404
                                        app.get("*", (req, res) => {
                                            res.render("404.hbs");
                                        })

                                        httpServer.on("error", error => {
                                            reject(error.message);
                                        });
                                        httpServer.listen(config.web.port, () => {
                                            Log.send("system", "Webserver started", {colour: "FgGreen"});
                                            resolve(httpServer);
                                        });
                                    }).catch(error => reject(error))
                            } catch (error) {
                                reject(error.message)
                            }
                        }).catch(error => reject(error.message));
                }).catch(error => reject(error.message));
        } catch (error) {
            reject(error.message)
        }

    })
}

module.exports = {start}