/**
 * @module DiscordWebhook
 */

const https = require("https");

const acceptedStatusCodes = [200, 201, 202, 204]
const contenttype = "application/json"

/**
 * Handles sending data about the webhook to discord server
 * @function sendData
 * @param {string} url - Discord Webhook url (with token and id)
 * @param {string} method - HTTP Method e.g GET, POST, PATCH
 * @param {object} options - Check out {@link https://discord.com/developers/docs/resources/webhook#execute-webhook-jsonform-params|Discord Docs}
 */

const sendData = (url, method, options) => {
    return new Promise((resolve, reject) => {

        if (!(method instanceof String)) reject("Method argument is not a string!")

        if (options.embeds && options.embeds.length > 10) {
            reject(`Reached limit of embeds in webhook (${options.embeds}/10)`)
        }

        let postData = JSON.stringify(options);
        
        let req = https.request({url:url, method: method, headers: {"Content-Type": contenttype, "Content-Length": postData.length}}, (res) => {
    
            res.setEncoding("utf-8")
            
            if (!acceptedStatusCodes.includes(res.statusCode)) {
                reject(`Error: ${res.statusCode}, ${res.statusMessage}`)
            }
    
        });

        req.on("error", (e) => reject(`Problem with request: ${e.message}`))

        req.write(postData);
        req.end();

        resolve(postData);

    })
}

/**
 * Handles setting up the avatar and username.
 * @function setupWebhook
 * @param {string} url - Discord webhook url (with token and id)
 * @param {string} avatar - Data image of avatar
 * @param {string} username - Webhook username
 */

const setupWebhook = (url, avatar, username) => {
    return new Promise((resolve, reject) => {

        let postData = querystring.stringify({
            "name": username,
            "avatar": avatar
        })


        sendData(url, postData).then(resolve(postData)).catch((e) => reject(e))

    })
}

/**
 * @typedef {'error'|'success'|'warning'|'info'} Colours
 */

const colours = {
    error: 14165566,   // Red
    success: 1295876,  // Green
    warning: 14672927, // Yellow
    info: 4886754,     // Blue
};

/**
 * Handles setting up the embed for webhook.
 * @function createEmbed
 * @param {'error'|'success'|'warning'|'info'} type - Embed type, handles the colour of embed. {@link Colours}
 * @param {*} title - Embed title
 * @param {*} desc - Embed description
 * @param {*} fields - Embed Fields
 * @param {*} footer - Embed footer
 */

const createEmbed = (type, title, desc, fields, footer) => {
    return new Promise((resolve, reject) => {

        let embedTemplate = {
            embed: {
                title: "",
                description: "",
                color: 0,
                timestamp: Date.now(),
                footer: {
                    text: ``,
                },
                fields: [],
            },
        };

        //Colour
        switch (type) {
            case "error":
                embedTemplate.embed.color = colours.error;
                break;
            case "success":
                embedTemplate.embed.color = colours.success;
                break;
            case "warning":
                embedTemplate.embed.color = colours.warning;
                break;
            case "info":
                embedTemplate.embed.color = colours.info;
                break;
            default:
                reject("Invalid embed type.");
        }
        //Title
        if (typeof title == "string" && title.length < 256) {
            embedTemplate.embed.title = title;
        } else {
            reject("Title is invalid.");
        }
        //Desc
        if (typeof desc == "string" && desc.length < 2048) {
            embedTemplate.embed.description = desc;
        } else {
            reject("Description is invalid.");
        }
        //Footer
        if (typeof footer == "string" && footer.length < 2048) {
            embedTemplate.embed.footer.text = footer;
        } else {
            reject("Footer is invalid.");
        }

        if (fields.length > 25) reject(`Reached the limit of fields in an embed (${fields.length}/25)`)

        //Fields
        fields.forEach((field) => {
            if (field.name.length < 256) {
                if (field.value.length < 1024) {
                    embedTemplate.embed.fields.push(field);
                } else {
                    reject("A field has a value that is too large.");
                }
            } else {
                reject("A field has a name that is too large.");
            }
        });

        resolve(embedTemplate);
    });
};

modules.export = {
    sendData,
    createEmbed,
    setupWebhook
}