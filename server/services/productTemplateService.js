const ProductTemplate = require('../models/ProductTemplate');

class ProductTemplateService {
  // Get template for a specific category
  static async getTemplateForCategory(category, productType = 'physical') {
    try {
      return await ProductTemplate.getTemplateForCategory(category, productType);
    } catch (error) {
      console.error('Error getting template for category:', error);
      return null;
    }
  }

  // Get field requirements for a category (with fallback to defaults)
  static async getFieldRequirements(category, productType = 'physical') {
    const template = await this.getTemplateForCategory(category, productType);
    
    if (template) {
      return template.standardFieldRequirements;
    }
    
    // Fallback to smart defaults based on category
    return this.getDefaultFieldRequirements(category);
  }

  // Get custom fields for a category
  static async getCustomFields(category, productType = 'physical') {
    const template = await this.getTemplateForCategory(category, productType);
    
    if (template) {
      return template.customFields || [];
    }
    
    return [];
  }

  // Smart defaults based on category analysis
  static getDefaultFieldRequirements(category) {
    const categoryLower = category.toLowerCase();
    
    // Categories that typically need sizes
    const sizeCategories = ['men', 'women', 'kids', 'footwear', 'clothing'];
    const needsSizes = sizeCategories.some(cat => categoryLower.includes(cat));
    
    // Categories that typically need gender targeting
    const genderCategories = ['men', 'women', 'kids', 'clothing'];
    const needsGender = genderCategories.some(cat => categoryLower.includes(cat));
    
    // Categories that typically need brands
    const brandCategories = ['men', 'women', 'kids', 'devices', 'footwear', 'clothing'];
    const needsBrand = brandCategories.some(cat => categoryLower.includes(cat)) || categoryLower !== 'accessories';
    
    // Categories that need physical dimensions
    const physicalCategories = ['devices', 'furniture', 'appliances'];
    const needsDimensions = physicalCategories.some(cat => categoryLower.includes(cat));
    
    return {
      sizes: needsSizes,
      colors: !['services', 'digital', 'subscriptions'].includes(categoryLower),
      brand: needsBrand,
      gender: needsGender,
      weight: needsDimensions,
      dimensions: needsDimensions
    };
  }

  // Create default templates for common product types
  static async createDefaultTemplates(adminId) {
    const templates = [
      // Electronics/Devices Template
      {
        name: 'Electronics & Devices',
        description: 'Template for electronic devices, smartphones, laptops, etc.',
        applicableCategories: ['devices', 'electronics'],
        standardFieldRequirements: {
          sizes: false,
          colors: true,
          brand: true,
          gender: false,
          weight: true,
          dimensions: true
        },
        customFields: [
          {
            name: 'model',
            label: 'Model Number',
            fieldType: 'text',
            placeholder: 'Enter model number',
            required: true,
            sortOrder: 1
          },
          {
            name: 'warranty',
            label: 'Warranty Period',
            fieldType: 'select',
            required: true,
            options: [
              { id: '6months', label: '6 Months', value: '6 months' },
              { id: '1year', label: '1 Year', value: '1 year' },
              { id: '2years', label: '2 Years', value: '2 years' },
              { id: '3years', label: '3 Years', value: '3 years' }
            ],
            sortOrder: 2
          },
          {
            name: 'specifications',
            label: 'Technical Specifications',
            fieldType: 'textarea',
            placeholder: 'Enter detailed specifications',
            required: false,
            sortOrder: 3
          },
          {
            name: 'powerRequirements',
            label: 'Power Requirements',
            fieldType: 'text',
            placeholder: 'e.g., 220V, USB-C charging',
            required: false,
            sortOrder: 4
          }
        ],
        productType: 'physical',
        priority: 10,
        examples: ['iPhone 15', 'MacBook Pro', 'Samsung Galaxy', 'Gaming Laptop'],
        createdBy: adminId
      },

      // Books Template
      {
        name: 'Books & Publications',
        description: 'Template for books, magazines, and publications',
        applicableCategories: ['books', 'education', 'literature'],
        standardFieldRequirements: {
          sizes: false,
          colors: false,
          brand: false,
          gender: false,
          weight: true,
          dimensions: true
        },
        customFields: [
          {
            name: 'isbn',
            label: 'ISBN',
            fieldType: 'text',
            placeholder: 'Enter ISBN number',
            required: false,
            validation: { pattern: '^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$' },
            sortOrder: 1
          },
          {
            name: 'author',
            label: 'Author(s)',
            fieldType: 'text',
            placeholder: 'Enter author name(s)',
            required: true,
            sortOrder: 2
          },
          {
            name: 'publisher',
            label: 'Publisher',
            fieldType: 'text',
            placeholder: 'Enter publisher name',
            required: true,
            sortOrder: 3
          },
          {
            name: 'publicationDate',
            label: 'Publication Date',
            fieldType: 'date',
            required: false,
            sortOrder: 4
          },
          {
            name: 'pages',
            label: 'Number of Pages',
            fieldType: 'number',
            placeholder: 'Enter page count',
            required: false,
            validation: { min: 1 },
            sortOrder: 5
          },
          {
            name: 'language',
            label: 'Language',
            fieldType: 'select',
            required: true,
            options: [
              { id: 'english', label: 'English', value: 'English' },
              { id: 'spanish', label: 'Spanish', value: 'Spanish' },
              { id: 'french', label: 'French', value: 'French' },
              { id: 'german', label: 'German', value: 'German' },
              { id: 'other', label: 'Other', value: 'Other' }
            ],
            sortOrder: 6
          },
          {
            name: 'format',
            label: 'Format',
            fieldType: 'select',
            required: true,
            options: [
              { id: 'hardcover', label: 'Hardcover', value: 'Hardcover' },
              { id: 'paperback', label: 'Paperback', value: 'Paperback' },
              { id: 'ebook', label: 'E-book', value: 'E-book' },
              { id: 'audiobook', label: 'Audiobook', value: 'Audiobook' }
            ],
            sortOrder: 7
          }
        ],
        productType: 'physical',
        priority: 10,
        examples: ['The Great Gatsby', 'Programming Guide', 'Children\'s Storybook'],
        createdBy: adminId
      },

      // Food & Beverage Template
      {
        name: 'Food & Beverages',
        description: 'Template for food items, snacks, beverages, etc.',
        applicableCategories: ['food', 'beverages', 'snacks', 'grocery'],
        standardFieldRequirements: {
          sizes: true, // For different package sizes
          colors: false,
          brand: true,
          gender: false,
          weight: true,
          dimensions: false
        },
        customFields: [
          {
            name: 'ingredients',
            label: 'Ingredients',
            fieldType: 'textarea',
            placeholder: 'List all ingredients',
            required: true,
            sortOrder: 1
          },
          {
            name: 'allergens',
            label: 'Allergen Information',
            fieldType: 'multiselect',
            required: true,
            options: [
              { id: 'nuts', label: 'Nuts', value: 'Nuts' },
              { id: 'dairy', label: 'Dairy', value: 'Dairy' },
              { id: 'gluten', label: 'Gluten', value: 'Gluten' },
              { id: 'soy', label: 'Soy', value: 'Soy' },
              { id: 'eggs', label: 'Eggs', value: 'Eggs' },
              { id: 'none', label: 'None', value: 'None' }
            ],
            sortOrder: 2
          },
          {
            name: 'expiryDate',
            label: 'Best Before Date',
            fieldType: 'date',
            required: true,
            sortOrder: 3
          },
          {
            name: 'nutritionalInfo',
            label: 'Nutritional Information',
            fieldType: 'textarea',
            placeholder: 'Calories, protein, carbs, etc.',
            required: false,
            sortOrder: 4
          },
          {
            name: 'storageInstructions',
            label: 'Storage Instructions',
            fieldType: 'textarea',
            placeholder: 'How to store this product',
            required: false,
            sortOrder: 5
          },
          {
            name: 'origin',
            label: 'Country of Origin',
            fieldType: 'text',
            placeholder: 'Enter country of origin',
            required: false,
            sortOrder: 6
          }
        ],
        productType: 'physical',
        priority: 10,
        examples: ['Organic Honey', 'Artisan Bread', 'Premium Coffee', 'Energy Drink'],
        createdBy: adminId
      },

      // Digital Products Template
      {
        name: 'Digital Products',
        description: 'Template for software, apps, digital downloads, etc.',
        applicableCategories: ['software', 'digital', 'apps'],
        standardFieldRequirements: {
          sizes: false,
          colors: false,
          brand: true,
          gender: false,
          weight: false,
          dimensions: false
        },
        customFields: [
          {
            name: 'version',
            label: 'Version',
            fieldType: 'text',
            placeholder: 'e.g., v2.1.0',
            required: true,
            sortOrder: 1
          },
          {
            name: 'compatibility',
            label: 'System Requirements',
            fieldType: 'textarea',
            placeholder: 'List compatible systems/devices',
            required: true,
            sortOrder: 2
          },
          {
            name: 'licenseType',
            label: 'License Type',
            fieldType: 'select',
            required: true,
            options: [
              { id: 'single', label: 'Single User', value: 'Single User' },
              { id: 'family', label: 'Family Pack (5 users)', value: 'Family Pack' },
              { id: 'business', label: 'Business License', value: 'Business License' },
              { id: 'enterprise', label: 'Enterprise License', value: 'Enterprise License' }
            ],
            sortOrder: 3
          },
          {
            name: 'downloadSize',
            label: 'Download Size',
            fieldType: 'text',
            placeholder: 'e.g., 2.5 GB',
            required: false,
            sortOrder: 4
          },
          {
            name: 'supportPeriod',
            label: 'Support Period',
            fieldType: 'select',
            required: true,
            options: [
              { id: '6months', label: '6 Months', value: '6 months' },
              { id: '1year', label: '1 Year', value: '1 year' },
              { id: '2years', label: '2 Years', value: '2 years' },
              { id: 'lifetime', label: 'Lifetime', value: 'lifetime' }
            ],
            sortOrder: 5
          }
        ],
        productType: 'digital',
        priority: 10,
        examples: ['Photo Editor Pro', 'Business Software', 'Mobile App', 'Online Course'],
        createdBy: adminId
      },

      // Services Template
      {
        name: 'Services',
        description: 'Template for service offerings, consultations, etc.',
        applicableCategories: ['services', 'consulting', 'professional'],
        standardFieldRequirements: {
          sizes: false,
          colors: false,
          brand: false,
          gender: false,
          weight: false,
          dimensions: false
        },
        customFields: [
          {
            name: 'duration',
            label: 'Service Duration',
            fieldType: 'text',
            placeholder: 'e.g., 2 hours, 1 week',
            required: true,
            sortOrder: 1
          },
          {
            name: 'deliveryMethod',
            label: 'Delivery Method',
            fieldType: 'select',
            required: true,
            options: [
              { id: 'remote', label: 'Remote/Online', value: 'Remote' },
              { id: 'onsite', label: 'On-site', value: 'On-site' },
              { id: 'hybrid', label: 'Hybrid', value: 'Hybrid' }
            ],
            sortOrder: 2
          },
          {
            name: 'availability',
            label: 'Availability',
            fieldType: 'textarea',
            placeholder: 'Describe when this service is available',
            required: false,
            sortOrder: 3
          },
          {
            name: 'qualifications',
            label: 'Provider Qualifications',
            fieldType: 'textarea',
            placeholder: 'List relevant qualifications/certifications',
            required: false,
            sortOrder: 4
          },
          {
            name: 'includesFollowup',
            label: 'Includes Follow-up',
            fieldType: 'boolean',
            required: false,
            defaultValue: false,
            sortOrder: 5
          }
        ],
        productType: 'service',
        priority: 10,
        examples: ['Web Design', 'Business Consultation', 'Logo Design', 'SEO Audit'],
        createdBy: adminId
      }
    ];

    try {
      // Only create templates that don't already exist
      for (const template of templates) {
        const existing = await ProductTemplate.findOne({ 
          name: template.name,
          applicableCategories: { $in: template.applicableCategories }
        });
        
        if (!existing) {
          await ProductTemplate.create(template);
          console.log(`✅ Created template: ${template.name}`);
        } else {
          console.log(`⚠️ Template already exists: ${template.name}`);
        }
      }
      
      return { success: true, message: 'Default templates created successfully' };
    } catch (error) {
      console.error('Error creating default templates:', error);
      return { success: false, error: error.message };
    }
  }

  // Get enhanced form configuration based on category
  static async getEnhancedFormConfig(category, productType = 'physical') {
    const fieldRequirements = await this.getFieldRequirements(category, productType);
    const customFields = await this.getCustomFields(category, productType);
    
    return {
      fieldRequirements,
      customFields,
      adaptedValidation: this.getAdaptedValidation(category, fieldRequirements)
    };
  }

  // Get adapted validation rules based on field requirements
  static getAdaptedValidation(category, fieldRequirements) {
    return {
      sizes: fieldRequirements.sizes,
      colors: fieldRequirements.colors,
      brand: fieldRequirements.brand,
      gender: fieldRequirements.gender,
      weight: fieldRequirements.weight,
      dimensions: fieldRequirements.dimensions
    };
  }
}

module.exports = ProductTemplateService; 