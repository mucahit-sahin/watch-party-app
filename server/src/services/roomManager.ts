import { Room, User, VideoState, RoomManager } from '../types/types';
import { v4 as uuidv4 } from 'uuid';

class RoomManagerImpl implements RoomManager {
    rooms: Map<string, Room>;

    constructor() {
        this.rooms = new Map();
    }

    createRoom(username: string): Room {
        const roomId = uuidv4();
        const userId = uuidv4();
        
        const user: User = {
            id: userId,
            username,
            isHost: true
        };

        const room: Room = {
            id: roomId,
            hostId: userId,
            users: [user],
            videoUrl: '',
            isPlaying: false,
            currentTime: 0
        };

        console.log('Creating room:', room);
        this.rooms.set(roomId, room);
        return room;
    }

    joinRoom(roomId: string, username: string): Room | null {
        const room = this.rooms.get(roomId);
        if (!room) {
            console.log('Room not found:', roomId);
            return null;
        }

        const userId = uuidv4();
        const user: User = {
            id: userId,
            username,
            isHost: false
        };

        room.users.push(user);
        console.log('User joined room:', { roomId, user });
        this.rooms.set(roomId, room);
        
        return room;
    }

    leaveRoom(roomId: string, userId: string): Room | null {
        const room = this.rooms.get(roomId);
        if (!room) {
            console.log('Room not found:', roomId);
            return null;
        }

        console.log('Before user leave:', room.users);
        room.users = room.users.filter(user => user.id !== userId);
        console.log('After user leave:', room.users);

        if (room.users.length === 0) {
            console.log('Room empty, deleting:', roomId);
            this.rooms.delete(roomId);
            return null;
        }

        // Eğer host ayrıldıysa, yeni host ata
        if (userId === room.hostId && room.users.length > 0) {
            room.hostId = room.users[0].id;
            room.users[0].isHost = true;
            console.log('New host assigned:', room.users[0]);
        }

        this.rooms.set(roomId, room);
        return room;
    }

    getRoom(roomId: string): Room | null {
        return this.rooms.get(roomId) || null;
    }

    updateVideoState(roomId: string, videoState: VideoState): void {
        const room = this.rooms.get(roomId);
        if (!room) return;

        room.isPlaying = videoState.isPlaying;
        room.currentTime = videoState.currentTime;
        console.log('Video state updated:', { roomId, videoState });
        this.rooms.set(roomId, room);
    }

    updateVideoUrl(roomId: string, url: string): void {
        const room = this.rooms.get(roomId);
        if (!room) return;

        room.videoUrl = url;
        room.currentTime = 0;
        room.isPlaying = false;
        console.log('Video URL updated:', { roomId, url });
        this.rooms.set(roomId, room);
    }
}

export const roomManager = new RoomManagerImpl(); 