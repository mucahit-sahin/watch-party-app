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
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
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
    const [showUsernameDialog, setShowUsernameDialog] = useState(false);
    const [username, setUsername] = useState('');
    const [usernameError, setUsernameError] = useState('');
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

        // If room information doesn't come from location state, show username modal
        if (!location.state?.room) {
            setShowUsernameDialog(true);
        } else {
            const roomFromState = location.state.room as RoomType;
            setRoom(roomFromState);
            const hostUser = roomFromState.users.find(u => u.isHost);
            if (hostUser) {
                setCurrentUser(hostUser);
            }
            // Eğer odada video URL'si varsa, onu da ayarla
            if (roomFromState.videoUrl) {
                setVideoUrl(roomFromState.videoUrl);
            }
        }

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
            // Eğer odada video URL'si varsa, onu da güncelle
            if (updatedRoom.videoUrl) {
                setVideoUrl(updatedRoom.videoUrl);
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
                content,
                messageType: 'user'
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

    const handleJoinRoom = () => {
        if (!username.trim()) {
            setUsernameError('Please enter a username');
            return;
        }

        socketService.joinRoom(roomId!, username, (joinedRoom) => {
            if (joinedRoom) {
                setRoom(joinedRoom);
                const joinedUser = joinedRoom.users.find(u => u.username === username);
                if (joinedUser) {
                    setCurrentUser(joinedUser);
                }
                setShowUsernameDialog(false);
            } else {
                setUsernameError('An error occurred while joining the room');
            }
        });
    };

    const isHost = currentUser?.isHost || false;

    if (!roomId) return null;

    return (
        <>
            <Dialog open={showUsernameDialog} onClose={() => navigate('/')} maxWidth="xs" fullWidth>
                <DialogTitle>Join Room</DialogTitle>
                <DialogContent>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        Please enter a username to join the room
                    </Typography>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Username"
                        fullWidth
                        value={username}
                        onChange={(e) => {
                            setUsername(e.target.value);
                            setUsernameError('');
                        }}
                        error={!!usernameError}
                        helperText={usernameError}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => navigate('/')}>Cancel</Button>
                    <Button onClick={handleJoinRoom} variant="contained">
                        Join
                    </Button>
                </DialogActions>
            </Dialog>

            <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
                <Grid container spacing={3}>
                    {/* Left Panel - User List */}
                    <Grid item xs={12} md={3}>
                        <Paper sx={{ p: 2, height: '100%' }}>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>Participants</span>
                                <Box
                                    component="span"
                                    sx={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        minWidth: '24px',
                                        height: '24px',
                                        borderRadius: '12px',
                                        bgcolor: 'primary.main',
                                        color: 'primary.contrastText',
                                        fontSize: '0.75rem',
                                        fontWeight: 'bold',
                                        px: 1
                                    }}
                                >
                                    {room?.users.length || 0}
                                </Box>
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

                    {/* Center Panel - Video Player */}
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
                                        Change Video
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
                                        Waiting for video URL...
                                    </Typography>
                                </Box>
                            )}
                        </Paper>
                    </Grid>

                    {/* Right Panel - Chat */}
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
        </>
    );
}; 