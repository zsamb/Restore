/*

Math related utils

*/

class Maths {

    //Generate a base64 string of specified length
    generateID(length) {
        return new Promise((resolve, reject) => { 
            try {

                this.chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890-_";
                this.id = "";
                this.rNums = [];
                
                for (let i=0; i <= length; i++) { this.rNums.push(Math.round(Math.random() * 64)) }
                this.rNums.forEach((num) => { this.id += this.chars[num] })

                resolve(this.id)

            } catch (error) { reject(error.message) }
        })
    }

}

module.exports = Maths;
