/**
 * @module Socket
 */
const fs = require("fs");
const path = require("path");
const jwt = require('jsonwebtoken');

const Log = require("../../utils/log");
const Config = require("../../../config.json");
const User = require("../../db/models/user");
const Group = require("../../db/models/group");
const { connections } = require("mongoose");

/**
 * Handles new socket connections
 * @param {SocketIO.Server} io Socket.io server instance
 * @param {Object} options Handler options
 * @param {Set} options.connections The active connection tracking set
 */
const handler = (io, options) => {
    return new Promise(async (resolve, reject) => {
        try {
            //Load socket events
            await Log.send("system", "Loading socket handler..")
            fs.promises.readdir(path.join(__dirname, "/events"))
                .then(async files => {
                    let events = {};
                    files.forEach(file => {
                        if (file.split(".")[1] === "js") {
                            events[file.split(".")[0]] = require(`./events/${file}`);
                        }
                    })
                    await Log.send("system", `Loaded ${files.length} socket events.`)
                    //Event handler
                    io.on("connection", socket => {
                        //Add connection to connection tracker
                        options.connections.add(socket);
                        socket.on("close", () => connections.delete(socket));
                        for (const [eventName, eventFunction] of Object.entries(events)) {
                            socket.on(eventName, body => {
                                parse(body)
                                    .then(data => {
                                        eventFunction(socket, data);
                                    }).catch(error => socket.emit("Error", { req: "handler", msg: error }))
                            })
                        }
                    })
                    resolve();
                }).catch(error => reject(error.message))
        } catch (error) {
            reject(error.message)
        }
    })
}

/**
 * Parses, validates and authenticates websocket event data
 * @param {Object} data Data from websocket event
 * @returns {Object} Returns parsed data with user and user group attached
 */
const parse = (data) => {
    return new Promise(async (resolve, reject) => {
        if (typeof data === "object") {
            //Authenticate
            const token = data.auth;
            if (typeof token === "string") {
                try {
                    const decode = jwt.verify(token, Config.web.token_secret);
                    const user = await User.findOne({_id: decode._id, "tokens.token": token})
                    if (user) {
                        data.user = user;
                        //Attach group
                        const group = await Group.findOne({name: user.group});
                        data.group = group;
                        //Check if body
                        if (typeof data.body === "object") {
                            resolve(data);
                        } else { reject("Invalid body")}
                    } else { reject("Invalid authentication") }
                } catch (error) { reject("Invalid authentication") }
            } else { reject("Invalid authentication") }
        } else { reject("Payload is not an object") }
    })
}

module.exports = {handler}