const express = require('express');
const User = require("../db/models/user");
const router = new express.Router();

const { isReady } = require("../db/mongo");

//GET > User by auth (requires auth)
router.get("/user", (req, res) => {
})
//GET > User by id (group with view_user permission)
router.get("/user:id", (req, res) => { 
    res.send("user get")
})
//POST > Create user (requires correct group with create_user)
router.post("/user", async (req, res) => {
    try {
        const user = new User(req.body);

        if (isReady()) { await user.save() }
        else { throw "Database is not available" }

        user.password = undefined;

        res.status(201).send({user});
    } catch (error) { 
        res.status(400).send({error: true, data: error})
    }
})


//POST > Login user (requires username and password)
router.post("/user/login", (req, res) => {})
//POST > Logout single session (requires auth)
router.post("/user/logout", (req, res) => {})
//POST > Logout all sessions (requires auth)
router.post("/user/logoutAll", (req, res) => {})
//PATCH > Update user (auth requires the account to do this or group with permission (update_user))
router.patch("/user/update", (req, res) => {})
//DELETE > Delete user (requires auth from group with delete_user)
router.delete("/user", (req, res) => {})

module.exports = router;