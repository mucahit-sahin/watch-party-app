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
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
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
        const room = roomManager.joinRoom(roomId, username);
        if (room) {
            socket.join(roomId);
            // Save user information
            const joinedUser = room.users[room.users.length - 1];
            userRoomMap.set(socket.id, { roomId, userId: joinedUser.id });
            callback(room);
            io.to(roomId).emit('user_joined', room);

            // Send system message about user joining
            io.to(roomId).emit('message_received', {
                id: Date.now().toString(),
                userId: '',
                username: 'System',
                content: `${username} odaya katıldı`,
                messageType: 'system',
                timestamp: Date.now()
            });

            // Send current video URL and state to the new user
            if (room.videoUrl) {
                socket.emit('video_url_updated', room.videoUrl);
                socket.emit('video_state_updated', {
                    isPlaying: room.isPlaying,
                    currentTime: room.currentTime,
                    duration: 0,
                    buffered: 0
                });
            }
        } else {
            callback(null);
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
        roomManager.updateVideoUrl(roomId, url);
        io.to(roomId).emit('video_url_updated', url);
        console.log('Video URL updated:', { roomId, url });
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
                content: `${leavingUser?.username} odadan ayrıldı`,
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