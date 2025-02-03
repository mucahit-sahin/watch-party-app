import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { roomManager } from './services/roomManager';
import { VideoState } from './types/types';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.NODE_ENV === 'production' 
            ? ['https://watch-party-app.vercel.app', 'http://localhost:3000']
            : "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? ['https://watch-party-app.vercel.app', 'http://localhost:3000']
        : "http://localhost:3000"
}));
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Map to store user-room associations
const userRoomMap = new Map<string, { roomId: string; userId: string }>();

// Socket.io events
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Create room
    socket.on('create_room', ({ username }, callback) => {
        const room = roomManager.createRoom(username);
        socket.join(room.id);
        // Save user information
        userRoomMap.set(socket.id, { roomId: room.id, userId: room.hostId });
        callback(room);
        console.log('Room created:', room);
    });

    // Join room
    socket.on('joinRoom', ({ roomId, username }, callback) => {
        const room = roomManager.getRoom(roomId);
        
        // Check if username already exists in the room
        if (room && room.users.some(user => user.username.toLowerCase() === username.toLowerCase())) {
            callback({ error: 'Username already exists in this room' });
            return;
        }

        const updatedRoom = roomManager.joinRoom(roomId, username);
        if (updatedRoom) {
            socket.join(roomId);
            // Save user information
            const joinedUser = updatedRoom.users[updatedRoom.users.length - 1];
            userRoomMap.set(socket.id, { roomId, userId: joinedUser.id });
            callback({ room: updatedRoom });
            io.to(roomId).emit('user_joined', updatedRoom);

            // Send system message about user joining
            io.to(roomId).emit('message_received', {
                id: Date.now().toString(),
                userId: '',
                username: 'System',
                content: `${username} joined the room`,
                messageType: 'system',
                timestamp: Date.now()
            });

            // Send current video URL and state to the new user
            if (updatedRoom.videoUrl) {
                socket.emit('video_url_updated', updatedRoom.videoUrl);
                socket.emit('video_state_updated', {
                    isPlaying: updatedRoom.isPlaying,
                    currentTime: updatedRoom.currentTime,
                    duration: 0,
                    buffered: 0
                });
            }
        } else {
            callback({ error: 'Room not found' });
        }
    });

    // Get room info
    socket.on('getRoomInfo', ({ roomId }, callback) => {
        const room = roomManager.getRoom(roomId);
        callback(room);
    });

    // Leave room
    socket.on('leave_room', ({ roomId, userId }) => {
        handleUserLeave(socket.id, roomId, userId);
    });

    // On disconnect
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        const userInfo = userRoomMap.get(socket.id);
        if (userInfo) {
            handleUserLeave(socket.id, userInfo.roomId, userInfo.userId);
        }
    });

    // Update video state
    socket.on('video_state_change', ({ roomId, videoState }: { roomId: string, videoState: VideoState }) => {
        roomManager.updateVideoState(roomId, videoState);
        socket.to(roomId).emit('video_state_updated', videoState);
        console.log('Video state updated:', { roomId, videoState });
    });

    // Update video URL
    socket.on('video_url_change', ({ roomId, url }) => {
        const room = roomManager.getRoom(roomId);
        if (room) {
            const user = room.users.find(u => u.id === userRoomMap.get(socket.id)?.userId);
            roomManager.updateVideoUrl(roomId, url);
            io.to(roomId).emit('video_url_updated', url);
            
            // Send system message about video URL change
            io.to(roomId).emit('message_received', {
                id: Date.now().toString(),
                userId: '',
                username: 'System',
                content: `${user?.username} added a new video`,
                messageType: 'system',
                timestamp: Date.now()
            });
            
            console.log('Video URL updated:', { roomId, url });
        }
    });

    // Send message
    socket.on('send_message', ({ roomId, message }) => {
        const messageWithTimestamp = {
            ...message,
            id: Math.random().toString(36).substr(2, 9),
            timestamp: Date.now()
        };
        io.to(roomId).emit('message_received', messageWithTimestamp);
        console.log('Message sent:', { roomId, message: messageWithTimestamp });
    });

    // Kick user event handler
    socket.on('kick_user', ({ roomId, userId }) => {
        const room = roomManager.getRoom(roomId);
        if (room) {
            // Remove user from room
            const kickedUser = room.users.find((u: { id: string }) => u.id === userId);
            if (kickedUser) {
                // Find socket info of kicked user
                const kickedSocketId = Array.from(userRoomMap.entries())
                    .find(([_, info]) => info.userId === userId)?.[0];

                if (kickedSocketId) {
                    // Send kicked event to the kicked user's socket
                    const kickedSocket = io.sockets.sockets.get(kickedSocketId);
                    if (kickedSocket) {
                        kickedSocket.emit('kicked');
                        kickedSocket.leave(roomId);
                    }

                    // Remove user from room
                    const updatedRoom = roomManager.leaveRoom(roomId, userId);
                    if (updatedRoom) {
                        // Send updated room info to other users
                        io.to(roomId).emit('user_left', updatedRoom);
                        
                        // Send system message
                        io.to(roomId).emit('message_received', {
                            id: Date.now().toString(),
                            userId: '',
                            username: 'System',
                            content: `${kickedUser.username} has been kicked from the room`,
                            messageType: 'system',
                            timestamp: Date.now()
                        });
                    }

                    // Remove user from user-room map
                    userRoomMap.delete(kickedSocketId);
                }
            }
        }
    });

    // Add this new event handler
    socket.on('updateUserTime', ({ roomId, userId, currentTime }) => {
        const room = roomManager.getRoom(roomId);
        if (room) {
            const updatedRoom = roomManager.updateUserTime(roomId, userId, currentTime);
            if (updatedRoom) {
                // Broadcast the time update to all users in the room
                io.to(roomId).emit('userTimeUpdate', { roomId, userId, currentTime });
            }
        }
    });
});

// Function to handle user leaving
function handleUserLeave(socketId: string, roomId: string, userId: string) {
    const room = roomManager.getRoom(roomId);
    if (room) {
        const leavingUser = room.users.find(u => u.id === userId);
        const updatedRoom = roomManager.leaveRoom(roomId, userId);
        userRoomMap.delete(socketId);

        if (updatedRoom) {
            io.to(roomId).emit('user_left', updatedRoom);
            
            // Send system message about user leaving
            io.to(roomId).emit('message_received', {
                id: Date.now().toString(),
                userId: '',
                username: 'System',
                content: `${leavingUser?.username} left the room`,
                messageType: 'system',
                timestamp: Date.now()
            });
        }
    }
}

// Start server
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 