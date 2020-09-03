/*
Backup Endpoints

Interface for managing backups
*/
const express = require('express');
const archiver = require('archiver');
const router = new express.Router();
const fs = require("fs");

const Auth = require("../middleware/auth");
const Backup = require("../db/models/backup");
const { parse, validateUrls } = require("../backup/parse");
const { convert } = require("../utils/bytes");
const { send } = require("../utils/log");

/*
CREATE BACKUP
Creates a new backup
Permissions: create_backup
*/
router.post("/api/backup", Auth.group, async (req, res) => {
    if (req.group.permissions.includes("create_backup")) {

        let backupRecord;
        let backupIdentifier;
        let targetActions;
        let sourceActions;
        let collectiveSize = 0;

        //Write initial backup data to database
        send("backup", "Create new backup..")
        .then(() => {
            req.body.owner = req.user.id;
            const backup = new Backup(req.body);
            backupRecord = backup;
            backupIdentifier = backup.id.substring(0, 7);
            return backup.save();
        })
        .then(() => {
            const creationStart = process.hrtime();
            //Validation
            parse("targets")
            .then(tActions => { targetActions = tActions; return validateUrls(req.body.targets, targetActions); })
            .then(() => { return parse("sources") })
            .then(sActions => { sourceActions = sActions; return validateUrls(req.body.sources, sourceActions); })
            .then(async () => {
                //Loop through targets and create backups
                return new Promise((resolve, reject) => {
                    req.body.targets.forEach((target, index, array) => {
                        const targetStart = process.hrtime();

                        send("backup", `${backupIdentifier} Backing up to target ${index + 1} of ${array.length}`);

                        let archive = archiver('zip', { zlib: { level: 9 } });
                        let targetName = target.split(":")[0];
                        let tArgs = target.split(":");
                        tArgs.splice(0, 1); 
                        let targetClass = new targetActions[targetName][targetName](tArgs);
                        let output = targetClass.createStream();
                        
                        archive.on("warning", (error) => { if (error.code !== "ENOENT") { reject(error.message)}});
                        archive.on("error",   (error) => { reject(error.message) });

                        //On backup completion (output stream closes)
                        output.on("close", () => {
                            collectiveSize = collectiveSize + archive.pointer();
                            const elapsedDiff = process.hrtime(targetStart);
                            const creationTookMs = Math.floor(((elapsedDiff[0] * 1e9 + elapsedDiff[1]) / 1000) / 1000);
                            send("backup", `${backupIdentifier} Backup of target ${index + 1} of ${array.length}! Took ${creationTookMs}ms`);
                            resolve();
                        })

                        //Pipe sources into the archive
                        archive.pipe(output);
                        req.body.sources.forEach((source, index, array) => {
                            let name = source.split(":")[0];
                            let args = source.split(":");
                            args.splice(0, 1);
                            let sourceAction = require(`../backup/sources/${name}.js`)
                            let sourceClass =  new sourceAction[name](args);
                            sourceClass.read(archive);
                            send("backup", `${backupIdentifier} > (${index + 1} / ${array.length}) Piped source: ${name}`)
                        })
                        archive.finalize()
                    })
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

                res.status(201).send({tookMs: creationTookMs, backup});
                send("backup", `${backupIdentifier} Complete! (Backup size: ${backupSize}) (Collective size: ${convert(collectiveSize * req.body.targets.length)}) Backed to ${req.body.targets.length > 1 ? `${req.body.targets.length} locations!` : `${req.body.targets.length} location!`}`)
            })
            .catch(async error => {
                //Catch errors when document is written
                res.status(400).send({ error: true, data: error});
                send("backup", `${backupIdentifier} > Backup creation error: ${error}`, {error: true});
                await Backup.findByIdAndDelete(backupRecord.id);
            })
        })
        .catch(error => { 
            //Catch errors before document is written
            res.status(400).send({ error: true, data: error.message });
            send("backup", `Backup creation error: ${error.message}`, {error: true});
        })

    } else { res.status(403).send({ error: true, data: "You have invalid permissions" })}
})

/*
DELETE BACKUP
Deletes a backup from the database and optionally
its files
Permissions: delete_backup
*/
router.delete("/api/backup/:id", Auth.group, async (req, res) => {
    try {
        if (req.group.permissions.includes("delete_backup")) {
            //Remove it from the database
            let backup = await Backup.findById(req.params.id);
            if (!backup) { throw new Error(`Could not find backup: ${req.params.id}`) }
            else { 
                let backupData = backup;
                let backupIdentifier = backupData.id.substring(0, 7);

                await send("backup", `${backupIdentifier} Deleting backup`);
                await backup.remove();
                await send("backup", `${backupIdentifier} > Removed from database`);

                if (req.body.removeFiles == true) {
                    //Optionally remove files too
                    parse("targets")
                    .then(targetActions => {
                        return new Promise((resolve, reject) => {
                            try {
                                backupData.targets.forEach((target, index, array) => {

                                    send("backup", `${backupIdentifier} > (${index + 1} / ${array.length}) Attempting to remove files..`)

                                    let targetName = target.split(":")[0];
                                    let tArgs = target.split(":");
                                    tArgs.splice(0, 1);
                                    let targetClass = new targetActions[targetName][targetName](tArgs);
                                    
                                    targetClass.delete()
                                    .then(() => { 
                                        send("backup", `${backupIdentifier} > (${index + 1} / ${array.length}) Deleted files`)
                                        resolve() 
                                    })
                                    .catch(error => {
                                        send("backup", `${backupIdentifier} > (${index + 1} / ${array.length}) Failed to delete files: ${error}`)
                                        reject(error)
                                    })
                                })
                            } catch (error) { reject(error.message) }
                        })
                    })
                    .then(() => {
                        //Complete
                        res.status(200).send()

                    })
                    .catch(error => { res.status(400).send({error: true, data: error}) })
                } else { res.status(200).send() }
            }
        } else { throw new Error("You have incorrect permissions")}
    } catch (error) {
        res.status(400).send({error: true, data: error.message});
    }
})

/*
FETCH BACKUPS
Fetches all backups from the database
Permissions: view_backup
*/
router.get("/api/backups", Auth.group, async (req, res) => {
    try {
        if (req.group.permissions.includes("view_backup")) {
            let backups = await Backup.find({});
            res.status(200).send(backups);
        } else { throw new Error("You have incorrect permissions") }
    } catch (error) {
        res.status(400).send({error: true, data: error.message})
    }
})

/*
FETCH BACKUP BY ID
Fetchs a backup by its id
Permissions: view_backup
*/
router.get("/api/backup/:id", Auth.group, async (req, res) => {
    try {
        if (req.group.permissions.includes("view_backup")) {
            let backup = await Backup.findById(req.params.id);
            if (!backup) { throw new Error("Could not find backup")}
            else { res.status(200).send({backup}) }
        } else { throw new Error("You have incorrect permissions") }
    } catch (error) {
        res.status(400).send({error: true, data: error.message})
    }
})

/*
RESTORE BACKUP
Restores a backup
Permissions: restore_backup
*/
router.post("/api/backup/restore", Auth.group, async (req, res) => {
    if (req.group.permissions.includes("restore_backup")) {

    } else { res.status(403).send({ error: true, data: "You have invalid permissions" }) }
})

module.exports = router;