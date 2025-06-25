import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload, Video, Image, Tag, User } from 'lucide-react';

const VIDEO_CATEGORIES = [
  { value: 'showcase', label: 'Product Showcase' },
  { value: 'unboxing', label: 'Unboxing' },
  { value: 'haul', label: 'Fashion Haul' },
  { value: 'tutorial', label: 'Tutorial/How-to' },
  { value: 'review', label: 'Product Review' },
  { value: 'other', label: 'Other' }
];

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' }
];

function VideoForm({ initialData, onSubmit, onCancel, isUploading, uploadProgress }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'showcase',
    tags: '',
    vendorId: '',
    status: 'draft',
    isFeatured: false,
    priority: 0,
    videoFile: null,
    thumbnailFile: null
  });
  
  const [videoPreview, setVideoPreview] = useState('');
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        category: initialData.category || 'showcase',
        tags: initialData.tags ? initialData.tags.join(', ') : '',
        vendorId: initialData.vendorId || '',
        status: initialData.status || 'draft',
        isFeatured: initialData.isFeatured || false,
        priority: initialData.priority || 0,
        videoFile: null,
        thumbnailFile: null
      });
      
      setVideoPreview(initialData.videoUrl || '');
      setThumbnailPreview(initialData.thumbnailUrl || '');
    }
  }, [initialData]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSwitchChange = (checked) => {
    setFormData(prev => ({ ...prev, isFeatured: checked }));
  };
  
  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('video/')) {
        alert('Please select a valid video file');
        return;
      }
      
      // Validate file size (100MB limit)
      if (file.size > 100 * 1024 * 1024) {
        alert('Video file size must be less than 100MB');
        return;
      }
      
      setFormData(prev => ({ ...prev, videoFile: file }));
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file for thumbnail');
        return;
      }
      
      setFormData(prev => ({ ...prev, thumbnailFile: file }));
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Prepare form data for submission
    const submitData = new FormData();
    
    // Basic fields
    submitData.append('title', formData.title);
    submitData.append('description', formData.description);
    submitData.append('category', formData.category);
    submitData.append('status', formData.status);
    submitData.append('isFeatured', formData.isFeatured);
    submitData.append('priority', formData.priority);
    
    // Handle tags
    if (formData.tags) {
      submitData.append('tags', formData.tags);
    }
    
    // Handle vendor ID
    if (formData.vendorId) {
      submitData.append('vendorId', formData.vendorId);
    }
    
    // Handle file uploads
    if (formData.videoFile) {
      submitData.append('video', formData.videoFile);
    }
    
    if (formData.thumbnailFile) {
      submitData.append('thumbnail', formData.thumbnailFile);
    }
    
    onSubmit(submitData);
  };
  
  return (
    <motion.form 
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="grid gap-6">
        {/* Title */}
        <div className="grid gap-3">
          <Label htmlFor="title">Video Title *</Label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter video title"
            required
          />
        </div>
        
        {/* Description */}
        <div className="grid gap-3">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe your video content"
            rows={3}
          />
        </div>
        
        {/* Category & Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-3">
            <Label>Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleSelectChange('category', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {VIDEO_CATEGORIES.map(category => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-3">
            <Label>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleSelectChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Tags */}
        <div className="grid gap-3">
          <Label htmlFor="tags">
            <Tag className="h-4 w-4 inline mr-1" />
            Tags
          </Label>
          <Input
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            placeholder="fashion, summer, trending (comma separated)"
          />
          <p className="text-sm text-gray-500">
            Separate tags with commas for better searchability
          </p>
        </div>
        
        {/* Vendor ID */}
        <div className="grid gap-3">
          <Label htmlFor="vendorId">
            <User className="h-4 w-4 inline mr-1" />
            Vendor ID (Optional)
          </Label>
          <Input
            id="vendorId"
            name="vendorId"
            value={formData.vendorId}
            onChange={handleChange}
            placeholder="Enter vendor user ID"
          />
          <p className="text-sm text-gray-500">
            Link this video to a specific vendor (leave empty for general content)
          </p>
        </div>
        
        {/* Priority */}
        <div className="grid gap-3">
          <Label htmlFor="priority">Display Priority</Label>
          <Input
            id="priority"
            name="priority"
            type="number"
            value={formData.priority}
            onChange={handleChange}
            min={0}
            max={100}
          />
          <p className="text-sm text-gray-500">
            Higher numbers appear first (0-100)
          </p>
        </div>
        
        {/* Video Upload */}
        <div className="grid gap-3">
          <Label htmlFor="video">
            <Video className="h-4 w-4 inline mr-1" />
            Video File {!initialData && '*'}
          </Label>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative border border-gray-200 rounded-md p-4">
                <input
                  id="video"
                  type="file"
                  accept="video/*"
                  onChange={handleVideoChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex items-center justify-center h-16 gap-2 text-gray-500">
                  <Video className="h-6 w-6" />
                  <span>Click to upload video (Max 100MB)</span>
                </div>
              </div>
            </div>
            
            {videoPreview && (
              <div className="w-32 h-20 relative overflow-hidden rounded-md border border-gray-200">
                <video 
                  src={videoPreview} 
                  className="w-full h-full object-cover"
                  controls={false}
                  muted
                />
              </div>
            )}
          </div>
          {!initialData && !videoPreview && (
            <p className="text-sm text-red-500">
              Video file is required for new videos
            </p>
          )}
        </div>
        
        {/* Thumbnail Upload */}
        <div className="grid gap-3">
          <Label htmlFor="thumbnail">
            <Image className="h-4 w-4 inline mr-1" />
            Custom Thumbnail (Optional)
          </Label>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative border border-gray-200 rounded-md p-2">
                <input
                  id="thumbnail"
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex items-center justify-center h-12 gap-2 text-gray-500">
                  <Image className="h-5 w-5" />
                  <span>Upload custom thumbnail</span>
                </div>
              </div>
            </div>
            
            {thumbnailPreview && (
              <div className="w-20 h-20 relative overflow-hidden rounded-md border border-gray-200">
                <img 
                  src={thumbnailPreview} 
                  alt="Thumbnail preview" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
          <p className="text-sm text-gray-500">
            If not provided, thumbnail will be auto-generated from video
          </p>
        </div>
        
        {/* Featured Toggle */}
        <div className="flex items-center gap-3">
          <Switch
            id="isFeatured"
            checked={formData.isFeatured}
            onCheckedChange={handleSwitchChange}
          />
          <Label htmlFor="isFeatured">Featured (show on homepage)</Label>
        </div>
        
        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onCancel}
            disabled={isUploading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isUploading || (!initialData && !formData.videoFile)}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {uploadProgress > 0 ? `Uploading... ${uploadProgress}%` : 'Processing...'}
              </>
            ) : (
              initialData ? 'Update Video' : 'Upload Video'
            )}
          </button>
        </div>
      </div>
    </motion.form>
  );
}

export default VideoForm; 