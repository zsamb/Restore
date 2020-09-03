/*
    Begins webserver and configures express
*/
const express = require("express");
const app = express();
const Mongoose = require("mongoose");

const Log = require("../utils/log");

const UserRouter = require("../routers/user");
const GroupRouter = require("../routers/group");
const BackupRouter = require("../routers/backup");
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
        if (config.web.proxy) {
            app.set("trust_proxy", true);
            Log.send("system", "Set trust_proxy to true");
        }

        app.use(express.static('../../public'))
        app.set("view engine", "hbs");
        app.set("views", path.join(__dirname, "../../templates"));
        
        //(Headers to allow API access for jacob) REMOVE IN PROD
        app.use(function(req, res, next) {
            res.header('Access-Control-Allow-Origin','*');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            next();
        });

        //Register routers
        app.use(UserRouter);
        app.use(GroupRouter);
        app.use(BackupRouter);

        app.get("/test", (req, res) => {
            res.render("test")
        })

        //Start
        app.listen(config.web.port, () => Log.send("system", "Webserver started", { colour: "FgGreen" }));


    }).catch(error => { throw new Error(`Failed to connect to MongoDB: ${error.message}`)});

} catch (error) {
    Log.send("system", `Webserver encountered an error: ${error.message}`, { error: true, colour: "FgRed"});
}
