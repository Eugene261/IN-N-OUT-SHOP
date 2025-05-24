const mongoose = require('mongoose');

const colorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Color name is required'],
    trim: true,
    maxlength: [50, 'Color name cannot exceed 50 characters']
  },
  code: {
    type: String,
    required: [true, 'Color code is required'],
    trim: true,
    uppercase: true,
    maxlength: [20, 'Color code cannot exceed 20 characters']
  },
  hexCode: {
    type: String,
    required: [true, 'Hex color code is required'],
    validate: {
      validator: function(v) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
      },
      message: 'Please provide a valid hex color code (e.g., #FF0000 or #F00)'
    }
  },
  rgbCode: {
    type: String,
    validate: {
      validator: function(v) {
        if (!v) return true; // Allow empty string
        return /^(\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})$/.test(v);
      },
      message: 'RGB code must be in format "255, 255, 255"'
    }
  },
  description: {
    type: String,
    maxlength: [300, 'Description cannot exceed 300 characters']
  },
  colorFamily: {
    type: String,
    required: [true, 'Color family is required'],
    enum: {
      values: ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown', 'black', 'white', 'gray'],
      message: 'Color family must be one of: red, blue, green, yellow, orange, purple, pink, brown, black, white, gray'
    }
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

// Convert hex to RGB before saving
colorSchema.pre('save', function(next) {
  if (this.isModified('hexCode') && this.hexCode) {
    const hex = this.hexCode.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    this.rgbCode = `${r}, ${g}, ${b}`;
  }
  next();
});

// Create compound index to ensure unique codes within each color family
colorSchema.index({ colorFamily: 1, code: 1 }, { unique: true });
colorSchema.index({ colorFamily: 1, name: 1 }, { unique: true });
colorSchema.index({ hexCode: 1 }, { unique: true });
colorSchema.index({ isActive: 1 });
colorSchema.index({ sortOrder: 1 });

module.exports = mongoose.model('Color', colorSchema); 