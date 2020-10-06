/*
Misc Endpoints
*/
const express = require('express');
const router = new express.Router();

const Auth = require("../../middleware/auth");
const Resources = require("../../utils/resources");
const Config = require("../../../config.json");

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

/*
  Returns the http variable from the config.
  Auth: none
*/
router.get("/api/httpEnabled", async (req, res) => {
    try {
        res.send({http: Config.options.http});
    } catch (error) {
        res.status(500).send({error: true, data: error.message});
    }
})

/*
SOCKET TEST
*/
router.get("/socket/test", (req, res) => {
    res.render("test.hbs")
})

module.exports = router;