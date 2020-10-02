/*
Group Endpoints

Interface for managing groups
*/
const express = require('express');
const Group = require("../../db/models/group");
const router = new express.Router();
const mongoose = require('mongoose');

const Auth = require("../..//middleware/auth");

/*
FETCH GROUPS
Fetches all groups from the database
Permissions: view_group
*/
router.get("/api/groups", Auth.group, async (req, res) => {
    try {
        if (req.group.permissions.includes("view_group")) {
            const groups = await Group.find({});
            res.status(200).send(groups);
        } else {
            throw new Error("You have incorrect permissions")
        }
    } catch (error) {
        res.status(500).send({error: true, data: error.message})
    }
})
/*
FETCH GROUP BY ID
Fetches a group by its ObjectId
Permissions: view_group
*/
router.get("/api/group/:id", Auth.group, async (req, res) => {
    try {
        if (req.group.permissions.includes("view_group")) {
            const group = await Group.findById(req.params.id);
            if (!group) {
                throw new Error("Could not find group")
            }
            res.status(200).send(group);
        } else {
            throw new Error("You have incorrect permissions")
        }
    } catch (error) {
        res.status(400).send({error: true, data: error.message})
    }
})
/*
CREATE GROUP
Creates a new permission group
Permissions: create_group
*/
router.post("/api/group", Auth.group, async (req, res) => {
    try {
        if (req.group.permissions.includes("create_group")) {
            const group = new Group(req.body);
            await group.save();
            res.status(201).send(group);
        } else {
            throw new Error("You have incorrect permissions")
        }
    } catch (error) {
        res.status(400).send({error: true, data: error.message});
    }
})
/*
UPDATE GROUP
Updates an existing group with new values
Permissions: update_group
*/
router.patch("/api/group/:id", Auth.group, async (req, res) => {
    try {
        if (req.group.permissions.includes("update_group")) {
            let group = await Group.findById(req.params.id);
            if (!group) {
                throw new Error("Could not find that group")
            } else {

                //Check all updates are valid
                const updates = Object.keys(req.body);
                if (updates.length < 1) {
                    throw new Error("No updates were sent")
                }

                const validUpdates = ["name", "permissions"];
                const validRequest = validUpdates.every(update => validUpdates.includes(update));
                if (!validRequest) {
                    throw new Error("Invalid updates")
                }
                ;
                //Update group
                const group = await Group.findById(req.params.id);
                if (!group) {
                    throw new Error("Could not find that group")
                } else {
                    updates.forEach(update => group[update] = req.body[update]);
                    await group.save();
                    res.status(200).send(group);
                }
            }
        } else {
            throw new Error("You have incorrecct permissions")
        }
    } catch (error) {
        res.status(400).send({error: true, data: error.message})
    }
})
/*
DELETE GROUP
Deletes a group
Permissions: delete_group
*/
router.delete("/api/group/:id", Auth.group, async (req, res) => {
    try {
        if (req.group.permissions.includes("delete_group")) {
            const group = await Group.findById(req.params.id);
            if (!group) {
                throw new Error("Could not find that group")
            } else {
                await group.remove();
                res.status(200).send();
            }
        } else {
            throw new Error("You have incorrect permissions")
        }
    } catch (error) {
        res.status(400).send({error: true, data: error.message});
    }
})

module.exports = router;