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

// Socket.io olayları
io.on('connection', (socket) => {
    console.log('Kullanıcı bağlandı:', socket.id);

    // Oda oluşturma
    socket.on('create_room', ({ username }, callback) => {
        const room = roomManager.createRoom(username);
        socket.join(room.id);
        callback(room);
        console.log('Oda oluşturuldu:', room);
    });

    // Odaya katılma
    socket.on('join_room', ({ roomId, username }, callback) => {
        const room = roomManager.joinRoom(roomId, username);
        if (room) {
            socket.join(roomId);
            callback(room);
            // Odadaki tüm kullanıcılara (host dahil) güncel oda bilgisini gönder
            io.to(roomId).emit('user_joined', room);
            console.log('Kullanıcı odaya katıldı:', { roomId, username, room });
        } else {
            callback(null);
            console.log('Oda bulunamadı:', roomId);
        }
    });

    // Odadan ayrılma
    socket.on('leave_room', ({ roomId, userId }) => {
        const room = roomManager.leaveRoom(roomId, userId);
        if (room) {
            // Odadaki tüm kullanıcılara güncel oda bilgisini gönder
            io.to(roomId).emit('user_left', room);
            console.log('Kullanıcı odadan ayrıldı:', { roomId, userId, room });
        }
        socket.leave(roomId);
    });

    // Video durumu güncelleme
    socket.on('video_state_change', ({ roomId, videoState }: { roomId: string, videoState: VideoState }) => {
        roomManager.updateVideoState(roomId, videoState);
        socket.to(roomId).emit('video_state_updated', videoState);
        console.log('Video durumu güncellendi:', { roomId, videoState });
    });

    // Video URL güncelleme
    socket.on('video_url_change', ({ roomId, url }) => {
        roomManager.updateVideoUrl(roomId, url);
        io.to(roomId).emit('video_url_updated', url);
        console.log('Video URL güncellendi:', { roomId, url });
    });

    // Mesaj gönderme
    socket.on('send_message', ({ roomId, message }) => {
        const messageWithTimestamp = {
            ...message,
            id: Math.random().toString(36).substr(2, 9),
            timestamp: Date.now()
        };
        io.to(roomId).emit('message_received', messageWithTimestamp);
        console.log('Mesaj gönderildi:', { roomId, message: messageWithTimestamp });
    });

    // Bağlantı koptuğunda
    socket.on('disconnect', () => {
        console.log('Kullanıcı ayrıldı:', socket.id);
    });
});

// Sunucuyu başlat
httpServer.listen(PORT, () => {
    console.log(`Server ${PORT} portunda çalışıyor`);
}); 