const mongoose = require('mongoose');

const Config = require("../../../config.json");

const allowedSources = [""];
const allowedTargets = [];

const backupSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Types.ObjectId,
        required: [true, "A backup owner is required"]
    },
    notes: {
        type: [String],
        default: [],
    },
    sources: {
        type: [String],
        required: [true, "A backup source is required"],
        validate(sources) {
            if (sources.length < 1 || sources.length > Config.options.maximumSources) {
                throw new Error("You have too many/little sources")
            }
        }
    },
    targets: {
        type: [String],
        required: [true, "A backup target is required"],
        validate(targets) {
            //Limit to one target (v1)
            //if (targets.length != 1) { throw new Error("You have too many/little targets") }
            if (targets.length < 1 || targets.length > Config.options.maximumTargets) {
                throw new Error("You have too many/little targets")
            }
        }
    },
    size: {
        type: String,
        default: ""
    },
    alias: {
        type: String,
        trim: true,
        unique: true,
        sparse: true,
        validate(alias) {
            if (alias.length < 4) {
                throw new Error("Alias needs to be a minimum of 4 characters")
            }
        }
    },
    status: {
        type: String,
        trim: true,
        default: "Pending"
    }
}, {timestamps: true})

//Make uniqueness error messages understandable
backupSchema.post('save', function (error, doc, next) {
    if (error.name === 'MongoError' && error.code === 11000) {
        let indexIndex = error.message.indexOf("index:");
        let indexDup = error.message.indexOf("dup key");
        let errorKey = error.message.substring(indexIndex + 6, indexDup - 3).trim();
        next(new Error(`The ${errorKey} ${doc[errorKey]} is already in use.`));
    } else {
        next(error);
    }
});

const Backup = mongoose.model("Backup", backupSchema)
module.exports = Backup;