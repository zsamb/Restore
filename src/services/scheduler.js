/*

Create backup schedule function
- Validates schedule data (also backup data like target and sources)
- Adds automation to the database
- Creates the schedule > name is id ect..
- If backup isnt recurring delete it after its first run and its database entry
- On its run update database data and create said backup > if backup creation errors set errors to true and cancel the job and disable it
- Log that its an automation running before and after AUTOMATION START [ID]\ AUTOMATION END [ID]

Delete backup schedule function
- Verifies automation exists
- Removes the schedule from active jobs if enabled
- Removes the schedule from the database

Begin schedules function
- Loop through each schedule in the database that is enabled
- use new create backup function

*/
/**
 * @module Scheduler
 */

const Auto = require("../db/models/auto");
const {parse, validateUrls} = require("../backup/parse");
const Config = require("../../config.json");

/**
 * Create new backup automation schedule
 * @param {Object} automationData The automation data required to create the automation
 * @param {Object} user The user creating the automation
 */
const createSchedule = (automationData, user) => {
    return new Promise((resolve, reject) => {
        /*
            Validate automation backup data
            - Validates sources
            - Validates targets
        */
        try {
            const backupSources = automationData.backupData.sources || "none";
            const backupTargets = automationData.backupData.targets || "none";

            if (backupSources === "none") { reject("An automation backup source is required") }
            else if (backupTargets === "none") { reject("An automation backup target is required") }
            else if (backupSources.length < 1 || backupSources.length > Config.options.maximumSources) { reject("You have too many/little sources") }
            else if (backupTargets.length < 1 || backupTargets.length > Config.options.maximumTargets) { reject("You have too many/little sources") 
            } else {
                try {

                    let autoIndentifier = "";
                    let autoRecord

                    parse("sources")
                    .then(sourceActions => { return validateUrls(backupSources, sourceActions) })
                    .then(() => { return parse("targets") })
                    .then(targetActions => { return validateUrls(backupTargets, targetActions) })
                    .then(() => { 
                        try {
                            automationData.owner = user.id;
                            const auto = new Auto(automationData);
                            autoRecord = auto;
                            autoIndentifier - auto.id.substring(0, 7);
                            return auto.save()
                        } catch (error) { throw new Error(error.message) }
                    })
                    .then(() => { 
                        //Create the schedule
                        resolve()
                    })
                    //Catch errors before data is written to database
                    .catch(error => { reject(error) })

                } catch (error) { reject(error) }
            }
        } catch (error) { reject("Invalid backup data sources or targets") }
    })
}

/**
 * Deletes a backup automation schedule
 */
const deleteSchedule = (id) => {
    return new Promise(async (resolve, reject) => {
        //verify automation exists
        try {
            const auto = await Auto.findById(id);
            if (!auto) { throw new Error("Could not find that automation")
            } else {
                //Remove from database
                await auto.remove();
                //Remove active schedule if enabled
                resolve()
            }
        } catch (error) { reject(`Failed to delete backup automation: ${error.message}`) }
    })
}

module.exports = { createSchedule, deleteSchedule }