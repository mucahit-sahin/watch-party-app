export interface User {
    id: string;
    username: string;
    isHost: boolean;
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