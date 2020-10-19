/*
Automation Endpoints
*/
const express = require('express');
const router = new express.Router();

const Scheduler = require("../../services/scheduler")
const Auth = require("../../middleware/auth");

/*
CREATE AUTOMATION 
Creates a new backup automation
Permissions: create_auto
*/
router.post("/api/auto", Auth.group, async (req, res) => {
    try {
        if (req.group.permissions.includes("create_auto")) {

            Scheduler.createSchedule(req.body, req.user)
            .then(() => res.status(200).send())
            .catch(error => res.status(400).send({error: true, data: error}))

        } else {
            throw new Error("You have incorrect permissions")
        }
    } catch (error) {
        res.status(400).send({error: true, data: error.message})
    }
})

/*
DELETE AUTOMATION 
Removes specified backup automation
Permissions: delete_auto
*/
router.delete("/api/auto/:id", Auth.group, async (req, res) => {
    try {
        if (req.group.permissions.includes("delete_auto")) {
            
            Scheduler.deleteSchedule(req.params.id)
            .then(() => res.status(200).send())
            .catch(error => res.status(400).send({error: true, data: error}))
            
        } else {
            throw new Error("You have incorrect permissions")
        }
    } catch (error) {
        res.status(400).send({error: true, data: error.message})
    }
})

/*
FETCH AUTOMATIONS
Fetches all automations from the database
Permissions: view_auto
*/
router.get("/api/autos", Auth.group, async (req, res) => {
    try {
        if (req.group.permissions.includes("view_auto")) {
            



            
        } else {
            throw new Error("You have incorrect permissions")
        }
    } catch (error) {
        res.status(400).send({error: true, data: error.message})
    }
})

/*
FETCH AUTOMATION BY ID
Fetches an automation by id
Permissions: view_auto
*/
router.get("/api/auto/:id", Auth.group, async (req, res) => {
    try {
        if (req.group.permissions.includes("view_auto")) {
            



            
        } else {
            throw new Error("You have incorrect permissions")
        }
    } catch (error) {
        res.status(400).send({error: true, data: error.message})
    }
})

/*
UPDATE AUTOMATION
Updates an automation
Permissions: update_auto
*/
router.patch("/api/auto", Auth.group, async (req, res) => {
    try {
        if (req.group.permissions.includes("update_auto")) {
            



            
        } else {
            throw new Error("You have incorrect permissions")
        }
    } catch (error) {
        res.status(400).send({error: true, data: error.message})
    }
})

module.exports = router;