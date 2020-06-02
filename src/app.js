/*

Back-It-Up Entry file checks program validity and begins the application

*/
const async = require("async");
const config = require("./utils/config.js");
const logger = require("./utils/log.js");
const file = require("./utils/file.js");

const Config = new config();
const Log = new logger();
const File = new file();

Log.new("system", "test test test", {consoleOnly: true, colour: "FgRed"});

//Initialisation
async.auto({
    
    //Check config file is present
    config_read: (callback) => {                            
        Config.read()
        .then((result) => { callback(null, result.config) },
               (error) => { callback(error) })
    },
    //Validate logs directories
    validate_logs: (callback) => {
        File.verifyLogs(true)
        .then(() => { callback(null) },
         (error) => { callback(error) })
    }

}, (err, results) => {
    if (err) { console.error(`Failed to initialise:`, err) } 
    else { console.log(results) }
})


