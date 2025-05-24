const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Brand name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Brand name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  logo: {
    type: String,
    validate: {
      validator: function(v) {
        if (!v) return true; // Allow empty string
        try {
          new URL(v);
          return true;
        } catch {
          return false;
        }
      },
      message: 'Please provide a valid logo URL'
    }
  },
  website: {
    type: String,
    validate: {
      validator: function(v) {
        if (!v) return true; // Allow empty string
        try {
          new URL(v);
          return true;
        } catch {
          return false;
        }
      },
      message: 'Please provide a valid website URL'
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
  },
  metaTitle: {
    type: String,
    maxlength: [60, 'Meta title should be less than 60 characters for SEO']
  },
  metaDescription: {
    type: String,
    maxlength: [160, 'Meta description should be less than 160 characters for SEO']
  }
}, {
  timestamps: true
});

// Generate slug from name before saving
brandSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }
  next();
});

// Create indexes
brandSchema.index({ name: 1 });
brandSchema.index({ slug: 1 });
brandSchema.index({ isActive: 1 });
brandSchema.index({ sortOrder: 1 });

module.exports = mongoose.model('Brand', brandSchema); 