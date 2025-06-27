import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, AlertCircle, Download } from 'lucide-react';

const VoiceMessagePlayer = ({ audioUrl, duration = 0, className = "" }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isReady, setIsReady] = useState(false);
  const audioRef = useRef(null);

  // Mobile detection
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  console.log('🎵 VoiceMessagePlayer initialized:', {
    audioUrl,
    isMobile,
    isIOS,
    duration
  });

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    // Reset states
    setIsReady(false);
    setHasError(false);
    setIsLoading(true);

    // Comprehensive event handlers
    const updateTime = () => {
      if (audio.currentTime !== currentTime) {
        setCurrentTime(audio.currentTime);
      }
    };

    const updateDuration = () => {
      if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
        setTotalDuration(audio.duration);
        console.log('🎵 Duration loaded:', audio.duration);
      }
    };

    const handleLoadStart = () => {
      console.log('🎵 Audio loading started');
      setIsLoading(true);
      setHasError(false);
    };

    const handleLoadedMetadata = () => {
      console.log('🎵 Metadata loaded');
      updateDuration();
    };

    const handleCanPlay = () => {
      console.log('🎵 Audio can play');
      setIsLoading(false);
      setIsReady(true);
      setHasError(false);
    };

    const handleCanPlayThrough = () => {
      console.log('🎵 Audio can play through');
      setIsLoading(false);
      setIsReady(true);
    };

    const handlePlay = () => {
      console.log('🎵 Audio started playing');
      setIsPlaying(true);
      setIsLoading(false);
    };

    const handlePause = () => {
      console.log('🎵 Audio paused');
      setIsPlaying(false);
    };

    const handleEnded = () => {
      console.log('🎵 Audio ended');
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = (e) => {
      console.error('🎵 Audio error:', e);
      console.error('🎵 Audio error details:', {
        error: audio.error,
        networkState: audio.networkState,
        readyState: audio.readyState,
        src: audio.src
      });
      
      setIsLoading(false);
      setHasError(true);
      setIsPlaying(false);
      setIsReady(false);
      
      // More specific error messages
      if (audio.error) {
        switch (audio.error.code) {
          case audio.error.MEDIA_ERR_ABORTED:
            setErrorMessage('Audio loading was aborted');
            break;
          case audio.error.MEDIA_ERR_NETWORK:
            setErrorMessage('Network error loading audio');
            break;
          case audio.error.MEDIA_ERR_DECODE:
            setErrorMessage('Audio format not supported');
            break;
          case audio.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
            setErrorMessage('Audio source not supported');
            break;
          default:
            setErrorMessage('Unable to load audio');
        }
      } else {
        setErrorMessage('Audio playback failed');
      }
    };

    const handleWaiting = () => {
      console.log('🎵 Audio waiting/buffering');
      setIsLoading(true);
    };

    const handleStalled = () => {
      console.log('🎵 Audio stalled');
      setIsLoading(false);
    };

    // Add all event listeners
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('canplaythrough', handleCanPlayThrough);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('error', handleError);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('stalled', handleStalled);

    // Load the audio
    audio.load();

    // Timeout to handle cases where audio never loads
    const loadTimeout = setTimeout(() => {
      if (!isReady && !hasError) {
        console.log('🎵 Audio load timeout');
        setIsLoading(false);
        setHasError(true);
        setErrorMessage('Audio loading timed out');
      }
    }, 10000); // 10 second timeout

    return () => {
      clearTimeout(loadTimeout);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('stalled', handleStalled);
    };
  }, [audioUrl]);

  // Play/pause toggle with better error handling
  const togglePlayPause = async () => {
    if (!audioRef.current) return;

    try {
      if (isPlaying) {
        console.log('🎵 Pausing audio');
        audioRef.current.pause();
      } else {
        console.log('🎵 Attempting to play audio');
        
        // For mobile devices, we need to handle user interaction requirements
        if (isMobile) {
          // Ensure audio is ready before playing
          if (!isReady) {
            setIsLoading(true);
            await new Promise((resolve, reject) => {
              const checkReady = () => {
                if (audioRef.current.readyState >= 2) { // HAVE_CURRENT_DATA
                  resolve();
                } else {
                  setTimeout(checkReady, 100);
                }
              };
              checkReady();
              
              // Timeout after 5 seconds
              setTimeout(() => reject(new Error('Audio not ready')), 5000);
            });
          }
        }
        
        setIsLoading(true);
        await audioRef.current.play();
        console.log('🎵 Audio playing successfully');
      }
    } catch (error) {
      console.error('🎵 Playback error:', error);
      setIsLoading(false);
      setHasError(true);
      
      if (error.name === 'NotAllowedError') {
        setErrorMessage('Audio blocked by browser. Please enable audio autoplay.');
      } else if (error.name === 'NotSupportedError') {
        setErrorMessage('Audio format not supported by your browser.');
      } else {
        setErrorMessage(`Playback failed: ${error.message}`);
      }
    }
  };

  // Seek functionality
  const handleSeek = (e) => {
    if (!audioRef.current || !totalDuration || !isReady) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * totalDuration;
    
    try {
      audioRef.current.currentTime = Math.max(0, Math.min(newTime, totalDuration));
      setCurrentTime(newTime);
    } catch (error) {
      console.error('🎵 Seek error:', error);
    }
  };

  // Retry loading audio
  const retryAudio = () => {
    console.log('🎵 Retrying audio load');
    setHasError(false);
    setErrorMessage('');
    setIsLoading(true);
    setIsReady(false);
    
    if (audioRef.current) {
      audioRef.current.load();
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  // Error state
  if (hasError) {
    return (
      <div className={`flex items-center space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-red-600 text-sm block">{errorMessage}</span>
          <div className="flex gap-2 mt-2">
            <button
              onClick={retryAudio}
              className="text-blue-500 hover:text-blue-700 text-xs underline"
            >
              Try again
            </button>
            <button
              onClick={() => window.open(audioUrl, '_blank')}
              className="text-blue-500 hover:text-blue-700 text-xs underline"
            >
              Open audio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-3 p-3 bg-gray-50 rounded-lg max-w-sm ${className}`}>
      {/* Audio element - removed crossOrigin to avoid CORS issues */}
      <audio 
        ref={audioRef} 
        src={audioUrl}
        preload="metadata"
        playsInline
        muted={false}
      />

      {/* Play/Pause Button */}
      <button
        onClick={togglePlayPause}
        disabled={isLoading || !isReady}
        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
          isLoading || !isReady 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700'
        } text-white`}
        title={isLoading ? 'Loading audio...' : isReady ? (isPlaying ? 'Pause' : 'Play') : 'Audio not ready'}
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
        ) : isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4 ml-0.5" />
        )}
      </button>

      {/* Progress and Time */}
      <div className="flex-1 min-w-0">
        <div 
          className={`w-full h-2 bg-gray-200 rounded-full ${isReady ? 'cursor-pointer' : 'cursor-not-allowed'}`}
          onClick={isReady ? handleSeek : undefined}
        >
          <div 
            className="h-full bg-blue-500 rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(totalDuration)}</span>
        </div>
      </div>

      {/* Status indicator */}
      {!isReady && !isLoading && !hasError && (
        <div className="flex-shrink-0 text-xs text-gray-500">
          Loading...
        </div>
      )}
    </div>
  );
};

export default VoiceMessagePlayer; 