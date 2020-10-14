/**
 * @module Exit
 */

/**
 * Handles process closure and runs specified callback
 * @param {Function} callback The callback that is executed on exit
 */
const handle = (callback) => {
    const signals = ["SIGINT", "SIGTERM", "SIGUSR2", "SIGUSR1"];
    signals.forEach(signal => {
        process.on(signal, () => callback())
    });
}

module.exports = {handle}