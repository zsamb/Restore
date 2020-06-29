const mongoose = require('mongoose');

const Backup = mongoose.model("Backup", {
    owner: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now()
    },
    notes: {
        type: [String],
        default: [],
    },
    sources: {
        type: [String],
        required: true
    },
    targets: {
        type: [String],
        required: true
    },
    size: {
        type: Number,
        required: true,
    },
    alias: {
        type: String,
        trim: true,
        default: ""
    }


})

module.exports = Backup;