/**
 * @module Resources
 */
const osu = require("node-os-utils");
const cpu = osu.cpu;
const mem = osu.mem;
const os = osu.os;

/**
 * Fetch CPU information
 * @returns {Object} Returns CPU information, model and usage percent.
*/
const fetchCPU = () => {
    return new Promise((resolve, reject) => {
        cpu.usage(500)
            .then(cpuPercent => {
                resolve({cpuPercent, model: cpu.model().trim()})
            }).catch(error => reject(error))
    })
}

/**
 * Fetch Memory Information
 * @returns {Object} Returns total, used and free memory in megabytes. Also returns free memory percent
*/
const fetchMem = () => {
    return new Promise((resolve, reject) => {
        mem.info()
            .then(info => {
                resolve(info)
            }).catch(error => reject(error))
    })
}

/**
 * Fetch system information
 * @returns {Object} Returns system uptime in seconds
*/
const fetchSys = () => {
    return new Promise((resolve, reject) => {
        resolve({uptime: os.uptime()})
    })
}

/**
 * Fetch all resource information
 * @returns {Object} Returns CPU, memory and system information
*/
const fetchAll = () => {
    return new Promise((resolve, reject) => {
        let cpuData;
        let memData;
        let sysData;
        fetchCPU()
            .then(data => {
                cpuData = data;
                return fetchMem()
            })
            .then(data => {
                memData = data;
                return fetchSys()
            })
            .then(data => {
                sysData = data;
                resolve({cpuData, memData, sysData})
            }).catch(error => reject(error))
    })
}

module.exports = {fetchCPU, fetchMem, fetchSys, fetchAll}