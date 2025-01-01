import { io, Socket } from 'socket.io-client';
import { Room, VideoState, Message } from '../types/types';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Singleton class for managing socket connections
class SocketService {
    private static instance: SocketService;
    private socket: Socket | null = null;

    private constructor() {}

    static getInstance(): SocketService {
        if (!SocketService.instance) {
            SocketService.instance = new SocketService();
        }
        return SocketService.instance;
    }

    connect(): Socket {
        if (!this.socket) {
            this.socket = io(SOCKET_URL);
        }
        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            console.log('Disconnecting socket:', this.socket.id);
            this.socket.disconnect();
            this.socket = null;
        }
    }

    // Room operations
    createRoom(username: string, callback: (room: Room) => void) {
        const socket = this.connect();
        console.log('Creating room for user:', username);
        socket?.emit('create_room', { username }, (response: Room) => {
            console.log('Room created:', response);
            callback(response);
        });
    }

    joinRoom(roomId: string, username: string, callback: (room: Room | null) => void) {
        if (this.socket) {
            this.socket.emit('joinRoom', { roomId, username }, callback);
        } else {
            callback(null);
        }
    }

    getRoomInfo(roomId: string, callback: (room: Room | null) => void) {
        if (this.socket) {
            this.socket.emit('getRoomInfo', { roomId }, callback);
        } else {
            callback(null);
        }
    }

    leaveRoom(roomId: string, userId: string) {
        console.log('Leaving room:', roomId, 'userId:', userId);
        this.socket?.emit('leave_room', { roomId, userId });
    }

    // Video controls
    updateVideoState(roomId: string, videoState: VideoState) {
        console.log('Updating video state:', videoState);
        this.socket?.emit('video_state_change', { roomId, videoState });
    }

    onVideoStateChange(callback: (videoState: VideoState) => void) {
        this.socket?.on('video_state_updated', callback);
    }

    // Video URL management
    updateVideoUrl(roomId: string, url: string) {
        console.log('Updating video URL:', url);
        this.socket?.emit('video_url_change', { roomId, url });
    }

    onVideoUrlChange(callback: (url: string) => void) {
        this.socket?.on('video_url_updated', callback);
    }

    // Chat messages
    sendMessage(roomId: string, message: Omit<Message, 'id' | 'timestamp'>) {
        console.log('Sending message:', message);
        this.socket?.emit('send_message', { roomId, message });
    }

    onMessageReceived(callback: (message: Message) => void) {
        this.socket?.on('message_received', callback);
    }

    // User updates
    onUserJoined(callback: (room: Room) => void) {
        this.socket?.on('user_joined', (updatedRoom: Room) => {
            console.log('User joined:', updatedRoom);
            callback(updatedRoom);
        });
    }

    onUserLeft(callback: (room: Room) => void) {
        this.socket?.on('user_left', (updatedRoom: Room) => {
            console.log('User left:', updatedRoom);
            callback(updatedRoom);
        });
    }

    removeAllListeners() {
        if (this.socket) {
            console.log('Removing all listeners');
            this.socket.removeAllListeners();
        }
    }
}

export const socketService = SocketService.getInstance(); 