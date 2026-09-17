const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: { origin: "*" } // Allows Canva to connect safely
});

// Track all online snakes
let players = {};

// Helper function to calculate the top players
function getLeaderboard() {
    return Object.values(players)
        .sort((a, b) => b.score - a.score) // Sort highest to lowest
        .slice(0, 5) // Get top 5 players
        .map(p => ({ id: p.id, score: p.score, color: p.color }));
}

io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);
    
    // Pick a random starting spot
    players[socket.id] = {
        id: socket.id,
        x: Math.floor(Math.random() * 30) + 5,
        y: Math.floor(Math.random() * 30) + 5,
        color: `hsl(${Math.random() * 360}, 100%, 50%)`, // Random neon color
        score: 0
    };

    // Send data to the newcomer
    socket.emit('currentPlayers', players);
    io.emit('leaderboardUpdate', getLeaderboard()); // Send fresh leaderboard
    
    // Broadcast the new player to everyone else
    socket.broadcast.emit('newPlayer', players[socket.id]);

    // Listen for coordinate or score changes
    socket.on('playerUpdate', (movementData) => {
        if (players[socket.id]) {
            players[socket.id].x = movementData.x;
            players[socket.id].y = movementData.y;
            
            // Check if score changed
            if (players[socket.id].score !== movementData.score) {
                players[socket.id].score = movementData.score;
                // Broadcast updated leaderboard to everyone since scores changed
                io.emit('leaderboardUpdate', getLeaderboard());
            }
            
            // Broadcast the snake's new position
            socket.broadcast.emit('playerMoved', players[socket.id]);
        }
    });

    // Handle players leaving
    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
        io.emit('leaderboardUpdate', getLeaderboard()); // Update leaderboard
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Snake server running with server-side leaderboard on port ${PORT}`);
});
