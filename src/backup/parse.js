/*
    Fetches all of the specified type actions, reads their requirements to provide a useful interface when creating a backup
*/
const fs = require("fs");
const path = require("path");

//Parse function (type: "sources", "targets")
const parse = (urlType) => {
    return new Promise((resolve, reject) => {

        if (urlType == "sources" || urlType == "targets") {
            //Get all actions of the type
            fs.promises.readdir(path.join(__dirname + `/${urlType}`))
            .then(files => {
                let actions = {};
                files.forEach(action => {
                    let urlName = action.split(".")[0];
                    actions[urlName] = require(`./${urlType}/${urlName}.js`);
                })

                resolve(actions)

            })
            .catch(error => reject(`Failed to fetch ${urlType} actions: ${error.message}`))
        } else { reject(`Invalid URL type ${urlType}`) }

    })
}

//Synchronous parse function
const parseSync = (urlType) => {
    if (urlType == "sources" || urlType == "targets") {
        //Get all actions of the type
        try {
            let files = fs.readdirSync(path.join(__dirname + `/${urlType}`));
            let actions = {};
            files.forEach(action => {
                let urlName = action.split(".")[0];
                actions[urlName] = require(`./${urlType}/${urlName}.js`);
            })
            return actions;
        } catch (error) { throw new Error(`Failed to fetch ${urlType} actions: ${error.message}`) }
    } else { throw new Error(`Invalid URL type ${urlType}`) }
}

//Validates urls against ones that exist, checking their requirements ect
const validateUrls = (urls, actions) => {
    return new Promise((resolve, reject) => {
        if (urls instanceof Array) {
            let loop = new Promise((resolve, reject) => {
                urls.forEach(async url => {
                    //Parse the url
                    if (typeof url != "undefined" && !url.length < 1 && url.includes(":")) {
                        let name = url.split(":")[0];
                        let args = url.split(":");
                        args.splice(0, 1)
    
                        if (actions.hasOwnProperty(name)) {
                            if (typeof args != "undefined" && args.length == actions[name].requirements.length) {
                                //Verify
                                let action = new actions[name][name](args);
                                try {
                                     await action.verify();
                                     resolve()
                                } catch (error) { reject(error) }
    
                            } else { reject(`Too many/too little arguments for action: ${name}`) }
                        } else { reject(`Action type not found: ${name}`) }
                    } else { reject("URL is too short/has invalid format") }
                })
            })
            loop.then(() => resolve()).catch(error => reject(error))
        } else { reject("Passed urls are not an array") }
    })
} 

//Synchronous validate urls function
const validateUrlsSync = (urls, actions) => {
    if (urls instanceof Array) {
        urls.forEach(url => {
            //Parse urls
            if (typeof url != "undefined" && !url.length < 1 && url.includes(":")) {
                let name = url.split(":")[0];
                let args = url.split(":");
                args.splice(0, 1);

                if (actions.hasOwnProperty(name)) {
                    if (typeof args != "undefined" && args.length == actions[name].requirements.length) {
                        //Verify
                        try {
                            let action = new actions[name][name](args);
                            action.verifySync();
                        } catch (error) { throw new Error(`Failed to verify URL: ${error.message}`)}
                    } else { throw new Error(`Too many/too little arguments for action: ${name}`) }
                } else { throw new Error(`Action type not found: ${name}`) }
            } else { throw new Error(`URL is too short/has invalid format`) }
        })
    }
}


module.exports = { parse, parseSync, validateUrls, validateUrlsSync }