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

  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const chunksRef = useRef([]);
  const audioRef = useRef(null);
  const isPlayingRef = useRef(false);

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
      
      // FIXED: Force mobile-friendly formats from the start
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      let mimeType = 'audio/webm;codecs=opus'; // fallback
      let fileExtension = 'webm';
      
      console.log('🎵 Starting recording - Device:', { isIOS, isMobile });
      
      // Try to use mobile-friendly formats first
      if (isMobile) {
        // For mobile, try these formats in order of preference
        const mobileFormats = [
          'audio/mp4',
          'audio/aac', 
          'audio/mpeg',
          'audio/wav',
          'audio/webm;codecs=opus'
        ];
        
        for (const format of mobileFormats) {
          if (MediaRecorder.isTypeSupported(format)) {
            mimeType = format;
            
            // Set appropriate file extension
            if (format.includes('mp4')) {
              fileExtension = 'mp4';
            } else if (format.includes('aac')) {
              fileExtension = 'aac';
            } else if (format.includes('mpeg')) {
              fileExtension = 'mp3';
            } else if (format.includes('wav')) {
              fileExtension = 'wav';
            } else {
              fileExtension = 'webm';
            }
            
            console.log('✅ Selected mobile format:', format);
            break;
          }
        }
      } else {
        // Desktop - try high quality formats
        const desktopFormats = [
          'audio/mp4',
          'audio/mpeg',
          'audio/wav',
          'audio/webm;codecs=opus'
        ];
        
        for (const format of desktopFormats) {
          if (MediaRecorder.isTypeSupported(format)) {
            mimeType = format;
            
            if (format.includes('mp4')) {
              fileExtension = 'mp4';
            } else if (format.includes('mpeg')) {
              fileExtension = 'mp3';
            } else if (format.includes('wav')) {
              fileExtension = 'wav';
            } else {
              fileExtension = 'webm';
            }
            
            console.log('✅ Selected desktop format:', format);
            break;
          }
        }
      }

      const options = {
        mimeType,
        audioBitsPerSecond: isMobile ? 32000 : 64000, // Lower bitrate for mobile
      };

      console.log('🎵 Recording options:', options);

      recorderRef.current = new MediaRecorder(streamRef.current, options);
      
      recorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorderRef.current.onstop = async () => {
        console.log('🎵 Recording stopped, processing...');
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        
        // FIXED: Send with correct MIME type and extension
        await sendAudioMessage(audioBlob, mimeType, fileExtension);
        
        chunksRef.current = [];
      };

      recorderRef.current.start();
      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Recording error:', error);
      setError('Failed to start recording. Please check microphone permissions.');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (recorderRef.current && isRecording) {
      recorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  // Play recorded audio
  const playRecording = () => {
    if (audioRef.current) {
      audioRef.current.play();
      isPlayingRef.current = true;
    }
  };

  const pauseRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      isPlayingRef.current = false;
    }
  };

  // Delete recording
  const deleteRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      isPlayingRef.current = false;
    }
    
    setAudioBlob(null);
    setAudioUrl('');
    setDuration(0);
    onClose();
  };

  // Send audio
  const sendAudioMessage = async (audioBlob, mimeType, fileExtension) => {
    if (!conversationId) {
      setError('No conversation selected');
      return;
    }

    try {
      setSending(true);

      const formData = new FormData();
      
      // FIXED: Create file with proper extension and MIME type
      const timestamp = Date.now();
      const fileName = `voice_message_${timestamp}.${fileExtension}`;
      
      // Create file with correct MIME type
      const audioFile = new File([audioBlob], fileName, { 
        type: mimeType,
        lastModified: timestamp
      });
      
      formData.append('files', audioFile);
      formData.append('content', '🎤 Voice message');

      console.log('🎵 Sending audio:', {
        fileName,
        mimeType,
        size: audioBlob.size,
        extension: fileExtension
      });

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/common/messaging/conversations/${conversationId}/messages/media`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send voice message');
      }

      const result = await response.json();
      console.log('✅ Audio message sent successfully:', result);
      
      onSendAudio(result.data);
      onClose();
    } catch (error) {
      console.error('❌ Failed to send audio message:', error);
      setError(`Failed to send voice message: ${error.message}`);
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

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (audioRef.current) {
      audioRef.current.pause();
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
      if (timerRef.current) {
        clearInterval(timerRef.current);
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
                  onClick={sendAudioMessage}
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