/*
Logging Endpoints
*/
const express = require('express');
const router = new express.Router();
const fs = require("fs");
const readline = require('readline');

const Auth = require("../middleware/auth");

/*
DELETE LOGS
Deletes specified logs
Permissions: delete_logs
*/
router.delete("/api/logs", Auth.group, (req, res) => {
    try {
        if (req.group.permissions.includes("delete_logs")) {
            const locations = ["backup", "system", "access"];
            if (locations.includes(req.query.type)) {
                fs.promises.readdir(`./logs/${req.query.type}`)
                .then(files => {
                    let loop = new Promise((resolve, reject) => {
                        try {   
                            files.forEach(async file => {
                                if (file.split(".")[1] == "log") {
                                    await fs.promises.unlink(`./logs/${req.query.type}/${file}`);
                                }
                            })
                            resolve()
                        } catch (error) { reject(error.message) }
                    })
                    loop.then(() => res.status(200).send())
                    .catch(errors => res.status(400).send({error: true, data: errors}));
                })
            } else { throw new Error(`Invalid log type: ${req.query.type}`) }
        } else { throw new Error("You have incorrect permissions") }
    } catch (error) {
        res.status(400).send({error: true, data: error.message})
    }
})

/*
FETCH LOGS
Fetches specified logs
Permissions: view_logs
*/
router.get("/api/logs", Auth.group, (req, res) => {
    try {
        if (req.group.permissions.includes("view_logs")) {
            const locations = ["backup", "system", "access"];
            if (locations.includes(req.query.type)) {
                //Attempt to create readstream
                let rs = fs.createReadStream(`./logs/${req.query.type}/${req.query.type}-${req.query.date}.log`);
                rs.on("error", error => { res.status(400).send({error: true, data: `Could not find the log: ${req.query.type}-${req.query.date}.log`}) });
                rs.on("ready", () => { 
                    rs.close()
                    let logData = [];
                    const readint = readline.createInterface({
                        input: fs.createReadStream(`./logs/${req.query.type}/${req.query.type}-${req.query.date}.log`)
                    })
                    readint.on("error", error => { res.status(500).send({error: true, data: error.message})});
                    readint.on("line",  line => logData.push(JSON.parse(line)));
                    readint.on("close", () => res.status(200).send(logData));
                })
            } else { throw new Error(`Invalid log type: ${req.query.type}`) }
        } else { throw new Error("You have incorrect permissions") }
    } catch (error) {
        res.status(400).send({error: true, data: error.message});
    }
})

module.exports = router;