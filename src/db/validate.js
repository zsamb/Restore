/*

Validate MongoDB config file values

*/

//Validate
const checkConfig = (data) => {
    return new Promise((resolve, reject) => {
        let errors = new Array();

        if (typeof data.host != "string")     { errors.push("mongo.host is invalid type: should be string") };
        if (typeof data.port != "number")     { errors.push("mongo.port is invalid type: should be number") };
        if (typeof data.database != "string") { errors.push("mongo.database is invalid type: should be string") };
        if (typeof data.user != "string")     { errors.push("mongo.user is invalid type: should be string") };
        if (typeof data.password != "string") { errors.push("mongo.password is invalid type: should be string") };

        if (errors.length == 0) { resolve() }
        else { reject(errors) }
    })
}

module.exports = { checkConfig }