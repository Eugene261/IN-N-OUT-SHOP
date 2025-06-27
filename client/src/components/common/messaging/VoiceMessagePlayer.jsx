import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, AlertCircle, Download } from 'lucide-react';

const VoiceMessagePlayer = ({ audioUrl, duration = 0, className = "" }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const audioRef = useRef(null);

  // SIMPLIFIED: Basic mobile detection
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  console.log('🎵 VoiceMessagePlayer initialized:', {
    audioUrl,
    isMobile,
    isIOS
  });

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // SIMPLIFIED: Basic event handlers
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
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => {
      setIsLoading(false);
      setHasError(false);
    };
    const handleError = (e) => {
      console.error('🎵 Audio error:', e);
      setIsLoading(false);
      setHasError(true);
      setIsPlaying(false);
      
      if (isIOS) {
        setErrorMessage('Cannot play audio on iOS. Use download button.');
      } else {
        setErrorMessage('Unable to play audio. Try download option.');
      }
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
  }, [isIOS]);

  // SIMPLIFIED: Basic play/pause toggle
  const togglePlayPause = async () => {
    if (!audioRef.current) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        setIsLoading(true);
        await audioRef.current.play();
      }
    } catch (error) {
      console.error('🎵 Playback error:', error);
      setIsLoading(false);
      setHasError(true);
      
      if (error.name === 'NotAllowedError') {
        setErrorMessage('Audio blocked. Allow audio then try again.');
      } else if (isIOS) {
        setErrorMessage('iOS playback issue. Use download button.');
      } else {
        setErrorMessage('Cannot play audio. Try download option.');
      }
    }
  };

  // SIMPLIFIED: Basic seek functionality
  const handleSeek = (e) => {
    if (!audioRef.current || !totalDuration) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * totalDuration;
    
    try {
      audioRef.current.currentTime = Math.max(0, Math.min(newTime, totalDuration));
    } catch (error) {
      console.error('🎵 Seek error:', error);
    }
  };

  // SIMPLIFIED: Mobile download
  const handleDownload = async () => {
    if (!audioUrl) return;

    try {
      if (isIOS) {
        // iOS: Open in new tab
        window.open(audioUrl, '_blank');
      } else {
        // Android: Try blob download
        try {
          const response = await fetch(audioUrl);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          
          const link = document.createElement('a');
          link.href = url;
          link.download = 'voice_message.mp3';
          link.click();
          
          window.URL.revokeObjectURL(url);
        } catch (fetchError) {
          // Fallback: Direct link
          const link = document.createElement('a');
          link.href = audioUrl;
          link.download = 'voice_message.mp3';
          link.click();
        }
      }
    } catch (error) {
      console.error('🎵 Download error:', error);
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
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => {
                setHasError(false);
                setErrorMessage('');
                if (audioRef.current) {
                  audioRef.current.load();
                }
              }}
              className="text-red-500 hover:text-red-700 text-xs underline"
            >
              Try again
            </button>
            <button
              onClick={handleDownload}
              className="text-blue-500 hover:text-blue-700 text-xs underline"
            >
              Download
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-3 p-3 bg-gray-50 rounded-lg max-w-sm ${className}`}>
      {/* SIMPLIFIED: Single audio element */}
      <audio 
        ref={audioRef} 
        src={audioUrl}
        preload="metadata"
        playsInline
        crossOrigin="anonymous"
      />

      {/* Play/Pause Button */}
      <button
        onClick={togglePlayPause}
        disabled={isLoading}
        className="flex-shrink-0 w-10 h-10 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-full flex items-center justify-center transition-colors"
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
          className="w-full h-2 bg-gray-200 rounded-full cursor-pointer"
          onClick={handleSeek}
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

      {/* Download Button for Mobile */}
      {isMobile && (
        <button
          onClick={handleDownload}
          className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Download audio"
        >
          <Download className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default VoiceMessagePlayer; 