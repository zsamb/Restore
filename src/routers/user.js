/*
User Endpoints

Interface for managing users
*/
const express = require('express');
const User = require("../db/models/user");
const router = new express.Router();
const mongoose = require("mongoose");
const multer = require('multer');
const sharp = require('sharp');

const Auth = require("../middleware/auth");
const config = require("../../config.json");

/*
FETCH USERS
Fetches all users from the database
Permissions: view_user
*/
router.get("/api/users", Auth.group, async (req, res) => {
    try {
        if (req.group.permissions.includes("view_user")) {
            let users = await User.find({});
            res.status(200).send(users);
        } else { throw new Error("You have incorrect permissions") }
    } catch (error) {
        res.status(400).send({error: true, data: error.message})
    }
})
/*
FETCH USER BY ID
Fetches user by its id
Permissions: view_user
*/
router.get("/api/user/get/:id", Auth.group, async (req, res) => { 
    try {
        if (req.group.permissions.includes("view_user")) {
            let user = await User.findById(req.params.id);
            if (!user) { throw new Error("Could not find that user")}
            else { res.status(200).send({user}) }
        } else { throw new Error("You have incorrect permissions") }
    } catch (error) {
        res.status(400).send({error: true, data: error.message})
    }
})
/*
CREATE USER
Create new user
Permissions: create_user
*/
router.post("/api/user", Auth.group ,async (req, res) => {
    try {
        if (req.group.permissions.includes("create_user")) { 
            const user = new User(req.body);
            await user.save();
            const token = await user.newAuthToken();
            res.status(201).send({user, token});
        } else { throw new Error("You have incorrect permissions") }
    } catch (error) { 
        res.status(400).send({error: true, data: error.message})
    }
})
/*
GET LOGGED IN USER
Fetches user by the token used to make the request
Permissions: authentication token
*/
router.get("/api/user/me", Auth.user, (req, res) => {
    res.status(200).send(req.user);
})
/*
LOGIN USER
Provides authentication token if successful
Permissions: username and password
*/
router.post("/api/user/login", Auth.none, async (req, res) => {
    try {
        if (!req.body.username) { throw new Error("Please provide a username") }
        if (!req.body.password) { throw new Error("Please provide a password") }

        const user = await User.findWithCredentials(req.body.username, req.body.password);

        const token = await user.newAuthToken();
        res.status(200).send({ user, token });
    } catch (error) {
        res.status(400).send({error: true, data: error.message});
    }
})
/*
LOGOUT USER
Only removes the token used to authenticate this request
Permissions: authentication token
*/
router.post("/api/user/logout", Auth.user, async (req, res) => {
    try {
        //Recreate array with tokens that werent in the request
        req.user.tokens = req.user.tokens.filter((token) => {  return token.token != req.token });
        await req.user.save();

        res.status(200).send();
    } catch (error) {
        res.status(500).send({error: true, data: error.message});
    }
})
/*
LOGOUT ALL 
Removes all tokens from the user (logging out everywhere)
Permissions: authentication token
*/
router.post("/api/user/logoutAll", Auth.user, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();

        res.status(200).send();
    } catch (error) {
        res.status(500).send({error: true, data: error.message});
    }
})
/*
UPDATE USER
Updates a users information
Permissions: update_user
*/
router.patch("/api/user/update/:id", Auth.group, async (req, res) => {
    try {
        if (req.group.permissions.includes("update_user")) {
            let user = await User.findById(req.params.id);
            if (!user) { throw new Error("Could not find that user") }
            else {
                
                //Check all updates are valid
                const updates = Object.keys(req.body);
                if (updates.length < 1) { throw new Error("No updates were sent") }

                const validUpdates = ["username", "email", "password", "group", "first_name", "last_name", "job_title"];
                const validRequest = updates.every(update => validUpdates.includes(update));

                if (!validRequest) { throw new Error(`Invalid update`)};
                //Update user
                const user = await User.findById(req.params.id);
                if (!user) { throw new Error("Could not find that user") }
                else {
                    updates.forEach(update => user[update] = req.body[update]);
                    await user.save();
                    res.status(200).send(user);
                }
            }

        } else { throw new Error("You have incorrect permissions") }
    } catch (error) {
        res.status(400).send({error: true, data: error.message});
    }
})
/*
UPDATE LOGGED IN USER
Updates the authenticated users info
Permissions: authenticated
*/
router.patch("/api/user/me/update", Auth.user, async (req, res) => {
    try {
            
        //Check all updates are valid
        const updates = Object.keys(req.body);
        if (updates.length < 1) { throw new Error("No updates were sent") }

        const validUpdates = ["username", "email", "password", "group"];
        const validRequest = validUpdates.every(update => validUpdates.includes(update));
        if (!validRequest) { throw new Error("Invalid updates")};
        //Update user
        updates.forEach(update => req.user[update] = req.body[update]);
        await req.user.save();
        res.status(200).send(req.user);

    } catch (error) {
        res.status(400).send({error: true, data: error.message});
    }
})
/*
DELETE USERS
Deletes a user from the database
Permissions: delete_user
*/
router.delete("/api/user/:id", Auth.group, async (req, res) => {
    try {
        if (req.group.permissions.includes("delete_user")) {
            const user = await User.findById(req.params.id);
            if (!user) { throw new Error("Could not find that user") }
            else {
                await user.remove();
                res.status(200).send();
            }
        } else { throw new Error("You have incorrect permissions")}
    } catch (error) {
        res.status(400).send({error: true, data: error.message});
    }
})

//File upload config
const upload = multer({
    limits: {
        //Transfer the megabytes in config to bytes
        fileSize: config.options.fileUploadLimit * 1000000
    },
    fileFilter(req, file, callback) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return callback(new Error("Please upload an image"));
        }
        callback(undefined, true);
    }  
})

/*
UPLOAD PROFILE PICTURE
Uploads a profile pic to the user who is logged in
Permissions: authenticated
*/
router.post("/api/user/me/picture", Auth.user, upload.single("picture"), async (req, res) => {
    if (req.file == undefined) { res.status(400).send({error: true, data: "Please upload an image"})}
    else {
        const picBuffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();
        req.user.picture = picBuffer;
        await req.user.save();
        
        res.status(200).send();
    }
}, (error, req, res, next) => {
    res.status(400).send({ error: true, data: error.message });
})

/*
DELETE PROFILE PICTURE
Deletes the logged in users profile pic
Permissions: authenticated
*/
router.delete("/api/user/me/picture", Auth.user, async (req, res) => {
    req.user.picture = undefined;
    await req.user.save();
    res.status(200).send();
})

/*
GET PROFILE PICTURE
Gets the logged in users profile pic
Permissions: authenticated
*/
router.get("/api/user/me/picture", Auth.user, async (req, res) => {
    try {
        if (!req.user.picture) { throw new Error() }
        res.set("Content-Type", "image/png");
        res.send(req.user.picture);
    } catch (error) {
        res.status(400).send(error.message);
    }
})

/*
GET PROFILE PICTURE BY ID
Gets the profile picture of a user
Permissions: view_user
*/
router.get("/api/user/picture/:id", Auth.group, async (req, res) => {
    try {
        if (req.group.permissions.includes("view_user")) {
            let user = await User.findById(req.params.id);
            if (!user) { throw new Error("Could not find that user") }
            else {
                res.set("Content-Type", "image/png");
                res.status(200).send(user.picture);
            }
        } else { throw new Error("You have incorrect permissions") }
    } catch (error) {
        res.status(400).send({error: true, data: error.message});
    }
})

module.exports = router;