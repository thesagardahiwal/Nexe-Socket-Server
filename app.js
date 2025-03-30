const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT;
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ['GET', 'POST'],
    }
});

io.on('connection', (socket) => {
    console.log(`A user connected: ${socket.id}`);

    socket.on("send-message", (data) => {
        const { id, chat } = data;
        socket.broadcast.to(id).emit("receive-message", chat);
        const message = JSON.parse(chat);
        socket.broadcast.emit('new_message', {privateId: message?.recieverId?.privateId, chat: chat});
    });

    socket.on("join-room", (data) => {
        const { roomId } = data;
        socket.join(roomId);
        console.log(`User joined room: ${roomId}`);
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});


app.get('/', (req, res) => {
    res.status(200).json({ message: 'Socket.IO server is running' });
});



server.listen(PORT, () => {
    console.log("Server is listening on port 8000");
});

module.exports = io;