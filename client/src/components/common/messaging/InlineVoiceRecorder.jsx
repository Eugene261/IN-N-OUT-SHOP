import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Trash2, 
  Send, 
  X,
  AlertCircle,
  Square
} from 'lucide-react';
import axios from 'axios';

const InlineVoiceRecorder = ({ 
  isVisible, 
  onClose, 
  onSendAudio, 
  conversationId 
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [permission, setPermission] = useState('prompt');

  const mediaRecorderRef = useRef(null);
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
      setError('Microphone access required');
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
        
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setDuration(0);

      intervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Failed to start recording');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
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
    onClose();
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
    if (isRecording) {
      stopRecording();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    setIsRecording(false);
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setError('');
    setSending(false);
    setPermission('prompt');

    onClose();
  };

  // Auto-start recording when visible
  useEffect(() => {
    if (isVisible && !isRecording && !audioBlob) {
      startRecording();
    }

    return () => {
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
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-white border-t border-gray-200 p-4"
    >
      {permission === 'denied' ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MicOff className="w-6 h-6 text-red-500" />
            <span className="text-red-600 text-sm">Microphone access required</span>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      ) : error ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg p-3"
        >
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
          <button
            onClick={handleClose}
            className="text-red-500 hover:text-red-700"
          >
            <X className="w-5 h-5" />
          </button>
        </motion.div>
      ) : (
        <div className="flex items-center space-x-4">
          {/* Cancel Button */}
          <button
            onClick={handleClose}
            className="p-3 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Recording Indicator */}
          <div className="flex-1 flex items-center space-x-3">
            {isRecording ? (
              <>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-4 h-4 bg-red-500 rounded-full"
                />
                <span className="text-red-600 font-medium">Recording...</span>
                <span className="text-gray-600 font-mono text-lg">
                  {formatDuration(duration)}
                </span>
              </>
            ) : audioBlob ? (
              <>
                <div className="w-4 h-4 bg-green-500 rounded-full" />
                <span className="text-green-600 font-medium">Recording ready</span>
                <span className="text-gray-600 font-mono text-lg">
                  {formatDuration(duration)}
                </span>
              </>
            ) : (
              <>
                <div className="w-4 h-4 bg-gray-400 rounded-full" />
                <span className="text-gray-600">Preparing...</span>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {isRecording ? (
              <button
                onClick={stopRecording}
                className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <Square className="w-5 h-5" />
              </button>
            ) : audioBlob ? (
              <>
                <button
                  onClick={deleteRecording}
                  disabled={sending}
                  className="p-3 text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button
                  onClick={sendAudio}
                  disabled={sending}
                  className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {sending ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </>
            ) : null}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default InlineVoiceRecorder; 