# Watch Party Frontend

A React-based frontend application for synchronized video watching with friends. Watch videos together in real-time while chatting with your friends.

## Features

- Create and join watch party rooms
- Real-time video synchronization
- Live chat with room participants
- Host controls for video playback
- Responsive design for all devices
- User presence tracking

## Technologies Used

- React
- TypeScript
- Material-UI (MUI)
- Socket.IO Client
- React Player

## Installation

1. Clone the repository
2. Navigate to the client directory:
```bash
cd client
```
3. Install dependencies:
```bash
npm install
```
4. Start the development server:
```bash
npm start
```

The application will start on port 3000 by default.

## Available Scripts

- `npm start`: Run the development server
- `npm build`: Build for production
- `npm test`: Run tests
- `npm run eject`: Eject from Create React App

## Project Structure

```
src/
├── components/      # Reusable UI components
├── pages/          # Page components
├── services/       # API and socket services
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
└── App.tsx         # Root component
```

## Environment Variables

Create a `.env` file in the root directory:

```env
REACT_APP_SERVER_URL=http://localhost:3001
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.
