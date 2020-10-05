//Create backup socket event

module.exports = (socket, data) => {
    const user = data.user;
    const group = data.group;
    if (group.permissions.includes("create_backup")) {
        socket.emit("Update", "gg")
    } else { socket.emit("Error", "You have invalid permissions") }
}