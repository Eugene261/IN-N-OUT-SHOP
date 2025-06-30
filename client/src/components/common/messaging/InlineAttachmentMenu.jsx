import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Image, 
  Video, 
  FileText, 
  Camera,
  Music,
  File,
  Upload,
  Send,
  AlertCircle,
  Trash2
} from 'lucide-react';
import axios from 'axios';

const InlineAttachmentMenu = ({ 
  isVisible, 
  onClose, 
  onSendFiles, 
  conversationId 
}) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [caption, setCaption] = useState('');
  
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const documentInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const allFilesInputRef = useRef(null);

  const attachmentTypes = [
    {
      id: 'photos',
      label: 'Photos & Videos',
      icon: Image,
      color: 'bg-blue-500',
      accept: 'image/*,video/*',
      ref: imageInputRef
    },
    {
      id: 'camera',
      label: 'Camera',
      icon: Camera,
      color: 'bg-green-500',
      accept: 'image/*',
      capture: true,
      ref: imageInputRef
    },
    {
      id: 'document',
      label: 'Document',
      icon: FileText,
      color: 'bg-purple-500',
      accept: '.pdf,.doc,.docx,.txt,.rtf',
      ref: documentInputRef
    },
    {
      id: 'audio',
      label: 'Audio',
      icon: Music,
      color: 'bg-orange-500',
      accept: 'audio/*',
      ref: audioInputRef
    },
    {
      id: 'file',
      label: 'File',
      icon: File,
      color: 'bg-gray-500',
      accept: '*/*',
      ref: allFilesInputRef
    }
  ];

  const maxFileSize = 50 * 1024 * 1024; // 50MB
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg', 'audio/webm',
    'video/mp4', 'video/webm', 'video/quicktime',
    'application/pdf', 'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

  const handleTypeSelect = (type) => {
    const input = type.ref.current;
    if (input) {
      input.accept = type.accept;
      if (type.capture) {
        input.capture = 'environment';
      }
      input.click();
    }
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files || []);
    processFiles(files);
    event.target.value = '';
  };

  const processFiles = (files) => {
    const validFiles = [];
    let errorMessage = '';

    files.forEach(file => {
      if (!allowedTypes.includes(file.type)) {
        errorMessage = `File type ${file.type} not supported`;
        return;
      }

      if (file.size > maxFileSize) {
        errorMessage = `File "${file.name}" exceeds ${maxFileSize / (1024 * 1024)}MB limit`;
        return;
      }

      validFiles.push({
        file,
        id: Date.now() + Math.random(),
        name: file.name,
        size: file.size,
        type: file.type,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
      });
    });

    if (errorMessage) {
      setError(errorMessage);
      return;
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
    setError('');
  };

  const removeFile = (id) => {
    setSelectedFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file && file.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return <Image className="w-6 h-6 text-blue-500" />;
    if (type.startsWith('video/')) return <Video className="w-6 h-6 text-purple-500" />;
    if (type.startsWith('audio/')) return <Music className="w-6 h-6 text-green-500" />;
    if (type === 'application/pdf') return <FileText className="w-6 h-6 text-red-500" />;
    return <File className="w-6 h-6 text-gray-500" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSend = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      selectedFiles.forEach(fileObj => {
        formData.append('files', fileObj.file);
      });
      
      if (caption.trim()) {
        formData.append('content', caption.trim());
      }

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
        onSendFiles(response.data.data);
        handleClose();
      } else {
        throw new Error(response.data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('File upload error:', error);
      
      // Enhanced error handling
      let userMessage = 'Failed to upload files';
      
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 413) {
          userMessage = 'Files too large. Please select smaller files.';
        } else if (status === 415) {
          userMessage = 'File type not supported. Please select different files.';
        } else if (data && data.message) {
          userMessage = data.message;
        } else {
          userMessage = `Upload failed (${status}). Please try again.`;
        }
      } else if (error.request) {
        userMessage = 'Network error. Please check your connection and try again.';
      } else {
        userMessage = error.message || 'An unexpected error occurred';
      }
      
      setError(userMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    selectedFiles.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setSelectedFiles([]);
    setCaption('');
    setError('');
    setUploading(false);
    onClose();
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-white border-t border-gray-200"
    >
      {selectedFiles.length === 0 ? (
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Send Attachment</h3>
            <button onClick={handleClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3"
            >
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-700 text-sm">{error}</span>
            </motion.div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {attachmentTypes.map((type) => {
              const IconComponent = type.icon;
              return (
                <motion.button
                  key={type.id}
                  onClick={() => handleTypeSelect(type)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex flex-col items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors group"
                >
                  <div className={`w-12 h-12 ${type.color} rounded-full flex items-center justify-center mb-2 group-hover:scale-105 transition-transform`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 text-center">
                    {type.label}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {attachmentTypes.map((type) => (
            <input
              key={type.id}
              ref={type.ref}
              type="file"
              multiple={type.id !== 'camera'}
              accept={type.accept}
              onChange={handleFileSelect}
              className="hidden"
            />
          ))}
        </div>
      ) : (
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
            </h3>
            <button onClick={handleClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3"
            >
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-700 text-sm">{error}</span>
            </motion.div>
          )}

          <div className="max-h-32 overflow-y-auto mb-4 space-y-2">
            {selectedFiles.map((fileObj) => (
              <motion.div
                key={fileObj.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg"
              >
                {fileObj.preview ? (
                  <img src={fileObj.preview} alt={fileObj.name} className="w-10 h-10 object-cover rounded" />
                ) : (
                  <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                    {getFileIcon(fileObj.type)}
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{fileObj.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(fileObj.size)}</p>
                </div>
                
                <button onClick={() => removeFile(fileObj.id)} className="p-1 text-red-500 hover:text-red-700 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>

          <div className="mb-4">
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption (optional)..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={2}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">{caption.length}/500 characters</p>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                selectedFiles.forEach(file => {
                  if (file.preview) URL.revokeObjectURL(file.preview);
                });
                setSelectedFiles([]);
                setCaption('');
                setError('');
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Clear All
            </button>
            
            <button
              onClick={handleSend}
              disabled={uploading || selectedFiles.length === 0}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2"
            >
              {uploading ? (
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
        </div>
      )}
    </motion.div>
  );
};

export default InlineAttachmentMenu; 