const mongoose = require('mongoose');
const { isEmail } = require('validator');
const { hash, compare } = require("bcrypt");
const jwt = require('jsonwebtoken');
const Group = require("./group");

const Config = require("../../../config.json");

const userSchema = new mongoose.Schema({

    username: {
        type: String,
        trim: true,
        required: [true, "A username is required"],
        unique: true
    },
    email: {
        type: String,
        lowercase: true,
        required: [true, "An email is required"],
        trim: true,
        unique: true,
        validate(value) {
            if (!isEmail(value)) {
                throw new Error("Invalid user email")
            }
        }
    },
    first_name: {
        type: String,
        trim: true,
        minlength: [2, "First name is too short"],
        maxlength: [32, "First name is too long"]
    },
    last_name: {
        type: String,
        trim: true,
        minlength: [2, "Last name is too short"],
        maxlength: [32, "Last name is too long"]
    },
    job_title: {
        type: String,
        trim: true,
        minlength: [3, "Job title is too short"],
        maxlength: [64, "Job title is too long"]
    },
    group: {
        type: String,
        trim: true,
        required: [true, "A group is required"]
    },
    password: {
        type: String,
        required: [true, "A password is required"],
        trim: true,
        minlength: [7, "Password is too short"]
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],

}, { timestamps: true });

//Hash passwords before they are saved
//Check group exists
userSchema.pre("save", async function(next) {
    if (this.isModified("password")) {
        this.password = await hash(this.password, 11)
    }
    if (this.isModified("group")) {
        let group = await Group.findOne({name: this.group});
        if (!group) {   throw new Error("That group does not exist") }
    }
    next()
})

//Make uniqueness error messages understandable
userSchema.post('save', function(error, doc, next) {
    if (error.name === 'MongoError' && error.code === 11000) {
      let indexIndex = error.message.indexOf("index:");
      let indexDup = error.message.indexOf("dup key");
      let errorKey = error.message.substring(indexIndex + 6, indexDup - 3).trim();
      next(new Error(`The ${errorKey} ${doc[errorKey]} is already in use.`));
    } else {
      next(error);
    }
});

//Generate auth token
userSchema.methods.newAuthToken = async function () {
    const token = jwt.sign({ _id: this._id.toString() }, Config.web.token_secret);
    this.tokens = this.tokens.concat({ token })

    await this.save()
    return token
}

//Remove sensitive information when retrieving user from database
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    delete user.tokens;
    return user;
}

//Fetch user with username and password
userSchema.statics.findWithCredentials = async (username, password) => {
    const user = await User.findOne({ username });
    if (!user) { throw new Error('Failed to login: Could not find user.') }

    //Check password matches
    const isMatch = await compare(password, user.password);
    if (!isMatch) { throw new Error('Failed to login: Invalid password.') }
    return user;
}

const User = mongoose.model("User", userSchema)
module.exports = User;