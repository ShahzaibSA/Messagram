const path = require('path');
const http = require('http');
const express = require('express');
const socket = require('socket.io');
const { generateMessage, generateLocation } = require('./utils/messages');
const { addUser, getUser, getUsersInRoom, removeUser } = require('./utils/users');

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 5000;
const io = socket(server);

const publicDirectoryPath = path.join(__dirname, "../public");
app.use(express.static(publicDirectoryPath));


io.on('connection', (socket) => {

    socket.on("joinRoom", ({ username, room }, callback) => {

        const { error, user } = addUser({ id: socket.id, username, room });

        if (error) {
            return callback(error);
        }

        socket.join(user.room);

        // > Welcome Message
        socket.emit("welcomeMessage", generateMessage(`Welcome ${user.username}!`));

        //> Broadcasting New User Joined
        socket.broadcast.to(user.room).emit("userBroadcast", generateMessage(`${user.username} has joined.`));

        //> Get Users in Room
        io.to(user.room).emit("roomData", {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })


    //> Sending Message
    socket.on("sendMessage", (message, callback) => {
        const user = getUser(socket.id);
        io.to(user.room).emit("message", generateMessage(message, user.username));
        callback("Message successfully sent!");
    });

    //> Location Message
    socket.on("sendLocation", ({ latitude, longitude }, callback) => {
        const user = getUser(socket.id);
        io.to(user.room).emit("location", generateLocation(`https://google.com/maps?q=${latitude},${longitude}`, user.username));
        callback("Location successfully sent!");
    });

    //> User Left
    socket.on('disconnect', () => {
        const user = removeUser(socket.id);

        if (user) {
            io.to(user.room).emit("userBroadcast", generateMessage(`${user.username} left.`));
        }


    })
});

server.listen(port, () => {
    console.log("Server is Running on ", port);
})
