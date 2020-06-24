/*

Back-It-Up Entry file checks program validity and begins the application

*/
const async = require("async");

const Config = require("./utils/config");
const Log = require("./utils/log");
const Init = require("./utils/init");
const backup = require("./utils/backup");

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
        Init.verifyLogs(true)
        .then(() => { callback(null) },
         (error) => { callback(error) })
    }

}, (err, results) => {

    if (err) { console.error(`Failed to initialise:`, err) } 
    else { 
        console.log(results);
    }

})
