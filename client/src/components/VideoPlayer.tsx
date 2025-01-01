import React, { useEffect, useRef } from 'react';
import ReactPlayer from 'react-player';
import { Box, IconButton, LinearProgress } from '@mui/material';
import { PlayArrow, Pause } from '@mui/icons-material';
import { VideoState } from '../types/types';

interface VideoPlayerProps {
    url: string;
    videoState: VideoState;
    onStateChange: (state: VideoState) => void;
    isHost: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
    url,
    videoState,
    onStateChange,
    isHost
}) => {
    const playerRef = useRef<ReactPlayer>(null);
    const seekingRef = useRef(false);

    useEffect(() => {
        if (!seekingRef.current && playerRef.current) {
            const diff = Math.abs(playerRef.current.getCurrentTime() - videoState.currentTime);
            if (diff > 1) {
                playerRef.current.seekTo(videoState.currentTime, 'seconds');
            }
        }
    }, [videoState.currentTime]);

    const handlePlay = () => {
        if (isHost) {
            onStateChange({ ...videoState, isPlaying: true });
        }
    };

    const handlePause = () => {
        if (isHost) {
            onStateChange({ ...videoState, isPlaying: false });
        }
    };

    const handleProgress = (state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => {
        if (!seekingRef.current && isHost) {
            onStateChange({
                ...videoState,
                currentTime: state.playedSeconds,
                buffered: state.loadedSeconds
            });
        }
    };

    const handleDuration = (duration: number) => {
        if (isHost) {
            onStateChange({ ...videoState, duration });
        }
    };

    const handleSeek = (seconds: number) => {
        seekingRef.current = true;
        if (isHost) {
            onStateChange({ ...videoState, currentTime: seconds });
        }
        setTimeout(() => {
            seekingRef.current = false;
        }, 1000);
    };

    return (
        <Box sx={{ width: '100%', position: 'relative' }}>
            <ReactPlayer
                ref={playerRef}
                url={url}
                width="100%"
                height="auto"
                playing={videoState.isPlaying}
                onPlay={handlePlay}
                onPause={handlePause}
                onProgress={handleProgress}
                onDuration={handleDuration}
                onSeek={handleSeek}
                controls={false}
            />
            
            <Box sx={{ 
                position: 'absolute', 
                bottom: 0, 
                left: 0, 
                right: 0, 
                bgcolor: 'rgba(0,0,0,0.7)',
                p: 1,
                display: 'flex',
                alignItems: 'center'
            }}>
                <IconButton 
                    onClick={() => onStateChange({ ...videoState, isPlaying: !videoState.isPlaying })}
                    disabled={!isHost}
                    sx={{ color: 'white' }}
                >
                    {videoState.isPlaying ? <Pause /> : <PlayArrow />}
                </IconButton>
                
                <Box sx={{ flex: 1, mx: 2 }}>
                    <LinearProgress
                        variant="determinate"
                        value={(videoState.currentTime / videoState.duration) * 100}
                        sx={{ height: 8, borderRadius: 4 }}
                    />
                </Box>
            </Box>
        </Box>
    );
}; 