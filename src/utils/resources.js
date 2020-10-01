/*
Resource Usage

Fetches resource usage
*/
const osu = require("node-os-utils");
const cpu = osu.cpu;
const mem = osu.mem;
const os  = osu.os;

const fetchCPU = () => {
    return new Promise((resolve, reject) => {
        cpu.usage(500)
            .then(cpuPercent => { resolve({cpuPercent, model: cpu.model().trim()})
            }).catch(error => reject(error))
    })
}

const fetchMem = () => {
    return new Promise((resolve, reject) => {
        mem.info()
            .then(info => { resolve(info)
            }).catch(error => reject(error))
    })
}

const fetchSys = () => {
    return new Promise((resolve, reject) => {
        resolve({uptime: os.uptime()})
    })
}

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

module.exports = { fetchCPU, fetchMem, fetchSys, fetchAll }