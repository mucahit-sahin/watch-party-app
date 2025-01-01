import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Container, 
    Box, 
    Typography, 
    TextField, 
    Button, 
    Paper,
    Divider
} from '@mui/material';
import { socketService } from '../services/socketService';

export const Home: React.FC = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [roomId, setRoomId] = useState('');
    const [error, setError] = useState('');

    const handleCreateRoom = () => {
        if (!username) {
            setError('Lütfen bir kullanıcı adı girin');
            return;
        }

        try {
            console.log('Creating room with username:', username);
            socketService.createRoom(username, (room) => {
                if (room) {
                    console.log('Room created:', room);
                    navigate(`/room/${room.id}`, { state: { room } });
                } else {
                    console.error('Room creation failed');
                    setError('Oda oluşturulurken bir hata oluştu');
                }
            });
        } catch (err) {
            console.error('Error creating room:', err);
            setError('Oda oluşturulurken bir hata oluştu');
        }
    };

    const handleJoinRoom = () => {
        if (!username || !roomId) {
            setError('Lütfen kullanıcı adı ve oda kodunu girin');
            return;
        }

        try {
            console.log('Joining room:', roomId, 'with username:', username);
            socketService.joinRoom(roomId, username, (room) => {
                if (room) {
                    console.log('Joined room:', room);
                    navigate(`/room/${room.id}`, { state: { room } });
                } else {
                    console.error('Room join failed');
                    setError('Odaya katılırken bir hata oluştu');
                }
            });
        } catch (err) {
            console.error('Error joining room:', err);
            setError('Odaya katılırken bir hata oluştu');
        }
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
                    <Typography component="h1" variant="h4" align="center" gutterBottom>
                        Watch Party
                    </Typography>
                    
                    <Typography variant="body1" align="center" color="text.secondary" paragraph>
                        Arkadaşlarınızla birlikte video izleyin
                    </Typography>

                    <Box component="form" sx={{ mt: 2 }}>
                        <TextField
                            fullWidth
                            label="Kullanıcı Adı"
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
                                Yeni Oda Oluştur
                            </Button>
                        </Box>

                        <Divider sx={{ my: 3 }}>veya</Divider>

                        <TextField
                            fullWidth
                            label="Oda Kodu"
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
                                Odaya Katıl
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