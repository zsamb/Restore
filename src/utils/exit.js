//Handle exit
const handle = (func) => {
    const signals = ["SIGINT", "SIGTERM"];
    signals.forEach(signal => { process.on(signal, () => func()) });
}

module.exports = { handle }