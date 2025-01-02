import React, { useEffect, useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import { Box, IconButton, Slider, CircularProgress } from '@mui/material';
import { PlayArrow, Pause, Fullscreen, FullscreenExit } from '@mui/icons-material';
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
    const containerRef = useRef<HTMLDivElement>(null);
    const seekingRef = useRef(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [localTime, setLocalTime] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);

    useEffect(() => {
        if (!isDragging && !seekingRef.current && playerRef.current) {
            const diff = Math.abs(playerRef.current.getCurrentTime() - videoState.currentTime);
            if (diff > 1) {
                playerRef.current.seekTo(videoState.currentTime, 'seconds');
            }
            setLocalTime(videoState.currentTime);
        }
    }, [videoState.currentTime, isDragging]);

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
        if (!seekingRef.current && !isDragging && isHost) {
            onStateChange({
                ...videoState,
                currentTime: state.playedSeconds,
                buffered: state.loadedSeconds
            });
            setLocalTime(state.playedSeconds);
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

    const handleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    const handleSliderChange = (_event: Event, newValue: number | number[]) => {
        if (isHost) {
            const newTime = ((newValue as number) * videoState.duration) / 100;
            setLocalTime(newTime);
        }
    };

    const handleSliderChangeCommitted = (_event: Event | React.SyntheticEvent, newValue: number | number[]) => {
        if (isHost) {
            const newTime = ((newValue as number) * videoState.duration) / 100;
            handleSeek(newTime);
            if (playerRef.current) {
                playerRef.current.seekTo(newTime, 'seconds');
            }
        }
    };

    const handleBuffer = () => {
        setIsBuffering(true);
    };

    const handleBufferEnd = () => {
        setIsBuffering(false);
    };

    return (
        <Box ref={containerRef} sx={{ width: '100%', position: 'relative' }}>
            <ReactPlayer
                ref={playerRef}
                url={url}
                width="100%"
                height={isFullscreen ? '100vh' : 'auto'}
                playing={videoState.isPlaying}
                onPlay={handlePlay}
                onPause={handlePause}
                onProgress={handleProgress}
                onDuration={handleDuration}
                onSeek={handleSeek}
                onBuffer={handleBuffer}
                onBufferEnd={handleBufferEnd}
                controls={false}
            />
            
            {isBuffering && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        bgcolor: 'rgba(0, 0, 0, 0.5)',
                        borderRadius: '50%',
                        padding: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <CircularProgress sx={{ color: 'white' }} size={60} />
                </Box>
            )}
            
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
                    <Slider
                        value={(localTime / videoState.duration) * 100}
                        onChange={handleSliderChange}
                        onChangeCommitted={handleSliderChangeCommitted}
                        onMouseDown={() => setIsDragging(true)}
                        onMouseUp={() => setIsDragging(false)}
                        disabled={!isHost}
                        sx={{
                            color: 'white',
                            height: 8,
                            '& .MuiSlider-thumb': {
                                width: 16,
                                height: 16,
                                transition: '0.3s cubic-bezier(.47,1.64,.41,.8)',
                                '&:hover': {
                                    boxShadow: '0 0 0 8px rgba(255, 255, 255, 0.16)',
                                },
                            },
                            '& .MuiSlider-rail': {
                                opacity: 0.28,
                            },
                        }}
                    />
                </Box>

                <IconButton
                    onClick={handleFullscreen}
                    sx={{ color: 'white' }}
                >
                    {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
                </IconButton>
            </Box>
        </Box>
    );
}; 