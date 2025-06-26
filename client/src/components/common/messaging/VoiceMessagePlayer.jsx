import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

const VoiceMessagePlayer = ({ audioUrl, duration = 0, className = "" }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setTotalDuration(audio.duration);
      }
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => {
      setIsLoading(false);
      setHasError(false);
    };
    const handleError = () => {
      setIsLoading(false);
      setHasError(true);
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  const togglePlayPause = async () => {
    if (!audioRef.current) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        await audioRef.current.play();
      }
    } catch (error) {
      console.error('Audio playback error:', error);
      setHasError(true);
    }
  };

  const handleSeek = (e) => {
    if (!audioRef.current || !totalDuration) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    // Handle both mouse and touch events
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || (e.changedTouches && e.changedTouches[0]?.clientX);
    if (!clientX) return;
    
    const clickX = clientX - rect.left;
    const newTime = (clickX / rect.width) * totalDuration;
    
    audioRef.current.currentTime = Math.max(0, Math.min(newTime, totalDuration));
    setCurrentTime(newTime);
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
        <VolumeX className="w-5 h-5 text-red-500" />
        <span className="text-red-600 text-sm">Unable to play audio</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-gray-50 rounded-lg w-full max-w-xs sm:max-w-sm ${className}`}>
      {/* Hidden audio element */}
      <audio ref={audioRef} preload="metadata">
        <source src={audioUrl} />
        Your browser does not support the audio element.
      </audio>

      {/* Play/Pause Button */}
      <button
        onClick={togglePlayPause}
        disabled={isLoading}
        className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 disabled:bg-gray-400 text-white rounded-full flex items-center justify-center transition-colors touch-manipulation"
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

      {/* Volume Icon - Hidden on very small screens */}
      <Volume2 className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0 hidden xs:block" />
    </div>
  );
};

export default VoiceMessagePlayer; 