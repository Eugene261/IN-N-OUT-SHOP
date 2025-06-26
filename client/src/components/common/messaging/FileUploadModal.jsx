import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Upload, 
  File, 
  Image, 
  Video, 
  FileText, 
  Music,
  Trash2,
  Send,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';

const FileUploadModal = ({ 
  isOpen, 
  onClose, 
  onSendFiles, 
  conversationId,
  maxFileSize = 50 * 1024 * 1024, // 50MB
  allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg',
    'video/mp4', 'video/webm', 'video/quicktime',
    'application/pdf', 'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
}) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const [caption, setCaption] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files || []);
    processFiles(files);
  };

  const processFiles = (files) => {
    const validFiles = [];
    let errorMessage = '';

    files.forEach(file => {
      // Check file type
      if (!allowedTypes.includes(file.type)) {
        errorMessage = `File type ${file.type} not supported`;
        return;
      }

      // Check file size
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

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  };

  const handleDragOut = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      processFiles(files);
    }
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
    if (type.startsWith('image/')) return <Image className="w-8 h-8 text-blue-500" />;
    if (type.startsWith('video/')) return <Video className="w-8 h-8 text-purple-500" />;
    if (type.startsWith('audio/')) return <Music className="w-8 h-8 text-green-500" />;
    if (type === 'application/pdf') return <FileText className="w-8 h-8 text-red-500" />;
    return <File className="w-8 h-8 text-gray-500" />;
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
      }
    } catch (error) {
      console.error('File upload error:', error);
      setError(error.response?.data?.message || 'Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    // Clean up object URLs
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

  if (!isOpen) return null;

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
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Send Files</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Share images, videos, audio, and documents
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
          <div className="p-6 max-h-96 overflow-y-auto">
            {/* Drag and Drop Area */}
            {selectedFiles.length === 0 && (
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  dragActive 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDragIn}
                onDragLeave={handleDragOut}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {dragActive ? 'Drop files here' : 'Upload Files'}
                </h3>
                <p className="text-gray-600 mb-4">
                  Drag and drop files here, or click to browse
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Choose Files
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  accept={allowedTypes.join(',')}
                  onChange={handleFileSelect}
                />
              </div>
            )}

            {/* Selected Files */}
            {selectedFiles.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Selected Files ({selectedFiles.length})
                  </h3>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
                  >
                    Add More
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    accept={allowedTypes.join(',')}
                    onChange={handleFileSelect}
                  />
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {selectedFiles.map((fileObj) => (
                    <motion.div
                      key={fileObj.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl"
                    >
                      {fileObj.preview ? (
                        <img
                          src={fileObj.preview}
                          alt={fileObj.name}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                          {getFileIcon(fileObj.type)}
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {fileObj.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(fileObj.size)}
                        </p>
                      </div>
                      
                      <button
                        onClick={() => removeFile(fileObj.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>

                {/* Caption */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Caption (optional)
                  </label>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Add a caption to your files..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {caption.length}/500 characters
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3"
              >
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          {selectedFiles.length > 0 && (
            <div className="p-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleClose}
                    disabled={uploading}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={uploading || selectedFiles.length === 0}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Files</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FileUploadModal; 