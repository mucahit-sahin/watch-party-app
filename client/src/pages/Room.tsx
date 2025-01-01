import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
    Container, 
    Grid, 
    Paper, 
    Box, 
    Typography,
    TextField,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider
} from '@mui/material';
import { Person } from '@mui/icons-material';
import { VideoPlayer } from '../components/VideoPlayer';
import { Chat } from '../components/Chat';
import { socketService } from '../services/socketService';
import { Room as RoomType, Message, VideoState, User } from '../types/types';

export const Room: React.FC = () => {
    const { roomId } = useParams<{ roomId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [room, setRoom] = useState<RoomType | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [videoUrl, setVideoUrl] = useState('');
    const [newVideoUrl, setNewVideoUrl] = useState('');
    const [videoState, setVideoState] = useState<VideoState>({
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        buffered: 0
    });

    useEffect(() => {
        if (!roomId) {
            navigate('/');
            return;
        }

        // Socket bağlantısını oluştur
        const socket = socketService.connect();

        // Oda ve kullanıcı bilgilerini location state'inden al
        const roomData = location.state?.room as RoomType;
        if (roomData) {
            console.log('Initial room data:', roomData);
            setRoom(roomData);
            
            // Giriş yapan kullanıcıyı bul
            const joinedUser = roomData.users[roomData.users.length - 1];
            if (joinedUser) {
                console.log('Setting current user:', joinedUser);
                setCurrentUser(joinedUser);
            }
        }

        const handleRoomUpdate = (updatedRoom: RoomType) => {
            console.log('Room updated:', updatedRoom);
            setRoom(updatedRoom);
            // Mevcut kullanıcıyı güncelle
            if (currentUser) {
                const updatedUser = updatedRoom.users.find(u => u.id === currentUser.id);
                if (updatedUser) {
                    console.log('Updating current user:', updatedUser);
                    setCurrentUser(updatedUser);
                }
            }
        };

        // Event listeners'ları temizle ve yeniden ekle
        socketService.removeAllListeners();

        socketService.onVideoStateChange((newState: VideoState) => {
            console.log('Video state changed:', newState);
            setVideoState(newState);
        });

        socketService.onVideoUrlChange((url: string) => {
            console.log('Video URL changed:', url);
            setVideoUrl(url);
        });

        socketService.onMessageReceived((message: Message) => {
            console.log('Message received:', message);
            setMessages(prev => [...prev, message]);
        });

        socketService.onUserJoined(handleRoomUpdate);
        socketService.onUserLeft(handleRoomUpdate);

        // Cleanup function
        return () => {
            if (roomId && currentUser) {
                console.log('Leaving room:', roomId, 'User:', currentUser);
                socketService.leaveRoom(roomId, currentUser.id);
            }
            socketService.removeAllListeners();
        };
    }, [roomId, navigate, location.state]);

    const handleVideoStateChange = (newState: VideoState) => {
        if (roomId) {
            console.log('Sending video state update:', newState);
            socketService.updateVideoState(roomId, newState);
            setVideoState(newState);
        }
    };

    const handleSendMessage = (content: string) => {
        if (roomId && currentUser) {
            console.log('Sending message from user:', currentUser);
            socketService.sendMessage(roomId, {
                userId: currentUser.id,
                username: currentUser.username,
                content
            });
        }
    };

    const handleUpdateVideoUrl = () => {
        if (roomId && newVideoUrl) {
            console.log('Updating video URL:', newVideoUrl);
            socketService.updateVideoUrl(roomId, newVideoUrl);
            setVideoUrl(newVideoUrl);
            setNewVideoUrl('');
        }
    };

    const isHost = currentUser?.isHost || false;

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3}>
                {/* Sol Panel - Kullanıcı Listesi */}
                <Grid item xs={12} md={3}>
                    <Paper sx={{ p: 2, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>
                            Katılımcılar
                        </Typography>
                        <List>
                            {room?.users.map((user: User) => (
                                <ListItem key={user.id}>
                                    <ListItemIcon>
                                        <Person />
                                    </ListItemIcon>
                                    <ListItemText 
                                        primary={user.username}
                                        secondary={user.isHost ? '(Host)' : ''}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </Paper>
                </Grid>

                {/* Orta Panel - Video Oynatıcı */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        {isHost && (
                            <Box sx={{ mb: 2 }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Video URL"
                                    value={newVideoUrl}
                                    onChange={(e) => setNewVideoUrl(e.target.value)}
                                    sx={{ mr: 1 }}
                                />
                                <Button
                                    variant="contained"
                                    onClick={handleUpdateVideoUrl}
                                    disabled={!newVideoUrl}
                                    sx={{ mt: 1 }}
                                >
                                    Video Değiştir
                                </Button>
                            </Box>
                        )}
                        
                        <Divider sx={{ my: 2 }} />
                        
                        {videoUrl ? (
                            <VideoPlayer
                                url={videoUrl}
                                videoState={videoState}
                                onStateChange={handleVideoStateChange}
                                isHost={isHost}
                            />
                        ) : (
                            <Box sx={{ 
                                height: 400, 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                bgcolor: 'grey.100'
                            }}>
                                <Typography variant="h6" color="text.secondary">
                                    Video URL'si bekleniyor...
                                </Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>

                {/* Sağ Panel - Sohbet */}
                <Grid item xs={12} md={3}>
                    <Box sx={{ height: '70vh' }}>
                        <Chat
                            messages={messages}
                            onSendMessage={handleSendMessage}
                        />
                    </Box>
                </Grid>
            </Grid>
        </Container>
    );
}; 