/*
Main program entry point

Validates and begins restore
*/
const { auto } = require("async");
const fs = require("fs");
const mongoose = require("mongoose");
const cp = require("child_process");

const Log = require("./utils/log");
let URI;

auto({

    //Check config file is accessible
    read_config: (callback) => {       
        Log.send("system", "Checking config file...");  
        fs.promises.readFile("config.json")
        .then(config => {
            Log.send("system", "Config file is available");
            callback(null, JSON.parse(config));
        }, (error) => callback(error.message));
    },

    //Connect to mongodb to validate creds
    connect_mongo: ["read_config", (results, callback) => {
        const mongo = results.read_config.mongo;
        const connection = `mongodb://${mongo.user}:${mongo.password}@${mongo.host}:${mongo.port}/${mongo.database}`;

        Log.send("system", `Validating MongoDB at: ${mongo.host}:${mongo.port}...`);
        mongoose.connect(connection, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true
        }).then(() => {
            URI = connection;
            Log.send("system", `Validated MongoDB database: ${mongo.database}`);
            callback();
        }).catch(error => callback(error.message));
    }],

    //Check if first run and if so create preinit requirements
    first_run: ["read_config", (results, callback) => {
        if ("init" in results.read_config) {
            Log.send("system", "First run detected, running prerequisites...");

            //Generate token secret
            const selection = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
            let secret = "";
            let length = Math.floor(Math.random() * (80 - 50)) + 50;

            Log.send("system", "Generating token secret");
            for (let x=0; x <= length; x++) {
                let rInt = Math.floor(Math.random() * 62);
                secret = secret + selection[rInt];
            }
            //Save
            results.read_config.web.token_secret = secret;
            delete results.read_config.init;
            fs.promises.writeFile("config.json", JSON.stringify(results.read_config, null, 4))
            .then(async () => {
                Log.send("system", "Secret generated");
                //Create admin group and user
                Log.send("system", "Creating admin group and user");

                const Group = require("./db/models/group");
                const User = require("./db/models/user");

                let adminGroup = new Group({
                    name: "admin",
                    permissions: ["*"]
                })
                let adminUser = new User({
                    username: "admin",
                    email: "admin@example.com",
                    group: "admin",
                    password: "password"
                })
                
                await adminGroup.save();
                await adminUser.save();

                Log.send("system", "Group and user created");
                //Close connection
                mongoose.connection.close();
                callback();

            }).catch(error => callback(error.message));
        } else { callback() }
    }],

    //Start webserver as child
    start_web: ["connect_mongo", "first_run", (results, callback) => {
        Log.send("system", "Starting webserver...");
        try {
            let web = cp.fork("./src/services/web.js", [URI, JSON.stringify(results.read_config)]);
            web.on("close", () => {
                Log.send("system", "Webserver closed", { colour: "FgYellow" })
                process.exit();
            })
            callback();
        } catch (error) { callback(error.message) }
    }],

    //Finished initialisation
}, (error, results) => {
    if (error) { 
        Log.send("system", error, { error: true, colour: "FgRed" });
        process.exit(5);
    } else { 
        Log.send("system", "Initialisation successful", { colour: "FgGreen" });
    }
})
