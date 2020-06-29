const mongoose = require('mongoose');
const validator = require('validator');

const User = mongoose.model("User", {
    username: {
        type: String,
        trim: true,
        required: true
    },
    email: {
        type: String,
        lowercase: true,
        required: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("Invalid user email")
            }
        }
    },
    created: {
        type: Date,
        default: Date.now()
    },
    group: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 7
    }

})

module.exports = User;