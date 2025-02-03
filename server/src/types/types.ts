export interface User {
    id: string;
    username: string;
    isHost: boolean;
    currentTime?: number;
}

export interface Room {
    id: string;
    hostId: string;
    users: User[];
    videoUrl: string;
    isPlaying: boolean;
    currentTime: number;
}

export interface Message {
    id: string;
    userId: string;
    username: string;
    content: string;
    timestamp: number;
}

export interface VideoState {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    buffered: number;
}

export interface RoomManager {
    rooms: Map<string, Room>;
    createRoom: (username: string) => Room;
    joinRoom: (roomId: string, username: string) => Room | null;
    leaveRoom: (roomId: string, userId: string) => Room | null;
    getRoom: (roomId: string) => Room | null;
    updateVideoState: (roomId: string, videoState: VideoState) => void;
    updateVideoUrl: (roomId: string, url: string) => void;
    updateUserTime: (roomId: string, userId: string, currentTime: number) => Room | null;
} 