import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Container, 
    Box, 
    Typography, 
    TextField, 
    Button, 
    Paper,
    Divider,
    IconButton
} from '@mui/material';
import { socketService } from '../services/socketService';
import { GitHub } from '@mui/icons-material';

export const Home: React.FC = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [roomId, setRoomId] = useState('');
    const [error, setError] = useState('');

    const handleCreateRoom = () => {
        if (!username.trim()) {
            setError('Please enter a username');
            return;
        }

        socketService.createRoom(username, (response) => {
            if (response.error) {
                setError(response.error);
                return;
            }

            if (response.room) {
                console.log('Room created:', response.room);
                navigate(`/room/${response.room.id}`, { state: { room: response.room } });
            } else {
                console.error('Room creation failed');
                setError('An error occurred while creating the room');
            }
        });
    };

    const handleJoinRoom = () => {
        if (!username.trim() || !roomId.trim()) {
            setError('Please enter both username and room ID');
            return;
        }

        socketService.joinRoom(roomId, username, (response) => {
            if (response.error) {
                console.error('Room join failed:', response.error);
                setError(response.error);
                return;
            }

            if (response.room) {
                console.log('Joined room:', response.room);
                navigate(`/room/${response.room.id}`, { state: { room: response.room } });
            } else {
                console.error('Room join failed');
                setError('An error occurred while joining the room');
            }
        });
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
                    <Typography component="h1" variant="h4" align="center" gutterBottom>
                        Watch Party
                    </Typography>
                    
                    <Typography variant="body1" align="center" color="text.secondary" paragraph>
                        Watch videos together with your friends
                    </Typography>

                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 3 }}>
                        <IconButton
                            href="https://github.com/mucahit-sahin"
                            target="_blank"
                            rel="noopener noreferrer"
                            color="inherit"
                            sx={{ '&:hover': { color: 'primary.main' } }}
                        >
                            <GitHub />
                        </IconButton>
                        <Typography
                            component="a"
                            href="https://github.com/mucahit-sahin"
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                                textDecoration: 'none',
                                color: 'text.secondary',
                                '&:hover': { color: 'primary.main' },
                                ml: 1
                            }}
                        >
                            @mucahit-sahin
                        </Typography>
                    </Box>

                    <Box component="form" sx={{ mt: 2 }}>
                        <TextField
                            fullWidth
                            label="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            margin="normal"
                            error={!!error && !username}
                        />

                        <Box sx={{ mt: 3, mb: 2 }}>
                            <Button
                                fullWidth
                                variant="contained"
                                onClick={handleCreateRoom}
                                size="large"
                            >
                                Create New Room
                            </Button>
                        </Box>

                        <Divider sx={{ my: 3 }}>or</Divider>

                        <TextField
                            fullWidth
                            label="Room Code"
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value)}
                            margin="normal"
                            error={!!error && !roomId}
                        />

                        <Box sx={{ mt: 2 }}>
                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={handleJoinRoom}
                                size="large"
                            >
                                Join Room
                            </Button>
                        </Box>

                        {error && (
                            <Typography color="error" align="center" sx={{ mt: 2 }}>
                                {error}
                            </Typography>
                        )}
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
}; 