import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Button } from '../../components/ui/button';
import { Switch } from '../../components/ui/switch';
import { Loader2, Upload } from 'lucide-react';

function FeaturedCollectionForm({ initialData, onSubmit, onCancel, isUploading }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    linkTo: '/shop',
    position: 0,
    isActive: true,
    imageFile: null
  });
  
  const [imagePreview, setImagePreview] = useState('');
  
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        image: initialData.image || '',
        linkTo: initialData.linkTo || '/shop',
        position: initialData.position || 0,
        isActive: initialData.isActive !== undefined ? initialData.isActive : true,
        imageFile: null
      });
      
      setImagePreview(initialData.image || '');
    }
  }, [initialData]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSwitchChange = (checked) => {
    setFormData(prev => ({ ...prev, isActive: checked }));
  };
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, imageFile: file }));
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };
  
  return (
    <motion.form 
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Collection Title"
            required
          />
        </div>
        
        <div className="grid gap-3">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Collection Description"
            rows={3}
          />
        </div>
        
        <div className="grid gap-3">
          <Label htmlFor="linkTo">Link URL</Label>
          <Input
            id="linkTo"
            name="linkTo"
            value={formData.linkTo}
            onChange={handleChange}
            placeholder="/shop/category/example"
          />
          <p className="text-sm text-gray-500">
            Where users will go when they click on this collection
          </p>
        </div>
        
        <div className="grid gap-3">
          <Label htmlFor="position">Display Order</Label>
          <Input
            id="position"
            name="position"
            type="number"
            value={formData.position}
            onChange={handleChange}
            min={0}
          />
          <p className="text-sm text-gray-500">
            Collections are displayed in ascending order (0 first)
          </p>
        </div>
        
        <div className="grid gap-3">
          <Label htmlFor="image">Collection Image *</Label>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative border border-gray-200 rounded-md p-2">
                <input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex items-center justify-center h-12 gap-2 text-gray-500">
                  <Upload className="h-5 w-5" />
                  <span>Click to upload or drag and drop</span>
                </div>
              </div>
            </div>
            
            {imagePreview && (
              <div className="w-20 h-20 relative overflow-hidden rounded-md border border-gray-200">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
          {!initialData && !imagePreview && (
            <p className="text-sm text-red-500">
              Image is required for new collections
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={handleSwitchChange}
          />
          <Label htmlFor="isActive">Active (visible on homepage)</Label>
        </div>
        
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isUploading || (!initialData && !formData.imageFile && !formData.image)}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              'Save Collection'
            )}
          </Button>
        </div>
      </div>
    </motion.form>
  );
}

export default FeaturedCollectionForm;
