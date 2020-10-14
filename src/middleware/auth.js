/**
 * @module Middleware
 */
const jwt = require('jsonwebtoken');
const fs = require("fs");
const moment = require("moment");
const Path = require("path");

const User = require("../db/models/user");
const Group = require("../db/models/group");
const Config = require("../../config.json");

/**
 * Creates an access log to file and console
 * @param {Object} request Incoming request data
 * @param {Boolean} auth Is request authenticated
 */
const createLog = (request, auth) => {
    return new Promise((resolve, reject) => {
        const fileTimestamp = moment().format("YYYY-MM-DD").concat(".log");
        const objectTimestamp = moment().format("x");

        const senderIP = request.headers["x-real-ip"] || request.ip;
        const endpoint = request.url;
        const senderMethod = request.method;

        //Save to file
        fs.promises.appendFile(Path.join(__dirname, `../../logs/access/access-${fileTimestamp}`), JSON.stringify({
            time: objectTimestamp,
            user: (auth ? request.user.username : "Unauthenticated"),
            endpoint,
            senderMethod,
            senderIP
        }).concat("\n"))
            .then(() => {
                if (Config.web.debug_mode) {
                    let debugTimestamp = `[ ${moment().format("HH:mm:ss")} ]`;
                    console.log(`\x1b[34m[ DEBUG ] ${debugTimestamp} New request: ${senderMethod}@${endpoint} from ${auth ? request.user.username : "Unauthenticated"}@${senderIP}\x1b[0m`)
                }
                resolve()
            })
            .catch(error => reject(error.message))
    })
}

/**
 * Creates an access log to file and console for no-auth endpoints
 */
const none = (req, res, next) => {
    const fileTimestamp = moment().format("YYYY-MM-DD").concat(".log");
    const objectTimestamp = moment().format("x");

    const senderIP = req.headers["x-real-ip"] || req.ip;
    const endpoint = req.url;
    const senderMethod = req.method;

    //Save to file
    fs.promises.appendFile(Path.join(__dirname, `../../logs/access/access-${fileTimestamp}`), JSON.stringify({
        time: objectTimestamp,
        endpoint,
        senderMethod,
        senderIP
    }).concat("\n"))
        .then(() => {
            if (Config.web.debug_mode) {
                let debugTimestamp = `[ ${moment().format("HH:mm:ss")} ]`;
                console.log(`\x1b[34m[ DEBUG ] ${debugTimestamp} New request: ${senderMethod}@${endpoint} from ${senderIP}\x1b[0m`)
            }
            next()
        })
        .catch(error => {
            next()
        })
}

/**
 * Authenticates request via web token and attaches user data to request 
 */
const user = async (req, res, next) => {
    try {
        //Authenticate
        const token = req.header('Authorization').replace('Bearer ', '');
        const decode = jwt.verify(token, Config.web.token_secret);
        const user = await User.findOne({_id: decode._id, 'tokens.token': token});
        if (!user) {
            throw new Error()
        }

        //Attach token and user data
        req.token = token;
        req.user = user;
        next();
        createLog(req, true);

    } catch (error) {
        res.status(401).send({error: true, data: "Invalid authentication"});
        createLog(req, false);
    }
}

/**
 * Authenticates request via web token from request cookies and attaches user data to request 
 */
const cookie = async (req, res, next) => {
    try {
        //Get token from cookie
        const token = req.cookies.token || undefined;
        if (!token) {
            throw new Error()
        }

        const decodedToken = jwt.verify(token, Config.web.token_secret);
        const user = await User.findOne({_id: decodedToken._id, 'tokens.token': token});
        if (!user) {
            throw new Error()
        }

        //Attach token and user data
        req.token = token;
        req.user = user;

        next();
        createLog(req, true);
    } catch (error) {
        res.redirect("/auth/login");
        createLog(req, false);
    }
}

/**
 * Fetches user group from webtoken and attaches it to request
 */
const group = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decode = jwt.verify(token, Config.web.token_secret);
        const user = await User.findOne({_id: decode._id, "tokens.token": token});
        if (!user) {
            throw new Error()
        } else {
            const group = await Group.findOne({name: user.group});
            if (!group) {
                throw new Error()
            } else {
                req.token = token;
                req.user = user;
                req.group = group;
                next();
                createLog(req, true);
            }
        }
    } catch (error) {
        res.status(401).send({error: true, data: "Invalid authentication"});
        createLog(req, false);
    }
}

module.exports = {user, group, none, cookie}