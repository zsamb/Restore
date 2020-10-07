//Create backup socket event
const archiver = require('archiver');

const {send} = require("../../../utils/log");
const Backup = require("../../../db/models/backup");
const { parse, validateUrls }  = require("../../../backup/parse");
const { convert } = require("../../../utils/bytes");

module.exports = (socket, data) => {
    const user = data.user;
    const group = data.group;
    if (group.permissions.includes("create_backup")) {

        let backupRecord;
        let backupIdentifier;
        let targetActions;
        let sourceActions;
        let collectiveSize = 0;
        
        //Write initial backup data to database
        send("backup", "Create new backup..")
            .then(() => {
                socket.emit("Update", { req: "create_backup", msg: "Adding backup to database" });
                data.body.owner = user.id;
                const backup = new Backup(data.body);
                backupRecord = backup;
                backupIdentifier = backup.id.substring(0, 7);
                return backup.save()
            })
            .then(() => {
                const creationStart = process.hrtime();
                //Start validation
                socket.emit("Update", { req: "create_backup", msg: "Beginning validation" });
                parse("targets")
                    .then(tActions => {
                        targetActions = tActions;
                        return validateUrls(data.body.targets, targetActions);
                    })
                    .then(() => {
                        socket.emit("Update", { req: "create_backup", msg: "Validated targets" });
                        return parse("sources");
                    })
                    .then(sActions => {
                        sourceActions = sActions;
                        return validateUrls(data.body.sources, sourceActions);
                    })
                    .then(async () => {
                        socket.emit("Update", { req: "create_backup", msg: "Validated sources" });
                        //Loop through targets and create backups
                        return new Promise((resolve, reject) => {
                            data.body.targets.forEach((target, index, array) => {
                                const targetStart = process.hrtime();

                                socket.emit("Update", { req: "create_backup", msg: `Backing up target ${index + 1} of ${array.length}`});
                                send("backup", `${backupIdentifier} Backing up to target ${index + 1} of ${array.length}`);

                                let archive = archiver('zip', {zlib: {level: 9}});
                                let targetName = target.split(":")[0];
                                let tArgs = target.split(":");
                                tArgs.splice(0, 1);
                                let targetClass = new targetActions[targetName][targetName](tArgs);
                                let output = targetClass.createStream();

                                archive.on("warning", (error) => {
                                    if (error.code !== "ENOENT") {
                                        reject(error.message)
                                    }
                                });
                                archive.on("error", (error) => {
                                    reject(error.message)
                                });

                                //On backup completion (output stream closes)
                                output.on("close", () => {
                                    collectiveSize = collectiveSize + archive.pointer();
                                    const elapsedDiff = process.hrtime(targetStart);
                                    const creationTookMs = Math.floor(((elapsedDiff[0] * 1e9 + elapsedDiff[1]) / 1000) / 1000);
                                    socket.emit("Update", { req: "create_backup", msg: `Backup of target ${index + 1} of ${array.length} complete! Took ${creationTookMs}ms`})
                                    send("backup", `${backupIdentifier} Backup of target ${index + 1} of ${array.length}! Took ${creationTookMs}ms`);
                                    resolve();
                                })

                                //Pipe sources into the archive
                                archive.pipe(output);
                                data.body.sources.forEach((source, index, array) => {
                                    let name = source.split(":")[0];
                                    let args = source.split(":");
                                    args.splice(0, 1);
                                    let sourceAction = require(`../../../backup/sources/${name}.js`)
                                    let sourceClass = new sourceAction[name](args);
                                    sourceClass.read(archive);
                                    socket.emit("Update", { req: "create_backup", msg: `(${index + 1} / ${array.length}) Piped source: ${name}`})
                                    send("backup", `${backupIdentifier} > (${index + 1} / ${array.length}) Piped source: ${name}`)
                                })
                                archive.finalize()

                            });
                        })
                    })
                    .then(async () => {
                        //Completion
                        const elapsedDiff = process.hrtime(creationStart);
                        const creationTookMs = Math.floor(((elapsedDiff[0] * 1e9 + elapsedDiff[1]) / 1000) / 1000);
                        let backupSize = convert(collectiveSize);

                        let backup = await Backup.findById(backupRecord.id);
                        backup.status = "Complete";
                        backup.size = backupSize;

                        await backup.save();

                        socket.emit("Update", { req: "create_backup", msg: `Backup complete`, complete: true, stats: {
                            size: backupSize,
                            collectiveSize: convert(collectiveSize * data.body.targets.length),
                            locationCount: data.body.targets.length,
                            id: backupRecord.id
                        }})
                        send("backup", `${backupIdentifier} Complete! (Backup size: ${backupSize}) (Collective size: ${convert(collectiveSize * data.body.targets.length)}) Backed to ${data.body.targets.length > 1 ? `${data.body.targets.length} locations!` : `${req.body.targets.length} location!`}`)
                    })
                    .catch(async error => {
                        //Catch errors when document is written
                        socket.emit("Error", { req: "create_backup", msg: error });
                        send("backup", `${backupIdentifier} > Backup creation error: ${error}`, {error: true});
                        await Backup.findByIdAndDelete(backupRecord.id);
                    })
            })
            .catch(error => {
                //Catch errors before document is written
                socket.emit("Error", { req: "create_backup", msg: error.message });
                send("backup", `Backup creation error: ${error.message}`, {error: true});
            })

    } else { socket.emit("Error", "You have invalid permissions") }
}