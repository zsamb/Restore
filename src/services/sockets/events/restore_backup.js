//Delete backup socket event
const {send} = require("../../../utils/log");
const Backup = require("../../../db/models/backup");
const { parse, validateUrls }  = require("../../../backup/parse");

module.exports = async (socket, req) => {

    let data = {};
    const group = req.group;

    if (group.permissions.includes("restore_backup")) {
        //Verify backup exists
        try {
            if (req.body.id) {

                if (typeof req.body.target !== "number") { throw new Error("Invalid restore target number")}

                let backup = await Backup.findById(req.body.id);
                let backupIdentifier = backup.id.substring(0, 7);

                if (!backup) {

                    throw new Error("Could not find backup")

                } else {
                    //Check if the backup is complete
                    if (backup.status == "Complete") {
                        //Check chosen target exists
                        if (backup.targets[req.body.target]) {
                            //Validate target
                            socket.emit("Update", { req: "restore_backup", msg: "Validating targets" })
                            parse("targets")
                                .then(targetActions => {

                                    data.targetName = backup.targets[req.body.target].split(":")[0];
                                    data.targetArgs = backup.targets[req.body.target].split(":");
                                    data.targetArgs.splice(0, 1);

                                    data.targetAction = new targetActions[data.targetName][data.targetName](data.targetArgs);

                                    socket.emit("Update", { req: "restore_backup", msg: "Parsing actions" })
                                    return data.targetAction.verifyRestore()

                                })
                                //Parse restore actions
                                .then(() => {
                                    return parse("restores")
                                })
                                //Select target to restore to
                                .then(restoreActions => {

                                    if (req.body.restoreTarget) {

                                        let lastSlash = data.targetAction.location.lastIndexOf("/");
                                        let fileName = data.targetAction.location.substring(lastSlash + 1, data.targetAction.location.length);
                                        let restoreTarget = req.body.restoreTarget + `:${fileName}`;

                                        data.restoreActions = restoreActions;
                                        data.restoreTarget = restoreTarget;

                                        socket.emit("Update", { req: "restore_backup", msg: "Validating restore target" })
                                        return validateUrls([restoreTarget], data.restoreActions);
                            
                                    } else {    
                                        throw "Please specifiy a restore target"
                                    }

                                })
                                //Restore the file to location
                                .then(() => {

                                    let restoreName = data.restoreTarget.split(":")[0];
                                    let restoreArgs = data.restoreTarget.split(":");
                                    restoreArgs.splice(0, 1);

                                    socket.emit("Update", { req: "restore_backup", msg: `Beginning backup restoration: [${restoreName}]` });
                                    send("backup", `${backupIdentifier} Beginning backup restoration.. [${restoreName}]`);
                                    data.restoreAction = new data.restoreActions[restoreName][restoreName](restoreArgs);

                                    //Get readstream
                                    let restoreStream = data.targetAction.restoreStream();
                                    socket.emit("Update", { req: "restore_backup", msg: `Created read stream` });
                                    send("backup", `${backupIdentifier} > Created read stream`);

                                    return data.restoreAction.restore(restoreStream);

                                })
                                //Check if files should be extracted and finish up
                                .then(() => {

                                    socket.emit("Update", { req: "restore_backup", msg: "Backup files restored" })
                                    send("backup", `${backupIdentifier} > Backup files restored`);

                                    if (req.body.extract) {

                                        socket.emit("Update", { req: "restore_backup", msg: "Beginning extraction" })
                                        send("backup", `${backupIdentifier} > Extracting..`)
                                        data.restoreAction.extract()
                                            .then(() => {
                                                socket.emit("Update", { req: "restore_backup", msg: "Restoration and extraction complete", complete: true })
                                                send("backup", `${backupIdentifier} Restoration and extraction complete`);
                                            })
                                            .catch(error => {
                                                socket.emit("Error", { req: "restore_backup", msg: `Backup restoration error: ${error}`})
                                                send("backup", `Backup restoration error: ${error}`, {error: true});
                                            })

                                    } else {
                                        socket.emit("Update", { req: "restore_backup", msg: "Restoration complete", complete: true })
                                        send("backup", `${backupIdentifier} Restoration complete`);
                                    }

                                })
                                .catch(error => {
                                    socket.emit("Error", { req: "restore_backup", msg: error } )
                                    send("backup", `Backup restoration error: ${error}`, {error: true});
                                })
                        } else {  throw new Error("Could not find selected target") }
                    } else { throw new Error("This backup cannot be restored") }
                }
            } else { throw new Error("Please define a backup id") }
        } catch (error) { socket.emit("Error", { req: "restore_backup", msg: error.message } ) }
    } else { socket.emit("Error", { req: "restore_backup", msg: "You have invalid permissions" }) }
}