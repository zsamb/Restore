/*
    Begins webserver and configures express
*/
const express = require("express");
const app = express();
const Mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const http = require("http");
const path = require("path");

const Log = require("../utils/log");

const UserRouter = require("../routers/user");
const GroupRouter = require("../routers/group");
const BackupRouter = require("../routers/backup");
const FrontendRouter = require("../routers/frontend");

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

        //Configure express to use JSON, handle parsing errors
        app.use(express.json())
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
        const httpServer = http.createServer(app);

        let errored = false;
        let retries = 1;

        httpServer.on("error", (error) => {
            if (errored) {
                Log.send("system", `Failed to start webserver: ${error.message}`, { error: true, colour: "FgRed"});
                process.exit();
            } else if (error.code == "EADDRINUSE") {
                if (retries == 3) { errored = true } else { retries++ }
                Log.send("system", `Port ${config.web.port} is already in use, retrying in 5s..`, { error: true, colour: "FgRed"});
                setTimeout(() => {
                    httpServer.listen(config.web.port, () => Log.send("system", "Webserver started", { colour: "FgGreen" }) )
                }, 5000);
            } else { 
                Log.send("system", `Failed to start webserver: ${error.message}`, { error: true, colour: "FgRed"});
                process.exit();
            }
        })

        httpServer.listen(config.web.port, () => Log.send("system", "Webserver started", { colour: "FgGreen" }) );

        //Close the webserver before exit and managed all possible exits
        const exitCode = () => {
            if (httpServer) { 
                Log.send("system", "Closing webserver...");
                httpServer.close(() => { process.exit() });
                setTimeout(() => { process.exit()}, 2000).unref();      //Force close after 2s
            }
        }

        process.on("SIGINT", () => { exitCode() });
        process.on("SIGTERM",() => { exitCode() });
        process.on("uncaughtException", (error) => { 
            Log.send("system", `Web server closed due to an error: ${error.message}`, {error: true, colour: "FgRed"});
            exitCode();  
        });

    }).catch(error => { throw new Error(`Failed to connect to MongoDB: ${error.message}`)});
} catch (error) {
    Log.send("system", `Webserver encountered an error: ${error.message}`, { error: true, colour: "FgRed"});
}
