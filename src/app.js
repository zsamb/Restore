/*

Back-It-Up Entry file checks program validity and begins the application

*/
const { auto } = require("async");

const { read } = require("./utils/config");
const Log = require("./utils/log");
const Init = require("./utils/init");

let logsAvailable = false;

//Initialisation
auto({
    
    //Validate logs directories
    validate_logs: (callback) => {
        Init.verifyLogs(true)
        .then(() => {
            Log.send("system", "Validated logs");
            logsAvailable = true;
            callback(null);
        }, (error) => callback([error]) )
    },
    //Check config file is present
    config_read: ["validate_logs", (results, callback) => {       
        Log.send("system", "Checking config file...");                     
        read()
        .then((result) => {
            Log.send("system", "Config file is accessible");
            callback(null, result.config);
        }, (error) => callback([error]) );
    }],
    //Validate mongodb credentials
    validate_mongo: ["validate_logs", "config_read", (results, callback) => {
        Init.verifyMongo()
        .then(() => callback(),
         (error) => callback(error) );

    }],
    //Start web server
    start_web: ["validate_mongo", "validate_logs", (results, callback) => {
        Init.startWeb(results.config_read)
        .then(() => { callback()},
         (error) => callback([error]) );
    }]
}, (error, results) => {

    //If there were errors in init log them and exit
    if (error) { 
        logsAvailable ? Log.sendMultiple("system", error, { error: true, colour: "FgRed" }) : console.error(`Failed to initialise: ${error[0]}`);
        process.exit(5);
    } else { 
        Log.send("system", "Initialisation successful", { colour: "FgGreen" });
    }
})
