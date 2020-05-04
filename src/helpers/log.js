/*

Handles logging to terminal and file with specific select modes

*/
const fs = require("fs");

class Log {

    constructor() {

        let today = new Date()
        let fileDate = `${today.getFullYear()}-${today.getMonth() + 1}.log`
        this.systemStr = fs.createWriteStream(`./logs/system/${}`)

    }

    new() {

    }

}

module.exports = new Log();