//Delete backup socket event
const archiver = require('archiver');

const {send} = require("../../../utils/log");
const Backup = require("../../../db/models/backup");
const { parse }  = require("../../../backup/parse");

module.exports = async (socket, data) => {
    const group = data.group;
    if (group.permissions.includes("delete_backup")) {
        try {
            //Attempt to remove from database
            if (data.body.id) {
                let backup = await Backup.findById(data.body.id);
                if (!backup) { throw new Error(`Could not find backup: ${data.body.id}`) }
                else {
                    let backupData = backup;
                    let backupIdentifier = backupData.id.substring(0, 7);

                    socket.emit("Update", { req: "delete_backup", msg: "Deleting backup" });
                    send("backup", `${backupIdentifier} Deleting backup`);

                    await backup.remove();

                    socket.emit("Update", { req: "delete_backup", msg: "Removed from database" });
                    send("backup", `${backupIdentifier} > Removed from database`);

                    if (data.body.removeFiles == true) {
                        //Optionally attempt to remove files
                        parse("targets") 
                            .then(targetActions => {
                                return new Promise((resolve, reject) => {
                                    try {
                                        backupData.targets.forEach((target, index, array) => {

                                            socket.emit("Update", { req: "delete_backup", msg: `(${index + 1} / ${array.length}) Attempting to remove files`})
                                            send("backup", `${backupIdentifier} > (${index + 1} / ${array.length}) Attempting to remove files..`)

                                            let targetName = target.split(":")[0];
                                            let tArgs = target.split(":");
                                            tArgs.splice(0, 1);
                                            let targetClass = new targetActions[targetName][targetName](tArgs);

                                            targetClass.delete()
                                            .then(async () => {
                                                socket.emit("Update", { req: "delete_backup", msg: `(${index + 1} / ${array.length}) Deleted files`})
                                                await send("backup", `${backupIdentifier} > (${index + 1} / ${array.length}) Deleted files`);
                                                resolve();
                                            })  
                                            .catch(async error => {
                                                socket.emit("Error", { req: "delete_backup", msg: `(${index + 1} / ${array.length}) Failed to delete files: ${error}`})
                                                await send("backup", `${backupIdentifier} > (${index + 1} / ${array.length}) Failed to delete files: ${error}`)
                                                reject(error);
                                            })
                                        })
                                    } catch (error) {
                                        reject(error.message)
                                    }
                                })
                            })
                            .then(() => {
                                //Complete
                                socket.emit("Update", { req: "delete_backup", msg: "Deleted backup", complete: true })
                            })
                            .catch(error => {
                                socket.emit("Error", { req: "delete_backup", msg: error })
                            })
                    } else {
                        //Complete
                        socket.emit("Update", { req: "delete_backup", msg: "Deleted backup", complete: true })
                    }
                }
            } else {
                throw new Error("Please define a backup id")
            }
        } catch (error) {
            socket.emit("Error", { req: "delete_backup", msg: error.message } )
        }
    } else { socket.emit("Error", { req: "delete_backup", msg: "You have invalid permissions" }) }
}