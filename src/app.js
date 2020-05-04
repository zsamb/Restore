/*

Back-It-Up Entry file checks program validity and begins the application

*/
const rfr = require("rfr");
const async = require("async");

const Config = rfr("src/helpers/config.js");

//Initialisation
async.auto({
    //Check the config file is present
    config_read: (callback) => {
        Config.read()
            .then((result) => { callback(null, result.config) },
                   (error) => { callback(error) })
    }

}, (err, results) => {
    if (err) { console.error(`Failed to initialise:`, err) } 
    else { console.log(results) }
})

