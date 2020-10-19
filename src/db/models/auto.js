const mongoose = require("mongoose");
const { isValidCron } = require('cron-validator');

const Config = require("../../../config.json");
 
const autoSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Types.ObjectId,
        required: [true, "An automation owner is required"]
    },
    notes: {
        type: [String],
        default: []
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
    state: {
        type: String,
        lowercase: true,
        default: "enabled",
        validate(state) {
            if (!(state.toLowerCase() === "enabled" || state.toLowerCase() === "disabled")) {
                throw new Error("State can only be enabled or disabled")
            }
        }
    },
    automationData: {
        scheduleString: {
            type: String,
            required: true, 
            validate(string) {
                if (!isValidCron(string)) {
                    throw new Error(`Invalid cron syntax: ${string}`)
                }
            }
        },
        recurring: {
            type: Boolean,
            required: [true, "Please specify if the automation is recurring"]
        },
        lastRun: {
            date: Date,
            errored: Boolean
        }
    },
    backupData: {
        notes: {
            type: [String],
            default: [],
        },
        sources: {
            type: [String],
            required: [true, "An automation backup source is required"],
            validate(sources) {
                if (sources.length < 1 || sources.length > Config.options.maximumSources) {
                    throw new Error("You have too many/little sources")
                }
            }
        },
        targets: {
            type: [String],
            required: [true, "An automation backup target is required"],
            validate(targets) {
                if (targets.length < 1 || targets.length > Config.options.maximumTargets) {
                    throw new Error("You have too many/little targets")
                }
            }
        }
    }

}, {timestamps: true})

//Make uniqueness error messages understandable
autoSchema.post('save', function (error, doc, next) {
    if (error.name === 'MongoError' && error.code === 11000) {
        let indexIndex = error.message.indexOf("index:");
        let indexDup = error.message.indexOf("dup key");
        let errorKey = error.message.substring(indexIndex + 6, indexDup - 3).trim();
        next(new Error(`The ${errorKey} ${doc[errorKey]} is already in use.`));
    } else {
        next(error);
    }
});

const Auto = mongoose.model("Auto", autoSchema);
module.exports = Auto;