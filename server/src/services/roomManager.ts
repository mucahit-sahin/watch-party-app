import { Room, User, VideoState, RoomManager } from '../types/types';
import { v4 as uuidv4 } from 'uuid';

// Implementation of the RoomManager interface
export class RoomManagerImpl implements RoomManager {
    rooms: Map<string, Room>;

    constructor() {
        this.rooms = new Map();
    }

    createRoom(username: string): Room {
        const roomId = uuidv4();
        const userId = uuidv4();
        
        // Create initial user as host
        const user: User = {
            id: userId,
            username,
            isHost: true
        };

        // Initialize room with host user
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

        // Create new user
        const userId = uuidv4();
        const user: User = {
            id: userId,
            username,
            isHost: false
        };

        // Add user to room
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

        // Track users before and after removal
        console.log('Users before leaving:', room.users);
        room.users = room.users.filter(user => user.id !== userId);
        console.log('Users after leaving:', room.users);

        // Delete room if empty
        if (room.users.length === 0) {
            console.log('Room is empty, deleting:', roomId);
            this.rooms.delete(roomId);
            return null;
        }

        // Assign new host if the host left
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

        // Update video playback state
        room.isPlaying = videoState.isPlaying;
        room.currentTime = videoState.currentTime;
        console.log('Video state updated:', { roomId, videoState });
        this.rooms.set(roomId, room);
    }

    updateVideoUrl(roomId: string, url: string): void {
        const room = this.rooms.get(roomId);
        if (!room) return;

        // Reset video state with new URL
        room.videoUrl = url;
        room.currentTime = 0;
        room.isPlaying = false;
        console.log('Video URL updated:', { roomId, url });
        this.rooms.set(roomId, room);
    }

    // Add new method to update user's current time
    updateUserTime(roomId: string, userId: string, currentTime: number): Room | null {
        const room = this.rooms.get(roomId);
        if (!room) return null;

        const updatedUsers = room.users.map(user => 
            user.id === userId 
                ? { ...user, currentTime }
                : user
        );

        const updatedRoom = { ...room, users: updatedUsers };
        this.rooms.set(roomId, updatedRoom);
        return updatedRoom;
    }
}

export const roomManager = new RoomManagerImpl(); 