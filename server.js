const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: { origin: "*" } // Allows Canva to connect safely
});

// Track all online snakes
let players = {};

io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);
    
    // Pick a random starting spot on a standard 40x40 grid
    players[socket.id] = {
        id: socket.id,
        x: Math.floor(Math.random() * 30) + 5,
        y: Math.floor(Math.random() * 30) + 5,
        color: `hsl(${Math.random() * 360}, 100%, 50%)`, // Give them a random neon color
        score: 0
    };

    // Send the current player list to the newcomer
    socket.emit('currentPlayers', players);
    
    // Broadcast the new player to everyone else
    socket.broadcast.emit('newPlayer', players[socket.id]);

    // Listen for movement or coordinate updates from Canva
    socket.on('playerUpdate', (movementData) => {
        if (players[socket.id]) {
            players[socket.id].x = movementData.x;
            players[socket.id].y = movementData.y;
            players[socket.id].score = movementData.score;
            
            // Broadcast the snake's new position to all other players
            socket.broadcast.emit('playerMoved', players[socket.id]);
        }
    });

    // Handle players leaving the lobby
    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Snake multiplayer server running on port ${PORT}`);
});
