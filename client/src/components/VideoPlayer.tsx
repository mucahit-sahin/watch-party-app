import React, { useEffect, useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import { Box, IconButton, Slider, CircularProgress, Menu, MenuItem, Typography } from '@mui/material';
import { PlayArrow, Pause, Fullscreen, FullscreenExit, Speed, VolumeUp, VolumeDown, VolumeOff, PictureInPicture } from '@mui/icons-material';
import { VideoState } from '../types/types';

interface VideoPlayerProps {
    url: string;
    videoState: VideoState;
    onStateChange: (state: VideoState) => void;
    isHost: boolean;
}

const PLAYBACK_SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

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
    const [speedMenuAnchor, setSpeedMenuAnchor] = useState<null | HTMLElement>(null);
    const [volume, setVolume] = useState(1);
    const [prevVolume, setPrevVolume] = useState(1);
    const [isVolumeHovered, setIsVolumeHovered] = useState(false);
    const [isPiPActive, setIsPiPActive] = useState(false);

    const SEEK_INTERVAL = 5; // 5 seconds jump

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
        if (isHost) {
            onStateChange({ ...videoState, currentTime: seconds });
        }
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

    const handleSpeedMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setSpeedMenuAnchor(event.currentTarget);
    };

    const handleSpeedMenuClose = () => {
        setSpeedMenuAnchor(null);
    };

    const handleSpeedChange = (speed: number) => {
        if (isHost) {
            onStateChange({ ...videoState, playbackSpeed: speed });
        }
        handleSpeedMenuClose();
    };

    const handleVolumeChange = (_event: Event, newValue: number | number[]) => {
        const newVolume = newValue as number;
        setVolume(newVolume / 100);
        if (newVolume > 0) {
            setPrevVolume(newVolume / 100);
        }
    };

    const handleVolumeClick = () => {
        if (volume > 0) {
            setPrevVolume(volume);
            setVolume(0);
        } else {
            setVolume(prevVolume);
        }
    };

    const getVolumeIcon = () => {
        if (volume === 0) return <VolumeOff />;
        if (volume < 0.5) return <VolumeDown />;
        return <VolumeUp />;
    };

    const handlePiP = async () => {
        try {
            const video = document.querySelector('video');
            if (!video) return;

            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
                setIsPiPActive(false);
            } else {
                await video.requestPictureInPicture();
                setIsPiPActive(true);
            }
        } catch (error) {
            console.error('PiP failed:', error);
        }
    };

    useEffect(() => {
        const handlePiPChange = () => {
            setIsPiPActive(!!document.pictureInPictureElement);
        };

        document.addEventListener('enterpictureinpicture', handlePiPChange);
        document.addEventListener('leavepictureinpicture', handlePiPChange);

        return () => {
            document.removeEventListener('enterpictureinpicture', handlePiPChange);
            document.removeEventListener('leavepictureinpicture', handlePiPChange);
        };
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isHost) return;
            
            switch (e.key) {
                case 'ArrowRight':
                    const forwardTime = Math.min(localTime + SEEK_INTERVAL, videoState.duration);
                    if (playerRef.current) {
                        playerRef.current.seekTo(forwardTime, 'seconds');
                    }
                    setLocalTime(forwardTime);
                    onStateChange({ ...videoState, currentTime: forwardTime });
                    break;
                case 'ArrowLeft':
                    const backwardTime = Math.max(localTime - SEEK_INTERVAL, 0);
                    if (playerRef.current) {
                        playerRef.current.seekTo(backwardTime, 'seconds');
                    }
                    setLocalTime(backwardTime);
                    onStateChange({ ...videoState, currentTime: backwardTime });
                    break;
                case ' ': // Spacebar
                    e.preventDefault();
                    onStateChange({ ...videoState, isPlaying: !videoState.isPlaying });
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isHost, localTime, videoState, onStateChange]);

    return (
        <Box ref={containerRef} sx={{ width: '100%', position: 'relative' }}>
            <ReactPlayer
                ref={playerRef}
                url={url}
                width="100%"
                height={isFullscreen ? '100vh' : '100%'}
                playing={videoState.isPlaying}
                playbackRate={videoState.playbackSpeed}
                volume={volume}
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
                
                <Box sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    flex: 1,
                    mx: 2 
                }}>
                    <Typography variant="body2" sx={{ color: 'white', minWidth: 45 }}>
                        {formatTime(localTime)}
                    </Typography>
                    
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
                            mx: 2,
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

                    <Typography variant="body2" sx={{ color: 'white', minWidth: 45 }}>
                        {formatTime(videoState.duration)}
                    </Typography>
                </Box>

                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        width: isVolumeHovered ? 120 : 40,
                        transition: 'width 0.2s',
                        mr: 1
                    }}
                    onMouseEnter={() => setIsVolumeHovered(true)}
                    onMouseLeave={() => setIsVolumeHovered(false)}
                >
                    <IconButton
                        onClick={handleVolumeClick}
                        sx={{ color: 'white' }}
                    >
                        {getVolumeIcon()}
                    </IconButton>
                    
                    <Slider
                        sx={{
                            width: '100%',
                            ml: 1,
                            opacity: isVolumeHovered ? 1 : 0,
                            transition: 'opacity 0.2s',
                            '& .MuiSlider-track': {
                                color: 'white'
                            },
                            '& .MuiSlider-rail': {
                                color: 'rgba(255,255,255,0.3)'
                            },
                            '& .MuiSlider-thumb': {
                                width: 12,
                                height: 12,
                                '&:hover': {
                                    boxShadow: '0 0 0 8px rgba(255,255,255,0.16)'
                                }
                            }
                        }}
                        value={volume * 100}
                        onChange={handleVolumeChange}
                        size="small"
                    />
                </Box>

                <IconButton
                    onClick={handleSpeedMenuOpen}
                    disabled={!isHost}
                    sx={{ color: 'white', mr: 1 }}
                >
                    <Speed />
                </IconButton>

                <Menu
                    anchorEl={speedMenuAnchor}
                    open={Boolean(speedMenuAnchor)}
                    onClose={handleSpeedMenuClose}
                    anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'center',
                    }}
                    transformOrigin={{
                        vertical: 'bottom',
                        horizontal: 'center',
                    }}
                >
                    {PLAYBACK_SPEEDS.map((speed) => (
                        <MenuItem
                            key={speed}
                            onClick={() => handleSpeedChange(speed)}
                            selected={speed === videoState.playbackSpeed}
                        >
                            {speed}x
                        </MenuItem>
                    ))}
                </Menu>

                <IconButton
                    onClick={handlePiP}
                    sx={{ 
                        color: 'white', 
                        mr: 1,
                        display: document.pictureInPictureEnabled ? 'flex' : 'none'
                    }}
                >
                    <PictureInPicture 
                        sx={{ 
                            color: isPiPActive ? 'primary.main' : 'white' 
                        }} 
                    />
                </IconButton>

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