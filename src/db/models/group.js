const mongoose = require('mongoose');

const groupPermissions = [
    "view_user",
    "create_user",
    "update_user",
    "delete_user",

    "view_backup",
    "create_backup",
    "delete_backup",
    "restore_backup",

    "create_group",
    "update_group",
    "delete_group",
    "view_group",

    "create_auto",
    "update_auto",
    "delete_auto",
    "view_auto"
]

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: [true, "A group name is required"],
        unique: true
    },
    permissions: {
        type: [String],
        required: [true, "Group permissions are required"],
        validate(perms) {
            if (perms.includes("*")) { perms = groupPermissions }
            if (!perms.length >= 1) { throw new Error("You need to provide permissions")}
            let invalidPerms = perms.filter(perm => {
                if (!groupPermissions.includes(perm)) { return true }
            })
            if (invalidPerms.length > 0) { throw new Error("Invalid permissions")}
        }
    }
}, { timestamps: true });

//If wildcard * is used change the permission array to all permissions
groupSchema.pre("save", async function (next) {
    if (this.permissions[0] == "*") { this.permissions = groupPermissions }
    next()
})

//Make uniqueness error messages understandable
groupSchema.post('save', function(error, doc, next) {
    if (error.name === 'MongoError' && error.code === 11000) {
      let indexIndex = error.message.indexOf("index:");
      let indexDup = error.message.indexOf("dup key");
      let errorKey = error.message.substring(indexIndex + 6, indexDup - 3).trim();
      next(new Error(`The ${errorKey} ${doc[errorKey]} is already in use.`));
    } else {
      next(error);
    }
});

const Group = mongoose.model("Group", groupSchema)
module.exports = Group;