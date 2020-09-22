//Handle exit
const handle = (func) => {
    const signals = ["SIGINT", "SIGTERM", "SIGUSR2", "SIGUSR1"];
    signals.forEach(signal => { process.on(signal, () => func()) });
}

module.exports = { handle }