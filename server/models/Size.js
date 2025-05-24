const mongoose = require('mongoose');

const sizeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Size name is required'],
    trim: true,
    maxlength: [50, 'Size name cannot exceed 50 characters']
  },
  code: {
    type: String,
    required: [true, 'Size code is required'],
    trim: true,
    uppercase: true,
    maxlength: [20, 'Size code cannot exceed 20 characters']
  },
  category: {
    type: String,
    required: [true, 'Size category is required'],
    enum: {
      values: ['clothing', 'footwear', 'accessories', 'general'],
      message: 'Category must be one of: clothing, footwear, accessories, general'
    },
    default: 'general'
  },
  description: {
    type: String,
    maxlength: [300, 'Description cannot exceed 300 characters']
  },
  measurements: {
    chest: String,
    waist: String,
    hip: String,
    length: String,
    sleeve: String,
    // For footwear
    footLength: String,
    footWidth: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0,
    min: [0, 'Sort order must be a positive number']
  }
}, {
  timestamps: true
});

// Create compound index to ensure unique codes within each category
sizeSchema.index({ category: 1, code: 1 }, { unique: true });
sizeSchema.index({ category: 1, name: 1 }, { unique: true });
sizeSchema.index({ isActive: 1 });
sizeSchema.index({ sortOrder: 1 });

module.exports = mongoose.model('Size', sizeSchema); 