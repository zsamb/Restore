/*

SQL interface

*/
const { createConnection, createPool } = require("mysql");
const { read } = require("./config");

//Check tables are created/create them otherwise
const sync = () => {
    return new Promise(async (resolve, reject) => {

        try {

            const config = await read();
            delete config.config.pool;
        
            let connection = createConnection(config.config.sql);

            connection.query("CREATE TABLE IF NOT EXISTS `backups` ( `name` VARCHAR(255) NOT NULL, `type` VARCHAR(2) NOT NULL, `source` TINYTEXT NOT NULL, `target` TINYTEXT NOT NULL, `category` VARCHAR(255) NOT NULL, `id` VARCHAR(16) NOT NULL, `created` TIMESTAMP NOT NULL, `owner` VARCHAR(255) NOT NULL );", 
            (error, results, fields) => {
                if (error) { reject(error.message) }
                else {
                    connection.end();
                    resolve();
                }
            })

        } catch (error) { reject(error.message) }

    })
}

module.exports = { sync }