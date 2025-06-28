const mongoose = require('mongoose');

// Define different field types that can be used in product templates
const fieldTypeEnum = [
  'text',
  'number', 
  'select',
  'multiselect',
  'textarea',
  'date',
  'boolean',
  'url',
  'email',
  'tel'
];

const customFieldSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  label: {
    type: String,
    required: true,
    trim: true
  },
  fieldType: {
    type: String,
    enum: fieldTypeEnum,
    required: true
  },
  placeholder: String,
  helpText: String,
  required: {
    type: Boolean,
    default: false
  },
  options: [{
    id: String,
    label: String,
    value: String
  }], // For select/multiselect fields
  validation: {
    min: Number,
    max: Number,
    minLength: Number,
    maxLength: Number,
    pattern: String // Regular expression pattern
  },
  defaultValue: mongoose.Schema.Types.Mixed,
  sortOrder: {
    type: Number,
    default: 0
  }
});

const ProductTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  
  // Which categories this template applies to
  applicableCategories: [{
    type: String,
    required: true
  }],
  
  // Which standard fields are required/optional for this template
  standardFieldRequirements: {
    sizes: { type: Boolean, default: false },
    colors: { type: Boolean, default: true },
    brand: { type: Boolean, default: true },
    gender: { type: Boolean, default: false },
    weight: { type: Boolean, default: false },
    dimensions: { type: Boolean, default: false }
  },
  
  // Custom fields specific to this product type
  customFields: [customFieldSchema],
  
  // Product type this template is for
  productType: {
    type: String,
    enum: ['physical', 'digital', 'service', 'subscription', 'bundle'],
    default: 'physical'
  },
  
  // Template metadata
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Priority for template selection (higher = preferred)
  priority: {
    type: Number,
    default: 0
  },
  
  // Examples of products that use this template
  examples: [String],
  
  // Created by (SuperAdmin)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { 
  timestamps: true 
});

// Indexes for efficient queries
ProductTemplateSchema.index({ applicableCategories: 1, isActive: 1 });
ProductTemplateSchema.index({ productType: 1, isActive: 1 });

// Static method to get template for a category
ProductTemplateSchema.statics.getTemplateForCategory = function(category, productType = 'physical') {
  return this.findOne({
    applicableCategories: category,
    productType: productType,
    isActive: true
  }).sort({ priority: -1 }); // Get highest priority template
};

// Static method to get all templates for category selection
ProductTemplateSchema.statics.getTemplatesForCategory = function(category) {
  return this.find({
    applicableCategories: category,
    isActive: true
  }).sort({ priority: -1, name: 1 });
};

module.exports = mongoose.model('ProductTemplate', ProductTemplateSchema); 