const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [100, 'Category name cannot exceed 100 characters']
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
  image: {
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
      message: 'Please provide a valid image URL'
    }
  },
  icon: {
    type: String,
    maxlength: [50, 'Icon cannot exceed 50 characters']
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
categorySchema.pre('save', function(next) {
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
categorySchema.index({ name: 1 });
categorySchema.index({ slug: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ sortOrder: 1 });

module.exports = mongoose.model('Category', categorySchema); 