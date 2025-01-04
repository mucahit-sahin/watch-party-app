# Watch Party App 🎥

Watch Party is a real-time video synchronization application that allows users to watch videos together. All viewers in the room see the same video content at the same time, with synchronized playback controls managed by the host.

## 🚀 Screenshots

### Home Page

![Home Page](screenshots/home.png)
_Create a new room or join an existing one with a username_

### Watch Room

![Watch Room](screenshots/room.png)
_Watch videos together with synchronized controls, real-time chat, and participant management_

## 🚀 Features

- ✨ Real-time video synchronization
  - Play/Pause synchronization
  - Seek position synchronization
  - Playback speed synchronization
  - Video URL synchronization
- 👥 Room Management
  - Create/Join rooms with unique codes
  - Host privileges for video control
  - Participant management (kick users)
  - Unique username requirement per room
- 💬 Real-time Chat
  - Instant messaging between room participants
  - System messages for room events
  - User join/leave notifications
- 🎮 Video Controls
  - Full-screen support
  - Volume control
  - Playback speed control (0.25x to 2x)
  - Progress bar with time display
  - Loading indicator
- 📱 Responsive Design
  - Mobile-friendly interface
  - Adaptive layout for different screen sizes
  - Touch-friendly controls

## 🛠️ Technologies

### Frontend

- React.js with TypeScript
- Material-UI (MUI) for UI components
- Socket.IO Client for real-time communication
- React Player for video playback

### Backend

- Node.js with TypeScript
- Express.js for API server
- Socket.IO for WebSocket connections
- Room management system

## 🚦 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository

```bash
git clone https://github.com/mucahit-sahin/watch-party-app.git
cd watch-party-app
```

2. Install dependencies for both client and server

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

3. Start the development servers

```bash
# Start server (in server directory)
npm run dev

# Start client (in client directory)
npm start
```

4. Open `http://localhost:3000` in your browser

## 📝 Usage

1. Visit the home page
2. Enter your username and either:
   - Create a new room (automatically become host)
   - Join an existing room (enter room code)
3. If you're the host:
   - Paste a video URL to start watching
   - Control video playback (play/pause/seek)
   - Manage participants (kick users if needed)
4. All participants can:
   - Chat with others in the room
   - See who's in the room
   - Adjust their local volume
   - View in full screen

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Contact

- **GitHub:** [@mucahit-sahin](https://github.com/mucahit-sahin)
- **Project Repository:** [watch-party-app](https://github.com/mucahit-sahin/watch-party-app)

<div align="center">
  <a href="https://github.com/mucahit-sahin">
    <img src="https://img.shields.io/github/followers/mucahit-sahin?label=Follow&style=social" alt="GitHub followers"/>
  </a>
  <a href="https://github.com/mucahit-sahin/watch-party-app">
    <img src="https://img.shields.io/github/stars/mucahit-sahin/watch-party-app?style=social" alt="GitHub stars"/>
  </a>
</div>
