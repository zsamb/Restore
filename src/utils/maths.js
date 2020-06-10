/*

Math related utils

*/

//Generate a base64 string of specified length
const generateID = (length) => {
    return new Promise((resolve, reject) => { 
        try {

            let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890-_";
            let id = new String();
            let rNums = new Array();
                
            for (let i=0; i <= length; i++) { rNums.push(Math.round(Math.random() * 64)) }
            rNums.forEach((num) => { id += chars[num] })

            resolve(id)

        } catch (error) { reject(error.message) }
    })
}

module.exports = { generateID }
