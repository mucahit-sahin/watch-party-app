import React, { useState, useRef, useEffect } from 'react';
import { 
    Box, 
    Paper, 
    Typography, 
    TextField, 
    IconButton,
    List,
    ListItem,
    ListItemText,
    Divider
} from '@mui/material';
import { Send } from '@mui/icons-material';
import { Message } from '../types/types';

interface ChatProps {
    messages: Message[];
    onSendMessage: (content: string) => void;
}

export const Chat: React.FC<ChatProps> = ({ messages, onSendMessage }) => {
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = () => {
        if (newMessage.trim()) {
            onSendMessage(newMessage.trim());
            setNewMessage('');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6">Chat</Typography>
            </Box>

            <List sx={{ 
                flex: 1, 
                overflow: 'auto', 
                p: 2,
                display: 'flex',
                flexDirection: 'column'
            }}>
                {messages.map((message, index) => (
                    <React.Fragment key={message.id}>
                        <ListItem alignItems="flex-start" sx={{ px: 1 }}>
                            <ListItemText
                                primary={
                                    <Typography
                                        component="span"
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{ mr: 1 }}
                                    >
                                        {message.messageType === 'system' ? '' : message.username}
                                    </Typography>
                                }
                                secondary={
                                    <Typography
                                        component="span"
                                        variant="body1"
                                        color={message.messageType === 'system' ? 'text.secondary' : 'text.primary'}
                                        sx={{
                                            fontStyle: message.messageType === 'system' ? 'italic' : 'normal',
                                            display: 'block',
                                            mt: 0.5
                                        }}
                                    >
                                        {message.content}
                                    </Typography>
                                }
                            />
                        </ListItem>
                        {index < messages.length - 1 && (
                            <Divider variant="inset" component="li" />
                        )}
                    </React.Fragment>
                ))}
                <div ref={messagesEndRef} />
            </List>

            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        multiline
                        maxRows={4}
                    />
                    <IconButton 
                        color="primary" 
                        onClick={handleSend}
                        disabled={!newMessage.trim()}
                        sx={{ ml: 1 }}
                    >
                        <Send />
                    </IconButton>
                </Box>
            </Box>
        </Paper>
    );
}; 