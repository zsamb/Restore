/*

Back-It-Up Entry file checks program validity and begins the application

*/
const async = require("async");
const Config = require("./utils/config.js");
const logger = require("./utils/log.js");
const Log = new logger();

Log.new("backup", "boink", {error: true});

//Initialisation
async.auto({
    
    //Check config file is present
    config_read: (callback) => {                            
        Config.read()
        .then((result) => { callback(null, result.config) },
                   (error) => { callback(error) })
    }
    //Validate logs directories

}, (err, results) => {
    if (err) { console.error(`Failed to initialise:`, err) } 
    else { console.log(results) }
})


