/*
Misc Endpoints
*/
const express = require('express');
const router = new express.Router();

const Auth = require("../../middleware/auth");
const Resources = require("../../utils/resources");

/*
GET RESOURCE USAGE
Fetches resource usage
Permissions: authenticated
*/
router.get("/api/resources", Auth.user, async (req, res) => {
    try {
        Resources.fetchAll()
            .then(data => {
                res.status(200).send(data)
            }).catch(error => res.status(400).send({error: true, data: error.message}))
    } catch (error) {
        res.status(400).send({error: true, data: error.message})
    }
})

module.exports = router;