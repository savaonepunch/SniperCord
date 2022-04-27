const path = require('path');
const express = require('express');
const socketio = require('socket.io')
const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users');

const PORT = process.env.PORT || 3000;
const app = express();
const botName = 'Server';

const timer = ms => new Promise(res => setTimeout(res, ms))

// Set static folder
app.use(express.static(path.join(__dirname, 'public')))

// Create server on specified port
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Initialise socket.io with specified server and enable CORS
const io = socketio(server, {
    cors: {
        origin: `http://localhost:${PORT}`,
        methods: ["GET", "POST"],
        credentials: true,
    },
});

// Run when a client connects
io.on('connection', (socket) => {
    console.log(`New WS connection with socket ID: ${socket.id}`);

    // Listen for room join
    socket.on('joinRoom', roomJoin);
    // Listen for client disconnects
    socket.on('disconnect', clientDisconnect);
    // Listen for chat message
    socket.on('chatMessage', chatMessage)

    function clientDisconnect() {
        const user = userLeave(socket.id);

        if (user) {
            console.log(user.username);
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat.`));

            // Send users and room info
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
        }
    }

    function chatMessage(data) {

        const user = getCurrentUser(socket.id);

        io.to(user.room).emit('message', formatMessage(`${user.username}`, data));
    }

    function roomJoin(data) {
        // Emit when a new client connects
        const user = userJoin(socket.id, data.username, data.room)

        socket.join(user.room);

        // Send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });

        socket.emit('message', formatMessage(botName, `Welcome, ${data.username}!`))
        socket.broadcast.to(data.room).emit('message', formatMessage(botName, `${data.username} has joined the chat!`))
    }
});

