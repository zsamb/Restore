const mongoose = require('mongoose');
const { isEmail } = require('validator');
const { hash } = require("bcrypt");

const userSchema = new mongoose.Schema({

    username: {
        type: String,
        trim: true,
        required: true
    },
    email: {
        type: String,
        lowercase: true,
        required: true,
        trim: true,
        validate(value) {
            if (!isEmail(value)) {
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

});

//Hash passwords before they are saved
userSchema.pre("save", async function(next) {
    if (this.isModified("password")) {
        this.password = await hash(this.password, 11)
    }
    next()
})

const User = mongoose.model("User", userSchema)

module.exports = User;