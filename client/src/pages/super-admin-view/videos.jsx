import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchVideos, 
  createVideo,
  updateVideo,
  deleteVideo,
  toggleVideoFeatured,
  updateVideoPriorities
} from '@/store/superAdmin/video-slice/index.js';
import VideoForm from '@/components/super-admin-view/videoForm.jsx';
import VideoList from '@/components/super-admin-view/videoList.jsx';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, RefreshCw, Video } from 'lucide-react';
import { toast } from 'sonner';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      when: "beforeChildren",
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1] 
    }
  }
};

function VideosPage() {
  const dispatch = useDispatch();
  const { videos, isLoading, error, pagination, uploadProgress } = useSelector(state => state.superAdminVideos);
  const [showForm, setShowForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: 'all',
    category: 'all',
    isFeatured: 'all'
  });

  useEffect(() => {
    dispatch(fetchVideos(filters));
  }, [dispatch, filters]);

  const handleAddNew = () => {
    console.log('Upload Video button clicked!');
    setEditingVideo(null);
    setShowForm(true);
  };

  const handleEdit = (video) => {
    setEditingVideo(video);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      try {
        await dispatch(deleteVideo(id)).unwrap();
        toast.success('Video deleted successfully');
      } catch (error) {
        toast.error('Failed to delete video');
      }
    }
  };

  const handleToggleFeatured = async (id) => {
    try {
      await dispatch(toggleVideoFeatured(id)).unwrap();
      toast.success('Video featured status updated successfully');
    } catch (error) {
      toast.error('Failed to update featured status');
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (editingVideo) {
        // Update existing video
        await dispatch(updateVideo({
          id: editingVideo._id,
          videoData: formData
        })).unwrap();
        toast.success('Video updated successfully');
      } else {
        // Create new video
        await dispatch(createVideo(formData)).unwrap();
        toast.success('Video created successfully');
      }
      
      setShowForm(false);
      setEditingVideo(null);
    } catch (error) {
      toast.error(error.message || 'Failed to save video');
    }
  };

  const handlePriorityUpdate = async (newPriorities) => {
    try {
      await dispatch(updateVideoPriorities(newPriorities)).unwrap();
      toast.success('Video priorities updated successfully');
    } catch (error) {
      toast.error('Failed to update video priorities');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingVideo(null);
  };

  const handleRefresh = () => {
    dispatch(fetchVideos(filters));
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({
      ...prev,
      page
    }));
  };

  return (
    <motion.div
      className="p-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Video className="h-6 w-6" />
            Video Management
          </h1>
          <p className="text-gray-500">Manage featured vendor reels and video content</p>
        </div>
        <div className="flex gap-3">
          <button 
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button 
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleAddNew}
            disabled={isLoading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Upload Video
          </button>
        </div>
      </div>

      {error && (
        <motion.div 
          variants={itemVariants}
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6"
        >
          Error: {error.message || error}
        </motion.div>
      )}

      {showForm ? (
        <motion.div variants={itemVariants}>
          <Card className="border shadow-sm mb-6">
            <CardHeader className="pb-3">
              <CardTitle>
                {editingVideo ? 'Edit Video' : 'Upload New Video'}
              </CardTitle>
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                    <span>Upload Progress</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <VideoForm 
                initialData={editingVideo}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                isUploading={isLoading}
                uploadProgress={uploadProgress}
              />
            </CardContent>
          </Card>
        </motion.div>
      ) : null}

      <motion.div variants={itemVariants}>
        <VideoList 
          videos={videos}
          isLoading={isLoading}
          pagination={pagination}
          filters={filters}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleFeatured={handleToggleFeatured}
          onPriorityUpdate={handlePriorityUpdate}
          onFilterChange={handleFilterChange}
          onPageChange={handlePageChange}
        />
      </motion.div>
    </motion.div>
  );
}

export default VideosPage; 