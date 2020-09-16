/*
    Begins webserver and configures express
*/
const express = require("express");
const app = express();
const Mongoose = require("mongoose");
const cookieParser = require("cookie-parser");

const Log = require("../utils/log");

const UserRouter = require("../routers/user");
const GroupRouter = require("../routers/group");
const BackupRouter = require("../routers/backup");
const FrontendRouter = require("../routers/frontend");
const Auth = require("../middleware/auth");
const path = require("path");

let connectionURI = process.argv[2];
let config = JSON.parse(process.argv[3]);

try {

    //Connect to mongodb
    Log.send("system", "Create MongoDB connection...");
    Mongoose.connect(connectionURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true
    }).then(() => {
        Log.send("system", "Connected to MongoDB");

        //Configure express
        app.use(express.json())
        //Catch parsing errors from above
        app.use((err, req, res, next) => {
            if (err instanceof SyntaxError && err.status >= 400 && err.status < 500 && err.message.indexOf('JSON') !== -1) {
                res.status(400).send({error: true, data: "Invalid JSON input"});
            } else { next() }
        })

        if (config.web.proxy) {
            app.set("trust_proxy", true);
            Log.send("system", "Set trust_proxy to true");
        }

        app.use('/assets', express.static('public/assets'))
        app.set("view engine", "hbs");
        app.set("views", path.join(__dirname, "../../templates"));
        app.use(cookieParser());

        //Register routers
        app.use(UserRouter);
        app.use(GroupRouter);
        app.use(BackupRouter);
        app.use(FrontendRouter);

        //Start
        app.listen(config.web.port, () => Log.send("system", "Webserver started", { colour: "FgGreen" }));


    }).catch(error => { throw new Error(`Failed to connect to MongoDB: ${error.message}`)});

} catch (error) {
    Log.send("system", `Webserver encountered an error: ${error.message}`, { error: true, colour: "FgRed"});
}
