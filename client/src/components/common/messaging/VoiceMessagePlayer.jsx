import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, AlertCircle } from 'lucide-react';

const VoiceMessagePlayer = ({ audioUrl, duration = 0, className = "" }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [canPlay, setCanPlay] = useState(false);
  const audioRef = useRef(null);

  // Mobile detection
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  console.log('🎵 VoiceMessagePlayer initialized:', {
    audioUrl,
    isMobile
  });

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Enhanced event handlers for better mobile support
    const updateTime = () => setCurrentTime(audio.currentTime);
    
    const updateDuration = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setTotalDuration(audio.duration);
        console.log('🎵 Duration loaded:', audio.duration);
      }
    };

    const handleLoadStart = () => {
      console.log('🎵 Audio loading started');
      setIsLoading(true);
      setHasError(false);
      setCanPlay(false);
    };

    const handleLoadedMetadata = () => {
      console.log('🎵 Metadata loaded');
      updateDuration();
    };

    const handleCanPlay = () => {
      console.log('🎵 Audio can play');
      setIsLoading(false);
      setCanPlay(true);
      setHasError(false);
    };

    const handleCanPlayThrough = () => {
      console.log('🎵 Audio can play through');
      setIsLoading(false);
      setCanPlay(true);
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
      setIsLoading(false);
      setHasError(true);
      setIsPlaying(false);
      setCanPlay(false);
      setErrorMessage('Unable to play audio. Please try again.');
    };

    const handleWaiting = () => {
      console.log('🎵 Audio waiting/buffering');
      setIsLoading(true);
    };

    const handleLoadedData = () => {
      console.log('🎵 Audio data loaded');
      setIsLoading(false);
      setCanPlay(true);
    };

    // Add all event listeners
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('canplaythrough', handleCanPlayThrough);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('error', handleError);
    audio.addEventListener('waiting', handleWaiting);

    // For mobile devices, try to preload the audio
    if (isMobile) {
      audio.load();
    }

    return () => {
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('waiting', handleWaiting);
    };
  }, [audioUrl, isMobile]);

  // Enhanced play/pause toggle for mobile compatibility
  const togglePlayPause = async () => {
    if (!audioRef.current) return;

    try {
      if (isPlaying) {
        console.log('🎵 Pausing audio');
        audioRef.current.pause();
      } else {
        console.log('🎵 Attempting to play audio');
        
        // Special handling for mobile devices
        if (isMobile && !canPlay) {
          console.log('🎵 Mobile device: ensuring audio is ready');
          setIsLoading(true);
          
          // Force load and wait for ready state
          audioRef.current.load();
          
          // Wait for canplay event
          await new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
              reject(new Error('Audio not ready after timeout'));
            }, 10000);
            
            const onCanPlay = () => {
              clearTimeout(timeoutId);
              audioRef.current.removeEventListener('canplay', onCanPlay);
              resolve();
            };
            
            audioRef.current.addEventListener('canplay', onCanPlay);
          });
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
        setErrorMessage('Audio blocked by browser. Please allow audio playback.');
      } else {
        setErrorMessage('Cannot play audio. Please try again.');
      }
    }
  };

  // Seek functionality
  const handleSeek = (e) => {
    if (!audioRef.current || !totalDuration || !canPlay) return;
    
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

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

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
              setIsLoading(true);
              setCanPlay(false);
              if (audioRef.current) {
                audioRef.current.load();
              }
            }}
            className="text-blue-500 hover:text-blue-700 text-xs underline mt-1"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-3 p-3 bg-gray-50 rounded-lg max-w-sm ${className}`}>
      {/* Audio element with enhanced mobile compatibility */}
      <audio 
        ref={audioRef} 
        src={audioUrl}
        preload="auto"
        playsInline
        controlsList="nodownload"
      />

      {/* Play/Pause Button */}
      <button
        onClick={togglePlayPause}
        disabled={isLoading || (!canPlay && !isPlaying)}
        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
          isLoading || (!canPlay && !isPlaying)
            ? 'bg-gray-300 cursor-not-allowed' 
            : 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700'
        } text-white`}
        title={isLoading ? 'Loading...' : canPlay ? (isPlaying ? 'Pause' : 'Play') : 'Loading audio...'}
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
          className={`w-full h-2 bg-gray-200 rounded-full ${canPlay ? 'cursor-pointer' : 'cursor-not-allowed'}`}
          onClick={canPlay ? handleSeek : undefined}
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
    </div>
  );
};

export default VoiceMessagePlayer; 