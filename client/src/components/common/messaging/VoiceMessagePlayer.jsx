import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, AlertCircle } from 'lucide-react';

const VoiceMessagePlayer = ({ audioUrl, duration = 0, className = "" }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const audioRef = useRef(null);

  // Mobile detection
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setTotalDuration(audio.duration);
      }
    };
    const handlePlay = () => {
      setIsPlaying(true);
      setIsLoading(false);
    };
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const handleLoadStart = () => {
      if (!isInitialized) {
        setIsLoading(true);
      }
    };
    const handleCanPlay = () => {
      setIsLoading(false);
      setHasError(false);
      setErrorMessage('');
      setIsInitialized(true);
    };
    const handleError = (e) => {
      console.error('Audio error:', e);
      setIsLoading(false);
      setHasError(true);
      setIsPlaying(false);
      
      // More specific error messages
      const error = e.target?.error;
      if (error) {
        switch (error.code) {
          case error.MEDIA_ERR_ABORTED:
            setErrorMessage('Audio loading was aborted');
            break;
          case error.MEDIA_ERR_NETWORK:
            setErrorMessage('Network error loading audio');
            break;
          case error.MEDIA_ERR_DECODE:
            setErrorMessage('Audio format not supported');
            break;
          case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
            setErrorMessage('Audio source not supported');
            break;
          default:
            setErrorMessage('Unable to play audio');
        }
      } else {
        setErrorMessage('Unable to play audio');
      }
    };

    // Mobile-specific event handlers
    const handleWaiting = () => {
      if (isMobile) {
        setIsLoading(true);
      }
    };

    const handleCanPlayThrough = () => {
      setIsLoading(false);
      setIsInitialized(true);
    };

    const handleSuspend = () => {
      // Handle network suspend events on mobile
      if (isMobile && isPlaying) {
        setIsLoading(true);
      }
    };

    const handleStalled = () => {
      // Handle stalled loading on mobile
      if (isMobile) {
        setIsLoading(true);
      }
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('canplaythrough', handleCanPlayThrough);
    audio.addEventListener('error', handleError);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('suspend', handleSuspend);
    audio.addEventListener('stalled', handleStalled);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('suspend', handleSuspend);
      audio.removeEventListener('stalled', handleStalled);
    };
  }, [isMobile, isInitialized]);

  // Initialize audio on first user interaction for mobile
  const initializeAudio = async () => {
    if (!audioRef.current || isInitialized) return true;

    try {
      setIsLoading(true);
      setHasError(false);
      
      const audio = audioRef.current;
      
      // Mobile-specific initialization
      if (isMobile) {
        // Reset audio source to ensure fresh load
        const currentSrc = audio.src;
        audio.src = '';
        audio.load();
        
        // Add cache-busting parameter for mobile
        const url = new URL(currentSrc);
        url.searchParams.set('t', Date.now().toString());
        audio.src = url.toString();
        
        // Use a more robust loading approach for mobile
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Audio loading timeout - check your connection'));
          }, 15000); // Increased timeout for mobile

          const cleanup = () => {
            clearTimeout(timeout);
            audio.removeEventListener('canplay', onCanPlay);
            audio.removeEventListener('loadeddata', onLoadedData);
            audio.removeEventListener('error', onError);
            audio.removeEventListener('abort', onAbort);
          };

          const onCanPlay = () => {
            cleanup();
            resolve();
          };

          const onLoadedData = () => {
            cleanup();
            resolve();
          };

          const onError = (e) => {
            cleanup();
            console.error('Mobile audio load error:', e);
            reject(new Error(`Audio load failed: ${e.target?.error?.message || 'Unknown error'}`));
          };

          const onAbort = () => {
            cleanup();
            reject(new Error('Audio loading was aborted'));
          };

          audio.addEventListener('canplay', onCanPlay);
          audio.addEventListener('loadeddata', onLoadedData);
          audio.addEventListener('error', onError);
          audio.addEventListener('abort', onAbort);
          
          // Start loading
          audio.load();
        });
      } else {
        // Desktop initialization - simpler approach
        audio.load();
      }

      setIsInitialized(true);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Audio initialization failed:', error);
      setIsLoading(false);
      setHasError(true);
      
      // More specific error messages for mobile
      if (error.message.includes('timeout')) {
        setErrorMessage('Audio loading timeout. Please check your connection and try again.');
      } else if (error.message.includes('CORS')) {
        setErrorMessage('Audio blocked by security policy. Please refresh and try again.');
      } else if (error.message.includes('Network')) {
        setErrorMessage('Network error loading audio. Check your connection.');
      } else {
        setErrorMessage(error.message || 'Failed to load audio');
      }
      return false;
    }
  };

  const togglePlayPause = async () => {
    if (!audioRef.current) return;

    try {
      // Initialize audio on first interaction
      if (!isInitialized) {
        const initialized = await initializeAudio();
        if (!initialized) return;
      }

      if (isPlaying) {
        audioRef.current.pause();
      } else {
        setIsLoading(true);
        
        // Mobile-specific handling
        if (isMobile) {
          // Ensure audio is ready before playing
          if (audioRef.current.readyState < 2) {
            await new Promise((resolve, reject) => {
              const timeout = setTimeout(() => {
                reject(new Error('Audio not ready timeout'));
              }, 5000);

              const onReady = () => {
                clearTimeout(timeout);
                audioRef.current.removeEventListener('canplay', onReady);
                resolve();
              };

              audioRef.current.addEventListener('canplay', onReady);
            });
          }
        }

        await audioRef.current.play();
      }
    } catch (error) {
      console.error('Audio playback error:', error);
      setIsLoading(false);
      setHasError(true);
      
      // Handle specific mobile errors
      if (error.name === 'NotAllowedError') {
        setErrorMessage('Audio playback blocked. Please try again.');
      } else if (error.name === 'NotSupportedError') {
        setErrorMessage('Audio format not supported on this device');
      } else if (error.message.includes('timeout')) {
        setErrorMessage('Audio loading timeout. Check your connection.');
      } else {
        setErrorMessage('Unable to play audio');
      }
    }
  };

  const handleSeek = (e) => {
    if (!audioRef.current || !totalDuration || !isInitialized) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    // Handle both mouse and touch events
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || (e.changedTouches && e.changedTouches[0]?.clientX);
    if (!clientX) return;
    
    const clickX = clientX - rect.left;
    const newTime = (clickX / rect.width) * totalDuration;
    
    try {
      audioRef.current.currentTime = Math.max(0, Math.min(newTime, totalDuration));
      setCurrentTime(newTime);
    } catch (error) {
      console.error('Seek error:', error);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (totalDuration > 0 && isFinite(totalDuration)) ? (currentTime / totalDuration) * 100 : 0;

  if (hasError) {
    return (
      <div className={`flex items-center space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-red-600 text-sm block">{errorMessage}</span>
          <button
            onClick={() => {
              setHasError(false);
              setErrorMessage('');
              setIsInitialized(false);
              if (audioRef.current) {
                audioRef.current.load();
              }
            }}
            className="text-red-500 hover:text-red-700 text-xs underline mt-1"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-gray-50 rounded-lg w-full max-w-xs sm:max-w-sm ${className}`}>
      {/* Hidden audio element with mobile optimizations */}
      <audio 
        ref={audioRef} 
        preload={isMobile ? "none" : "metadata"}
        crossOrigin={audioUrl?.includes('cloudinary') || audioUrl?.includes('amazonaws') ? "anonymous" : undefined}
        playsInline
        controls={false}
        muted={false}
        controlsList="nodownload"
        onContextMenu={(e) => isMobile && e.preventDefault()}
      >
        <source src={audioUrl} type="audio/webm;codecs=opus" />
        <source src={audioUrl} type="audio/mp3" />
        <source src={audioUrl} type="audio/mpeg" />
        <source src={audioUrl} type="audio/wav" />
        <source src={audioUrl} type="audio/ogg;codecs=vorbis" />
        Your browser does not support the audio element.
      </audio>

      {/* Play/Pause Button */}
      <button
        onClick={togglePlayPause}
        disabled={isLoading}
        className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 disabled:bg-gray-400 text-white rounded-full flex items-center justify-center transition-colors touch-manipulation focus:outline-none focus:ring-2 focus:ring-blue-300"
        aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent" />
        ) : isPlaying ? (
          <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
        ) : (
          <Play className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" />
        )}
      </button>

      {/* Progress and Time */}
      <div className="flex-1 min-w-0">
        {/* Progress Bar */}
        <div 
          className="w-full h-3 sm:h-2 bg-gray-200 rounded-full cursor-pointer mb-1 touch-manipulation"
          onClick={handleSeek}
          onTouchStart={handleSeek}
          onTouchMove={handleSeek}
          role="slider"
          aria-label="Audio progress"
          aria-valuemin="0"
          aria-valuemax={totalDuration}
          aria-valuenow={currentTime}
        >
          <div 
            className="h-full bg-blue-500 rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Time Display */}
        <div className="flex items-center justify-between text-xs sm:text-xs text-gray-600">
          <span className="font-mono">{formatTime(currentTime)}</span>
          <span className="font-mono">{formatTime(totalDuration)}</span>
        </div>
      </div>

      {/* Status Icon - Show loading state or volume */}
      <div className="flex-shrink-0 w-4 h-4 sm:w-4 sm:h-4 flex items-center justify-center">
        {isLoading ? (
          <div className="animate-spin rounded-full h-3 w-3 border border-gray-400 border-t-transparent" />
        ) : (
          <Volume2 className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 hidden xs:block" />
        )}
      </div>
    </div>
  );
};

export default VoiceMessagePlayer; 