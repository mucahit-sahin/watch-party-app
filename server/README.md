# Watch Party Backend Server

A real-time backend server for the Watch Party application that enables synchronized video watching and chat functionality.

## Features

- Real-time room management
- Video synchronization between users
- Live chat functionality
- User presence tracking
- Host controls for video playback

## Technologies Used

- Node.js
- Express.js
- Socket.IO
- TypeScript

## Installation

1. Clone the repository
2. Navigate to the server directory:
```bash
cd server
```
3. Install dependencies:
```bash
npm install
```
4. Start the development server:
```bash
npm run dev
```

The server will start on port 3001 by default.

## Socket.IO Events

### Room Events
- `createRoom`: Create a new watch party room
- `joinRoom`: Join an existing room
- `leaveRoom`: Leave the current room
- `updateVideoUrl`: Update the video URL (host only)
- `updateVideoState`: Sync video playback state
- `disconnect`: Handle user disconnection

### Chat Events
- `sendMessage`: Send a chat message
- `receiveMessage`: Receive chat messages

## Type Definitions

### User
```typescript
interface User {
    id: string;
    username: string;
    isHost: boolean;
}
```

### Room
```typescript
interface Room {
    id: string;
    users: User[];
    videoUrl: string | null;
    videoState: VideoState;
}
```

### VideoState
```typescript
interface VideoState {
    isPlaying: boolean;
    currentTime: number;
    timestamp: number;
}
```

### Message
```typescript
interface Message {
    id: string;
    userId: string;
    username: string;
    content: string;
    timestamp: number;
}
```

## Environment Variables

- `PORT`: Server port (default: 3001)
- `CLIENT_URL`: Frontend application URL for CORS

## License

This project is licensed under the MIT License. 