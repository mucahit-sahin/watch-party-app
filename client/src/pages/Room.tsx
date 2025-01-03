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
    DialogActions,
    Tabs,
    Tab
} from '@mui/material';
import { Person, Chat as ChatIcon, People } from '@mui/icons-material';
import { VideoPlayer } from '../components/VideoPlayer';
import { Chat } from '../components/Chat';
import { socketService } from '../services/socketService';
import { Room as RoomType, Message, VideoState, User } from '../types/types';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            {...other}
            style={{ height: '100%' }}
        >
            {value === index && (
                <Box sx={{ height: '100%' }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

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
        buffered: 0,
        playbackSpeed: 1
    });
    const [tabValue, setTabValue] = useState(0);

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

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    if (!roomId) return null;

    const ParticipantsList = () => (
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
    );

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

            <Container maxWidth="xl" sx={{ mt: 2, mb: 2, height: 'calc(100vh - 32px)' }}>
                <Grid container spacing={2} sx={{ height: '100%' }}>
                    {/* Left Panel - Video Player */}
                    <Grid item xs={12} md={9} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Paper sx={{ p: 2, mb: 2 }}>
                            {isHost && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <TextField
                                        size="small"
                                        label="Video URL"
                                        value={newVideoUrl}
                                        onChange={(e) => setNewVideoUrl(e.target.value)}
                                        sx={{ flex: 1 }}
                                    />
                                    <Button
                                        variant="contained"
                                        onClick={handleUpdateVideoUrl}
                                        disabled={!newVideoUrl}
                                    >
                                        Change Video
                                    </Button>
                                </Box>
                            )}
                        </Paper>
                        
                        <Paper sx={{ 
                            p: 2, 
                            flex: 1, 
                            display: 'flex', 
                            flexDirection: 'column',
                            minHeight: 0 // Bu önemli, flex child'ın taşmasını önler
                        }}>
                            {videoUrl ? (
                                <Box sx={{ 
                                    flex: 1,
                                    position: 'relative',
                                    minHeight: 0, // Bu önemli, flex child'ın taşmasını önler
                                    '& > div': { 
                                        position: 'absolute !important',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0
                                    }
                                }}>
                                    <VideoPlayer
                                        url={videoUrl}
                                        videoState={videoState}
                                        onStateChange={handleVideoStateChange}
                                        isHost={isHost}
                                    />
                                </Box>
                            ) : (
                                <Box sx={{ 
                                    flex: 1,
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

                    {/* Right Panel - Tabs */}
                    <Grid item xs={12} md={3} sx={{ height: '100%' }}>
                        <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Tabs
                                value={tabValue}
                                onChange={handleTabChange}
                                variant="fullWidth"
                                sx={{ borderBottom: 1, borderColor: 'divider' }}
                            >
                                <Tab 
                                    icon={<ChatIcon />} 
                                    label="Chat"
                                    sx={{ minHeight: 64 }}
                                />
                                <Tab 
                                    icon={<People />} 
                                    label={`Participants (${room?.users.length || 0})`}
                                    sx={{ minHeight: 64 }}
                                />
                            </Tabs>

                            <Box sx={{ flex: 1, overflow: 'hidden' }}>
                                <TabPanel value={tabValue} index={0}>
                                    <Box sx={{ height: '100%' }}>
                                        <Chat
                                            messages={messages}
                                            onSendMessage={handleSendMessage}
                                        />
                                    </Box>
                                </TabPanel>
                                <TabPanel value={tabValue} index={1}>
                                    <Box sx={{ height: '100%', overflow: 'auto' }}>
                                        <ParticipantsList />
                                    </Box>
                                </TabPanel>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
        </>
    );
}; 