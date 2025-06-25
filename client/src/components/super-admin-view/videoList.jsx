import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Trash2, Star, StarOff, Play, Eye, Calendar, User, Tag, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

const VIDEO_CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'showcase', label: 'Product Showcase' },
  { value: 'unboxing', label: 'Unboxing' },
  { value: 'haul', label: 'Fashion Haul' },
  { value: 'tutorial', label: 'Tutorial/How-to' },
  { value: 'review', label: 'Product Review' },
  { value: 'other', label: 'Other' }
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' }
];

const FEATURED_OPTIONS = [
  { value: 'all', label: 'All Videos' },
  { value: 'true', label: 'Featured Only' },
  { value: 'false', label: 'Not Featured' }
];

function VideoList({ 
  videos, 
  isLoading, 
  pagination, 
  filters, 
  onEdit, 
  onDelete, 
  onToggleFeatured, 
  onFilterChange, 
  onPageChange 
}) {
  
  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 MB';
    const mb = (bytes / (1024 * 1024)).toFixed(1);
    return `${mb} MB`;
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Draft' },
      published: { bg: 'bg-green-100', text: 'text-green-800', label: 'Published' },
      archived: { bg: 'bg-red-100', text: 'text-red-800', label: 'Archived' }
    };
    
    const config = statusConfig[status] || statusConfig.draft;
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };
  
  if (isLoading) {
    return (
      <Card className="border shadow-sm">
        <CardContent className="p-6">
          <div className="flex justify-center items-center h-40">
            <div className="animate-pulse text-gray-400">Loading videos...</div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select
                value={filters.category}
                onValueChange={(value) => onFilterChange({ category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
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
            
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select
                value={filters.status}
                onValueChange={(value) => onFilterChange({ status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
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
            
            <div>
              <label className="text-sm font-medium mb-2 block">Featured</label>
              <Select
                value={filters.isFeatured}
                onValueChange={(value) => onFilterChange({ isFeatured: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FEATURED_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Per Page</label>
              <Select
                value={filters.limit.toString()}
                onValueChange={(value) => onFilterChange({ limit: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 videos</SelectItem>
                  <SelectItem value="10">10 videos</SelectItem>
                  <SelectItem value="20">20 videos</SelectItem>
                  <SelectItem value="50">50 videos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Video List */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Videos ({pagination.total || 0})
            </CardTitle>
            {pagination && (
              <div className="text-sm text-gray-500">
                Page {pagination.current} of {pagination.pages}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {!videos || videos.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-40 text-center p-6">
              <Play className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-500 mb-2">No videos found</p>
              <p className="text-sm text-gray-400">
                Upload your first video to get started with featured content
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {videos.map((video, index) => (
                <motion.div
                  key={video._id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="flex items-start gap-4">
                    {/* Video Thumbnail */}
                    <div className="w-32 h-20 rounded-md overflow-hidden flex-shrink-0 border border-gray-200 relative">
                      {video.thumbnailUrl ? (
                        <img 
                          src={video.thumbnailUrl} 
                          alt={video.title} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                          <Play className="h-6 w-6" />
                        </div>
                      )}
                      <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1 rounded">
                        {formatDuration(video.duration)}
                      </div>
                    </div>
                    
                    {/* Video Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-900 truncate">
                              {video.title}
                            </h3>
                            {video.isFeatured && (
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            )}
                          </div>
                          
                          {video.description && (
                            <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                              {video.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {video.views || 0} views
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(video.createdAt)}
                            </span>
                            <span>{formatFileSize(video.fileSize)}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 mb-2">
                            {getStatusBadge(video.status)}
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                              {video.category}
                            </span>
                            {video.priority > 0 && (
                              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                                Priority: {video.priority}
                              </span>
                            )}
                          </div>
                          
                          {video.tags && video.tags.length > 0 && (
                            <div className="flex items-center gap-1 mb-2">
                              <Tag className="h-3 w-3 text-gray-400" />
                              <div className="flex flex-wrap gap-1">
                                {video.tags.slice(0, 3).map(tag => (
                                  <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-1 py-0.5 rounded">
                                    {tag}
                                  </span>
                                ))}
                                {video.tags.length > 3 && (
                                  <span className="text-xs text-gray-400">+{video.tags.length - 3} more</span>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {video.uploadedBy && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <User className="h-3 w-3" />
                              <span>By {video.uploadedBy.userName}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onToggleFeatured(video._id)}
                            title={video.isFeatured ? "Remove from featured" : "Add to featured"}
                            className={video.isFeatured ? "text-yellow-600 hover:text-yellow-700" : ""}
                          >
                            {video.isFeatured ? (
                              <Star className="h-4 w-4 fill-current" />
                            ) : (
                              <StarOff className="h-4 w-4" />
                            )}
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(video)}
                            title="Edit video"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(video._id)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            title="Delete video"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {((pagination.current - 1) * filters.limit) + 1} to{' '}
                {Math.min(pagination.current * filters.limit, pagination.total)} of{' '}
                {pagination.total} results
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(pagination.current - 1)}
                  disabled={pagination.current <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    let pageNum;
                    if (pagination.pages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.current <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.current >= pagination.pages - 2) {
                      pageNum = pagination.pages - 4 + i;
                    } else {
                      pageNum = pagination.current - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === pagination.current ? "default" : "outline"}
                        size="sm"
                        onClick={() => onPageChange(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(pagination.current + 1)}
                  disabled={pagination.current >= pagination.pages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default VideoList; 