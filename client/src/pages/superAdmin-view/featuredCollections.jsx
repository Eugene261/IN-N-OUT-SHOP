import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchFeaturedCollections, 
  createFeaturedCollection,
  updateFeaturedCollection,
  deleteFeaturedCollection,
  updateCollectionPositions
} from '@/store/superAdmin/featured-collection-slice';
import { uploadImage } from '@/services/imageService';
import FeaturedCollectionForm from '@/components/superAdmin-view/featuredCollectionForm';
import FeaturedCollectionList from '@/components/superAdmin-view/featuredCollectionList';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, RefreshCw } from 'lucide-react';
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

function FeaturedCollectionsPage() {
  const dispatch = useDispatch();
  const { collections, isLoading, error } = useSelector(state => state.featuredCollections);
  const [showForm, setShowForm] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    dispatch(fetchFeaturedCollections());
  }, [dispatch]);

  const handleAddNew = () => {
    setEditingCollection(null);
    setShowForm(true);
  };

  const handleEdit = (collection) => {
    setEditingCollection(collection);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this featured collection?')) {
      try {
        await dispatch(deleteFeaturedCollection(id)).unwrap();
        toast.success('Featured collection deleted successfully');
      } catch (error) {
        toast.error('Failed to delete featured collection');
      }
    }
  };

  const handleImageUpload = async (file) => {
    if (!file) return null;
    
    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await uploadImage(formData);
      setUploadingImage(false);
      
      if (response.success) {
        return response.result.secure_url;
      } else {
        toast.error('Failed to upload image');
        return null;
      }
    } catch (error) {
      setUploadingImage(false);
      toast.error('Error uploading image');
      return null;
    }
  };

  const handleSubmit = async (formData) => {
    try {
      // If there's a file to upload, upload it first
      if (formData.imageFile) {
        const imageUrl = await handleImageUpload(formData.imageFile);
        if (imageUrl) {
          formData.image = imageUrl;
        } else {
          return; // Stop if image upload failed
        }
      }
      
      delete formData.imageFile; // Remove the file object before sending to API
      
      if (editingCollection) {
        // Update existing collection
        await dispatch(updateFeaturedCollection({
          id: editingCollection._id,
          data: formData
        })).unwrap();
        toast.success('Featured collection updated successfully');
      } else {
        // Create new collection
        await dispatch(createFeaturedCollection(formData)).unwrap();
        toast.success('Featured collection created successfully');
      }
      
      setShowForm(false);
      setEditingCollection(null);
    } catch (error) {
      toast.error(error.message || 'Failed to save featured collection');
    }
  };

  const handlePositionUpdate = async (newPositions) => {
    try {
      await dispatch(updateCollectionPositions(newPositions)).unwrap();
      toast.success('Collection order updated successfully');
    } catch (error) {
      toast.error('Failed to update collection order');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCollection(null);
  };

  const handleRefresh = () => {
    dispatch(fetchFeaturedCollections());
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
          <h1 className="text-2xl font-bold">Featured Collections</h1>
          <p className="text-gray-500">Manage featured collections for the shop homepage</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={handleAddNew}
            disabled={isLoading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Collection
          </Button>
        </div>
      </div>

      {error && (
        <motion.div 
          variants={itemVariants}
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6"
        >
          Error: {error}
        </motion.div>
      )}

      {showForm ? (
        <motion.div variants={itemVariants}>
          <Card className="border shadow-sm mb-6">
            <CardHeader className="pb-3">
              <CardTitle>{editingCollection ? 'Edit' : 'Add'} Featured Collection</CardTitle>
            </CardHeader>
            <CardContent>
              <FeaturedCollectionForm 
                initialData={editingCollection}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                isUploading={uploadingImage}
              />
            </CardContent>
          </Card>
        </motion.div>
      ) : null}

      <motion.div variants={itemVariants}>
        <FeaturedCollectionList 
          collections={collections}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onPositionUpdate={handlePositionUpdate}
        />
      </motion.div>
    </motion.div>
  );
}

export default FeaturedCollectionsPage;
