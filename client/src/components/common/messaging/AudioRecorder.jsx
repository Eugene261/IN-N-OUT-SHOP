import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Square, 
  Play, 
  Pause, 
  Send, 
  Trash2, 
  X,
  AlertCircle,
  Volume2
} from 'lucide-react';
import axios from 'axios';

const AudioRecorder = ({ 
  isOpen, 
  onClose, 
  onSendAudio, 
  conversationId 
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [permission, setPermission] = useState('prompt'); // 'granted', 'denied', 'prompt'

  const mediaRecorderRef = useRef(null);
  const audioRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const chunksRef = useRef([]);

  // Request microphone permission
  const requestPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });
      
      streamRef.current = stream;
      setPermission('granted');
      setError('');
      return true;
    } catch (err) {
      console.error('Microphone permission denied:', err);
      setPermission('denied');
      setError('Microphone access is required to record audio messages. Please allow microphone access and try again.');
      return false;
    }
  };

  // Start recording
  const startRecording = async () => {
    if (!streamRef.current) {
      const hasPermission = await requestPermission();
      if (!hasPermission) return;
    }

    try {
      chunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
        setAudioBlob(blob);
        
        // Create URL for playback
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setIsPaused(false);
      setDuration(0);

      // Start duration timer
      intervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Failed to start recording. Please try again.');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  };

  // Pause recording
  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        intervalRef.current = setInterval(() => {
          setDuration(prev => prev + 1);
        }, 1000);
      } else {
        mediaRecorderRef.current.pause();
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      }
      setIsPaused(!isPaused);
    }
  };

  // Play/pause audio
  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Delete recording
  const deleteRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setIsPlaying(false);
  };

  // Send audio
  const sendAudio = async () => {
    if (!audioBlob) return;

    setSending(true);
    setError('');

    try {
      const formData = new FormData();
      const audioFile = new File([audioBlob], `voice-message-${Date.now()}.webm`, {
        type: 'audio/webm'
      });
      
      formData.append('files', audioFile);
      formData.append('content', '🎤 Voice message');

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/common/messaging/conversations/${conversationId}/messages/media`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        onSendAudio(response.data.data);
        handleClose();
      }
    } catch (error) {
      console.error('Audio upload error:', error);
      setError(error.response?.data?.message || 'Failed to send voice message');
    } finally {
      setSending(false);
    }
  };

  // Format duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup on close
  const handleClose = () => {
    // Stop recording if active
    if (isRecording) {
      stopRecording();
    }

    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Clear intervals
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Clean up URLs
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    // Reset state
    setIsRecording(false);
    setIsPaused(false);
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setIsPlaying(false);
    setError('');
    setSending(false);
    setPermission('prompt');

    onClose();
  };

  // Check for MediaRecorder support
  const isSupported = typeof MediaRecorder !== 'undefined';

  // Request permission on mount
  useEffect(() => {
    if (isOpen && isSupported) {
      requestPermission();
    }

    return () => {
      // Cleanup on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  if (!isSupported) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Audio Recording Not Supported
              </h3>
              <p className="text-gray-600 mb-4">
                Your browser doesn't support audio recording. Please use a modern browser like Chrome, Firefox, or Safari.
              </p>
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Voice Message</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Record and send a voice message
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {permission === 'denied' ? (
              <div className="text-center">
                <MicOff className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Microphone Access Required
                </h3>
                <p className="text-gray-600 mb-4">
                  Please allow microphone access to record voice messages.
                </p>
                <button
                  onClick={requestPermission}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Request Permission
                </button>
              </div>
            ) : (
              <>
                {/* Recording Controls */}
                <div className="text-center mb-6">
                  {!audioBlob ? (
                    <>
                      <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${
                        isRecording 
                          ? 'bg-red-100 animate-pulse' 
                          : 'bg-blue-100 hover:bg-blue-200'
                      } transition-colors cursor-pointer`}
                        onClick={isRecording ? pauseRecording : startRecording}
                      >
                        {isRecording ? (
                          isPaused ? (
                            <Mic className="w-8 h-8 text-red-500" />
                          ) : (
                            <Square className="w-6 h-6 text-red-500" />
                          )
                        ) : (
                          <Mic className="w-8 h-8 text-blue-600" />
                        )}
                      </div>
                      
                      <div className="text-2xl font-mono font-bold text-gray-900 mb-2">
                        {formatDuration(duration)}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-4">
                        {isRecording ? (
                          isPaused ? 'Recording paused - tap to resume' : 'Recording... tap to pause'
                        ) : (
                          'Tap the microphone to start recording'
                        )}
                      </p>

                      {isRecording && (
                        <button
                          onClick={stopRecording}
                          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Stop Recording
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      {/* Playback Controls */}
                      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 cursor-pointer hover:bg-green-200 transition-colors"
                        onClick={togglePlayback}
                      >
                        {isPlaying ? (
                          <Pause className="w-8 h-8 text-green-600" />
                        ) : (
                          <Play className="w-8 h-8 text-green-600 ml-1" />
                        )}
                      </div>
                      
                      <div className="flex items-center justify-center space-x-2 mb-4">
                        <Volume2 className="w-4 h-4 text-gray-500" />
                        <span className="text-lg font-mono font-bold text-gray-900">
                          {formatDuration(duration)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-4">
                        Voice message ready to send
                      </p>

                      {/* Audio element for playback */}
                      <audio
                        ref={audioRef}
                        src={audioUrl}
                        onEnded={() => setIsPlaying(false)}
                        className="hidden"
                      />
                    </>
                  )}
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3"
                  >
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-red-700 text-sm">{error}</p>
                  </motion.div>
                )}

                {/* Action Buttons */}
                {audioBlob && (
                  <div className="flex space-x-3">
                    <button
                      onClick={deleteRecording}
                      disabled={sending}
                      className="flex-1 px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                    <button
                      onClick={sendAudio}
                      disabled={sending}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                    >
                      {sending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Send</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AudioRecorder; 