/*
    Webserver child process
*/
const express = require("express");
const app = express();

const { read } = require("../utils/config");
const { send } = require("../utils/log");

const APIRouter = require("../routers/user");

module.exports = (async (config) => {
    try {

        app.use(express.json())

        if (config.web.proxy) {
            app.set("trust_proxy", true);
            await send("system", "Set trust_proxy to true");
        }

        //Register routers
        app.use(APIRouter);

        //Start
        app.listen(config.web.port, () => send("system", "Webserver started", { colour: "FgGreen" }));

    } catch (error) {
        send("system", `Failed to start webserver: ${error.message}`, { colour: "FgRed" });
        process.exit(5);
    }
})
