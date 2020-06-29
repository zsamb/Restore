const mongoose = require("mongoose");

//Verify mongodb is ready to query
const isReady = () => {
    if (mongoose.connection.readyState == 1) { return true }
    else { return false }
}

module.exports = { isReady }