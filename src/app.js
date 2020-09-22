/*
Main program entry point

Validates and begins restore
*/
const { waterfall } = require("async");
const mongoose = require("mongoose");
const fs = require("fs");

const Log = require("./utils/log");
const Web = require("./services/web");
const Exit = require("./utils/exit");

//Begin initialisation
waterfall([

    //Validate config
    (callback) => {
        Log.send("system", "Attempting to read config file..");
        fs.promises.readFile("config.json").then(config => {
            Log.send("system", "Successfully read config file.");
            callback(null, JSON.parse(config));
        }).catch(error => callback(error.message));
    },

    //Validate mongodb
    (config, callback) => {
        Log.send("system", "Testing MongoDB connection..");
        const connectionStr = `mongodb://${config.mongo.user}:${config.mongo.password}@${config.mongo.host}:${config.mongo.port}/${config.mongo.database}?authSource=${config.mongo.auth}`;
        mongoose.connect(connectionStr, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true
        }).then(() => {
            Log.send("system", "Successfully connected to MongoDB.");
            callback(null, config, connectionStr);
        }).catch(error => callback(error.message));
    },

    //Run firstRun tasks if neccessary
    (config, uriStr, callback) => {
        if ("init" in config) { 
            Log.send("system", "Completing first run prerquisites..");
            Log.send("system", "Generating a random token secret..");
            const select = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
            let tokenSecret = "";
            for (let x=0; x <= 30; x++) { 
                let ranInt = Math.floor(Math.random() * 62);
                tokenSecret = tokenSecret.concat(select[ranInt]);
            }
            config.web.token_secret = tokenSecret;
            delete config.init;
            fs.promises.writeFile("config.json", JSON.stringify(config, null, 4))
            .then(async () => {
                Log.send("system", "Secret generated.");
                Log.send("system", "Creating default user and group..");
                const Group = require("./db/models/group");
                let defaultGroup = new Group({name: "admin", permissions: ["*"]});
                await defaultGroup.save();
                const User = require("./db/models/user");
                let defaultUser = new User({username: "admin", email: "admin@example.com", group: "admin", password: "password"});
                await defaultUser.save();
                Log.send("system", "Default user and group created.");
                callback(null, config, uriStr);
            })
        } else { callback(null, config, uriStr) }
    }

], (error, config, uriStr) => {
    //Success
    if (!error) { 
        Log.send("system", `Initialisation complete`, { colour: "FgGreen" }); 
        Log.send("system", "Starting webserver..");
        Web.start(config)
        .then(httpServer => {
            
            //Handle exits
            Exit.handle(() => {
                Log.send("system", "Closing..");
                httpServer.close();
                mongoose.connection.close();
            })

        }).catch(error => {
            Log.send("system", `Failed to start webserver: ${error}`, { error: true, colour: "FgRed" });
            process.exit(5);
        })
    //Failure
    } else { 
        Log.send("system", `Failed initialisation: ${error}`, { error: true, colour: "FgRed" });
        process.exit(5);
    }
})